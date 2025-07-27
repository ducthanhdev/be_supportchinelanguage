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
const wordRoutes = require('./routes/word.routes');
const hanvietRoutes = require('./routes/hanviet.routes');
const exampleRoutes = require('./routes/example.routes');
const translateRoutes = require('./routes/translate.routes');
app.use('/api/words', wordRoutes);
app.use('/api/hanviet', hanvietRoutes);
app.use('/api/example', exampleRoutes);
app.use('/api/translate', translateRoutes);

app.get('/', (req, res) => {
    res.send('Backend is running!');
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});