const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/auth');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration
app.use(cors({
    origin: true, // or specify your frontend URLs
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'X-API-Key',
        'Authorization',
        'X-Requested-With',
        'Accept'
    ],
    exposedHeaders: ['set-cookie']
}));

// Additional headers for preflight requests
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, X-API-Key'
    );
    next();
});

// Middleware
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/v1', apiRoutes);
app.use('/auth/v1', authRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Something went wrong!',
    error: err.message
  });
});

// Start server
app.listen(PORT, () => {
  // console.log(`Server is running on port ${PORT}`);
}); 