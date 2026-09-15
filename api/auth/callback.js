const {
    getMsalClient,
    REDIRECT_URI,
    SCOPES,
} = require("../../lib/microsoft-auth");

const {
    verifyState,
} = require("../../lib/oauth-state");

function parseCookies(cookieHeader) {
    const cookies = {};

    if (!cookieHeader) {
        return cookies;
    }

    cookieHeader.split(";").forEach((cookie) => {
        const [name, ...rest] = cookie.trim().split("=");

        if (!name) {
            return;
        }

        cookies[name] = decodeURIComponent(rest.join("="));
    });

    return cookies;
}

function clearStateCookie() {
    return "oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/api/auth; Max-Age=0";
}

module.exports = async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).send("Method tidak diizinkan.");
    }

    try {
        const {
            code,
            state,
            error,
            error_description,
        } = req.query;

        if (error) {
            console.error(
                "Microsoft OAuth error:",
                error,
                error_description
            );

            res.setHeader("Set-Cookie", clearStateCookie());

            return res.status(400).send(`
                <h1>Login Microsoft gagal</h1>
                <p>${error_description || error}</p>
                <p><a href="/">Kembali ke Certificate Generator</a></p>
            `);
        }

        const cookies = parseCookies(
            req.headers.cookie
        );

        const storedState = cookies.oauth_state;

        if (
            !state ||
            !storedState ||
            state !== storedState ||
            !verifyState(state)
        ) {
            return res.status(400).send(`
                <h1>OAuth State tidak valid</h1>
                <p>Silakan ulangi proses login.</p>
                <p><a href="/">Kembali ke Certificate Generator</a></p>
            `);
        }

        if (!code) {
            return res.status(400).send(
                "Authorization code tidak ditemukan."
            );
        }

        const msalClient = getMsalClient();

        const tokenResponse =
            await msalClient.acquireTokenByCode({
                code,
                scopes: SCOPES,
                redirectUri: REDIRECT_URI,
            });

        if (!tokenResponse) {
            throw new Error(
                "Tidak mendapatkan token dari Microsoft."
            );
        }

        res.setHeader(
            "Set-Cookie",
            clearStateCookie()
        );

        const username =
            tokenResponse.account?.username ||
            "Akun Microsoft";

        return res.status(200).send(`
            <!DOCTYPE html>
            <html lang="id">
            <head>
                <meta charset="UTF-8">
                <title>Login Berhasil</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        max-width: 700px;
                        margin: 80px auto;
                        padding: 20px;
                    }

                    .success {
                        padding: 20px;
                        border-radius: 12px;
                        background: #ecfdf5;
                        border: 1px solid #a7f3d0;
                    }

                    a {
                        display: inline-block;
                        margin-top: 20px;
                    }
                </style>
            </head>

            <body>
                <div class="success">
                    <h1>✓ Login Microsoft Berhasil</h1>

                    <p>
                        Akun yang terautentikasi:
                    </p>

                    <strong>
                        ${username}
                    </strong>

                    <p>
                        Microsoft Graph berhasil memberikan
                        access token kepada aplikasi.
                    </p>
                </div>

                <a href="/">
                    ← Kembali ke Certificate Generator
                </a>
            </body>
            </html>
        `);

    } catch (error) {
        console.error(
            "Microsoft callback error:",
            error
        );

        return res.status(500).send(`
            <h1>Login Microsoft gagal</h1>
            <p>${error.message}</p>
            <p>
                <a href="/">Kembali ke Certificate Generator</a>
            </p>
        `);
    }
};