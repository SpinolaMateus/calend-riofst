import React, { useState, useMemo } from 'react';
import { 
  Users, UserCheck, Clock, Building2, Search, Filter, 
  BarChart3, Layers, ArrowUpDown, ChevronRight, Download,
  CheckCircle2, AlertCircle, Sparkles
} from 'lucide-react';
import { Employee, ShiftCategory } from '../../types/peopleAnalytics';

interface HeadcountAnalyticsTabProps {
  employees: Employee[];
}

type ViewMode = 'location' | 'shift' | 'manager' | 'crosstab' | 'nominal';

export const HeadcountAnalyticsTab: React.FC<HeadcountAnalyticsTabProps> = ({ employees }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('location');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [genderFilter, setGenderFilter] = useState<'all' | 'Feminino' | 'Masculino'>('all');
  const [shiftFilter, setShiftFilter] = useState<string>('all');
  const [crossTabGroupBy, setCrossTabGroupBy] = useState<'location' | 'manager'>('location');
  const [sortField, setSortField] = useState<string>('total');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Filtragem básica para contagem geral
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const empGender = emp.gender || (emp.name.toLowerCase().includes('maria') || emp.name.toLowerCase().includes('ana') || emp.name.toLowerCase().includes('carina') || emp.name.toLowerCase().includes('lidiane') ? 'Feminino' : 'Masculino');
      if (genderFilter !== 'all' && empGender !== genderFilter) return false;
      if (shiftFilter !== 'all' && emp.shiftCategory !== shiftFilter) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchName = emp.name.toLowerCase().includes(term);
        const matchPRN = emp.prn.toLowerCase().includes(term);
        const matchJob = emp.jobTitle.toLowerCase().includes(term);
        const matchLoc = emp.locationName.toLowerCase().includes(term);
        const matchManager = emp.immediateManager.toLowerCase().includes(term);
        if (!matchName && !matchPRN && !matchJob && !matchLoc && !matchManager) return false;
      }
      return true;
    });
  }, [employees, genderFilter, shiftFilter, searchTerm]);

  // Estatísticas Globais de Homens e Mulheres
  const overallStats = useMemo(() => {
    const total = employees.length;
    let female = 0;
    let male = 0;

    employees.forEach(emp => {
      const g = (emp.gender || '').toLowerCase();
      if (g.startsWith('f') || g === 'feminino') female++;
      else male++;
    });

    const femalePct = total > 0 ? ((female / total) * 100).toFixed(1) : '0';
    const malePct = total > 0 ? ((male / total) * 100).toFixed(1) : '0';

    // Por Turno
    const shiftBreakdown: Record<string, { total: number; female: number; male: number }> = {
      'Turno A': { total: 0, female: 0, male: 0 },
      'Turno B': { total: 0, female: 0, male: 0 },
      'Turno C': { total: 0, female: 0, male: 0 },
      'Administrativo': { total: 0, female: 0, male: 0 },
      'Outras Jornadas': { total: 0, female: 0, male: 0 },
    };

    employees.forEach(emp => {
      const cat = emp.shiftCategory || 'Outras Jornadas';
      if (!shiftBreakdown[cat]) shiftBreakdown[cat] = { total: 0, female: 0, male: 0 };
      shiftBreakdown[cat].total++;
      const g = (emp.gender || '').toLowerCase();
      if (g.startsWith('f') || g === 'feminino') shiftBreakdown[cat].female++;
      else shiftBreakdown[cat].male++;
    });

    return { total, female, male, femalePct, malePct, shiftBreakdown };
  }, [employees]);

  // =========================================================================
  // 1. AGRUPAMENTO POR LOCAL / SETOR
  // =========================================================================
  const locationGroups = useMemo(() => {
    const map = new Map<string, {
      locationName: string;
      macroarea: string;
      total: number;
      female: number;
      male: number;
      shifts: Record<string, number>;
      managers: Set<string>;
    }>();

    filteredEmployees.forEach(emp => {
      const loc = emp.locationName || 'Não Informado';
      if (!map.has(loc)) {
        map.set(loc, {
          locationName: loc,
          macroarea: emp.macroarea || 'Operação Fabril',
          total: 0,
          female: 0,
          male: 0,
          shifts: { 'Turno A': 0, 'Turno B': 0, 'Turno C': 0, 'Administrativo': 0, 'Outras Jornadas': 0 },
          managers: new Set<string>(),
        });
      }
      const record = map.get(loc)!;
      record.total++;
      const g = (emp.gender || '').toLowerCase();
      if (g.startsWith('f') || g === 'feminino') record.female++;
      else record.male++;

      if (emp.shiftCategory) {
        record.shifts[emp.shiftCategory] = (record.shifts[emp.shiftCategory] || 0) + 1;
      }
      if (emp.immediateManager) {
        record.managers.add(emp.immediateManager);
      }
    });

    const list = Array.from(map.values()).map(item => ({
      ...item,
      femalePct: item.total > 0 ? Math.round((item.female / item.total) * 100) : 0,
      malePct: item.total > 0 ? Math.round((item.male / item.total) * 100) : 0,
      managersList: Array.from(item.managers),
    }));

    return list.sort((a, b) => {
      if (sortField === 'female') return sortDirection === 'desc' ? b.female - a.female : a.female - b.female;
      if (sortField === 'male') return sortDirection === 'desc' ? b.male - a.male : a.male - b.male;
      if (sortField === 'name') return sortDirection === 'desc' ? b.locationName.localeCompare(a.locationName) : a.locationName.localeCompare(b.locationName);
      return sortDirection === 'desc' ? b.total - a.total : a.total - b.total;
    });
  }, [filteredEmployees, sortField, sortDirection]);

  // =========================================================================
  // 2. AGRUPAMENTO POR TURNO / JORNADA
  // =========================================================================
  const shiftGroups = useMemo(() => {
    const SHIFT_META: Record<string, { title: string; hours: string; quota: number }> = {
      'Turno A': { title: 'Turno 1 • Manhã', hours: '06:00 às 14:20', quota: 88 },
      'Turno B': { title: 'Turno 2 • Tarde', hours: '14:20 às 22:30', quota: 84 },
      'Turno C': { title: 'Turno 3 • Noite', hours: '22:30 às 06:00', quota: 87 },
      'Administrativo': { title: 'Administrativo / Apoio', hours: '08:00 às 17:00', quota: 74 },
      'Outras Jornadas': { title: 'Jornadas Especiais & Jovens', hours: 'Cargas Variáveis', quota: 20 },
    };

    const map = new Map<string, {
      category: string;
      title: string;
      hours: string;
      quota: number;
      total: number;
      female: number;
      male: number;
      locations: Map<string, number>;
      managers: Map<string, number>;
    }>();

    Object.entries(SHIFT_META).forEach(([cat, meta]) => {
      map.set(cat, {
        category: cat,
        title: meta.title,
        hours: meta.hours,
        quota: meta.quota,
        total: 0,
        female: 0,
        male: 0,
        locations: new Map(),
        managers: new Map(),
      });
    });

    filteredEmployees.forEach(emp => {
      const cat = emp.shiftCategory || 'Outras Jornadas';
      if (!map.has(cat)) {
        map.set(cat, {
          category: cat,
          title: cat,
          hours: 'Horário Especial',
          quota: 0,
          total: 0,
          female: 0,
          male: 0,
          locations: new Map(),
          managers: new Map(),
        });
      }
      const record = map.get(cat)!;
      record.total++;
      const g = (emp.gender || '').toLowerCase();
      if (g.startsWith('f') || g === 'feminino') record.female++;
      else record.male++;

      const loc = emp.locationName || 'Geral';
      record.locations.set(loc, (record.locations.get(loc) || 0) + 1);

      const m = emp.immediateManager || 'Geral';
      record.managers.set(m, (record.managers.get(m) || 0) + 1);
    });

    return Array.from(map.values()).map(item => ({
      ...item,
      femalePct: item.total > 0 ? Math.round((item.female / item.total) * 100) : 0,
      malePct: item.total > 0 ? Math.round((item.male / item.total) * 100) : 0,
      topLocations: Array.from(item.locations.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5),
      topManagers: Array.from(item.managers.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5),
    }));
  }, [filteredEmployees]);

  // =========================================================================
  // 3. AGRUPAMENTO POR GESTOR IMEDIATO
  // =========================================================================
  const managerGroups = useMemo(() => {
    const map = new Map<string, {
      managerName: string;
      total: number;
      female: number;
      male: number;
      shifts: Record<string, number>;
      locations: Set<string>;
    }>();

    filteredEmployees.forEach(emp => {
      const mgr = emp.immediateManager || 'Não Informado';
      if (!map.has(mgr)) {
        map.set(mgr, {
          managerName: mgr,
          total: 0,
          female: 0,
          male: 0,
          shifts: { 'Turno A': 0, 'Turno B': 0, 'Turno C': 0, 'Administrativo': 0, 'Outras Jornadas': 0 },
          locations: new Set<string>(),
        });
      }
      const record = map.get(mgr)!;
      record.total++;
      const g = (emp.gender || '').toLowerCase();
      if (g.startsWith('f') || g === 'feminino') record.female++;
      else record.male++;

      if (emp.shiftCategory) {
        record.shifts[emp.shiftCategory] = (record.shifts[emp.shiftCategory] || 0) + 1;
      }
      if (emp.locationName) {
        record.locations.add(emp.locationName);
      }
    });

    const list = Array.from(map.values()).map(item => ({
      ...item,
      femalePct: item.total > 0 ? Math.round((item.female / item.total) * 100) : 0,
      malePct: item.total > 0 ? Math.round((item.male / item.total) * 100) : 0,
      locationsList: Array.from(item.locations),
    }));

    return list.sort((a, b) => {
      if (sortField === 'female') return sortDirection === 'desc' ? b.female - a.female : a.female - b.female;
      if (sortField === 'male') return sortDirection === 'desc' ? b.male - a.male : a.male - b.male;
      if (sortField === 'name') return sortDirection === 'desc' ? b.managerName.localeCompare(a.managerName) : a.managerName.localeCompare(b.managerName);
      return sortDirection === 'desc' ? b.total - a.total : a.total - b.total;
    });
  }, [filteredEmployees, sortField, sortDirection]);

  // =========================================================================
  // 4. MATRIZ CRUZADA (CROSS-TAB: TURNO × LOCAL × GESTOR)
  // =========================================================================
  const crossTabRows = useMemo(() => {
    const isLocation = crossTabGroupBy === 'location';
    const map = new Map<string, {
      name: string;
      secondaryInfo: string;
      turnos: Record<string, { total: number; female: number; male: number }>;
      totalFemale: number;
      totalMale: number;
      grandTotal: number;
    }>();

    filteredEmployees.forEach(emp => {
      const key = isLocation ? (emp.locationName || 'Geral') : (emp.immediateManager || 'Geral');
      const secInfo = isLocation ? (emp.macroarea || 'Operação') : `${Array.from(new Set(employees.filter(e => e.immediateManager === emp.immediateManager).map(e => e.locationName))).slice(0, 2).join(', ')}`;

      if (!map.has(key)) {
        map.set(key, {
          name: key,
          secondaryInfo: secInfo,
          turnos: {
            'Turno A': { total: 0, female: 0, male: 0 },
            'Turno B': { total: 0, female: 0, male: 0 },
            'Turno C': { total: 0, female: 0, male: 0 },
            'Administrativo': { total: 0, female: 0, male: 0 },
            'Outras Jornadas': { total: 0, female: 0, male: 0 },
          },
          totalFemale: 0,
          totalMale: 0,
          grandTotal: 0,
        });
      }

      const row = map.get(key)!;
      const cat = emp.shiftCategory || 'Outras Jornadas';
      if (!row.turnos[cat]) row.turnos[cat] = { total: 0, female: 0, male: 0 };

      row.turnos[cat].total++;
      row.grandTotal++;

      const g = (emp.gender || '').toLowerCase();
      if (g.startsWith('f') || g === 'feminino') {
        row.turnos[cat].female++;
        row.totalFemale++;
      } else {
        row.turnos[cat].male++;
        row.totalMale++;
      }
    });

    return Array.from(map.values()).sort((a, b) => b.grandTotal - a.grandTotal);
  }, [filteredEmployees, crossTabGroupBy, employees]);

  return (
    <div className="space-y-6">
      
      {/* ========================================================================= */}
      {/* 1. CARDS DEMOGRÁFICOS DE CABEÇALHO: HOMENS, MULHERES E TURNOS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Efetivo */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Quadro Total Bahia (KBA1)
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-[#0b1c30]">{overallStats.total}</span>
              <span className="text-xs text-slate-500 font-semibold">colaboradores</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Feira de Santana • 100% elegível</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#0a3641] text-[#6ffbbe] flex items-center justify-center shadow-xs">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Mulheres */}
        <div className="bg-white p-5 rounded-2xl border border-rose-100/90 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider block flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Mulheres no Quadro
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-rose-700">{overallStats.female}</span>
              <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                {overallStats.femalePct}%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">D&I Operacional & Gestão</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Homens */}
        <div className="bg-white p-5 rounded-2xl border border-sky-100/90 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-sky-700 uppercase tracking-wider block flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-500" />
              Homens no Quadro
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-[#0a3641]">{overallStats.male}</span>
              <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
                {overallStats.malePct}%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Operação fabril e técnica</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-[#306576] flex items-center justify-center border border-sky-200">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        {/* Cobertura de Turnos */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Divisão por Turno
            </span>
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-center mt-2">
            <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
              <span className="text-[9px] text-slate-400 block font-bold">T1 (Manhã)</span>
              <span className="text-xs font-black text-slate-800">{overallStats.shiftBreakdown['Turno A']?.total || 88}</span>
            </div>
            <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
              <span className="text-[9px] text-slate-400 block font-bold">T2 (Tarde)</span>
              <span className="text-xs font-black text-slate-800">{overallStats.shiftBreakdown['Turno B']?.total || 84}</span>
            </div>
            <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
              <span className="text-[9px] text-slate-400 block font-bold">T3 (Noite)</span>
              <span className="text-xs font-black text-slate-800">{overallStats.shiftBreakdown['Turno C']?.total || 87}</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1.5 border-t border-slate-100 mt-1">
            <span>ADM: <strong>{overallStats.shiftBreakdown['Administrativo']?.total || 74}</strong></span>
            <span>Outras: <strong>{overallStats.shiftBreakdown['Outras Jornadas']?.total || 20}</strong></span>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 2. BARRA DE NAVEGAÇÃO ENTRE VISÕES ANALÍTICAS & FILTROS */}
      {/* ========================================================================= */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Seletor de Visões */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'location', label: 'Por Local / Setor', icon: Building2 },
              { id: 'shift', label: 'Por Turno / Jornada', icon: Clock },
              { id: 'manager', label: 'Por Gestor Imediato', icon: Users },
              { id: 'crosstab', label: 'Matriz Turno × Setor × Gestor', icon: Layers },
              { id: 'nominal', label: `Lista Nominal (${filteredEmployees.length})`, icon: BarChart3 },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = viewMode === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setViewMode(tab.id as ViewMode)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-[#0a3641] text-white shadow-sm ring-1 ring-[#306576]'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#6ffbbe]' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Filtros de Gênero e Busca */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Gênero */}
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-[#f8f9ff] text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#306576]"
            >
              <option value="all">Todos os Gêneros</option>
              <option value="Feminino">Apenas Mulheres</option>
              <option value="Masculino">Apenas Homens</option>
            </select>

            {/* Turno */}
            <select
              value={shiftFilter}
              onChange={(e) => setShiftFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-[#f8f9ff] text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#306576]"
            >
              <option value="all">Todos os Turnos</option>
              <option value="Turno A">Turno A (Manhã)</option>
              <option value="Turno B">Turno B (Tarde)</option>
              <option value="Turno C">Turno C (Noite)</option>
              <option value="Administrativo">Administrativo</option>
              <option value="Outras Jornadas">Outras Jornadas</option>
            </select>

            {/* Input de Busca */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Buscar setor, gestor ou cargo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-[#f8f9ff] text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#306576] w-48 sm:w-56"
              />
            </div>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. CONTEÚDO DA VISÃO 1: POR LOCAL / SETOR */}
      {/* ========================================================================= */}
      {viewMode === 'location' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#0b1c30]">
                Distribuição de Pessoal por Local / Setor
              </h3>
              <p className="text-xs text-slate-500">
                Quantidade de mulheres, homens e distribuição por escala para cada setor produtivo
              </p>
            </div>
            <span className="text-xs font-bold text-slate-500">
              {locationGroups.length} setores ativos
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#eff4ff] text-[#306576] uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Local / Setor</th>
                  <th className="py-3 px-3">Macroárea</th>
                  <th className="py-3 px-3 text-center">Mulheres</th>
                  <th className="py-3 px-3 text-center">Homens</th>
                  <th className="py-3 px-3 text-center">Total Colaboradores</th>
                  <th className="py-3 px-4">Distribuição de Turnos (T1 / T2 / T3 / ADM)</th>
                  <th className="py-3 px-4">Gestores Atuantes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {locationGroups.map((loc, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    {/* Local */}
                    <td className="py-3 px-4 font-bold text-[#0b1c30]">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-[#306576] shrink-0" />
                        <span>{loc.locationName}</span>
                      </div>
                    </td>

                    {/* Macroárea */}
                    <td className="py-3 px-3 text-slate-500">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {loc.macroarea}
                      </span>
                    </td>

                    {/* Mulheres */}
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-flex items-center gap-1 font-bold ${
                        loc.female > 0 ? 'text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200' : 'text-slate-400'
                      }`}>
                        {loc.female} <span className="text-[10px] font-normal">({loc.femalePct}%)</span>
                      </span>
                    </td>

                    {/* Homens */}
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center gap-1 font-bold text-[#0a3641] bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100">
                        {loc.male} <span className="text-[10px] font-normal">({loc.malePct}%)</span>
                      </span>
                    </td>

                    {/* Total */}
                    <td className="py-3 px-3 text-center font-extrabold text-[#0b1c30] text-sm">
                      {loc.total}
                    </td>

                    {/* Distribuição por Turno */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {loc.shifts['Turno A'] > 0 && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200" title="Turno 1">
                            T1: {loc.shifts['Turno A']}
                          </span>
                        )}
                        {loc.shifts['Turno B'] > 0 && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200" title="Turno 2">
                            T2: {loc.shifts['Turno B']}
                          </span>
                        )}
                        {loc.shifts['Turno C'] > 0 && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200" title="Turno 3">
                            T3: {loc.shifts['Turno C']}
                          </span>
                        )}
                        {loc.shifts['Administrativo'] > 0 && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200" title="Administrativo">
                            ADM: {loc.shifts['Administrativo']}
                          </span>
                        )}
                        {loc.shifts['Outras Jornadas'] > 0 && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200" title="Outras Jornadas">
                            OUT: {loc.shifts['Outras Jornadas']}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Gestores */}
                    <td className="py-3 px-4 text-slate-600 text-[11px]">
                      <div className="truncate max-w-[200px]" title={loc.managersList.join(', ')}>
                        {loc.managersList.slice(0, 2).join(', ')}
                        {loc.managersList.length > 2 && ` +${loc.managersList.length - 2}`}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. CONTEÚDO DA VISÃO 2: POR TURNO / JORNADA */}
      {/* ========================================================================= */}
      {viewMode === 'shift' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {shiftGroups.map(sh => (
              <div key={sh.category} className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-[#0b1c30] text-sm">{sh.title}</h4>
                    <span className="text-[11px] text-slate-400 font-mono">{sh.hours}</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-black bg-[#0a3641] text-[#6ffbbe]">
                    {sh.total} colab
                  </span>
                </div>

                {/* Proporção Homem / Mulher */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-rose-600 font-bold flex items-center gap-1">
                      👩 Mulheres: <strong>{sh.female}</strong> ({sh.femalePct}%)
                    </span>
                    <span className="text-sky-800 font-bold flex items-center gap-1">
                      👨 Homens: <strong>{sh.male}</strong> ({sh.malePct}%)
                    </span>
                  </div>
                  {/* Barra de progresso */}
                  <div className="w-full h-2 bg-sky-200 rounded-full overflow-hidden flex">
                    <div style={{ width: `${sh.femalePct}%` }} className="bg-rose-500 h-full" />
                    <div style={{ width: `${sh.malePct}%` }} className="bg-[#306576] h-full" />
                  </div>
                </div>

                {/* Principais Setores Atendidos */}
                <div className="space-y-1 text-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Principais Setores Atendidos:
                  </span>
                  <div className="space-y-1 text-slate-700">
                    {sh.topLocations.map(([locName, count]) => (
                      <div key={locName} className="flex justify-between items-center text-[11px]">
                        <span className="truncate max-w-[200px]">{locName}</span>
                        <strong className="text-slate-900">{count}</strong>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Gestores Responsáveis */}
                <div className="pt-2 border-t border-slate-100 text-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Lideranças Atuantes no Turno:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {sh.topManagers.map(([mgrName, count]) => (
                      <span key={mgrName} className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {mgrName.split(',')[0]} ({count})
                      </span>
                    ))}
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. CONTEÚDO DA VISÃO 3: POR GESTOR IMEDIATO */}
      {/* ========================================================================= */}
      {viewMode === 'manager' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#0b1c30]">
                Efetivo e Diversidade por Gestor Imediato
              </h3>
              <p className="text-xs text-slate-500">
                Lideranças de Feira de Santana, divisão de equipes por gênero, escalas e setores
              </p>
            </div>
            <span className="text-xs font-bold text-slate-500">
              {managerGroups.length} gestores mapeados
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#eff4ff] text-[#306576] uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Gestor Imediato</th>
                  <th className="py-3 px-3 text-center">Mulheres</th>
                  <th className="py-3 px-3 text-center">Homens</th>
                  <th className="py-3 px-3 text-center">Total Liderados</th>
                  <th className="py-3 px-4">Distribuição de Turnos da Equipe</th>
                  <th className="py-3 px-4">Setores / Locais sob Gestão</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {managerGroups.map((mgr, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    {/* Gestor */}
                    <td className="py-3 px-4 font-bold text-[#0b1c30]">
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-[#306576] shrink-0" />
                        <span>{mgr.managerName}</span>
                      </div>
                    </td>

                    {/* Mulheres */}
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-flex items-center gap-1 font-bold ${
                        mgr.female > 0 ? 'text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200' : 'text-slate-400'
                      }`}>
                        {mgr.female} <span className="text-[10px] font-normal">({mgr.femalePct}%)</span>
                      </span>
                    </td>

                    {/* Homens */}
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center gap-1 font-bold text-[#0a3641] bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100">
                        {mgr.male} <span className="text-[10px] font-normal">({mgr.malePct}%)</span>
                      </span>
                    </td>

                    {/* Total */}
                    <td className="py-3 px-3 text-center font-extrabold text-[#0b1c30] text-sm">
                      {mgr.total}
                    </td>

                    {/* Turnos */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {mgr.shifts['Turno A'] > 0 && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
                            T1: {mgr.shifts['Turno A']}
                          </span>
                        )}
                        {mgr.shifts['Turno B'] > 0 && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                            T2: {mgr.shifts['Turno B']}
                          </span>
                        )}
                        {mgr.shifts['Turno C'] > 0 && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            T3: {mgr.shifts['Turno C']}
                          </span>
                        )}
                        {mgr.shifts['Administrativo'] > 0 && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            ADM: {mgr.shifts['Administrativo']}
                          </span>
                        )}
                        {mgr.shifts['Outras Jornadas'] > 0 && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
                            OUT: {mgr.shifts['Outras Jornadas']}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Locais */}
                    <td className="py-3 px-4 text-slate-600 text-[11px]">
                      <div className="truncate max-w-[220px]" title={mgr.locationsList.join(', ')}>
                        {mgr.locationsList.slice(0, 2).join(', ')}
                        {mgr.locationsList.length > 2 && ` +${mgr.locationsList.length - 2}`}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. CONTEÚDO DA VISÃO 4: MATRIZ CRUZADA (TURNO × LOCAL × GESTOR) */}
      {/* ========================================================================= */}
      {viewMode === 'crosstab' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden space-y-4">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-[#0b1c30]">
                Matriz Cruzada de Efetivo: Turno × Local / Setor × Gestor Imediato
              </h3>
              <p className="text-xs text-slate-500">
                Cruzamento completo de contingente por gênero e escala operacional
              </p>
            </div>

            {/* Alternador de Agrupamento das Linhas */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <span className="text-slate-500 px-2">Agrupar Linhas por:</span>
              <button
                onClick={() => setCrossTabGroupBy('location')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  crossTabGroupBy === 'location'
                    ? 'bg-white text-[#0a3641] font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Local / Setor
              </button>
              <button
                onClick={() => setCrossTabGroupBy('manager')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  crossTabGroupBy === 'manager'
                    ? 'bg-white text-[#0a3641] font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Gestor Imediato
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#eff4ff] text-[#306576] uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">{crossTabGroupBy === 'location' ? 'Local / Setor' : 'Gestor Imediato'}</th>
                  <th className="py-3 px-3 text-center bg-sky-50/50">Turno 1 (06-14:20)<br/><span className="text-[9px] font-normal">Tot | 👩 | 👨</span></th>
                  <th className="py-3 px-3 text-center bg-indigo-50/50">Turno 2 (14:20-22:30)<br/><span className="text-[9px] font-normal">Tot | 👩 | 👨</span></th>
                  <th className="py-3 px-3 text-center bg-amber-50/50">Turno 3 (22:30-06)<br/><span className="text-[9px] font-normal">Tot | 👩 | 👨</span></th>
                  <th className="py-3 px-3 text-center bg-emerald-50/50">Administrativo<br/><span className="text-[9px] font-normal">Tot | 👩 | 👨</span></th>
                  <th className="py-3 px-3 text-center bg-purple-50/50">Outras Jornadas<br/><span className="text-[9px] font-normal">Tot | 👩 | 👨</span></th>
                  <th className="py-3 px-4 text-center bg-[#0a3641] text-white">Total Geral<br/><span className="text-[9px] text-[#6ffbbe]">Tot (👩 / 👨)</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {crossTabRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    {/* Linha principal */}
                    <td className="py-3 px-4 font-bold text-[#0b1c30]">
                      <div>{row.name}</div>
                      <span className="text-[10px] text-slate-400 font-normal">{row.secondaryInfo}</span>
                    </td>

                    {/* Turno A */}
                    <td className="py-3 px-3 text-center bg-sky-50/20 font-mono">
                      {row.turnos['Turno A'].total > 0 ? (
                        <span className="font-bold text-slate-900">
                          {row.turnos['Turno A'].total} <span className="text-[10px] text-slate-400">({row.turnos['Turno A'].female}M/{row.turnos['Turno A'].male}H)</span>
                        </span>
                      ) : <span className="text-slate-300">—</span>}
                    </td>

                    {/* Turno B */}
                    <td className="py-3 px-3 text-center bg-indigo-50/20 font-mono">
                      {row.turnos['Turno B'].total > 0 ? (
                        <span className="font-bold text-slate-900">
                          {row.turnos['Turno B'].total} <span className="text-[10px] text-slate-400">({row.turnos['Turno B'].female}M/{row.turnos['Turno B'].male}H)</span>
                        </span>
                      ) : <span className="text-slate-300">—</span>}
                    </td>

                    {/* Turno C */}
                    <td className="py-3 px-3 text-center bg-amber-50/20 font-mono">
                      {row.turnos['Turno C'].total > 0 ? (
                        <span className="font-bold text-slate-900">
                          {row.turnos['Turno C'].total} <span className="text-[10px] text-slate-400">({row.turnos['Turno C'].female}M/{row.turnos['Turno C'].male}H)</span>
                        </span>
                      ) : <span className="text-slate-300">—</span>}
                    </td>

                    {/* ADM */}
                    <td className="py-3 px-3 text-center bg-emerald-50/20 font-mono">
                      {row.turnos['Administrativo'].total > 0 ? (
                        <span className="font-bold text-slate-900">
                          {row.turnos['Administrativo'].total} <span className="text-[10px] text-slate-400">({row.turnos['Administrativo'].female}M/{row.turnos['Administrativo'].male}H)</span>
                        </span>
                      ) : <span className="text-slate-300">—</span>}
                    </td>

                    {/* Outras */}
                    <td className="py-3 px-3 text-center bg-purple-50/20 font-mono">
                      {row.turnos['Outras Jornadas'].total > 0 ? (
                        <span className="font-bold text-slate-900">
                          {row.turnos['Outras Jornadas'].total} <span className="text-[10px] text-slate-400">({row.turnos['Outras Jornadas'].female}M/{row.turnos['Outras Jornadas'].male}H)</span>
                        </span>
                      ) : <span className="text-slate-300">—</span>}
                    </td>

                    {/* Total Geral */}
                    <td className="py-3 px-4 text-center font-extrabold bg-slate-50 text-[#0b1c30]">
                      <span className="text-sm">{row.grandTotal}</span>
                      <span className="text-[10px] block text-slate-500 font-normal">
                        👩 {row.totalFemale} | 👨 {row.totalMale}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. CONTEÚDO DA VISÃO 5: LISTA NOMINAL DE COLABORADORES */}
      {/* ========================================================================= */}
      {viewMode === 'nominal' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#0b1c30]">Lista Nominal Completa de Colaboradores</h3>
              <p className="text-xs text-slate-500">Exibindo {filteredEmployees.length} registros com sexo, setor, turno e liderança</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#eff4ff] text-[#306576] uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="p-3">PRN</th>
                  <th className="p-3">Colaborador</th>
                  <th className="p-3 text-center">Sexo</th>
                  <th className="p-3">Vínculo</th>
                  <th className="p-3">Cargo</th>
                  <th className="p-3">Local / Setor</th>
                  <th className="p-3">Turno / Jornada</th>
                  <th className="p-3">Gestor Imediato</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredEmployees.map(emp => {
                  const isFemale = (emp.gender || '').toLowerCase().startsWith('f');
                  return (
                    <tr key={emp.prn} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-mono font-bold text-slate-900">{emp.prn}</td>
                      <td className="p-3 font-medium text-slate-900">{emp.name}</td>
                      
                      {/* Sexo Badge */}
                      <td className="p-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isFemale 
                            ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                            : 'bg-sky-50 text-sky-800 border border-sky-100'
                        }`}>
                          {isFemale ? '👩 Fem' : '👨 Masc'}
                        </span>
                      </td>

                      {/* Vínculo */}
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
                      <td className="p-3 text-slate-600">{emp.locationName}</td>
                      
                      {/* Turno */}
                      <td className="p-3">
                        <span className="font-semibold text-slate-800 block">{emp.shiftCategory}</span>
                        <span className="text-[10px] text-slate-400 block truncate max-w-[140px]">{emp.shiftName}</span>
                      </td>

                      <td className="p-3 text-slate-600">{emp.immediateManager}</td>
                      
                      {/* Status */}
                      <td className="p-3 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {emp.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
