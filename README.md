# Mega Link Generator

A simple Mega link generator with a separate Node.js API.

The frontend is intentionally lightweight and can be used on almost any static website.

## Features

- Mega → Direct
- Direct → Mega
- File name detection
- File size detection
- Download time estimates
- Download button
- Copy button
- Link testing
- Responsive design
- Standalone API
- CORS support
- Easy integration with other websites

## Project structure

```text
mega-link-generator/
│
├── index.html
├── style.css
├── script.js
│
├── api/
│   ├── index.js
│   ├── package.json
│   └── README.md
│
├── README.md
├── LICENSE
└── .gitignore
````

## How to run the API

Make sure Node.js 18 or newer is installed.

Open a terminal:

```bash
cd api
npm install
npm start
```

The API will start on:

```text
http://localhost:3000
```

## Run the website

The website can be opened using a local web server.

For example, with VS Code and Live Server.

Then make sure `script.js` contains:

```js
const API_URL = "http://localhost:3000";
```

## Production setup

After deploying the API, change:

```js
const API_URL = "http://localhost:3000";
```

to your API domain:

```js
const API_URL = "https://api.example.com";
```

The frontend does not need to be hosted together with the API.

You can host the frontend on:

* GitHub Pages
* Cloudflare Pages
* Netlify
* Vercel
* Your own website

The API can run separately on a Node.js-compatible server.

## API

### Generate a direct link

```http
POST /api/mega
Content-Type: application/json
```

Body:

```json
{
    "url": "https://mega.nz/file/..."
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

### Decode

```http
POST /api/decode
Content-Type: application/json
```

Body:

```json
{
    "url": "https://mega.wldbs.workers.dev/download?url=..."
}
```

### Test

```http
GET /api/test?url=...
```

### Health

```http
GET /health
```

## Example integration

Any website can call the API:

```js
async function generateMegaLink(megaUrl) {

    const response = await fetch(
        "https://YOUR-API-DOMAIN/api/mega",
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                url: megaUrl
            })
        }
    );

    return await response.json();
}
```

Then:

```js
const result =
    await generateMegaLink(
        "https://mega.nz/file/..."
    );

if (result.success) {

    console.log(
        "Filename:",
        result.filename
    );

    console.log(
        "Size:",
        result.size
    );

    console.log(
        "Download:",
        result.url
    );

}
```

## License

MIT

```