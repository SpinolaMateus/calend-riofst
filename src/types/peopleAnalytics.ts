export type ShiftCategory = 
  | 'Turno A'
  | 'Turno B'
  | 'Turno C'
  | 'Administrativo'
  | 'Outras Jornadas';

export type EmploymentGroup = 'CLT' | 'Aprendiz' | 'Estagiário';

export interface Employee {
  prn: string;
  name: string;
  gender?: 'Masculino' | 'Feminino' | string;
  unitCode: string; // 'KBA1'
  unitName: string; // 'Bahia'
  subareaCode: string; // 'K111'
  subareaName: string; // 'Feira de Santana'
  employmentGroup: EmploymentGroup;
  employmentSubgroup?: string;
  costCenterCode: string;
  costCenterName: string;
  macroarea: string;
  locationCode: string;
  locationName: string;
  jobCode: string;
  jobTitle: string;
  position?: string;
  immediateManager: string;
  shiftCode: string;
  shiftName: string;
  shiftCategory: ShiftCategory;
  admissionDate?: string;
  birthDate?: string;
  status: 'Ativo' | 'Férias' | 'Afastado' | 'Desligado';
}

export type IndicatorPolarity = 'higher_is_better' | 'lower_is_better' | 'to_validate';

export interface PeopleAnalyticsKPI {
  id: string;
  name: string;
  description: string;
  category: 'Treinamento' | 'Liderança' | 'Qualidade' | 'G&G' | 'Turnover';
  unit: '%' | 'unidades' | 'horas' | 'índice';
  target1: number;
  target3: number;
  target5: number;
  actual: number | null; // NUNCA inventar, iniciar null
  polarity: IndicatorPolarity;
  polarityNotes?: string;
  responsible: string;
  source: string;
  lastUpdated: string | null;
  recommendedAction?: string;
  history?: { competence: string; actual: number }[];
}

export interface PeopleAnalyticsFilter {
  competence: string;
  employmentGroup: string;
  macroarea: string;
  costCenter: string;
  location: string;
  job: string;
  manager: string;
  shiftCategory: string;
  searchTerm: string;
}

export interface ActionPlanItem {
  id: string;
  title: string;
  indicatorId?: string;
  scope: string; // ex: 'Turno C - Onduladeira'
  evidence: string;
  hypothesis: string;
  suggestedAction: string;
  responsible: string;
  priority: 'Alta' | 'Média' | 'Baixa';
  deadline: string;
  status: 'Planejado' | 'Em Andamento' | 'Concluído' | 'Atrasado';
  createdAt: string;
}

export interface MacroareaMapping {
  costCenterPattern: string;
  macroarea: string;
}

export interface ExcelImportSummary {
  fileName: string;
  totalRowsRead: number;
  validBahiaRows: number;
  discardedOtherUnits: number;
  duplicatesIgnored: number;
  importDate: string;
}

// =========================================================================
// MÓDULO: STATUS DE ENTREGAS & VAGAS ABERTAS (R&S E ENTREGÁVEIS G&G)
// =========================================================================

export type JobVacantStage = 
  | 'RP' 
  | 'Shortlist' 
  | 'Entrevista' 
  | 'Exames Médicos' 
  | 'Integração' 
  | 'Admitido' 
  | 'Cancelada';

export type JobVacantPriority = 'Normal' | 'Alta' | 'Urgente';

export type JobVacantReason = 'Substituição' | 'Aumento de Quadro' | 'Licença/Afastamento';

export interface JobVacancy {
  id: string;
  code: string; // Ex: RP-2026-012
  jobTitle: string;
  locationName: string; // Setor fabril
  macroarea: string;
  shiftCategory: ShiftCategory;
  manager: string;
  reason: JobVacantReason;
  priority: JobVacantPriority;
  stage: JobVacantStage;
  openDate: string; // YYYY-MM-DD
  slaTargetDays: number; // Ex: 30 dias para operacionais, 45 para técnicos
  stageDates: {
    rpDate?: string;
    shortlistDate?: string;
    interviewDate?: string;
    medicalExamDate?: string;
    integrationDate?: string;
    closedDate?: string;
  };
  finalCandidateName?: string;
  notes?: string;
}

export type DeliverableStatus = 'Planejado' | 'Em Andamento' | 'Concluído' | 'Em Risco' | 'Atrasado';

export interface GGDeliverable {
  id: string;
  code: string; // Ex: ENT-2026-05
  title: string;
  category: 'Recrutamento & Seleção' | 'DHO & Treinamento' | 'Clima & Engajamento' | 'Relações Trabalhistas' | 'SSMA & Saúde Ocupacional';
  scope: string; // Ex: Fábrica Toda, Onduladeira, Turno C
  responsible: string;
  targetDate: string; // YYYY-MM-DD
  completedDate?: string;
  status: DeliverableStatus;
  progressPct: number; // 0 - 100
  notes?: string;
}


