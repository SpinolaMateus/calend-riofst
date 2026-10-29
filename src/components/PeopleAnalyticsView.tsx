import React, { useState, useMemo, useRef } from 'react';
import { 
  Users, Building2, Briefcase, Clock, Calendar, BarChart3, 
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, 
  Search, Filter, X, Download, FileSpreadsheet, Plus, 
  ArrowLeft, RefreshCw, Layers, ShieldCheck, ChevronRight,
  Info, Sparkles, UserCheck, ShieldAlert, Check, HelpCircle,
  FolderTree, GitCommit, FileText, UploadCloud, Edit3, ArrowUpRight,
  Factory, Sliders, Menu, Award
} from 'lucide-react';
import { 
  Employee, PeopleAnalyticsKPI, PeopleAnalyticsFilter, 
  ShiftCategory, ActionPlanItem, ExcelImportSummary 
} from '../types/peopleAnalytics';
import { 
  OFFICIAL_GG_KPIS, 
  generateInitialBahiaEmployees, 
  INITIAL_MACROAREA_MAPPINGS, 
  INITIAL_ACTION_PLANS 
} from '../data/initialPeopleAnalytics';
import * as XLSX from 'xlsx';
import { copyElementAsImage, exportElementToPDF } from '../utils/exportUtils';
import { ExecutiveOverviewTab } from './peopleAnalytics/ExecutiveOverviewTab';
import { HeadcountAnalyticsTab } from './peopleAnalytics/HeadcountAnalyticsTab';
import { IndicatorsGGTab } from './peopleAnalytics/IndicatorsGGTab';
import { DeliveriesAndVacanciesTab } from './peopleAnalytics/DeliveriesAndVacanciesTab';
import { INITIAL_JOB_VACANCIES, INITIAL_GG_DELIVERABLES } from '../data/initialDeliveriesData';
import { JobVacancy, GGDeliverable } from '../types/peopleAnalytics';
import { AbsenteeismMovementsTab } from './peopleAnalytics/AbsenteeismMovementsTab';
import { SectorsShiftsTab } from './peopleAnalytics/SectorsShiftsTab';
import { FormationsDashboard } from './FormationsDashboard';
import { AuditFormulasModal } from './peopleAnalytics/AuditFormulasModal';
import { CalculationRulesModal } from './peopleAnalytics/CalculationRulesModal';
import { SuperarTab } from './peopleAnalytics/SuperarTab';
import { 
  SUPERAR_AUDITS_2026, SUPERAR_INDICATORS_2026, 
  SUPERAR_AUDITS_2027, SUPERAR_INDICATORS_2027,
  SuperarAudit, SuperarMonthlyIndicator 
} from '../data/superarInitialData';

export type TabType = 
  | 'overview' 
  | 'headcount' 
  | 'jobs_shifts' 
  | 'indicators' 
  | 'superar'
  | 'absenteeism' 
  | 'movements' 
  | 'trainings' 
  | 'action_plans' 
  | 'data_entry' 
  | 'admin';

interface PeopleAnalyticsViewProps {
  onBackToHome: () => void;
  initialTab?: TabType;
}

export const PeopleAnalyticsView: React.FC<PeopleAnalyticsViewProps> = ({ onBackToHome, initialTab }) => {
  // Estado principal de Colaboradores da Unidade Bahia (KBA1 / K111)
  const [employees, setEmployees] = useState<Employee[]>(() => {
    try {
      const stored = localStorage.getItem('kba1_people_analytics_employees_v3');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].gender && parsed[0].admissionDate) {
          return parsed;
        }
      }
      const initial = generateInitialBahiaEmployees();
      localStorage.setItem('kba1_people_analytics_employees_v3', JSON.stringify(initial));
      return initial;
    } catch {
      return generateInitialBahiaEmployees();
    }
  });

  // Estado dos 9 Indicadores Oficiais com Metas
  const [kpis, setKpis] = useState<PeopleAnalyticsKPI[]>(() => {
    try {
      const stored = localStorage.getItem('kba1_people_analytics_kpis_v1');
      return stored ? JSON.parse(stored) : OFFICIAL_GG_KPIS;
    } catch {
      return OFFICIAL_GG_KPIS;
    }
  });

  // Planos de ação
  const [actionPlans, setActionPlans] = useState<ActionPlanItem[]>(() => {
    try {
      const stored = localStorage.getItem('kba1_people_analytics_actions_v1');
      return stored ? JSON.parse(stored) : INITIAL_ACTION_PLANS;
    } catch {
      return INITIAL_ACTION_PLANS;
    }
  });

  // Estado das Vagas Abertas por Fases (R&S)
  const [vacancies, setVacancies] = useState<JobVacancy[]>(() => {
    try {
      const stored = localStorage.getItem('kba1_gg_job_positions_v1');
      return stored ? JSON.parse(stored) : INITIAL_JOB_VACANCIES;
    } catch {
      return INITIAL_JOB_VACANCIES;
    }
  });

  // Estado dos Entregáveis Estratégicos de G&G
  const [deliverables, setDeliverables] = useState<GGDeliverable[]>(() => {
    try {
      const stored = localStorage.getItem('kba1_gg_deliverables_v1');
      return stored ? JSON.parse(stored) : INITIAL_GG_DELIVERABLES;
    } catch {
      return INITIAL_GG_DELIVERABLES;
    }
  });

  // Estado das Auditorias e Indicadores do Programa Superar organizados por Ano (2026 e 2027)
  const [superarYear, setSuperarYear] = useState<number>(2026);
  const [superarDataByYear, setSuperarDataByYear] = useState<{
    [year: number]: {
      indicators: SuperarMonthlyIndicator[];
      audits: SuperarAudit[];
    };
  }>(() => {
    try {
      const stored2026Ind = localStorage.getItem('kba1_superar_indicators_2026');
      const stored2027Ind = localStorage.getItem('kba1_superar_indicators_2027');
      const stored2026Aud = localStorage.getItem('kba1_superar_audits_2026');
      const stored2027Aud = localStorage.getItem('kba1_superar_audits_2027');

      return {
        2026: {
          indicators: stored2026Ind ? JSON.parse(stored2026Ind) : SUPERAR_INDICATORS_2026,
          audits: stored2026Aud ? JSON.parse(stored2026Aud) : SUPERAR_AUDITS_2026,
        },
        2027: {
          indicators: stored2027Ind ? JSON.parse(stored2027Ind) : SUPERAR_INDICATORS_2027,
          audits: stored2027Aud ? JSON.parse(stored2027Aud) : SUPERAR_AUDITS_2027,
        }
      };
    } catch {
      return {
        2026: { indicators: SUPERAR_INDICATORS_2026, audits: SUPERAR_AUDITS_2026 },
        2027: { indicators: SUPERAR_INDICATORS_2027, audits: SUPERAR_AUDITS_2027 },
      };
    }
  });

  const currentSuperarIndicators = superarDataByYear[superarYear]?.indicators || SUPERAR_INDICATORS_2026;
  const currentSuperarAudits = superarDataByYear[superarYear]?.audits || SUPERAR_AUDITS_2026;

  const saveSuperarYearData = (y: number, inds: SuperarMonthlyIndicator[], auds: SuperarAudit[]) => {
    setSuperarDataByYear(prev => {
      const next = {
        ...prev,
        [y]: { indicators: inds, audits: auds }
      };
      try {
        localStorage.setItem(`kba1_superar_indicators_${y}`, JSON.stringify(inds));
        localStorage.setItem(`kba1_superar_audits_${y}`, JSON.stringify(auds));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
    showToast(`Dados do Ciclo ${y} salvos com sucesso!`);
  };

  // Mapeamento de Macroáreas
  const [macroMappings] = useState(INITIAL_MACROAREA_MAPPINGS);

  // Navegação de Abas do Menu
  const [activeTab, setActiveTab] = useState<TabType>(initialTab || 'overview');

  // Filtros Globais Interdependentes
  const [filters, setFilters] = useState<PeopleAnalyticsFilter>({
    competence: '10/2026',
    employmentGroup: 'all',
    macroarea: 'all',
    costCenter: 'all',
    location: 'all',
    job: 'all',
    manager: 'all',
    shiftCategory: 'all',
    searchTerm: '',
  });

  // Modais de Governança e Regras
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isCalculationRulesModalOpen, setIsCalculationRulesModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Modais e Diálogos
  const [selectedKPI, setSelectedKPI] = useState<PeopleAnalyticsKPI | null>(null);
  const [isKPIModalOpen, setIsKPIModalOpen] = useState(false);
  const [kpiActualInput, setKpiActualInput] = useState<string>('');

  const [isNewActionModalOpen, setIsNewActionModalOpen] = useState(false);
  const [newActionForm, setNewActionForm] = useState<Partial<ActionPlanItem>>({
    priority: 'Média',
    status: 'Planejado',
  });

  // Estado para Entrada de Dados & Atualização Manual
  const [dataEntryTab, setDataEntryTab] = useState<'import' | 'manual'>('manual');
  const [manualFormType, setManualFormType] = useState<'superar' | 'employee' | 'kpi' | 'action'>('superar');
  const [importSummary, setImportSummary] = useState<ExcelImportSummary | null>(null);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [allImportedEmployees, setAllImportedEmployees] = useState<Employee[]>([]);
  const [importFeedback, setImportFeedback] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Estados para atualização manual de meses do Superar
  const [selectedSuperarIndId, setSelectedSuperarIndId] = useState<string>('habilidade_piloto');
  const [selectedSuperarMonth, setSelectedSuperarMonth] = useState<string>('OUT');
  const [superarValInput, setSuperarValInput] = useState<string>('');
  const [superarNoteInput, setSuperarNoteInput] = useState<string>('');

  // Estados para atualização manual de auditorias do Superar
  const [selectedSuperarAuditId, setSelectedSuperarAuditId] = useState<string>('aud_passo');
  const [selectedSuperarAuditMonth, setSelectedSuperarAuditMonth] = useState<string>('ABR');
  const [superarAuditValInput, setSuperarAuditValInput] = useState<string>('');

  // Formulário manual de novo colaborador
  const [newEmployeeForm, setNewEmployeeForm] = useState<Partial<Employee>>({
    employmentGroup: 'CLT',
    shiftCategory: 'Turno A',
    status: 'Ativo',
  });

  // Toast temporário
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Salvar no localStorage quando houver alterações
  const saveEmployees = (data: Employee[]) => {
    setEmployees(data);
    try {
      localStorage.setItem('kba1_people_analytics_employees_v3', JSON.stringify(data));
    } catch (e) {
      console.error(e);
    }
  };

  const saveKPIs = (data: PeopleAnalyticsKPI[]) => {
    setKpis(data);
    try {
      localStorage.setItem('kba1_people_analytics_kpis_v1', JSON.stringify(data));
    } catch (e) {
      console.error(e);
    }
  };

  const saveActionPlans = (data: ActionPlanItem[]) => {
    setActionPlans(data);
    try {
      localStorage.setItem('kba1_people_analytics_actions_v1', JSON.stringify(data));
    } catch (e) {
      console.error(e);
    }
  };

  const saveVacancies = (data: JobVacancy[]) => {
    setVacancies(data);
    try {
      localStorage.setItem('kba1_gg_job_positions_v1', JSON.stringify(data));
    } catch (e) {
      console.error(e);
    }
    showToast('Vagas atualizadas com sucesso!');
  };

  const saveDeliverables = (data: GGDeliverable[]) => {
    setDeliverables(data);
    try {
      localStorage.setItem('kba1_gg_deliverables_v1', JSON.stringify(data));
    } catch (e) {
      console.error(e);
    }
    showToast('Entregáveis G&G atualizados com sucesso!');
  };

  // =========================================================================
  // OPÇÕES DE FILTRO DINÂMICAS BASEADAS NOS DADOS
  // =========================================================================
  const filterOptions = useMemo(() => {
    const macroareas = Array.from(new Set(employees.map(e => e.macroarea).filter(Boolean))).sort();
    const costCenters = Array.from(new Set(employees.map(e => e.costCenterName).filter(Boolean))).sort();
    const locations = Array.from(new Set(employees.map(e => e.locationName).filter(Boolean))).sort();
    const jobs = Array.from(new Set(employees.map(e => e.jobTitle).filter(Boolean))).sort();
    const managers = Array.from(new Set(employees.map(e => e.immediateManager).filter(Boolean))).sort();
    const shifts: ShiftCategory[] = ['Turno A', 'Turno B', 'Turno C', 'Administrativo', 'Outras Jornadas'];
    const employmentGroups = ['CLT', 'Aprendiz', 'Estagiário'];

    return { macroareas, costCenters, locations, jobs, managers, shifts, employmentGroups };
  }, [employees]);

  // =========================================================================
  // DADOS FILTRADOS
  // =========================================================================
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      if (filters.employmentGroup !== 'all' && emp.employmentGroup !== filters.employmentGroup) return false;
      if (filters.macroarea !== 'all' && emp.macroarea !== filters.macroarea) return false;
      if (filters.costCenter !== 'all' && emp.costCenterName !== filters.costCenter) return false;
      if (filters.location !== 'all' && emp.locationName !== filters.location) return false;
      if (filters.job !== 'all' && emp.jobTitle !== filters.job) return false;
      if (filters.manager !== 'all' && emp.immediateManager !== filters.manager) return false;
      if (filters.shiftCategory !== 'all' && emp.shiftCategory !== filters.shiftCategory) return false;
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        const matchName = emp.name.toLowerCase().includes(term);
        const matchPRN = emp.prn.toLowerCase().includes(term);
        const matchJob = emp.jobTitle.toLowerCase().includes(term);
        const matchCC = emp.costCenterName.toLowerCase().includes(term);
        if (!matchName && !matchPRN && !matchJob && !matchCC) return false;
      }
      return true;
    });
  }, [employees, filters]);

  // =========================================================================
  // MÉTRICAS E DISTRIBUIÇÕES CALCULADAS
  // =========================================================================
  const metrics = useMemo(() => {
    const total = filteredEmployees.length;
    const clt = filteredEmployees.filter(e => e.employmentGroup === 'CLT').length;
    const aprendizes = filteredEmployees.filter(e => e.employmentGroup === 'Aprendiz').length;
    const estagiarios = filteredEmployees.filter(e => e.employmentGroup === 'Estagiário').length;
    const ativos = filteredEmployees.filter(e => e.status === 'Ativo').length;
    const ferias = filteredEmployees.filter(e => e.status === 'Férias').length;
    const afastados = filteredEmployees.filter(e => e.status === 'Afastado').length;

    const uniqueCC = new Set(filteredEmployees.map(e => e.costCenterName)).size;
    const uniqueLocations = new Set(filteredEmployees.map(e => e.locationName)).size;
    const uniqueJobs = new Set(filteredEmployees.map(e => e.jobTitle)).size;
    const uniqueManagers = new Set(filteredEmployees.map(e => e.immediateManager)).size;

    // Distribuição de turnos
    const shiftDistribution = {
      'Turno A': filteredEmployees.filter(e => e.shiftCategory === 'Turno A').length,
      'Turno B': filteredEmployees.filter(e => e.shiftCategory === 'Turno B').length,
      'Turno C': filteredEmployees.filter(e => e.shiftCategory === 'Turno C').length,
      'Administrativo': filteredEmployees.filter(e => e.shiftCategory === 'Administrativo').length,
      'Outras Jornadas': filteredEmployees.filter(e => e.shiftCategory === 'Outras Jornadas').length,
    };

    // Ranking dos principais Centros de Custo
    const ccCounts = filteredEmployees.reduce((acc, emp) => {
      acc[emp.costCenterName] = (acc[emp.costCenterName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sortedCostCenters = Object.entries(ccCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Ranking dos principais Cargos
    const jobCounts = filteredEmployees.reduce((acc, emp) => {
      acc[emp.jobTitle] = (acc[emp.jobTitle] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sortedJobs = Object.entries(jobCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Distribuição por Macroárea
    const macroCounts = filteredEmployees.reduce((acc, emp) => {
      acc[emp.macroarea] = (acc[emp.macroarea] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sortedMacro = Object.entries(macroCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return {
      total,
      clt,
      aprendizes,
      estagiarios,
      ativos,
      ferias,
      afastados,
      uniqueCC,
      uniqueLocations,
      uniqueJobs,
      uniqueManagers,
      shiftDistribution,
      sortedCostCenters,
      sortedJobs,
      sortedMacro,
    };
  }, [filteredEmployees]);

  // Contagem de filtros ativos
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.employmentGroup !== 'all') count++;
    if (filters.macroarea !== 'all') count++;
    if (filters.costCenter !== 'all') count++;
    if (filters.location !== 'all') count++;
    if (filters.job !== 'all') count++;
    if (filters.manager !== 'all') count++;
    if (filters.shiftCategory !== 'all') count++;
    if (filters.searchTerm) count++;
    return count;
  }, [filters]);

  const clearFilters = () => {
    setFilters({
      competence: '10/2026',
      employmentGroup: 'all',
      macroarea: 'all',
      costCenter: 'all',
      location: 'all',
      job: 'all',
      manager: 'all',
      shiftCategory: 'all',
      searchTerm: '',
    });
  };

  // =========================================================================
  // IMPORTAÇÃO DE PLANILHA EXCEL / PAAH
  // =========================================================================
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json<any>(ws, { header: 1 });

        if (data.length <= 1) {
          setImportFeedback({ message: 'Planilha vazia ou sem linhas válidas.', type: 'error' });
          return;
        }

        const headers = (data[0] as string[]).map(h => String(h || '').trim());
        const rows = data.slice(1);

        let totalRead = rows.length;
        let validBahia: Employee[] = [];
        let discardedOther = 0;

        // Índices de colunas do PAAH
        const idxPRN = headers.findIndex(h => /prn|matr/i.test(h));
        const idxFullName = headers.findIndex(h => /nome completo/i.test(h));
        const idxName = headers.findIndex(h => /^nome$/i.test(h));
        const idxLastName = headers.findIndex(h => /sobrenome/i.test(h));
        const idxGender = headers.findIndex(h => /sexo|gênero|genero|gender/i.test(h));
        const idxUnit = headers.findIndex(h => /área de recursos humanos.*código|área de recursos humanos|area rh|unidade/i.test(h));
        const idxSubarea = headers.findIndex(h => /subárea|subarea/i.test(h));
        const idxGroup = headers.findIndex(h => /grupo de empregados|vínculo|vinculo/i.test(h));
        const idxSubgroup = headers.findIndex(h => /subgrupo/i.test(h));
        const idxCC = headers.findIndex(h => /centro de custo/i.test(h));
        const idxLoc = headers.findIndex(h => /local/i.test(h));
        const idxJob = headers.findIndex(h => /^cargo$/i.test(h) || /código do cargo/i.test(h));
        const idxPos = headers.findIndex(h => /^posição$/i.test(h));
        const idxManager = headers.findIndex(h => /gestor imediato|gestor/i.test(h));
        
        // No PAAH, a coluna 38 (Nome) é o Nome da Jornada/Turno
        let idxShift = -1;
        for (let j = headers.length - 1; j >= 0; j--) {
          if (/nome/i.test(headers[j]) && j > 20) {
            idxShift = j;
            break;
          }
        }
        if (idxShift === -1) {
          idxShift = headers.findIndex(h => /jornada|escala|horário|horario/i.test(h));
        }

        const getMacro = (cc: string, loc: string) => {
          const s = (cc + ' ' + loc).toLowerCase();
          if (s.includes('expedi') || s.includes('logística') || s.includes('logistica')) return 'Logística & Expedição';
          if (s.includes('manuten') || s.includes('caldeira') || s.includes('utilidade') || s.includes('elétrica') || s.includes('eletrica') || s.includes('mecânica') || s.includes('mecanica')) return 'Manutenção & Utilidades';
          if (s.includes('gente') || s.includes('rh') || s.includes('superar') || s.includes('treinamento') || s.includes('segurança') || s.includes('ssma') || s.includes('controladoria') || s.includes('ti') || s.includes('comercial') || s.includes('atendimento')) return 'Gente & Gestão & ADM';
          return 'Operação Fabril';
        };

        const cleanLoc = (raw: string) => {
          if (!raw) return 'Geral FST';
          const parts = raw.split('-');
          return parts.length > 1 ? parts.slice(1).join('-').trim() : raw.trim();
        };

        const cleanCC = (raw: string) => {
          if (!raw) return 'Geral';
          const parts = raw.split('-');
          return parts.length > 1 ? parts.slice(1).join('-').trim() : raw.trim();
        };

        rows.forEach((row, i) => {
          if (!row || row.length === 0) return;

          const unitVal = idxUnit !== -1 ? String(row[idxUnit] || '') : 'KBA1';
          const subareaVal = idxSubarea !== -1 ? String(row[idxSubarea] || '') : 'K111';

          // Filtro estrito: apenas KBA1 (Bahia) / K111 (Feira de Santana)
          const isBahia = /kba1|bahia/i.test(unitVal) || /k111|feira/i.test(subareaVal) || (idxUnit === -1 && idxSubarea === -1);

          if (!isBahia) {
            discardedOther++;
            return;
          }

          const prn = idxPRN !== -1 && row[idxPRN] ? String(row[idxPRN]).trim() : `15${String(i).padStart(4, '0')}`;
          
          let name = '';
          if (idxFullName !== -1 && row[idxFullName]) {
            name = String(row[idxFullName]).trim();
          } else if (idxName !== -1 && row[idxName]) {
            const firstName = String(row[idxName]).trim();
            const lastName = idxLastName !== -1 && row[idxLastName] ? String(row[idxLastName]).trim() : '';
            name = `${firstName} ${lastName}`.trim();
          } else {
            name = `Colaborador(a) PRN ${prn}`;
          }

          const rawSex = idxGender !== -1 ? String(row[idxGender] || '').trim().toLowerCase() : '';
          const gender: 'Masculino' | 'Feminino' = rawSex.startsWith('f') || rawSex === 'feminino' ? 'Feminino' : 'Masculino';

          const groupRaw = idxGroup !== -1 ? String(row[idxGroup] || '').toLowerCase() : 'clt';
          const employmentGroup: 'CLT' | 'Aprendiz' | 'Estagiário' = 
            groupRaw.includes('aprendiz') ? 'Aprendiz' : groupRaw.includes('estagi') ? 'Estagiário' : 'CLT';

          const ccRaw = idxCC !== -1 && row[idxCC] ? String(row[idxCC]).trim() : 'Produção Geral';
          const locRaw = idxLoc !== -1 && row[idxLoc] ? String(row[idxLoc]).trim() : 'Área Operacional';
          const jobTitle = idxJob !== -1 && row[idxJob] ? String(row[idxJob]).trim() : 'Operador';
          const manager = idxManager !== -1 && row[idxManager] ? String(row[idxManager]).trim() : 'Gestor Operacional';
          const shiftText = idxShift !== -1 && row[idxShift] ? String(row[idxShift]).trim() : 'Turno A';

          let shiftCat: ShiftCategory = 'Turno A';
          const sLower = shiftText.toLowerCase();
          if (sLower.includes('06:00-14:20') || sLower.includes('06:00 às 14:20') || sLower.includes('06:00 as 14:20') || sLower.includes('turno 1') || sLower.includes('manhã')) {
            shiftCat = 'Turno A';
          } else if (sLower.includes('14:20-22:30') || sLower.includes('14:20 às 22:30') || sLower.includes('14:20 as 22:30') || sLower.includes('turno 2') || sLower.includes('tarde')) {
            shiftCat = 'Turno B';
          } else if (sLower.includes('22:30-06:00') || sLower.includes('22:30 às 06:00') || sLower.includes('22:30 as 06:00') || sLower.includes('turno 3') || sLower.includes('noite')) {
            shiftCat = 'Turno C';
          } else if (sLower.includes('08:00-17:00') || sLower.includes('08:00 às 17:00') || sLower.includes('5x2 08:00') || sLower.includes('adm')) {
            shiftCat = 'Administrativo';
          } else {
            shiftCat = 'Outras Jornadas';
          }

          validBahia.push({
            prn,
            name,
            gender,
            unitCode: 'KBA1',
            unitName: 'Bahia',
            subareaCode: 'K111',
            subareaName: 'Feira de Santana',
            employmentGroup,
            employmentSubgroup: idxSubgroup !== -1 && row[idxSubgroup] ? String(row[idxSubgroup]).trim() : employmentGroup,
            costCenterCode: ccRaw.split('-')[0] || '10001',
            costCenterName: cleanCC(ccRaw),
            macroarea: getMacro(ccRaw, locRaw),
            locationCode: locRaw.split('-')[0] || '10400',
            locationName: cleanLoc(locRaw),
            jobCode: 'JOB-PAAH',
            jobTitle,
            position: idxPos !== -1 && row[idxPos] ? String(row[idxPos]).trim() : undefined,
            immediateManager: manager,
            shiftCode: 'JRN-PAAH',
            shiftName: shiftText,
            shiftCategory: shiftCat,
            status: 'Ativo',
          });
        });

        setAllImportedEmployees(validBahia);
        setImportSummary({
          fileName: file.name,
          totalRowsRead: totalRead,
          validBahiaRows: validBahia.length,
          discardedOtherUnits: discardedOther,
          duplicatesIgnored: 0,
          importDate: new Date().toLocaleString('pt-BR'),
        });

        setImportPreview(validBahia.slice(0, 10));
        setImportFeedback({
          message: `Arquivo analisado com sucesso! ${validBahia.length} colaboradores elegíveis da Bahia identificados (${validBahia.filter(e => e.gender === 'Feminino').length} mulheres, ${validBahia.filter(e => e.gender === 'Masculino').length} homens). ${discardedOther} registros de outras unidades (Ceará/etc) descartados.`,
          type: 'success',
        });
      } catch (err: any) {
        console.error(err);
        setImportFeedback({ message: `Erro ao processar arquivo: ${err.message}`, type: 'error' });
      }
    };
    reader.readAsBinaryString(file);
  };

  const confirmImport = () => {
    if (!importSummary || allImportedEmployees.length === 0) return;
    saveEmployees(allImportedEmployees);
    showToast(`Base importada com sucesso! ${allImportedEmployees.length} colaboradores carregados.`);
    setImportFeedback({
      message: `Importação confirmada e salva! Base atualizada com ${allImportedEmployees.length} colaboradores da Bahia.`,
      type: 'success',
    });
    setActiveTab('headcount');
  };

  // =========================================================================
  // EXPORTAÇÃO EXCEL E PDF
  // =========================================================================
  const exportToExcel = () => {
    const dataToExport = filteredEmployees.map(emp => ({
      'PRN': emp.prn,
      'Nome': emp.name,
      'Sexo': emp.gender || 'Masculino',
      'Unidade': emp.unitCode,
      'Subárea': emp.subareaName,
      'Vínculo': emp.employmentGroup,
      'Macroárea': emp.macroarea,
      'Centro de Custo': emp.costCenterName,
      'Local / Setor': emp.locationName,
      'Cargo': emp.jobTitle,
      'Turno': emp.shiftCategory,
      'Jornada Detalhada': emp.shiftName,
      'Gestor Imediato': emp.immediateManager,
      'Status': emp.status,
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Quadro Bahia');
    XLSX.writeFile(wb, `People_Analytics_KBA1_${filters.competence.replace('/', '-')}.xlsx`);
    showToast('Relatório Excel gerado e baixado!');
  };

  const handleCopyAsImage = async () => {
    try {
      const el = document.getElementById('people-analytics-capture-area');
      if (!el) return;
      const res = await copyElementAsImage(el, 'people_analytics_kba1');
      if (res.method === 'clipboard') {
        showToast('Painel copiado como imagem! Você já pode colar onde quiser.');
      } else {
        showToast('Imagem do painel baixada com sucesso no seu computador!');
      }
    } catch (err: any) {
      console.error(err);
      showToast('Não foi possível copiar como imagem no momento.');
    }
  };

  const handlePrintPDF = () => {
    window.print();
  };

  // Lançar realizado para um KPI
  const handleSaveKPIActual = () => {
    if (!selectedKPI) return;
    const val = parseFloat(kpiActualInput.replace(',', '.'));
    if (isNaN(val)) {
      alert('Por favor insira um valor numérico válido.');
      return;
    }

    const updated = kpis.map(k => {
      if (k.id === selectedKPI.id) {
        return {
          ...k,
          actual: val,
          lastUpdated: new Date().toLocaleString('pt-BR'),
        };
      }
      return k;
    });

    saveKPIs(updated);
    setIsKPIModalOpen(false);
    setSelectedKPI(null);
    setKpiActualInput('');
    showToast(`Resultado realizado salvo para ${selectedKPI.name}!`);
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-slate-800 flex font-sans">
      
      {/* ========================================================================= */}
      {/* 1. SIDEBAR CORPORATIVA FIXA — KBA1 ANALYTICS */}
      {/* ========================================================================= */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#0a3641] text-white flex flex-col justify-between shadow-2xl transition-transform duration-200 lg:translate-x-0 ${
        isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Top Brand */}
          <div className="p-5 border-b border-[#306576]/30">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-[#6ffbbe] shadow-sm">
                <Factory className="w-6 h-6" />
              </div>
              <div>
                <span className="text-base font-bold text-white tracking-tight block">KBA1 Analytics</span>
                <span className="text-[10px] text-[#799fac] uppercase tracking-wider font-semibold">Papelão Ondulado</span>
              </div>
            </div>
            
            <div className="bg-[#002028] px-3 py-2 rounded-lg flex items-center justify-between border border-[#306576]/40">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white">KBA1 • Feira de Santana (BA)</span>
              </div>
              <span className="h-2 w-2 rounded-full bg-[#6ffbbe] animate-pulse" title="Sistema Conectado" />
            </div>
          </div>

          {/* Nav links */}
          <nav className="flex-1 p-3 space-y-1">
            {[
              { id: 'overview', label: 'Visão Executiva', icon: BarChart3 },
              { id: 'headcount', label: `Quadro de Pessoal (${filteredEmployees.length})`, icon: Users },
              { id: 'jobs_shifts', label: 'Setores & Turnos', icon: Clock },
              { id: 'indicators', label: `Status Entregas & Vagas (${vacancies.filter(v => v.stage !== 'Admitido' && v.stage !== 'Cancelada').length})`, icon: Briefcase },
              { id: 'superar', label: 'Programa Superar', icon: Award },
              { id: 'absenteeism', label: 'Absenteísmo & Movimentações', icon: TrendingDown },
              { id: 'trainings', label: 'Treinamento & DHO', icon: Layers },
              { id: 'action_plans', label: 'Inteligência Analítica', icon: AlertTriangle },
              { id: 'data_entry', label: 'Atualizar Dados', icon: UploadCloud },
            ].map((item) => {
              const Icon = item.icon || BarChart3;
              const isActive = activeTab === item.id || (item.id === 'absenteeism' && activeTab === 'movements');
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as TabType);
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#306576] text-white border-l-4 border-[#6ffbbe] shadow-sm'
                      : 'text-[#a5cdda] hover:bg-[#306576]/40 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0 text-[#6ffbbe]" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sidebar Footer */}
        <div className="p-4 border-t border-[#306576]/30 bg-[#002028]/60 space-y-2.5">
          <div className="flex items-center justify-between text-[11px] text-[#799fac]">
            <span>Competência: <strong className="text-white">{filters.competence}</strong></span>
            <span className="text-[#6ffbbe] font-semibold">LGPD Auditada</span>
          </div>
          <button
            onClick={onBackToHome}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold border border-white/10 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Início</span>
          </button>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. ÁREA PRINCIPAL COM HEADER EXECUTIVO & CONTEÚDO DAS ABAS */}
      {/* ========================================================================= */}
      <div className="flex-1 lg:ml-72 flex flex-col min-w-0 min-h-screen">
        
        {/* Top Header Bar */}
        <header data-capture-ignore className="no-print bg-[#132F46] text-white border-b border-slate-700/80 sticky top-0 z-30 shadow-md">
          <div className="px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
            
            <div className="flex items-center gap-3 w-full md:w-auto">
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white lg:hidden"
                title="Abrir Menu Lateral"
              >
                <Menu className="w-5 h-5" />
              </button>
              
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
                    People Analytics
                    <span className="text-[#6ffbbe] font-normal text-sm">| Feira de Santana</span>
                  </h1>
                  <span className="hidden sm:inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    KBA1 / K111
                  </span>
                </div>
                <p className="text-xs text-slate-300 flex items-center gap-2 mt-0.5">
                  <span>Competência: <strong>{filters.competence}</strong></span>
                  <span>•</span>
                  <span className="text-emerald-300 font-medium">{filteredEmployees.length} PRNs Ativos</span>
                </p>
              </div>
            </div>

            {/* Ações Rápidas */}
            <div className="flex items-center gap-2 flex-wrap self-end md:self-auto">
              <button
                onClick={() => setIsAuditModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 font-semibold text-xs transition-all"
                title="Auditar Regras & Fórmulas"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#6ffbbe]" />
                <span className="hidden sm:inline">Auditar Metas</span>
              </button>

              <button
                onClick={exportToExcel}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 font-semibold text-xs transition-all"
                title="Exportar dados filtrados para Excel"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Excel</span>
              </button>

              <button
                onClick={handleCopyAsImage}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 font-semibold text-xs transition-all"
                title="Copiar relatório como imagem"
              >
                <Download className="w-3.5 h-3.5 text-sky-400" />
                <span className="hidden sm:inline">Copiar Imagem</span>
              </button>

              <button
                onClick={handlePrintPDF}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 font-semibold text-xs transition-all"
                title="Imprimir ou salvar PDF"
              >
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">PDF</span>
              </button>

              <button
                onClick={() => {
                  setDataEntryTab('import');
                  setActiveTab('data_entry');
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-sm"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Importar</span>
              </button>
            </div>
          </div>
        </header>

        {/* Barra de Filtros Globais Interdependentes */}
        <div data-capture-ignore className="no-print bg-white border-b border-slate-200/90 px-4 sm:px-6 lg:px-8 py-2.5">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Competência */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-semibold">Competência:</span>
                <select
                  value={filters.competence}
                  onChange={e => setFilters(f => ({ ...f, competence: e.target.value }))}
                  className="bg-[#eff4ff] border border-slate-200 text-[#0b1c30] rounded-lg px-2.5 py-1 font-semibold focus:outline-none focus:ring-1 focus:ring-[#306576]"
                >
                  <option value="10/2026">Outubro / 2026</option>
                  <option value="09/2026">Setembro / 2026</option>
                  <option value="08/2026">Agosto / 2026</option>
                </select>
              </div>

              {/* Macroárea */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-semibold">Macroárea:</span>
                <select
                  value={filters.macroarea}
                  onChange={e => setFilters(f => ({ ...f, macroarea: e.target.value }))}
                  className="bg-[#eff4ff] border border-slate-200 text-[#0b1c30] rounded-lg px-2.5 py-1 font-semibold focus:outline-none focus:ring-1 focus:ring-[#306576]"
                >
                  <option value="all">Todas as Macroáreas</option>
                  <option value="Operação Fabril">Operação Fabril</option>
                  <option value="Logística & Expedição">Logística & Expedição</option>
                  <option value="Manutenção & Utilidades">Manutenção & Utilidades</option>
                  <option value="Gente & Gestão & ADM">Gente & Gestão & ADM</option>
                </select>
              </div>

              {/* Turno */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-semibold">Turno:</span>
                <select
                  value={filters.shiftCategory}
                  onChange={e => setFilters(f => ({ ...f, shiftCategory: e.target.value }))}
                  className="bg-[#eff4ff] border border-slate-200 text-[#0b1c30] rounded-lg px-2.5 py-1 font-semibold focus:outline-none focus:ring-1 focus:ring-[#306576]"
                >
                  <option value="all">Todos os Turnos</option>
                  <option value="Turno A">Turno 1 (06:00 - 14:20)</option>
                  <option value="Turno B">Turno 2 (14:20 - 22:30)</option>
                  <option value="Turno C">Turno 3 (22:30 - 06:00)</option>
                  <option value="Administrativo">Administrativo (08:00 - 17:48)</option>
                  <option value="Outras Jornadas">Outras Jornadas / Jovens</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#ecfdf5] text-[#047857] border border-[#a7f3d0]">
                LGPD Auditada • Sigilo Fabril
              </span>
            </div>
          </div>
        </div>

        {/* CONTAINER CAPTURÁVEL DO CONTEÚDO */}
        <main id="people-analytics-capture-area" className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          
          {/* CABEÇALHO EXECUTIVO APENAS PARA CAPTURA DE IMAGEM / PDF */}
          <div data-capture-only className="hidden bg-white p-4 rounded-xl border border-slate-200 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#0b1c30]">People Analytics KBA1 • Relatório Oficial</h2>
                <p className="text-xs text-slate-500">Unidade Bahia • Feira de Santana • Competência: {filters.competence}</p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#eff4ff] text-[#306576]">
                KBA1-DHO-2024
              </span>
            </div>
          </div>

          {/* ABA 1: VISÃO EXECUTIVA */}
          {activeTab === 'overview' && (
            <ExecutiveOverviewTab
              employees={filteredEmployees}
              kpis={kpis}
              onNavigateTab={setActiveTab}
              onOpenAuditModal={() => setIsAuditModalOpen(true)}
            />
          )}

          {/* ABA 2: QUADRO DE PESSOAL (HEADCOUNT, GÊNERO, TURNOS, SETORES & GESTORES) */}
          {activeTab === 'headcount' && (
            <HeadcountAnalyticsTab employees={filteredEmployees} />
          )}

          {/* ABA 3: SETORES & TURNOS */}
          {activeTab === 'jobs_shifts' && (
            <SectorsShiftsTab employees={filteredEmployees} />
          )}

          {/* ABA 4: STATUS DE ENTREGAS & VAGAS ABERTAS (R&S E ENTREGÁVEIS G&G) */}
          {activeTab === 'indicators' && (
            <DeliveriesAndVacanciesTab
              vacancies={vacancies}
              deliverables={deliverables}
              employees={employees}
              onSaveVacancies={saveVacancies}
              onSaveDeliverables={saveDeliverables}
            />
          )}

          {/* ABA SUPERAR: PROGRAMA SUPERAR OFICIAL COM CICLOS 2026 E 2027 */}
          {activeTab === 'superar' && (
            <SuperarTab
              year={superarYear}
              onYearChange={(y) => setSuperarYear(y)}
              audits={currentSuperarAudits}
              indicators={currentSuperarIndicators}
              onSaveYearData={saveSuperarYearData}
              onOpenDataEntry={() => {
                setActiveTab('data_entry');
                setDataEntryTab('manual');
                setManualFormType('superar');
              }}
            />
          )}

          {/* ABA 5 & 6: ABSENTEÍSMO & MOVIMENTAÇÕES */}
          {(activeTab === 'absenteeism' || activeTab === 'movements') && (
            <AbsenteeismMovementsTab />
          )}

          {/* ABA 7: TREINAMENTO & DHO — UNIFICADO COM DASHBOARD DE FORMAÇÕES */}
          {activeTab === 'trainings' && (
            <div className="space-y-6">
              {/* Painel Estratégico de Metas de DHO & Superar */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-[#0b1c30] tracking-tight flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      Treinamento, Matriz de Habilidades & Programa Superar
                    </h3>
                    <p className="text-xs text-slate-500">
                      Metas corporativas do Pilar ET (Educação e Treinamento) e aderência aos requisitos legais
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#eff4ff] text-[#306576] border border-[#cbd5e1] self-start sm:self-auto">
                    Pilar ET • KBA1-DHO-2024
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {kpis.filter(k => k.category === 'Treinamento').map(kpi => (
                    <div key={kpi.id} className="p-3.5 rounded-2xl bg-[#f8fafc] border border-slate-200/90 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#047857] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Meta Oficial
                        </span>
                        <span className="text-xs font-black text-emerald-700 bg-white px-2 py-0.5 rounded-lg border border-slate-200 shadow-2xs font-mono">
                          {kpi.target1}% (M1)
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-[#0b1c30] leading-snug line-clamp-2">{kpi.name}</h4>
                      <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-200/80">
                        <span className="text-slate-500">Alvos M1 / M3 / M5:</span>
                        <span className="font-mono font-bold text-slate-800">
                          {kpi.target1}% / {kpi.target3}% / <strong className="text-emerald-700">{kpi.target5}%</strong>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dashboard de Formações & Comparação de Matrizes (Design Analytics) */}
              <FormationsDashboard embeddedInAnalytics={true} />
            </div>
          )}

          {/* ABA 8: INTELIGÊNCIA ANALÍTICA & PLANOS DE AÇÃO */}
          {activeTab === 'action_plans' && (
                    
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Alertas e Planos de Ação Operacionais
                </h3>
                <p className="text-xs text-slate-500">
                  Planos cadastrados com evidências numéricas, hipóteses e responsáveis.
                </p>
              </div>

              <button
                onClick={() => setIsNewActionModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-xs"
              >
                <Plus className="w-4 h-4" />
                Cadastrar Ação
              </button>
            </div>

            <div className="space-y-3">
              {actionPlans.map(act => (
                <div key={act.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 text-sm">{act.title}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      act.status === 'Concluído' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {act.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700"><strong>Escopo:</strong> {act.scope}</p>
                  <p className="text-xs text-slate-600"><strong>Evidência:</strong> {act.evidence}</p>
                  <p className="text-xs text-slate-600"><strong>Hipótese:</strong> {act.hypothesis}</p>
                  <p className="text-xs text-emerald-800 bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                    <strong>Ação:</strong> {act.suggestedAction}
                  </p>
                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                    <span>Responsável: <strong>{act.responsible}</strong></span>
                    <span>Prazo: <strong>{act.deadline}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

          {/* ABA 9: ENTRADA DE DADOS & IMPORTAÇÃO EXCEL */}
          {activeTab === 'data_entry' && (
                    
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-6">
            
            {/* Seletor entre Importação e Lançamento Manual */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
              <button
                onClick={() => setDataEntryTab('import')}
                className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
                  dataEntryTab === 'import'
                    ? 'bg-[#132F46] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <UploadCloud className="w-4 h-4" />
                ABA 1: Importação Excel (PAAH / Indicadores)
              </button>

              <button
                onClick={() => setDataEntryTab('manual')}
                className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
                  dataEntryTab === 'manual'
                    ? 'bg-[#132F46] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Edit3 className="w-4 h-4" />
                ABA 2: Lançamento Manual & Atualizações
              </button>
            </div>

            {/* SUB-ABA 1: IMPORTAÇÃO EXCEL */}
            {dataEntryTab === 'import' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-base font-bold text-slate-900 tracking-tight">
                    Importação de Planilha PAAH ou Indicadores
                  </h4>
                  <p className="text-xs text-slate-500">
                    O sistema filtra automaticamente a unidade <strong>KBA1 (Bahia)</strong> e descarta registros de outras unidades (Ceará/etc).
                  </p>
                </div>

                {/* Área de Drag & Drop */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-3xl p-8 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-emerald-50/20"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                  />
                  <UploadCloud className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-800">
                    Arraste ou clique para selecionar o arquivo Excel (.xlsx / .csv)
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Compatível com extrato PAAH KBA1, planilhas de frequência e matriz de competências
                  </p>
                </div>

                {/* Feedback e Relatório de Importação */}
                {importFeedback && (
                  <div className={`p-4 rounded-2xl border text-xs flex items-center gap-2.5 ${
                    importFeedback.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}>
                    {importFeedback.type === 'success' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                    )}
                    <span>{importFeedback.message}</span>
                  </div>
                )}

                {/* Resumo da Validação */}
                {importSummary && (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <h5 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                      Relatório de Validação da Unidade
                    </h5>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-slate-500 block">Total de Linhas:</span>
                        <span className="font-mono font-bold text-slate-900 text-sm">{importSummary.totalRowsRead}</span>
                      </div>
                      <div>
                        <span className="text-emerald-600 font-bold block">Válidas Bahia (KBA1):</span>
                        <span className="font-mono font-bold text-emerald-700 text-sm">{importSummary.validBahiaRows}</span>
                      </div>
                      <div>
                        <span className="text-rose-600 block">Descartadas (Outras Unidades):</span>
                        <span className="font-mono font-bold text-rose-700 text-sm">{importSummary.discardedOtherUnits}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Data de Validação:</span>
                        <span className="font-mono text-slate-700">{importSummary.importDate}</span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={confirmImport}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                      >
                        Confirmar e Salvar Base Bahia
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SUB-ABA 2: LANÇAMENTO MANUAL & ATUALIZAÇÕES */}
            {dataEntryTab === 'manual' && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-xs flex-wrap">
                  <button
                    onClick={() => setManualFormType('superar')}
                    className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
                      manualFormType === 'superar' ? 'bg-[#0a3641] text-[#6ffbbe] shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <Award className="w-4 h-4" />
                    Atualizar Programa Superar
                  </button>
                  <button
                    onClick={() => setManualFormType('kpi')}
                    className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
                      manualFormType === 'kpi' ? 'bg-[#0a3641] text-[#6ffbbe] shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4" />
                    Lançar Realizado de Indicador G&G
                  </button>
                  <button
                    onClick={() => setManualFormType('employee')}
                    className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
                      manualFormType === 'employee' ? 'bg-[#0a3641] text-[#6ffbbe] shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    Cadastrar Colaborador
                  </button>
                  <button
                    onClick={() => setManualFormType('action')}
                    className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
                      manualFormType === 'action' ? 'bg-[#0a3641] text-[#6ffbbe] shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Cadastrar Plano de Ação
                  </button>
                </div>

                {/* FORMULÁRIO 0: ATUALIZAÇÃO DO PROGRAMA SUPERAR */}
                {manualFormType === 'superar' && (
                  <div className="space-y-6">
                    <div className="bg-[#eff4ff] p-5 rounded-2xl border border-[#cbd5e1] space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
                        <div>
                          <h5 className="font-bold text-sm text-[#0b1c30] flex items-center gap-2">
                            <Award className="w-4 h-4 text-emerald-600" />
                            Lançar / Atualizar Mês de Indicador Superar ({superarYear})
                          </h5>
                          <p className="text-xs text-slate-500">
                            Atualize a realização mensal dos 9 indicadores do Pilar ET (Educação e Treinamento)
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Seletor de Ano no Formulário */}
                          <div className="inline-flex rounded-xl bg-slate-200/80 p-0.5 border border-slate-300">
                            <button
                              type="button"
                              onClick={() => setSuperarYear(2026)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                                superarYear === 2026 ? 'bg-[#0a3641] text-[#6ffbbe] shadow-xs' : 'text-slate-700'
                              }`}
                            >
                              2026 (Atual)
                            </button>
                            <button
                              type="button"
                              onClick={() => setSuperarYear(2027)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                                superarYear === 2027 ? 'bg-[#0a3641] text-[#6ffbbe] shadow-xs' : 'text-slate-700'
                              }`}
                            >
                              2027 (Planejamento)
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => setActiveTab('superar')}
                            className="px-3 py-1.5 text-xs font-bold text-[#306576] bg-white rounded-lg border border-slate-200 hover:bg-slate-50 shadow-2xs"
                          >
                            Ir para Aba Superar &rarr;
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                        {/* Indicador */}
                        <div className="sm:col-span-2">
                          <label className="font-bold text-slate-700 block mb-1">Indicador *</label>
                          <select
                            value={selectedSuperarIndId}
                            onChange={(e) => {
                              const indId = e.target.value;
                              setSelectedSuperarIndId(indId);
                              const ind = currentSuperarIndicators.find(i => i.id === indId);
                              if (ind) {
                                const v = ind.months[selectedSuperarMonth];
                                setSuperarValInput(v !== null && v !== undefined ? String(v) : '');
                                setSuperarNoteInput(ind.notes || '');
                              }
                            }}
                            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#306576]"
                          >
                            {currentSuperarIndicators.map(i => (
                              <option key={i.id} value={i.id}>
                                {i.name} (Meta 1: {i.meta1}{i.unit === '%' ? '%' : ''} | Meta 3: {i.meta3}{i.unit === '%' ? '%' : ''})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Mês */}
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">Mês de Referência *</label>
                          <select
                            value={selectedSuperarMonth}
                            onChange={(e) => {
                              const m = e.target.value;
                              setSelectedSuperarMonth(m);
                              const ind = currentSuperarIndicators.find(i => i.id === selectedSuperarIndId);
                              if (ind) {
                                const v = ind.months[m];
                                setSuperarValInput(v !== null && v !== undefined ? String(v) : '');
                              }
                            }}
                            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#306576]"
                          >
                            {['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'].map(m => (
                              <option key={m} value={m}>{m} / {superarYear}</option>
                            ))}
                          </select>
                        </div>

                        {/* Valor Realizado */}
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">Valor Realizado *</label>
                          <input
                            type="text"
                            placeholder="Ex: 96.5"
                            value={superarValInput}
                            onChange={e => setSuperarValInput(e.target.value)}
                            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono text-sm font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#306576]"
                          />
                        </div>

                        {/* Observação / Diagnóstico Técnico */}
                        <div className="sm:col-span-4">
                          <label className="font-bold text-slate-700 block mb-1">
                            Diagnóstico Técnico / Análise Operacional (Opcional)
                          </label>
                          <textarea
                            rows={2}
                            placeholder="Descreva o plano de ação, causa raiz de desvio ou justificativa técnica..."
                            value={superarNoteInput}
                            onChange={e => setSuperarNoteInput(e.target.value)}
                            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#306576]"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            const num = parseFloat(superarValInput.replace(',', '.'));
                            if (isNaN(num)) {
                              alert('Por favor informe um valor numérico válido.');
                              return;
                            }
                            const updated = currentSuperarIndicators.map(item => {
                              if (item.id === selectedSuperarIndId) {
                                const months = { ...item.months, [selectedSuperarMonth]: num };
                                const filled = Object.values(months).filter(v => v !== null && v !== undefined) as number[];
                                const media = filled.length > 0 ? Number((filled.reduce((a, b) => a + b, 0) / filled.length).toFixed(1)) : 0;
                                const notes = superarNoteInput.trim() ? superarNoteInput : item.notes;
                                return { ...item, months, media, notes };
                              }
                              return item;
                            });
                            saveSuperarYearData(superarYear, updated, currentSuperarAudits);
                          }}
                          className="px-5 py-2.5 bg-[#0a3641] hover:bg-[#134e5e] text-[#6ffbbe] font-black text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Gravar no Ciclo {superarYear}
                        </button>
                      </div>
                    </div>

                    {/* Bloco 2: Atualização de Auditorias (Passo, Selo, Confirmação) */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
                      <div>
                        <h5 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                          Atualizar Auditorias & Avaliações Superar ({superarYear})
                        </h5>
                        <p className="text-[11px] text-slate-500">
                          Auditoria de Passo, Auditoria de Selo, Confirmação de Processo e Auto Avaliação
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">Auditoria</label>
                          <select
                            value={selectedSuperarAuditId}
                            onChange={e => setSelectedSuperarAuditId(e.target.value)}
                            className="w-full p-2 bg-white border border-slate-200 rounded-xl font-medium"
                          >
                            {currentSuperarAudits.map(a => (
                              <option key={a.id} value={a.id}>{a.name} (Meta: {a.meta})</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="font-bold text-slate-700 block mb-1">Mês</label>
                          <select
                            value={selectedSuperarAuditMonth}
                            onChange={e => setSelectedSuperarAuditMonth(e.target.value)}
                            className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold"
                          >
                            {['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'].map(m => (
                              <option key={m} value={m}>{m} / {superarYear}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="font-bold text-slate-700 block mb-1">Resultado Obtido</label>
                          <input
                            type="text"
                            placeholder="Ex: 95.5"
                            value={superarAuditValInput}
                            onChange={e => setSuperarAuditValInput(e.target.value)}
                            className="w-full p-2 bg-white border border-slate-200 rounded-xl font-mono font-bold"
                          />
                        </div>
                      </div>

                      <div>
                        <button
                          type="button"
                          onClick={() => {
                            const num = parseFloat(superarAuditValInput.replace(',', '.'));
                            if (isNaN(num)) {
                              alert('Por favor informe um valor numérico válido.');
                              return;
                            }
                            const updated = currentSuperarAudits.map(item => {
                              if (item.id === selectedSuperarAuditId) {
                                const months = { ...item.months, [selectedSuperarAuditMonth]: num };
                                const filled = Object.values(months).filter(v => v !== null && v !== undefined && typeof v === 'number') as number[];
                                const media = filled.length > 0 ? Number((filled.reduce((a, b) => a + b, 0) / filled.length).toFixed(1)) : 0;
                                return { ...item, months, media };
                              }
                              return item;
                            });
                            saveSuperarYearData(superarYear, currentSuperarIndicators, updated);
                          }}
                          className="px-4 py-2 bg-[#306576] hover:bg-[#0a3641] text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                        >
                          Gravar Auditoria no Ciclo {superarYear}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* FORMULÁRIO 1: NOVO COLABORADOR */}
                {manualFormType === 'employee' && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!newEmployeeForm.prn || !newEmployeeForm.name) {
                        alert('PRN e Nome são obrigatórios.');
                        return;
                      }
                      const emp: Employee = {
                        prn: newEmployeeForm.prn,
                        name: newEmployeeForm.name,
                        unitCode: 'KBA1',
                        unitName: 'Bahia',
                        subareaCode: 'K111',
                        subareaName: 'Feira de Santana',
                        employmentGroup: newEmployeeForm.employmentGroup || 'CLT',
                        costCenterCode: 'CC-MANUAL',
                        costCenterName: newEmployeeForm.costCenterName || 'Produção Geral',
                        macroarea: 'Operação Fabril',
                        locationCode: 'LOC-MANUAL',
                        locationName: newEmployeeForm.locationName || 'Área Operacional',
                        jobCode: 'JOB-MANUAL',
                        jobTitle: newEmployeeForm.jobTitle || 'Operador',
                        immediateManager: newEmployeeForm.immediateManager || 'Gestor Operacional',
                        shiftCode: 'JRN-MANUAL',
                        shiftName: 'Horário Cadastrado',
                        shiftCategory: newEmployeeForm.shiftCategory || 'Turno A',
                        status: newEmployeeForm.status || 'Ativo',
                      };
                      saveEmployees([emp, ...employees]);
                      setNewEmployeeForm({ employmentGroup: 'CLT', shiftCategory: 'Turno A', status: 'Ativo' });
                      showToast(`Colaborador ${emp.name} cadastrado com sucesso!`);
                    }}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs"
                  >
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">PRN *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: 159999"
                        value={newEmployeeForm.prn || ''}
                        onChange={e => setNewEmployeeForm(f => ({ ...f, prn: e.target.value }))}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Nome Completo *</label>
                      <input
                        type="text"
                        required
                        placeholder="Nome do colaborador"
                        value={newEmployeeForm.name || ''}
                        onChange={e => setNewEmployeeForm(f => ({ ...f, name: e.target.value }))}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Vínculo</label>
                      <select
                        value={newEmployeeForm.employmentGroup || 'CLT'}
                        onChange={e => setNewEmployeeForm(f => ({ ...f, employmentGroup: e.target.value as any }))}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                      >
                        <option value="CLT">CLT</option>
                        <option value="Aprendiz">Aprendiz</option>
                        <option value="Estagiário">Estagiário</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Cargo</label>
                      <input
                        type="text"
                        placeholder="Ex: Operador Embalagem IV"
                        value={newEmployeeForm.jobTitle || ''}
                        onChange={e => setNewEmployeeForm(f => ({ ...f, jobTitle: e.target.value }))}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Centro de Custo</label>
                      <input
                        type="text"
                        placeholder="Ex: Onduladeira nº 00"
                        value={newEmployeeForm.costCenterName || ''}
                        onChange={e => setNewEmployeeForm(f => ({ ...f, costCenterName: e.target.value }))}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Turno</label>
                      <select
                        value={newEmployeeForm.shiftCategory || 'Turno A'}
                        onChange={e => setNewEmployeeForm(f => ({ ...f, shiftCategory: e.target.value as any }))}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                      >
                        <option value="Turno A">Turno A (Manhã 06:00-14:20)</option>
                        <option value="Turno B">Turno B (Tarde 14:20-22:30)</option>
                        <option value="Turno C">Turno C (Noite 22:30-06:00)</option>
                        <option value="Administrativo">Administrativo 5x2 (08:00-17:00)</option>
                        <option value="Outras Jornadas">Outras Jornadas</option>
                      </select>
                    </div>

                    <div className="sm:col-span-3 pt-2">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-xs"
                      >
                        Salvar Colaborador
                      </button>
                    </div>
                  </form>
                )}

                {/* FORMULÁRIO 2: LANÇAR REALIZADO DE INDICADOR */}
                {manualFormType === 'kpi' && (
                  <div className="space-y-4 max-w-lg text-xs">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Selecione o Indicador</label>
                      <select
                        value={selectedKPI?.id || kpis[0].id}
                        onChange={(e) => {
                          const k = kpis.find(item => item.id === e.target.value);
                          setSelectedKPI(k || null);
                          setKpiActualInput(k?.actual !== null ? String(k?.actual) : '');
                        }}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                      >
                        {kpis.map(k => (
                          <option key={k.id} value={k.id}>{k.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Valor Realizado</label>
                      <input
                        type="text"
                        placeholder="Ex: 85.5"
                        value={kpiActualInput}
                        onChange={e => setKpiActualInput(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm"
                      />
                    </div>

                    <button
                      onClick={handleSaveKPIActual}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-xs"
                    >
                      Gravar Realizado
                    </button>
                  </div>
                )}

                {/* FORMULÁRIO 3: PLANO DE AÇÃO */}
                {manualFormType === 'action' && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!newActionForm.title) return;
                      const act: ActionPlanItem = {
                        id: `act-${Date.now()}`,
                        title: newActionForm.title,
                        scope: newActionForm.scope || 'Unidade Bahia',
                        evidence: newActionForm.evidence || 'Diagnóstico operacional',
                        hypothesis: newActionForm.hypothesis || 'Necessidade de intervenção',
                        suggestedAction: newActionForm.suggestedAction || 'Ação padrão',
                        responsible: newActionForm.responsible || 'Gente & Gestão',
                        priority: newActionForm.priority || 'Média',
                        deadline: newActionForm.deadline || '2026-11-30',
                        status: newActionForm.status || 'Planejado',
                        createdAt: new Date().toISOString().slice(0, 10),
                      };
                      saveActionPlans([act, ...actionPlans]);
                      setNewActionForm({ priority: 'Média', status: 'Planejado' });
                      showToast('Plano de ação cadastrado com sucesso!');
                    }}
                    className="space-y-3 max-w-lg text-xs"
                  >
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Título da Ação</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Treinamento NR-12 Operadores Turno C"
                        value={newActionForm.title || ''}
                        onChange={e => setNewActionForm(f => ({ ...f, title: e.target.value }))}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Escopo</label>
                      <input
                        type="text"
                        placeholder="Ex: Turno C - Onduladeira 00"
                        value={newActionForm.scope || ''}
                        onChange={e => setNewActionForm(f => ({ ...f, scope: e.target.value }))}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Ação Sugerida</label>
                      <textarea
                        rows={2}
                        placeholder="Descreva a ação recomendada"
                        value={newActionForm.suggestedAction || ''}
                        onChange={e => setNewActionForm(f => ({ ...f, suggestedAction: e.target.value }))}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Responsável</label>
                        <input
                          type="text"
                          placeholder="Ex: Pilar ET / SESMT"
                          value={newActionForm.responsible || ''}
                          onChange={e => setNewActionForm(f => ({ ...f, responsible: e.target.value }))}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Prazo</label>
                        <input
                          type="date"
                          value={newActionForm.deadline || ''}
                          onChange={e => setNewActionForm(f => ({ ...f, deadline: e.target.value }))}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-xs"
                    >
                      Cadastrar Ação
                    </button>
                  </form>
                )}

              </div>
            )}

          </div>
        )}

        </main>
      </div>

      {/* ========================================================================= */}
      {/* MODAIS CORPORATIVOS DE GOVERNANÇA */}
      {/* ========================================================================= */}
      <AuditFormulasModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
      />

      <CalculationRulesModal
        isOpen={isCalculationRulesModalOpen}
        onClose={() => setIsCalculationRulesModalOpen(false)}
      />

      {isKPIModalOpen && selectedKPI && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {selectedKPI.category}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {selectedKPI.name}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsKPIModalOpen(false);
                  setSelectedKPI(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {selectedKPI.description}
            </p>

            <div className="grid grid-cols-3 gap-2 text-center p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono">
              <div>
                <span className="text-slate-400 block text-[10px]">Meta 1</span>
                <span className="font-bold text-slate-800">{selectedKPI.target1}{selectedKPI.unit}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Meta 3</span>
                <span className="font-bold text-slate-800">{selectedKPI.target3}{selectedKPI.unit}</span>
              </div>
              <div>
                <span className="text-emerald-600 block text-[10px] font-bold">Meta 5</span>
                <span className="font-bold text-emerald-700">{selectedKPI.target5}{selectedKPI.unit}</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                Valor Realizado ({selectedKPI.unit})
              </label>
              <input
                type="text"
                placeholder="Ex: 88.5"
                value={kpiActualInput}
                onChange={e => setKpiActualInput(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-emerald-500/20"
              />
              <span className="text-[10px] text-slate-400">
                Lançamento manual com rastreabilidade na unidade Bahia KBA1.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setIsKPIModalOpen(false);
                  setSelectedKPI(null);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveKPIActual}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                Salvar Resultado
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL DE CADASTRO DE NOVO PLANO DE AÇÃO */}
      {/* ========================================================================= */}
      {isNewActionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Novo Plano de Ação (People Analytics)
              </h3>
              <button
                onClick={() => setIsNewActionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newActionForm.title) return;
                const act: ActionPlanItem = {
                  id: `act-${Date.now()}`,
                  title: newActionForm.title,
                  scope: newActionForm.scope || 'Unidade Bahia',
                  evidence: newActionForm.evidence || 'Diagnóstico operacional',
                  hypothesis: newActionForm.hypothesis || 'Necessidade de intervenção',
                  suggestedAction: newActionForm.suggestedAction || 'Ação padrão',
                  responsible: newActionForm.responsible || 'Gente & Gestão',
                  priority: newActionForm.priority || 'Média',
                  deadline: newActionForm.deadline || '2026-11-30',
                  status: newActionForm.status || 'Planejado',
                  createdAt: new Date().toISOString().slice(0, 10),
                };
                saveActionPlans([act, ...actionPlans]);
                setIsNewActionModalOpen(false);
                setNewActionForm({ priority: 'Média', status: 'Planejado' });
                showToast('Ação cadastrada!');
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="font-bold text-slate-700 block mb-1">Título da Ação *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Treinamento e equalização de turno"
                  value={newActionForm.title || ''}
                  onChange={e => setNewActionForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Escopo</label>
                <input
                  type="text"
                  placeholder="Ex: Turno C - Onduladeira"
                  value={newActionForm.scope || ''}
                  onChange={e => setNewActionForm(f => ({ ...f, scope: e.target.value }))}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Evidência Numérica</label>
                <input
                  type="text"
                  placeholder="Ex: 87 colaboradores no turno noturno"
                  value={newActionForm.evidence || ''}
                  onChange={e => setNewActionForm(f => ({ ...f, evidence: e.target.value }))}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Ação Sugerida</label>
                <textarea
                  rows={2}
                  placeholder="Descreva a ação recomendada"
                  value={newActionForm.suggestedAction || ''}
                  onChange={e => setNewActionForm(f => ({ ...f, suggestedAction: e.target.value }))}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Responsável</label>
                  <input
                    type="text"
                    placeholder="Gente & Gestão"
                    value={newActionForm.responsible || ''}
                    onChange={e => setNewActionForm(f => ({ ...f, responsible: e.target.value }))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Prazo</label>
                  <input
                    type="date"
                    value={newActionForm.deadline || ''}
                    onChange={e => setNewActionForm(f => ({ ...f, deadline: e.target.value }))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewActionModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-xs"
                >
                  Gravar Ação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TOAST FLUTUANTE */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-slate-900 text-white text-xs font-semibold rounded-2xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
};

export default PeopleAnalyticsView;


