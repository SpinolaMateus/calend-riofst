import * as XLSX from './node_modules/xlsx/xlsx.mjs';
import fs from 'fs';

const path = 'C:/Users/psico/.gemini/antigravity/brain/65395b67-dca6-403e-8146-039d223745ca/.user_uploaded/media_1793285780371_90265cf4.xlsx';
const wb = XLSX.readFile(path);

console.log('Sheets:', wb.SheetNames);

wb.SheetNames.forEach(sheetName => {
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  
  console.log(`\n====== SHEET: "${sheetName}" (${rows.length} rows) ======`);
  
  // Print first 15 rows to understand structure
  rows.slice(0, 15).forEach((row, i) => {
    const rowStr = JSON.stringify(row);
    console.log(`  row[${i}]: ${rowStr.slice(0, 300)}`);
  });
});
