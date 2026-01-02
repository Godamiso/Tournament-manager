// ============================================
// STATE MANAGEMENT
// ============================================
let league = null;
let currentFixtureIndex = null;
let currentFilter = 'all';

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    loadLeague();
    renderLeague();
});

// ============================================
// LOAD LEAGUE DATA
// ============================================
function loadLeague() {
    const saved = localStorage.getItem('currentLeague');
    if (saved) {
        league = JSON.parse(saved);
    }
}

function saveLeague() {
    if (league) {
        localStorage.setItem('currentLeague', JSON.stringify(league));
    }
}

// ============================================
// RENDER LEAGUE
// ============================================
function renderLeague() {
    const noLeagueState = document.getElementById('no-league-state');
    const leagueContent = document.getElementById('league-content');
    const leagueTitle = document.getElementById('league-title');

    if (!league || !league.fixtures || league.fixtures.length === 0) {
        noLeagueState.style.display = 'block';
        leagueContent.style.display = 'none';
        return;
    }

    noLeagueState.style.display = 'none';
    leagueContent.style.display = 'block';
    leagueTitle.textContent = `⚽ ${league.name}`;

    renderStandings();
    renderFixtures();
}

// ============================================
// STANDINGS TABLE
// ============================================
function renderStandings() {
    const standingsBody = document.getElementById('standings-body');

    // Sort standings by points, then goal difference, then goals for
    const sortedStandings = [...league.standings].sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
        return b.goalsFor - a.goalsFor;
    });

    standingsBody.innerHTML = sortedStandings.map((team, index) => {
        const gdClass = team.goalDifference > 0 ? 'goal-diff-positive' :
            team.goalDifference < 0 ? 'goal-diff-negative' : '';

        return `
            <tr>
                <td class="pos-col"><span class="position">${index + 1}</span></td>
                <td><span class="team-name-table">${team.team}</span></td>
                <td>${team.played}</td>
                <td>${team.won}</td>
                <td>${team.drawn}</td>
                <td>${team.lost}</td>
                <td>${team.goalsFor}</td>
                <td>${team.goalsAgainst}</td>
                <td class="${gdClass}">${team.goalDifference > 0 ? '+' : ''}${team.goalDifference}</td>
                <td class="points-cell">${team.points}</td>
            </tr>
        `;
    }).join('');

    // Check if league is complete
    const allFixturesPlayed = league.fixtures.every(f => f.played);
    if (allFixturesPlayed && sortedStandings.length > 0) {
        const champion = sortedStandings[0];
        const championDisplay = document.querySelector('.league-champion');

        if (!championDisplay) {
            const standingsSection = document.querySelector('.table-section');
            standingsSection.insertAdjacentHTML('beforeend', `
                <div class="league-champion">
                    <div class="champion-icon">🏆</div>
                    <div class="champion-title">League Champion</div>
                    <div class="champion-name">${champion.team}</div>
                </div>
            `);
        }
    }
}

// ============================================
// FIXTURES DISPLAY
// ============================================
function renderFixtures() {
    const fixturesContainer = document.getElementById('fixtures-container');

    // Filter fixtures
    let filteredFixtures = league.fixtures;
    if (currentFilter === 'upcoming') {
        filteredFixtures = league.fixtures.filter(f => !f.played);
    } else if (currentFilter === 'played') {
        filteredFixtures = league.fixtures.filter(f => f.played);
    }

    // Group by round
    const rounds = {};
    filteredFixtures.forEach(fixture => {
        if (!rounds[fixture.round]) {
            rounds[fixture.round] = [];
        }
        rounds[fixture.round].push(fixture);
    });

    if (Object.keys(rounds).length === 0) {
        fixturesContainer.innerHTML = '<p class="empty-state">No fixtures to display</p>';
        return;
    }

    // Render rounds
    let html = '';
    Object.keys(rounds).sort((a, b) => a - b).forEach(round => {
        html += `
            <div class="round-group">
                <div class="round-header">Matchweek ${round}</div>
        `;

        rounds[round].forEach((fixture, index) => {
            const fixtureIndex = league.fixtures.indexOf(fixture);
            const playedClass = fixture.played ? 'played' : '';

            let scoreDisplay = '';
            let statusBadge = '';

            if (fixture.played) {
                scoreDisplay = `
                    <div class="fixture-score">
                        <span class="score-display">${fixture.homeScore}</span>
                        <span class="score-separator">-</span>
                        <span class="score-display">${fixture.awayScore}</span>
                    </div>
                `;
                statusBadge = '<span class="status-badge status-played">Full Time</span>';
            } else {
                scoreDisplay = '<div class="fixture-score"><span class="score-separator">vs</span></div>';
                statusBadge = '<span class="status-badge status-upcoming">Upcoming</span>';
            }

            html += `
                <div class="fixture-card ${playedClass}" onclick="openFixtureModal(${fixtureIndex})">
                    <div class="fixture-teams">
                        <div class="fixture-home">${fixture.homeTeam}</div>
                        ${scoreDisplay}
                        <div class="fixture-away">${fixture.awayTeam}</div>
                    </div>
                    <div class="fixture-status">
                        ${statusBadge}
                    </div>
                </div>
            `;
        });

        html += '</div>';
    });

    fixturesContainer.innerHTML = html;
}

// ============================================
// FILTER FIXTURES
// ============================================
function filterFixtures(filter) {
    currentFilter = filter;

    // Update active button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    renderFixtures();
}

// ============================================
// FIXTURE MODAL
// ============================================
function openFixtureModal(index) {
    currentFixtureIndex = index;
    const fixture = league.fixtures[index];

    const modal = document.getElementById('fixture-modal');
    const homeLabel = document.getElementById('home-team-label');
    const awayLabel = document.getElementById('away-team-label');
    const homeScore = document.getElementById('home-score');
    const awayScore = document.getElementById('away-score');

    homeLabel.textContent = fixture.homeTeam;
    awayLabel.textContent = fixture.awayTeam;
    homeScore.value = fixture.homeScore !== null ? fixture.homeScore : '';
    awayScore.value = fixture.awayScore !== null ? fixture.awayScore : '';

    modal.classList.add('show');
}

function closeFixtureModal() {
    const modal = document.getElementById('fixture-modal');
    modal.classList.remove('show');
    currentFixtureIndex = null;
}

function saveFixtureResult() {
    if (currentFixtureIndex === null) return;

    const fixture = league.fixtures[currentFixtureIndex];
    const homeScore = parseInt(document.getElementById('home-score').value);
    const awayScore = parseInt(document.getElementById('away-score').value);

    if (isNaN(homeScore) || isNaN(awayScore)) {
        alert('Please enter valid scores for both teams');
        return;
    }

    if (homeScore < 0 || awayScore < 0) {
        alert('Scores cannot be negative');
        return;
    }

    // Check if fixture was already played (need to remove old stats)
    if (fixture.played) {
        removeFixtureFromStandings(fixture);
    }

    // Update fixture
    fixture.homeScore = homeScore;
    fixture.awayScore = awayScore;
    fixture.played = true;

    // Update standings
    updateStandings(fixture);

    saveLeague();
    closeFixtureModal();
    renderLeague();
}

// ============================================
// UPDATE STANDINGS
// ============================================
function updateStandings(fixture) {
    const homeTeam = league.standings.find(t => t.team === fixture.homeTeam);
    const awayTeam = league.standings.find(t => t.team === fixture.awayTeam);

    if (!homeTeam || !awayTeam) return;

    // Update matches played
    homeTeam.played++;
    awayTeam.played++;

    // Update goals
    homeTeam.goalsFor += fixture.homeScore;
    homeTeam.goalsAgainst += fixture.awayScore;
    awayTeam.goalsFor += fixture.awayScore;
    awayTeam.goalsAgainst += fixture.homeScore;

    // Calculate goal difference
    homeTeam.goalDifference = homeTeam.goalsFor - homeTeam.goalsAgainst;
    awayTeam.goalDifference = awayTeam.goalsFor - awayTeam.goalsAgainst;

    // Determine result and update stats
    if (fixture.homeScore > fixture.awayScore) {
        // Home win
        homeTeam.won++;
        homeTeam.points += 3;
        awayTeam.lost++;
    } else if (fixture.homeScore < fixture.awayScore) {
        // Away win
        awayTeam.won++;
        awayTeam.points += 3;
        homeTeam.lost++;
    } else {
        // Draw
        homeTeam.drawn++;
        awayTeam.drawn++;
        homeTeam.points++;
        awayTeam.points++;
    }
}

function removeFixtureFromStandings(fixture) {
    const homeTeam = league.standings.find(t => t.team === fixture.homeTeam);
    const awayTeam = league.standings.find(t => t.team === fixture.awayTeam);

    if (!homeTeam || !awayTeam) return;

    // Remove matches played
    homeTeam.played--;
    awayTeam.played--;

    // Remove goals
    homeTeam.goalsFor -= fixture.homeScore;
    homeTeam.goalsAgainst -= fixture.awayScore;
    awayTeam.goalsFor -= fixture.awayScore;
    awayTeam.goalsAgainst -= fixture.homeScore;

    // Recalculate goal difference
    homeTeam.goalDifference = homeTeam.goalsFor - homeTeam.goalsAgainst;
    awayTeam.goalDifference = awayTeam.goalsFor - awayTeam.goalsAgainst;

    // Remove result points
    if (fixture.homeScore > fixture.awayScore) {
        homeTeam.won--;
        homeTeam.points -= 3;
        awayTeam.lost--;
    } else if (fixture.homeScore < fixture.awayScore) {
        awayTeam.won--;
        awayTeam.points -= 3;
        homeTeam.lost--;
    } else {
        homeTeam.drawn--;
        awayTeam.drawn--;
        homeTeam.points--;
        awayTeam.points--;
    }
}

// ============================================
// CLEAR LEAGUE
// ============================================
function clearLeague() {
    if (confirm('Are you sure you want to clear this league? This cannot be undone.')) {
        localStorage.removeItem('currentLeague');
        window.location.href = 'index.html';
    }
}

// Close modal when clicking outside
window.onclick = function (event) {
    const modal = document.getElementById('fixture-modal');
    if (event.target === modal) {
        closeFixtureModal();
    }
}

// Make functions globally available
window.openFixtureModal = openFixtureModal;
window.closeFixtureModal = closeFixtureModal;
window.saveFixtureResult = saveFixtureResult;
window.clearLeague = clearLeague;
window.filterFixtures = filterFixtures;
