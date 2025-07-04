// js/tools/flashcard-manager.js

import { CUSTOM_FLASHCARDS_KEY, getAvailableFlashcardDecks, updateAllFlashcardCategorySelects } from '../utils.js';

export function initFlashcardManager() {
    const setSelect = document.getElementById('fm-set-select');
    const deleteSetBtn = document.getElementById('fm-delete-set-btn');
    const setNameInput = document.getElementById('fm-set-name');
    const cardTextInput = document.getElementById('fm-card-text');
    const cardImgInput = document.getElementById('fm-card-img');
    const addCardBtn = document.getElementById('fm-add-card-btn');
    const currentCardsContainer = document.getElementById('fm-current-cards');
    const saveSetBtn = document.getElementById('fm-save-set-btn');

    let currentCards = [];

    function updateCardListView() {
        currentCardsContainer.innerHTML = '';
        currentCards.forEach((card, index) => {
            const cardItem = document.createElement('div');
            cardItem.className = 'fm-card-item';

            const cardInfo = document.createElement('span');
            let displayText = card.text || '[Image Only]';
            if (card.image && card.text) {
                displayText += ' (image)';
            } else if (card.image && !card.text) {
                displayText = '[Image Only]';
            }
            cardInfo.textContent = displayText;

            const removeBtn = document.createElement('button');
            removeBtn.textContent = 'Remove';
            removeBtn.title = `Remove ${card.text || 'this card'}`;
            removeBtn.addEventListener('click', () => {
                currentCards.splice(index, 1);
                updateCardListView();
            });

            cardItem.appendChild(cardInfo);
            cardItem.appendChild(removeBtn);
            currentCardsContainer.appendChild(cardItem);
        });
    }

    function clearCardInputs() {
        cardTextInput.value = '';
        cardImgInput.value = '';
    }
    
    function loadSet() {
        const setName = setSelect.value;
        const allDecks = getAvailableFlashcardDecks();

        if (setName && allDecks[setName]) {
            setNameInput.value = setName;
            currentCards = JSON.parse(JSON.stringify(allDecks[setName]));
            deleteSetBtn.disabled = false;
        } else {
            setNameInput.value = '';
            currentCards = [];
            deleteSetBtn.disabled = true;
        }
        updateCardListView();
    }

    setSelect.addEventListener('change', loadSet);

    addCardBtn.addEventListener('click', () => {
        const text = cardTextInput.value.trim();
        const imgFile = cardImgInput.files[0];

        if (!text && !imgFile) {
            alert('Please provide text or an image for the card.');
            return;
        }

        const newCard = { text: text };

        if (imgFile) {
            const reader = new FileReader();
            reader.onload = (e) => {
                newCard.image = e.target.result;
                currentCards.push(newCard);
                updateCardListView();
                clearCardInputs();
            };
            reader.readAsDataURL(imgFile);
        } else {
            currentCards.push(newCard);
            updateCardListView();
            clearCardInputs();
        }
    });
    
    saveSetBtn.addEventListener('click', () => {
        const setName = setNameInput.value.trim();
        if (!setName) {
            alert('Please enter a name for the set.');
            return;
        }
        if (currentCards.length === 0) {
            alert('Please add at least one card to the set.');
            return;
        }

        const allDecks = getAvailableFlashcardDecks();
        allDecks[setName] = currentCards;

        // --- DIAGNOSTIC LOG ---
        console.log("--- FLASHCARD MANAGER: SAVING DATA ---");
        console.log("The 'currentCards' array being saved is:", JSON.parse(JSON.stringify(currentCards)));
        // --- END DIAGNOSTIC ---

        localStorage.setItem(CUSTOM_FLASHCARDS_KEY, JSON.stringify(allDecks));

        alert(`Set "${setName}" saved successfully!`);
        updateAllFlashcardCategorySelects();
        setSelect.value = setName;
        deleteSetBtn.disabled = false;
    });

    deleteSetBtn.addEventListener('click', () => {
        const setName = setSelect.value;
        if (!setName) return;

        if (confirm(`Are you sure you want to delete the set "${setName}"? This cannot be undone.`)) {
            const allDecks = getAvailableFlashcardDecks();
            delete allDecks[setName];
            localStorage.setItem(CUSTOM_FLASHCARDS_KEY, JSON.stringify(allDecks));
            
            alert(`Set "${setName}" has been deleted.`);
            updateAllFlashcardCategorySelects();
            loadSet();
        }
    });

    loadSet();
}