import fs from 'fs';

const ind = fs.readFileSync('temp_page_indicadores.html', 'utf8');
const start = ind.indexOf('id="modalAuditoria"');
console.log(ind.substring(start, start + 3000));

