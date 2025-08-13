const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');
const { preInitializeFilter } = require('./middleware/contentModeration');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

// Pre-initialize content moderation filter
preInitializeFilter();

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/visits', require('./routes/visits'));
app.use('/api/neighborhoods', require('./routes/neighborhoods'));
app.use('/api/districts', require('./routes/districts'));
app.use('/api/countries', require('./routes/countries'));
app.use('/api/maps', require('./routes/maps'));

app.get('/', (req, res) => {
  res.json({ message: 'NYC Neighborhoods API is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});