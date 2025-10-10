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
router.get('/teams', async (req, res) => {
  try {
    const data = await readSheetData(2);
    res.json(data);
  } catch (err) {
    console.error('Error reading Teams sheet:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/budget', async (req, res) => {
  try {
    const data = await readSheetData(3);
    res.json(data);
  } catch (err) {
    console.error('Error reading Budget sheet:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/positions', async (req, res) => {
  try {
    const data = await readSheetData(4);
    res.json(data);
  } catch (err) {
    console.error('Error reading Positions sheet:', err);
    res.status(500).json({ error: err.message });
  }
});

// ================================
// GET /config/users  → Sheet 5
// ================================
router.get('/users', async (req, res) => {
  try {
    const wb = await readWorkbook();
    const sheet = wb.getWorksheet(5); // Sheet 5 – Users
    if (!sheet) return res.status(500).json({ error: 'Sheet5 not found' });

    // Read header row (Admins | ReadOnlyUsers)
    const headers = {};
    sheet.getRow(1).eachCell((cell, col) => {
      headers[col] = String(cell.value).trim();
    });

    // Collect all email IDs under each column
    const users = { Admins: [], ReadOnlyUsers: [] };

    sheet.eachRow((row, rowNum) => {
      if (rowNum === 1) return; // skip header
      const admin = row.getCell(1).value;
      const readOnly = row.getCell(2).value;
      if (admin) users.Admins.push(String(admin).trim());
      if (readOnly) users.ReadOnlyUsers.push(String(readOnly).trim());
    });

    res.json(users);
  } catch (err) {
    console.error('Error reading Users sheet:', err);
    res.status(500).json({ error: err.message });
  }
});

