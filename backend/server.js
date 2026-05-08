// backend/server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const os = require('os');

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
  apis: ["./routes/*.js", "./server.js"] // <-- scan all route files and server.js for Swagger comments
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
/**
 * @swagger
 * /:
 *   get:
 *     summary: Health check
 *     description: Returns a simple server status response.
 *     responses:
 *       200:
 *         description: Server is running
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */
app.get('/', (req, res) => {
  res.send('✅ Auction backend running successfully!');
});

function getLocalIpv4Addresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];

  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        addresses.push(net.address);
      }
    }
  }

  return addresses;
}

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  const localIps = getLocalIpv4Addresses();
  const externalUrls = localIps.map(ip => `http://${ip}:${PORT}`);
  const urlList = ['http://localhost:' + PORT, ...externalUrls].join(' and ');
  console.log(`🚀 Server started on ${urlList}`);
});
