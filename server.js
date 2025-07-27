require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();
const mongoURI = process.env.MONGO_URI;
const PORT = process.env.PORT || 5000;

mongoose.connect(mongoURI)
    .then(() => console.log('MongoDB connected!'))
    .catch(err => console.log('MongoDB connection error:', err));

app.use(cors());
app.use(bodyParser.json());

// Import routes
const authRoutes = require('./routes/auth.routes');
const wordRoutes = require('./routes/word.routes');
const hanvietRoutes = require('./routes/hanviet.routes');
const exampleRoutes = require('./routes/example.routes');
const translateRoutes = require('./routes/translate.routes');
const flashcardRoutes = require('./routes/flashcard.routes');
const statsRoutes = require('./routes/stats.routes');

// Auth routes (không cần xác thực)
app.use('/api/auth', authRoutes);

// Protected routes (cần xác thực)
app.use('/api/words', wordRoutes);
app.use('/api/hanviet', hanvietRoutes);
app.use('/api/example', exampleRoutes);
app.use('/api/translate', translateRoutes);
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/stats', statsRoutes);

app.get('/', (req, res) => {
    res.send('Backend is running!');
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});