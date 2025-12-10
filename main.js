import {
    STATS_CONFIG
} from './assets/stats_config.js';
import {
    PLAYER_NAMES
} from './assets/player_names.js';
import {
    AGGREGATE_CATEGORIES
} from './assets/aggregate_categories.js';

let allStats = [];
let userCache = {};
let currentSlide = 0;
let slides = [];
let currentSearchMode = 'player'; // 'player' or 'stat'
let currentFilter = 'all'; // 'all', 'players', 'bots'
let currentPlayer = null; // Currently selected player for stat search
let visitedSlides = new Set([0]); // Track which slides have been visited
let showPercentage = false; // Toggle for percentage display

// Load stats from assets folder
async function loadStats() {
    try {
        // Load usercache
        const cacheResponse = await fetch('assets/usercache.json');
        const cacheData = await cacheResponse.json();

        // Build user cache and get list of UUIDs
        const uuids = [];
        cacheData.forEach(entry => {
            userCache[entry.uuid] = entry.name;
            uuids.push(entry.uuid);
        });

        // Load all stat files based on UUIDs from usercache
        for (const uuid of uuids) {
            try {
                const response = await fetch(`assets/stats/${uuid}.json`);
                const data = await response.json();
                allStats.push({
                    uuid,
                    name: userCache[uuid] || uuid,
                    stats: data.stats || {}
                });
            } catch (err) {
                console.warn(`Could not load stats for ${uuid} (${userCache[uuid]}):`, err);
            }
        }

        if (allStats.length === 0) {
            throw new Error('No stats loaded. Check that stat files exist in assets/stats/');
        }

        generateSlides();
    } catch (error) {
        console.error('Error loading stats:', error);
        document.querySelector('.loading').textContent = 'Error loading stats: ' + error.message;
    }
}

function getStatValue(playerStats, statPath, aggregate = false) {
    const parts = statPath.split('.');
    let value = playerStats;

    for (const part of parts) {
        if (!value || typeof value !== 'object') return 0;
        value = value[part];
    }

    if (aggregate && value && typeof value === 'object') {
        return Object.values(value).reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0);
    }

    return typeof value === 'number' ? value : 0;
}

function formatValue(value, format) {
    if (format === 'time') {
        const hours = Math.floor(value / 72000);
        const minutes = Math.floor((value % 72000) / 1200);
        return `${hours}h ${minutes}m`;
    } else if (format === 'distance') {
        if (value < 100) {
            return `${value} cm`;
        } else if (value < 100000) {
            return `${Math.floor(value/10)/10} m`;
        } else {
            return `${Math.floor(value/1000)/100} km`
        }
    }
    return value.toLocaleString();
}

function generateLeaderboardSlide(config, index) {
    const isPlayer = (name) => PLAYER_NAMES.includes(name);

    const rankings = allStats
        .filter(p => {
            if (config.filterType === 'players') return isPlayer(p.name);
            if (config.filterType === 'bots') return !isPlayer(p.name);
            return true; // 'all'
        })
        .map(p => ({
            name: p.name,
            value: getStatValue(p.stats, config.stat, config.aggregate)
        }))
        .filter(p => p.value > 0)
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

    const bgClass = `slide-bg-${(index % 7) + 1}`;

    return `
                <div class="slide ${bgClass}">
                    <h1>${config.title}</h1>
                    <p class="subtitle">${config.subtitle?config.subtitle:''}</p>
                    <div class="leaderboard">
                        ${rankings.map((player, i) => `
                            <div class="leaderboard-item">
                                <div class="rank rank-${i + 1}">#${i + 1}</div>
                                <div class="player-name">${player.name}</div>
                                <div class="stat-value">${formatValue(player.value, config.format)}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
}

function generateCommunitySingleSlide(config, index) {
    const isPlayer = (name) => PLAYER_NAMES.includes(name);

    const total = allStats
        .filter(p => {
            if (config.filterType === 'players') return isPlayer(p.name);
            if (config.filterType === 'bots') return !isPlayer(p.name);
            return true; // 'all'
        })
        .reduce((sum, p) => sum + getStatValue(p.stats, config.stat, config.aggregate), 0);

    const bgClass = `slide-bg-${(index % 7) + 1}`;

    return `
                <div class="slide ${bgClass}">
                    <h1>${config.title}</h1>
                    <p class="subtitle">${config.subtitle?config.subtitle:''}</p>
                    <div class="stat-card" style="max-width: 600px; width: 100%;">
                        <div class="big-number">${formatValue(total, config.format)}</div>
                    </div>
                </div>
            `;
}

function generateCommunityMultiSlide(config, index) {
    const isPlayer = (name) => PLAYER_NAMES.includes(name);
    const bgClass = `slide-bg-${(index % 7) + 1}`;

    return `
                <div class="slide ${bgClass}">
                    <h1>${config.title}</h1>
                    <p class="subtitle">${config.subtitle?config.subtitle:''}</p>
                    <div class="community-stats">
                        ${config.stats.map(statConfig => {
                            const total = allStats
                            .filter(p => {
                                const isPlayer = (name) => PLAYER_NAMES.includes(name);
                                if (statConfig.filterType === 'players') return isPlayer(p.name);
                                if (statConfig.filterType === 'bots') return !isPlayer(p.name);
                                return true; // 'all'
                            })
                            .reduce((sum, p) => sum + getStatValue(p.stats, statConfig.stat, statConfig.aggregate), 0);
                            return `
                                        <div class="stat-card">
                                            <h3>${statConfig.title}</h3>
                                            <div class="big-number">${total.toLocaleString()}</div>
                                        </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
}

function generateQuizSlide(config, index) {
    const isPlayer = (name) => PLAYER_NAMES.includes(name);

    const rankings = allStats
        .filter(p => {
            if (config.filterType === 'players') return isPlayer(p.name);
            if (config.filterType === 'bots') return !isPlayer(p.name);
            return true; // 'all'
        })
        .map(p => ({
            name: p.name,
            value: getStatValue(p.stats, config.stat, config.aggregate)
        }))
        .filter(p => p.value > 0)
        .sort((a, b) => b.value - a.value);

    if (rankings.length === 0) return '';

    const correct = rankings[0].name;
    const correctValue = rankings[0].value;
    const options = [correct];

    while (options.length < 4 && options.length < rankings.length) {
        const random = rankings[Math.floor(Math.random() * Math.min(10, rankings.length))].name;
        if (!options.includes(random)) options.push(random);
    }

    options.sort(() => Math.random() - 0.5);

    const bgClass = `slide-bg-${(index % 7) + 1}`;

    // Store rankings data globally for this quiz
    const quizId = `quiz_${index}`;
    window[quizId] = rankings.slice(0, 5);

    return `
                <div class="slide ${bgClass}">
                    <div class="quiz-container">
                        <h2>${config.title}</h2>
                        <p class="subtitle">${config.subtitle?config.subtitle:''}</p>
                        <div class="quiz-options">
                            ${options.map(name => `
                                <div class="quiz-option" onclick="checkQuiz(this, '${correct.replace(/'/g, "\\'")}', '${name.replace(/'/g, "\\'")}', ${correctValue}, '${quizId}')">
                                    ${name}
                                </div>
                            `).join('')}
                        </div>
                        <div id="quizResult" class="quiz-result" style="display: none;"></div>
                    </div>
                </div>
            `;
}

function generateSearchSlide(config, index) {
    const bgClass = `slide-bg-${(index % 7) + 1}`;

    return `
                <div class="slide ${bgClass}" style="padding: 40px 60px;">
                    <h1 style="margin-bottom: 10px;">${config.title}</h1>
                    <p class="subtitle" style="margin-bottom: 30px;">${config.subtitle?config.subtitle:''}</p>
                    <div class="search-container">
                        <div class="search-mode-tabs">
                            <button class="mode-tab active" onclick="switchSearchMode('player')">Search Players</button>
                            <button class="mode-tab" onclick="switchSearchMode('stat')">Search Statistics</button>
                        </div>
                        <div class="search-header">
                            <input type="text" class="search-input" placeholder="Search username..." id="searchInput" oninput="performSearch()">
                            <div id="playerBadge" style="display: none;"></div>
                            <div class="filter-buttons" id="filterButtons" style="display: none;">
                                <button class="filter-btn active" onclick="setFilter('all')">All</button>
                                <button class="filter-btn" onclick="setFilter('players')">Players</button>
                                <button class="filter-btn" onclick="setFilter('bots')">Bots</button>
                            </div>
                        </div>
                        <div class="search-results" id="searchResults"></div>
                    </div>
                </div>
            `;
}

function generateSlides() {
    let html = '';

    STATS_CONFIG.forEach((config, index) => {
        switch (config.type) {
            case 'title':
                html += generateTitleSlide(config);
                break;
            case 'text':
                html += generateTextSlide(config, index);
                break;
            case 'leaderboard':
                html += generateLeaderboardSlide(config, index);
                break;
            case 'community-single':
                html += generateCommunitySingleSlide(config, index);
                break;
            case 'community-multi':
                html += generateCommunityMultiSlide(config, index);
                break;
            case 'quiz':
                html += generateQuizSlide(config, index);
                break;
            case 'search':
                html += generateSearchSlide(config, index);
                break;
        }
    });

    document.getElementById('slideContainer').innerHTML = html;
    slides = document.querySelectorAll('.slide');

    // Generate progress indicators
    const progressHtml = Array.from(slides).map((_, i) =>
        `<div class="progress-dot ${i === 0 ? 'active visited' : ''}" onclick="goToSlide(${i})" title="Slide ${i + 1}"></div>`
    ).join('');
    document.getElementById('progressIndicator').innerHTML = progressHtml;

    updateSlidePosition();
}

function generateTitleSlide(config) {
    return `
                <div class="slide slide-bg-1">
                    <h1 style="font-size: 5rem; margin-bottom: 30px;">${config.title}</h1>
                    <h2 style="font-size: 3rem;">${config.subtitle?config.subtitle:''}</h2>
                    <p class="subtitle" style="margin-top: 40px; font-size: 1.8rem;">${config.text}</p>
                </div>
            `;
}

function generateTextSlide(config, index) {
    const bgClass = `slide-bg-${(index % 7) + 1}`;
    return `
                <div class="slide ${bgClass}">
                    <h1 style="font-size: 4.5rem; margin-bottom: 20px;">${config.title}</h1>
                    ${config.subtitle ? `<p class="subtitle" style="font-size: 2.5rem;">${config.subtitle}</p>` : ''}
                </div>
            `;
}

function updateSlidePosition() {
    const container = document.getElementById('slideContainer');
    const previousSlide = currentSlide;

    visitedSlides.add(currentSlide);

    document.querySelectorAll('.progress-dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === currentSlide);
        dot.classList.toggle('visited', visitedSlides.has(i));
    });

    // Start the slide transition
    container.style.transform = `translateX(-${currentSlide * 100}vw)`;

    // Add slide-active to new slide immediately
    if (slides[currentSlide]) {
        slides[currentSlide].classList.add('slide-active');
    }

    // Remove slide-active from previous slides after transition completes
    setTimeout(() => {
        document.querySelectorAll('.slide').forEach((slide, i) => {
            if (i !== currentSlide) {
                slide.classList.remove('slide-active');
            }
        });
    }, 600); // Match the slide transition duration
}

function goToSlide(index) {
    // Only allow going to visited slides
    if (visitedSlides.has(index)) {
        currentSlide = index;
        updateSlidePosition();
    }
}

function nextSlide() {
    if (currentSlide < slides.length - 1) {
        currentSlide++;
        updateSlidePosition();
    }
}

function prevSlide() {
    if (currentSlide > 0) {
        currentSlide--;
        updateSlidePosition();
    }
}

function checkQuiz(element, correct, selected, correctValue, quizId) {
    const options = element.parentElement.querySelectorAll('.quiz-option');
    const resultDiv = element.closest('.quiz-container').querySelector('#quizResult');

    // Mark this quiz as answered
    element.closest('.slide').setAttribute('data-quiz-answered', 'true');

    // Disable all options
    options.forEach(opt => {
        opt.style.pointerEvents = 'none';
    });

    // Find correct and selected options
    let correctOption = null;
    options.forEach(opt => {
        if (opt.textContent.trim() === correct) {
            correctOption = opt;
        }
    });

    // Animate based on selection
    if (selected === correct) {
        // Correct answer - wobble
        element.classList.add('correct');
    } else {
        // Incorrect answer - shake incorrect, highlight correct
        element.classList.add('incorrect');
        if (correctOption) {
            correctOption.classList.add('correct');
        }
    }

    // Show leaderboard after animations complete
    setTimeout(() => {
        const rankings = window[quizId];
        const leaderboardHtml = rankings.map((p, i) => `
                    <div class="quiz-leaderboard-item">
                        <span>#${i + 1} ${p.name}</span>
                        <span>${p.value.toLocaleString()}</span>
                    </div>
                `).join('');

        resultDiv.style.display = 'block';
        resultDiv.innerHTML = `
                    <h3>${correct} had ${correctValue.toLocaleString()}!</h3>
                    <div style="margin-top: 15px;">
                        ${leaderboardHtml}
                    </div>
                `;
    }, 1000); // One second delay
}

function switchSearchMode(mode) {
    document.querySelector('.slide:last-child').classList.remove('has-results');

    currentSearchMode = mode;
    currentPlayer = null;
    const tabs = document.querySelectorAll('.mode-tab');
    tabs.forEach((tab, i) => {
        tab.classList.toggle('active', i === (mode === 'player' ? 0 : 1));
    });

    const input = document.getElementById('searchInput');
    const filterButtons = document.getElementById('filterButtons');
    const playerBadge = document.getElementById('playerBadge');

    if (mode === 'player') {
        input.placeholder = 'Search username...';
        filterButtons.style.display = 'none';
        playerBadge.style.display = 'none';
    } else {
        input.placeholder = 'Search statistic (e.g., play_time, mined, deaths)...';
        filterButtons.style.display = 'flex';
        playerBadge.style.display = 'none';
    }

    input.value = '';
    document.getElementById('searchResults').innerHTML = '';
}

function setFilter(filter) {
    currentFilter = filter;
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.toLowerCase() === filter) {
            btn.classList.add('active');
        }
    });
    performSearch();
}

function selectPlayer(playerName) {
    currentPlayer = allStats.find(p => p.name === playerName);
    const playerBadge = document.getElementById('playerBadge');
    const input = document.getElementById('searchInput');

    playerBadge.innerHTML = `
                <div class="player-badge">
                    <span>${playerName}</span>
                    <span class="clear-player" onclick="clearPlayer()">✕</span>
                </div>
            `;
    playerBadge.style.display = 'block';

    input.placeholder = 'Search this player\'s stats...';
    input.value = '';

    // Show top stats by default
    showPlayerTopStats();
}

function showPlayerTopStats() {
    if (!currentPlayer) return;

    const resultsDiv = document.getElementById('searchResults');
    const flatStats = [];

    const processStats = (obj, prefix = '') => {
        for (const [key, value] of Object.entries(obj)) {
            const fullKey = prefix + key;
            if (typeof value === 'object' && !Array.isArray(value)) {
                processStats(value, fullKey + '.');
            } else if (typeof value === 'number') {
                flatStats.push({
                    name: fullKey,
                    value
                });
            }
        }
    };

    processStats(currentPlayer.stats);

    // Also add aggregate categories
    AGGREGATE_CATEGORIES.forEach(category => {
        const aggValue = getStatValue(currentPlayer.stats, category, true);
        if (aggValue > 0) {
            flatStats.push({
                name: category + ' (total)',
                value: aggValue
            });
        }
    });

    flatStats.sort((a, b) => b.value - a.value);

    let html = `<h3 style="margin-bottom: 20px; font-size: 1.8rem;">${currentPlayer.name}'s Top Stats</h3>`;
    html += `<p style="opacity: 0.8; margin-bottom: 20px;">Showing top 20 statistics</p>`;

    html += flatStats.slice(0, 20).map((stat, idx) => {
        const isAggregate = stat.name.endsWith(' (total)');
        const statPath = isAggregate ? stat.name.replace(' (total)', '') : stat.name;
        return `
                    <div class="search-result-item" style="cursor: pointer;" data-stat-path="${statPath}" data-is-aggregate="${isAggregate}" onclick="handleStatClick(this)">
                        <span>${stat.name.replace('minecraft:', '').replace(/\./g, ' › ')}</span>
                        <span style="font-weight: bold;">${stat.value.toLocaleString()}</span>
                    </div>
                `;
    }).join('');

    resultsDiv.innerHTML = html;
}

function clearPlayer() {
    document.querySelector('.slide:last-child').classList.remove('has-results');

    currentPlayer = null;
    const playerBadge = document.getElementById('playerBadge');
    const input = document.getElementById('searchInput');

    playerBadge.style.display = 'none';
    input.placeholder = 'Search username...';
    input.value = '';
    document.getElementById('searchResults').innerHTML = '';
}

function performSearch() {
    document.querySelector('.slide:last-child').classList.add('has-results');

    const query = document.getElementById('searchInput').value.toLowerCase();
    const resultsDiv = document.getElementById('searchResults');

    if (!query) {
        // If no query and player is selected, show top stats
        if (currentPlayer && currentSearchMode === 'player') {
            showPlayerTopStats();
        } else {
            resultsDiv.innerHTML = '';
            document.querySelector('.slide:last-child').classList.remove('has-results');
        }
        return;
    }

    if (currentSearchMode === 'player') {
        if (currentPlayer) {
            searchPlayerStats(query, resultsDiv);
        } else {
            searchPlayer(query, resultsDiv);
        }
    } else {
        searchStatistic(query, resultsDiv);
    }
}

function searchPlayer(query, resultsDiv) {
    document.querySelector('.slide:last-child').classList.add('has-results');

    const matches = allStats.filter(p => p.name.toLowerCase().includes(query));

    if (matches.length === 0) {
        resultsDiv.innerHTML = '<p style="text-align: center; opacity: 0.7; padding: 20px;">Player not found</p>';
        return;
    }

    let html = '<h3 style="margin-bottom: 20px; font-size: 1.5rem;">Select a player:</h3>';
    html += matches.map(player => `
                <div class="search-result-item clickable" onclick="selectPlayer('${player.name.replace(/'/g, "\\'")}')">
                    <span style="font-size: 1.3rem;">${player.name}</span>
                    <span style="opacity: 0.7;">Click to view stats →</span>
                </div>
            `).join('');

    resultsDiv.innerHTML = html;
}

function searchPlayerStats(query, resultsDiv) {
    document.querySelector('.slide:last-child').classList.add('has-results');

    if (!currentPlayer) return;

    const flatStats = [];
    const processStats = (obj, prefix = '') => {
        for (const [key, value] of Object.entries(obj)) {
            const fullKey = prefix + key;
            if (typeof value === 'object' && !Array.isArray(value)) {
                processStats(value, fullKey + '.');
            } else if (typeof value === 'number') {
                flatStats.push({
                    name: fullKey,
                    value
                });
            }
        }
    };

    processStats(currentPlayer.stats);

    // Also add aggregate categories
    AGGREGATE_CATEGORIES.forEach(category => {
        const aggValue = getStatValue(currentPlayer.stats, category, true);
        if (aggValue > 0) {
            flatStats.push({
                name: category + ' (total)',
                value: aggValue
            });
        }
    });

    // Check if query contains minecraft: for exact matching
    const hasMinecraftPrefix = query.includes('minecraft:');

    if (hasMinecraftPrefix) {
        // Exact matching mode - split by spaces but keep minecraft:item together
        const queryParts = query.toLowerCase().split(/\s+/).filter(p => p.length > 0);

        const matches = flatStats.filter(stat => {
            const statLower = stat.name.toLowerCase();

            // All parts must match exactly
            return queryParts.every(part => {
                if (part.startsWith('minecraft:')) {
                    // Must have this exact minecraft:item (or things that start with it)
                    const searchTerm = part;
                    const parts = statLower.split('.');
                    return parts.some(p => p.startsWith(searchTerm) || p === searchTerm);
                } else {
                    // Regular word matching
                    return statLower.includes(part);
                }
            });
        }).sort((a, b) => b.value - a.value);

        if (matches.length === 0) {
            resultsDiv.innerHTML = '<p style="text-align: center; opacity: 0.7; padding: 20px;">No matching stats found</p>';
            return;
        }

        let html = `<h3 style="margin-bottom: 20px; font-size: 1.8rem;">${currentPlayer.name}'s Stats</h3>`;
        html += matches.map((stat, idx) => {
            const isAggregate = stat.name.endsWith(' (total)');
            const statPath = isAggregate ? stat.name.replace(' (total)', '') : stat.name;
            return `
                        <div class="search-result-item" style="cursor: pointer;" data-stat-path="${statPath}" data-is-aggregate="${isAggregate}" onclick="handleStatClick(this)">
                            <span>${stat.name.replace('minecraft:', '').replace(/\./g, ' › ')}</span>
                            <span style="font-weight: bold;">${stat.value.toLocaleString()}</span>
                        </div>
                    `;
        }).join('');

        resultsDiv.innerHTML = html;
    } else {
        // Fuzzy matching mode
        const queryParts = query.toLowerCase().split(/[\s\.:]+/).filter(p => p.length > 0);

        const matches = flatStats.filter(stat => {
            const statLower = stat.name.toLowerCase();
            const statClean = stat.name.replace('minecraft:', '').toLowerCase();

            // Check if all query parts are in the stat name
            return queryParts.every(part =>
                statLower.includes(part) || statClean.includes(part)
            );
        }).sort((a, b) => b.value - a.value);

        if (matches.length === 0) {
            resultsDiv.innerHTML = '<p style="text-align: center; opacity: 0.7; padding: 20px;">No matching stats found</p>';
            return;
        }

        let html = `<h3 style="margin-bottom: 20px; font-size: 1.8rem;">${currentPlayer.name}'s Stats</h3>`;
        html += matches.map((stat, idx) => {
            const isAggregate = stat.name.endsWith(' (total)');
            const statPath = isAggregate ? stat.name.replace(' (total)', '') : stat.name;
            return `
                        <div class="search-result-item" style="cursor: pointer;" data-stat-path="${statPath}" data-is-aggregate="${isAggregate}" onclick="handleStatClick(this)">
                            <span>${stat.name.replace('minecraft:', '').replace(/\./g, ' › ')}</span>
                            <span style="font-weight: bold;">${stat.value.toLocaleString()}</span>
                        </div>
                    `;
        }).join('');

        resultsDiv.innerHTML = html;
    }
}

function handleStatClick(element) {
    const statPath = element.getAttribute('data-stat-path');
    const isAggregate = element.getAttribute('data-is-aggregate') === 'true';

    if (isAggregate) {
        viewAggregateLeaderboard(statPath);
    } else {
        viewFullStat(statPath);
    }
}

function searchStatistic(query, resultsDiv) {
    document.querySelector('.slide:last-child').classList.add('has-results');

    const isPlayer = (name) => PLAYER_NAMES.includes(name);

    // Check if query contains minecraft: for exact matching
    const hasMinecraftPrefix = query.includes('minecraft:');

    // Build a flat list of all stat paths with their values
    const allStatPaths = new Map();
    allStats.forEach(player => {
        const processStats = (obj, prefix = '') => {
            for (const [key, value] of Object.entries(obj)) {
                const fullKey = prefix + key;
                if (typeof value === 'object' && !Array.isArray(value)) {
                    // Mark this as a category
                    if (!allStatPaths.has(fullKey)) {
                        allStatPaths.set(fullKey, {
                            isCategory: true,
                            values: []
                        });
                    }
                    processStats(value, fullKey + '.');
                } else if (typeof value === 'number') {
                    if (!allStatPaths.has(fullKey)) {
                        allStatPaths.set(fullKey, {
                            isCategory: false,
                            values: []
                        });
                    }
                    allStatPaths.get(fullKey).values.push({
                        player: player.name,
                        value
                    });
                }
            }
        };
        processStats(player.stats);
    });

    // Find matching paths
    const matches = [];

    if (hasMinecraftPrefix) {
        // Exact matching mode
        const queryParts = query.toLowerCase().split(/\s+/).filter(p => p.length > 0);

        for (const [path, data] of allStatPaths.entries()) {
            const pathLower = path.toLowerCase();

            // All parts must match exactly
            const allPartsMatch = queryParts.every(part => {
                if (part.startsWith('minecraft:')) {
                    // Must have this exact minecraft:item (or things that start with it)
                    const searchTerm = part;
                    const parts = pathLower.split('.');
                    return parts.some(p => p.startsWith(searchTerm) || p === searchTerm);
                } else {
                    // Regular word matching
                    return pathLower.includes(part);
                }
            });

            if (allPartsMatch) {
                matches.push({
                    path,
                    ...data
                });
            }
        }
    } else {
        // Fuzzy matching mode
        const queryParts = query.toLowerCase().split(/[\s\.:]+/).filter(p => p.length > 0);

        for (const [path, data] of allStatPaths.entries()) {
            const pathLower = path.toLowerCase();
            const pathClean = path.replace(/minecraft:/g, '').toLowerCase();

            // Check if all query parts are in the path
            const allPartsMatch = queryParts.every(part =>
                pathLower.includes(part) || pathClean.includes(part)
            );

            if (allPartsMatch) {
                matches.push({
                    path,
                    ...data
                });
            }
        }
    }

    if (matches.length === 0) {
        resultsDiv.innerHTML = '<p style="text-align: center; opacity: 0.7; padding: 20px;">No matching statistics found</p>';
        return;
    }

    let html = '';
    let displayCount = 0;

    // Separate categories and value stats
    const categories = matches.filter(m => m.isCategory && AGGREGATE_CATEGORIES.includes(m.path));
    const valueStats = matches.filter(m => m.values.length > 0);

    // Show whitelisted categories as aggregate leaderboards
    for (const stat of categories) {
        if (displayCount >= 20) break;

        const displayPath = stat.path.replace(/minecraft:/g, '').replace(/\./g, ' › ');
        const escapedPath = stat.path.replace(/'/g, "\\'");

        html += `
                    <div class="stat-category" onclick="viewAggregateLeaderboard('${escapedPath}')">
                        <h4>${displayPath}</h4>
                        <p class="stat-category-count">Click to view aggregate leaderboard</p>
                    </div>
                `;
        displayCount++;
    }

    // Show value stats with click to expand
    for (const stat of valueStats) {
        if (displayCount >= 20) break;

        const rankings = stat.values
            .filter(v => {
                if (currentFilter === 'players') return isPlayer(v.player);
                if (currentFilter === 'bots') return !isPlayer(v.player);
                return true;
            })
            .sort((a, b) => b.value - a.value);

        if (rankings.length > 0) {
            const escapedPath = stat.path.replace(/'/g, "\\'");
            html += `
                        <div class="stat-header">
                            <h3 class="stat-title" onclick="viewFullStat('${escapedPath}')">
                                ${stat.path.replace(/minecraft:/g, '').replace(/\./g, ' › ')}
                            </h3>
                            <span style="opacity: 0.6; font-size: 0.9rem; cursor: pointer;" onclick="viewFullStat('${escapedPath}')">
                                View all ${rankings.length} →
                            </span>
                        </div>
                    `;

            rankings.slice(0, 5).forEach((p, i) => {
                html += `
                            <div class="search-result-item">
                                <span class="search-result-rank">#${i + 1}</span>
                                <span class="search-result-name">${p.player}</span>
                                <span class="search-result-value">${p.value.toLocaleString()}</span>
                            </div>
                        `;
            });
            displayCount++;
        }
    }

    if (matches.length > displayCount) {
        html += `<p style="text-align: center; opacity: 0.7; margin-top: 20px;">Showing ${displayCount} of ${matches.length} matches</p>`;
    }

    resultsDiv.innerHTML = html || '<p style="text-align: center; opacity: 0.7; padding: 20px;">No results to display</p>';
}

function viewAggregateLeaderboard(categoryPath) {
    document.querySelector('.slide:last-child').classList.add('has-results');

    showPercentage = false; // Reset to numbers view

    const isPlayer = (name) => PLAYER_NAMES.includes(name);
    const resultsDiv = document.getElementById('searchResults');

    // Calculate aggregate values for each player in this category
    const aggregates = [];
    allStats.forEach(player => {
        const value = getStatValue(player.stats, categoryPath, true); // Use aggregate
        if (value > 0) {
            aggregates.push({
                player: player.name,
                value
            });
        }
    });

    const rankings = aggregates
        .filter(v => {
            if (currentFilter === 'players') return isPlayer(v.player);
            if (currentFilter === 'bots') return !isPlayer(v.player);
            return true;
        })
        .sort((a, b) => b.value - a.value);

    if (rankings.length === 0) {
        resultsDiv.innerHTML = '<p style="text-align: center; opacity: 0.7; padding: 20px;">No data found</p>';
        return;
    }

    const totalSum = rankings.reduce((sum, r) => sum + r.value, 0);

    let html = `
                <div style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
                    <button onclick="performSearch()" style="background: rgba(255,255,255,0.2); border: none; color: #fff; padding: 10px 20px; border-radius: 10px; cursor: pointer; font-size: 1rem;">
                        ← Back to search
                    </button>
                    <button onclick="togglePercentage()" class="toggle-button" id="percentToggle">
                        Show %
                    </button>
                </div>
                <h2 style="margin-bottom: 10px; font-size: 2rem;">
                    ${categoryPath.replace(/minecraft:/g, '').replace(/\./g, ' › ')}
                </h2>
                <p style="opacity: 0.8; margin-bottom: 20px;">Total: ${totalSum.toLocaleString()} | ${rankings.length} players</p>
            `;

    rankings.forEach((p, i) => {
        const percentage = ((p.value / totalSum) * 100).toFixed(1);
        html += `
                    <div class="search-result-item">
                        <span class="search-result-rank">#${i + 1}</span>
                        <span class="search-result-name">${p.player}</span>
                        <span class="search-result-value" data-value="${p.value}" data-percent="${percentage}">
                            ${showPercentage ? percentage + '%' : p.value.toLocaleString()}
                        </span>
                    </div>
                `;
    });

    resultsDiv.innerHTML = html;
}

function viewFullStat(statPath) {
    document.querySelector('.slide:last-child').classList.add('has-results');

    showPercentage = false; // Reset to numbers view

    const isPlayer = (name) => PLAYER_NAMES.includes(name);
    const resultsDiv = document.getElementById('searchResults');

    // Get all values for this stat
    const values = [];
    allStats.forEach(player => {
        const value = getStatValue(player.stats, statPath, false);
        if (value > 0) {
            values.push({
                player: player.name,
                value
            });
        }
    });

    const rankings = values
        .filter(v => {
            if (currentFilter === 'players') return isPlayer(v.player);
            if (currentFilter === 'bots') return !isPlayer(v.player);
            return true;
        })
        .sort((a, b) => b.value - a.value);

    if (rankings.length === 0) {
        resultsDiv.innerHTML = '<p style="text-align: center; opacity: 0.7; padding: 20px;">No data found</p>';
        return;
    }

    const totalSum = rankings.reduce((sum, r) => sum + r.value, 0);

    let html = `
                <div style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
                    <button onclick="performSearch()" style="background: rgba(255,255,255,0.2); border: none; color: #fff; padding: 10px 20px; border-radius: 10px; cursor: pointer; font-size: 1rem;">
                        ← Back to search
                    </button>
                    <button onclick="togglePercentage()" class="toggle-button" id="percentToggle">
                        Show %
                    </button>
                </div>
                <h2 style="margin-bottom: 10px; font-size: 2rem;">
                    ${statPath.replace(/minecraft:/g, '').replace(/\./g, ' › ')}
                </h2>
                <p style="opacity: 0.8; margin-bottom: 20px;">Total: ${totalSum.toLocaleString()} | ${rankings.length} players</p>
            `;

    rankings.forEach((p, i) => {
        const percentage = ((p.value / totalSum) * 100).toFixed(1);
        html += `
                    <div class="search-result-item">
                        <span class="search-result-rank">#${i + 1}</span>
                        <span class="search-result-name">${p.player}</span>
                        <span class="search-result-value" data-value="${p.value}" data-percent="${percentage}">
                            ${showPercentage ? percentage + '%' : p.value.toLocaleString()}
                        </span>
                    </div>
                `;
    });

    resultsDiv.innerHTML = html;
}

function togglePercentage() {
    showPercentage = !showPercentage;
    const button = document.getElementById('percentToggle');
    if (button) {
        button.textContent = showPercentage ? 'Show Numbers' : 'Show %';
        button.classList.toggle('active', showPercentage);
    }

    // Update all visible values
    document.querySelectorAll('.search-result-value').forEach(el => {
        const value = el.getAttribute('data-value');
        const percent = el.getAttribute('data-percent');
        if (value && percent) {
            el.textContent = showPercentage ? percent + '%' : parseInt(value).toLocaleString();
        }
    });
}

document.getElementById('nextBtn').addEventListener('click', nextSlide);
document.getElementById('prevBtn').addEventListener('click', prevSlide);

document.addEventListener('keydown', (e) => {
    // Disable arrow keys on search slide
    if (currentSlide === slides.length - 1) return;

    if (e.key === 'ArrowRight') nextSlide();
    if (e.key === 'ArrowLeft') prevSlide();
});

// Load stats on page load
loadStats();

// Expose functions to global scope for inline onclick handlers
window.switchSearchMode = switchSearchMode;
window.setFilter = setFilter;
window.selectPlayer = selectPlayer;
window.clearPlayer = clearPlayer;
window.performSearch = performSearch;
window.checkQuiz = checkQuiz;
window.viewFullStat = viewFullStat;
window.viewAggregateLeaderboard = viewAggregateLeaderboard;
window.togglePercentage = togglePercentage;
window.handleStatClick = handleStatClick;
window.goToSlide = goToSlide;
