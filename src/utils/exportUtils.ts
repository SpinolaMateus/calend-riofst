import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { IntegrationAudience, INTEGRATION_AUDIENCES, IntegrationSession, UnitInfo } from '../types/schedule';
import { formatTimeRange } from './timeUtils';

function colorChannelToSrgb(value: number) {
  const channel = Math.min(1, Math.max(0, value));
  return Math.round(255 * (channel <= 0.0031308
    ? 12.92 * channel
    : 1.055 * (channel ** (1 / 2.4)) - 0.055));
}

function oklabToRgba(lightness: string, first: string, second: string, alpha?: string) {
  const parseCoordinate = (value: string, scale: number) => (
    Number.parseFloat(value) * (value.endsWith('%') ? scale / 100 : 1)
  );
  const L = parseCoordinate(lightness, 1);
  const a = parseCoordinate(first, 0.4);
  const b = parseCoordinate(second, 0.4);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const red = colorChannelToSrgb(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s);
  const green = colorChannelToSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s);
  const blue = colorChannelToSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s);
  const opacity = alpha ? Number.parseFloat(alpha) / (alpha.endsWith('%') ? 100 : 1) : 1;

  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
}

function oklchToRgba(lightness: string, chroma: string, hue: string, alpha?: string) {
  const parsedChroma = Number.parseFloat(chroma) * (chroma.endsWith('%') ? 0.004 : 1);
  const hueValue = Number.parseFloat(hue) || 0;
  const hueInDegrees = hue.endsWith('turn')
    ? hueValue * 360
    : hue.endsWith('rad')
      ? (hueValue * 180) / Math.PI
      : hue.endsWith('grad')
        ? hueValue * 0.9
        : hueValue;
  const hueInRadians = (hueInDegrees * Math.PI) / 180;

  return oklabToRgba(
    lightness,
    String(parsedChroma * Math.cos(hueInRadians)),
    String(parsedChroma * Math.sin(hueInRadians)),
    alpha,
  );
}

export function replaceUnsupportedColorFunctions(value: string): string {
  if (!value || typeof value !== 'string') return value;
  
  return value
    .replace(
      /oklch\(\s*([+-]?(?:\d*\.?\d+)(?:e[+-]?\d+)?%?)\s+([+-]?(?:\d*\.?\d+)(?:e[+-]?\d+)?%?)\s+([+-]?(?:\d*\.?\d+)(?:e[+-]?\d+)?(?:deg|grad|rad|turn)?)\s*(?:\/\s*([+-]?(?:\d*\.?\d+)(?:e[+-]?\d+)?%?))?\s*\)/gi,
      (_match, lightness: string, chroma: string, hue: string, alpha?: string) => (
        oklchToRgba(lightness, chroma, hue, alpha)
      ),
    )
    .replace(
      /oklab\(\s*([+-]?(?:\d*\.?\d+)(?:e[+-]?\d+)?%?)\s+([+-]?(?:\d*\.?\d+)(?:e[+-]?\d+)?%?)\s+([+-]?(?:\d*\.?\d+)(?:e[+-]?\d+)?%?)(?:\s*\/\s*([+-]?(?:\d*\.?\d+)(?:e[+-]?\d+)?%?))?\s*\)/gi,
      (_match, lightness: string, first: string, second: string, alpha?: string) => (
        oklabToRgba(lightness, first, second, alpha)
      ),
    )
    .replace(/color-mix\([^)]+\)/gi, 'rgba(100, 116, 139, 0.2)')
    .replace(/\bin\s+ok(?:lab|lch)\b/gi, '');
}

/**
 * Captures any HTML element to an HTML5 Canvas with modern Tailwind CSS v4 color compatibility.
 */
export async function captureElementToCanvas(elementId: string): Promise<HTMLCanvasElement> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Não foi possível localizar o elemento com ID "${elementId}" para captura.`);
  }

  const width = Math.ceil(element.scrollWidth || element.offsetWidth || 1200);
  const height = Math.ceil(element.scrollHeight || element.offsetHeight || 800);

  const COLOR_PROPS = [
    'color',
    'backgroundColor',
    'borderColor',
    'borderTopColor',
    'borderRightColor',
    'borderBottomColor',
    'borderLeftColor',
    'outlineColor',
    'fill',
    'stroke',
  ];

  return html2canvas(element, {
    backgroundColor: '#ffffff',
    scale: Math.min(window.devicePixelRatio || 1, 2),
    useCORS: true,
    logging: false,
    width,
    height,
    windowWidth: Math.max(width, document.documentElement.clientWidth),
    windowHeight: Math.max(height, document.documentElement.clientHeight),
    onclone: (clonedDoc, clonedElement) => {
      const allElements = [clonedElement, ...clonedElement.querySelectorAll<HTMLElement>('*')];
      
      allElements.forEach((el) => {
        const computed = clonedDoc.defaultView?.getComputedStyle(el);
        if (!computed) return;

        // Convert any oklch/oklab in specific color properties
        for (const prop of COLOR_PROPS) {
          const val = (computed as any)[prop];
          if (typeof val === 'string' && /ok(?:lab|lch)\(|color-mix\(/i.test(val)) {
            const safeProp = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
            el.style.setProperty(safeProp, replaceUnsupportedColorFunctions(val));
          }
        }

        // Check box-shadow
        const shadow = computed.boxShadow;
        if (shadow && /ok(?:lab|lch)\(|color-mix\(/i.test(shadow)) {
          el.style.boxShadow = replaceUnsupportedColorFunctions(shadow);
        }

        // Normalize sticky/fixed positioning for full capture
        if (computed.position === 'sticky') el.style.position = 'static';
        if (computed.overflowY === 'auto' || computed.overflowY === 'scroll') {
          el.style.maxHeight = 'none';
          el.style.height = 'auto';
          el.style.overflow = 'visible';
        }
        if (el.hasAttribute('data-capture-ignore') || computed.position === 'fixed') {
          el.style.display = 'none';
        }
      });

      clonedElement.style.width = `${width}px`;
      clonedElement.style.maxWidth = 'none';
      clonedElement.style.height = `${height}px`;
      clonedElement.style.overflow = 'visible';
    },
  });
}

export interface CopyImageResult {
  success: boolean;
  method: 'clipboard' | 'download';
}

/**
 * Copies an element as an image to the clipboard. If browser permissions or user activation block clipboard writing,
 * automatically falls back to downloading the PNG image so the user never fails to get their capture.
 */
export async function copyElementAsImage(
  elementId: string,
  downloadFallbackName: string = 'captura_agenda'
): Promise<CopyImageResult> {
  const canvas = await captureElementToCanvas(elementId);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((b) => resolve(b), 'image/png');
  });

  if (!blob) {
    throw new Error('O navegador não conseguiu processar a imagem.');
  }

  // 1. Try to write directly to system clipboard
  if (navigator.clipboard?.write && typeof ClipboardItem !== 'undefined') {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      return { success: true, method: 'clipboard' };
    } catch (clipErr) {
      console.warn('Clipboard write was restricted by browser, downloading image fallback:', clipErr);
    }
  }

  // 2. Fallback: Automatically download the PNG image file
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${downloadFallbackName}_${new Date().toISOString().split('T')[0]}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  return { success: true, method: 'download' };
}

/**
 * Exports an HTML element directly to a downloadable PDF file with correct A4 proportions.
 */
export async function exportElementToPDF(
  elementId: string,
  fileName: string = 'cronograma-integracao.pdf'
): Promise<void> {
  const canvas = await captureElementToCanvas(elementId);

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

  const mmPerPx = 0.264583;
  const imgW_mm = imgWidth * mmPerPx;
  const imgH_mm = imgHeight * mmPerPx;

  // Margin 8mm
  const margin = 8;
  const availW = pdfWidth - margin * 2;
  const availH = pdfHeight - margin * 2;

  const ratio = Math.min(availW / imgW_mm, availH / imgH_mm);
  const printW = imgW_mm * ratio;
  const printH = imgH_mm * ratio;

  const posX = (pdfWidth - printW) / 2;
  const posY = margin + Math.max(0, (availH - printH) / 2);

  pdf.addImage(imgData, 'PNG', posX, posY, printW, printH);
  pdf.save(fileName);
}

/**
 * Exports schedule sessions to an Excel .xlsx workbook.
 */
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

  // Column widths
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

  // Sanitize unit name to remove characters invalid on Windows/Linux filenames: / \ : * ? " < > |
  const safeUnitName = (unitInfo?.unitName || 'unidade')
    .replace(/[/\\?%*:|"<>]/g, '-')
    .replace(/\s+/g, '_');

  XLSX.writeFile(workbook, `cronograma_integracao${audienceName}_${safeUnitName}.xlsx`);
}

/**
 * Parses an imported Excel file into IntegrationSession items.
 */
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
