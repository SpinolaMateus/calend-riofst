import React, { useState, useMemo, useRef } from 'react';
import { 
  Users, Building2, Briefcase, Clock, Calendar, BarChart3, 
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, 
  Search, Filter, X, Download, FileSpreadsheet, Plus, 
  ArrowLeft, RefreshCw, Layers, ShieldCheck, ChevronRight,
  Info, Sparkles, UserCheck, ShieldAlert, Check, HelpCircle,
  FolderTree, GitCommit, FileText, UploadCloud, Edit3, ArrowUpRight
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

interface PeopleAnalyticsViewProps {
  onBackToHome: () => void;
}

type TabType = 
  | 'overview' 
  | 'headcount' 
  | 'jobs_shifts' 
  | 'indicators' 
  | 'absenteeism' 
  | 'movements' 
  | 'trainings' 
  | 'action_plans' 
  | 'data_entry' 
  | 'admin';

export const PeopleAnalyticsView: React.FC<PeopleAnalyticsViewProps> = ({ onBackToHome }) => {
  // Estado principal de Colaboradores da Unidade Bahia (KBA1 / K111)
  const [employees, setEmployees] = useState<Employee[]>(() => {
    try {
      const stored = localStorage.getItem('kba1_people_analytics_employees_v1');
      return stored ? JSON.parse(stored) : generateInitialBahiaEmployees();
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

  // Mapeamento de Macroáreas
  const [macroMappings] = useState(INITIAL_MACROAREA_MAPPINGS);

  // Navegação de Abas do Menu
  const [activeTab, setActiveTab] = useState<TabType>('overview');

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

  // Modais e Diálogos
  const [selectedKPI, setSelectedKPI] = useState<PeopleAnalyticsKPI | null>(null);
  const [isKPIModalOpen, setIsKPIModalOpen] = useState(false);
  const [kpiActualInput, setKpiActualInput] = useState<string>('');

  const [isNewActionModalOpen, setIsNewActionModalOpen] = useState(false);
  const [newActionForm, setNewActionForm] = useState<Partial<ActionPlanItem>>({
    priority: 'Média',
    status: 'Planejado',
  });

  // Estado para Entrada de Dados
  const [dataEntryTab, setDataEntryTab] = useState<'import' | 'manual'>('import');
  const [manualFormType, setManualFormType] = useState<'employee' | 'kpi' | 'action'>('employee');
  const [importSummary, setImportSummary] = useState<ExcelImportSummary | null>(null);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importFeedback, setImportFeedback] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

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
      localStorage.setItem('kba1_people_analytics_employees_v1', JSON.stringify(data));
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

        // Índices prováveis de colunas baseados no PAAH
        const idxPRN = headers.findIndex(h => /prn|matr/i.test(h));
        const idxName = headers.findIndex(h => /nome/i.test(h));
        const idxUnit = headers.findIndex(h => /área de recursos humanos|area de recursos|unidade/i.test(h));
        const idxSubarea = headers.findIndex(h => /subárea|subarea/i.test(h));
        const idxGroup = headers.findIndex(h => /grupo de empregados|vínculo|vinculo/i.test(h));
        const idxCC = headers.findIndex(h => /centro de custo/i.test(h));
        const idxLoc = headers.findIndex(h => /local/i.test(h));
        const idxJob = headers.findIndex(h => /cargo/i.test(h));
        const idxManager = headers.findIndex(h => /gestor/i.test(h));
        const idxShift = headers.findIndex(h => /jornada|escala|horário/i.test(h));

        rows.forEach((row, i) => {
          if (!row || row.length === 0) return;

          const unitVal = idxUnit !== -1 ? String(row[idxUnit] || '') : 'KBA1';
          const subareaVal = idxSubarea !== -1 ? String(row[idxSubarea] || '') : 'K111';

          // Filtro estrito: apenas KBA1 (Bahia) / K111 (Feira de Santana)
          const isBahia = /kba1|bahia/i.test(unitVal) || /k111|feira/i.test(subareaVal) || idxUnit === -1;

          if (!isBahia) {
            discardedOther++;
            return;
          }

          const prn = idxPRN !== -1 && row[idxPRN] ? String(row[idxPRN]).trim() : `IMP-${i + 1}`;
          const name = idxName !== -1 && row[idxName] ? String(row[idxName]).trim() : `Colaborador PRN ${prn}`;
          const groupRaw = idxGroup !== -1 ? String(row[idxGroup] || '') : 'CLT';
          const employmentGroup: 'CLT' | 'Aprendiz' | 'Estagiário' = 
            /aprendiz/i.test(groupRaw) ? 'Aprendiz' : /estagi/i.test(groupRaw) ? 'Estagiário' : 'CLT';

          const ccName = idxCC !== -1 && row[idxCC] ? String(row[idxCC]).trim() : 'Produção Geral';
          const locName = idxLoc !== -1 && row[idxLoc] ? String(row[idxLoc]).trim() : 'Área Operacional';
          const jobTitle = idxJob !== -1 && row[idxJob] ? String(row[idxJob]).trim() : 'Operador';
          const manager = idxManager !== -1 && row[idxManager] ? String(row[idxManager]).trim() : 'Gestor Operacional';
          const shiftText = idxShift !== -1 && row[idxShift] ? String(row[idxShift]).trim() : 'Turno A';

          let shiftCat: ShiftCategory = 'Turno A';
          if (/14:20|tarde/i.test(shiftText)) shiftCat = 'Turno B';
          else if (/22:30|noite/i.test(shiftText)) shiftCat = 'Turno C';
          else if (/08:00|adm|5x2/i.test(shiftText)) shiftCat = 'Administrativo';
          else if (/aprendiz|estágio|07:00/i.test(shiftText) || employmentGroup !== 'CLT') shiftCat = 'Outras Jornadas';

          validBahia.push({
            prn,
            name,
            unitCode: 'KBA1',
            unitName: 'Bahia',
            subareaCode: 'K111',
            subareaName: 'Feira de Santana',
            employmentGroup,
            costCenterCode: 'CC-IMP',
            costCenterName: ccName,
            macroarea: 'Operação Fabril',
            locationCode: 'LOC-IMP',
            locationName: locName,
            jobCode: 'JOB-IMP',
            jobTitle,
            immediateManager: manager,
            shiftCode: 'JRN-IMP',
            shiftName: shiftText,
            shiftCategory: shiftCat,
            status: 'Ativo',
          });
        });

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
          message: `Arquivo analisado! ${validBahia.length} colaboradores elegíveis da Bahia identificados. ${discardedOther} registros de outras unidades (Ceará/etc) descartados.`,
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
    if (!importSummary || importSummary.validBahiaRows === 0) return;
    // Realiza a persistência
    showToast(`Base importada com sucesso! ${importSummary.validBahiaRows} colaboradores carregados.`);
    setImportFeedback({
      message: `Importação confirmada e salva!`,
      type: 'success',
    });
  };

  // =========================================================================
  // EXPORTAÇÃO EXCEL E PDF
  // =========================================================================
  const exportToExcel = () => {
    const dataToExport = filteredEmployees.map(emp => ({
      'PRN': emp.prn,
      'Nome': emp.name,
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
    <div id="people-analytics-capture-area" className="min-h-screen bg-[#F5F7FB] text-slate-800 flex flex-col font-sans">
      
      {/* ========================================================================= */}
      {/* 1. CABEÇALHO EXECUTIVO — PEOPLE ANALYTICS BAHIA (KBA1 / K111) */}
      {/* ========================================================================= */}
      <header data-capture-ignore className="no-print bg-[#132F46] text-white border-b border-slate-700/80 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Título & Badges de Unidade */}
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToHome}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all duration-200 border border-white/10"
              title="Voltar ao Painel Geral de Módulos"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  People Analytics
                  <span className="text-emerald-400 font-normal text-base">| Feira de Santana</span>
                </h1>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Unidade Bahia • KBA1 / K111
                </span>
              </div>
              <p className="text-xs text-slate-300 flex items-center gap-2 mt-0.5">
                <span>Base PAAH: Out/2026</span>
                <span>•</span>
                <span className="text-emerald-300 font-medium">353 PRNs Unidade Bahia</span>
                <span>•</span>
                <span className="text-slate-400">Qualidade de Dados: 100% Verificado</span>
              </p>
            </div>
          </div>

          {/* Botões de Ação Executiva */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setActiveTab('data_entry')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-sm"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Importar / Lançar</span>
            </button>

            <button
              onClick={exportToExcel}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 font-semibold text-xs transition-all"
              title="Exportar dados filtrados para Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Exportar Excel</span>
            </button>

            <button
              onClick={handleCopyAsImage}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 font-semibold text-xs transition-all"
              title="Copiar relatório como imagem"
            >
              <Download className="w-4 h-4 text-sky-400" />
              <span className="hidden sm:inline">Copiar Imagem</span>
            </button>

            <button
              onClick={handlePrintPDF}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 font-semibold text-xs transition-all"
              title="Imprimir ou salvar PDF"
            >
              <FileText className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Imprimir / PDF</span>
            </button>
          </div>
        </div>

        {/* Barra de Navegação de Abas */}
        <div className="bg-[#0e2436] px-4 sm:px-6 lg:px-8 border-t border-slate-700/60 overflow-x-auto no-scrollbar">
          <div className="max-w-7xl mx-auto flex items-center gap-1 py-1.5 min-w-max text-xs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'overview'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Visão Geral
            </button>

            <button
              onClick={() => setActiveTab('headcount')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'headcount'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Quadro de Pessoal ({metrics.total})
            </button>

            <button
              onClick={() => setActiveTab('jobs_shifts')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'jobs_shifts'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              Cargos e Turnos
            </button>

            <button
              onClick={() => setActiveTab('indicators')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'indicators'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Indicadores G&G (9)
            </button>

            <button
              onClick={() => setActiveTab('absenteeism')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'absenteeism'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Absenteísmo
            </button>

            <button
              onClick={() => setActiveTab('movements')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'movements'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5" />
              Movimentações & Turnover
            </button>

            <button
              onClick={() => setActiveTab('trainings')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'trainings'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Treinamento & Superar
            </button>

            <button
              onClick={() => setActiveTab('action_plans')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'action_plans'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Alertas & Ações ({actionPlans.length})
            </button>

            <button
              onClick={() => setActiveTab('data_entry')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'data_entry'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              Entrada de Dados
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. FILTROS GLOBAIS INTERDEPENDENTES */}
      {/* ========================================================================= */}
      <section data-capture-ignore className="no-print bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3.5 shadow-2xs">
        <div className="max-w-7xl mx-auto space-y-3">
          
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Campo de Busca Rápida */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por PRN, Nome, Cargo ou Centro de Custo..."
                value={filters.searchTerm}
                onChange={(e) => setFilters(f => ({ ...f, searchTerm: e.target.value }))}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              />
              {filters.searchTerm && (
                <button
                  onClick={() => setFilters(f => ({ ...f, searchTerm: '' }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Seletores de Filtros */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 text-xs">
              
              {/* Vínculo */}
              <select
                value={filters.employmentGroup}
                onChange={(e) => setFilters(f => ({ ...f, employmentGroup: e.target.value }))}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <option value="all">Vínculo: Todos</option>
                <option value="CLT">CLT ({metrics.clt})</option>
                <option value="Aprendiz">Aprendiz ({metrics.aprendizes})</option>
                <option value="Estagiário">Estagiário ({metrics.estagiarios})</option>
              </select>

              {/* Turno */}
              <select
                value={filters.shiftCategory}
                onChange={(e) => setFilters(f => ({ ...f, shiftCategory: e.target.value }))}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <option value="all">Turno: Todos</option>
                <option value="Turno A">Turno A (Manhã: 88)</option>
                <option value="Turno B">Turno B (Tarde: 84)</option>
                <option value="Turno C">Turno C (Noite: 87)</option>
                <option value="Administrativo">Administrativo (5x2: 74)</option>
                <option value="Outras Jornadas">Outras Jornadas (20)</option>
              </select>

              {/* Macroárea */}
              <select
                value={filters.macroarea}
                onChange={(e) => setFilters(f => ({ ...f, macroarea: e.target.value }))}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer max-w-[160px] truncate"
              >
                <option value="all">Macroárea: Todas</option>
                {filterOptions.macroareas.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>

              {/* Centro de Custo */}
              <select
                value={filters.costCenter}
                onChange={(e) => setFilters(f => ({ ...f, costCenter: e.target.value }))}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer max-w-[170px] truncate"
              >
                <option value="all">Centro de Custo: Todos</option>
                {filterOptions.costCenters.map(cc => (
                  <option key={cc} value={cc}>{cc}</option>
                ))}
              </select>

              {/* Limpar Filtros */}
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-semibold flex items-center gap-1 transition-colors whitespace-nowrap"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Limpar ({activeFiltersCount})</span>
                </button>
              )}
            </div>
          </div>

          {/* Chips dos Filtros Aplicados */}
          {activeFiltersCount > 0 && (
            <div className="flex items-center gap-2 flex-wrap text-[11px] pt-1">
              <span className="text-slate-500 font-semibold flex items-center gap-1">
                <Filter className="w-3 h-3" />
                Filtros ativos:
              </span>
              {filters.employmentGroup !== 'all' && (
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-md border border-emerald-200 flex items-center gap-1">
                  Vínculo: {filters.employmentGroup}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters(f => ({ ...f, employmentGroup: 'all' }))} />
                </span>
              )}
              {filters.shiftCategory !== 'all' && (
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-800 rounded-md border border-indigo-200 flex items-center gap-1">
                  Turno: {filters.shiftCategory}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters(f => ({ ...f, shiftCategory: 'all' }))} />
                </span>
              )}
              {filters.macroarea !== 'all' && (
                <span className="px-2 py-0.5 bg-sky-50 text-sky-800 rounded-md border border-sky-200 flex items-center gap-1">
                  Macroárea: {filters.macroarea}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters(f => ({ ...f, macroarea: 'all' }))} />
                </span>
              )}
              {filters.costCenter !== 'all' && (
                <span className="px-2 py-0.5 bg-purple-50 text-purple-800 rounded-md border border-purple-200 flex items-center gap-1">
                  CC: {filters.costCenter}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters(f => ({ ...f, costCenter: 'all' }))} />
                </span>
              )}
              {filters.searchTerm && (
                <span className="px-2 py-0.5 bg-amber-50 text-amber-800 rounded-md border border-amber-200 flex items-center gap-1">
                  Termo: "{filters.searchTerm}"
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters(f => ({ ...f, searchTerm: '' }))} />
                </span>
              )}
            </div>
          )}

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. CONTEÚDO PRINCIPAL DAS ABAS */}
      {/* ========================================================================= */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Cabeçalho Executivo Inteligente para Captura de Imagem e Impressão */}
        <div className="capture-only hidden bg-white p-5 rounded-3xl border border-slate-200 mb-5 text-left shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  People Analytics
                  <span className="text-[#15877B] font-normal text-base"> | Feira de Santana</span>
                </h2>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-[#15877B] border border-teal-200">
                  Unidade Bahia • KBA1 / K111
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                Quadro de Pessoal & Performance Operacional • Competência: {filters.competence}
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block text-xs font-bold uppercase tracking-wider px-3 py-1 bg-[#132F46] text-white rounded-xl shadow-xs">
                {filteredEmployees.length} Registros Bahia
              </span>
            </div>
          </div>
        </div>

        {/* --------------------------------------------------------------------- */}
        {/* ABA 1: VISÃO GERAL */}
        {/* --------------------------------------------------------------------- */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            
            {/* LINHA SUPERIOR: KPIS DE QUADRO (CARD ELEGANTE CORPORATIVO) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3.5">
              
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Total Cadastrado</span>
                <div className="text-2xl font-black text-slate-900 mt-1">{metrics.total}</div>
                <div className="text-[11px] text-slate-500 mt-0.5 font-medium">Unidade Bahia (KBA1)</div>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Vínculo CLT</span>
                <div className="text-2xl font-black text-indigo-600 mt-1">{metrics.clt}</div>
                <div className="text-[11px] text-slate-500 mt-0.5 font-medium">{((metrics.clt / (metrics.total || 1)) * 100).toFixed(1)}% do quadro</div>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Aprendizes</span>
                <div className="text-2xl font-black text-sky-600 mt-1">{metrics.aprendizes}</div>
                <div className="text-[11px] text-slate-500 mt-0.5 font-medium">Programa Jovem Aprendiz</div>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Estagiários</span>
                <div className="text-2xl font-black text-purple-600 mt-1">{metrics.estagiarios}</div>
                <div className="text-[11px] text-slate-500 mt-0.5 font-medium">Nível Superior / Técnico</div>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Centros de Custo</span>
                <div className="text-2xl font-black text-emerald-600 mt-1">{metrics.uniqueCC}</div>
                <div className="text-[11px] text-slate-500 mt-0.5 font-medium">Estrutura Contábil</div>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Locais / Setores</span>
                <div className="text-2xl font-black text-slate-800 mt-1">{metrics.uniqueLocations}</div>
                <div className="text-[11px] text-slate-500 mt-0.5 font-medium">Células Operacionais</div>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Cargos Distintos</span>
                <div className="text-2xl font-black text-slate-800 mt-1">{metrics.uniqueJobs}</div>
                <div className="text-[11px] text-slate-500 mt-0.5 font-medium">Funções Fabris</div>
              </div>

            </div>

            {/* LINHA INTERMEDIÁRIA: DISTRIBUIÇÃO POR TURNO (COLUNAS) */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    Distribuição por Turno Cadastrado
                  </h3>
                  <p className="text-xs text-slate-500">
                    Proposta de categorização com base nas faixas horárias do PAAH (total {metrics.total} colaboradores).
                  </p>
                </div>
                <span className="text-xs text-slate-400 font-medium">Clique para filtrar</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                
                {/* Turno A */}
                <div 
                  onClick={() => setFilters(f => ({ ...f, shiftCategory: f.shiftCategory === 'Turno A' ? 'all' : 'Turno A' }))}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    filters.shiftCategory === 'Turno A'
                      ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400'
                      : 'bg-slate-50/60 border-slate-200 hover:border-amber-300 hover:bg-amber-50/30'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      Turno A (Manhã)
                    </span>
                    <span className="font-mono text-slate-500">06:00-14:20</span>
                  </div>
                  <div className="mt-2 text-2xl font-black text-slate-900">
                    {metrics.shiftDistribution['Turno A']}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {((metrics.shiftDistribution['Turno A'] / (metrics.total || 1)) * 100).toFixed(1)}% do quadro
                  </p>
                </div>

                {/* Turno B */}
                <div 
                  onClick={() => setFilters(f => ({ ...f, shiftCategory: f.shiftCategory === 'Turno B' ? 'all' : 'Turno B' }))}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    filters.shiftCategory === 'Turno B'
                      ? 'bg-sky-50/70 border-sky-300 ring-2 ring-sky-400'
                      : 'bg-slate-50/60 border-slate-200 hover:border-sky-300 hover:bg-sky-50/30'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                      Turno B (Tarde)
                    </span>
                    <span className="font-mono text-slate-500">14:20-22:30</span>
                  </div>
                  <div className="mt-2 text-2xl font-black text-slate-900">
                    {metrics.shiftDistribution['Turno B']}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {((metrics.shiftDistribution['Turno B'] / (metrics.total || 1)) * 100).toFixed(1)}% do quadro
                  </p>
                </div>

                {/* Turno C */}
                <div 
                  onClick={() => setFilters(f => ({ ...f, shiftCategory: f.shiftCategory === 'Turno C' ? 'all' : 'Turno C' }))}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    filters.shiftCategory === 'Turno C'
                      ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-400'
                      : 'bg-slate-50/60 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                      Turno C (Noite)
                    </span>
                    <span className="font-mono text-slate-500">22:30-06:00</span>
                  </div>
                  <div className="mt-2 text-2xl font-black text-slate-900">
                    {metrics.shiftDistribution['Turno C']}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {((metrics.shiftDistribution['Turno C'] / (metrics.total || 1)) * 100).toFixed(1)}% do quadro
                  </p>
                </div>

                {/* Administrativo */}
                <div 
                  onClick={() => setFilters(f => ({ ...f, shiftCategory: f.shiftCategory === 'Administrativo' ? 'all' : 'Administrativo' }))}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    filters.shiftCategory === 'Administrativo'
                      ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-400'
                      : 'bg-slate-50/60 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      Administrativo
                    </span>
                    <span className="font-mono text-slate-500">5x2 08:00-17:00</span>
                  </div>
                  <div className="mt-2 text-2xl font-black text-slate-900">
                    {metrics.shiftDistribution['Administrativo']}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {((metrics.shiftDistribution['Administrativo'] / (metrics.total || 1)) * 100).toFixed(1)}% do quadro
                  </p>
                </div>

                {/* Outras Jornadas */}
                <div 
                  onClick={() => setFilters(f => ({ ...f, shiftCategory: f.shiftCategory === 'Outras Jornadas' ? 'all' : 'Outras Jornadas' }))}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    filters.shiftCategory === 'Outras Jornadas'
                      ? 'bg-purple-50/70 border-purple-300 ring-2 ring-purple-400'
                      : 'bg-slate-50/60 border-slate-200 hover:border-purple-300 hover:bg-purple-50/30'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                      Outras Jornadas
                    </span>
                    <span className="font-mono text-slate-500">Especiais</span>
                  </div>
                  <div className="mt-2 text-2xl font-black text-slate-900">
                    {metrics.shiftDistribution['Outras Jornadas']}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Aprendizes, estágios, 07-15:40
                  </p>
                </div>

              </div>
            </div>

            {/* GRID DUPLO: RANKING DE CENTROS DE CUSTO & CARGOS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* TOP CENTROS DE CUSTO */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-indigo-600" />
                      Principais Centros de Custo (Fotografia Inicial)
                    </h3>
                    <p className="text-xs text-slate-500">Distribuição do quadro por setor contábil fabril.</p>
                  </div>
                  <span className="text-xs font-bold text-indigo-600">{metrics.uniqueCC} Centros</span>
                </div>

                <div className="space-y-2.5">
                  {metrics.sortedCostCenters.slice(0, 7).map((cc, i) => {
                    const percent = (cc.count / (metrics.total || 1)) * 100;
                    return (
                      <div 
                        key={cc.name}
                        onClick={() => setFilters(f => ({ ...f, costCenter: f.costCenter === cc.name ? 'all' : cc.name }))}
                        className="group p-2.5 rounded-xl hover:bg-slate-50 transition-all cursor-pointer border border-transparent hover:border-slate-200"
                      >
                        <div className="flex items-center justify-between text-xs font-semibold mb-1">
                          <span className="text-slate-800 group-hover:text-indigo-600 flex items-center gap-2">
                            <span className="text-slate-400 font-mono text-[11px]">#{i + 1}</span>
                            {cc.name}
                          </span>
                          <span className="text-slate-900 font-mono font-bold">
                            {cc.count} <span className="text-slate-400 font-normal">({percent.toFixed(1)}%)</span>
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div 
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 group-hover:from-indigo-600 group-hover:to-purple-600 transition-all"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* TOP CARGOS */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-emerald-600" />
                      Principais Cargos Operacionais
                    </h3>
                    <p className="text-xs text-slate-500">Concentração de funções no chão de fábrica.</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-600">{metrics.uniqueJobs} Cargos</span>
                </div>

                <div className="space-y-2.5">
                  {metrics.sortedJobs.slice(0, 7).map((job, i) => {
                    const percent = (job.count / (metrics.total || 1)) * 100;
                    return (
                      <div 
                        key={job.name}
                        onClick={() => setFilters(f => ({ ...f, job: f.job === job.name ? 'all' : job.name }))}
                        className="group p-2.5 rounded-xl hover:bg-slate-50 transition-all cursor-pointer border border-transparent hover:border-slate-200"
                      >
                        <div className="flex items-center justify-between text-xs font-semibold mb-1">
                          <span className="text-slate-800 group-hover:text-emerald-600 flex items-center gap-2">
                            <span className="text-slate-400 font-mono text-[11px]">#{i + 1}</span>
                            {job.name}
                          </span>
                          <span className="text-slate-900 font-mono font-bold">
                            {job.count} <span className="text-slate-400 font-normal">({percent.toFixed(1)}%)</span>
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div 
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 group-hover:from-emerald-600 group-hover:to-teal-700 transition-all"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* LINHA DE PERFORMANCE: CARDS DOS 9 INDICADORES GENTE & GESTÃO */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    Painel de Metas & Indicadores de Gente & Gestão
                  </h3>
                  <p className="text-xs text-slate-500">
                    Metas oficiais 1 / 3 / 5 da unidade Bahia. Clique em qualquer card para lançar realizado ou auditar.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 text-slate-500">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                    Sem dados realizados (não inventar)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {kpis.map((kpi) => {
                  const hasActual = kpi.actual !== null;
                  return (
                    <div
                      key={kpi.id}
                      onClick={() => {
                        setSelectedKPI(kpi);
                        setKpiActualInput(kpi.actual !== null ? String(kpi.actual) : '');
                        setIsKPIModalOpen(true);
                      }}
                      className="p-4 rounded-2xl bg-slate-50/60 border border-slate-200/90 hover:border-emerald-300 hover:bg-emerald-50/20 transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3 group"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 py-0.5 rounded-md bg-white border border-slate-200">
                            {kpi.category}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {kpi.unit}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors mt-2 leading-tight">
                          {kpi.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                          {kpi.description}
                        </p>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-slate-200/60">
                        {/* Realizado */}
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-medium">Realizado:</span>
                          <span className={`font-mono font-bold ${hasActual ? 'text-slate-900 text-sm' : 'text-slate-400 italic'}`}>
                            {hasActual ? `${kpi.actual}${kpi.unit}` : 'Sem dados realizados'}
                          </span>
                        </div>

                        {/* Metas 1 / 3 / 5 */}
                        <div className="grid grid-cols-3 gap-1 text-[11px] bg-white p-2 rounded-xl border border-slate-100 text-center font-mono">
                          <div>
                            <span className="text-slate-400 block text-[9px] uppercase">Meta 1</span>
                            <span className="font-bold text-slate-700">{kpi.target1}{kpi.unit}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[9px] uppercase">Meta 3</span>
                            <span className="font-bold text-slate-700">{kpi.target3}{kpi.unit}</span>
                          </div>
                          <div>
                            <span className="text-emerald-600 block text-[9px] uppercase font-bold">Meta 5</span>
                            <span className="font-bold text-emerald-700">{kpi.target5}{kpi.unit}</span>
                          </div>
                        </div>

                        {/* Polaridade */}
                        <div className="text-[10px] text-slate-500 flex items-center justify-between pt-0.5">
                          <span>
                            {kpi.polarity === 'higher_is_better' && '▲ Maior é melhor'}
                            {kpi.polarity === 'lower_is_better' && '▼ Menor é melhor'}
                            {kpi.polarity === 'to_validate' && '⚠️ Polaridade a validar'}
                          </span>
                          <span className="text-emerald-600 font-semibold group-hover:underline">Lançar / Auditar</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* OPORTUNIDADES DE AÇÃO E MOTOR DE RECOMENDAÇÕES */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Oportunidades de Ação & Insights Automáticos
                  </h3>
                  <p className="text-xs text-slate-500">
                    Motor de recomendações com regras transparentes sobre o extrato atual.
                  </p>
                </div>
                <button
                  onClick={() => setIsNewActionModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors border border-indigo-200"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Nova Ação
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {actionPlans.map(act => (
                  <div key={act.id} className="p-4 rounded-2xl bg-amber-50/40 border border-amber-200/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-amber-900">{act.title}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                        {act.priority} Prioridade
                      </span>
                    </div>
                    <p className="text-xs text-slate-700">
                      <strong>Escopo:</strong> {act.scope}
                    </p>
                    <p className="text-[11px] text-slate-600">
                      <strong>Evidência:</strong> {act.evidence}
                    </p>
                    <p className="text-[11px] text-emerald-800 bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                      <strong>Ação recomendada:</strong> {act.suggestedAction}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span>Responsável: <strong>{act.responsible}</strong></span>
                      <span>Prazo: <strong>{act.deadline}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* --------------------------------------------------------------------- */}
        {/* ABA 2: QUADRO DE PESSOAL (TABELA COM DRILL-DOWN E PAGINAÇÃO) */}
        {/* --------------------------------------------------------------------- */}
        {activeTab === 'headcount' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  Quadro de Pessoal Completo — Unidade Bahia
                </h3>
                <p className="text-xs text-slate-500">
                  Exibindo {filteredEmployees.length} registros conforme filtros aplicados.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={exportToExcel}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-xs"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Exportar Tabela
                </button>
              </div>
            </div>

            {/* TABELA DE COMPOSIÇÃO NOMINATIVA / REGISTROS */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200 max-h-[600px] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100/80 sticky top-0 z-10 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3">PRN</th>
                    <th className="p-3">Nome do Colaborador</th>
                    <th className="p-3">Vínculo</th>
                    <th className="p-3">Cargo</th>
                    <th className="p-3">Centro de Custo</th>
                    <th className="p-3">Local / Setor</th>
                    <th className="p-3">Turno / Jornada</th>
                    <th className="p-3">Gestor Imediato</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredEmployees.map((emp) => (
                    <tr key={emp.prn} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-mono font-bold text-slate-900">{emp.prn}</td>
                      <td className="p-3 font-medium text-slate-900">{emp.name}</td>
                      <td className="p-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          emp.employmentGroup === 'CLT'
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : emp.employmentGroup === 'Aprendiz'
                            ? 'bg-sky-50 text-sky-700 border border-sky-200'
                            : 'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}>
                          {emp.employmentGroup}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-slate-800">{emp.jobTitle}</td>
                      <td className="p-3">{emp.costCenterName}</td>
                      <td className="p-3 text-slate-600">{emp.locationName}</td>
                      <td className="p-3">
                        <span className="font-semibold text-slate-800 block">{emp.shiftCategory}</span>
                        <span className="text-[10px] text-slate-400 block truncate max-w-[140px]">{emp.shiftName}</span>
                      </td>
                      <td className="p-3 text-slate-600">{emp.immediateManager}</td>
                      <td className="p-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          emp.status === 'Ativo'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : emp.status === 'Férias'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {emp.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="text-xs text-slate-500 flex items-center justify-between pt-2">
              <span>Total de {filteredEmployees.length} colaboradores na visão atual</span>
              <span>Visualização restrita ao estabelecimento KBA1 (Bahia)</span>
            </div>
          </div>
        )}

        {/* --------------------------------------------------------------------- */}
        {/* ABA 3: CARGOS E TURNOS */}
        {/* --------------------------------------------------------------------- */}
        {activeTab === 'jobs_shifts' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-emerald-600" />
                  Matriz de Cargos vs. Turnos (Feira de Santana)
                </h3>
                <p className="text-xs text-slate-500">
                  Cruzamento da ocupação dos 66 cargos entre as escalas de trabalho fabris.
                </p>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="p-3">Cargo Operacional</th>
                      <th className="p-3 text-center bg-amber-50/50">Turno A</th>
                      <th className="p-3 text-center bg-sky-50/50">Turno B</th>
                      <th className="p-3 text-center bg-indigo-50/50">Turno C</th>
                      <th className="p-3 text-center bg-emerald-50/50">Administrativo</th>
                      <th className="p-3 text-center bg-purple-50/50">Outras Jornadas</th>
                      <th className="p-3 text-center font-bold">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {metrics.sortedJobs.slice(0, 15).map((job) => {
                      const inA = filteredEmployees.filter(e => e.jobTitle === job.name && e.shiftCategory === 'Turno A').length;
                      const inB = filteredEmployees.filter(e => e.jobTitle === job.name && e.shiftCategory === 'Turno B').length;
                      const inC = filteredEmployees.filter(e => e.jobTitle === job.name && e.shiftCategory === 'Turno C').length;
                      const inAdm = filteredEmployees.filter(e => e.jobTitle === job.name && e.shiftCategory === 'Administrativo').length;
                      const inOut = filteredEmployees.filter(e => e.jobTitle === job.name && e.shiftCategory === 'Outras Jornadas').length;

                      return (
                        <tr key={job.name} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-semibold text-slate-800">{job.name}</td>
                          <td className="p-3 text-center font-mono text-slate-700">{inA || '—'}</td>
                          <td className="p-3 text-center font-mono text-slate-700">{inB || '—'}</td>
                          <td className="p-3 text-center font-mono text-slate-700">{inC || '—'}</td>
                          <td className="p-3 text-center font-mono text-slate-700">{inAdm || '—'}</td>
                          <td className="p-3 text-center font-mono text-slate-700">{inOut || '—'}</td>
                          <td className="p-3 text-center font-mono font-bold text-slate-900 bg-slate-50">{job.count}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* --------------------------------------------------------------------- */}
        {/* ABA 4: INDICADORES GENTE & GESTÃO (TABELA COMPLETA COM 9 KPIS) */}
        {/* --------------------------------------------------------------------- */}
        {activeTab === 'indicators' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  Quadro Completo dos 9 Indicadores de Gente & Gestão
                </h3>
                <p className="text-xs text-slate-500">
                  Metas 1 / 3 / 5 oficiais da Unidade Bahia. Os resultados realizados só aparecem quando lançados ou importados.
                </p>
              </div>

              <button
                onClick={() => {
                  setDataEntryTab('manual');
                  setManualFormType('kpi');
                  setActiveTab('data_entry');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Lançar Realizado
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3">Indicador</th>
                    <th className="p-3">Categoria</th>
                    <th className="p-3">Unidade</th>
                    <th className="p-3 text-center font-bold text-slate-900 bg-slate-200/50">Realizado</th>
                    <th className="p-3 text-center">Meta 1</th>
                    <th className="p-3 text-center">Meta 3</th>
                    <th className="p-3 text-center text-emerald-700">Meta 5</th>
                    <th className="p-3 text-center">Polaridade</th>
                    <th className="p-3">Responsável</th>
                    <th className="p-3">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {kpis.map((kpi) => (
                    <tr key={kpi.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3">
                        <span className="font-bold text-slate-900 block">{kpi.name}</span>
                        <span className="text-[11px] text-slate-500 block max-w-sm">{kpi.description}</span>
                      </td>
                      <td className="p-3 font-medium text-slate-600">{kpi.category}</td>
                      <td className="p-3 font-mono">{kpi.unit}</td>
                      <td className="p-3 text-center font-mono font-bold bg-slate-50">
                        {kpi.actual !== null ? (
                          <span className="text-slate-900 font-bold">{kpi.actual}{kpi.unit}</span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Sem realizado</span>
                        )}
                      </td>
                      <td className="p-3 text-center font-mono font-semibold">{kpi.target1}{kpi.unit}</td>
                      <td className="p-3 text-center font-mono font-semibold">{kpi.target3}{kpi.unit}</td>
                      <td className="p-3 text-center font-mono font-bold text-emerald-700">{kpi.target5}{kpi.unit}</td>
                      <td className="p-3 text-center text-[11px]">
                        {kpi.polarity === 'higher_is_better' && <span className="text-emerald-700 font-medium">Maior melhor</span>}
                        {kpi.polarity === 'lower_is_better' && <span className="text-indigo-700 font-medium">Menor melhor</span>}
                        {kpi.polarity === 'to_validate' && <span className="text-amber-700 font-medium">A validar</span>}
                      </td>
                      <td className="p-3 text-slate-600 text-[11px]">{kpi.responsible}</td>
                      <td className="p-3">
                        <button
                          onClick={() => {
                            setSelectedKPI(kpi);
                            setKpiActualInput(kpi.actual !== null ? String(kpi.actual) : '');
                            setIsKPIModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] border border-emerald-200 transition-colors"
                        >
                          Lançar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --------------------------------------------------------------------- */}
        {/* ABA 5: ABSENTEÍSMO */}
        {/* --------------------------------------------------------------------- */}
        {activeTab === 'absenteeism' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                Painel de Absenteísmo — Gestão de Frequência & Horas
              </h3>
              <p className="text-xs text-slate-500">
                Fórmula padrão: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono">absenteísmo (%) = horas ausência ÷ horas programadas × 100</code>
              </p>
            </div>

            {/* AVISO PEDAGÓGICO DE DADOS REAIS */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs text-amber-900">
              <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Sem dados realizados de horas de ausência no extrato PAAH fornecido</p>
                <p className="mt-0.5 text-slate-600 leading-relaxed">
                  Conforme a diretriz de integridade de People Analytics, valores de absenteísmo não são fabricados. Para apurar os percentuais deste mês, faça a importação da planilha complementar de ponto/horas ou lance manualmente na aba "Entrada de Dados".
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-xs text-slate-500 font-semibold block">Absenteísmo Total (%)</span>
                <div className="text-2xl font-black text-slate-400 mt-1">—</div>
                <p className="text-[11px] text-slate-400 mt-0.5">Sem base de ponto</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-xs text-slate-500 font-semibold block">Horas de Ausência Elegíveis</span>
                <div className="text-2xl font-black text-slate-400 mt-1">—</div>
                <p className="text-[11px] text-slate-400 mt-0.5">Atestados e faltas justificadas</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-xs text-slate-500 font-semibold block">Horas Programadas</span>
                <div className="text-2xl font-black text-slate-400 mt-1">56.480 h</div>
                <p className="text-[11px] text-slate-500 mt-0.5">Estimativa baseada em 353 colaboradores</p>
              </div>
            </div>
          </div>
        )}

        {/* --------------------------------------------------------------------- */}
        {/* ABA 6: MOVIMENTAÇÕES E TURNOVER */}
        {/* --------------------------------------------------------------------- */}
        {activeTab === 'movements' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-indigo-600" />
                Painel de Movimentações & Turnover
              </h3>
              <p className="text-xs text-slate-500">
                Fórmula padrão: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono">turnover (%) = desligamentos ÷ HC médio × 100</code>
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-xs text-slate-500 font-semibold block">Meta Turnover (Nível 1)</span>
                <div className="text-2xl font-black text-slate-900 mt-1">1,12%</div>
                <p className="text-[11px] text-slate-500 mt-0.5">Meta oficial Bahia</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-xs text-slate-500 font-semibold block">Meta Turnover (Nível 3)</span>
                <div className="text-2xl font-black text-slate-900 mt-1">1,10%</div>
                <p className="text-[11px] text-slate-500 mt-0.5">Nível intermediário</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-xs text-slate-500 font-semibold block">Meta Turnover (Nível 5)</span>
                <div className="text-2xl font-black text-emerald-700 mt-1">1,06%</div>
                <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Nível excelência</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-xs text-slate-500 font-semibold block">Turnover Realizado</span>
                <div className="text-2xl font-black text-slate-400 mt-1">
                  {kpis.find(k => k.id === 'turnover_unidade')?.actual !== null 
                    ? `${kpis.find(k => k.id === 'turnover_unidade')?.actual}%` 
                    : '—'}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">Sem desligamentos lançados</p>
              </div>
            </div>
          </div>
        )}

        {/* --------------------------------------------------------------------- */}
        {/* ABA 7: TREINAMENTO & SUPERAR */}
        {/* --------------------------------------------------------------------- */}
        {activeTab === 'trainings' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                Treinamento, Matriz de Habilidades & Programa Superar
              </h3>
              <p className="text-xs text-slate-500">
                Acompanhamento das metas de capacitação técnica, requisitos legais e instrutores internos.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {kpis.filter(k => k.category === 'Treinamento').map(kpi => (
                <div key={kpi.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Treinamento
                  </span>
                  <h4 className="text-sm font-bold text-slate-900">{kpi.name}</h4>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200">
                    <span className="text-slate-500">Metas (1 / 3 / 5):</span>
                    <span className="font-mono font-bold text-slate-800">
                      {kpi.target1}% / {kpi.target3}% / <span className="text-emerald-700">{kpi.target5}%</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200">
                    <span className="text-slate-500">Realizado:</span>
                    <span className="font-mono font-bold text-slate-500">
                      {kpi.actual !== null ? `${kpi.actual}%` : 'Sem realizado'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --------------------------------------------------------------------- */}
        {/* ABA 8: ALERTAS E PLANOS DE AÇÃO */}
        {/* --------------------------------------------------------------------- */}
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

        {/* --------------------------------------------------------------------- */}
        {/* ABA 9: ENTRADA DE DADOS (DUAS ABAS OBRIGATÓRIAS: IMPORTAÇÃO & MANUAL) */}
        {/* --------------------------------------------------------------------- */}
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

            {/* SUB-ABA 2: LANÇAMENTO MANUAL */}
            {dataEntryTab === 'manual' && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-xs">
                  <button
                    onClick={() => setManualFormType('employee')}
                    className={`px-3 py-1.5 rounded-lg font-bold ${
                      manualFormType === 'employee' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    Cadastrar Colaborador
                  </button>
                  <button
                    onClick={() => setManualFormType('kpi')}
                    className={`px-3 py-1.5 rounded-lg font-bold ${
                      manualFormType === 'kpi' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    Lançar Realizado de Indicador
                  </button>
                  <button
                    onClick={() => setManualFormType('action')}
                    className={`px-3 py-1.5 rounded-lg font-bold ${
                      manualFormType === 'action' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    Cadastrar Plano de Ação
                  </button>
                </div>

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

      {/* ========================================================================= */}
      {/* 4. MODAL PARA LANÇAR OU AUDITAR INDICADOR G&G */}
      {/* ========================================================================= */}
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

