const express = require('express');
const cors = require('cors');
const db = require('./src/model');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.get('/', (req, res) => {
  res.send('API is up');
});

//Dynamically load routes from a folder
const loadRoutesFromFolder = (folderPath, parentRoute = '/api') => {
  fs.readdirSync(folderPath).forEach((file) => {
    const fullPath = path.join(folderPath, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      loadRoutesFromFolder(fullPath, `${parentRoute}/${file}`);
    } else if (file.endsWith('.routes.js')) {
      const route = require(fullPath);
      app.use(parentRoute, route);
    }
  });
};

// Specify the folder where your routes are located
const routesFolder = path.join(__dirname, 'src/routes');

loadRoutesFromFolder(routesFolder);

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
