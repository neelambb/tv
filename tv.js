/**
 * YouTube Multi-Website Global Script
 * यो कोड गिटहबमा सुरक्षित रहनेछ।
 */

let nextPageToken = '';

// वेबसाइटबाट कन्फिगरेसन तान्ने वा डिफल्ट सेट गर्ने
const CONFIG = window.DNN_YOUTUBE_CONFIG || {
    apiKey: '',
    channelId: '',
    results: 6,
    containerId: 'video-container-2',
    buttonId: 'btn-load-more-2'
};

/**
 * १. परिमार्जित CSS (पिक्सेल-परफेक्ट र स्मार्ट स्टिकी फिक्स)
 */
function injectStyles() {
    const css = `
        #${CONFIG.containerId} {
            display: grid;
            grid-template-columns: 1.8fr 1.2fr;
            grid-gap: 24px;
            max-width: 1300px;
            margin: 0 auto;
            padding-top: 0px;
            align-items: start;
        }
        .main-player-area { 
            order: 1; 
            position: -webkit-sticky;
            position: sticky; 
            top: 100px; 
            z-index: 40;
            margin-top: 0px;
            transition: all 0.3s ease;
        }
        .sidebar-wrapper { order: 2; display: flex; flex-direction: column; }
        .sidebar-list { display: flex; flex-direction: column; gap: 12px; margin-top: 0px; }
        .video-item-main iframe { width: 100%; height: 460px; background: #000; border: none; border-radius: 12px; }
        .thumb-box { position: relative; width: 120px; aspect-ratio: 16/9; flex-shrink: 0; }
        .play-overlay {
            position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
            width: 26px; height: 26px; background: rgba(220, 38, 38, 0.9); border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
        }
        .play-overlay::after { content: ''; border-style: solid; border-width: 4px 0 4px 7px; border-color: transparent transparent transparent white; margin-left: 1px; }
        @media (max-width: 991px) {
            #${CONFIG.containerId} { grid-template-columns: 1fr; margin-top: 15px; }
            .main-player-area { position: relative; top: 0; }
            .video-item-main iframe { height: 240px; }
        }
    `;
    const styleSheet = document.createElement("style");
    styleSheet.innerText = css;
    document.head.appendChild(styleSheet);
}

/**
 * २. मल्टि-फङ्सन: भिडियो प्ले र स्मार्ट स्क्रोलिङ
 */
function playVideo(vId, vTitle) {
    const mainArea = document.querySelector('.main-player-area');
    const iframe = mainArea.querySelector('iframe');
    const titleDiv = mainArea.querySelector('.main-title-text');

    if (iframe) {
        iframe.src = `https://www.youtube.com/embed/${vId}?autoplay=1&rel=0`;
        if (titleDiv) titleDiv.innerText = decodeURIComponent(vTitle);
        mainArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

/**
 * ३. कार्ड जेनेरेटर
 */
function getCardHtml(item) {
    if(!item) return '';
    const vId = item.id.videoId;
    const cleanTitle = encodeURIComponent(item.snippet.title).replace(/'/g, "%27");
    
    return `
        <div class="video-card flex gap-3 cursor-pointer bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700/60 p-2 rounded-xl shadow-sm hover:border-red-600 dark:hover:border-red-500 transition duration-300" onclick="playVideo('${vId}', '${cleanTitle}')">
            <div class="thumb-box overflow-hidden rounded-lg">
                <div class="play-overlay shadow-sm"></div>
                <img src="${item.snippet.thumbnails.medium.url}" class="w-full h-full object-cover">
            </div>
            <div class="title-box text-[14px] font-bold text-gray-800 dark:text-slate-200 leading-snug line-clamp-2 pr-1 font-['Mukta']">
                ${item.snippet.title}
            </div>
        </div>`;
}

/**
 * ४. मुख्य फेच फङ्सन
 */
async function loadYouTubeContent() {
    let container = document.getElementById(CONFIG.containerId);
    if (!container || !CONFIG.apiKey || !CONFIG.channelId) return;

    const btn = document.getElementById(CONFIG.buttonId);
    if (btn) btn.innerText = 'लोड हुँदैछ...';

    const apiURL = `https://www.googleapis.com/youtube/v3/search?key=${CONFIG.apiKey}&channelId=${CONFIG.channelId}&part=snippet,id&order=date&maxResults=${CONFIG.results}&type=video${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;

    try {
        const response = await fetch(apiURL);
        const data = await response.json();

        if (data.items && data.items.length > 0) {
            nextPageToken = data.nextPageToken || '';
            const v = data.items;
            
            if (!document.querySelector('.sidebar-list')) {
                let playerHtml = `
                    <div class="main-player-area bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/60">
                        <div class="video-item-main">
                            <iframe src="https://www.youtube.com/embed/${v[0].id.videoId}?rel=0" allowfullscreen class="shadow-md"></iframe>
                            <div class="main-title-text mt-4 text-[18px] md:text-[22px] font-[900] text-gray-900 dark:text-white leading-tight font-['Mukta']">
                                ${v[0].snippet.title}
                            </div>
                        </div>
                    </div>`;

                let sidebarHtml = `
                    <div class="sidebar-wrapper">
                        <div class="sidebar-list">
                            ${v.slice(1).map(item => getCardHtml(item)).join('')}
                        </div>
                        <div class="load-more-container mt-4 text-center">
                            <button id="${CONFIG.buttonId}" onclick="loadYouTubeContent()" class="w-full py-3 bg-gray-100 dark:bg-slate-800 hover:bg-red-700 hover:text-white dark:hover:bg-red-650 text-gray-800 dark:text-slate-200 text-sm font-bold rounded-xl transition duration-300 shadow-sm font-['Mukta']">
                                थप लोड गर्नुहोस्
                            </button>
                        </div>
                    </div>`;

                container.innerHTML = playerHtml + sidebarHtml;
            } else {
                const list = document.querySelector('.sidebar-list');
                v.forEach(item => {
                    const div = document.createElement('div');
                    div.innerHTML = getCardHtml(item);
                    list.appendChild(div.firstElementChild);
                });
                
                if (btn) btn.innerText = 'थप लोड गर्नुहोस्';
            }

            if (!nextPageToken && btn) btn.parentElement.remove();
        }
    } catch (err) {
        console.error('Error:', err);
        if (btn) btn.innerText = 'पुन: प्रयास गर्नुहोस्';
    }
}

// कार्यान्वयन
(function init() {
    injectStyles();
    if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', loadYouTubeContent);
    } else {
        loadYouTubeContent();
    }
})();
