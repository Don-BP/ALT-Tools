// js/tools/timer.js

import { playSound } from '../utils.js';

export function initTimer() {
    let timerInterval = null;
    let totalSeconds = 300; // Default to 5 minutes
    let initialSeconds = 300;
    let isTimerRunning = false;

    const timerDisplay = document.getElementById('timer-display');
    const startStopBtn = document.getElementById('timer-start-stop');
    const resetBtn = document.getElementById('timer-reset');
    const presetBtns = document.querySelectorAll('.preset-btn');
    const progress = document.getElementById('timer-progress');
    const timerThemeSelect = document.getElementById('timer-theme');
    const timerThemes = document.querySelectorAll('.timer-theme');
    const timerLayoutContainer = document.querySelector('.timer-layout-container');
    const waterLevel = document.querySelector('#timer-theme-bucket .water');

    const TIMER_THEME_KEY = 'brainPowerTimerTheme';

    function updateTimerDisplay() {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        
        const percentage = (initialSeconds > 0) ? (totalSeconds / initialSeconds) * 100 : 0;
        const selectedTheme = timerThemeSelect.value;

        if (selectedTheme === 'bar') {
            progress.style.width = `${percentage}%`;
        } else if (selectedTheme === 'bucket') {
            if (waterLevel) {
                waterLevel.style.height = `${percentage}%`;
            }
        }
    }

    function setTimer(seconds) {
        if (isTimerRunning) stopTimer();
        totalSeconds = seconds;
        initialSeconds = seconds;
        updateTimerDisplay();
    }

    function startTimer() {
        isTimerRunning = true;
        startStopBtn.textContent = 'Pause';
        timerInterval = setInterval(() => {
            totalSeconds--;
            updateTimerDisplay();
            if (totalSeconds <= 0) {
                stopTimer();
                playSound('sounds/timer-end.mp3');
            }
        }, 1000);
    }

    function stopTimer() {
        clearInterval(timerInterval);
        isTimerRunning = false;
        startStopBtn.textContent = 'Start';
    }

    startStopBtn.addEventListener('click', () => {
        if (isTimerRunning) {
            stopTimer();
        } else {
            if (totalSeconds > 0) {
                startTimer();
            }
        }
    });

    resetBtn.addEventListener('click', () => {
        stopTimer();
        totalSeconds = initialSeconds;
        updateTimerDisplay();
    });

    presetBtns.forEach(button => {
        button.addEventListener('click', () => {
            const seconds = parseInt(button.dataset.time, 10);
            setTimer(seconds);
        });
    });

    timerThemeSelect.addEventListener('change', () => {
        const selectedTheme = timerThemeSelect.value;
        timerThemes.forEach(theme => {
            theme.classList.toggle('active', theme.id === `timer-theme-${selectedTheme}`);
        });
        timerLayoutContainer.classList.toggle('bucket-theme-active', selectedTheme === 'bucket');
        localStorage.setItem(TIMER_THEME_KEY, selectedTheme);
        updateTimerDisplay();
    });

    function loadTimerTheme() {
        const savedTheme = localStorage.getItem(TIMER_THEME_KEY) || 'bar';
        timerThemeSelect.value = savedTheme;
        timerThemeSelect.dispatchEvent(new Event('change'));
    }
    
    // Initial setup
    loadTimerTheme();
    updateTimerDisplay();
}