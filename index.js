const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { sessionHandler } = require('./controllers/sessionController');
const { certificateHandler } = require('./controllers/certificateController');
const { sendAadharOtpHandler } = require('./controllers/aadharOtp');
const { verifyAadharOtpHandler } = require('./controllers/verifyOtp');
const { getProfileHandler } = require('./controllers/profileController');
const { requestEmailVerificationHandler } = require('./controllers/emailController');
const { getAddressSuggestionsHandler } = require('./controllers/addressController');
const { enrolAbhaAddressHandler } = require('./controllers/enrolAbhaController');

dotenv.config();

const app = express();

// Enhanced CORS configuration
const corsOptions = {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Token',
        'Transaction_Id',
        'REQUEST-ID',
        'TIMESTAMP',
        'X-CM-ID',
        'Accept',
        'X-Requested-With'
    ],
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '5mb' }));

// Additional headers middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Token, Transaction_Id, REQUEST-ID, TIMESTAMP, X-CM-ID, Accept');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    next();
});

app.get('/', (req, res) => {
    res.json({
        service: 'ABDM Integration Server',
        status: 'running',
        timestamp: new Date().toISOString()
    });
});

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

// Debug endpoint
app.get('/debug/config', (req, res) => {
    res.json({
        hasSessionsUrl: !!process.env.SESSIONS_URL,
        hasClientId: !!process.env.SESSION_CLIENT_ID,
        hasClientSecret: !!process.env.SESSION_CLIENT_SECRET,
        sessionsUrl: process.env.SESSIONS_URL ? 'configured' : 'missing',
        nodeVersion: process.version,
    });
});

app.post('/session', sessionHandler);
app.get('/cert', certificateHandler);
app.post('/aadhar/otp', sendAadharOtpHandler);
app.post('/otp/verify', verifyAadharOtpHandler);
app.get('/profile', getProfileHandler);
app.post('/email/verify', requestEmailVerificationHandler);
app.get('/address/suggestion', getAddressSuggestionsHandler);
app.post('/address/enroll', enrolAbhaAddressHandler);

app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`
    });
});

app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message
    });
});

const port = process.env.PORT;

app.listen(port, () => {
    console.log(`ABDM Integration Server running on port ${port}`);
});

// CRITICAL: Export the app
module.exports = app;