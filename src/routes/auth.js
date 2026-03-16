const express = require('express');
const passport = require('passport');
const router = express.Router();

// Login route
router.get('/login',
    passport.authenticate('azuread-openidconnect', {
        failureRedirect: '/'
    })
);

// Callback route (GET - query mode)
router.get('/callback',
    passport.authenticate('azuread-openidconnect', {
        failureRedirect: 'http://localhost:5173/login'
    }),
    (req, res) => {
        res.redirect('http://localhost:5173/');
    }
);

// Get current user
router.get('/me', (req, res) => {
    if (req.isAuthenticated()) {
        res.json(req.user);
    } else {
        res.status(401).json({ message: req.t('errors.notAuthenticated') });
    }
});

// Logout
router.get('/logout', (req, res) => {
    req.logout(() => {
        res.redirect('http://localhost:5173/login');
    });
});

module.exports = router;
