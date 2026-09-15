const {
    getMsalClient,
    REDIRECT_URI,
    SCOPES,
} = require("../../lib/microsoft-auth");

const {
    createState,
} = require("../../lib/oauth-state");

module.exports = async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).send("Method tidak diizinkan.");
    }

    try {
        const msalClient = getMsalClient();

        const state = createState();

        const authCodeUrl = await msalClient.getAuthCodeUrl({
            scopes: SCOPES,
            redirectUri: REDIRECT_URI,
            responseMode: "query",
            state,
            prompt: "select_account",
        });

        res.setHeader(
            "Set-Cookie",
            `oauth_state=${encodeURIComponent(state)}; HttpOnly; Secure; SameSite=Lax; Path=/api/auth; Max-Age=600`
        );

        return res.redirect(302, authCodeUrl);

    } catch (error) {
        console.error("Microsoft login error:", error);

        return res.status(500).send(
            "Gagal memulai login Microsoft."
        );
    }
};