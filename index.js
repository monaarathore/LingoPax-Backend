const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');


require('dotenv').config();

const app = express();

const PORT = process.env.PORT || 5000; 

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth')); 
app.use('/api/ai', require('./routes/ai'));
app.use('/api/video', require('./routes/video'));
app.use('/api/sandbox', require('./routes/sandbox'));

const dbURI = process.env.MONGO_URI;

if (!dbURI) {
  console.error("❌ CRITICAL: MONGO_URI is not defined in environment variables!");
}

mongoose.connect(dbURI)
  .then(() => {
    console.log('🎉 MongoDB Database Connected Successfully!');
  })
  .catch((err) => {
    console.error('❌ Database connection error:', err.message);
  });

app.get('/', (req, res) => {
  res.send('LingoPax Backend Server is Running! 🚀');
});

app.listen(PORT, () => {
  console.log(`Server is happily running on port ${PORT}`);
});