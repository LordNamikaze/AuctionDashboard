// backend/routes/config.js
const express = require('express');
const ExcelJS = require('exceljs');
const path = require('path');
const router = express.Router();
module.exports = router; // ✅ export early for express@4

const EXCEL_PATH = path.join(__dirname, '..', 'excel', 'Players.xlsx');

// Utility: read Excel once
async function readWorkbook() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(EXCEL_PATH);
  return wb;
}

// Generic helper to read any sheet by index
async function readSheetData(sheetIndex) {
  const wb = await readWorkbook();
  const sheet = wb.getWorksheet(sheetIndex);
  if (!sheet) throw new Error(`Sheet ${sheetIndex} not found`);

  const headers = {};
  sheet.getRow(1).eachCell((cell, col) => {
    headers[col] = String(cell.value).trim();
  });

  const rows = [];
  sheet.eachRow((row, rowNum) => {
    if (rowNum === 1) return;
    const obj = {};
    row.eachCell((cell, col) => {
      const key = headers[col];
      if (key) obj[key] = cell.value;
    });
    if (Object.keys(obj).length) rows.push(obj);
  });

  return rows;
}

// ================================
// GET /config/teams        → Sheet 2
// GET /config/budget       → Sheet 3
// GET /config/positions    → Sheet 4
// ================================
/**
 * @swagger
 * /config/teams:
 *   get:
 *     summary: Get all teams
 *     description: Returns team configuration from the Teams sheet.
 *     responses:
 *       200:
 *         description: Array of team objects
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
router.get('/teams', async (req, res) => {
  try {
    const data = await readSheetData(2);
    res.json(data);
  } catch (err) {
    console.error('Error reading Teams sheet:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /config/budget:
 *   get:
 *     summary: Get budget configuration
 *     description: Returns budget settings from the Budget sheet.
 *     responses:
 *       200:
 *         description: Budget object
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 VirtualBudget:
 *                   type: number
 */
router.get('/budget', async (req, res) => {
  try {
    const data = await readSheetData(3); // original returns array
    if (data && data.length > 0) {
      res.json(data[0]); // return only the first object
    } else {
      res.json({ VirtualBudget: 0 }); // default if empty
    }
  } catch (err) {
    console.error('Error reading Budget sheet:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /config/positions:
 *   get:
 *     summary: Get available positions
 *     description: Returns all player positions from the Positions sheet.
 *     responses:
 *       200:
 *         description: Positions list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 positions:
 *                   type: array
 *                   items:
 *                     type: string
 */
router.get('/positions', async (req, res) => {
  try {
    const data = await readSheetData(4); // returns [{ Positions: "GK" }, ...]
    
    // Map the objects to just the position values
    const positions = data.map(row => row.Positions).filter(Boolean);

    res.json({ positions }); // wrap in an object
  } catch (err) {
    console.error('Error reading Positions sheet:', err);
    res.status(500).json({ error: err.message });
  }
});

// ================================
// GET /config/users  → Sheet 5
// ================================
/**
 * @swagger
 * /config/users:
 *   get:
 *     summary: Get users
 *     description: Returns all user records from the Users sheet.
 *     responses:
 *       200:
 *         description: Users list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       Email:
 *                         type: string
 *                       Name:
 *                         type: string
 *                       Role:
 *                         type: string
 */
router.get('/users', async (req, res) => {
  try {
    const wb = await readWorkbook();
    const sheet = wb.getWorksheet(5); // Sheet 5 – Users
    if (!sheet) return res.status(500).json({ error: 'Sheet5 not found' });

    const headerMap = {};
    sheet.getRow(1).eachCell((cell, col) => {
      const header = String(cell.value || '').trim().toLowerCase();
      headerMap[header] = col;
    });

    const emailCol = headerMap.email;
    const nameCol = headerMap.name;
    const roleCol = headerMap.role;

    if (!emailCol || !nameCol || !roleCol) {
      return res.status(500).json({ error: 'Users sheet must have Email, Name and Role headers' });
    }

    const users = [];
    sheet.eachRow((row, rowNum) => {
      if (rowNum === 1) return;
      const email = String(row.getCell(emailCol).value || '').trim();
      const name = String(row.getCell(nameCol).value || '').trim();
      const role = String(row.getCell(roleCol).value || '').trim().toLowerCase();

      if (!email || !role) return;
      if (!['admin', 'bidder', 'readonly'].includes(role)) return;

      users.push({ Email: email, Name: name, Role: role });
    });

    res.json({ users });
  } catch (err) {
    console.error('Error reading Users sheet:', err);
    res.status(500).json({ error: err.message });
  }
});

