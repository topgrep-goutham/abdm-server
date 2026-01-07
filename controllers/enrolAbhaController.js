const fetch = require('node-fetch');
const crypto = require('crypto');

async function enrolAbhaAddressHandler(req, res) {
    try {
        const { txnId, abhaAddress } = req.body;
        const auth = req.headers.authorization;

        if (!txnId || !abhaAddress) {
            return res.status(400).json({ error: 'txnId and abhaAddress are required' });
        }

        const upstream = 'https://abhasbx.abdm.gov.in/abha/api/v3/enrollment/enrol/abha-address';

        const headers = {
            'Content-Type': 'application/json',
            'REQUEST-ID': crypto.randomUUID(),
            'TIMESTAMP': new Date().toISOString(),
            'Authorization': auth
        };

        const payload = {
            "txnId": txnId,
            "abhaAddress": abhaAddress,
            "preferred": 1
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
        console.error('Final Enrolment Error:', err);
        return res.status(500).json({ error: 'Internal Server Error', details: err.message });
    }
}

module.exports = { enrolAbhaAddressHandler };