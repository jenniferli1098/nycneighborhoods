const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/visits', require('./routes/visits'));
app.use('/api/neighborhoods', require('./routes/neighborhoods'));
app.use('/api/boroughs', require('./routes/boroughs'));

app.get('/', (req, res) => {
  res.json({ message: 'NYC Neighborhoods API is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});