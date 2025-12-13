//checks if user name is stored
const STORAGE_KEY_GROUP = 'secretSantaUserName';
const STORAGE_KEY_USER = 'secretSantaUserNames';

const groupEntryView = document.getElementById('groupEntryView');
const nameEntryView = document.getElementById('nameEntryView');
const drawingView = document.getElementById('drawingView');
const createGroupBtn = document.getElementById('createGroupBtn');
const joinGroupForm = document.getElementById('joinGroupForm');
const groupCodeInput = document.getElementById('groupCodeInput');
const groupCodeDisplay = document.getElementById('groupCodeDisplay');
const groupCodeElement = document.getElementById('groupCode');
const nameForm = document.getElementById('nameForm');
const userNameInput = document.getElementById('userName');
const displayName = document.getElementById('displayName');
const groupInfo = document.getElementById('groupInfo');
const drawButton = document.getElementById('drawButton');
const result = document.getElementById('result');
const drawNameElement = document.getElementById('drawName');
const resetButton = document.getElementById('resetButton');
const shareCodeBtn = document.getElementById('shareCodeBtn');

//get group specific storage key
function getGroupStorageKey(groupCode, key) {
    return `secretSanta_${groupCode}_${key}`;
}

function generateGroupCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}


//checks on load if user name already exists
window.addEventListener('DOMContentLoaded', () => {
    const savedGroup = localStorage.getItem(STORAGE_KEY_GROUP);
    const savedName = localStorage.getItem(STORAGE_KEY_USER);

    if (savedGroup && savedName) {
        showDrawingView(savedName, savedGroup);
    } else if (savedGroup) {
        showNameEntryView();
    } else {
        showGroupEntryView();
    }
});

createGroupBtn.addEventListener('click', () => {
    const groupCode = generateGroupCode();
    localStorage.setItem(STORAGE_KEY_GROUP, groupCode);

    groupCodeElement.textContent = groupCode;
    groupCodeDisplay.classList.remove('hidden');

    setTimeout(() => {
        showNameEntryView();
    }, 6000);
});

joinGroupForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const groupCode = groupCodeInput.value.trim().toUpperCase();

    if (groupCode.length === 6) {
        localStorage.setItem(STORAGE_KEY_GROUP, groupCode);
        groupCodeInput.value = '';
        showNameEntryView();
    } else {
        alert('Bitte gib einen gültigen 6-stelligen Code ein');
    }
});

nameForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = userNameInput.value.trim();
    const groupCode = localStorage.getItem(STORAGE_KEY_GROUP);

    if (name && groupCode) {
        //save name to storage
        localStorage.setItem(STORAGE_KEY_USER, name);
        
        //add name to participants list
        addNameToParticipants(name, groupCode);

        //switch to drawing view
        showDrawingView(name, groupCode);
    }
});

drawButton.addEventListener('click', () => {
    drawName();
});

// share code only in drawing view
if (shareCodeBtn) {
    shareCodeBtn.addEventListener('click', () => {
        const groupCode = localStorage.getItem(STORAGE_KEY_GROUP);
        if (groupCode) {
            shareGroupCode(groupCode);
        } else {
            alert('Kein Gruppen-Code gefunden.');
        }
    });
}

resetButton.addEventListener('click', () => {
    if (confirm('Bist du dir sicher?')) {
        localStorage.removeItem(STORAGE_KEY_GROUP);
        localStorage.removeItem(STORAGE_KEY_USER);
        userNameInput.value = '';
        groupCodeInput.value = '';
        groupCodeDisplay.classList.add('hidden');
        showGroupEntryView();
    }
});


function shareGroupCode(groupCode) {
    const shareText = `Tritt meiner Secret Santa Gruppe bei! Gruppen-Code: ${groupCode}`;
    const shareUrl = window.location.href;

    if (navigator.share) {
        navigator.share({
            title: 'Secret Santa Gruppe',
            text: shareText,
            url: shareUrl
        }).catch(err => {
            console.log('Error sharing:', err);
            copyToClipboard(shareText);
        });
    } else {
        copyToClipboard(shareText);
    }
}

function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            alert('Gruppen-Code wurde in die Zwischenablage kopiert!');
        }).catch(err => {
            console.log('Error copying to clipboard:', err);
            fallbackCopyToClipboard(text);
        });
    } else {
        fallbackCopyToClipboard(text);
    }
}

function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        document.execCommand('copy');
        alert('Gruppen-Code wurde in die Zwischenablage kopiert!');
    } catch (err) {
        console.log('Fallback copy failed:', err);
        alert(`Gruppen-Code: ${text.split('Code: ')[1]}`);
    }

    document.body.removeChild(textArea);
}

function showGroupEntryView() {
    groupEntryView.classList.remove('hidden');
    nameEntryView.classList.add('hidden');
    drawingView.classList.add('hidden');
    result.classList.add('hidden');
}

function showNameEntryView() {
    groupEntryView.classList.add('hidden');
    nameEntryView.classList.remove('hidden');
    drawingView.classList.add('hidden');
    result.classList.add('hidden');
    userNameInput.focus();
}

function showDrawingView(name, groupCode) {
    groupEntryView.classList.add('hidden');
    nameEntryView.classList.add('hidden');
    drawingView.classList.remove('hidden');
    displayName.textContent = name;
    groupInfo.textContent = `Gruppe: ${groupCode}`;
    result.classList.add('hidden');
}

function addNameToParticipants(name, groupCode) {
    // Get current participants list
    const storageKey = getGroupStorageKey(groupCode, 'names');
    const storedNames = localStorage.getItem(storageKey);
    const names = storedNames ? JSON.parse(storedNames) : [];
    
    // Check if name already exists (case-insensitive)
    const nameExists = names.some(existingName => 
        existingName.toLowerCase() === name.toLowerCase()
    );
    
    // Add name if it doesn't exist
    if (!nameExists) {
        names.push(name);
        localStorage.setItem(storageKey, JSON.stringify(names));
    }
}

function drawName() {
    const savedName = localStorage.getItem(STORAGE_KEY_USER);
    const groupCode = localStorage.getItem(STORAGE_KEY_GROUP);

    if (!groupCode) {
        alert('Keine Gruppe gefunden.');
        return;
    }
    
    // Get names from localStorage
    const storageKey = getGroupStorageKey(groupCode, 'names');
    const storedNames = localStorage.getItem(storageKey);
    const names = storedNames ? JSON.parse(storedNames) : [];
    
    // First filter: remove the user's own name
    let availableNames = names.filter(name =>
        name.toLowerCase() !== savedName.toLowerCase()
    );

    // Special rule: If user's name is a substring of another name,
    // they can ONLY draw that name (e.g., "Lin" can only draw "Linda")
    const savedNameLower = savedName.toLowerCase();
    const matchingName = availableNames.find(name => {
        const nameLower = name.toLowerCase();
        // Check if savedName is a substring of this name
        return nameLower.includes(savedNameLower) && nameLower !== savedNameLower;
    });

    if (matchingName) {
        // User can ONLY draw this matching name
        availableNames = [matchingName];
    } else {
        // Filter out names that contain another participant's name as substring
        // Only that specific participant can draw them
        availableNames = availableNames.filter(candidateName => {
            const candidateNameLower = candidateName.toLowerCase();
            
            // Check if this candidate name contains any other participant's name as substring
            for (const participantName of names) {
                const participantNameLower = participantName.toLowerCase();
                
                // Skip if it's the same name or the current user's name
                if (participantNameLower === candidateNameLower || 
                    participantNameLower === savedNameLower) {
                    continue;
                }
                
                // If candidate name contains another participant's name as substring
                // (e.g., "Linda" contains "Lin")
                if (candidateNameLower.includes(participantNameLower) && 
                    candidateNameLower !== participantNameLower) {
                    // Only that specific participant can draw it
                    // So if current user is NOT that participant, filter it out
                    if (savedNameLower !== participantNameLower) {
                        return false; // Not allowed - only the substring participant can draw
                    }
                }
            }
            
            return true; // Allow this name
        });
    }

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
