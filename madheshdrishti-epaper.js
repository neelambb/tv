const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbws6ETredBh962H75HTlkpm7eISFyIGQENm_lLq55bFwTGA5QNkOvL0MKnmlQvbeU0/exec";
let allFiles = []; 
let displayedCount = 0; 
const BATCH_SIZE = 9; 

function escapeHTML(str) {
    return (str || '').replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

async function fetchAndInit() {
    try {
        const response = await fetch(SCRIPT_URL);
        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error("Invalid response format");
        }
        
        allFiles = data.sort((a, b) => {
            const timeA = new Date(a.createdTime || a.date || 0).getTime();
            const timeB = new Date(b.createdTime || b.date || 0).getTime();
            return timeB - timeA;
        });

        document.getElementById('status-msg').style.display = 'none';
        renderBatch(); 
    } catch (err) {
        document.getElementById('status-msg').innerHTML = "डाटा लोड गर्न सकिएन। कृपया रिफ्रेस गर्नुहोस्।";
    }
}

function createCardHTML(file) {
    const safeName = escapeHTML(file.name);
    return `
        <a href="${file.url}" target="_blank" rel="noopener noreferrer" class="drive-card">
            <div class="thumb-wrapper">
                <img src="https://drive.google.com/thumbnail?id=${file.id}&sz=w1000" 
                     alt="${safeName}" 
                     loading="lazy" 
                     onerror="this.onerror=null; this.src='https://placehold.co/400x300?text=No+Preview';">
                <div class="file-name-overlay">${safeName}</div>
            </div>
        </a>
    `;
}

function renderBatch() {
    const mainContainer = document.getElementById('main-gallery-container');
    const nextBatch = allFiles.slice(displayedCount, displayedCount + BATCH_SIZE);
    
    if (nextBatch.length > 0) {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'grid-group';
        groupDiv.innerHTML = nextBatch.map(createCardHTML).join('');
        mainContainer.appendChild(groupDiv);
    }

    displayedCount += nextBatch.length;
    updateButtonVisibility();
}

function updateButtonVisibility() {
    const btn = document.getElementById('load-more-btn');
    btn.style.display = (displayedCount < allFiles.length) ? 'inline-block' : 'none';
}

function handleLoadMore() {
    renderBatch();
}

fetchAndInit();
