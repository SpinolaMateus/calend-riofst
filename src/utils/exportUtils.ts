import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { IntegrationAudience, INTEGRATION_AUDIENCES, IntegrationSession, UnitInfo } from '../types/schedule';
import { formatTimeRange } from './timeUtils';

export async function exportElementToPDF(
  elementId: string,
  fileName: string = 'cronograma-integracao.pdf'
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Elemento para exportação não encontrado');
  }

  // Use html2canvas to capture the element
  const canvas = await html2canvas(element, {
    scale: 2, // High resolution
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: element.scrollWidth,
  });

  const imgData = canvas.toDataURL('image/png');
  const imgWidth = canvas.width;
  const imgHeight = canvas.height;

  // Determine orientation (landscape if width > height)
  const isLandscape = imgWidth > imgHeight;
  const pdf = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  const ratio = Math.min(pdfWidth / (imgWidth * 0.264583), pdfHeight / (imgHeight * 0.264583));
  const printW = (imgWidth * 0.264583) * ratio;
  const printH = (imgHeight * 0.264583) * ratio;

  const posX = (pdfWidth - printW) / 2;
  const posY = 10;

  pdf.addImage(imgData, 'PNG', posX, posY, printW, printH);
  pdf.save(fileName);
}

export function exportToExcel(sessions: IntegrationSession[], unitInfo: UnitInfo, audience?: IntegrationAudience) {
  const rows = sessions.map((s) => ({
    PÚBLICO: INTEGRATION_AUDIENCES.find((option) => option.id === (s.audience || 'geral'))?.label || 'Geral',
    DIA: s.dia,
    HORÁRIO: s.horarioText || formatTimeRange(s.startTime, s.endTime),
    CH: s.ch,
    TEMA: s.tema,
    ÁREA: s.area,
    RESPONSÁVEL: s.responsavel || 'N/A',
    PRN: s.prn || 'N/A',
    LOCAL: s.local || 'Sala de Integração',
    CÓDIGO: s.codigo || 'N/A',
    ENTREGÁVEL: s.entregavel || 'Lançamento em aplicativo ou lista',
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Cronograma');

  // Set column widths
  worksheet['!cols'] = [
    { wch: 20 }, // PÚBLICO
    { wch: 6 },  // DIA
    { wch: 18 }, // HORÁRIO
    { wch: 10 }, // CH
    { wch: 35 }, // TEMA
    { wch: 22 }, // ÁREA
    { wch: 24 }, // RESPONSÁVEL
    { wch: 22 }, // PRN
    { wch: 20 }, // LOCAL
    { wch: 16 }, // CÓDIGO
    { wch: 32 }, // ENTREGÁVEL
  ];

  const audienceName = audience
    ? `_${INTEGRATION_AUDIENCES.find((option) => option.id === audience)?.id || audience}`
    : '';
  XLSX.writeFile(workbook, `cronograma_integracao${audienceName}_${unitInfo.unitName.replace(/\s+/g, '_')}.xlsx`);
}

export function parseExcelFile(
  file: File
): Promise<IntegrationSession[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        const sessions: IntegrationSession[] = rawJson.map((row, idx) => {
          // Normalize keys
          const getVal = (possibleKeys: string[]) => {
            for (const key of possibleKeys) {
              const foundKey = Object.keys(row).find(
                (k) => k.trim().toLowerCase() === key.toLowerCase()
              );
              if (foundKey && row[foundKey] !== undefined) {
                return String(row[foundKey]).trim();
              }
            }
            return '';
          };

          const diaVal = parseInt(getVal(['dia', 'dia da semana', 'dia_semana']), 10) || 1;
          const horarioRaw = getVal(['horário', 'horario', 'hora', 'horários']);
          
          let startTime = '08:00';
          let endTime = '09:00';

          if (horarioRaw) {
            const timeParts = horarioRaw.split(/às|as|-|a|\/|–/).map((p) => p.trim());
            if (timeParts.length >= 2) {
              const cleanPart = (p: string) => {
                const match = p.match(/(\d{1,2})[:h](\d{2})?/i);
                if (match) {
                  const h = String(match[1]).padStart(2, '0');
                  const m = String(match[2] || '00').padStart(2, '0');
                  return `${h}:${m}`;
                }
                return '08:00';
              };
              startTime = cleanPart(timeParts[0]);
              endTime = cleanPart(timeParts[1]);
            }
          }

          const ch = getVal(['ch', 'carga horária', 'duracao', 'duração']) || '1h';
          const tema = getVal(['tema', 'assunto', 'conteúdo', 'titulo']) || `Treinamento ${idx + 1}`;
          const area = getVal(['área', 'area', 'setor', 'departamento']) || 'GENTE E GESTÃO';
          const responsavel = getVal(['responsável', 'responsavel', 'instrutor', 'facilitador']);
          const prn = getVal(['prn', 'matrícula', 'registro']);
          const local = getVal(['local', 'sala', 'ambiente']) || 'Sala de Integração';
          const codigo = getVal(['código', 'codigo', 'cod']);
          const entregavel = getVal(['entregável', 'entregavel', 'entrega']) || 'Lançamento em aplicativo ou lista';
          const audienceValue = getVal(['público', 'publico', 'audience']).toLowerCase();
          const audience = INTEGRATION_AUDIENCES.find(
            (option) => option.id === audienceValue || option.label.toLowerCase() === audienceValue
          )?.id;

          return {
            id: `imported-${Date.now()}-${idx}`,
            audience,
            dia: diaVal,
            startTime,
            endTime,
            horarioText: horarioRaw || `${startTime} às ${endTime}`,
            ch,
            tema,
            area: area.toUpperCase(),
            responsavel,
            prn,
            local,
            codigo,
            entregavel,
          };
        });

        resolve(sessions);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}
