const crypto = require("crypto");

function createState() {
    const timestamp = Date.now().toString();
    const random = crypto.randomBytes(16).toString("hex");

    const payload = `${timestamp}.${random}`;

    const signature = crypto
        .createHmac(
            "sha256",
            process.env.MICROSOFT_CLIENT_SECRET
        )
        .update(payload)
        .digest("hex");

    return `${payload}.${signature}`;
}

function verifyState(state) {
    if (!state) {
        return false;
    }

    const parts = state.split(".");

    if (parts.length !== 3) {
        return false;
    }

    const [timestamp, random, signature] = parts;

    const payload = `${timestamp}.${random}`;

    const expectedSignature = crypto
        .createHmac(
            "sha256",
            process.env.MICROSOFT_CLIENT_SECRET
        )
        .update(payload)
        .digest("hex");

    const validSignature = crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
    );

    if (!validSignature) {
        return false;
    }

    const stateAge = Date.now() - Number(timestamp);

    // State hanya berlaku selama 10 menit.
    if (stateAge < 0 || stateAge > 10 * 60 * 1000) {
        return false;
    }

    return true;
}

module.exports = {
    createState,
    verifyState,
};