const {
    getMsalClient,
    REDIRECT_URI,
    SCOPES,
} = require("../../lib/microsoft-auth");

const {
    verifyState,
} = require("../../lib/oauth-state");

const {
    createSessionCookie,
} = require("../../lib/session");

function parseCookies(cookieHeader) {
    const cookies = {};

    if (!cookieHeader) {
        return cookies;
    }

    cookieHeader.split(";").forEach((cookie) => {
        const [name, ...rest] =
            cookie.trim().split("=");

        if (!name) {
            return;
        }

        cookies[name] = decodeURIComponent(
            rest.join("=")
        );
    });

    return cookies;
}

function clearStateCookie() {
    return "oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/api/auth; Max-Age=0";
}

module.exports = async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).send(
            "Method tidak diizinkan."
        );
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

            res.setHeader(
                "Set-Cookie",
                clearStateCookie()
            );

            return res.status(400).send(`
                <h1>Login Microsoft gagal</h1>

                <p>
                    ${error_description || error}
                </p>

                <p>
                    <a href="/">
                        Kembali ke Certificate Generator
                    </a>
                </p>
            `);
        }

        const cookies = parseCookies(
            req.headers.cookie
        );

        const storedState =
            cookies.oauth_state;

        if (
            !state ||
            !storedState ||
            state !== storedState ||
            !verifyState(state)
        ) {
            return res.status(400).send(`
                <h1>OAuth State tidak valid</h1>

                <p>
                    Silakan ulangi proses login.
                </p>

                <p>
                    <a href="/">
                        Kembali ke Certificate Generator
                    </a>
                </p>
            `);
        }

        if (!code) {
            return res.status(400).send(
                "Authorization code tidak ditemukan."
            );
        }

        const msalClient =
            getMsalClient();

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

        const username =
            tokenResponse.account?.username ||
            "Akun Microsoft";

        const accessToken =
            tokenResponse.accessToken;

        if (!accessToken) {
            throw new Error(
                "Access token Microsoft tidak ditemukan."
            );
        }

        /*
         * Access token hanya disimpan sementara
         * dalam session cookie terenkripsi.
         *
         * Token tidak ditampilkan ke browser,
         * tidak ditulis ke log, dan tidak disimpan
         * di Google Spreadsheet.
         */
        const expiresOn =
            tokenResponse.expiresOn
                ? new Date(
                      tokenResponse.expiresOn
                  ).getTime()
                : Date.now() + 60 * 60 * 1000;

        const sessionCookie =
            createSessionCookie({
                username,
                accessToken,
                expiresAt: expiresOn,
            });

        /*
         * Hapus OAuth state cookie dan
         * buat session cookie.
         */
        res.setHeader(
            "Set-Cookie",
            [
                clearStateCookie(),
                sessionCookie,
            ]
        );

        return res.status(200).send(`
            <!DOCTYPE html>

            <html lang="id">

            <head>
                <meta charset="UTF-8">

                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1.0"
                >

                <title>
                    Login Berhasil
                </title>

                <style>
                    body {
                        font-family: Arial, sans-serif;
                        max-width: 700px;
                        margin: 80px auto;
                        padding: 20px;
                    }

                    .success {
                        padding: 24px;
                        border-radius: 12px;
                        background: #ecfdf5;
                        border: 1px solid #a7f3d0;
                    }

                    .item {
                        margin-top: 16px;
                        padding: 12px;
                        background: white;
                        border-radius: 8px;
                    }

                    a {
                        display: inline-block;
                        margin-top: 20px;
                    }
                </style>
            </head>

            <body>

                <div class="success">

                    <h1>
                        ✓ Login Microsoft Berhasil
                    </h1>

                    <div class="item">
                        <strong>
                            Akun Microsoft
                        </strong>

                        <br>

                        ${username}
                    </div>

                    <p>
                        Session Microsoft berhasil dibuat.
                    </p>

                    <p>
                        Aplikasi sekarang dapat menggunakan
                        Microsoft Graph untuk mengakses
                        OneDrive.
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
            <h1>
                Login Microsoft gagal
            </h1>

            <p>
                ${error.message}
            </p>

            <p>
                <a href="/">
                    Kembali ke Certificate Generator
                </a>
            </p>
        `);
    }
};