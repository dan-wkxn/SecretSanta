// Local storage keys (for current user only)
const STORAGE_KEY_GROUP = 'secretSantaGroupCode';
const STORAGE_KEY_USER = 'secretSantaUserName';

// Real-time subscription
let participantSubscription = null;

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
const groupNumber = document.getElementById('groupNumber');
const participantStatus = document.getElementById('participantStatus');

// Check if user already joined a group
const savedGroupCode = localStorage.getItem(STORAGE_KEY_GROUP);
const savedUserName = localStorage.getItem(STORAGE_KEY_USER);

if (savedGroupCode && savedUserName) {
    // Hide entry views
    groupEntryView.style.display = 'none';
    nameEntryView.style.display = 'none';
    // Show drawing view
    drawingView.style.display = 'block';
    // Optionally, set display name and group info
    displayName.textContent = savedUserName;
    groupInfo.textContent = `Gruppe: ${savedGroupCode}`;
} else {
    // Show entry views as normal
    groupEntryView.style.display = 'block';
    nameEntryView.style.display = 'none';
    drawingView.style.display = 'none';
}

document.getElementById(`createGroupBtn`).addEventListener('click', function() {
    const groupSize = parseInt(document.getElementById('groupSizeInput').value, 10);

    let participants = [];
    for (let i = 1; i <= groupSize; i++) {
        participants.push('Person ' + i);
    }

    let shuffled = [...participants];
    shuffled.sort(() => Math.random() - 0.5);

    let assignments = {};
    for (let i = 0; i < groupSize; i++) {
        assignments[participants[i]] = shuffled[(i + 1) % groupSize];
    }

    console.log(assignments);
});

function generateGroupCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Supabase Functions
async function createGroup(groupCode) {
    const { data, error } = await supabase
        .from('groups')
        .insert([{ group_code: groupCode }])
        .select()
        .single();
    
    if (error && error.code !== '23505') { // Ignore duplicate key error
        console.error('Error creating group:', error);
        return false;
    }
    return true;
}

async function checkGroupExists(groupCode) {
    const { data, error } = await supabase
        .from('groups')
        .select('group_code')
        .eq('group_code', groupCode)
        .single();

    if (error) {
        console.error('Error checking group:', error);
        return false;
    }
    
    return !!data;
}

async function addParticipant(groupCode, name, isReady = false) {
    const { data, error } = await supabase
        .from('participants')
        .insert([{ 
            group_code: groupCode, 
            name: name,
            is_ready: isReady 
        }])
        .select()
        .single();
    
    if (error) {
        // If duplicate, update the existing record
        if (error.code === '23505') {
            const { data: updateData, error: updateError } = await supabase
                .from('participants')
                .update({ is_ready: isReady })
                .eq('group_code', groupCode)
                .eq('name', name)
                .select()
                .single();
            
            if (updateError) {
                console.error('Error updating participant:', updateError);
                return false;
            }
            return updateData;
        }
        console.error('Error adding participant:', error);
        return false;
    }
    return data;
}

async function getParticipants(groupCode) {
    const { data, error } = await supabase
        .from('participants')
        .select('*')
        .eq('group_code', groupCode)
        .order('created_at', { ascending: true });
    
    if (error) {
        console.error('Error fetching participants:', error);
        return [];
    }
    return data || [];
}

async function saveDrawing(groupCode, drawerName, drawnName) {
    const { data, error } = await supabase
        .from('drawings')
        .insert([{ 
            group_code: groupCode,
            drawer_name: drawerName,
            drawn_name: drawnName
        }])
        .select()
        .single();
    
    if (error) {
        console.error('Error saving drawing:', error);
        return false;
    }
    return data;
}

function subscribeToParticipants(groupCode, callback) {
    // Unsubscribe from previous subscription
    if (participantSubscription) {
        supabase.removeChannel(participantSubscription);
    }
    
    // Subscribe to changes
    participantSubscription = supabase
        .channel(`participants:${groupCode}`)
        .on('postgres_changes', 
            { 
                event: '*', 
                schema: 'public', 
                table: 'participants',
                filter: `group_code=eq.${groupCode}`
            }, 
            callback
        )
        .subscribe();
    
    return participantSubscription;
}


//checks on load if user name already exists
window.addEventListener('DOMContentLoaded', () => {
    // Check if there's a group code in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const urlGroupCode = urlParams.get('code');
    
    if (urlGroupCode) {
        // User came from a shared link, auto-join the group
        const code = urlGroupCode.toUpperCase().trim();
        if (code.length === 6) {
            localStorage.setItem(STORAGE_KEY_GROUP, code);
            // Clean up URL by removing the code parameter
            window.history.replaceState({}, document.title, window.location.pathname);
            showNameEntryView();
            return;
        }
    }
    
    const savedGroup = localStorage.getItem(STORAGE_KEY_GROUP);
    const savedName = localStorage.getItem(STORAGE_KEY_USER);

    if (savedGroup && savedName) {
        showDrawingView(savedName, savedGroup);
        // Set up real-time subscription
        subscribeToParticipants(savedGroup, (payload) => {
            updateParticipantStatus(savedGroup);
            checkIfReadyToDraw(savedGroup);
        });
    } else if (savedGroup) {
        showNameEntryView();
    } else {
        showGroupEntryView();
    }
});

createGroupBtn.addEventListener('click', async () => {
    const groupCode = generateGroupCode();
    
    // Create group in Supabase
    const created = await createGroup(groupCode);
    if (!created) {
        alert('Fehler beim Erstellen der Gruppe. Bitte versuche es erneut.');
        return;
    }
    
    localStorage.setItem(STORAGE_KEY_GROUP, groupCode);

    groupCodeElement.textContent = groupCode;
    if (groupNumber) {
        groupNumber.textContent = `Gruppe #${groupCode}`;
    }
    groupCodeDisplay.classList.remove('hidden');

    setTimeout(() => {
        showNameEntryView();
    }, 4000);
});

joinGroupForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const groupCode = groupCodeInput.value.trim().toUpperCase();

    if (groupCode.length === 6) {
        // Check if group exists
        const exists = await checkGroupExists(groupCode);
        if (!exists) {
            alert('Gruppe nicht gefunden. Bitte überprüfe den Code.');
            return;
        }
        
        localStorage.setItem(STORAGE_KEY_GROUP, groupCode);
        groupCodeInput.value = '';
        showNameEntryView();
    } else {
        alert('Bitte gib einen gültigen 6-stelligen Code ein');
    }
});

nameForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = userNameInput.value.trim();
    const groupCode = localStorage.getItem(STORAGE_KEY_GROUP);

    if (name && groupCode) {
        // Save name to localStorage for quick access
        localStorage.setItem(STORAGE_KEY_USER, name);
        
        // Add participant to Supabase and mark as ready
        const added = await addParticipant(groupCode, name, true);
        if (!added) {
            alert('Fehler beim Hinzufügen des Namens. Bitte versuche es erneut.');
            return;
        }

        // Switch to drawing view
        showDrawingView(name, groupCode);
        
        // Set up real-time subscription
        subscribeToParticipants(groupCode, (payload) => {
            updateParticipantStatus(groupCode);
            checkIfReadyToDraw(groupCode);
        });
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
    // Include group code in URL so clicking the link auto-joins the group
    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}?code=${groupCode}`;

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

async function showDrawingView(name, groupCode) {
    groupEntryView.classList.add('hidden');
    nameEntryView.classList.add('hidden');
    drawingView.classList.remove('hidden');
    displayName.textContent = name;
    groupInfo.textContent = `Gruppe: ${groupCode}`;
    result.classList.add('hidden');
    
    // Update participant status
    await updateParticipantStatus(groupCode);
    
    // Check if drawing should be enabled
    await checkIfReadyToDraw(groupCode);
    
    // Check if user already drew
    const { data: existingDrawing } = await supabase
        .from('drawings')
        .select('*')
        .eq('group_code', groupCode)
        .eq('drawer_name', name)
        .single();
    
    if (existingDrawing) {
        drawNameElement.textContent = existingDrawing.drawn_name;
        result.classList.remove('hidden');
        drawButton.disabled = true;
        drawButton.textContent = 'Schon gezogen';
    }
}

async function updateParticipantStatus(groupCode) {
    const participants = await getParticipants(groupCode);
    const total = participants.length;
    const ready = participants.filter(p => p.is_ready).length;
    
    if (participantStatus) {
        if (total === 0) {
            participantStatus.textContent = 'Warte auf Teilnehmer...';
        } else {
            participantStatus.textContent = `${ready} von ${total} Teilnehmern bereit`;
        }
    }
}

async function checkIfReadyToDraw(groupCode) {
    const participants = await getParticipants(groupCode);
    const total = participants.length;
    const ready = participants.filter(p => p.is_ready).length;
    const allReady = total > 0 && total === ready;
    
    if (drawButton) {
        if (allReady && total > 1) {
            drawButton.disabled = false;
            drawButton.textContent = 'Zieh ein Name';
        } else {
            drawButton.disabled = true;
            if (total <= 1) {
                drawButton.textContent = 'Warte auf weitere Teilnehmer';
            } else {
                drawButton.textContent = `Warte auf ${total - ready} Teilnehmer`;
            }
        }
    }
}

// This function is now handled by addParticipant in Supabase
// Keeping for backwards compatibility but it's not used directly
async function addNameToParticipants(name, groupCode) {
    return await addParticipant(groupCode, name, true);
}

async function drawName() {
    const savedName = localStorage.getItem(STORAGE_KEY_USER);
    const groupCode = localStorage.getItem(STORAGE_KEY_GROUP);

    if (!groupCode) {
        alert('Keine Gruppe gefunden.');
        return;
    }
    
    // Get participants from Supabase
    const participants = await getParticipants(groupCode);
    const names = participants.map(p => p.name);
    const ready = participants.filter(p => p.is_ready);
    
    // Check if all participants are ready
    const allReady = names.length > 0 && names.length === ready.length;
    
    if (!allReady || names.length <= 1) {
        const missing = names.length - ready.length;
        alert(`Noch nicht alle Teilnehmer haben ihren Namen eingegeben. Es fehlen noch ${missing} Teilnehmer.`);
        await updateParticipantStatus(groupCode);
        await checkIfReadyToDraw(groupCode);
        return;
    }
    
    // Check if user has already drawn
    const { data: existingDrawing } = await supabase
        .from('drawings')
        .select('*')
        .eq('group_code', groupCode)
        .eq('drawer_name', savedName)
        .single();
    
    if (existingDrawing) {
        // User already drew, show their result
        drawNameElement.textContent = existingDrawing.drawn_name;
        result.classList.remove('hidden');
        drawButton.disabled = true;
        drawButton.textContent = 'Schon gezogen';
        return;
    }
    
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

    // Save drawing to Supabase
    const saved = await saveDrawing(groupCode, savedName, selectedName);
    if (!saved) {
        alert('Fehler beim Speichern der Ziehung. Bitte versuche es erneut.');
        return;
    }

    drawNameElement.textContent = selectedName;
    result.classList.remove('hidden');

    drawButton.disabled = true;
    drawButton.textContent = 'Schon gezogen';
}
