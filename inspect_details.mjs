import fs from 'fs';

const ind = fs.readFileSync('temp_page_indicadores.html', 'utf8');
const pAud = ind.indexOf('id="modalAuditoria"');
if (pAud !== -1) {
  const pEnd = ind.indexOf('</div>\n</div>\n</div>', pAud);
  fs.writeFileSync('extracted_modal_auditoria.txt', ind.substring(pAud - 20, pEnd + 30));
}

const abs = fs.readFileSync('temp_page_absenteismo.html', 'utf8');
const pReg = abs.indexOf('id="modal-regras"');
if (pReg !== -1) {
  const pEnd = abs.indexOf('</div>\n</div>\n</div>', pReg);
  fs.writeFileSync('extracted_modal_regras.txt', abs.substring(pReg - 20, pEnd + 30));
}

console.log('Modals extracted cleanly.');

