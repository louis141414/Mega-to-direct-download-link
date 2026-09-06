const express = require("express");
const cors = require("cors");

const app = express();

const PORT = process.env.PORT || 3000;


/*
    CORS

    This allows other websites to use the API.

    For production you can replace "*" with your
    own domains if you want to restrict access.
*/

app.use(
    cors({
        origin: "*"
    })
);


app.use(
    express.json({
        limit: "1mb"
    })
);


/*
    Health check
*/

app.get("/health", (req, res) => {

    res.json({
        success: true,
        status: "online"
    });

});


/*
    Parse a Mega URL.

    Supported formats:

    https://mega.nz/file/FILE_ID#FILE_KEY

    https://mega.nz/#!FILE_ID!FILE_KEY
*/

function parseMegaUrl(input) {

    let url;

    try {
        url = new URL(input);
    } catch {
        throw new Error("Invalid URL");
    }


    if (
        url.hostname !== "mega.nz" &&
        url.hostname !== "www.mega.nz"
    ) {
        throw new Error("URL is not a Mega URL");
    }


    const pathname = url.pathname;


    /*
        Modern Mega format
    */

    if (pathname.startsWith("/file/")) {

        const fileId =
            pathname.split("/")[2];

        const key =
            url.hash.replace("#", "").trim();


        if (!fileId || !key) {
            throw new Error(
                "Mega URL is missing the file key"
            );
        }


        return {
            id: fileId,
            key
        };
    }


    /*
        Legacy Mega format

        /#!FILE_ID!FILE_KEY
    */

    if (pathname === "/") {

        const hash =
            url.hash.replace("#", "");

        if (hash.startsWith("!")) {

            const parts =
                hash.substring(1).split("!");

            if (parts.length >= 2) {

                return {
                    id: parts[0],
                    key: parts[1]
                };

            }
        }
    }


    throw new Error(
        "Unsupported Mega URL format"
    );
}


/*
    Decode Mega's attribute string.

    Mega commonly stores the filename inside
    the "at" attribute.
*/

function decodeBase64Url(value) {

    try {

        let normalized =
            value
                .replace(/-/g, "+")
                .replace(/_/g, "/");

        while (normalized.length % 4 !== 0) {
            normalized += "=";
        }

        return Buffer
            .from(normalized, "base64")
            .toString("utf8");

    } catch {

        return null;

    }
}


/*
    Extract filename from Mega attributes.
*/

function getFilename(attribute) {

    if (!attribute) {
        return null;
    }


    const decoded =
        decodeBase64Url(attribute);


    if (!decoded) {
        return null;
    }


    try {

        const json =
            JSON.parse(decoded);

        return json.n || null;

    } catch {

        return null;

    }
}


/*
    Ask Mega for information about a file.
*/

async function getMegaFile(fileId) {

    const response =
        await fetch(
            "https://g.api.mega.co.nz/cs",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify([
                    {
                        a: "g",
                        p: fileId
                    }
                ])
            }
        );


    if (!response.ok) {
        throw new Error(
            `Mega API returned HTTP ${response.status}`
        );
    }


    const data =
        await response.json();


    if (
        !Array.isArray(data) ||
        !data[0]
    ) {
        throw new Error(
            "Mega returned an invalid response"
        );
    }


    const item = data[0];


    if (typeof item === "number") {

        throw new Error(
            `Mega API error: ${item}`
        );

    }


    if (!item.g) {

        throw new Error(
            "Mega did not return a download URL"
        );

    }


    return item;
}


/*
    POST /api/mega

    Request:

    {
        "url": "https://mega.nz/file/..."
    }

    Response:

    {
        "success": true,
        "filename": "...",
        "size": 123,
        "url": "https://..."
    }
*/

app.post("/api/mega", async (req, res) => {

    try {

        const input =
            req.body?.url;


        if (!input) {

            return res.status(400).json({
                success: false,
                error: "Missing url"
            });

        }


        const parsed =
            parseMegaUrl(input);


        const item =
            await getMegaFile(parsed.id);


        const filename =
            getFilename(item.at);


        res.json({
            success: true,

            filename:
                filename || "Unknown",

            size:
                Number(item.s || 0),

            url:
                item.g
        });


    } catch (error) {

        console.error(error);


        res.status(400).json({
            success: false,
            error: error.message
        });

    }

});


/*
    POST /api/decode

    Turns a generated direct link back into
    the original Mega URL.

    This works with:

    https://mega.wldbs.workers.dev/download?url=BASE64
*/

app.post("/api/decode", (req, res) => {

    try {

        const input =
            req.body?.url;


        if (!input) {

            return res.status(400).json({
                success: false,
                error: "Missing url"
            });

        }


        const url =
            new URL(input);


        const encoded =
            url.searchParams.get("url");


        if (!encoded) {

            throw new Error(
                "Missing encoded Mega URL"
            );

        }


        const decoded =
            Buffer
                .from(
                    decodeURIComponent(encoded),
                    "base64"
                )
                .toString("utf8");


        if (
            !decoded.startsWith(
                "https://mega.nz/"
            ) &&
            !decoded.startsWith(
                "http://mega.nz/"
            )
        ) {

            throw new Error(
                "Decoded value is not a Mega URL"
            );

        }


        res.json({
            success: true,
            url: decoded
        });


    } catch (error) {

        res.status(400).json({
            success: false,
            error: error.message
        });

    }

});


/*
    GET /api/test?url=...

    Tests whether a generated download URL
    responds successfully.
*/

app.get("/api/test", async (req, res) => {

    try {

        const input =
            req.query.url;


        if (!input) {

            return res.status(400).json({
                success: false,
                error: "Missing url"
            });

        }


        const url =
            new URL(input);


        const response =
            await fetch(
                url,
                {
                    method: "HEAD",
                    redirect: "follow"
                }
            );


        res.json({
            success: response.ok,
            status: response.status,
            contentLength:
                response.headers.get(
                    "content-length"
                ),
            contentType:
                response.headers.get(
                    "content-type"
                )
        });


    } catch (error) {

        res.status(400).json({
            success: false,
            error: error.message
        });

    }

});


app.listen(PORT, () => {

    console.log(
        `Mega API running on port ${PORT}`
    );

});