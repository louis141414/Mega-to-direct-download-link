```javascript
/*
    Change this to your API address.

    Local:
    http://localhost:3000

    Example production:
    https://api.example.com
*/

const API_URL = "http://localhost:3000";


let currentMode = "mega";


const urlInput = document.getElementById("urlInput");

const megaMode = document.getElementById("megaMode");
const directMode = document.getElementById("directMode");

const generateBtn = document.getElementById("generateBtn");
const copyBtn = document.getElementById("copyBtn");
const testBtn = document.getElementById("testBtn");
const downloadBtn = document.getElementById("downloadBtn");

const status = document.getElementById("status");

const result = document.getElementById("result");

const fileName = document.getElementById("fileName");
const fileSize = document.getElementById("fileSize");

const resultUrl = document.getElementById("resultUrl");
const estimatesList = document.getElementById("estimatesList");


function setStatus(message) {
    status.textContent = message;
}


function formatBytes(bytes) {

    if (!bytes || bytes <= 0) {
        return "Unknown";
    }

    const units = [
        "B",
        "KB",
        "MB",
        "GB",
        "TB"
    ];

    let index = 0;
    let value = bytes;

    while (value >= 1024 && index < units.length - 1) {
        value /= 1024;
        index++;
    }

    return `${value.toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
}


function formatTime(seconds) {

    if (!Number.isFinite(seconds)) {
        return "Unknown";
    }

    if (seconds < 60) {
        return `${Math.ceil(seconds)} sec`;
    }

    const minutes = Math.floor(seconds / 60);

    if (minutes < 60) {
        return `${minutes} min`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    return `${hours}h ${remainingMinutes}m`;
}


function showEstimates(size) {

    estimatesList.innerHTML = "";

    if (!size || size <= 0) {
        estimatesList.innerHTML =
            '<div class="estimate"><span>File size unavailable</span><span>—</span></div>';

        return;
    }

    const speeds = [
        {
            name: "10 Mbps",
            mbps: 10
        },
        {
            name: "25 Mbps",
            mbps: 25
        },
        {
            name: "50 Mbps",
            mbps: 50
        },
        {
            name: "100 Mbps",
            mbps: 100
        },
        {
            name: "500 Mbps",
            mbps: 500
        },
        {
            name: "1 Gbps",
            mbps: 1000
        }
    ];

    for (const speed of speeds) {

        const bytesPerSecond =
            (speed.mbps * 1000 * 1000) / 8;

        const seconds =
            size / bytesPerSecond;

        const row = document.createElement("div");

        row.className = "estimate";

        row.innerHTML = `
            <span>${speed.name}</span>
            <span>${formatTime(seconds)}</span>
        `;

        estimatesList.appendChild(row);
    }
}


async function generate() {

    const value = urlInput.value.trim();

    if (!value) {
        setStatus("Enter a URL first");
        return;
    }

    setStatus("Working...");
    result.classList.add("hidden");

    try {

        if (currentMode === "direct") {

            const response = await fetch(
                `${API_URL}/api/decode`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        url: value
                    })
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.error || "Could not decode URL"
                );
            }

            urlInput.value = data.url;

            setStatus("Mega URL decoded");

            return;
        }


        const response = await fetch(
            `${API_URL}/api/mega`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    url: value
                })
            }
        );


        const data = await response.json();


        if (!response.ok || !data.success) {
            throw new Error(
                data.error || "Could not generate link"
            );
        }


        fileName.textContent =
            data.filename || "Unknown";

        fileSize.textContent =
            formatBytes(data.size);

        resultUrl.value =
            data.url;

        showEstimates(data.size);

        result.classList.remove("hidden");

        setStatus("Link generated");

    } catch (error) {

        setStatus(error.message);

    }
}


async function copyResult() {

    if (!resultUrl.value) {
        setStatus("Generate a link first");
        return;
    }

    await navigator.clipboard.writeText(
        resultUrl.value
    );

    setStatus("Copied");
}


async function testLink() {

    if (!resultUrl.value) {
        setStatus("Generate a link first");
        return;
    }

    setStatus("Testing link...");

    try {

        const response = await fetch(
            `${API_URL}/api/test?url=${encodeURIComponent(resultUrl.value)}`
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.error || "Link test failed"
            );
        }

        setStatus(
            `Link works — ${data.status}`
        );

    } catch (error) {

        setStatus(
            `Test failed: ${error.message}`
        );
    }
}


function download() {

    if (!resultUrl.value) {
        setStatus("Generate a link first");
        return;
    }

    window.location.href =
        resultUrl.value;
}


function setMode(mode) {

    currentMode = mode;

    if (mode === "mega") {

        megaMode.classList.add("active");
        directMode.classList.remove("active");

        urlInput.placeholder =
            "https://mega.nz/file/...";

    } else {

        directMode.classList.add("active");
        megaMode.classList.remove("active");

        urlInput.placeholder =
            "https://mega.wldbs.workers.dev/download?url=...";

    }

    result.classList.add("hidden");
    setStatus("");
}


megaMode.addEventListener(
    "click",
    () => setMode("mega")
);

directMode.addEventListener(
    "click",
    () => setMode("direct")
);

generateBtn.addEventListener(
    "click",
    generate
);

copyBtn.addEventListener(
    "click",
    copyResult
);

testBtn.addEventListener(
    "click",
    testLink
);

downloadBtn.addEventListener(
    "click",
    download
);

urlInput.addEventListener(
    "keydown",
    event => {

        if (event.key === "Enter") {
            generate();
        }

    }
);
```
