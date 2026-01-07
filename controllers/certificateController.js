const fetch = require('node-fetch');
const crypto = require('crypto');

async function certificateHandler(req, res) {
    try {
        const upstream = 'https://abhasbx.abdm.gov.in/abha/api/v3/profile/public/certificate';
        const auth = req.headers.authorization;

        if (!auth) {
            return res.status(401).json({
                error: 'Authorization header is required'
            });
        }

        const requestId = crypto.randomUUID();
        const timestamp = new Date().toISOString();

        const headers = {
            'accept': '*/*',
            'REQUEST-ID': requestId,
            'TIMESTAMP': timestamp,
            'Content-Type': 'application/json',
            'Authorization': auth
        };
        
        const response = await fetch(upstream, {
            method: 'GET',
            headers: headers,
            timeout: 30000 
        });

        const text = await response.text();

        const contentType = response.headers.get('content-type');
        if (contentType) {
            res.set('content-type', contentType);
        }

        return res.status(response.status).send(text);

    } catch (err) {
        console.error('Certificate handler error:', err);
        
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

module.exports = { certificateHandler };