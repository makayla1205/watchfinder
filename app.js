const express = require('express');
const path = require('path');
const session = require('express-session');
const apiRoutes = require('./routes/api');
const mainRoutes = require ('./routes/index');
const authRoutes = require ('./routes/auth');
const userRoutes = require ('./routes/user');

const app = express();

require('dotenv').config()

app.set('port', process.env.PORT || 3000);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views/pages'));

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production', // true in production with HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Make user available to all templates
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

app.use('/api', apiRoutes);
app.use('/', mainRoutes);
app.use('/auth', authRoutes);
app.use('/user', userRoutes);

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
