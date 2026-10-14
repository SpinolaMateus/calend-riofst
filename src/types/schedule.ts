export interface IntegrationSession {
  id: string;
  dia: number;
  startTime: string; // "08:20" (HH:mm)
  endTime: string;   // "10:00" (HH:mm)
  horarioText?: string; // Optional custom display (e.g. "08:20 às 10:00")
  ch: string;        // "1h40", "1h", "20min", "3h e 20 min"
  tema: string;
  area: string;      // "GENTE E GESTÃO", "SEGURANÇA", etc.
  responsavel: string;
  prn: string;
  local: string;
  codigo: string;
  entregavel: string;
  observacoes?: string;
  customColor?: string; // override color if desired
}

export interface AreaDefinition {
  id: string;
  name: string;
  bgColor: string;     // Hex color e.g. "#7c3aed"
  textColor: string;   // Hex color e.g. "#ffffff"
  borderColor?: string;
}

export interface UnitInfo {
  unitName: string;       // e.g. "Unidade Curitiba / CD Araucária"
  cohortName: string;     // e.g. "Integração de Novos Colaboradores"
  period: string;         // e.g. "Semana de Acolhimento 2026"
  companyName: string;    // e.g. "Grupo Corporativo"
  locationDefault: string;// e.g. "Sala de Integração - Bloco B"
  contactPerson: string;  // e.g. "Gente & Gestão: (41) 99999-0000"
}

export type ViewMode = 'table' | 'timeline' | 'display';
