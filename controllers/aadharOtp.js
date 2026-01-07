const fetch = require('node-fetch');
const crypto = require('crypto');

function formatPublicKey(rawKey) {
    if (rawKey.includes('BEGIN PUBLIC KEY')) return rawKey;
    const cleanKey = rawKey.replace(/\s+/g, '');
    return `-----BEGIN PUBLIC KEY-----
${cleanKey}
-----END PUBLIC KEY-----`;
}

async function sendAadharOtpHandler(req, res) {
    try {
        const { aadhaar, publicKey, txnId } = req.body;
        const auth = req.headers.authorization;

        if (!aadhaar || !publicKey || !auth) {
            return res.status(400).json({ error: 'Aadhaar number or Public Key or Authorization header is required' });
        }

        const formattedKey = formatPublicKey(publicKey);

        let encryptedAadhaar;
        try {
            encryptedAadhaar = crypto.publicEncrypt(
                {
                    key: formattedKey,
                    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                    oaepHash: "sha1",
                },
                Buffer.from(aadhaar)
            ).toString('base64');
        } catch (encryptErr) {
            console.error('Encryption error:', encryptErr);
            return res.status(400).json({
                error: 'Encryption failed',
                message: 'Invalid public key or encryption error',
                details: encryptErr.message
            });
        }

        const upstream = 'https://abhasbx.abdm.gov.in/abha/api/v3/enrollment/request/otp';
        const requestId = crypto.randomUUID();
        const timestamp = new Date().toISOString();

        const headers = {
            'Content-Type': 'application/json',
            'REQUEST-ID': requestId,
            'TIMESTAMP': timestamp,
            'Authorization': auth,
            'Accept': 'application/json'
        };

        const payload = {
            "txnId": txnId || "",
            "scope": ["abha-enrol"],
            "loginHint": "aadhaar",
            "loginId": encryptedAadhaar,
            "otpSystem": "aadhaar"
        };

        const response = await fetch(upstream, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload),
            timeout: 30000
        });


        const text = await response.text();

        let responseData;
        try {
            responseData = JSON.parse(text);
        } catch (parseErr) {
            console.error('Failed to parse ABDM response as JSON:', text);
            responseData = { message: text };
        }

        return res.status(response.status).json(responseData);

    } catch (err) {
        console.error('Aadhaar OTP handler error:', err);

        if (err.name === 'FetchError') {
            return res.status(503).json({
                error: 'Service Unavailable',
                message: 'Unable to connect to ABDM service',
                details: err.message
            });
        }

        if (err.code === 'ETIMEDOUT' || err.type === 'request-timeout') {
            return res.status(504).json({
                error: 'Gateway Timeout',
                message: 'ABDM service took too long to respond'
            });
        }

        return res.status(500).json({
            error: 'Internal Server Error',
            message: err.message
        });
    }
}

module.exports = { sendAadharOtpHandler };