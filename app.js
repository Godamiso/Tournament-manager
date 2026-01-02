// ============================================
// STATE MANAGEMENT
// ============================================
let teams = [];
let selectedFormat = null;

// ============================================
// DOM ELEMENTS
// ============================================
const teamNameInput = document.getElementById('team-name-input');
const addTeamBtn = document.getElementById('add-team-btn');
const teamsList = document.getElementById('teams-list');
const teamCounter = document.getElementById('team-counter');
const tournamentOption = document.getElementById('tournament-option');
const leagueOption = document.getElementById('league-option');
const createTournamentBtn = document.getElementById('create-tournament-btn');
const createLeagueBtn = document.getElementById('create-league-btn');

// Stats
const tournamentCount = document.getElementById('tournament-count');
const leagueCount = document.getElementById('league-count');
const teamCount = document.getElementById('team-count');

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    loadTeams();
    updateStats();
    updateUIState();
});

// ============================================
// EVENT LISTENERS
// ============================================
addTeamBtn.addEventListener('click', addTeam);
teamNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTeam();
});

tournamentOption.addEventListener('click', () => selectFormat('tournament'));
leagueOption.addEventListener('click', () => selectFormat('league'));

createTournamentBtn.addEventListener('click', createTournament);
createLeagueBtn.addEventListener('click', createLeague);

// ============================================
// TEAM MANAGEMENT
// ============================================
function addTeam() {
    const teamName = teamNameInput.value.trim();

    if (!teamName) {
        alert('Please enter a team name');
        return;
    }

    if (teams.includes(teamName)) {
        alert('This team already exists');
        return;
    }

    teams.push(teamName);
    teamNameInput.value = '';
    teamNameInput.focus();

    saveTeams();
    renderTeams();
    updateUIState();
    updateStats();
}

function removeTeam(index) {
    teams.splice(index, 1);
    saveTeams();
    renderTeams();
    updateUIState();
    updateStats();
}

function renderTeams() {
    if (teams.length === 0) {
        teamsList.innerHTML = '<p class="empty-state">No teams added yet. Start by adding your first team!</p>';
        return;
    }

    teamsList.innerHTML = teams.map((team, index) => `
        <div class="team-item">
            <div class="team-info">
                <div class="team-number">${index + 1}</div>
                <div class="team-name">${team}</div>
            </div>
            <button class="btn btn-danger btn-small" onclick="removeTeam(${index})">×</button>
        </div>
    `).join('');
}

// ============================================
// FORMAT SELECTION
// ============================================
function selectFormat(format) {
    selectedFormat = format;

    // Update visual selection
    tournamentOption.classList.remove('selected');
    leagueOption.classList.remove('selected');

    if (format === 'tournament') {
        tournamentOption.classList.add('selected');
    } else {
        leagueOption.classList.add('selected');
    }

    updateUIState();
}

// ============================================
// UI STATE MANAGEMENT
// ============================================
function updateUIState() {
    teamCounter.textContent = `${teams.length} team${teams.length !== 1 ? 's' : ''}`;

    // Enable/disable create buttons
    const canCreateTournament = teams.length >= 2 && isPowerOfTwo(teams.length);
    const canCreateLeague = teams.length >= 2;

    createTournamentBtn.disabled = !canCreateTournament || selectedFormat !== 'tournament';
    createLeagueBtn.disabled = !canCreateLeague || selectedFormat !== 'league';

    // Update tournament option badge
    if (!isPowerOfTwo(teams.length) && teams.length > 0) {
        const badge = tournamentOption.querySelector('.format-badge');
        badge.textContent = `Need 4, 8, or 16 teams (currently ${teams.length})`;
        badge.style.background = '#dc2626';
    } else {
        const badge = tournamentOption.querySelector('.format-badge');
        badge.textContent = 'Best for 4, 8, 16 teams';
        badge.style.background = '';
    }
}

function isPowerOfTwo(n) {
    return n > 0 && (n & (n - 1)) === 0 && [2, 4, 8, 16, 32].includes(n);
}

// ============================================
// CREATE COMPETITION
// ============================================
function createTournament() {
    console.log('createTournament called');
    console.log('Teams:', teams);
    console.log('Selected format:', selectedFormat);

    if (teams.length < 2 || !isPowerOfTwo(teams.length)) {
        alert('Tournament requires 2, 4, 8, or 16 teams');
        return;
    }

    // Try prompt, but use auto-generated name if blocked or cancelled
    let tournamentName;
    try {
        tournamentName = prompt('Enter tournament name:');
    } catch (e) {
        console.log('Prompt blocked, using default name');
    }

    // Use default name if prompt was blocked or user cancelled
    if (!tournamentName) {
        tournamentName = `Tournament ${new Date().toLocaleDateString()}`;
    }

    console.log('Tournament name:', tournamentName);

    // Save tournament data
    const tournament = {
        name: tournamentName,
        teams: [...teams],
        type: 'tournament',
        createdAt: new Date().toISOString(),
        matches: generateKnockoutMatches(teams)
    };

    console.log('Tournament created:', tournament);
    saveTournament(tournament);

    // Clear teams and redirect
    teams = [];
    saveTeams();
    console.log('Redirecting to tournament.html...');
    window.location.href = 'tournament.html';
}

function createLeague() {
    console.log('createLeague called');
    console.log('Teams:', teams);
    console.log('Selected format:', selectedFormat);

    if (teams.length < 2) {
        alert('League requires at least 2 teams');
        return;
    }

    // Try prompt, but use auto-generated name if blocked or cancelled
    let leagueName;
    try {
        leagueName = prompt('Enter league name:');
    } catch (e) {
        console.log('Prompt blocked, using default name');
    }

    // Use default name if prompt was blocked or user cancelled
    if (!leagueName) {
        leagueName = `League ${new Date().toLocaleDateString()}`;
    }

    console.log('League name:', leagueName);

    // Save league data
    const league = {
        name: leagueName,
        teams: [...teams],
        type: 'league',
        createdAt: new Date().toISOString(),
        fixtures: generateLeagueFixtures(teams),
        standings: initializeStandings(teams)
    };

    console.log('League created:', league);
    saveLeague(league);

    // Clear teams and redirect
    teams = [];
    saveTeams();
    console.log('Redirecting to league.html...');
    window.location.href = 'league.html';
}

// ============================================
// FIXTURE GENERATION
// ============================================
function generateKnockoutMatches(teams) {
    const shuffled = [...teams].sort(() => Math.random() - 0.5);
    const matches = [];

    for (let i = 0; i < shuffled.length; i += 2) {
        matches.push({
            round: getRoundName(shuffled.length),
            matchNumber: (i / 2) + 1,
            team1: shuffled[i],
            team2: shuffled[i + 1],
            score1: null,
            score2: null,
            winner: null,
            played: false
        });
    }

    return matches;
}

function getRoundName(totalTeams) {
    const names = {
        2: 'Final',
        4: 'Semi-Final',
        8: 'Quarter-Final',
        16: 'Round of 16'
    };
    return names[totalTeams] || 'Round 1';
}

function generateLeagueFixtures(teams) {
    const fixtures = [];
    let teamsList = [...teams];
    const n = teamsList.length;

    // Handle odd number of teams by adding a dummy team
    const isOdd = n % 2 !== 0;
    if (isOdd) {
        teamsList.push(null); // null represents a "bye" week
    }

    const totalTeams = teamsList.length;
    const rounds = (totalTeams - 1) * 2; // Home and away

    // Round-robin algorithm
    for (let round = 0; round < rounds; round++) {
        const roundNum = round + 1;

        for (let match = 0; match < totalTeams / 2; match++) {
            let home = (round + match) % (totalTeams - 1);
            let away = (totalTeams - 1 - match + round) % (totalTeams - 1);

            // Last team stays in place
            if (match === 0) {
                away = totalTeams - 1;
            }

            // Swap home/away for second half of season
            if (round >= totalTeams - 1) {
                [home, away] = [away, home];
            }

            const homeTeam = teamsList[home];
            const awayTeam = teamsList[away];

            // Skip if either team is null (bye week)
            if (homeTeam !== null && awayTeam !== null) {
                fixtures.push({
                    round: roundNum,
                    matchNumber: fixtures.filter(f => f.round === roundNum).length + 1,
                    homeTeam: homeTeam,
                    awayTeam: awayTeam,
                    homeScore: null,
                    awayScore: null,
                    played: false
                });
            }
        }
    }

    return fixtures;
}

function initializeStandings(teams) {
    return teams.map(team => ({
        team: team,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0
    }));
}

// ============================================
// LOCAL STORAGE
// ============================================
function saveTeams() {
    localStorage.setItem('teams', JSON.stringify(teams));
}

function loadTeams() {
    const saved = localStorage.getItem('teams');
    if (saved) {
        teams = JSON.parse(saved);
        renderTeams();
    }
}

function saveTournament(tournament) {
    localStorage.setItem('currentTournament', JSON.stringify(tournament));

    // Update tournament count
    const count = parseInt(localStorage.getItem('tournamentCount') || '0');
    localStorage.setItem('tournamentCount', (count + 1).toString());
}

function saveLeague(league) {
    localStorage.setItem('currentLeague', JSON.stringify(league));

    // Update league count
    const count = parseInt(localStorage.getItem('leagueCount') || '0');
    localStorage.setItem('leagueCount', (count + 1).toString());
}

function updateStats() {
    const tCount = localStorage.getItem('tournamentCount') || '0';
    const lCount = localStorage.getItem('leagueCount') || '0';

    tournamentCount.textContent = tCount;
    leagueCount.textContent = lCount;
    teamCount.textContent = teams.length;
}

// Make functions globally available
window.removeTeam = removeTeam;
