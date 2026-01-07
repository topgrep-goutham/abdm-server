const fetch = require('node-fetch');
const crypto = require('crypto');

// Helper to ensure key is in PEM format
function formatPublicKey(rawKey) {
    if (rawKey.includes('BEGIN PUBLIC KEY')) return rawKey;
    const cleanKey = rawKey.replace(/\s+/g, '');
    return `-----BEGIN PUBLIC KEY-----
${cleanKey}
-----END PUBLIC KEY-----`;
}

async function requestEmailVerificationHandler(req, res) {
    try {
        const { email, publicKey } = req.body;
        const accessToken = req.headers.authorization; 
        const xToken = req.headers['x-token'];

        if (!email || !publicKey || !xToken) {
            return res.status(400).json({ error: 'Email, Public Key, and X-Token are required' });
        }

        const formattedKey = formatPublicKey(publicKey);
        const encryptedEmail = crypto.publicEncrypt({
            key: formattedKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: "sha1",
        }, Buffer.from(email)).toString('base64');

        const upstream = 'https://abhasbx.abdm.gov.in/abha/api/v3/profile/account/request/emailVerificationLink';

        const payload = {
            "scope": ["abha-profile", "email-link-verify"],
            "loginHint": "email",
            "loginId": encryptedEmail,
            "otpSystem": "abdm"
        };

        const headers = {
            'Content-Type': 'application/json',
            'REQUEST-ID': crypto.randomUUID(),
            'TIMESTAMP': new Date().toISOString(),
            'Authorization': accessToken,
            'X-Token': xToken.startsWith('Bearer ') ? xToken : `Bearer ${xToken}`
        };

        const response = await fetch(upstream, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload)
        });

        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            data = { message: text };
        }

        return res.status(response.status).json(data);

    } catch (err) {
        console.error('Email Verification Handler Error:', err);
        return res.status(500).json({ error: 'Internal Server Error', details: err.message });
    }
}

module.exports = { requestEmailVerificationHandler };