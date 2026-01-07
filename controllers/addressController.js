const fetch = require('node-fetch');
const crypto = require('crypto');

async function getAddressSuggestionsHandler(req, res) {
    try {
        const txnId = req.headers['transaction_id']; 
        const auth = req.headers.authorization;

        if (!txnId) {
            return res.status(400).json({ error: 'Transaction_Id is required' });
        }

        const upstream = 'https://abhasbx.abdm.gov.in/abha/api/v3/enrollment/enrol/suggestion';
        
        const headers = {
            'Content-Type': 'application/json',
            'Transaction_Id': txnId,
            'REQUEST-ID': crypto.randomUUID(),
            'TIMESTAMP': new Date().toISOString(),
            'Authorization': auth
        };

        const response = await fetch(upstream, {
            method: 'GET',
            headers: headers
        });

        const data = await response.json();
        return res.status(response.status).json(data);

    } catch (err) {
        console.error('Address Suggestion Error:', err);
        return res.status(500).json({ error: 'Internal Server Error', details: err.message });
    }
}

module.exports = { getAddressSuggestionsHandler };