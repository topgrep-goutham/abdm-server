const fetch = require('node-fetch');
const crypto = require('crypto');

async function getProfileHandler(req, res) {
    try {
        const upstream = 'https://abhasbx.abdm.gov.in/abha/api/v3/profile/account';
        
        const accessToken = req.headers.authorization;
        const xToken = req.headers['x-token'];

        if (!xToken) {
            return res.status(400).json({ error: "X-Token is required in headers" });
        }

        const headers = {
            'Authorization': accessToken,
            'X-Token': xToken.startsWith('Bearer ') ? xToken : `Bearer ${xToken}`,
            'REQUEST-ID': crypto.randomUUID(),
            'TIMESTAMP': new Date().toISOString(),
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };

        const response = await fetch(upstream, {
            method: 'GET',
            headers: headers
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
        console.error('Profile Handler Error:', err);
        return res.status(500).json({ error: 'Internal Server Error', details: err.message });
    }
}

module.exports = { getProfileHandler };