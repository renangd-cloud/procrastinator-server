const passport = require('passport');
const OIDCStrategy = require('passport-azure-ad').OIDCStrategy;
const { User } = require('../models');

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findByPk(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

passport.use(new OIDCStrategy({
    identityMetadata: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/v2.0/.well-known/openid-configuration`,
    clientID: process.env.AZURE_CLIENT_ID,
    responseType: 'code',
    responseMode: 'query',
    redirectUrl: 'http://localhost:3000/api/auth/callback',
    allowHttpForRedirectUrl: true,
    clientSecret: process.env.AZURE_CLIENT_SECRET,
    validateIssuer: false,
    passReqToCallback: false,
    scope: ['profile', 'email', 'openid']
}, async (iss, sub, profile, accessToken, refreshToken, done) => {
    try {
        if (!profile.oid) {
            return done(new Error("No OID found"), null);
        }
        const [user] = await User.findOrCreate({
            where: { email: profile._json.email || profile._json.preferred_username },
            defaults: {
                name: profile.displayName || profile._json.name,
                role: 'User'
            }
        });
        return done(null, user);
    } catch (err) {
        console.error('Error in OIDC callback:', err);
        return done(err, null);
    }
}));

module.exports = passport;
