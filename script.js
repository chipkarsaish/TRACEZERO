const desktop = document.getElementById('desktop');
const taskbar = document.getElementById('taskbar');
const startmenu = document.getElementById('startmenu');
const hiddenBtn = document.getElementById('hiddenIconsBtn');
const hiddenPopup = document.getElementById('hiddenIconsPopup');

const DESKTOP_W = 1920;
const DESKTOP_H = 1080;

let startOpen = false;
let popupOpen = false;

/* ── Scale desktop to fit viewport, maintaining 16:9 aspect ratio ── */
function scaleDesktop() {
    const scale = Math.min(
        window.innerWidth / DESKTOP_W,
        window.innerHeight / DESKTOP_H
    );
    const offsetX = (window.innerWidth - DESKTOP_W * scale) / 2;
    const offsetY = (window.innerHeight - DESKTOP_H * scale) / 2;

    desktop.style.transform = `scale(${scale})`;
    desktop.style.left = offsetX + 'px';
    desktop.style.top = offsetY + 'px';
}

/* Run on load and every time the window is resized */
scaleDesktop();
window.addEventListener('resize', scaleDesktop);

/* ── F11: toggle fullscreen ── */
document.addEventListener('keydown', function (e) {
    if (e.key === 'F11') {
        e.preventDefault();   // stop browser's own F11 behaviour
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => { });
        } else {
            document.exitFullscreen().catch(() => { });
        }
    }
});

/* Re-scale whenever fullscreen state changes */
document.addEventListener('fullscreenchange', function () {
    scaleDesktop();
    const hint = document.getElementById('fullscreen-hint');
    if (hint) {
        hint.style.display = document.fullscreenElement ? 'none' : 'block';
    }
});

/* ── Chevron: toggle hidden-icons popup ── */
hiddenBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    popupOpen = !popupOpen;
    hiddenPopup.classList.toggle('visible', popupOpen);
    hiddenBtn.classList.toggle('active', popupOpen);
    if (popupOpen && startOpen) {
        startOpen = false;
        startmenu.style.bottom = '-1100px';
    }
    if (popupOpen && window.tzTrayOpen && window.tzCloseTray) {
        window.tzCloseTray();
    }
});

/* ── Taskbar: toggle Start Menu ── */
taskbar.addEventListener('click', function (e) {
    if (hiddenBtn.contains(e.target) || hiddenPopup.contains(e.target)) return;

    // Check if the click was inside the TRACEZERO icon or tray
    const tzIcon = document.getElementById('tzTaskbarIcon');
    const tzMenu = document.getElementById('tzTrayMenu');
    if (tzIcon && tzIcon.contains(e.target)) return;
    if (tzMenu && tzMenu.contains(e.target)) return;

    startOpen = !startOpen;
    startmenu.style.bottom = startOpen ? '80px' : '-1100px';
    if (startOpen && popupOpen) {
        popupOpen = false;
        hiddenPopup.classList.remove('visible');
        hiddenBtn.classList.remove('active');
    }
    if (startOpen && window.tzTrayOpen && window.tzCloseTray) {
        window.tzCloseTray();
    }
});

/* ── Click outside: close both ── */
document.addEventListener('click', function (e) {
    if (popupOpen && !hiddenPopup.contains(e.target) && !hiddenBtn.contains(e.target)) {
        popupOpen = false;
        hiddenPopup.classList.remove('visible');
        hiddenBtn.classList.remove('active');
    }
    if (startOpen && !taskbar.contains(e.target)) {
        startOpen = false;
        startmenu.style.bottom = '-1100px';
    }
});

/* ════════════════════════════════════════════
   FILE MANAGER — open / close / minimize / maximize
════════════════════════════════════════════ */
const fmWindow = document.getElementById('fmWindow');
const fmTitlebar = document.getElementById('fmTitlebar');
const fmResizeHandle = document.getElementById('fmResizeHandle');

let fmMaximized = false;
let fmSavedState = {};   // stores position/size before maximize

function openFm() {
    fmWindow.classList.add('open');
    fmWindow.style.display = 'flex';
}

function closeFm() {
    fmWindow.classList.remove('open');
    fmWindow.style.display = 'none';
    fmMaximized = false;
}

function minimizeFm() {
    fmWindow.classList.remove('open');
    fmWindow.style.display = 'none';
}

function maximizeFm() {
    if (!fmMaximized) {
        // Save current state
        fmSavedState = {
            top: fmWindow.style.top || '120px',
            left: fmWindow.style.left || '260px',
            width: fmWindow.style.width || '900px',
            height: fmWindow.style.height || '580px'
        };
        // Maximize to fill desktop (minus taskbar)
        fmWindow.style.top = '0';
        fmWindow.style.left = '0';
        fmWindow.style.width = '1920px';
        fmWindow.style.height = (1080 - 80) + 'px';   // 80px taskbar
        fmWindow.style.borderRadius = '0';
        fmMaximized = true;
    } else {
        // Restore
        fmWindow.style.top = fmSavedState.top;
        fmWindow.style.left = fmSavedState.left;
        fmWindow.style.width = fmSavedState.width;
        fmWindow.style.height = fmSavedState.height;
        fmWindow.style.borderRadius = '10px';
        fmMaximized = false;
    }
}

/* ── Drag to move (titlebar) ── */
let isDragging = false;
let dragStartX, dragStartY, winStartX, winStartY;

fmTitlebar.addEventListener('mousedown', function (e) {
    if (e.target.closest('.fm-win-controls')) return;   // don't drag on buttons
    if (fmMaximized) return;
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    winStartX = fmWindow.offsetLeft;
    winStartY = fmWindow.offsetTop;
    e.preventDefault();
});

document.addEventListener('mousemove', function (e) {
    if (isDragging) {
        // Scale mouse movement by the inverse of the desktop scale
        const scale = parseFloat(desktop.style.transform.replace('scale(', '').replace(')', '')) || 1;
        const dx = (e.clientX - dragStartX) / scale;
        const dy = (e.clientY - dragStartY) / scale;
        fmWindow.style.left = Math.max(0, winStartX + dx) + 'px';
        fmWindow.style.top = Math.max(0, winStartY + dy) + 'px';
    }
    if (isResizing) {
        const scale = parseFloat(desktop.style.transform.replace('scale(', '').replace(')', '')) || 1;
        const dw = (e.clientX - resizeStartX) / scale;
        const dh = (e.clientY - resizeStartY) / scale;
        fmWindow.style.width = Math.max(500, resizeStartW + dw) + 'px';
        fmWindow.style.height = Math.max(320, resizeStartH + dh) + 'px';
    }
});

document.addEventListener('mouseup', function () {
    isDragging = false;
    isResizing = false;
});

/* ── Resize (bottom-right handle) ── */
let isResizing = false;
let resizeStartX, resizeStartY, resizeStartW, resizeStartH;

fmResizeHandle.addEventListener('mousedown', function (e) {
    isResizing = true;
    resizeStartX = e.clientX;
    resizeStartY = e.clientY;
    resizeStartW = fmWindow.offsetWidth;
    resizeStartH = fmWindow.offsetHeight;
    e.preventDefault();
    e.stopPropagation();
});

/* ════════════════════════════════════════════
   TRACEZERO WINDOW — open / close / drag / resize
════════════════════════════════════════════ */
const tzWindow = document.getElementById('tzWindow');
const tzTitlebar = document.getElementById('tzTitlebar');
const tzResizeHandle = document.getElementById('tzResizeHandle');

let tzMaximized = false;
let tzSavedState = {};

function openTZ() {
    tzWindow.classList.add('open');
    tzWindow.style.display = 'flex';
}
function closeTZ() {
    tzWindow.classList.remove('open');
    tzWindow.style.display = 'none';
    tzMaximized = false;
}
function minimizeTZ() {
    tzWindow.classList.remove('open');
    tzWindow.style.display = 'none';
}
function maximizeTZ() {
    if (!tzMaximized) {
        tzSavedState = {
            top: tzWindow.style.top || '140px',
            left: tzWindow.style.left || '320px',
            width: tzWindow.style.width || '1500px',
            height: tzWindow.style.height || '900px'
        };
        tzWindow.style.top = '0';
        tzWindow.style.left = '0';
        tzWindow.style.width = '1920px';
        tzWindow.style.height = (1080 - 80) + 'px';
        tzWindow.style.borderRadius = '0';
        tzMaximized = true;
    } else {
        tzWindow.style.top = tzSavedState.top;
        tzWindow.style.left = tzSavedState.left;
        tzWindow.style.width = tzSavedState.width;
        tzWindow.style.height = tzSavedState.height;
        tzWindow.style.borderRadius = '10px';
        tzMaximized = false;
    }
}

/* Drag */
let tzDragging = false;
let tzDragX, tzDragY, tzWinX, tzWinY;

tzTitlebar.addEventListener('mousedown', function (e) {
    if (e.target.closest('.tz-win-controls')) return;
    if (tzMaximized) return;
    tzDragging = true;
    tzDragX = e.clientX;
    tzDragY = e.clientY;
    tzWinX = tzWindow.offsetLeft;
    tzWinY = tzWindow.offsetTop;
    e.preventDefault();
});

document.addEventListener('mousemove', function (e) {
    if (tzDragging) {
        const scale = parseFloat(desktop.style.transform.replace('scale(', '').replace(')', '')) || 1;
        tzWindow.style.left = Math.max(0, tzWinX + (e.clientX - tzDragX) / scale) + 'px';
        tzWindow.style.top = Math.max(0, tzWinY + (e.clientY - tzDragY) / scale) + 'px';
    }
    if (tzResizing) {
        const scale = parseFloat(desktop.style.transform.replace('scale(', '').replace(')', '')) || 1;
        tzWindow.style.width = Math.max(480, tzResW + (e.clientX - tzResX) / scale) + 'px';
        tzWindow.style.height = Math.max(300, tzResH + (e.clientY - tzResY) / scale) + 'px';
    }
});

document.addEventListener('mouseup', function () { tzDragging = false; tzResizing = false; });

/* Resize */
let tzResizing = false, tzResX, tzResY, tzResW, tzResH;

tzResizeHandle.addEventListener('mousedown', function (e) {
    tzResizing = true;
    tzResX = e.clientX; tzResY = e.clientY;
    tzResW = tzWindow.offsetWidth; tzResH = tzWindow.offsetHeight;
    e.preventDefault(); e.stopPropagation();
});

/* ════════════════════════════════════════════
   TRACEZERO APP — INTERIOR LOGIC
════════════════════════════════════════════ */

/* ── Screen Switcher ── */
function tzSwitchScreen(name) {
    document.querySelectorAll('.tza-screen').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.tza-sidebar-item').forEach(b => b.classList.remove('active'));
    const screen = document.getElementById('tz-screen-' + name);
    if (screen) screen.classList.add('active');
    const btn = document.querySelector('.tza-sidebar-item[data-screen="' + name + '"]');
    if (btn) btn.classList.add('active');
    if (name === 'dashboard') tzAnimateGauge();
}

/* ── Gauge Animation ── */
function tzAnimateGauge() {
    const arc = document.getElementById('tzGaugeArc');
    const pct = document.getElementById('tzGaugePct');
    if (!arc || !pct) return;
    const risk = 72;
    const circumference = 2 * Math.PI * 62; // r=62 → ~390
    setTimeout(() => {
        arc.style.strokeDasharray = (circumference * risk / 100) + ' ' + circumference;
        let count = 0;
        const timer = setInterval(() => {
            count++;
            pct.textContent = count + '%';
            if (count >= risk) clearInterval(timer);
        }, 25);
    }, 300);
}

/* ── Terminal Feed ── */
const tzLogs = [
    { c: 'g', t: '[✓] System initialized — Zero-Knowledge Mode active' },
    { c: 'y', t: '[+] Scanning Desktop folder: 14 files queued' },
    { c: 'r', t: '[!] GPS Coordinates found: IMG_20240214.jpg → 19.07°N 72.87°E' },
    { c: 'r', t: '[!] Author: Sandesh Chipkar — Identity tag detected' },
    { c: 'r', t: '[!] Email: user@private.com — Exposure risk: CRITICAL' },
    { c: 'g', t: '[✓] Processing: document_report.pdf' },
    { c: 'y', t: '[+] Device fingerprint: iPhone 14 Pro (iOS 17.2)' },
    { c: 'g', t: '[✓] Auto-cleaned: vacation_photo.heic — GPS stripped' },
    { c: 'r', t: '[!] EXIF Software: Adobe Lightroom 7.0 — Version leak' },
    { c: 'g', t: '[✓] Sanitized: quarterly_report.docx — Author removed' },
    { c: 'g', t: '[✓] SHA-256 integrity verified — File content preserved' },
    { c: 'y', t: '[+] Batch scan: 221 / 243 files processed' },
    { c: 'r', t: '[!] Serial Number embedded: Canon EOS R5 — Device ID risk' },
    { c: 'g', t: '[✓] Certified safe: presentation_final_clean.pptx' },
];

let tzLogIdx = 0;
let tzLogInterval = null;

function tzStartTerminal() {
    const terminal = document.getElementById('tzTerminal');
    if (!terminal) return;
    if (tzLogInterval) return; // already running
    tzLogInterval = setInterval(() => {
        if (tzLogIdx >= tzLogs.length) tzLogIdx = 0;
        const entry = tzLogs[tzLogIdx++];
        const div = document.createElement('div');
        div.className = 'tl ' + entry.c;
        div.textContent = entry.t;
        terminal.appendChild(div);
        terminal.scrollTop = terminal.scrollHeight;
        // Keep max 30 lines
        while (terminal.children.length > 30) terminal.removeChild(terminal.firstChild);
    }, 1800);
}

/* ── File Handling ── */
function tzHandleFiles(event) {
    event.preventDefault();
    const dropzone = document.getElementById('tzDropzone');
    if (dropzone) dropzone.classList.remove('hover');
    const files = event.dataTransfer ? event.dataTransfer.files : null;
    if (files && files.length) tzDisplayFiles(files);
}

function tzLoadFiles(files) {
    tzDisplayFiles(files);
}

function tzDisplayFiles(files) {
    const dropzone = document.getElementById('tzDropzone');
    const scanBody = document.getElementById('tzScanBody');
    const fileList = document.getElementById('tzFileList');
    if (!scanBody || !fileList) return;
    dropzone.style.display = 'none';
    scanBody.style.display = 'flex';
    fileList.innerHTML = '';
    const icons = { 'pdf': '📄', 'jpg': '🖼', 'jpeg': '🖼', 'png': '🖼', 'docx': '📝', 'doc': '📝', 'mp4': '🎬', 'zip': '📦', 'heic': '🖼' };
    Array.from(files).forEach(f => {
        const ext = f.name.split('.').pop().toLowerCase();
        const div = document.createElement('div');
        div.className = 'tza-file-item';
        div.innerHTML = `<span>${icons[ext] || '📄'}</span><span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${f.name}</span>`;
        fileList.appendChild(div);
    });
    // Animate the risk score bar
    const fill = document.getElementById('tzScoreFill');
    if (fill) { fill.style.width = '0'; setTimeout(() => { fill.style.transition = 'width 1.2s ease'; fill.style.width = '72%'; }, 100); }
}

/* ── Clean & Sanitize ── */
let tzCleaning = false;
function tzRunClean() {
    if (tzCleaning) return;
    tzCleaning = true;
    const wrap = document.getElementById('tzShieldWrap');
    const label = document.getElementById('tzCleanLabel');
    const before = document.getElementById('tzHashBefore');
    const after = document.getElementById('tzHashAfter');
    const integrity = document.getElementById('tzIntegrity');
    const removed = document.getElementById('tzFieldsRemoved');
    const riskAfter = document.getElementById('tzRiskAfter');
    const certified = document.getElementById('tzCertified');

    if (wrap) wrap.classList.add('cleaning');
    if (label) label.textContent = 'Neutralizing Hidden Threats…';

    const rnd = () => Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const hashA = rnd() + rnd() + rnd() + rnd();

    setTimeout(() => {
        if (before) before.textContent = hashA.substring(0, 40) + '…';
    }, 600);

    setTimeout(() => {
        if (label) label.textContent = 'Stripping Metadata Fields…';
    }, 1400);

    setTimeout(() => {
        const hashB = rnd() + rnd() + rnd() + rnd();
        if (after) after.textContent = hashB.substring(0, 40) + '…';
        if (integrity) { integrity.textContent = '✅ VERIFIED'; integrity.style.color = '#4ade80'; }
        if (removed) { removed.textContent = 'GPS, Email, Author, Device, EXIF'; removed.style.color = '#fbbf24'; }
        if (riskAfter) { riskAfter.textContent = '2 / 100 (Non-critical only)'; riskAfter.style.color = '#4ade80'; }
        if (label) label.textContent = '✓ Sanitization Complete';
        if (wrap) wrap.classList.remove('cleaning');
        if (certified) certified.style.display = 'block';
        tzCleaning = false;
    }, 3200);
}

/* ── Folder Watch Toggle ── */
function tzToggleWatch(toggle) {
    const st = document.getElementById('tzWatchSt');
    if (!st) return;
    st.textContent = toggle.checked ? 'ACTIVE' : 'INACTIVE';
    st.style.color = toggle.checked ? '#22c55e' : '#e02020';
}

/* ── Theme Selector ── */
function tzSetTheme(el) {
    document.querySelectorAll('.tza-theme-opt').forEach(o => o.classList.remove('active'));
    el.classList.add('active');
}

/* ── Auto-start dashboard when window opens ── */
const _origOpenTZ = openTZ;
window.openTZ = function () {
    _origOpenTZ();
    setTimeout(() => {
        tzAnimateGauge();
        tzStartTerminal();
    }, 200);
};

/* ── TRACEZERO Tray Menu Logic ── */
let tzTrayOpen = false;
const tzTrayMenu = document.getElementById('tzTrayMenu');
const tzTaskbarIcon = document.getElementById('tzTaskbarIcon');

window.tzToggleTray = function (e) {
    if (e) e.stopPropagation();
    tzTrayOpen = !tzTrayOpen;
    if (tzTrayMenu) {
        tzTrayMenu.classList.toggle('visible', tzTrayOpen);
    }
    // close other menus
    if (tzTrayOpen && popupOpen) {
        popupOpen = false;
        hiddenPopup.classList.remove('visible');
        hiddenBtn.classList.remove('active');
    }
    if (tzTrayOpen && startOpen) {
        startOpen = false;
        startmenu.style.bottom = '-1100px';
    }
};

window.tzCloseTray = function () {
    tzTrayOpen = false;
    if (tzTrayMenu) {
        tzTrayMenu.classList.remove('visible');
    }
};

// Add to global click listener to close tz-tray if clicked outside
document.addEventListener('click', function (e) {
    if (tzTrayOpen && !tzTrayMenu.contains(e.target) && !tzTaskbarIcon.contains(e.target)) {
        tzCloseTray();
    }
});

