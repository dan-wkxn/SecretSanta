//checks if user name is stored
const STORAGE_KEY = 'secretSantaUserName';
const STORAGE_KEY_NAMES = 'secretSantaNames';

const nameEntryView = document.getElementById('nameEntryView');
const drawingView = document.getElementById('drawingView');
const nameForm = document.getElementById('nameForm');
const userNameInput = document.getElementById('userName');
const displayName = document.getElementById('displayName');
const drawButton = document.getElementById('drawButton');
const result = document.getElementById('result');
const drawNameElement = document.getElementById('drawName');
const resetButton = document.getElementById('resetButton');


//checks on load if user name already exists
window.addEventListener('DOMContentLoaded', () => {
    const savedName = localStorage.getItem(STORAGE_KEY);

    if (savedName) {
        showDrawingView(savedName);
    } else {
        showNameEntryView();
    }
});

nameForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = userNameInput.value.trim();

    if (name) {
        //save name to storage
        localStorage.setItem(STORAGE_KEY, name);
        
        //add name to participants list
        addNameToParticipants(name);

        //switch to drawing view
        showDrawingView(name);
    }
});

drawButton.addEventListener('click', () => {
    drawName();
});

resetButton.addEventListener('click', () => {
    if (confirm('Bist du dir sicher?')) {
        localStorage.removeItem(STORAGE_KEY);
        userNameInput.value = '';
        showNameEntryView();
    }
})

function showNameEntryView() {
    nameEntryView.classList.remove('hidden');
    drawingView.classList.add('hidden');
    result.classList.add('hidden');
    userNameInput.focus();
}

function showDrawingView(name) {
    nameEntryView.classList.add('hidden');
    drawingView.classList.remove('hidden');
    displayName.textContent = name;
    result.classList.add('hidden');
}

function addNameToParticipants(name) {
    // Get current participants list
    const storedNames = localStorage.getItem(STORAGE_KEY_NAMES);
    const names = storedNames ? JSON.parse(storedNames) : [];
    
    // Check if name already exists (case-insensitive)
    const nameExists = names.some(existingName => 
        existingName.toLowerCase() === name.toLowerCase()
    );
    
    // Add name if it doesn't exist
    if (!nameExists) {
        names.push(name);
        localStorage.setItem(STORAGE_KEY_NAMES, JSON.stringify(names));
    }
}

function drawName() {
    const savedName = localStorage.getItem(STORAGE_KEY);
    
    // Get names from localStorage
    const storedNames = localStorage.getItem(STORAGE_KEY_NAMES);
    const names = storedNames ? JSON.parse(storedNames) : [];
    
    const availableNames = names.filter(name =>
        name.toLowerCase() !== savedName.toLowerCase()
    );

    if (availableNames.length === 0) {
        alert('Es ist noch kein Name verfügbar');
        return;
    }

    const randomIndex = Math.floor(Math.random() * availableNames.length);
    const selectedName = availableNames[randomIndex];

    drawNameElement.textContent = selectedName;
    result.classList.remove('hidden');

    drawButton.disabled = true;
    drawButton.textContent = 'Schon gezogen';
}
