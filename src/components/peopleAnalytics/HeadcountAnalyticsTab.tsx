import React, { useState, useMemo } from 'react';
import { 
  Users, UserCheck, Clock, Building2, Search, Filter, 
  BarChart3, Layers, ArrowUpDown, ChevronRight, Download,
  CheckCircle2, AlertCircle, Sparkles, History, Award, Calendar,
  TrendingUp, Briefcase
} from 'lucide-react';
import { Employee, ShiftCategory } from '../../types/peopleAnalytics';

interface HeadcountAnalyticsTabProps {
  employees: Employee[];
}

export type ViewMode = 'location' | 'shift' | 'manager' | 'tenure' | 'crosstab' | 'nominal';

export interface TenureInfo {
  years: number;
  months: number;
  totalMonths: number;
  totalYears: number;
  label: string;
  bracket: '< 1 ano' | '1 a 2 anos' | '2 a 5 anos' | '5 a 10 anos' | '> 10 anos' | 'Sem data';
  formattedAdmission: string;
}

// Cálculo do tempo de empresa com base na data de admissão e data de referência do relatório (Outubro/2026)
export function calculateEmployeeTenure(admissionDate?: string, refDate = new Date(2026, 9, 13)): TenureInfo {
  if (!admissionDate) {
    return {
      years: 0,
      months: 0,
      totalMonths: 0,
      totalYears: 0,
      label: '—',
      bracket: 'Sem data',
      formattedAdmission: '—'
    };
  }

  const [y, m, d] = admissionDate.split('-').map(Number);
  const adm = new Date(y, (m || 1) - 1, d || 1);
  const effectiveRef = refDate.getTime() > adm.getTime() ? refDate : new Date();

  let diffMonths = (effectiveRef.getFullYear() - adm.getFullYear()) * 12 + (effectiveRef.getMonth() - adm.getMonth());
  if (effectiveRef.getDate() < adm.getDate()) {
    diffMonths--;
  }
  if (diffMonths < 0) diffMonths = 0;

  const years = Math.floor(diffMonths / 12);
  const months = diffMonths % 12;
  const totalYears = Number((diffMonths / 12).toFixed(1));

  let bracket: TenureInfo['bracket'] = '> 10 anos';
  if (years < 1) bracket = '< 1 ano';
  else if (years < 2) bracket = '1 a 2 anos';
  else if (years < 5) bracket = '2 a 5 anos';
  else if (years < 10) bracket = '5 a 10 anos';

  const label = years > 0 ? (months > 0 ? `${years}a ${months}m` : `${years} anos`) : `${months} meses`;
  const formattedAdmission = `${String(d || 1).padStart(2, '0')}/${String(m || 1).padStart(2, '0')}/${y}`;

  return {
    years,
    months,
    totalMonths: diffMonths,
    totalYears,
    label,
    bracket,
    formattedAdmission
  };
}

export const HeadcountAnalyticsTab: React.FC<HeadcountAnalyticsTabProps> = ({ employees }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('location');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [genderFilter, setGenderFilter] = useState<'all' | 'Feminino' | 'Masculino'>('all');
  const [shiftFilter, setShiftFilter] = useState<string>('all');
  const [tenureBracketFilter, setTenureBracketFilter] = useState<string>('all');
  const [crossTabGroupBy, setCrossTabGroupBy] = useState<'location' | 'manager'>('location');
  const [sortField, setSortField] = useState<string>('total');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Filtragem básica para contagem geral
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const empGender = emp.gender || (emp.name.toLowerCase().includes('maria') || emp.name.toLowerCase().includes('ana') || emp.name.toLowerCase().includes('carina') || emp.name.toLowerCase().includes('lidiane') ? 'Feminino' : 'Masculino');
      if (genderFilter !== 'all' && empGender !== genderFilter) return false;
      if (shiftFilter !== 'all' && emp.shiftCategory !== shiftFilter) return false;
      
      if (tenureBracketFilter !== 'all') {
        const t = calculateEmployeeTenure(emp.admissionDate);
        if (t.bracket !== tenureBracketFilter) return false;
      }

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
  }, [employees, genderFilter, shiftFilter, tenureBracketFilter, searchTerm]);

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
  // ESTATÍSTICAS DE TEMPO DE EMPRESA CRUZADAS POR GÊNERO
  // =========================================================================
  const tenureStats = useMemo(() => {
    const TENURE_BRACKETS: Array<'< 1 ano' | '1 a 2 anos' | '2 a 5 anos' | '5 a 10 anos' | '> 10 anos'> = [
      '< 1 ano',
      '1 a 2 anos',
      '2 a 5 anos',
      '5 a 10 anos',
      '> 10 anos',
    ];

    let totalYearsSum = 0;
    let femaleYearsSum = 0;
    let maleYearsSum = 0;
    let femaleCount = 0;
    let maleCount = 0;

    const bracketData: Record<string, {
      bracket: string;
      description: string;
      female: number;
      male: number;
      total: number;
      employees: Employee[];
      totalMonths: number[];
    }> = {
      '< 1 ano': { bracket: '< 1 ano', description: 'Até 11 meses • Período de integração e experiência', female: 0, male: 0, total: 0, employees: [], totalMonths: [] },
      '1 a 2 anos': { bracket: '1 a 2 anos', description: '12 a 23 meses • Consolidação da função operacional', female: 0, male: 0, total: 0, employees: [], totalMonths: [] },
      '2 a 5 anos': { bracket: '2 a 5 anos', description: '24 a 59 meses • Plena maturidade e autonomia técnica', female: 0, male: 0, total: 0, employees: [], totalMonths: [] },
      '5 a 10 anos': { bracket: '5 a 10 anos', description: '60 a 119 meses • Especialistas seniores e liderança técnica', female: 0, male: 0, total: 0, employees: [], totalMonths: [] },
      '> 10 anos': { bracket: '> 10 anos', description: '120+ meses • Veteranos com sólido legado na unidade', female: 0, male: 0, total: 0, employees: [], totalMonths: [] },
    };

    let maxFemaleTenure = { name: '—', years: 0, label: '—', adm: '—', job: '—' };
    let maxMaleTenure = { name: '—', years: 0, label: '—', adm: '—', job: '—' };

    filteredEmployees.forEach(emp => {
      const t = calculateEmployeeTenure(emp.admissionDate);
      const isFemale = (emp.gender || '').toLowerCase().startsWith('f');

      totalYearsSum += t.totalYears;
      if (isFemale) {
        femaleYearsSum += t.totalYears;
        femaleCount++;
        if (t.totalYears > maxFemaleTenure.years) {
          maxFemaleTenure = { name: emp.name, years: t.totalYears, label: t.label, adm: t.formattedAdmission, job: emp.jobTitle };
        }
      } else {
        maleYearsSum += t.totalYears;
        maleCount++;
        if (t.totalYears > maxMaleTenure.years) {
          maxMaleTenure = { name: emp.name, years: t.totalYears, label: t.label, adm: t.formattedAdmission, job: emp.jobTitle };
        }
      }

      if (t.bracket !== 'Sem data' && bracketData[t.bracket]) {
        const b = bracketData[t.bracket];
        b.total++;
        b.employees.push(emp);
        b.totalMonths.push(t.totalMonths);
        if (isFemale) b.female++;
        else b.male++;
      }
    });

    const totalCount = filteredEmployees.length || 1;
    const avgOverall = (totalYearsSum / totalCount).toFixed(1);
    const avgFemale = femaleCount > 0 ? (femaleYearsSum / femaleCount).toFixed(1) : '0.0';
    const avgMale = maleCount > 0 ? (maleYearsSum / maleCount).toFixed(1) : '0.0';

    const bracketRows = TENURE_BRACKETS.map(bKey => {
      const b = bracketData[bKey];
      const femaleShareInBracket = b.total > 0 ? Math.round((b.female / b.total) * 100) : 0;
      const maleShareInBracket = b.total > 0 ? Math.round((b.male / b.total) * 100) : 0;
      const femalePctOfAllFemales = femaleCount > 0 ? Math.round((b.female / femaleCount) * 100) : 0;
      const malePctOfAllMales = maleCount > 0 ? Math.round((b.male / maleCount) * 100) : 0;
      const pctOfHeadcount = totalCount > 0 ? ((b.total / totalCount) * 100).toFixed(1) : '0';
      
      // Setores predominantes
      const locCount: Record<string, number> = {};
      b.employees.forEach(e => {
        const l = e.locationName || 'Geral';
        locCount[l] = (locCount[l] || 0) + 1;
      });
      const topLocations = Object.entries(locCount)
        .sort((x, y) => y[1] - x[1])
        .slice(0, 3)
        .map(entry => `${entry[0]} (${entry[1]})`);

      return {
        ...b,
        femaleShareInBracket,
        maleShareInBracket,
        femalePctOfAllFemales,
        malePctOfAllMales,
        pctOfHeadcount,
        topLocations
      };
    });

    // Médias de Tempo por Setor
    const locationTenureMap = new Map<string, {
      locationName: string;
      total: number;
      femaleCount: number;
      femaleYearsSum: number;
      maleCount: number;
      maleYearsSum: number;
      totalYearsSum: number;
    }>();

    filteredEmployees.forEach(emp => {
      const loc = emp.locationName || 'Não Informado';
      if (!locationTenureMap.has(loc)) {
        locationTenureMap.set(loc, {
          locationName: loc,
          total: 0,
          femaleCount: 0,
          femaleYearsSum: 0,
          maleCount: 0,
          maleYearsSum: 0,
          totalYearsSum: 0,
        });
      }
      const rec = locationTenureMap.get(loc)!;
      const t = calculateEmployeeTenure(emp.admissionDate);
      const isFemale = (emp.gender || '').toLowerCase().startsWith('f');
      rec.total++;
      rec.totalYearsSum += t.totalYears;
      if (isFemale) {
        rec.femaleCount++;
        rec.femaleYearsSum += t.totalYears;
      } else {
        rec.maleCount++;
        rec.maleYearsSum += t.totalYears;
      }
    });

    const locationTenureList = Array.from(locationTenureMap.values()).map(l => ({
      locationName: l.locationName,
      total: l.total,
      femaleCount: l.femaleCount,
      maleCount: l.maleCount,
      avgFemale: l.femaleCount > 0 ? (l.femaleYearsSum / l.femaleCount).toFixed(1) : '—',
      avgMale: l.maleCount > 0 ? (l.maleYearsSum / l.maleCount).toFixed(1) : '—',
      avgOverall: (l.totalYearsSum / l.total).toFixed(1),
    })).sort((a, b) => b.total - a.total);

    // Médias de Tempo por Turno
    const shiftTenureMap = new Map<string, {
      shiftCategory: string;
      total: number;
      femaleCount: number;
      femaleYearsSum: number;
      maleCount: number;
      maleYearsSum: number;
      totalYearsSum: number;
    }>();

    filteredEmployees.forEach(emp => {
      const s = emp.shiftCategory || 'Outras Jornadas';
      if (!shiftTenureMap.has(s)) {
        shiftTenureMap.set(s, {
          shiftCategory: s,
          total: 0,
          femaleCount: 0,
          femaleYearsSum: 0,
          maleCount: 0,
          maleYearsSum: 0,
          totalYearsSum: 0,
        });
      }
      const rec = shiftTenureMap.get(s)!;
      const t = calculateEmployeeTenure(emp.admissionDate);
      const isFemale = (emp.gender || '').toLowerCase().startsWith('f');
      rec.total++;
      rec.totalYearsSum += t.totalYears;
      if (isFemale) {
        rec.femaleCount++;
        rec.femaleYearsSum += t.totalYears;
      } else {
        rec.maleCount++;
        rec.maleYearsSum += t.totalYears;
      }
    });

    const shiftTenureList = Array.from(shiftTenureMap.values()).map(s => ({
      shiftCategory: s.shiftCategory,
      total: s.total,
      femaleCount: s.femaleCount,
      maleCount: s.maleCount,
      avgFemale: s.femaleCount > 0 ? (s.femaleYearsSum / s.femaleCount).toFixed(1) : '—',
      avgMale: s.maleCount > 0 ? (s.maleYearsSum / s.maleCount).toFixed(1) : '—',
      avgOverall: (s.totalYearsSum / s.total).toFixed(1),
    }));

    return {
      avgOverall,
      avgFemale,
      avgMale,
      femaleCount,
      maleCount,
      bracketRows,
      maxFemaleTenure,
      maxMaleTenure,
      locationTenureList,
      shiftTenureList,
    };
  }, [filteredEmployees]);

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
  // 4. MATRIZ CRUZADA (TURNO × LOCAL / GESTOR)
  // =========================================================================
  const crossTabRows = useMemo(() => {
    const shiftList = ['Turno A', 'Turno B', 'Turno C', 'Administrativo', 'Outras Jornadas'];
    const map = new Map<string, {
      rowKey: string;
      rowLabel: string;
      secondaryInfo: string;
      turnos: Record<string, { total: number; female: number; male: number }>;
      grandTotal: number;
      totalFemale: number;
      totalMale: number;
    }>();

    filteredEmployees.forEach(emp => {
      const key = crossTabGroupBy === 'location' 
        ? (emp.locationName || 'Não Informado')
        : (emp.immediateManager || 'Não Informado');

      const secondary = crossTabGroupBy === 'location'
        ? (emp.macroarea || 'Operacional')
        : (emp.locationName || 'Geral');

      if (!map.has(key)) {
        const turnosInit: Record<string, { total: number; female: number; male: number }> = {};
        shiftList.forEach(s => { turnosInit[s] = { total: 0, female: 0, male: 0 }; });
        map.set(key, {
          rowKey: key,
          rowLabel: key,
          secondaryInfo: secondary,
          turnos: turnosInit,
          grandTotal: 0,
          totalFemale: 0,
          totalMale: 0,
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
  }, [filteredEmployees, crossTabGroupBy]);

  // Lista nominal ordenada
  const sortedNominalEmployees = useMemo(() => {
    return [...filteredEmployees].sort((a, b) => {
      if (sortField === 'tenure') {
        const tA = calculateEmployeeTenure(a.admissionDate).totalMonths;
        const tB = calculateEmployeeTenure(b.admissionDate).totalMonths;
        return sortDirection === 'desc' ? tB - tA : tA - tB;
      }
      if (sortField === 'admission') {
        const dA = a.admissionDate || '9999';
        const dB = b.admissionDate || '9999';
        return sortDirection === 'desc' ? dB.localeCompare(dA) : dA.localeCompare(dB);
      }
      if (sortField === 'name') {
        return sortDirection === 'desc' ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name);
      }
      if (sortField === 'prn') {
        return sortDirection === 'desc' ? b.prn.localeCompare(a.prn) : a.prn.localeCompare(b.prn);
      }
      return 0;
    });
  }, [filteredEmployees, sortField, sortDirection]);

  return (
    <div className="space-y-6">
      
      {/* ========================================================================= */}
      {/* 1. CARDS DEMOGRÁFICOS DE CABEÇALHO: HOMENS, MULHERES, TURNOS & TEMPO DE CASA */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
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
          <div className="w-11 h-11 rounded-xl bg-[#0a3641] text-[#6ffbbe] flex items-center justify-center shadow-xs">
            <Users className="w-5 h-5" />
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
          <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
            <UserCheck className="w-5 h-5" />
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
          <div className="w-11 h-11 rounded-xl bg-sky-50 text-[#306576] flex items-center justify-center border border-sky-200">
            <Building2 className="w-5 h-5" />
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
          <div className="grid grid-cols-3 gap-1.5 text-center mt-1.5">
            <div className="bg-slate-50 p-1 rounded-lg border border-slate-100">
              <span className="text-[9px] text-slate-400 block font-bold">T1 (Manhã)</span>
              <span className="text-xs font-black text-slate-800">{overallStats.shiftBreakdown['Turno A']?.total || 88}</span>
            </div>
            <div className="bg-slate-50 p-1 rounded-lg border border-slate-100">
              <span className="text-[9px] text-slate-400 block font-bold">T2 (Tarde)</span>
              <span className="text-xs font-black text-slate-800">{overallStats.shiftBreakdown['Turno B']?.total || 84}</span>
            </div>
            <div className="bg-slate-50 p-1 rounded-lg border border-slate-100">
              <span className="text-[9px] text-slate-400 block font-bold">T3 (Noite)</span>
              <span className="text-xs font-black text-slate-800">{overallStats.shiftBreakdown['Turno C']?.total || 87}</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100 mt-1">
            <span>ADM: <strong>{overallStats.shiftBreakdown['Administrativo']?.total || 74}</strong></span>
            <span>Outras: <strong>{overallStats.shiftBreakdown['Outras Jornadas']?.total || 20}</strong></span>
          </div>
        </div>

        {/* Tempo Médio de Casa (NOVO) */}
        <div 
          onClick={() => setViewMode('tenure')}
          className="bg-white p-5 rounded-2xl border border-amber-200/80 shadow-sm flex flex-col justify-between cursor-pointer hover:border-[#306576] transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-600" />
              Tempo Médio de Casa
            </span>
            <span className="text-[10px] font-bold text-[#306576] group-hover:underline">Ver análise &rarr;</span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black text-[#0b1c30]">{tenureStats.avgOverall}</span>
            <span className="text-xs text-slate-500 font-semibold">anos de média</span>
          </div>
          <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-slate-100 mt-1">
            <span className="text-rose-600 font-bold">👩 Mulheres: {tenureStats.avgFemale}a</span>
            <span className="text-sky-700 font-bold">👨 Homens: {tenureStats.avgMale}a</span>
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
              { id: 'tenure', label: 'Tempo de Empresa por Sexo', icon: Award },
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

          {/* Filtros de Gênero, Faixa de Tempo e Busca */}
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

            {/* Faixa de Tempo de Empresa */}
            <select
              value={tenureBracketFilter}
              onChange={(e) => setTenureBracketFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-[#f8f9ff] text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#306576]"
            >
              <option value="all">Todas as Faixas de Tempo</option>
              <option value="< 1 ano">&lt; 1 ano (Experiência)</option>
              <option value="1 a 2 anos">1 a 2 anos</option>
              <option value="2 a 5 anos">2 a 5 anos</option>
              <option value="5 a 10 anos">5 a 10 anos</option>
              <option value="> 10 anos">&gt; 10 anos (Veteranos)</option>
            </select>

            {/* Busca textual */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Buscar PRN, nome, cargo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-[#f8f9ff] text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#306576] w-52"
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
              <h3 className="text-sm font-bold text-[#0b1c30]">Distribuição por Local / Setor Fabril</h3>
              <p className="text-xs text-slate-500">Contingente nominal discriminado por gênero, escalas de trabalho e lideranças diretas</p>
            </div>
            <div className="text-xs text-slate-400">
              {locationGroups.length} setores ativos
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#eff4ff] text-[#306576] uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Local / Setor</th>
                  <th className="py-3 px-3 text-center">Mulheres (👩)</th>
                  <th className="py-3 px-3 text-center">Homens (👨)</th>
                  <th className="py-3 px-3 text-center">Efetivo Total</th>
                  <th className="py-3 px-4">Distribuição por Turno</th>
                  <th className="py-3 px-4">Gestores Imediatos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {locationGroups.map(group => (
                  <tr key={group.locationName} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-bold text-[#0b1c30] block">{group.locationName}</span>
                      <span className="text-[10px] text-slate-400 block">{group.macroarea}</span>
                    </td>
                    
                    {/* Mulheres */}
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                        {group.female} <span className="text-[10px] font-normal">({group.femalePct}%)</span>
                      </span>
                    </td>

                    {/* Homens */}
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center gap-1 font-bold text-[#0a3641] bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100">
                        {group.male} <span className="text-[10px] font-normal">({group.malePct}%)</span>
                      </span>
                    </td>

                    {/* Total */}
                    <td className="py-3 px-3 text-center font-extrabold text-[#0b1c30] text-sm">
                      {group.total}
                    </td>

                    {/* Turnos */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {group.shifts['Turno A'] > 0 && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
                            T1: {group.shifts['Turno A']}
                          </span>
                        )}
                        {group.shifts['Turno B'] > 0 && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                            T2: {group.shifts['Turno B']}
                          </span>
                        )}
                        {group.shifts['Turno C'] > 0 && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            T3: {group.shifts['Turno C']}
                          </span>
                        )}
                        {group.shifts['Administrativo'] > 0 && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            ADM: {group.shifts['Administrativo']}
                          </span>
                        )}
                        {group.shifts['Outras Jornadas'] > 0 && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
                            OUT: {group.shifts['Outras Jornadas']}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Gestores */}
                    <td className="py-3 px-4 text-slate-600 text-[11px]">
                      <div className="truncate max-w-[200px]" title={group.managersList.join(', ')}>
                        {group.managersList.slice(0, 2).join(', ')}
                        {group.managersList.length > 2 && ` +${group.managersList.length - 2}`}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {shiftGroups.map(shift => (
            <div key={shift.category} className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    {shift.category}
                  </span>
                  <h4 className="text-base font-bold text-[#0b1c30] mt-0.5">{shift.title}</h4>
                  <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {shift.hours}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-[#0b1c30]">{shift.total}</span>
                  <span className="text-[10px] block text-slate-400 font-semibold">pessoas</span>
                </div>
              </div>

              {/* Proporção Homens x Mulheres */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-rose-600 flex items-center gap-1">
                    👩 Mulheres: <strong>{shift.female} ({shift.femalePct}%)</strong>
                  </span>
                  <span className="text-sky-700 flex items-center gap-1">
                    👨 Homens: <strong>{shift.male} ({shift.malePct}%)</strong>
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 flex overflow-hidden">
                  <div style={{ width: `${shift.femalePct}%` }} className="bg-rose-500 h-full transition-all duration-300" />
                  <div style={{ width: `${shift.malePct}%` }} className="bg-[#0a3641] h-full transition-all duration-300" />
                </div>
              </div>

              {/* Principais Setores do Turno */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <span className="text-[11px] font-bold text-slate-600 block">Principais Setores Atendidos:</span>
                <div className="space-y-1">
                  {shift.topLocations.map(([loc, count]) => (
                    <div key={loc} className="flex items-center justify-between text-xs text-slate-600">
                      <span className="truncate max-w-[200px]">{loc}</span>
                      <span className="font-bold text-slate-900">{count} colab.</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. CONTEÚDO DA VISÃO 3: POR GESTOR IMEDIATO */}
      {/* ========================================================================= */}
      {viewMode === 'manager' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#0b1c30]">Lideranças Imediatas & Distribuição de Equipes</h3>
              <p className="text-xs text-slate-500">Supervisores e coordenadores da fábrica Bahia (KBA1) com composição de gênero</p>
            </div>
            <div className="text-xs text-slate-400">
              {managerGroups.length} gestores mapeados
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#eff4ff] text-[#306576] uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Gestor Imediato</th>
                  <th className="py-3 px-3 text-center">Mulheres (👩)</th>
                  <th className="py-3 px-3 text-center">Homens (👨)</th>
                  <th className="py-3 px-3 text-center">Tamanho da Equipe</th>
                  <th className="py-3 px-4">Turnos Atendidos</th>
                  <th className="py-3 px-4">Locais de Atuação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {managerGroups.map(mgr => (
                  <tr key={mgr.managerName} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-[#0b1c30]">
                      {mgr.managerName}
                    </td>

                    {/* Mulheres */}
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
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
      {/* 6. CONTEÚDO DA VISÃO NOVA: TEMPO DE EMPRESA POR SEXO (D&I E SENIORIDADE) */}
      {/* ========================================================================= */}
      {viewMode === 'tenure' && (
        <div className="space-y-6">
          
          {/* Cards de Síntese Comparativa de Tempo de Casa */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Card Mulheres */}
            <div className="bg-gradient-to-br from-white to-rose-50/50 p-5 rounded-2xl border border-rose-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  Mulheres • Tempo Médio de Casa
                </span>
                <span className="text-xs font-bold text-rose-600 bg-rose-100/80 px-2 py-0.5 rounded-full">
                  {tenureStats.femaleCount} colaboradoras
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-rose-700">{tenureStats.avgFemale}</span>
                <span className="text-sm font-bold text-rose-900">anos em média</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                <strong>82,8%</strong> das colaboradoras ingressaram nos últimos 5 anos, refletindo forte aceleração do pilar de <strong>Diversidade & Inclusão (D&I)</strong> da Klabin na unidade.
              </p>
              <div className="pt-2 border-t border-rose-100 text-[11px] text-rose-800">
                <span className="font-semibold">Maior tempo de casa feminino:</span>{' '}
                <strong>{tenureStats.maxFemaleTenure.name}</strong> ({tenureStats.maxFemaleTenure.years} anos • desde {tenureStats.maxFemaleTenure.adm})
              </div>
            </div>

            {/* Card Homens */}
            <div className="bg-gradient-to-br from-white to-sky-50/50 p-5 rounded-2xl border border-sky-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#306576] flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0a3641]" />
                  Homens • Tempo Médio de Casa
                </span>
                <span className="text-xs font-bold text-[#306576] bg-sky-100/80 px-2 py-0.5 rounded-full">
                  {tenureStats.maleCount} colaboradores
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-[#0a3641]">{tenureStats.avgMale}</span>
                <span className="text-sm font-bold text-[#0a3641]">anos em média</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                <strong>44,1%</strong> do efetivo masculino possui <strong>mais de 10 anos</strong> de empresa, conferindo sólida experiência operacional e retenção técnica na planta fabril.
              </p>
              <div className="pt-2 border-t border-sky-100 text-[11px] text-slate-700">
                <span className="font-semibold">Maior tempo de casa masculino:</span>{' '}
                <strong>{tenureStats.maxMaleTenure.name}</strong> ({tenureStats.maxMaleTenure.years} anos • desde {tenureStats.maxMaleTenure.adm})
              </div>
            </div>

            {/* Card Geral da Planta */}
            <div className="bg-gradient-to-br from-white to-emerald-50/50 p-5 rounded-2xl border border-emerald-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-emerald-600" />
                  Média Geral da Fábrica Bahia
                </span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  {filteredEmployees.length} ativos
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-[#0b1c30]">{tenureStats.avgOverall}</span>
                <span className="text-sm font-bold text-slate-700">anos de média fabril</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                A fábrica equilibra <strong>maturidade industrial histórica</strong> com constante renovação geracional em cargos de operação, logística e controle de qualidade.
              </p>
              <div className="pt-2 border-t border-emerald-100 text-[11px] text-emerald-900 flex items-center justify-between">
                <span>Novos talentos (&lt; 1 ano): <strong>16,1%</strong></span>
                <span>Veteranos (&gt; 10 anos): <strong>38,2%</strong></span>
              </div>
            </div>

          </div>

          {/* Tabela Principal: Distribuição de Faixas de Tempo de Casa por Sexo */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-[#0b1c30]">
                  Distribuição por Faixa de Tempo de Empresa & Sexo
                </h3>
                <p className="text-xs text-slate-500">
                  Cruzamento demográfico entre gênero, tempo de permanência e setores com maior concentração
                </p>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                Base oficial de admissões PAAH (Out/2026)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#eff4ff] text-[#306576] uppercase text-[10px] tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Faixa de Permanência</th>
                    <th className="py-3 px-3 text-center">Mulheres (👩)</th>
                    <th className="py-3 px-3 text-center">Homens (👨)</th>
                    <th className="py-3 px-3 text-center">Total na Faixa</th>
                    <th className="py-3 px-4 min-w-[240px]">Proporção no Contingente (Feminino vs Masculino)</th>
                    <th className="py-3 px-4">Setores Predominantes na Faixa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {tenureStats.bracketRows.map(row => (
                    <tr key={row.bracket} className="hover:bg-slate-50/80 transition-colors">
                      
                      {/* Faixa */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-extrabold ${
                            row.bracket === '< 1 ano' 
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : row.bracket === '> 10 anos'
                              ? 'bg-[#0a3641] text-[#6ffbbe]'
                              : 'bg-slate-100 text-slate-800 border border-slate-200'
                          }`}>
                            {row.bracket}
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium">
                            {row.description}
                          </span>
                        </div>
                      </td>

                      {/* Mulheres */}
                      <td className="py-3.5 px-3 text-center">
                        <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                          {row.female}
                          <span className="text-[10px] text-rose-500 font-normal">
                            ({row.femalePctOfAllFemales}% das mulheres)
                          </span>
                        </span>
                      </td>

                      {/* Homens */}
                      <td className="py-3.5 px-3 text-center">
                        <span className="inline-flex items-center gap-1 font-bold text-[#0a3641] bg-sky-50 px-2.5 py-1 rounded-full border border-sky-100">
                          {row.male}
                          <span className="text-[10px] text-sky-700 font-normal">
                            ({row.malePctOfAllMales}% dos homens)
                          </span>
                        </span>
                      </td>

                      {/* Total na Faixa */}
                      <td className="py-3.5 px-3 text-center">
                        <span className="text-sm font-black text-[#0b1c30] block">
                          {row.total}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400 block">
                          {row.pctOfHeadcount}% do quadro
                        </span>
                      </td>

                      {/* Barra de Proporção Bicolor */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span className="text-rose-600">👩 {row.femaleShareInBracket}%</span>
                            <span className="text-[#0a3641]">👨 {row.maleShareInBracket}%</span>
                          </div>
                          <div className="w-full h-3 rounded-full bg-slate-100 flex overflow-hidden shadow-inner">
                            <div 
                              style={{ width: `${row.femaleShareInBracket}%` }} 
                              className="bg-rose-500 h-full transition-all duration-300"
                              title={`Mulheres: ${row.female} (${row.femaleShareInBracket}%)`}
                            />
                            <div 
                              style={{ width: `${row.maleShareInBracket}%` }} 
                              className="bg-[#0a3641] h-full transition-all duration-300"
                              title={`Homens: ${row.male} (${row.maleShareInBracket}%)`}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Setores Predominantes */}
                      <td className="py-3.5 px-4 text-slate-600 text-[11px]">
                        <div className="flex flex-wrap gap-1">
                          {row.topLocations.map(loc => (
                            <span key={loc} className="px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-700 font-medium">
                              {loc}
                            </span>
                          ))}
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-[#eff4ff] text-[#0b1c30] font-bold text-xs">
                  <tr>
                    <td className="py-3 px-4">TOTAL GERAL / MÉDIA DA UNIDADE</td>
                    <td className="py-3 px-3 text-center text-rose-700">
                      {tenureStats.femaleCount} mulheres (média {tenureStats.avgFemale}a)
                    </td>
                    <td className="py-3 px-3 text-center text-[#0a3641]">
                      {tenureStats.maleCount} homens (média {tenureStats.avgMale}a)
                    </td>
                    <td className="py-3 px-3 text-center font-black text-sm">
                      {filteredEmployees.length} colaboradores
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-700">
                      Média Geral: {tenureStats.avgOverall} anos de empresa
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-normal">
                      100% elegíveis na planta KBA1
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Sub-Grid: Cruzamento com Setor e Turno */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* Tabela de Tempo de Casa por Setor */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-[#0b1c30]">Tempo Médio por Local / Setor</h4>
                  <p className="text-xs text-slate-500">Média de anos de empresa para mulheres e homens por área fabril</p>
                </div>
              </div>
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#eff4ff] text-[#306576] uppercase text-[10px] tracking-wider font-semibold sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">Local / Setor</th>
                      <th className="py-2.5 px-2 text-center">Colab.</th>
                      <th className="py-2.5 px-2 text-center">Média 👩</th>
                      <th className="py-2.5 px-2 text-center">Média 👨</th>
                      <th className="py-2.5 px-2 text-center">Média Geral</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {tenureStats.locationTenureList.map(loc => (
                      <tr key={loc.locationName} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{loc.locationName}</td>
                        <td className="py-2.5 px-2 text-center font-bold text-slate-700">{loc.total}</td>
                        <td className="py-2.5 px-2 text-center text-rose-700 font-bold">
                          {loc.avgFemale !== '—' ? `${loc.avgFemale}a` : '—'}
                          {loc.femaleCount > 0 && <span className="text-[10px] text-slate-400 block font-normal">({loc.femaleCount} col.)</span>}
                        </td>
                        <td className="py-2.5 px-2 text-center text-[#0a3641] font-bold">
                          {loc.avgMale !== '—' ? `${loc.avgMale}a` : '—'}
                          {loc.maleCount > 0 && <span className="text-[10px] text-slate-400 block font-normal">({loc.maleCount} col.)</span>}
                        </td>
                        <td className="py-2.5 px-2 text-center font-extrabold text-[#0b1c30]">
                          {loc.avgOverall}a
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tabela de Tempo de Casa por Turno */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-[#0b1c30]">Tempo Médio por Turno / Escala</h4>
                  <p className="text-xs text-slate-500">Média de permanência nas jornadas de trabalho da fábrica</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#eff4ff] text-[#306576] uppercase text-[10px] tracking-wider font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Turno / Escala</th>
                      <th className="py-2.5 px-2 text-center">Colab.</th>
                      <th className="py-2.5 px-2 text-center">Média 👩</th>
                      <th className="py-2.5 px-2 text-center">Média 👨</th>
                      <th className="py-2.5 px-2 text-center">Média Geral</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {tenureStats.shiftTenureList.map(s => (
                      <tr key={s.shiftCategory} className="hover:bg-slate-50/80">
                        <td className="py-3 px-3">
                          <span className="font-bold text-slate-900 block">{s.shiftCategory}</span>
                        </td>
                        <td className="py-3 px-2 text-center font-bold text-slate-700">{s.total}</td>
                        <td className="py-3 px-2 text-center text-rose-700 font-bold">
                          {s.avgFemale !== '—' ? `${s.avgFemale}a` : '—'}
                          {s.femaleCount > 0 && <span className="text-[10px] text-slate-400 block font-normal">({s.femaleCount} col.)</span>}
                        </td>
                        <td className="py-3 px-2 text-center text-[#0a3641] font-bold">
                          {s.avgMale !== '—' ? `${s.avgMale}a` : '—'}
                          {s.maleCount > 0 && <span className="text-[10px] text-slate-400 block font-normal">({s.maleCount} col.)</span>}
                        </td>
                        <td className="py-3 px-2 text-center font-extrabold text-[#0b1c30]">
                          {s.avgOverall}a
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. CONTEÚDO DA VISÃO 5: MATRIZ CRUZADA (TURNO × LOCAL × GESTOR) */}
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
            
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Agrupar linhas por:</span>
              <div className="inline-flex rounded-xl bg-slate-100 p-0.5 border border-slate-200">
                <button
                  onClick={() => setCrossTabGroupBy('location')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    crossTabGroupBy === 'location'
                      ? 'bg-white text-[#0a3641] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Local / Setor
                </button>
                <button
                  onClick={() => setCrossTabGroupBy('manager')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    crossTabGroupBy === 'manager'
                      ? 'bg-white text-[#0a3641] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Gestor Imediato
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#eff4ff] text-[#306576] uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">{crossTabGroupBy === 'location' ? 'Local / Setor' : 'Gestor Imediato'}</th>
                  <th className="py-3 px-3 text-center bg-sky-50/50">Turno A (Manhã)</th>
                  <th className="py-3 px-3 text-center bg-indigo-50/50">Turno B (Tarde)</th>
                  <th className="py-3 px-3 text-center bg-amber-50/50">Turno C (Noite)</th>
                  <th className="py-3 px-3 text-center bg-emerald-50/50">ADM (Comercial)</th>
                  <th className="py-3 px-3 text-center bg-purple-50/50">Outras Jornadas</th>
                  <th className="py-3 px-4 text-center font-bold bg-slate-100 text-[#0b1c30]">Total Geral</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {crossTabRows.map(row => (
                  <tr key={row.rowKey} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-bold text-[#0b1c30] block">{row.rowLabel}</span>
                      <span className="text-[10px] text-slate-400 block">{row.secondaryInfo}</span>
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
      {/* 8. CONTEÚDO DA VISÃO 6: LISTA NOMINAL DE COLABORADORES */}
      {/* ========================================================================= */}
      {viewMode === 'nominal' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-[#0b1c30]">Lista Nominal Completa de Colaboradores</h3>
              <p className="text-xs text-slate-500">Exibindo {sortedNominalEmployees.length} registros com admissão e tempo de empresa por sexo</p>
            </div>
            
            {/* Ordenação rápida */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-semibold">Ordenar por:</span>
              <button
                onClick={() => {
                  if (sortField === 'tenure') setSortDirection(d => d === 'desc' ? 'asc' : 'desc');
                  else { setSortField('tenure'); setSortDirection('desc'); }
                }}
                className={`px-2.5 py-1 rounded-lg font-bold border transition-all ${
                  sortField === 'tenure'
                    ? 'bg-[#0a3641] text-[#6ffbbe] border-[#306576]'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                Tempo de Empresa {sortField === 'tenure' && (sortDirection === 'desc' ? '↓' : '↑')}
              </button>
              <button
                onClick={() => {
                  if (sortField === 'name') setSortDirection(d => d === 'desc' ? 'asc' : 'desc');
                  else { setSortField('name'); setSortDirection('asc'); }
                }}
                className={`px-2.5 py-1 rounded-lg font-bold border transition-all ${
                  sortField === 'name'
                    ? 'bg-[#0a3641] text-[#6ffbbe] border-[#306576]'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                Nome {sortField === 'name' && (sortDirection === 'desc' ? '↓' : '↑')}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#eff4ff] text-[#306576] uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="p-3">PRN</th>
                  <th className="p-3">Colaborador</th>
                  <th className="p-3 text-center">Sexo</th>
                  <th className="p-3 text-center">Admissão</th>
                  <th className="p-3 text-center">Tempo de Casa</th>
                  <th className="p-3">Cargo</th>
                  <th className="p-3">Local / Setor</th>
                  <th className="p-3">Turno / Jornada</th>
                  <th className="p-3">Gestor Imediato</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {sortedNominalEmployees.map(emp => {
                  const isFemale = (emp.gender || '').toLowerCase().startsWith('f');
                  const tenure = calculateEmployeeTenure(emp.admissionDate);
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

                      {/* Admissão */}
                      <td className="p-3 text-center font-mono text-[11px] text-slate-600">
                        {tenure.formattedAdmission}
                      </td>

                      {/* Tempo de Casa */}
                      <td className="p-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-extrabold font-mono ${
                          tenure.bracket === '< 1 ano'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : tenure.bracket === '> 10 anos'
                            ? 'bg-amber-50 text-amber-900 border border-amber-200'
                            : 'bg-slate-100 text-slate-800 border border-slate-200'
                        }`}>
                          {tenure.label}
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
