const crypto = require("crypto");

const COOKIE_NAME = "ms_session";
const MAX_AGE = 60 * 60; // 1 jam

function getEncryptionKey() {
    const secret = process.env.MICROSOFT_CLIENT_SECRET;

    if (!secret) {
        throw new Error(
            "MICROSOFT_CLIENT_SECRET belum dikonfigurasi."
        );
    }

    return crypto
        .createHash("sha256")
        .update(secret)
        .digest();
}

function encryptSession(data) {
    const key = getEncryptionKey();

    const iv = crypto.randomBytes(12);

    const cipher = crypto.createCipheriv(
        "aes-256-gcm",
        key,
        iv
    );

    const plaintext = JSON.stringify(data);

    const encrypted = Buffer.concat([
        cipher.update(plaintext, "utf8"),
        cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    return Buffer.concat([
        iv,
        authTag,
        encrypted,
    ]).toString("base64url");
}

function decryptSession(value) {
    if (!value) {
        return null;
    }

    try {
        const key = getEncryptionKey();

        const buffer = Buffer.from(
            value,
            "base64url"
        );

        const iv = buffer.subarray(0, 12);
        const authTag = buffer.subarray(12, 28);
        const encrypted = buffer.subarray(28);

        const decipher = crypto.createDecipheriv(
            "aes-256-gcm",
            key,
            iv
        );

        decipher.setAuthTag(authTag);

        const decrypted = Buffer.concat([
            decipher.update(encrypted),
            decipher.final(),
        ]).toString("utf8");

        const session = JSON.parse(decrypted);

        if (
            !session.expiresAt ||
            Date.now() >= session.expiresAt
        ) {
            return null;
        }

        return session;

    } catch (error) {
        console.error(
            "Session decrypt error:",
            error.message
        );

        return null;
    }
}

function createSessionCookie(session) {
    const encrypted = encryptSession(session);

    return [
        `${COOKIE_NAME}=${encodeURIComponent(encrypted)}`,
        "HttpOnly",
        "Secure",
        "SameSite=Lax",
        "Path=/",
        `Max-Age=${MAX_AGE}`,
    ].join("; ");
}

function clearSessionCookie() {
    return [
        `${COOKIE_NAME}=`,
        "HttpOnly",
        "Secure",
        "SameSite=Lax",
        "Path=/",
        "Max-Age=0",
    ].join("; ");
}

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

function getSession(req) {
    const cookies = parseCookies(
        req.headers.cookie
    );

    return decryptSession(
        cookies[COOKIE_NAME]
    );
}

module.exports = {
    createSessionCookie,
    clearSessionCookie,
    getSession,
};