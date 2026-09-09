const API = 'https://mega.wldbs.workers.dev/api/info';
const DIRECT_DOWNLOAD_API = 'api/direct-download';
let directLink = '',
    fileSizeBytes = 0,
    currentSpeed = 300;

function isMegaLink(url) {
    try {
        const parsedUrl = new URL(url);
        const hostname = parsedUrl.hostname.toLowerCase();
        const isMegaPage = ['mega.nz', 'www.mega.nz'].includes(hostname) &&
            parsedUrl.pathname.startsWith('/file/');
        return parsedUrl.protocol === 'https:' && (isMegaPage || isMegaDirectLink(url));
    } catch (e) {
        return false;
    }
}

function isMegaDirectLink(url) {
    try {
        const parsedUrl = new URL(url);
        return parsedUrl.protocol === 'https:' &&
            parsedUrl.hostname.toLowerCase() === 'mega.wldbs.workers.dev' &&
            parsedUrl.pathname === '/download' &&
            parsedUrl.searchParams.has('url');
    } catch (e) {
        return false;
    }
}

function isPcloudLink(url) {
    try {
        const parsedUrl = new URL(url);
        return parsedUrl.protocol === 'https:' &&
            ['e.pcloud.link', 'u.pcloud.link'].includes(parsedUrl.hostname.toLowerCase()) &&
            parsedUrl.pathname === '/publink/show';
    } catch (e) {
        return false;
    }
}

async function getFileInfo() {
    const url = document.getElementById('megaUrl').value.trim();
    const generateButton = document.querySelector('.input-row button');
    if (!url) return showError('Enter a Mega URL.');

    let parsedUrl;
    try {
        parsedUrl = new URL(url);
    } catch (e) {
        return showError('Invalid Mega URL.');
    }

    if (!isMegaLink(url) && !isPcloudLink(url)) {
        return showError('Use a valid Mega or pCloud public link.');
    }

    hideError();
    document.getElementById('loading').style.display = 'block';
    document.getElementById('results').style.display = 'none';
    const statusEl = document.getElementById('speedStatus');
    statusEl.style.display = 'block';
    statusEl.textContent = 'Preparing...';
    generateButton.disabled = true;

    try {
        currentSpeed = getLocalSpeedEstimate(statusEl);
        if (isPcloudLink(url) || isMegaDirectLink(url)) {
            showResults({
                file_name: isMegaDirectLink(url) ? 'Mega direct download' : 'pCloud public file',
                file_size: 0
            }, url);
        } else {
            const fd = new FormData();
            fd.append('megaurl', url);
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 15000);
            let response;
            try {
                response = await fetch(API, {
                    method: 'POST',
                    body: fd,
                    signal: controller.signal
                });
            } finally {
                clearTimeout(timeout);
            }

            if (!response.ok) {
                throw new Error('The Mega service returned HTTP ' + response.status + '.');
            }

            let data;
            try {
                data = await response.json();
            } catch (e) {
                throw new Error('The Mega service returned an invalid response.');
            }

            if (!data || typeof data !== 'object') {
                throw new Error('The Mega service returned invalid data.');
            }

            if (data.ok) {
                showResults(data, url)
            } else {
                showError(data.error || 'The Mega service could not read this file.')
            }
        }
    } catch (e) {
        if (e.name === 'AbortError') {
            showError('The Mega service took too long to respond. Try again later.');
        } else if (e instanceof TypeError) {
            showError('Could not reach the Mega service. Check your connection or CORS settings.');
        } else {
            showError(e.message || 'Something went wrong.');
        }
    } finally {
        document.getElementById('loading').style.display = 'none';
        generateButton.disabled = false;
    }
}

function getLocalSpeedEstimate(statusEl) {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const speed = connection && Number.isFinite(connection.downlink) ? connection.downlink : 100;
    const roundedSpeed = Math.max(1, speed);
    statusEl.textContent = 'Estimated speed: ' + roundedSpeed.toFixed(1) + ' Mbps';
    return roundedSpeed;
}

function showResults(data, url) {
    document.getElementById('fileName').textContent = data.file_name || 'Unknown';
    document.getElementById('fileSize').textContent = formatBytes(data.file_size || 0);
    fileSizeBytes = data.file_size || 0;
    directLink = DIRECT_DOWNLOAD_API + '?link=' + encodeURIComponent(url);
    document.getElementById('directLink').value = directLink;
    document.getElementById('userSpeed').textContent = currentSpeed.toFixed(1) + ' Mbps';
    document.getElementById('results').style.display = 'block';
    updateDownloadTime()
}

function updateDownloadTime() {
    if (fileSizeBytes === 0) return;
    const timeSec = (fileSizeBytes * 8) / (currentSpeed * 1000000);
    document.getElementById('downloadTime').textContent = formatTime(timeSec)
}

function formatBytes(b) {
    if (b === 0) return '0B';
    const k = 1024,
        sizes = ['B', 'KB', 'MB', 'GB', 'TB'],
        i = Math.floor(Math.log(b) / Math.log(k));
    return (b / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i]
}

function formatTime(s) {
    if (s < 60) return '~' + Math.round(s) + 's';
    const mins = Math.floor(s / 60),
        secs = Math.round(s % 60);
    if (mins < 60) return '~' + mins + 'm ' + secs + 's';
    const hours = Math.floor(s / 3600),
        remainingMins = Math.round((s % 3600) / 60);
    return '~' + hours + 'h ' + remainingMins + 'm'
}

function downloadFile() {
    if (directLink) window.location.href = directLink
}

function copyLink(button) {
    const i = document.getElementById('directLink');
    i.select();
    document.execCommand('copy');
    button.textContent = 'Copied!';
    setTimeout(() => {
        button.textContent = 'Copy'
    }, 1500)
}

function showError(m) {
    const e = document.getElementById('error');
    e.textContent = m;
    e.style.display = 'block'
}

function hideError() {
    document.getElementById('error').style.display = 'none'
}
document.getElementById('megaUrl').addEventListener('keypress', e => {
    if (e.key === 'Enter') getFileInfo()
});
