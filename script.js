const API = 'https://mega.wldbs.workers.dev/api/info';
let directLink = '',
    fileSizeBytes = 0,
    currentSpeed = 300;
async function getFileInfo() {
    const url = document.getElementById('megaUrl').value.trim();
    if (!url) return showError('Enter URL');
    if (!url.startsWith('https://mega.nz/file/')) return showError('Invalid Mega URL');
    hideError();
    document.getElementById('loading').style.display = 'block';
    document.getElementById('speedStatus').style.display = 'none';
    document.getElementById('results').style.display = 'none';
    const statusEl = document.getElementById('speedStatus');
    statusEl.style.display = 'block';
    statusEl.textContent = 'Testing speed...';
    try {
        currentSpeed = await testLibreSpeed(statusEl);
        const fd = new FormData();
        fd.append('megaurl', url);
        const res = await fetch(API, {
            method: 'POST',
            body: fd
        });
        const data = await res.json();
        if (data.ok) {
            showResults(data, url)
        } else {
            showError(data.error || 'Failed')
        }
    } catch (e) {
        showError('Error: ' + e.message)
    } finally {
        document.getElementById('loading').style.display = 'none'
    }
}
async function testLibreSpeed(statusEl) {
    try {
        await fetch('https://librespeed.org/backend/getIP.php?json=true');
        const testSize = 2000000;
        const startTime = Date.now();
        const requests = [];
        for (let i = 0; i < 3; i++) {
            requests.push(fetch('https://librespeed.org/backend/garbage.php?ckSize=' + testSize + '&t=' + Date.now() + i, {
                cache: 'no-store'
            }).catch(() => ({})))
        }
    }
    await Promise.all(requests);
    const endTime = Date.now();
    const timeSec = (endTime - startTime) / 1000;
    const mbps = (48 / timeSec).toFixed(1);
    if (mbps > 10) {
        statusEl.textContent = 'Speed: ' + mbps + ' Mbps';
        return parseFloat(mbps)
    } else {
        return await fetchSpeedTest(statusEl)
    }
} catch (e) {
    return await fetchSpeedTest(statusEl)
}
}
async function fetchSpeedTest(statusEl) {
    statusEl.textContent = 'Testing speed (fallback)...';
    const testFiles = [{
        url: 'https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js',
        size: 70000
    }, {
        url: 'https://cdn.jsdelivr.net/npm/react@18/umd/react.production.min.js',
        size: 45000
    }, {
        url: 'https://cdn.jsdelivr.net/npm/vue@3/dist/vue.global.min.js',
        size: 350000
    }, {
        url: 'https://cdn.jsdelivr.net/npm/jquery@3/dist/jquery.min.js',
        size: 30000
    }];
    const filesWithCacheBuster = testFiles.map(f => ({
        ...f,
        url: f.url + '?v=' + Date.now() + Math.random().toString(36).substr(2, 5)
    }));
    const startTime = Date.now();
    await Promise.all(filesWithCacheBuster.map(f => fetch(f.url, {
        cache: 'no-store'
    }).catch(() => ({}))));
    const endTime = Date.now();
    const timeSec = (endTime - startTime) / 1000;
    const totalSizeBytes = filesWithCacheBuster.reduce((sum, f) => sum + f.size, 0);
    const mbps = (totalSizeBytes * 8 / timeSec / 1000000).toFixed(1);
    statusEl.textContent = 'Speed: ' + mbps + ' Mbps';
    return parseFloat(mbps)
}

function showResults(data, url) {
    document.getElementById('fileName').textContent = data.file_name || 'Unknown';
    document.getElementById('fileSize').textContent = formatBytes(data.file_size || 0);
    fileSizeBytes = data.file_size || 0;
    directLink = 'https://mega.wldbs.workers.dev/download?url=' + btoa(url);
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

function copyLink() {
    const i = document.getElementById('directLink');
    i.select();
    document.execCommand('copy');
    const b = event.target;
    b.textContent = 'Copied!';
    setTimeout(() => {
        b.textContent = 'Copy'
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
