# Mega Link Generator API

A simple Node.js API for working with public Mega file URLs.

## Requirements

- Node.js 18 or newer
- npm

## Install

Open a terminal inside this folder:

```bash
cd api
npm install
````

## Start

```bash
npm start
```

The API will run on:

```text
http://localhost:3000
```

## Development

```bash
npm run dev
```

## Endpoints

### GET /health

Checks whether the API is online.

Example:

```text
GET /health
```

Response:

```json
{
    "success": true,
    "status": "online"
}
```

---

### POST /api/mega

Generate information and a direct download URL from a Mega file URL.

Request:

```json
{
    "url": "https://mega.nz/file/FILE_ID#FILE_KEY"
}
```

Response:

```json
{
    "success": true,
    "filename": "example.zip",
    "size": 123456789,
    "url": "https://..."
}
```

---

### POST /api/decode

Decode a generated Worker-style direct link back into its Mega URL.

Request:

```json
{
    "url": "https://mega.wldbs.workers.dev/download?url=..."
}
```

Response:

```json
{
    "success": true,
    "url": "https://mega.nz/file/..."
}
```

---

### GET /api/test

Tests a generated download URL.

Example:

```text
/api/test?url=https%3A%2F%2Fexample.com%2Ffile
```

Response:

```json
{
    "success": true,
    "status": 200,
    "contentLength": "123456789",
    "contentType": "application/octet-stream"
}
```

## Using the API from another website

```js
fetch("https://YOUR-API-DOMAIN/api/mega", {
    method: "POST",

    headers: {
        "Content-Type": "application/json"
    },

    body: JSON.stringify({
        url: "https://mega.nz/file/..."
    })
})
.then(response => response.json())
.then(data => {

    if (data.success) {
        console.log(data.filename);
        console.log(data.size);
        console.log(data.url);
    }

});
```

## CORS

CORS is enabled so other websites can communicate with the API.

For a public production API, you may want to restrict the allowed origins.

## Important

Mega download URLs can be temporary.

Do not assume that a generated URL will remain valid forever.

Only use the API with files you are allowed to access or distribute.

```