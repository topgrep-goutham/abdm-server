const fetch = require('node-fetch');
    const crypto = require('crypto');
    const { json } = require('stream/consumers');

    async function verifyAadharOtpHandler(req, res) {
        try {
            const { otp, txnId, publicKey, mobile } = req.body;
            const auth = req.headers.authorization;

            const encryptedOtp = crypto.publicEncrypt({
                key: `-----BEGIN PUBLIC KEY-----\n${publicKey}\n-----END PUBLIC KEY-----`,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: "sha1",
            }, Buffer.from(otp)).toString('base64');

            const upstream = 'https://abhasbx.abdm.gov.in/abha/api/v3/enrollment/enrol/byAadhaar';

            const headers = {
                "Content-Type": "application/json",
                "REQUEST-ID": crypto.randomUUID(),
                "TIMESTAMP": new Date().toISOString(),
                "Authorization": auth
            };

            const payload = {
                "authData": {
                    "authMethods": ["otp"],
                    "otp": {
                        "txnId": txnId,
                        "otpValue": encryptedOtp,
                        "mobile": mobile
                    }
                },
                "consent": {
                    "code": "abha-enrollment",
                    "version": "1.4"
                }
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
            console.error('Verify OTP Controller Error:', err);
            return res.status(500).json({ error: err.message });
        }
    }

    module.exports = { verifyAadharOtpHandler };