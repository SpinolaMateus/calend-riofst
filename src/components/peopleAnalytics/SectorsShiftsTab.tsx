import React, { useState, useMemo } from 'react';
import { 
  Clock, Users, Factory, Layers, AlertTriangle, 
  CheckCircle2, Search, Filter, ShieldCheck, ChevronRight,
  Cake, Gift, PartyPopper, CalendarDays, Sparkles, Copy, Check,
  Calendar, Building2, UserCheck, ArrowUpDown, Download, History, Award
} from 'lucide-react';
import { Employee, ShiftCategory } from '../../types/peopleAnalytics';

interface SectorsShiftsTabProps {
  employees: Employee[];
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export interface TenureInfo {
  years: number;
  months: number;
  totalMonths: number;
  totalYears: number;
  label: string;
  bracket: '< 1 ano' | '1 a 2 anos' | '2 a 5 anos' | '5 a 10 anos' | '> 10 anos' | 'Sem data';
  formattedAdmission: string;
}

export interface AgeInfo {
  age: number;
  bracket: '< 25 anos' | '25 a 34 anos' | '35 a 44 anos' | '45 a 54 anos' | '55+ anos' | 'Sem data';
  formattedBirth: string;
}

// Cálculo do tempo de empresa
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

// Cálculo da idade com base na data de nascimento
export function calculateEmployeeAge(birthDate?: string, refDate = new Date(2026, 9, 13)): AgeInfo {
  if (!birthDate) {
    return {
      age: 0,
      bracket: 'Sem data',
      formattedBirth: '—'
    };
  }

  const [y, m, d] = birthDate.split('-').map(Number);
  const birth = new Date(y, (m || 1) - 1, d || 1);
  let age = refDate.getFullYear() - birth.getFullYear();
  const mDiff = refDate.getMonth() - birth.getMonth();
  if (mDiff < 0 || (mDiff === 0 && refDate.getDate() < birth.getDate())) {
    age--;
  }
  if (age < 0) age = 0;

  let bracket: AgeInfo['bracket'] = '55+ anos';
  if (age < 25) bracket = '< 25 anos';
  else if (age <= 34) bracket = '25 a 34 anos';
  else if (age <= 44) bracket = '35 a 44 anos';
  else if (age <= 54) bracket = '45 a 54 anos';

  const formattedBirth = `${String(d || 1).padStart(2, '0')}/${String(m || 1).padStart(2, '0')}/${y}`;

  return {
    age,
    bracket,
    formattedBirth
  };
}

export const SectorsShiftsTab: React.FC<SectorsShiftsTabProps> = ({ employees }) => {
  // Controle de Sub-abas
  const [activeSubTab, setActiveSubTab] = useState<'analytics' | 'cells' | 'birthdays'>('analytics');

  // Filtros da Visão Analítica
  const [selectedShift, setSelectedShift] = useState<string>('all');
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [selectedAgeBracket, setSelectedAgeBracket] = useState<string>('all');
  const [selectedTenureBracket, setSelectedTenureBracket] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [groupBy, setGroupBy] = useState<'location' | 'manager' | 'shift'>('location');
  const [showNominalTable, setShowNominalTable] = useState<boolean>(true);

  // Filtros da aba de Células
  const [cellSearch, setCellSearch] = useState<string>('');

  // Filtros da aba de Aniversariantes
  const [selectedMonth, setSelectedMonth] = useState<number>(() => {
    const nowMonth = new Date().getMonth() + 1;
    return nowMonth === 10 ? 10 : 10; // Foco em Outubro conforme mês de competência da fábrica
  });
  const [birthdayShift, setBirthdayShift] = useState<string>('all');
  const [birthdaySearch, setBirthdaySearch] = useState<string>('');
  const [copiedMural, setCopiedMural] = useState(false);

  // Agrupamentos por Turno (Cards Oficiais)
  const shiftGroups = [
    {
      id: 'Turno A',
      title: 'Turno 1 • Manhã',
      hours: '06:00 às 14:20',
      system: 'Escala 6x2 Revezamento',
      count: employees.filter(e => e.shiftCategory === 'Turno A').length || 88,
      planned: 90,
      leader: 'Ramon / ENK',
      absRate: '1,82%',
      otRate: '4,90%',
      status: 'Excelente',
      statusColor: 'bg-[#ecfdf5] text-[#047857]'
    },
    {
      id: 'Turno B',
      title: 'Turno 2 • Tarde',
      hours: '14:20 às 22:30',
      system: 'Escala 6x2 Revezamento',
      count: employees.filter(e => e.shiftCategory === 'Turno B').length || 84,
      planned: 86,
      leader: 'Marcos / GA',
      absRate: '2,45%',
      otRate: '6,80%',
      status: 'Normal',
      statusColor: 'bg-[#eff4ff] text-[#306576]'
    },
    {
      id: 'Turno C',
      title: 'Turno 3 • Noite',
      hours: '22:30 às 06:00',
      system: 'Escala 6x2 Noturna',
      count: employees.filter(e => e.shiftCategory === 'Turno C').length || 87,
      planned: 88,
      leader: 'Carlos / MP',
      absRate: '3,12%',
      otRate: '8,90%',
      status: 'Atenção',
      statusColor: 'bg-amber-100 text-amber-800'
    },
    {
      id: 'Administrativo',
      title: 'Administrativo / Suporte',
      hours: '08:00 às 17:48',
      system: 'Escala 5x2 Comercial',
      count: employees.filter(e => e.shiftCategory === 'Administrativo').length || 74,
      planned: 75,
      leader: 'Júlia / Superar',
      absRate: '1,15%',
      otRate: '2,10%',
      status: 'Excelente',
      statusColor: 'bg-[#ecfdf5] text-[#047857]'
    },
    {
      id: 'Outras Jornadas',
      title: 'Outras Jornadas & Jovens',
      hours: 'Cargas horárias especiais',
      system: 'Aprendizes & Estagiários',
      count: employees.filter(e => e.shiftCategory === 'Outras Jornadas').length || 20,
      planned: 20,
      leader: 'DHO / Tutores',
      absRate: '1,40%',
      otRate: '0,00%',
      status: 'Conforme',
      statusColor: 'bg-[#ecfdf5] text-[#047857]'
    }
  ];

  // Células Operacionais Fabris de KBA1
  const operationalCells = [
    {
      name: 'Onduladeira 2.50m (Linha de Frente)',
      macroarea: 'Operação Fabril',
      totalStaff: 42,
      criticalJobs: 'Operador de Onduladeira, Ajudante de Bobina, Foguista',
      coverage: '98%',
      alert: null
    },
    {
      name: 'Conversão • Impressoras Martin (Flexo)',
      macroarea: 'Operação Fabril',
      totalStaff: 58,
      criticalJobs: 'Impressor Flexográfico, Auxiliar de Tintas, Alimentador',
      coverage: '94%',
      alert: 'T3 com sobrecarga de horas extras'
    },
    {
      name: 'Conversão • Coladeiras Automáticas Bobst',
      macroarea: 'Operação Fabril',
      totalStaff: 36,
      criticalJobs: 'Operador de Coladeira, Empacotador, Revisor',
      coverage: '96%',
      alert: null
    },
    {
      name: 'Expedição & Movimentação Logística',
      macroarea: 'Logística & Expedição',
      totalStaff: 48,
      criticalJobs: 'Operador de Empilhadeira, Conferente de Carga, Motorista',
      coverage: '92%',
      alert: 'Rotatividade requer acompanhamento DHO'
    },
    {
      name: 'Manutenção Mecânica & Elétrica',
      macroarea: 'Manutenção & Utilidades',
      totalStaff: 32,
      criticalJobs: 'Eletromecânico, Mecânico Industrial, Instrumentista',
      coverage: '100%',
      alert: null
    },
    {
      name: 'Caldeira, Vapor & Tratamento de Água (ETE)',
      macroarea: 'Manutenção & Utilidades',
      totalStaff: 12,
      criticalJobs: 'Operador de Caldeira, Operador de Utilidades',
      coverage: '100%',
      alert: null
    },
    {
      name: 'Qualidade Assegurada & Laboratório',
      macroarea: 'Qualidade & SESMT',
      totalStaff: 16,
      criticalJobs: 'Analista de Qualidade, Técnico de Laboratório (Burst/ECT)',
      coverage: '100%',
      alert: null
    },
    {
      name: 'Gente & Gestão, SESMT & Ambulatório',
      macroarea: 'Gente & Gestão & ADM',
      totalStaff: 18,
      criticalJobs: 'Engenheiro de Segurança, Médico do Trabalho, BP RH',
      coverage: '100%',
      alert: null
    }
  ];

  // =========================================================================
  // PROCESSAMENTO ANALÍTICO: GÊNERO, IDADE & TEMPO DE CASA
  // =========================================================================
  const employeesWithMetrics = useMemo(() => {
    return employees.map(emp => {
      const tenure = calculateEmployeeTenure(emp.admissionDate);
      const age = calculateEmployeeAge(emp.birthDate);
      const isFemale = (emp.gender || '').toLowerCase().startsWith('f');
      return {
        emp,
        tenure,
        age,
        isFemale,
        genderLabel: isFemale ? 'Feminino' : 'Masculino'
      };
    });
  }, [employees]);

  // Filtragem da lista para Visão Analítica
  const filteredEmployeesList = useMemo(() => {
    return employeesWithMetrics.filter(item => {
      if (selectedShift !== 'all' && item.emp.shiftCategory !== selectedShift) return false;
      if (selectedGender !== 'all' && item.genderLabel !== selectedGender) return false;
      if (selectedAgeBracket !== 'all' && item.age.bracket !== selectedAgeBracket) return false;
      if (selectedTenureBracket !== 'all' && item.tenure.bracket !== selectedTenureBracket) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const mName = item.emp.name.toLowerCase().includes(q);
        const mPrn = item.emp.prn.toLowerCase().includes(q);
        const mJob = (item.emp.jobTitle || '').toLowerCase().includes(q);
        const mLoc = (item.emp.locationName || '').toLowerCase().includes(q);
        const mMgr = (item.emp.immediateManager || '').toLowerCase().includes(q);
        if (!mName && !mPrn && !mJob && !mLoc && !mMgr) return false;
      }
      return true;
    });
  }, [employeesWithMetrics, selectedShift, selectedGender, selectedAgeBracket, selectedTenureBracket, searchTerm]);

  // Estatísticas Globais da Visão Filtrada
  const analyticsKpis = useMemo(() => {
    const total = filteredEmployeesList.length;
    if (total === 0) {
      return {
        total: 0,
        female: 0,
        male: 0,
        femalePct: 0,
        malePct: 0,
        avgAge: 0,
        avgAgeFemale: 0,
        avgAgeMale: 0,
        avgTenure: 0,
        avgTenureFemale: 0,
        avgTenureMale: 0,
        shiftCounts: { 'Turno A': 0, 'Turno B': 0, 'Turno C': 0, 'Administrativo': 0, 'Outras Jornadas': 0 }
      };
    }

    let fCount = 0;
    let mCount = 0;
    let fAgeSum = 0;
    let mAgeSum = 0;
    let totalAgeSum = 0;
    let fTenureSum = 0;
    let mTenureSum = 0;
    let totalTenureSum = 0;
    const shiftCounts: Record<string, number> = {
      'Turno A': 0,
      'Turno B': 0,
      'Turno C': 0,
      'Administrativo': 0,
      'Outras Jornadas': 0
    };

    filteredEmployeesList.forEach(item => {
      totalAgeSum += item.age.age;
      totalTenureSum += item.tenure.totalYears;
      const s = item.emp.shiftCategory || 'Outras Jornadas';
      shiftCounts[s] = (shiftCounts[s] || 0) + 1;

      if (item.isFemale) {
        fCount++;
        fAgeSum += item.age.age;
        fTenureSum += item.tenure.totalYears;
      } else {
        mCount++;
        mAgeSum += item.age.age;
        mTenureSum += item.tenure.totalYears;
      }
    });

    return {
      total,
      female: fCount,
      male: mCount,
      femalePct: Number(((fCount / total) * 100).toFixed(1)),
      malePct: Number(((mCount / total) * 100).toFixed(1)),
      avgAge: Number((totalAgeSum / total).toFixed(1)),
      avgAgeFemale: fCount > 0 ? Number((fAgeSum / fCount).toFixed(1)) : 0,
      avgAgeMale: mCount > 0 ? Number((mAgeSum / mCount).toFixed(1)) : 0,
      avgTenure: Number((totalTenureSum / total).toFixed(1)),
      avgTenureFemale: fCount > 0 ? Number((fTenureSum / fCount).toFixed(1)) : 0,
      avgTenureMale: mCount > 0 ? Number((mTenureSum / mCount).toFixed(1)) : 0,
      shiftCounts
    };
  }, [filteredEmployeesList]);

  // Agrupamento Multidimensional (Setor ou Gestor)
  const groupedMatrix = useMemo(() => {
    const map = new Map<string, {
      key: string;
      label: string;
      total: number;
      female: number;
      male: number;
      ageSum: number;
      tenureSum: number;
      shifts: Record<string, number>;
      ageBrackets: Record<string, number>;
    }>();

    filteredEmployeesList.forEach(item => {
      let key = '';
      if (groupBy === 'location') {
        key = item.emp.locationName || 'Setor Fabril Não Definido';
      } else if (groupBy === 'manager') {
        key = item.emp.immediateManager || 'Gestor Não Informado';
      } else {
        key = item.emp.shiftCategory || 'Outras Jornadas';
      }

      let entry = map.get(key);
      if (!entry) {
        entry = {
          key,
          label: key,
          total: 0,
          female: 0,
          male: 0,
          ageSum: 0,
          tenureSum: 0,
          shifts: { 'Turno A': 0, 'Turno B': 0, 'Turno C': 0, 'Administrativo': 0, 'Outras Jornadas': 0 },
          ageBrackets: { '< 25 anos': 0, '25 a 34 anos': 0, '35 a 44 anos': 0, '45 a 54 anos': 0, '55+ anos': 0 }
        };
        map.set(key, entry);
      }

      entry.total++;
      if (item.isFemale) entry.female++;
      else entry.male++;

      entry.ageSum += item.age.age;
      entry.tenureSum += item.tenure.totalYears;

      const s = item.emp.shiftCategory || 'Outras Jornadas';
      entry.shifts[s] = (entry.shifts[s] || 0) + 1;

      const ab = item.age.bracket;
      if (ab !== 'Sem data') {
        entry.ageBrackets[ab] = (entry.ageBrackets[ab] || 0) + 1;
      }
    });

    const rows = Array.from(map.values()).map(r => {
      const avgAge = r.total > 0 ? Number((r.ageSum / r.total).toFixed(1)) : 0;
      const avgTenure = r.total > 0 ? Number((r.tenureSum / r.total).toFixed(1)) : 0;
      const femalePct = r.total > 0 ? Number(((r.female / r.total) * 100).toFixed(1)) : 0;
      const malePct = r.total > 0 ? Number(((r.male / r.total) * 100).toFixed(1)) : 0;

      // Faixa etária predominante
      let topBracket = '< 25 anos';
      let topCount = -1;
      Object.entries(r.ageBrackets).forEach(([b, c]) => {
        if (c > topCount) {
          topCount = c;
          topBracket = b;
        }
      });

      return {
        ...r,
        avgAge,
        avgTenure,
        femalePct,
        malePct,
        topBracket
      };
    });

    // Ordenar pelo total decrescente
    rows.sort((a, b) => b.total - a.total);
    return rows;
  }, [filteredEmployeesList, groupBy]);

  // Exportar Tabela Nominal para CSV
  const handleExportCSV = () => {
    let csv = 'PRN;Nome;Genero;Idade;DataNascimento;FaixaEtaria;TempoAnos;TempoMeses;DataAdmissao;FaixaPermanencia;Setor;Turno;Gestor;Cargo;Status\n';
    filteredEmployeesList.forEach(({ emp, age, tenure, genderLabel }) => {
      csv += `${emp.prn};"${emp.name}";${genderLabel};${age.age};${age.formattedBirth};"${age.bracket}";${tenure.totalYears};${tenure.totalMonths};${tenure.formattedAdmission};"${tenure.bracket}";"${emp.locationName}";"${emp.shiftCategory}";"${emp.immediateManager}";"${emp.jobTitle}";"${emp.status}"\n`;
    });

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quadro_detalhado_kba1_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // =========================================================================
  // PROCESSAMENTO DA LISTA DE ANIVERSARIANTES DO MÊS
  // =========================================================================
  const birthdayData = useMemo(() => {
    const list: Array<{
      emp: Employee;
      day: number;
      dayFormatted: string;
      isFemale: boolean;
      tenureYears: number;
      ageCompleting: number;
    }> = [];

    employees.forEach(emp => {
      if (!emp.birthDate) return;
      const parts = emp.birthDate.split('-');
      if (parts.length >= 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        const d = parseInt(parts[2], 10);
        if (m === selectedMonth) {
          const isFemale = (emp.gender || '').toLowerCase().startsWith('f');
          let tenureYears = 0;
          if (emp.admissionDate) {
            const admYear = parseInt(emp.admissionDate.split('-')[0], 10);
            tenureYears = Math.max(0, 2026 - admYear);
          }
          const ageCompleting = 2026 - y;
          list.push({
            emp,
            day: d,
            dayFormatted: `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`,
            isFemale,
            tenureYears,
            ageCompleting
          });
        }
      }
    });

    // Ordenação cronológica por dia do mês
    list.sort((a, b) => a.day - b.day);

    const byShift: Record<string, number> = {
      'Turno A': 0,
      'Turno B': 0,
      'Turno C': 0,
      'Administrativo': 0,
      'Outras Jornadas': 0,
    };

    list.forEach(item => {
      const cat = item.emp.shiftCategory || 'Outras Jornadas';
      byShift[cat] = (byShift[cat] || 0) + 1;
    });

    return { list, byShift };
  }, [employees, selectedMonth]);

  const filteredBirthdays = useMemo(() => {
    return birthdayData.list.filter(item => {
      if (birthdayShift !== 'all' && item.emp.shiftCategory !== birthdayShift) {
        return false;
      }
      if (birthdaySearch.trim()) {
        const q = birthdaySearch.toLowerCase();
        const matchName = item.emp.name.toLowerCase().includes(q);
        const matchLoc = (item.emp.locationName || '').toLowerCase().includes(q);
        const matchJob = (item.emp.jobTitle || '').toLowerCase().includes(q);
        const matchMgr = (item.emp.immediateManager || '').toLowerCase().includes(q);
        if (!matchName && !matchLoc && !matchJob && !matchMgr) return false;
      }
      return true;
    });
  }, [birthdayData.list, birthdayShift, birthdaySearch]);

  const handleCopyMural = () => {
    const monthName = MONTH_NAMES[selectedMonth - 1];
    let text = `🎂 *ANIVERSARIANTES DE ${monthName.toUpperCase()} — KLABIN FEIRA DE SANTANA (KBA1)* 🎂\n`;
    text += `Total no mês: ${birthdayData.list.length} colaboradores homenageados\n\n`;

    const grouped: Record<string, typeof filteredBirthdays> = {};
    filteredBirthdays.forEach(item => {
      const shift = item.emp.shiftCategory || 'Outras Jornadas';
      if (!grouped[shift]) grouped[shift] = [];
      grouped[shift].push(item);
    });

    Object.entries(grouped).forEach(([shift, items]) => {
      text += `📍 *${shift.toUpperCase()}* (${items.length} aniversariantes):\n`;
      items.forEach(it => {
        text += ` • ${it.dayFormatted} - *${it.emp.name}* (${it.emp.jobTitle}) - ${it.emp.locationName}\n`;
      });
      text += `\n`;
    });

    text += `Desejamos muita saúde, realizações e segurança para todo o time da KBA1! 🎉👏`;

    navigator.clipboard.writeText(text);
    setCopiedMural(true);
    setTimeout(() => setCopiedMural(false), 2500);
  };

  // Filtragem de Células Fabris
  const filteredCells = operationalCells.filter(cell => {
    if (!cellSearch.trim()) return true;
    const q = cellSearch.toLowerCase();
    return cell.name.toLowerCase().includes(q) || cell.criticalJobs.toLowerCase().includes(q) || cell.macroarea.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">

      {/* ========================================================================= */}
      {/* 1. SELETOR DE SUB-ABAS SUPERIORES */}
      {/* ========================================================================= */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveSubTab('analytics')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
              activeSubTab === 'analytics'
                ? 'bg-[#0a3641] text-[#6ffbbe] shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Quadro Analítico Completo (Setor, Turno, Gênero, Tempo & Idade)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('cells')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
              activeSubTab === 'cells'
                ? 'bg-[#0a3641] text-[#6ffbbe] shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Factory className="w-4 h-4" />
            <span>Células Fabris & Escalas de Turno</span>
          </button>

          <button
            onClick={() => setActiveSubTab('birthdays')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
              activeSubTab === 'birthdays'
                ? 'bg-gradient-to-r from-purple-700 to-indigo-700 text-white shadow-xs'
                : 'bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200'
            }`}
          >
            <PartyPopper className="w-4 h-4 text-amber-300" />
            <span>🎂 Aniversariantes do Mês ({birthdayData.list.length})</span>
          </button>
        </div>

        <div className="text-right text-[11px] font-mono text-slate-400">
          Base Ativa: <strong>{employees.length} colaboradores KBA1</strong>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-ABA 1: QUADRO ANALÍTICO COMPLETO (GÊNERO, TEMPO & IDADE POR SETOR/TURNO) */}
      {/* ========================================================================= */}
      {activeSubTab === 'analytics' && (
        <div className="space-y-6">

          {/* Cards de Resumo Executivo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* Total */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Efetivo Filtrado</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-[#0b1c30]">{analyticsKpis.total}</span>
                <span className="text-xs text-slate-400 font-semibold">de {employees.length}</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">100% alocados na planta KBA1</p>
            </div>

            {/* Gênero */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Gênero (Homens / Mulheres)</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-[#0a3641]">{analyticsKpis.male} 👨</span>
                <span className="text-2xl font-black text-rose-600">{analyticsKpis.female} 👩</span>
              </div>
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 mt-1">
                <span className="text-sky-700 font-bold">{analyticsKpis.malePct}% Masc</span>
                <span className="text-rose-600 font-bold">{analyticsKpis.femalePct}% Fem</span>
              </div>
            </div>

            {/* Idade Média */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                Idade Média da Fábrica
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-[#0b1c30]">{analyticsKpis.avgAge}</span>
                <span className="text-xs text-slate-500 font-semibold">anos de idade</span>
              </div>
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 mt-1">
                <span className="text-rose-600 font-bold">👩 {analyticsKpis.avgAgeFemale}a</span>
                <span className="text-sky-700 font-bold">👨 {analyticsKpis.avgAgeMale}a</span>
              </div>
            </div>

            {/* Tempo de Empresa */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-amber-600" />
                Tempo Médio de Casa
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-[#0b1c30]">{analyticsKpis.avgTenure}</span>
                <span className="text-xs text-slate-500 font-semibold">anos de retenção</span>
              </div>
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 mt-1">
                <span className="text-rose-600 font-bold">👩 {analyticsKpis.avgTenureFemale}a</span>
                <span className="text-sky-700 font-bold">👨 {analyticsKpis.avgTenureMale}a</span>
              </div>
            </div>

            {/* Turnos */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                Presença nos Turnos
              </span>
              <div className="grid grid-cols-3 gap-1 text-center mt-1">
                <div className="bg-slate-50 p-1 rounded font-mono text-[10px]">
                  <span className="text-slate-400 block font-bold">T1</span>
                  <span className="font-bold text-slate-800">{analyticsKpis.shiftCounts['Turno A']}</span>
                </div>
                <div className="bg-slate-50 p-1 rounded font-mono text-[10px]">
                  <span className="text-slate-400 block font-bold">T2</span>
                  <span className="font-bold text-slate-800">{analyticsKpis.shiftCounts['Turno B']}</span>
                </div>
                <div className="bg-slate-50 p-1 rounded font-mono text-[10px]">
                  <span className="text-slate-400 block font-bold">T3</span>
                  <span className="font-bold text-slate-800">{analyticsKpis.shiftCounts['Turno C']}</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100 mt-1">
                <span>ADM: <strong>{analyticsKpis.shiftCounts['Administrativo']}</strong></span>
                <span>Outros: <strong>{analyticsKpis.shiftCounts['Outras Jornadas']}</strong></span>
              </div>
            </div>
          </div>

          {/* Barra de Filtros e Opções de Agrupamento */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* Seletor de Agrupamento */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-slate-600 mr-1 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-[#306576]" />
                  Agrupar Matriz Por:
                </span>
                <button
                  onClick={() => setGroupBy('location')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    groupBy === 'location'
                      ? 'bg-[#0a3641] text-[#6ffbbe] shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Local / Setor Fabril ({groupedMatrix.length})
                </button>
                <button
                  onClick={() => setGroupBy('manager')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    groupBy === 'manager'
                      ? 'bg-[#0a3641] text-[#6ffbbe] shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Gestor Imediato
                </button>
                <button
                  onClick={() => setGroupBy('shift')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    groupBy === 'shift'
                      ? 'bg-[#0a3641] text-[#6ffbbe] shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Turno / Escala
                </button>
              </div>

              {/* Botões de Ação */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowNominalTable(!showNominalTable)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#eff4ff] text-[#306576] hover:bg-[#e0edff] border border-[#cbd5e1] transition-colors"
                >
                  {showNominalTable ? 'Ocultar Lista Nominal' : 'Ver Lista Nominal Completa'}
                </button>
                <button
                  onClick={handleExportCSV}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#ecfdf5] text-[#047857] hover:bg-[#d1fae5] border border-[#a7f3d0] transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Exportar CSV
                </button>
              </div>
            </div>

            {/* Multifiltros em Linha */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2 border-t border-slate-100 text-xs">
              {/* Turno */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Turno / Escala</label>
                <select
                  value={selectedShift}
                  onChange={e => setSelectedShift(e.target.value)}
                  className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                >
                  <option value="all">Todos os Turnos</option>
                  <option value="Turno A">Turno A (Manhã)</option>
                  <option value="Turno B">Turno B (Tarde)</option>
                  <option value="Turno C">Turno C (Noite)</option>
                  <option value="Administrativo">Administrativo</option>
                  <option value="Outras Jornadas">Outras Jornadas</option>
                </select>
              </div>

              {/* Gênero */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Gênero</label>
                <select
                  value={selectedGender}
                  onChange={e => setSelectedGender(e.target.value)}
                  className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                >
                  <option value="all">Todos os Gêneros</option>
                  <option value="Feminino">Mulheres (👩)</option>
                  <option value="Masculino">Homens (👨)</option>
                </select>
              </div>

              {/* Faixa Etária */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Faixa de Idade</label>
                <select
                  value={selectedAgeBracket}
                  onChange={e => setSelectedAgeBracket(e.target.value)}
                  className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                >
                  <option value="all">Todas as Idades</option>
                  <option value="< 25 anos">&lt; 25 anos (Jovens)</option>
                  <option value="25 a 34 anos">25 a 34 anos</option>
                  <option value="35 a 44 anos">35 a 44 anos</option>
                  <option value="45 a 54 anos">45 a 54 anos</option>
                  <option value="55+ anos">55+ anos (Maturidade)</option>
                </select>
              </div>

              {/* Tempo de Casa */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Tempo de Casa</label>
                <select
                  value={selectedTenureBracket}
                  onChange={e => setSelectedTenureBracket(e.target.value)}
                  className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                >
                  <option value="all">Todas as Permanências</option>
                  <option value="< 1 ano">&lt; 1 ano (Admitidos 2026)</option>
                  <option value="1 a 2 anos">1 a 2 anos</option>
                  <option value="2 a 5 anos">2 a 5 anos</option>
                  <option value="5 a 10 anos">5 a 10 anos</option>
                  <option value="> 10 anos">&gt; 10 anos (Veteranos)</option>
                </select>
              </div>

              {/* Busca Textual */}
              <div className="col-span-2">
                <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Busca Rápida</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                  <input
                    type="text"
                    placeholder="Nome, PRN, Cargo, Setor ou Gestor..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#306576]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* MATRIZ DE CRUZAMENTO MULTIDIMENSIONAL */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-[#0b1c30]">
                  Matriz Multidimensional: {groupBy === 'location' ? 'Local / Setor Fabril' : groupBy === 'manager' ? 'Gestor Imediato' : 'Turno / Escala'}
                </h4>
                <p className="text-xs text-slate-500">
                  Cruzamento de efetivo, gênero, tempo de permanência, idade média e distribuição por turno
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-slate-400">
                {groupedMatrix.length} agrupamentos
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#eff4ff] text-[#306576] uppercase text-[10px] tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">
                      {groupBy === 'location' ? 'Local / Setor' : groupBy === 'manager' ? 'Gestor Imediato' : 'Turno / Escala'}
                    </th>
                    <th className="py-3 px-3 text-center">Total</th>
                    <th className="py-3 px-3 text-center">Mulheres (👩)</th>
                    <th className="py-3 px-3 text-center">Homens (👨)</th>
                    <th className="py-3 px-3 text-center">Idade Média</th>
                    <th className="py-3 px-3 text-center">Tempo Médio</th>
                    <th className="py-3 px-2 text-center">T1</th>
                    <th className="py-3 px-2 text-center">T2</th>
                    <th className="py-3 px-2 text-center">T3</th>
                    <th className="py-3 px-2 text-center">ADM</th>
                    <th className="py-3 px-2 text-center">Outros</th>
                    <th className="py-3 px-3">Faixa Etária Predominante</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {groupedMatrix.map(row => (
                    <tr key={row.key} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {row.label}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-black text-[#0a3641]">
                        {row.total}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="font-mono font-bold text-rose-700">{row.female}</span>
                        <span className="text-[10px] text-slate-400 block">({row.femalePct}%)</span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="font-mono font-bold text-sky-800">{row.male}</span>
                        <span className="text-[10px] text-slate-400 block">({row.malePct}%)</span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-emerald-800">
                        {row.avgAge}a
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-amber-700">
                        {row.avgTenure}a
                      </td>
                      <td className="py-3 px-2 text-center font-mono text-slate-600">{row.shifts['Turno A'] || '—'}</td>
                      <td className="py-3 px-2 text-center font-mono text-slate-600">{row.shifts['Turno B'] || '—'}</td>
                      <td className="py-3 px-2 text-center font-mono text-slate-600">{row.shifts['Turno C'] || '—'}</td>
                      <td className="py-3 px-2 text-center font-mono text-slate-600">{row.shifts['Administrativo'] || '—'}</td>
                      <td className="py-3 px-2 text-center font-mono text-slate-600">{row.shifts['Outras Jornadas'] || '—'}</td>
                      <td className="py-3 px-3">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {row.topBracket}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* TABELA NOMINAL COMPLETA (QUADRO DE PESSOAL) */}
          {showNominalTable && (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-sm text-[#0b1c30]">
                    Quadro Nominal Completo ({filteredEmployeesList.length} colaboradores)
                  </h4>
                  <p className="text-xs text-slate-500">
                    Detalhes nominais com gênero, data de nascimento, idade calculada, data de admissão e tempo de casa
                  </p>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  Unidade Bahia • KBA1 / K111
                </span>
              </div>

              <div className="overflow-x-auto max-h-[550px] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#eff4ff] text-[#306576] uppercase text-[10px] tracking-wider font-semibold sticky top-0 z-10 shadow-2xs">
                    <tr>
                      <th className="py-3 px-3">PRN</th>
                      <th className="py-3 px-4">Colaborador & Cargo</th>
                      <th className="py-3 px-2 text-center">Gênero</th>
                      <th className="py-3 px-3">Idade & Nascimento</th>
                      <th className="py-3 px-3">Tempo de Casa & Admissão</th>
                      <th className="py-3 px-3">Local / Setor Fabril</th>
                      <th className="py-3 px-3">Turno / Escala</th>
                      <th className="py-3 px-3">Gestor Imediato</th>
                      <th className="py-3 px-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredEmployeesList.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-slate-400">
                          Nenhum colaborador encontrado com os filtros aplicados.
                        </td>
                      </tr>
                    ) : (
                      filteredEmployeesList.map(({ emp, age, tenure, isFemale, genderLabel }) => (
                        <tr key={emp.prn} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-500 text-[11px]">
                            {emp.prn}
                          </td>
                          <td className="py-2.5 px-4">
                            <span className="font-bold text-[#0b1c30] block">{emp.name}</span>
                            <span className="text-[10px] text-slate-500">{emp.jobTitle}</span>
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isFemale ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-sky-50 text-sky-800 border border-sky-100'
                            }`}>
                              {isFemale ? '👩 Fem' : '👨 Masc'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-slate-800 font-mono text-[11px] block">
                              {age.age > 0 ? `${age.age} anos` : '—'}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Nasc: {age.formattedBirth} • {age.bracket}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-slate-800 font-mono text-[11px] block">
                              {tenure.label}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Adm: {tenure.formattedAdmission} • {tenure.bracket}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-800">
                            {emp.locationName}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              emp.shiftCategory === 'Turno A'
                                ? 'bg-sky-50 text-sky-800 border border-sky-200'
                                : emp.shiftCategory === 'Turno B'
                                ? 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                                : emp.shiftCategory === 'Turno C'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : emp.shiftCategory === 'Administrativo'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-purple-50 text-purple-800 border border-purple-200'
                            }`}>
                              {emp.shiftCategory}
                            </span>
                            <span className="text-[9px] text-slate-400 block font-mono mt-0.5">{emp.shiftName}</span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {emp.immediateManager}
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {emp.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-ABA 2: CÉLULAS OPERACIONAIS FABRIS & ESCALAS DE TURNO (ORIGINAL COMPLETO) */}
      {/* ========================================================================= */}
      {activeSubTab === 'cells' && (
        <div className="space-y-6">

          {/* Cards dos 4 Turnos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {shiftGroups.map(grp => (
              <div 
                key={grp.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-[#0b1c30]">{grp.title}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${grp.statusColor}`}>
                      {grp.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono mb-2">{grp.hours}</p>

                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-2xl font-extrabold text-[#0b1c30]">{grp.count}</span>
                    <span className="text-xs text-slate-400">/ {grp.planned} meta</span>
                  </div>

                  <div className="space-y-1 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                    <div className="flex justify-between">
                      <span>Líder de Turno:</span>
                      <strong className="text-slate-700">{grp.leader}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Absenteísmo:</span>
                      <strong className={grp.id === 'Turno C' ? 'text-amber-800 font-bold' : 'text-[#047857]'}>{grp.absRate}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Horas Extras:</span>
                      <strong className={grp.id === 'Turno C' ? 'text-amber-900 font-bold' : 'text-slate-700'}>{grp.otRate}</strong>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Tabela de Células Operacionais Fabris */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-[#0b1c30]">Mapeamento de Células Operacionais Fabris</h3>
                <p className="text-xs text-slate-500">Capacidade produtiva, postos críticos e alertas por célula</p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input 
                  type="text"
                  placeholder="Buscar célula ou função..."
                  value={cellSearch}
                  onChange={(e) => setCellSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-[#f8f9ff] text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-[#306576]"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#eff4ff] text-[#306576] uppercase text-[10px] tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Célula / Linha de Produção</th>
                    <th className="py-3 px-3">Macroárea</th>
                    <th className="py-3 px-3 text-center">Efetivo Alocado</th>
                    <th className="py-3 px-4">Funções Críticas Mapeadas</th>
                    <th className="py-3 px-3 text-center">Taxa de Cobertura</th>
                    <th className="py-3 px-4">Observações de Gestão</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCells.map((cell, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-[#0b1c30]">{cell.name}</td>
                      <td className="py-3.5 px-3 text-slate-600">{cell.macroarea}</td>
                      <td className="py-3.5 px-3 text-center font-bold text-[#0a3641]">{cell.totalStaff} colab</td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">{cell.criticalJobs}</td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#ecfdf5] text-[#047857]">
                          {cell.coverage}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {cell.alert ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-amber-800 font-medium">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            {cell.alert}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#10b981] shrink-0" />
                            Escala estabilizada
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-ABA 3: ANIVERSARIANTES DO MÊS (PRÁTICA DHO & MURAL DE TURNO) */}
      {/* ========================================================================= */}
      {activeSubTab === 'birthdays' && (
        <div className="bg-white rounded-2xl border border-purple-200/90 shadow-2xs overflow-hidden space-y-4 p-5">
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-purple-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-purple-100 text-purple-700">
                  <Cake className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-[#0b1c30] flex items-center gap-2">
                    Aniversariantes de {MONTH_NAMES[selectedMonth - 1]} • KBA1
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 font-mono font-bold">
                      {birthdayData.list.length} aniversariantes
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Prática de Gestão DHO: Acompanhamento de aniversariantes por Setor, Turno e Gestor Imediato
                  </p>
                </div>
              </div>
            </div>

            {/* Controles: Seletor de Mês e Botão de Copiar */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <CalendarDays className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
                <select
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(Number(e.target.value))}
                  className="bg-transparent text-xs font-bold text-slate-700 py-1 px-2 focus:outline-none cursor-pointer"
                >
                  {MONTH_NAMES.map((m, idx) => (
                    <option key={m} value={idx + 1}>
                      {m} ({employees.filter(emp => {
                        if (!emp.birthDate) return false;
                        const parts = emp.birthDate.split('-');
                        return parts.length >= 2 && parseInt(parts[1], 10) === idx + 1;
                      }).length})
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleCopyMural}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-2xs transition-all"
                title="Copiar texto comemorativo formatado para envio no WhatsApp do Turno ou Mural"
              >
                {copiedMural ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedMural ? 'Copiado para o Mural!' : 'Copiar p/ Mural de Turno'}</span>
              </button>
            </div>
          </div>

          {/* Resumo por Turno */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
            {['Turno A', 'Turno B', 'Turno C', 'Administrativo', 'Outras Jornadas'].map(sh => (
              <button
                key={sh}
                onClick={() => setBirthdayShift(birthdayShift === sh ? 'all' : sh)}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  birthdayShift === sh 
                    ? 'bg-purple-600 text-white border-purple-700 shadow-2xs' 
                    : 'bg-purple-50/50 hover:bg-purple-100/60 text-purple-900 border-purple-100'
                }`}
              >
                <span className="text-[10px] font-bold block opacity-80">{sh}</span>
                <span className="text-lg font-black font-mono">
                  {birthdayData.byShift[sh] || 0}
                </span>
                <span className="text-[10px] block opacity-70">aniversariantes</span>
              </button>
            ))}
          </div>

          {/* Filtro e Busca de Aniversariantes */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 text-xs w-full sm:w-auto">
              <span className="text-slate-500 font-semibold text-xs">Filtrar Turno:</span>
              <button
                onClick={() => setBirthdayShift('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                  birthdayShift === 'all' ? 'bg-purple-700 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Todos ({birthdayData.list.length})
              </button>
              {['Turno A', 'Turno B', 'Turno C', 'Administrativo'].map(sh => (
                <button
                  key={sh}
                  onClick={() => setBirthdayShift(sh)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                    birthdayShift === sh ? 'bg-purple-700 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {sh.replace('Turno ', 'T')} ({birthdayData.byShift[sh] || 0})
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar aniversariante..."
                value={birthdaySearch}
                onChange={e => setBirthdaySearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Tabela de Aniversariantes */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-purple-50 text-purple-900 uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="py-2.5 px-3 text-center">Dia</th>
                  <th className="py-2.5 px-3">Colaborador Homenageado</th>
                  <th className="py-2.5 px-2 text-center">Gênero</th>
                  <th className="py-2.5 px-3">Local / Setor Fabril</th>
                  <th className="py-2.5 px-3">Turno / Escala</th>
                  <th className="py-2.5 px-3">Gestor Imediato</th>
                  <th className="py-2.5 px-3 text-center">Idade no Ano</th>
                  <th className="py-2.5 px-3 text-center">Tempo de Casa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredBirthdays.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Nenhum aniversariante encontrado com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredBirthdays.map(({ emp, dayFormatted, isFemale, tenureYears, ageCompleting }) => (
                    <tr key={emp.prn} className="hover:bg-purple-50/30 transition-colors">
                      <td className="py-2.5 px-3 text-center">
                        <span className="inline-flex items-center gap-1 font-mono font-black text-xs px-2.5 py-1 rounded-lg bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-900 border border-purple-200 shadow-2xs">
                          🎂 {dayFormatted}
                        </span>
                      </td>

                      <td className="py-2.5 px-3">
                        <span className="font-bold text-[#0b1c30] block">{emp.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">PRN: {emp.prn} • {emp.jobTitle}</span>
                      </td>

                      <td className="py-2.5 px-2 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isFemale ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-sky-50 text-sky-800 border border-sky-100'
                        }`}>
                          {isFemale ? '👩 Fem' : '👨 Masc'}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {emp.locationName}
                      </td>

                      <td className="py-2.5 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          emp.shiftCategory === 'Turno A'
                            ? 'bg-sky-50 text-sky-800 border border-sky-200'
                            : emp.shiftCategory === 'Turno B'
                            ? 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                            : emp.shiftCategory === 'Turno C'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : emp.shiftCategory === 'Administrativo'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-purple-50 text-purple-800 border border-purple-200'
                        }`}>
                          {emp.shiftCategory}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-slate-600">
                        {emp.immediateManager}
                      </td>

                      <td className="py-2.5 px-3 text-center font-mono text-[11px] font-bold text-purple-800">
                        {ageCompleting > 0 ? `${ageCompleting} anos` : '—'}
                      </td>

                      <td className="py-2.5 px-3 text-center font-mono text-[11px] font-bold text-slate-700">
                        {tenureYears > 0 ? `${tenureYears} anos` : '< 1 ano'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

    </div>
  );
};
