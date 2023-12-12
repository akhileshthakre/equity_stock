const express = require('express');
const cors = require('cors');
const db = require('./src/model');
require('dotenv').config();
const userRoutes = require('./src/routes/user/user.routes');
const uploadRoutes = require('./src/routes/upload/upload.routes');
const stockRoutes = require('./src/routes/stock/stock.routes')

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.get('/', (req, res) => {
  res.send('API is up');
});

app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/stocks', stockRoutes)

// Database Connection and Sync
db.sequelize.sync({ force: false })
  .then(() => {
    console.log("Synced db.");
  })
  .catch((err) => {
    console.error("Failed to sync db:", err);
  });

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Internal Server Error');
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
