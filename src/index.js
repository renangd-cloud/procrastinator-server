const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const { connectPostgres, connectMongo, connectRedis } = require('./config/db');
// Import models to ensure they're registered before sync
require('./models');

const app = express();
const PORT = process.env.PORT || 3000;

const session = require('express-session');
const { RedisStore } = require('connect-redis');
const { redisClient } = require('./config/db');

// Middleware
app.use(cors({
    origin: 'http://localhost:5173', // Allow frontend
    credentials: true // Allow cookies
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // For OIDC form_post

app.use(session({
    store: new RedisStore({ client: redisClient }),
    secret: 'super-secret-key', // In production, use env var
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true if using HTTPS
        httpOnly: true,
        sameSite: 'lax', // Allow cookie to be sent on redirects
        maxAge: 1000 * 60 * 60 * 24 // 1 day
    }
}));

const passport = require('./config/passport');
const { i18next, middleware: i18nMiddleware } = require('./config/i18n');

app.use(i18nMiddleware.handle(i18next));
app.use(passport.initialize());
app.use(passport.session());

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const taskRoutes = require('./routes/tasks');
const tagRoutes = require('./routes/tags');
const shoppingRoutes = require('./routes/shopping');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/shopping', shoppingRoutes);

// Basic Route
app.get('/', (req, res) => {
    res.send('Procrastinator Server is running');
});

// Start Server
const startServer = async () => {
    await connectPostgres();
    await connectMongo();
    await connectRedis();

    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
};

startServer();
