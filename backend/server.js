// backend/server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Swagger definition
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Auction Dashboard API",
      version: "1.0.0",
      description: "API for Football Auction Dashboard"
    },
    servers: [
      { url: "http://localhost:3000" }
    ]
  },
  apis: ["./routes/*.js"] // <-- scan all route files for Swagger comments
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Serve Swagger UI at /api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));


// Routes
const playerRoutes = require('./routes/players');
const configRoutes = require('./routes/config');

app.use('/players', playerRoutes);
app.use('/config', configRoutes);

// Root endpoint - sanity check
app.get('/', (req, res) => {
  res.send('✅ Auction backend running successfully!');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server started on http://localhost:${PORT} and  http://192.168.1.148:3000/`);
});
