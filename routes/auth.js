const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); // 👈 Token banana ke liye top par import kiya
const User = require('../models/User');
const authMiddleware = require('../middleware/auth'); // 👈 Step 3 wale security guard ko yahan link kiya

// ==========================================================================
// 📝 1. SIGNUP ROUTE (http://localhost:5000/api/auth/signup)
// ==========================================================================
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists with this email!' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      name,
      email,
      password: hashedPassword
    });

    await user.save();

    // ⚡ JWT Sign Logic for Registration
    const payload = { user: { id: user._id } };
    
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        res.status(201).json({ 
          message: 'User registered successfully! 🎉',
          token,
          user: { id: user._id, name: user.name, email: user.email }
        });
      }
    );

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error in Signup');
  }
});

// ==========================================================================
// 🔑 2. LOGIN ROUTE (http://localhost:5000/api/auth/login)
// ==========================================================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid Credentials! (Email not found)' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid Credentials! (Wrong Password)' });
    }

    // ⚡ JWT Sign Logic for Login
    const payload = { user: { id: user._id } };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        res.json({
          message: 'Welcome back! Login Successful 🚀',
          token,
          user: { id: user._id, name: user.name, email: user.email }
        });
      }
    );

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error in Login');
  }
});

// ==========================================================================
// 📊 3. SECURE DASHBOARD DATA ROUTE (http://localhost:5000/api/auth/dashboard-data)
// ==========================================================================
// 🔐 Humne yahan authMiddleware laga diya hai taaki bina token koi data na le sake
router.get('/dashboard-data', authMiddleware, async (req, res) => {
  try {
    // Ab hum pure database se find nahi kar rahe, balki token wale specific user ki id se dhoond rahe hain
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: "User profile not found" });
    }

    const analytics = {
      name: user.name,
      email: user.email,
      dailyStreak: 5,               
      routineCompletion: "84%",     
      aiTalkSessions: 12,           
    };

    res.json(analytics);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error fetching secure dashboard data" });
  }
});

module.exports = router; // 👈 Humesha router export file ke sabse end me hona chahiye