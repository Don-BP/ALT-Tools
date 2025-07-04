// js/tools/flashcards.js

import { getAvailableFlashcardDecks } from '../utils.js';

export function initFlashcards() {
    const categorySelect = document.getElementById('flashcard-category');
    const flashcardFront = document.querySelector('.flashcard-front');
    const flashcardBack = document.querySelector('.flashcard-back');
    const prevBtn = document.getElementById('flashcard-prev');
    const randomBtn = document.getElementById('flashcard-random');
    const nextBtn = document.getElementById('flashcard-next');

    let currentDeck = [];
    let currentIndex = 0;
    let activeFace = 'front'; 

    function loadCategory(category) {
        const allDecks = getAvailableFlashcardDecks();
        // FIX: Make a deep copy to prevent other tools from modifying the data.
        currentDeck = allDecks[category] ? JSON.parse(JSON.stringify(allDecks[category])) : [];
        currentIndex = 0;
        
        // --- DIAGNOSTIC LOG ---
        console.log(`--- DIGITAL FLASHCARDS: LOADING '${category}' ---`);
        if (currentDeck.length > 0) {
            console.log("The first card in the loaded deck is:", currentDeck[0]);
        } else {
            console.log("The deck is empty or could not be loaded.");
        }
        // --- END DIAGNOSTIC ---

        showCard(true);
    }

    function updateCardFace(faceElement, cardData) {
        faceElement.innerHTML = '';
        if (!cardData) {
            faceElement.textContent = 'Select a category';
            return;
        }

        if (cardData.image) {
            const img = document.createElement('img');
            img.src = cardData.image;
            img.alt = cardData.text || 'Flashcard Image';
            faceElement.appendChild(img);
        }
        
        if (cardData.text) {
            const text = document.createElement('div');
            text.textContent = cardData.text;
            faceElement.appendChild(text);
        }
    }

    function showCard(isInitial = false) {
        if (currentDeck.length === 0) {
            updateCardFace(flashcardFront, null);
            flashcardFront.classList.add('active');
            flashcardBack.classList.remove('active');
            activeFace = 'front';
            return;
        }
        
        const cardData = currentDeck[currentIndex];

        if (isInitial) {
            updateCardFace(flashcardFront, cardData);
            flashcardFront.classList.add('active');
            flashcardBack.classList.remove('active');
            activeFace = 'front';
        } else {
            const targetFace = activeFace === 'front' ? flashcardBack : flashcardFront;
            const sourceFace = activeFace === 'front' ? flashcardFront : flashcardBack;
            
            updateCardFace(targetFace, cardData);
            sourceFace.classList.remove('active');
            targetFace.classList.add('active');
            activeFace = activeFace === 'front' ? 'back' : 'front';
        }
    }

    categorySelect.addEventListener('change', (e) => loadCategory(e.target.value));
    nextBtn.addEventListener('click', () => {
        if (currentDeck.length === 0) return;
        currentIndex = (currentIndex + 1) % currentDeck.length;
        showCard();
    });
    prevBtn.addEventListener('click', () => {
        if (currentDeck.length === 0) return;
        currentIndex = (currentIndex - 1 + currentDeck.length) % currentDeck.length;
        showCard();
    });
    randomBtn.addEventListener('click', () => {
        if (currentDeck.length <= 1) return;
        let newIndex;
        do { newIndex = Math.floor(Math.random() * currentDeck.length); } while (newIndex === currentIndex);
        currentIndex = newIndex;
        showCard();
    });
    
    if (categorySelect.value) {
        loadCategory(categorySelect.value);
    }
}