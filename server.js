
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { Strategy as DiscordStrategy } from 'passport-discord';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(session({ secret: process.env.SESSION_SECRET || 'ergsecret', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

passport.use(new DiscordStrategy({
  clientID: process.env.DISCORD_CLIENT_ID,
  clientSecret: process.env.DISCORD_CLIENT_SECRET,
  callbackURL: process.env.DISCORD_CALLBACK_URL,
  scope: ['identify']
}, (accessToken, refreshToken, profile, done) => done(null, profile)));

app.get('/auth/discord', passport.authenticate('discord'));
app.get('/auth/callback', passport.authenticate('discord', { failureRedirect: '/?auth=failed' }), (req, res) => {
  res.redirect('/?auth=success');
});
app.post('/logout', (req, res) => {
  req.logout(() => {});
  res.json({ ok: true });
});

app.get('/api/user', (req, res) => {
  if (!req.isAuthenticated()) return res.json({ loggedIn: false });
  const { id, username, discriminator, avatar } = req.user;
  res.json({ loggedIn: true, user: { id, username, discriminator, avatar } });
});

// Fallback to index for SPA routes
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, () => console.log(`ERGTracking5 server running on port ${PORT}`));
