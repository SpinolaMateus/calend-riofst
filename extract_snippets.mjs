import fs from 'fs';

function extractMainSection(filename, startComment, endComment) {
  const content = fs.readFileSync(filename, 'utf8');
  let startIdx = 0;
  if (startComment) {
    startIdx = content.indexOf(startComment);
    if (startIdx === -1) {
      console.log(`Start comment "${startComment}" not found in ${filename}`);
      return '';
    }
  }
  let endIdx = content.length;
  if (endComment) {
    endIdx = content.indexOf(endComment, startIdx + 1);
    if (endIdx === -1) {
      console.log(`End comment "${endComment}" not found in ${filename}`);
      endIdx = content.length;
    }
  }
  return content.substring(startIdx, endIdx);
}

// Check executiva main
console.log('--- Executiva Content snippet ---');
const execSnippet = extractMainSection('temp_page_executiva.html', '<main', '</main>');
console.log('Exec length:', execSnippet.length);

const indSnippet = extractMainSection('temp_page_indicadores.html', '<main', '</main>');
console.log('Indicadores length:', indSnippet.length);

const absSnippet = extractMainSection('temp_page_absenteismo.html', '<main', '</main>');
console.log('Absenteismo length:', absSnippet.length);

