const msal = require("@azure/msal-node");

const REDIRECT_URI =
    "https://certificate-generator-tekdijar.vercel.app/api/auth/callback";

const SCOPES = [
    "openid",
    "profile",
    "User.Read",
    "Files.Read",
];

function getMsalClient() {
    return new msal.ConfidentialClientApplication({
        auth: {
            clientId: process.env.MICROSOFT_CLIENT_ID,
            clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
            authority: `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID}`,
        },
    });
}

module.exports = {
    REDIRECT_URI,
    SCOPES,
    getMsalClient,
};