// js/main.js

import { toggleMute, updateAllFlashcardCategorySelects } from './utils.js';
import { initDateWeather } from './tools/date-weather.js';
import { initNamePicker } from './tools/name-picker.js';
import { initTimer } from './tools/timer.js';
import { initFlashcards } from './tools/flashcards.js';
import ThemedScoreboard from './tools/scoreboard.js';
import { initWhatsMissing } from './tools/whats-missing.js';
import { initImageReveal } from './tools/image-reveal.js';
import { initFlashcardManager } from './tools/flashcard-manager.js';
import { initBingoPicker } from './tools/bingo-picker.js';
import { initWhiteboard } from './tools/whiteboard.js';
import { initSpinner } from './tools/spinner.js';
import { DiceRoller } from './tools/dice-roller.js'; 

// --- Global App Logic ---

function initializeAudio() {
    const muteBtn = document.getElementById('mute-btn');
    muteBtn.addEventListener('click', () => {
        const isNowMuted = toggleMute();
        muteBtn.innerHTML = isNowMuted ? '🔇' : '🔊';
        muteBtn.title = isNowMuted ? 'Unmute' : 'Mute';
    });
}

function initializeFullscreen() {
    document.querySelectorAll('.tool-card').forEach(card => {
        const fullscreenBtn = document.createElement('button');
        fullscreenBtn.className = 'fullscreen-btn';
        fullscreenBtn.title = 'Toggle Fullscreen';
        fullscreenBtn.innerHTML = '↗️'; 
        
        card.querySelector('h2').after(fullscreenBtn);

        fullscreenBtn.addEventListener('click', () => {
            toggleFullscreen(card);
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === "Escape") {
            const fullscreenElement = document.querySelector('.tool-card.fullscreen-mode');
            if (fullscreenElement) {
                toggleFullscreen(fullscreenElement);
            }
        }
    });
}

function toggleFullscreen(card) {
    const isFullscreen = card.classList.toggle('fullscreen-mode');
    document.body.classList.toggle('has-fullscreen-tool', isFullscreen);
    
    const btn = card.querySelector('.fullscreen-btn');
    btn.innerHTML = isFullscreen ? '↙️ Exit' : '↗️';
    btn.title = isFullscreen ? 'Exit Fullscreen (Esc key)' : 'Toggle Fullscreen';
    
    // --- Module-specific fullscreen logic ---

    if (card.id === 'scoreboard-tool') {
        if (isFullscreen) ThemedScoreboard.activate();
        else ThemedScoreboard.deactivate();
    }

    if (card.id === 'image-reveal-tool') {
        const statusElement = document.getElementById('ir-sequence-status');
        if (isFullscreen) {
            btn.before(statusElement);
        } else {
            const originalContainer = document.getElementById('ir-status-bar');
            originalContainer.prepend(statusElement);
        }
    }
    
    if (card.id === 'spinner-tool') {
        const gridView = card.querySelector('#spinner-grid-view');
        const fullscreenView = card.querySelector('#spinner-fullscreen-view');
        if (gridView && fullscreenView) {
            gridView.classList.toggle('hidden', isFullscreen);
            fullscreenView.classList.toggle('hidden', !isFullscreen);
        }
        if (isFullscreen) {
            window.dispatchEvent(new Event('resize'));
        }
    }

    // FIX: Explicitly tell the DiceRoller module about the state change.
    if (card.id === 'dice-roller-tool') {
        if (isFullscreen) {
            DiceRoller.enterFullscreen();
        } else {
            DiceRoller.exitFullscreen();
        }
    }
}

// --- App Initialization ---
function initializeApp() {
    // Initialize global features first
    initializeAudio();
    initializeFullscreen();
    updateAllFlashcardCategorySelects();

    // Initialize each tool module
    initDateWeather();
    initNamePicker();
    initTimer();
    initFlashcards();
    ThemedScoreboard.init();
    initWhatsMissing();
    initImageReveal();
    initFlashcardManager();
    initBingoPicker();
    initWhiteboard();
    initSpinner();
    DiceRoller.init(); 

    console.log("Brain Power Classroom Tools Initialized!");
}

// Wait for the DOM to be fully loaded before running the app
document.addEventListener('DOMContentLoaded', initializeApp);