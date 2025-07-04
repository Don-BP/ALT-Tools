// js/tools/scoreboard.js

import { playSound } from '../utils.js';

const ThemedScoreboard = {
    // --- Elements ---
    elements: {
        toolCard: null, container: null, teamsContainer: null, addTeamBtn: null, removeTeamBtn: null, teamCountDisplay: null,
        themeSelect: null, winScoreInput: null, bonusInput: null, resetBtn: null, winnerPopup: null, winnerName: null,
        winnerAvatar: null, // <-- ADDED
        winnerCloseBtn: null, confettiCanvas: null, themeStylesheet: null, gridResetBtn: null,
    },

    // --- State ---
    state: {
        teamCount: 4, winScore: 20, bonusAmount: 1, activeTheme: 'default', scores: {}, teamNames: {}, teamAvatars: {}, isGameActive: true,
    },

    // --- Constants ---
    CONFIG: {
        MAX_TEAMS: 6, MIN_TEAMS: 1, GRID_VIEW_TEAMS: 4, STORAGE_KEY: 'brainPowerThemedScoreboard',
        DEFAULT_NAMES: ['Team 1', 'Team 2', 'Team 3', 'Team 4', 'Team 5', 'Team 6'],
        TEAM_COLORS: ['#2a75bb', '#d9534f', '#5cb85c', '#f0ad4e', '#8e44ad', '#16a085'],
    },

    init() {
        const ELS = this.elements;
        // Fullscreen elements
        ELS.toolCard = document.getElementById('scoreboard-tool');
        ELS.container = document.getElementById('themed-scoreboard-container');
        ELS.teamsContainer = document.getElementById('themed-teams-container');
        ELS.addTeamBtn = document.getElementById('sb-add-team-btn');
        ELS.removeTeamBtn = document.getElementById('sb-remove-team-btn');
        ELS.teamCountDisplay = document.getElementById('sb-team-count-display');
        ELS.themeSelect = document.getElementById('sb-theme-select');
        ELS.winScoreInput = document.getElementById('sb-win-score-input');
        ELS.bonusInput = document.getElementById('sb-bonus-input');
        ELS.resetBtn = document.getElementById('sb-reset-btn');
        ELS.winnerPopup = document.getElementById('winner-popup');
        ELS.winnerName = document.getElementById('winner-team-name');
        ELS.winnerAvatar = document.getElementById('winner-team-avatar'); // <-- ADDED
        ELS.winnerCloseBtn = document.querySelector('.winner-popup-close');
        ELS.confettiCanvas = document.getElementById('confetti-canvas');
        ELS.themeStylesheet = document.getElementById('scoreboard-theme-stylesheet');
        
        // Grid view elements
        for (let i = 1; i <= this.CONFIG.GRID_VIEW_TEAMS; i++) {
            ELS[`gridTeam${i}Name`] = document.getElementById(`team${i}-name`);
            ELS[`gridTeam${i}Score`] = document.getElementById(`score-team${i}`);
            ELS[`gridTeam${i}Avatar`] = document.getElementById(`team${i}-avatar`);
            ELS[`gridTeam${i}AvatarUpload`] = document.getElementById(`team${i}-avatar-upload`);
            ELS[`gridTeam${i}AddBtn`] = document.querySelector(`.score-btn[data-team='${i}'][data-amount='1']`);
            ELS[`gridTeam${i}SubBtn`] = document.querySelector(`.score-btn[data-team='${i}'][data-amount='-1']`);
        }
        ELS.gridResetBtn = document.getElementById('reset-scores');

        this.loadState();
        this.addEventListeners();
        this.renderAllViews();
    },
    
    addEventListeners() {
        const ELS = this.elements;
        // Fullscreen listeners
        ELS.addTeamBtn.addEventListener('click', () => this.changeTeamCount(1));
        ELS.removeTeamBtn.addEventListener('click', () => this.changeTeamCount(-1));
        ELS.themeSelect.addEventListener('change', (e) => this.setTheme(e.target.value));
        ELS.winScoreInput.addEventListener('input', (e) => {
            this.state.winScore = parseInt(e.target.value, 10) || 0;
            this.saveState();
        });
        ELS.bonusInput.addEventListener('input', (e) => this.setBonus(e.target.value));
        ELS.resetBtn.addEventListener('click', () => this.resetGame(true));
        ELS.winnerCloseBtn.addEventListener('click', () => this.closeWinnerPopup());

        // Fullscreen Team Card Listeners (delegated)
        ELS.teamsContainer.addEventListener('click', (e) => {
            const pointBtn = e.target.closest('.point-btn');
            if (pointBtn) {
                const teamCard = e.target.closest('.team');
                const teamId = parseInt(teamCard.dataset.teamId, 10);
                const amount = parseInt(pointBtn.dataset.amount, 10);
                this.updateScore(teamId, amount, false);
            }
        });

        ELS.teamsContainer.addEventListener('blur', (e) => {
            if (e.target.classList.contains('name-text')) {
                const teamCard = e.target.closest('.team');
                const teamId = parseInt(teamCard.dataset.teamId, 10);
                this.updateTeamName(teamId, e.target.textContent);
            }
        }, true);
        
        ELS.teamsContainer.addEventListener('change', (e) => {
            if (e.target.classList.contains('avatar-upload-input')) {
                const teamId = parseInt(e.target.dataset.team, 10);
                this.handleAvatarUpload(e, teamId);
                e.target.value = null;
            }
        });

        // Grid View Listeners
        ELS.gridResetBtn.addEventListener('click', () => this.resetGame(true));
        for (let i = 1; i <= this.CONFIG.GRID_VIEW_TEAMS; i++) {
            const teamId = i;
            ELS[`gridTeam${i}AddBtn`].addEventListener('click', () => this.updateScore(teamId, 1, true));
            ELS[`gridTeam${i}SubBtn`].addEventListener('click', () => this.updateScore(teamId, -1, true));

            ELS[`gridTeam${i}Name`].addEventListener('blur', (e) => {
                this.updateTeamName(teamId, e.target.textContent);
            });

            ELS[`gridTeam${i}AvatarUpload`].addEventListener('change', (e) => {
                this.handleAvatarUpload(e, teamId);
                e.target.value = null;
            });
        }
    },

    updateTeamName(teamId, newName) {
        this.state.teamNames[teamId] = newName;
        this.saveState();
        const gridNameEl = this.elements[`gridTeam${teamId}Name`];
        if (gridNameEl) gridNameEl.textContent = newName;
        const fullscreenCard = this.elements.teamsContainer.querySelector(`.team[data-team-id='${teamId}']`);
        if (fullscreenCard) {
            const fullscreenNameEl = fullscreenCard.querySelector('.name-text');
            if(fullscreenNameEl) fullscreenNameEl.textContent = newName;
        }
    },

    handleAvatarUpload(event, teamId) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = e.target.result;
                this.state.teamAvatars[teamId] = dataUrl;
                this.saveState();
                this.renderAllViews();
            };
            reader.readAsDataURL(file);
        }
    },

    loadState() {
        const savedState = localStorage.getItem(this.CONFIG.STORAGE_KEY);
        if (savedState) {
            const loaded = JSON.parse(savedState);
            if (loaded.isGameActive === false) {
                delete loaded.scores;
            }
            this.state = { ...this.state, ...loaded };
        }
        for (let i = 1; i <= this.CONFIG.MAX_TEAMS; i++) {
            if (this.state.scores[i] === undefined) this.state.scores[i] = 0;
            if (this.state.teamNames[i] === undefined) this.state.teamNames[i] = this.CONFIG.DEFAULT_NAMES[i - 1];
            if (this.state.teamAvatars[i] === undefined) this.state.teamAvatars[i] = '';
        }
    },

    saveState() {
        localStorage.setItem(this.CONFIG.STORAGE_KEY, JSON.stringify(this.state));
    },

    activate() {
        this.elements.container.classList.remove('hidden');
        this.setTheme(this.state.activeTheme);
    },
    
    deactivate() {
        this.elements.container.classList.add('hidden');
        this.closeWinnerPopup();
        this.themeHandlers.deactivateAll();
        this.elements.themeStylesheet.href = '';
        document.body.className = document.body.className.replace(/theme-[\w-]+/g, '').trim();
        this.elements.toolCard.className = this.elements.toolCard.className.replace(/theme-[\w-]+-card/g, '').trim();
    },

    changeTeamCount(delta) {
        if (!this.state.isGameActive) return;
        const newCount = this.state.teamCount + delta;
        if (newCount >= this.CONFIG.MIN_TEAMS && newCount <= this.CONFIG.MAX_TEAMS) {
            this.state.teamCount = newCount;
            this.render();
            this.saveState();
        }
    },
    
    setBonus(value) {
        this.state.bonusAmount = parseInt(value, 10) || 1;
        this.elements.bonusInput.value = this.state.bonusAmount;
        this.saveState();
    },

    setTheme(themeName) {
        this.state.activeTheme = themeName;
        document.body.className = document.body.className.replace(/theme-[\w-]+/g, '').trim();
        this.elements.toolCard.className = this.elements.toolCard.className.replace(/theme-[\w-]+-card/g, '').trim();

        if (themeName !== 'default') {
            this.elements.themeStylesheet.href = `themes/${themeName}.css`;
            document.body.classList.add(`theme-${themeName}`);
            this.elements.toolCard.classList.add(`theme-${themeName}-card`);
        } else {
            this.elements.themeStylesheet.href = '';
        }
        
        this.render();
        this.saveState();
    },

    updateScore(teamId, amount, isFromGrid) {
        if (!this.state.isGameActive) return;
        
        const points = isFromGrid ? amount : (amount > 0 ? this.state.bonusAmount : amount);
        const oldScore = this.state.scores[teamId] || 0;
        const newScore = Math.max(0, oldScore + points);
        if (newScore === oldScore) return;

        this.state.scores[teamId] = newScore;
        
        const teamCard = this.elements.teamsContainer.querySelector(`.team[data-team-id='${teamId}']`);
        if (teamCard) {
            this.themeHandlers.update(this.state.activeTheme, teamCard, newScore, points > 0);
            const scoreNumberEl = teamCard.querySelector('.score-number');
            if(scoreNumberEl) scoreNumberEl.textContent = newScore;
        }

        const gridScoreEl = this.elements[`gridTeam${teamId}Score`];
        if(gridScoreEl) gridScoreEl.textContent = newScore;
        
        playSound(points > 0 ? 'sounds/point-up.mp3' : 'sounds/point-down.mp3');
        this.saveState();
        this.checkWinCondition(teamId);
    },

    checkWinCondition(teamId) {
        if (this.state.winScore > 0 && this.state.scores[teamId] >= this.state.winScore) {
            this.triggerWin(teamId);
        }
    },
    
    triggerWin(teamId) {
        this.state.isGameActive = false;
        this.elements.winnerName.textContent = this.state.teamNames[teamId];
        this.elements.winnerName.style.color = this.CONFIG.TEAM_COLORS[teamId - 1];
        
        // SET THE AVATAR SOURCE
        this.elements.winnerAvatar.src = this.state.teamAvatars[teamId] || '';

        this.elements.winnerPopup.classList.remove('hidden');
        this.startConfetti();
        this.themeHandlers.win(this.state.activeTheme, teamId);
        this.saveState();
    },

    closeWinnerPopup() {
        this.elements.winnerPopup.classList.add('hidden');
        this.stopConfetti();
        this.themeHandlers.deactivateAll();
    },

    resetGame(confirmReset) {
        if (confirmReset && !confirm("Are you sure you want to reset all scores? This will apply to both scoreboard views.")) {
            return;
        }
        this.state.isGameActive = true;
        for (let i = 1; i <= this.CONFIG.MAX_TEAMS; i++) {
            this.state.scores[i] = 0;
        }
        this.closeWinnerPopup();
        this.renderAllViews();
        this.saveState();
    },

    renderAllViews() {
        this.render(); 
        this.renderGridView();
    },

    renderGridView() {
        for(let i = 1; i <= this.CONFIG.GRID_VIEW_TEAMS; i++) {
            const nameEl = this.elements[`gridTeam${i}Name`];
            const scoreEl = this.elements[`gridTeam${i}Score`];
            const avatarEl = this.elements[`gridTeam${i}Avatar`];
            
            if (nameEl) nameEl.textContent = this.state.teamNames[i] || this.CONFIG.DEFAULT_NAMES[i - 1];
            if (scoreEl) scoreEl.textContent = this.state.scores[i] || 0;
            if (avatarEl) avatarEl.src = this.state.teamAvatars[i] || '';
        }
    },

    render() {
        const ELS = this.elements;
        const STATE = this.state;
        ELS.teamCountDisplay.textContent = STATE.teamCount;
        ELS.winScoreInput.value = STATE.winScore;
        ELS.themeSelect.value = STATE.activeTheme;
        ELS.bonusInput.value = STATE.bonusAmount;
        ELS.teamsContainer.innerHTML = '';
        for (let i = 1; i <= STATE.teamCount; i++) {
            const teamCard = this.createTeamCard(i);
            ELS.teamsContainer.appendChild(teamCard);
        }
    },

    createTeamCard(teamId) {
        const card = document.createElement('div');
        const teamColor = this.CONFIG.TEAM_COLORS[teamId - 1] || '#333';
        card.className = 'team';
        card.dataset.teamId = teamId;
        card.style.setProperty('--team-color', teamColor);
        card.innerHTML = `
            <div class="team-avatar-container">
                <img src="${this.state.teamAvatars[teamId] || ''}" class="team-avatar" id="themed-team${teamId}-avatar" alt="Team ${teamId} Avatar">
                <input type="file" class="avatar-upload-input" id="themed-team${teamId}-avatar-upload" data-team="${teamId}" accept="image/*">
                <label for="themed-team${teamId}-avatar-upload" class="avatar-upload-label" title="Upload Avatar">✏️</label>
            </div>
            <div class="team-name-display">
                <h3 class="name-text" contenteditable="true">${this.state.teamNames[teamId]}</h3>
            </div>
            <div class="score-display">
                <div class="score-number">${this.state.scores[teamId]}</div>
            </div>
            <div class="team-controls">
                <button class="point-btn minus" data-amount="-1">-</button>
                <button class="point-btn plus" data-amount="1">+</button>
            </div>`;
        
        card.querySelector('.name-text').style.color = teamColor;
        this.themeHandlers.update(this.state.activeTheme, card, this.state.scores[teamId], null);
        return card;
    },

    confettiInterval: null,
    startConfetti() {
        if (this.confettiInterval) return;
        const canvas = this.elements.confettiCanvas;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        const particles = [];
        const particleCount = 200;
        const colors = ["#FFC700", "#FF4B4B", "#5DFF4B", "#4B8DFF", "#FF4BFF"];
        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * canvas.width, y: -Math.random() * canvas.height,
                w: Math.random() * 8 + 5, h: Math.random() * 4 + 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                speed: Math.random() * 2 + 2, rotation: Math.random() * 360,
                rotationSpeed: Math.random() * 20 - 10
            });
        }
        const draw = () => {
            if (!this.confettiInterval) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.y += p.speed; p.rotation += p.rotationSpeed;
                if (p.y > canvas.height) { p.y = -20; p.x = Math.random() * canvas.width; }
                ctx.save();
                ctx.translate(p.x, p.y); ctx.rotate(p.rotation * Math.PI / 180);
                ctx.fillStyle = p.color; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                ctx.restore();
            });
            this.confettiInterval = requestAnimationFrame(draw);
        };
        this.confettiInterval = requestAnimationFrame(draw);
    },
    stopConfetti() {
        if (this.confettiInterval) {
            cancelAnimationFrame(this.confettiInterval);
            this.confettiInterval = null;
        }
        const canvas = this.elements.confettiCanvas;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    },
    
    themeHandlers: {
        update(themeName, card, score, isPositive) {
            if(!card) return;
            const itemManager = (visual, className, content, options = {}) => {
                const currentCount = visual.children.length;
                if (score > currentCount) {
                    for(let i = currentCount; i < score; i++) {
                        const item = document.createElement('div');
                        item.className = `${className} theme-item animate-pop`;
                        item.innerHTML = content;
                        item.style.setProperty('--item-index', i);
                        if(options.randomize) {
                            item.style.setProperty('--random-x', Math.random());
                            item.style.setProperty('--random-y', Math.random());
                            item.style.setProperty('--random-delay', Math.random());
                        }
                        if(options.setOrbit) {
                            item.style.setProperty('--orbit-duration', `${(Math.random() * 2.5 + 3.5).toFixed(2)}s`);
                            item.style.setProperty('--orbit-delay', `-${(Math.random() * 5).toFixed(2)}s`);
                        }
                         if(options.setPosition) {
                            item.style.setProperty('--initial-rotate', `${Math.floor(Math.random() * 45 - 22)}deg`);
                            item.style.left = `${Math.random() * 80 + 10}%`;
                            item.style.top = `${Math.random() * 80 + 10}%`;
                        }
                        visual.appendChild(item);
                    }
                } else if (score < currentCount) {
                    for(let i = currentCount; i > score; i--) {
                        if (visual.lastChild) {
                            visual.lastChild.classList.add('animate-shrink');
                            visual.lastChild.addEventListener('animationend', (e) => e.target.remove(), {once: true});
                        }
                    }
                }
            };
            const handler = this[themeName] || this.default;
            if(handler.update) handler.update(card, score, isPositive, itemManager);
        },
        win(themeName, winningTeamId) {
            const handler = this[themeName] || this.default;
            const allCards = ThemedScoreboard.elements.teamsContainer.querySelectorAll('.team');
            allCards.forEach(card => {
                const isWinner = parseInt(card.dataset.teamId) === winningTeamId;
                if(handler.win) handler.win(card, isWinner);
            });
        },
        deactivateAll() {
            ThemedScoreboard.elements.teamsContainer.querySelectorAll('.team').forEach(card => {
                card.className = card.className.replace(/\b[\w-]+-winner\b/g, '').trim();
                card.querySelectorAll('.dancing').forEach(el => el.classList.remove('dancing'));
            });
        },
        default: {
            update(card, score) { 
                const scoreDisplay = card.querySelector('.score-display');
                if(!scoreDisplay.querySelector('.score-number')) {
                    scoreDisplay.innerHTML = `<div class="score-number">${score}</div>`;
                }
            },
            win(card, isWinner) { card.style.borderColor = isWinner ? 'gold' : '#ccc'; card.style.transform = isWinner ? 'scale(1.05)' : 'scale(1)'; }
        },
        'star-jar': {
            update(card, score, isPositive) {
                const visualContainer = card.querySelector('.score-display');
                if (!visualContainer.querySelector('.star-jar-visual')) {
                     visualContainer.innerHTML = `<div class="score-number">${score}</div><div class="star-jar-visual theme-visual-container"></div>`;
                }
                const jar = visualContainer.querySelector('.star-jar-visual');
                if (isPositive === null) {
                    jar.innerHTML = Array.from({length: score}, (_,i) => `<span class="star-token theme-item" style="--item-index: ${i};">★</span>`).join('');
                    return;
                }
                if (isPositive) {
                    const flyingStar = document.createElement('span');
                    flyingStar.className = 'flying-star'; flyingStar.innerHTML = '★';
                    visualContainer.appendChild(flyingStar);
                    flyingStar.classList.add('animate');
                    playSound('sounds/select.mp3');
                    flyingStar.addEventListener('animationend', () => {
                        flyingStar.remove();
                        const star = document.createElement('span');
                        star.className = 'star-token theme-item animate-land'; star.innerHTML = '★';
                        star.style.setProperty('--item-index', score - 1);
                        jar.appendChild(star);
                    }, { once: true });
                } else if (jar.lastChild) {
                    jar.lastChild.classList.add('animate-shrink');
                    jar.lastChild.addEventListener('animationend', () => jar.lastChild.remove(), { once: true });
                }
            },
            win(card, isWinner) {
                card.classList.toggle('star-jar-winner', isWinner);
                if (isWinner) card.querySelectorAll('.star-token').forEach(star => star.classList.add('dancing'));
            }
        },
        'spring': {
            update(card, score, isPositive, itemManager) {
                const visualContainer = card.querySelector('.score-display');
                if (!visualContainer.querySelector('.spring-visual')) {
                    visualContainer.innerHTML = `<div class="score-number">${score}</div><div class="spring-visual theme-visual-container"><div class="spring-vine"></div><div class="spring-flowers"></div></div>`;
                }
                const vine = visualContainer.querySelector('.spring-vine');
                const flowersContainer = visualContainer.querySelector('.spring-flowers');
                const maxScore = ThemedScoreboard.state.winScore || 20;
                vine.style.height = `${Math.min(100, (score / maxScore) * 100)}%`;
                itemManager(flowersContainer, 'flower', '🌸', { setPosition: true });
            },
            win(card, isWinner) { 
                card.classList.toggle('spring-winner', isWinner);
                if (isWinner) card.querySelectorAll('.flower').forEach(el => el.classList.add('dancing'));
            }
        },
         'science': {
            update(card, score, isPositive, itemManager) {
                const visualContainer = card.querySelector('.score-display');
                if (!visualContainer.querySelector('.science-visual')) {
                    visualContainer.innerHTML = `<div class="score-number">${score}</div><div class="science-visual theme-visual-container"><div class="science-nucleus"></div><div class="science-orbit-container"></div></div>`;
                }
                itemManager(visualContainer.querySelector('.science-orbit-container'), 'electron', '', { setOrbit: true });
            },
            win(card, isWinner) {
                card.classList.toggle('science-winner', isWinner);
                if(isWinner) card.querySelectorAll('.electron').forEach(el => el.classList.add('dancing'));
            }
        },
        'music': {
            update(card, score, isPositive, itemManager) {
                 if (!card.querySelector('.music-visual')) {
                    card.querySelector('.score-display').innerHTML = `<div class="score-number">${score}</div><div class="music-visual theme-visual-container"><div class="music-staff-line"></div><div class="music-staff-line"></div><div class="music-staff-line"></div><div class="music-staff-line"></div><div class="music-staff-line"></div><div class="music-notes-container"></div></div>`;
                }
                const notesContainer = card.querySelector('.music-notes-container');
                itemManager(notesContainer, 'note', ['🎵', '🎶', '🎼'][Math.floor(Math.random()*3)], { setPosition: true });
            },
            win(card, isWinner) {
                card.classList.toggle('music-winner', isWinner);
                 if(isWinner) card.querySelectorAll('.note').forEach(el => el.classList.add('dancing'));
            }
        },
        'energy-bar': {
             update(card, score, isPositive) {
                const visualContainer = card.querySelector('.score-display');
                if (!visualContainer.querySelector('.energy-bar-visual')) {
                     visualContainer.innerHTML = `<div class="score-number">${score}</div><div class="energy-bar-visual theme-visual-container"><div class="energy-bar-fill"></div><div class="energy-bar-sparks"></div></div>`;
                }
                const fill = visualContainer.querySelector('.energy-bar-fill');
                const maxScore = ThemedScoreboard.state.winScore || 20;
                const percent = Math.min(100, (score / maxScore) * 100);
                fill.style.setProperty('--fill-percent', `${percent}%`);
                card.classList.toggle('has-points', score > 0);
                if(isPositive) fill.classList.add('animate-increase');
                else if(isPositive === false) fill.classList.add('animate-decrease');
                fill.addEventListener('animationend', () => fill.classList.remove('animate-increase', 'animate-decrease'), {once: true})
            },
            win(card, isWinner) { 
                card.classList.toggle('energy-bar-winner', isWinner);
            }
        },
        'animals': {
             update(card, score, isPositive, itemManager) {
                const visualContainer = card.querySelector('.score-display');
                 if (!visualContainer.querySelector('.animals-visual')) {
                     visualContainer.innerHTML = `<div class="score-number">${score}</div><div class="animals-visual theme-visual-container"></div>`;
                }
                itemManager(visualContainer.querySelector('.animals-visual'), 'paw', '🐾', { setPosition: true });
            },
            win(card, isWinner) { 
                card.classList.toggle('animals-winner', isWinner);
                if(isWinner) card.querySelectorAll('.paw').forEach(el => el.classList.add('dancing'));
            }
        },
        'christmas': {
            update(card, score, isPositive, itemManager) {
                const visualContainer = card.querySelector('.score-display');
                if (!visualContainer.querySelector('.christmas-visual')) {
                     visualContainer.innerHTML = `<div class="score-number">${score}</div><div class="christmas-visual theme-visual-container"></div>`;
                }
                const gifts = ['🎁', '🎀', '🎄'];
                itemManager(visualContainer.querySelector('.christmas-visual'), 'gift', gifts[Math.floor(Math.random() * gifts.length)]);
            },
            win(card, isWinner) { 
                card.classList.toggle('christmas-winner', isWinner); 
                if(isWinner) card.querySelectorAll('.gift').forEach(el => el.classList.add('dancing'));
            }
        },
        'halloween': {
             update(card, score, isPositive, itemManager) {
                const visualContainer = card.querySelector('.score-display');
                if (!visualContainer.querySelector('.halloween-visual')) {
                     visualContainer.innerHTML = `<div class="score-number">${score}</div><div class="halloween-visual theme-visual-container"></div>`;
                }
                itemManager(visualContainer.querySelector('.halloween-visual'), 'ghost', '👻', { randomize: true });
            },
            win(card, isWinner) { 
                card.classList.toggle('halloween-winner', isWinner); 
                if(isWinner) card.querySelectorAll('.ghost').forEach(el => el.classList.add('dancing'));
            }
        },
        'minimalist': {
            update(card, score, isPositive, itemManager) {
                const visualContainer = card.querySelector('.score-display');
                if (!visualContainer.querySelector('.minimalist-dots')) {
                     visualContainer.innerHTML = `<div class="score-number">${score}</div><div class="minimalist-dots theme-visual-container"></div>`;
                }
                itemManager(visualContainer.querySelector('.minimalist-dots'), 'dot', '');
            },
            win(card, isWinner) { 
                card.classList.toggle('minimalist-winner', isWinner); 
            }
        }
    }
};

export default ThemedScoreboard;