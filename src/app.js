// API key is handled by the backend - no key needed here

// DOM Elements
const taskInput = document.getElementById('taskInput');
const generateBtn = document.getElementById('generateBtn');
const btnText = document.getElementById('btnText');
const loader = document.getElementById('loader');
const resultContainer = document.getElementById('resultContainer');
const sopResult = document.getElementById('sopResult');
const saveBtn = document.getElementById('saveBtn');
const saveChangesBtn = document.getElementById('saveChangesBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const editBanner = document.getElementById('editBanner');
const editingTitleDisplay = document.getElementById('editingTitleDisplay');
const generatorTitle = document.getElementById('generatorTitle');
const taskInputLabel = document.getElementById('taskInputLabel');
const sopList = document.getElementById('sopList');
const emptyState = document.getElementById('emptyState');
const sopModal = document.getElementById('sopModal');
const modalTitle = document.getElementById('modalTitle');
const modalContent = document.getElementById('modalContent');
const closeModal = document.getElementById('closeModal');
const deleteSopBtn = document.getElementById('deleteSopBtn');
const copyBtn = document.getElementById('copyBtn');

let currentGeneratedSop = null;
let activeSopId = null;
let isEditing = false;
let editingId = null;

/**
 * Formats the raw text from Gemini into HTML.
 * Converts markdown-like syntax (headers, lists) into clean HTML.
 */
function formatSopContent(text) {
    let html = text
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^\* (.*$)/gim, '<li>$1</li>')
        .replace(/^- (.*$)/gim, '<li>$1</li>')
        .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');

    if (html.includes('<li>')) {
        html = html.replace(/(<li>.*<\/li>)/gms, '<ul>$1</ul>');
    }

    return `<p>${html}</p>`;
}

/**
 * Enters Editing Mode for a specific SOP.
 * Loads the SOP data into the main generator area.
 */
function enterEditMode(sop) {
    isEditing = true;
    editingId = sop.id;

    editBanner.classList.remove('hidden');
    editingTitleDisplay.textContent = sop.title;
    generatorTitle.textContent = 'Edit SOP';
    taskInputLabel.textContent = 'SOP Title';
    
    taskInput.value = sop.title;
    sopResult.innerHTML = sop.content;
    sopResult.contentEditable = "true";
    
    resultContainer.classList.remove('hidden');
    saveBtn.classList.add('hidden');
    saveChangesBtn.classList.remove('hidden');
    generateBtn.classList.add('hidden');

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Exits Editing Mode and resets the UI.
 */
function exitEditMode() {
    isEditing = false;
    editingId = null;

    editBanner.classList.add('hidden');
    generatorTitle.textContent = 'Create New SOP';
    taskInputLabel.textContent = 'What task do you need an SOP for?';
    taskInput.value = '';
    sopResult.innerHTML = '';
    sopResult.contentEditable = "false";
    
    resultContainer.classList.add('hidden');
    saveBtn.classList.remove('hidden');
    saveChangesBtn.classList.add('hidden');
    generateBtn.classList.remove('hidden');
}

/**
 * Calls the backend which then calls the Gemini API to generate an SOP.
 * The API key is stored securely on the server, not in the browser.
 */
async function generateSOP() {
    if (isEditing) exitEditMode();

    const task = taskInput.value.trim();
    if (!task) return;

    generateBtn.disabled = true;
    btnText.textContent = 'Generating...';
    loader.classList.remove('hidden');
    resultContainer.classList.add('hidden');

    try {
        // Call our own backend instead of Gemini directly
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ task })
        });

        const data = await response.json();
        const text = data.text;

        const formattedHtml = formatSopContent(text);
        
        sopResult.innerHTML = formattedHtml;
        sopResult.contentEditable = "false";
        resultContainer.classList.remove('hidden');
        resultContainer.scrollIntoView({ behavior: 'smooth' });

        const titleMatch = text.match(/^# (.*)/);
        const title = titleMatch ? titleMatch[1] : task;

        currentGeneratedSop = {
            title: title,
            content: formattedHtml
        };

    } catch (error) {
        console.error('Generation failed:', error);
        alert('Failed to generate SOP. Please try again.');
    } finally {
        generateBtn.disabled = false;
        btnText.textContent = 'Generate SOP';
        loader.classList.add('hidden');
    }
}

/**
 * Saves the currently generated SOP to the backend.
 */
async function saveSOP() {
    if (!currentGeneratedSop) return;

    try {
        const response = await fetch('/api/sops', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(currentGeneratedSop)
        });

        if (response.ok) {
            const savedSop = await response.json();
            addSopToList(savedSop);
            resultContainer.classList.add('hidden');
            taskInput.value = '';
            currentGeneratedSop = null;
        }
    } catch (error) {
        console.error('Save failed:', error);
        alert('Failed to save SOP.');
    }
}

/**
 * Saves changes to an existing SOP by calling the PUT endpoint on the backend.
 */
async function saveChanges() {
    if (!isEditing || !editingId) return;

    const updatedSop = {
        title: taskInput.value.trim(),
        content: sopResult.innerHTML
    };

    try {
        const response = await fetch(`/api/sops/${editingId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedSop)
        });

        if (response.ok) {
            exitEditMode();
            loadSOPs();
        }
    } catch (error) {
        console.error('Update failed:', error);
        alert('Failed to update SOP.');
    }
}

/**
 * Fetches all saved SOPs from the backend and populates the dashboard.
 */
async function loadSOPs() {
    try {
        const response = await fetch('/api/sops');
        const sops = await response.json();
        
        sopList.innerHTML = '';
        if (sops.length === 0) {
            sopList.appendChild(emptyState);
        } else {
            sops.forEach(addSopToList);
        }
    } catch (error) {
        console.error('Load failed:', error);
    }
}

/**
 * Adds a single SOP item to the dashboard list.
 */
function addSopToList(sop) {
    if (emptyState.parentNode === sopList) {
        sopList.removeChild(emptyState);
    }

    const item = document.createElement('div');
    item.className = 'bg-slate-50 hover:bg-indigo-50 p-4 rounded-xl border border-slate-200 cursor-pointer transition-all hover:border-indigo-200 group animate-fade-in flex justify-between items-center';
    item.innerHTML = `
        <div class="flex-1 min-w-0">
            <h4 class="font-semibold text-slate-800 group-hover:text-indigo-700 truncate">${sop.title}</h4>
            <p class="text-xs text-slate-400 mt-1">${new Date(sop.createdAt).toLocaleDateString()}</p>
        </div>
        <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button class="view-btn p-1 text-slate-400 hover:text-indigo-600" title="View">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            </button>
        </div>
    `;
    
    item.onclick = (e) => {
        if (e.target.closest('.view-btn')) {
            openSopModal(sop);
        } else {
            enterEditMode(sop);
        }
    };
    
    sopList.prepend(item);
}

/**
 * Opens a modal to view the full details of a saved SOP.
 */
function openSopModal(sop) {
    activeSopId = sop.id;
    modalTitle.textContent = sop.title;
    modalContent.innerHTML = sop.content;
    sopModal.classList.remove('hidden');
    sopModal.classList.add('flex');
    document.body.style.overflow = 'hidden';
}

/**
 * Closes the SOP detail modal.
 */
function closeSopModal() {
    sopModal.classList.add('hidden');
    sopModal.classList.remove('flex');
    document.body.style.overflow = '';
    activeSopId = null;
}

/**
 * Deletes the currently viewed SOP from the backend.
 */
async function deleteSOP() {
    if (!activeSopId) return;

    if (!confirm('Are you sure you want to delete this SOP?')) return;

    try {
        const response = await fetch(`/api/sops/${activeSopId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            closeSopModal();
            loadSOPs();
        }
    } catch (error) {
        console.error('Delete failed:', error);
    }
}

// Event Listeners
generateBtn.onclick = generateSOP;
saveBtn.onclick = saveSOP;
saveChangesBtn.onclick = saveChanges;
cancelEditBtn.onclick = exitEditMode;
closeModal.onclick = closeSopModal;
deleteSopBtn.onclick = deleteSOP;

// Copy the generated SOP text to clipboard
copyBtn.onclick = () => {
    const text = sopResult.innerText;
    navigator.clipboard.writeText(text).then(() => {
        copyBtn.textContent = 'Copied! ✓';
        copyBtn.classList.add('bg-emerald-200');
        setTimeout(() => {
            copyBtn.textContent = 'Copy to Clipboard';
            copyBtn.classList.remove('bg-emerald-200');
        }, 2000);
    });
};

sopModal.onclick = (e) => {
    if (e.target === sopModal) closeSopModal();
};

// Initial Load
loadSOPs();