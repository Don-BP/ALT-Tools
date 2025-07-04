// js/utils.js

// --- Shared State & Constants ---
let isMuted = false;
export const CUSTOM_FLASHCARDS_KEY = 'brainPowerCustomFlashcards';
export const builtInFlashcardData = {};

// --- Shared Functions ---

/**
 * Toggles the global mute state.
 * @returns {boolean} The new mute state.
 */
export function toggleMute() {
    isMuted = !isMuted;
    return isMuted;
}

/**
 * Plays a sound file if the application is not muted.
 * @param {string} soundFile - The path to the audio file.
 */
export function playSound(soundFile) {
    if (!isMuted) {
        new Audio(soundFile).play().catch(e => console.error("Could not play sound:", e));
    }
}

/**
 * Retrieves all flashcard decks, combining built-in and custom ones from localStorage.
 * @returns {object} An object containing all available flashcard decks.
 */
export function getAvailableFlashcardDecks() {
    const customDecks = JSON.parse(localStorage.getItem(CUSTOM_FLASHCARDS_KEY) || '{}');
    return { ...builtInFlashcardData, ...customDecks };
}

/**
 * Populates all relevant <select> elements with flashcard categories.
 */
export function updateAllFlashcardCategorySelects() {
    const allDecks = getAvailableFlashcardDecks();
    const selects = [
        document.getElementById('flashcard-category'),
        document.getElementById('whats-missing-category'),
        document.getElementById('fm-set-select'),
        document.getElementById('bingo-list-select'),
        document.getElementById('spinner-flashcard-select'),
        document.getElementById('spinner-flashcard-select_fs') // <-- ADDED for fullscreen
    ];

    selects.forEach(selectElement => {
        if (!selectElement) return;

        const currentVal = selectElement.value;
        const isManager = selectElement.id === 'fm-set-select';
        const isBingo = selectElement.id === 'bingo-list-select';
        const isSpinner = selectElement.id === 'spinner-flashcard-select' || selectElement.id === 'spinner-flashcard-select_fs'; // <-- UPDATED
        
        let firstOptionText = isManager ? '-- Create New Set --' : 'Select a category';
        if (isBingo) firstOptionText = '-- Custom List Below --';
        if (isSpinner) firstOptionText = '-- Manual List --'; // <-- UPDATED

        let firstOptionValue = '';
        if (isBingo) firstOptionValue = 'custom';
        
        selectElement.innerHTML = `<option value="${firstOptionValue}">${firstOptionText}</option>`;

        for (const category in allDecks) {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            selectElement.appendChild(option);
        }

        // Try to restore previous selection
        selectElement.value = currentVal;
        if (!selectElement.value && selectElement.options.length > 0) {
            selectElement.selectedIndex = 0;
        }
    });
}