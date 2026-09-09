const MEGA_DOWNLOAD_API = 'https://mega.wldbs.workers.dev/download?url=';
const PCLOUD_HOSTS = new Set(['e.pcloud.link', 'u.pcloud.link']);

function isPcloudLink(link) {
    try {
        const url = new URL(link);
        return url.protocol === 'https:' &&
            PCLOUD_HOSTS.has(url.hostname.toLowerCase()) &&
            url.pathname === '/publink/show';
    } catch (error) {
        return false;
    }
}

function isMegaLink(link) {
    try {
        const url = new URL(link);
        const hostname = url.hostname.toLowerCase();
        const isMegaPage = ['mega.nz', 'www.mega.nz'].includes(hostname) &&
            url.pathname.startsWith('/file/');
        const isExistingDirectLink = hostname === 'mega.wldbs.workers.dev' &&
            url.pathname === '/download' &&
            url.searchParams.has('url');
        return url.protocol === 'https:' && (isMegaPage || isExistingDirectLink);
    } catch (error) {
        return false;
    }
}

async function getPcloudDownloadUrl(link) {
    const response = await fetch(link, {
        headers: {
            Accept: 'text/html'
        }
    });

    if (!response.ok) {
        throw new Error('Could not open the pCloud link.');
    }

    const html = await response.text();
    const match = html.match(/"downloadlink"\s*:\s*"([^"]+)"/i);

    if (!match) {
        throw new Error('The pCloud download link was not found.');
    }

    return match[1]
        .replaceAll('\\/', '/')
        .replaceAll('&amp;', '&');
}

async function getRedirectUrl(link) {
    if (isPcloudLink(link)) {
        return getPcloudDownloadUrl(link);
    }

    if (isMegaLink(link)) {
        const megaUrl = new URL(link);
        if (megaUrl.hostname.toLowerCase() === 'mega.wldbs.workers.dev') {
            return link;
        }
        return MEGA_DOWNLOAD_API + encodeURIComponent(Buffer.from(link).toString('base64'));
    }

    const error = new Error('Only public Mega and pCloud links are supported.');
    error.statusCode = 400;
    throw error;
}

async function handler(request, response) {
    if (request.method !== 'GET') {
        response.setHeader('Allow', 'GET');
        response.status(405).json({ error: 'Method not allowed.' });
        return;
    }

    const link = typeof request.query?.link === 'string' ? request.query.link.trim() : '';
    if (!link) {
        response.status(400).json({ error: 'The link query parameter is required.' });
        return;
    }

    try {
        const downloadUrl = await getRedirectUrl(link);
        response.redirect(302, downloadUrl);
    } catch (error) {
        response.status(error.statusCode || 502).json({
            error: error.message || 'Could not resolve the download link.'
        });
    }
}

handler.getRedirectUrl = getRedirectUrl;
module.exports = handler;
