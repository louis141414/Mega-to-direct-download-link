# Mega Direct Download

A simple, lightweight web tool that converts Mega.nz file links into direct download links.  
It also tests your connection speed and estimates download time.

## Features

- Paste any `https://mega.nz/file/...` link
- Automatically fetches file name and size
- Measures your approximate download speed
- Shows estimated download time
- Generates a direct download link
- One-click download or copy the link
- Clean dark UI, mobile-friendly

## How to Use

1. Open `index.html` in any modern browser (or host it somewhere)
2. Paste a Mega.nz file URL
3. Click **Generate**
4. Wait a few seconds while it tests your speed and fetches file info
5. Click **Download Now** or copy the direct link

## Files

- `index.html` – Everything (HTML + CSS + JavaScript) in one file

## Technical Notes

- Uses a Cloudflare Worker (`mega.wldbs.workers.dev`) as a proxy to get file info and generate direct links
- Speed test first tries LibreSpeed, then falls back to downloading small JS files from jsDelivr
- Pure frontend – no backend required on your side

## Disclaimer

This tool is not affiliated with Mega.nz.  
Use at your own risk. Mega may change their systems at any time, which can break the service.  
Respect Mega's Terms of Service and only download files you have the right to access.

## License

Feel free to use, modify, and share.  
No warranty provided.