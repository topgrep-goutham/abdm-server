const fetch = require('node-fetch');
const crypto = require('crypto');

async function sessionHandler(req, res) {
    try {
        const body = req.body || {};
        const sessionsUrl = process.env.SESSIONS_URL;

        if (!sessionsUrl) {
            return res.status(500).json({
                error: 'Configuration Error',
                message: 'SESSIONS_URL not configured'
            });
        }

        let payload;
        if (body.clientId && body.clientSecret) {
            payload = {
                clientId: process.env.SESSION_CLIENT_ID,
                clientSecret: process.env.SESSION_CLIENT_SECRET,
                grantType: 'client_credentials'
            };
        } else {
            const clientId = process.env.SESSION_CLIENT_ID;
            const clientSecret = process.env.SESSION_CLIENT_SECRET;

            if (!clientId || !clientSecret) {
                return res.status(500).json({
                    error: 'Configuration Error',
                    message: 'SESSION_CLIENT_ID or SESSION_CLIENT_SECRET not configured'
                });
            }

            payload = {
                clientId,
                clientSecret,
                grantType: 'client_credentials'
            };
        }

        const requestId = crypto.randomUUID();
        const timestamp = new Date().toISOString();

        const headers = {
            'Content-Type': 'application/json',
            'REQUEST-ID': requestId,
            'TIMESTAMP': timestamp,
            'X-CM-ID': 'sbx'
        };

        const response = await fetch(sessionsUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
            timeout: 30000
        });

        const text = await response.text();

        const contentType = response.headers.get('content-type');
        if (contentType) {
            res.set('content-type', contentType);
        }

        return res.status(response.status).send(text);

    } catch (err) {
        console.error('Session handler error:', err);

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

module.exports = { sessionHandler };