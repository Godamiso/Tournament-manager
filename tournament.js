// ============================================
// STATE MANAGEMENT
// ============================================
let tournament = null;
let currentMatch = null;

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    loadTournament();
    renderTournament();
});

// ============================================
// LOAD TOURNAMENT DATA
// ============================================
function loadTournament() {
    const saved = localStorage.getItem('currentTournament');
    if (saved) {
        tournament = JSON.parse(saved);
    }
}

function saveTournament() {
    if (tournament) {
        localStorage.setItem('currentTournament', JSON.stringify(tournament));
    }
}

// ============================================
// RENDER TOURNAMENT
// ============================================
function renderTournament() {
    const noTournamentState = document.getElementById('no-tournament-state');
    const tournamentBracket = document.getElementById('tournament-bracket');
    const tournamentTitle = document.getElementById('tournament-title');

    if (!tournament || !tournament.matches || tournament.matches.length === 0) {
        noTournamentState.style.display = 'block';
        tournamentBracket.style.display = 'none';
        return;
    }

    noTournamentState.style.display = 'none';
    tournamentBracket.style.display = 'block';
    tournamentTitle.textContent = `🏆 ${tournament.name}`;

    renderClassicBracket();
}

// ============================================
// CLASSIC BRACKET RENDERING
// ============================================
function renderClassicBracket() {
    const bracket = document.getElementById('tournament-bracket');

    // Group matches by round
    const rounds = {};
    tournament.matches.forEach(match => {
        if (!rounds[match.round]) {
            rounds[match.round] = [];
        }
        rounds[match.round].push(match);
    });

    const roundOrder = ['Round of 16', 'Quarter-Final', 'Semi-Final', 'Final'];
    const availableRounds = roundOrder.filter(round => rounds[round]);

    let html = '<div class="bracket-wrapper"><div class="bracket-grid">';

    // Render each round
    availableRounds.forEach((roundName, roundIndex) => {
        html += renderRound(roundName, rounds[roundName]);
    });

    // Add winner column if final is played
    const finalMatch = rounds['Final'] ? rounds['Final'][0] : null;
    if (finalMatch && finalMatch.played && finalMatch.winner) {
        html += renderWinnerColumn(finalMatch.winner);
    }

    html += '</div></div>';
    bracket.innerHTML = html;
}

// ============================================
// RENDER ROUND
// ============================================
function renderRound(roundName, matches) {
    let html = '<div class="bracket-round">';
    html += `<div class="round-header">${roundName}</div>`;

    matches.forEach((match, index) => {
        const matchIndex = tournament.matches.indexOf(match);
        const isCompleted = match.played ? 'completed' : '';

        html += `<div class="match-group ${isCompleted}" onclick="openMatchModal(${matchIndex})">`;
        html += `<div class="match-label">${index + 1}</div>`;

        // Team 1
        const team1Winner = match.winner === match.team1 ? 'winner' : (match.played ? 'loser' : '');
        const score1 = match.score1 !== null ? match.score1 : '';
        html += `
            <div class="team-slot ${team1Winner}">
                <span class="team-name">${match.team1}</span>
                <span class="team-score">${score1}</span>
            </div>
        `;

        // Team 2
        const team2Winner = match.winner === match.team2 ? 'winner' : (match.played ? 'loser' : '');
        const score2 = match.score2 !== null ? match.score2 : '';
        html += `
            <div class="team-slot ${team2Winner}">
                <span class="team-name">${match.team2}</span>
                <span class="team-score">${score2}</span>
            </div>
        `;

        html += '</div>';
    });

    html += '</div>';
    return html;
}

// ============================================
// RENDER WINNER COLUMN
// ============================================
function renderWinnerColumn(winnerName) {
    return `
        <div class="winner-display">
            <div class="winner-header">Champion</div>
            <div class="champion-box">
                <div class="champion-trophy">🏆</div>
                <div class="champion-name">${winnerName}</div>
            </div>
        </div>
    `;
}

// ============================================
// MATCH MODAL
// ============================================
function openMatchModal(index) {
    currentMatch = tournament.matches[index];

    const modal = document.getElementById('match-modal');
    const team1Label = document.getElementById('team1-label');
    const team2Label = document.getElementById('team2-label');
    const team1Score = document.getElementById('team1-score');
    const team2Score = document.getElementById('team2-score');

    team1Label.textContent = currentMatch.team1;
    team2Label.textContent = currentMatch.team2;
    team1Score.value = currentMatch.score1 !== null ? currentMatch.score1 : '';
    team2Score.value = currentMatch.score2 !== null ? currentMatch.score2 : '';

    modal.classList.add('show');
}

function closeMatchModal() {
    const modal = document.getElementById('match-modal');
    modal.classList.remove('show');
    currentMatch = null;
}

function saveMatchResult() {
    if (!currentMatch) return;

    const team1Score = parseInt(document.getElementById('team1-score').value);
    const team2Score = parseInt(document.getElementById('team2-score').value);

    if (isNaN(team1Score) || isNaN(team2Score)) {
        alert('Please enter valid scores for both teams');
        return;
    }

    if (team1Score < 0 || team2Score < 0) {
        alert('Scores cannot be negative');
        return;
    }

    if (team1Score === team2Score) {
        alert('Knockout matches cannot end in a draw. Please enter a winner.');
        return;
    }

    // Update match
    currentMatch.score1 = team1Score;
    currentMatch.score2 = team2Score;
    currentMatch.winner = team1Score > team2Score ? currentMatch.team1 : currentMatch.team2;
    currentMatch.played = true;

    // Advance winner to next round
    advanceWinner(currentMatch);

    saveTournament();
    closeMatchModal();
    renderTournament();
}

// ============================================
// ADVANCE WINNER
// ============================================
function advanceWinner(match) {
    if (!match.winner) return;

    const roundProgression = {
        'Round of 16': 'Quarter-Final',
        'Quarter-Final': 'Semi-Final',
        'Semi-Final': 'Final'
    };

    const nextRound = roundProgression[match.round];
    if (!nextRound) return; // Already in final

    // Check if next round exists
    let nextRoundMatches = tournament.matches.filter(m => m.round === nextRound);

    if (nextRoundMatches.length === 0) {
        // Create next round if all current round matches are played
        const currentRoundMatches = tournament.matches.filter(m => m.round === match.round);
        const allPlayed = currentRoundMatches.every(m => m.played);

        if (allPlayed) {
            const winners = currentRoundMatches.map(m => m.winner);
            const newMatches = [];

            for (let i = 0; i < winners.length; i += 2) {
                newMatches.push({
                    round: nextRound,
                    matchNumber: (i / 2) + 1,
                    team1: winners[i],
                    team2: winners[i + 1],
                    score1: null,
                    score2: null,
                    winner: null,
                    played: false
                });
            }

            tournament.matches.push(...newMatches);
        }
    } else {
        // Update existing next round match with winner
        const matchPosition = Math.floor((match.matchNumber - 1) / 2);
        const nextMatch = nextRoundMatches[matchPosition];

        if (nextMatch) {
            if ((match.matchNumber - 1) % 2 === 0) {
                nextMatch.team1 = match.winner;
            } else {
                nextMatch.team2 = match.winner;
            }
        }
    }
}

// ============================================
// CLEAR TOURNAMENT
// ============================================
function clearTournament() {
    if (confirm('Are you sure you want to clear this tournament? This cannot be undone.')) {
        localStorage.removeItem('currentTournament');
        window.location.href = 'index.html';
    }
}

// Close modal when clicking outside
window.onclick = function (event) {
    const modal = document.getElementById('match-modal');
    if (event.target === modal) {
        closeMatchModal();
    }
}

// Make functions globally available
window.openMatchModal = openMatchModal;
window.closeMatchModal = closeMatchModal;
window.saveMatchResult = saveMatchResult;
window.clearTournament = clearTournament;
