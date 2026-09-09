const http = require('http');
const fs = require('fs');
const path = require('path');
const directDownload = require('./direct-download');

const root = path.resolve(__dirname, '..');
const port = Number(process.env.PORT || 8000);
const mimeTypes = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8'
};

function sendJson(response, statusCode, payload) {
    response.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store'
    });
    response.end(JSON.stringify(payload));
}

function serveStatic(request, response, requestUrl) {
    const requestedPath = requestUrl.pathname === '/' ? '/index.html' : requestUrl.pathname;
    const filePath = path.resolve(root, '.' + requestedPath);

    if (!filePath.startsWith(root + path.sep)) {
        sendJson(response, 403, { error: 'Forbidden.' });
        return;
    }

    fs.readFile(filePath, (error, content) => {
        if (error) {
            sendJson(response, error.code === 'ENOENT' ? 404 : 500, {
                error: error.code === 'ENOENT' ? 'Not found.' : 'Could not read file.'
            });
            return;
        }

        response.writeHead(200, {
            'Content-Type': mimeTypes[path.extname(filePath)] || 'application/octet-stream',
            'Cache-Control': 'no-cache'
        });
        response.end(content);
    });
}

const server = http.createServer(async (request, response) => {
    const requestUrl = new URL(request.url, 'http://localhost');

    if (requestUrl.pathname === '/api/direct-download') {
        const apiResponse = {
            setHeader: (name, value) => response.setHeader(name, value),
            status: statusCode => {
                apiResponse.statusCode = statusCode;
                return apiResponse;
            },
            json: payload => sendJson(response, apiResponse.statusCode || 200, payload),
            redirect: (statusCode, location) => {
                response.writeHead(statusCode, { Location: location });
                response.end();
            }
        };

        await directDownload({
            method: request.method,
            query: Object.fromEntries(requestUrl.searchParams)
        }, apiResponse);
        return;
    }

    serveStatic(request, response, requestUrl);
});

server.listen(port, () => {
    console.log(`Mega Direct Download running at http://localhost:${port}`);
});
