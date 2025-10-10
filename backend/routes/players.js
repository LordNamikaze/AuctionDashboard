// backend/routes/players.js
const express = require('express');
const ExcelJS = require('exceljs');
const path = require('path');
const router = express.Router();

// Export the router
module.exports = router;

const EXCEL_PATH = path.join(__dirname, '..', 'excel', 'Players.xlsx');

// Utility: read Excel and return workbook
async function readWorkbook() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(EXCEL_PATH);
  return workbook;
}

// =============================
// GET /players - return all players
// =============================
/**
 * @swagger
 * /players:
 *   get:
 *     summary: Get all players
 *     description: Returns all players from Sheet1.
 *     responses:
 *       200:
 *         description: Array of players
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   PlayerID:
 *                     type: string
 *                   Name:
 *                     type: string
 *                   Age:
 *                     type: number
 *                   PrimaryPosition:
 *                     type: string
 *                   SecondaryPosition:
 *                     type: string
 *                   BasePrice:
 *                     type: number
 *                   SoldPrice:
 *                     type: number
 *                   TeamAssigned:
 *                     type: string
 */
router.get('/', async (req, res) => {
  try {
    const wb = await readWorkbook();
    const sheet = wb.getWorksheet(1); // Sheet 1 - Players
    if (!sheet) return res.status(500).json({ error: 'Sheet1 not found' });

    // Extract header
    const headerMap = {};
    sheet.getRow(1).eachCell((cell, colNumber) => {
      headerMap[colNumber] = String(cell.value).trim();
    });

    const players = [];
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // skip header row
      const player = {};
      row.eachCell((cell, colNumber) => {
        const key = headerMap[colNumber];
        if (!key) return;
        player[key] = cell.value;
      });
      players.push(player);
    });

    res.json(players);
  } catch (err) {
    console.error('Error reading players:', err);
    res.status(500).json({ error: 'Failed to read Excel file', details: err.message });
  }
});

// ================================
// POST /players/sell
// body: { PlayerID, SoldPrice, TeamAssigned }
// ================================
/**
 * @swagger
 * /players/sell:
 *   post:
 *     summary: Sell a player
 *     description: Updates SoldPrice and TeamAssigned for a player
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               PlayerID:
 *                 type: string
 *               SoldPrice:
 *                 type: number
 *               TeamAssigned:
 *                 type: string
 *             required:
 *               - PlayerID
 *               - SoldPrice
 *               - TeamAssigned
 *     responses:
 *       200:
 *         description: Player updated successfully
 */
router.post('/sell', async (req, res) => {
  try {
    const { PlayerID, SoldPrice, TeamAssigned } = req.body;

    if (PlayerID === undefined || SoldPrice === undefined || TeamAssigned === undefined) {
      return res.status(400).json({ error: 'PlayerID, SoldPrice, and TeamAssigned are required' });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(EXCEL_PATH);
    const sheet = workbook.getWorksheet(1); // Sheet 1 - Players
    if (!sheet) return res.status(500).json({ error: 'Sheet1 not found' });

    // Identify columns
    const headerRow = sheet.getRow(1);
    let playerIdCol, soldPriceCol, teamCol;

    headerRow.eachCell((cell, colNumber) => {
      const val = String(cell.value).trim();
      if (val === 'PlayerID') playerIdCol = colNumber;
      if (val === 'SoldPrice') soldPriceCol = colNumber;
      if (val === 'TeamAssigned') teamCol = colNumber;
    });

    if (!playerIdCol || !soldPriceCol || !teamCol) {
      return res.status(500).json({ error: 'Required columns missing in Sheet1' });
    }

    // Find row with matching PlayerID
    let rowFound = false;
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // skip header
      if (String(row.getCell(playerIdCol).value) === String(PlayerID)) {
        row.getCell(soldPriceCol).value = SoldPrice;
        row.getCell(teamCol).value = TeamAssigned;
        rowFound = true;
      }
    });

    if (!rowFound) {
      return res.status(404).json({ error: 'PlayerID not found' });
    }

    // Save back to Excel
    await workbook.xlsx.writeFile(EXCEL_PATH);

    res.json({ success: true, PlayerID, SoldPrice, TeamAssigned });
  } catch (err) {
    console.error('Error updating player:', err);
    res.status(500).json({ error: 'Failed to update player', details: err.message });
  }
});

