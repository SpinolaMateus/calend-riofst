import fs from 'fs';

const ind = fs.readFileSync('temp_page_indicadores.html', 'utf8');
const modalAuditoria = ind.match(/<div id="modalAuditoria"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/i);
if (modalAuditoria) {
  console.log('modalAuditoria found, length:', modalAuditoria[0].length);
  fs.writeFileSync('temp_modal_auditoria.html', modalAuditoria[0]);
} else {
  console.log('modalAuditoria not matched directly, finding by indexOf');
  const start = ind.indexOf('id="modalAuditoria"');
  if (start !== -1) {
    console.log('Starts at:', start);
    fs.writeFileSync('temp_modal_auditoria.html', ind.substring(start - 10, start + 8000));
  }
}

const abs = fs.readFileSync('temp_page_absenteismo.html', 'utf8');
const modalRegras = abs.indexOf('id="modal-regras"');
if (modalRegras !== -1) {
  console.log('modal-regras found at:', modalRegras);
  fs.writeFileSync('temp_modal_regras.html', abs.substring(modalRegras - 10, modalRegras + 8000));
}

