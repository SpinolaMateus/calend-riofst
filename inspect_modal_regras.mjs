import fs from 'fs';

const abs = fs.readFileSync('temp_page_absenteismo.html', 'utf8');
const start = abs.indexOf('id="modal-regras"');
console.log(abs.substring(start, start + 3000));

