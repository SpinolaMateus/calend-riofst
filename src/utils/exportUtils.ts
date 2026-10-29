import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { IntegrationAudience, INTEGRATION_AUDIENCES, IntegrationSession, UnitInfo } from '../types/schedule';
import { formatTimeRange } from './timeUtils';

let colorConverterCanvas: HTMLCanvasElement | null = null;
let colorConverterCtx: CanvasRenderingContext2D | null = null;

/**
 * Attempts to resolve modern CSS color functions (lab, lch, oklab, oklch, color, color-mix)
 * into standard sRGB "#rrggbb" or "rgba(...)" using the browser's native Canvas2D parsing engine.
 */
function tryResolveViaCanvas(colorStr: string): string | null {
  if (typeof document === 'undefined') return null;
  try {
    if (!colorConverterCanvas) {
      colorConverterCanvas = document.createElement('canvas');
      colorConverterCanvas.width = 1;
      colorConverterCanvas.height = 1;
      colorConverterCtx = colorConverterCanvas.getContext('2d', { willReadFrequently: true });
    }
    if (colorConverterCtx) {
      colorConverterCtx.fillStyle = '#00000000';
      colorConverterCtx.fillStyle = colorStr;
      const res = colorConverterCtx.fillStyle;
      if (res && res !== '#00000000' && (res.startsWith('#') || res.startsWith('rgb'))) {
        return res;
      }
    }
  } catch {
    // Ignore and fallback to mathematical conversion
  }
  return null;
}

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

function cielabToRgba(lightness: string, aVal: string, bVal: string, alpha?: string) {
  const parseCoord = (val: string, scale: number) => (
    Number.parseFloat(val) * (val.endsWith('%') ? scale / 100 : 1)
  );
  const L = parseCoord(lightness, 100);
  const a = parseCoord(aVal, 125);
  const b = parseCoord(bVal, 125);

  const y = (L + 16) / 116;
  const x = a / 500 + y;
  const z = y - b / 200;

  const fInv = (t: number) => (t ** 3 > 0.008856 ? t ** 3 : (116 * t - 16) / 903.3);

  // Standard D65 reference white
  const X = 0.95047 * fInv(x);
  const Y = 1.00000 * fInv(y);
  const Z = 1.08883 * fInv(z);

  // Convert XYZ to linear sRGB
  const r = 3.2404542 * X - 1.5371385 * Y - 0.4985314 * Z;
  const g = -0.9692660 * X + 1.8760108 * Y + 0.0415560 * Z;
  const b_srgb = 0.0556434 * X - 0.2040259 * Y + 1.0572252 * Z;

  const red = colorChannelToSrgb(r);
  const green = colorChannelToSrgb(g);
  const blue = colorChannelToSrgb(b_srgb);
  const opacity = alpha ? Number.parseFloat(alpha) / (alpha.endsWith('%') ? 100 : 1) : 1;

  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
}

function cielchToRgba(lightness: string, chroma: string, hue: string, alpha?: string) {
  const C = Number.parseFloat(chroma) * (chroma.endsWith('%') ? 1.5 : 1);
  const hueValue = Number.parseFloat(hue) || 0;
  const hueInDegrees = hue.endsWith('turn')
    ? hueValue * 360
    : hue.endsWith('rad')
      ? (hueValue * 180) / Math.PI
      : hue.endsWith('grad')
        ? hueValue * 0.9
        : hueValue;
  const hueInRadians = (hueInDegrees * Math.PI) / 180;

  return cielabToRgba(
    lightness,
    String(C * Math.cos(hueInRadians)),
    String(C * Math.sin(hueInRadians)),
    alpha,
  );
}

export function replaceUnsupportedColorFunctions(value: string): string {
  if (!value || typeof value !== 'string') return value;

  // If the whole value is a single color function, attempt direct canvas resolution
  const trimmed = value.trim();
  if (/^(?:(?:ok)?(?:lab|lch)|color(?:-mix)?)\(/i.test(trimmed)) {
    const directResolved = tryResolveViaCanvas(trimmed);
    if (directResolved) return directResolved;
  }
  
  return value
    // oklch(...)
    .replace(
      /oklch\(\s*([+-]?(?:\d*\.?\d+)(?:e[+-]?\d+)?%?)\s+([+-]?(?:\d*\.?\d+)(?:e[+-]?\d+)?%?)\s+([+-]?(?:\d*\.?\d+)(?:e[+-]?\d+)?(?:deg|grad|rad|turn)?)\s*(?:\/\s*([+-]?(?:\d*\.?\d+)(?:e[+-]?\d+)?%?))?\s*\)/gi,
      (match, lightness: string, chroma: string, hue: string, alpha?: string) => {
        const direct = tryResolveViaCanvas(match);
        return direct || oklchToRgba(lightness, chroma, hue, alpha);
      },
    )
    // oklab(...)
    .replace(
      /oklab\(\s*([+-]?(?:\d*\.?\d+)(?:e[+-]?\d+)?%?)\s+([+-]?(?:\d*\.?\d+)(?:e[+-]?\d+)?%?)\s+([+-]?(?:\d*\.?\d+)(?:e[+-]?\d+)?%?)(?:\s*\/\s*([+-]?(?:\d*\.?\d+)(?:e[+-]?\d+)?%?))?\s*\)/gi,
      (match, lightness: string, first: string, second: string, alpha?: string) => {
        const direct = tryResolveViaCanvas(match);
        return direct || oklabToRgba(lightness, first, second, alpha);
      },
    )
    // lab(...) -> CIELAB (matches the error: Attempting to parse an unsupported color function "lab")
    .replace(
      /lab\(\s*([+-]?(?:\d*\.?\d+)(?:e[+-]?\d+)?%?)\s+([+-]?(?:\d*\.?\d+)(?:e[+-]?\d+)?%?)\s+([+-]?(?:\d*\.?\d+)(?:e[+-]?\d+)?%?)(?:\s*\/\s*([+-]?(?:\d*\.?\d+)(?:e[+-]?\d+)?%?))?\s*\)/gi,
      (match, lightness: string, aVal: string, bVal: string, alpha?: string) => {
        const direct = tryResolveViaCanvas(match);
        return direct || cielabToRgba(lightness, aVal, bVal, alpha);
      },
    )
    // lch(...) -> CIELCH
    .replace(
      /lch\(\s*([+-]?(?:\d*\.?\d+)(?:e[+-]?\d+)?%?)\s+([+-]?(?:\d*\.?\d+)(?:e[+-]?\d+)?%?)\s+([+-]?(?:\d*\.?\d+)(?:e[+-]?\d+)?(?:deg|grad|rad|turn)?)(?:\s*\/\s*([+-]?(?:\d*\.?\d+)(?:e[+-]?\d+)?%?))?\s*\)/gi,
      (match, lightness: string, chroma: string, hue: string, alpha?: string) => {
        const direct = tryResolveViaCanvas(match);
        return direct || cielchToRgba(lightness, chroma, hue, alpha);
      },
    )
    // color(...) e.g. color(display-p3 ...) or color(srgb ...)
    .replace(
      /color\([^)]+\)/gi,
      (match) => tryResolveViaCanvas(match) || 'rgba(100, 116, 139, 0.9)'
    )
    // color-mix(...)
    .replace(
      /color-mix\([^)]+\)/gi,
      (match) => tryResolveViaCanvas(match) || 'rgba(100, 116, 139, 0.2)'
    )
    .replace(/\bin\s+(?:ok)?(?:lab|lch|srgb)\b/gi, '');
}

/**
 * Captures any HTML element to an HTML5 Canvas with modern Tailwind CSS v4 color compatibility
 * and intelligent boundary delimitation (omits toolbars/action buttons, reveals capture headers).
 */
export async function captureElementToCanvas(elementOrId: string | HTMLElement): Promise<HTMLCanvasElement> {
  const element = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
  if (!element) {
    throw new Error(`Não foi possível localizar o elemento para captura.`);
  }

  // Pre-calcular dimensões com segurança
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
    'textDecorationColor',
    'caretColor',
    'fill',
    'stroke',
  ];

  // Suppress html2canvas "unsupported color function" console warnings (lab, lch, oklab, oklch)
  // These are benign because our onclone handler already converts them before rendering.
  const _originalConsoleError = console.error;
  const _originalConsoleWarn = console.warn;
  const _suppressPattern = /unsupported color function|attempting to parse/i;
  console.error = (...args: unknown[]) => {
    if (args.some((a) => _suppressPattern.test(String(a)))) return;
    _originalConsoleError.apply(console, args);
  };
  console.warn = (...args: unknown[]) => {
    if (args.some((a) => _suppressPattern.test(String(a)))) return;
    _originalConsoleWarn.apply(console, args);
  };

  try {
  return await html2canvas(element, {
    backgroundColor: '#ffffff',
    scale: Math.min(window.devicePixelRatio || 1, 2),
    useCORS: true,
    logging: false,
    width,
    height,
    windowWidth: Math.max(width, document.documentElement.clientWidth),
    windowHeight: Math.max(height, document.documentElement.clientHeight),
    onclone: (clonedDoc, clonedElement) => {
      // 1. Sanitize all <style> tags in the cloned document head/body
      clonedDoc.querySelectorAll('style').forEach((styleEl) => {
        if (styleEl.textContent && /(?:ok)?(?:lab|lch)\(|color(?:-mix)?\(/i.test(styleEl.textContent)) {
          styleEl.textContent = replaceUnsupportedColorFunctions(styleEl.textContent);
        }
      });

      // 2. Sanitize rules in accessible styleSheets
      try {
        Array.from(clonedDoc.styleSheets).forEach((sheet) => {
          try {
            const rules = sheet.cssRules;
            if (!rules) return;
            for (let i = 0; i < rules.length; i++) {
              const rule = rules[i];
              if (rule instanceof CSSStyleRule) {
                const text = rule.style.cssText;
                if (/(?:ok)?(?:lab|lch)\(|color(?:-mix)?\(/i.test(text)) {
                  rule.style.cssText = replaceUnsupportedColorFunctions(text);
                }
              }
            }
          } catch {
            // Cross-origin stylesheet access restriction - safe to skip
          }
        });
      } catch {
        // Safe skip
      }

      // 3. Inspect every element and override computed colors with standard RGBA
      const allElements = [clonedElement, ...clonedElement.querySelectorAll<HTMLElement>('*')];
      
      allElements.forEach((el) => {
        const computed = clonedDoc.defaultView?.getComputedStyle(el);
        if (!computed) return;

        // Convert any lab/lch/oklab/oklch/color-mix in specific color properties
        for (const prop of COLOR_PROPS) {
          const val = (computed as any)[prop];
          if (typeof val === 'string' && /(?:ok)?(?:lab|lch)\(|color(?:-mix)?\(/i.test(val)) {
            const safeProp = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
            el.style.setProperty(safeProp, replaceUnsupportedColorFunctions(val), 'important');
          }
        }

        // Check box-shadow
        const shadow = computed.boxShadow;
        if (shadow && /(?:ok)?(?:lab|lch)\(|color(?:-mix)?\(/i.test(shadow)) {
          el.style.setProperty('box-shadow', replaceUnsupportedColorFunctions(shadow), 'important');
        }

        // Check text-shadow
        const textShadow = (computed as any).textShadow;
        if (textShadow && /(?:ok)?(?:lab|lch)\(|color(?:-mix)?\(/i.test(textShadow)) {
          el.style.setProperty('text-shadow', replaceUnsupportedColorFunctions(textShadow), 'important');
        }

        // Check background-image (gradients)
        const bgImage = computed.backgroundImage;
        if (bgImage && /(?:ok)?(?:lab|lch)\(|color(?:-mix)?\(/i.test(bgImage)) {
          el.style.setProperty('background-image', replaceUnsupportedColorFunctions(bgImage), 'important');
        }

        // Normalize sticky/fixed positioning for full capture
        if (computed.position === 'sticky') el.style.position = 'static';
        if (computed.overflowY === 'auto' || computed.overflowY === 'scroll') {
          el.style.maxHeight = 'none';
          el.style.height = 'auto';
          el.style.overflow = 'visible';
        }

        // Delimitação Inteligente: ocultar botões de ação, menus interativos e elementos marcados
        if (
          el.hasAttribute('data-capture-ignore') ||
          el.classList.contains('no-print') ||
          el.classList.contains('capture-ignore') ||
          (computed.position === 'fixed' && !el.classList.contains('capture-keep'))
        ) {
          el.style.display = 'none';
        }

        // Delimitação Inteligente: revelar cabeçalhos executivos marcados como capture-only
        if (el.classList.contains('capture-only')) {
          el.style.display = 'block';
          el.style.visibility = 'visible';
        }
      });

      clonedElement.style.width = `${width}px`;
      clonedElement.style.maxWidth = 'none';
      clonedElement.style.height = 'auto';
      clonedElement.style.overflow = 'visible';
    },
  });
  } finally {
    // Restore original console methods after html2canvas completes
    console.error = _originalConsoleError;
    console.warn = _originalConsoleWarn;
  }
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
  elementOrId: string | HTMLElement,
  downloadFallbackName: string = 'captura_agenda'
): Promise<CopyImageResult> {
  const canvas = await captureElementToCanvas(elementOrId);

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
  elementOrId: string | HTMLElement,
  fileName: string = 'cronograma-integracao.pdf'
): Promise<void> {
  const canvas = await captureElementToCanvas(elementOrId);

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
  
  const audienceLabel = audience && audience !== 'geral' ? `_${audience}` : '';
  const sanitizedUnit = (unitInfo.unitName || 'unidade').replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeDate = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `cronograma_${sanitizedUnit}${audienceLabel}_${safeDate}.xlsx`);
}

/**
 * Parses an imported Excel .xlsx file back into structured IntegrationSession objects.
 */
export async function parseExcelFile(file: File): Promise<IntegrationSession[]> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rows: any[] = XLSX.utils.sheet_to_json(worksheet);

  return rows.map((row, index) => {
    const rawHorario = row['HORÁRIO'] || row['Horário'] || row['horario'] || '08:00 às 09:00';
    const rawDia = row['DIA'] || row['Dia'] || row['dia'] || 1;
    const rawAudience = row['PÚBLICO'] || row['Público'] || row['publico'] || 'geral';

    const audienceMatch = INTEGRATION_AUDIENCES.find(
      (a) => a.label.toLowerCase() === String(rawAudience).toLowerCase() || a.id === String(rawAudience).toLowerCase()
    );

    return {
      id: `imported-${Date.now()}-${index}`,
      audience: audienceMatch ? audienceMatch.id : 'geral',
      dia: Number(rawDia) || 1,
      horarioText: String(rawHorario),
      startTime: String(rawHorario).split('às')[0]?.trim() || '08:00',
      endTime: String(rawHorario).split('às')[1]?.trim() || '09:00',
      ch: String(row['CH'] || row['Carga Horária'] || '1h'),
      tema: String(row['TEMA'] || row['Tema'] || ''),
      area: String(row['ÁREA'] || row['Área'] || row['area'] || 'GENTE E GESTÃO'),
      responsavel: String(row['RESPONSÁVEL'] || row['Responsável'] || ''),
      prn: String(row['PRN'] || row['prn'] || ''),
      local: String(row['LOCAL'] || row['Local'] || 'Sala de Integração'),
      codigo: String(row['CÓDIGO'] || row['Código'] || ''),
      entregavel: String(row['ENTREGÁVEL'] || row['Entregável'] || ''),
    };
  });
}
