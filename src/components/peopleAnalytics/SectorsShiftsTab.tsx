import React, { useState, useMemo } from 'react';
import { 
  Clock, Users, Factory, Layers, AlertTriangle, 
  CheckCircle2, Search, Filter, ShieldCheck, ChevronRight,
  Cake, Gift, PartyPopper, CalendarDays, Sparkles, Copy, Check,
  Calendar, Building2, UserCheck
} from 'lucide-react';
import { Employee, ShiftCategory } from '../../types/peopleAnalytics';

interface SectorsShiftsTabProps {
  employees: Employee[];
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const SectorsShiftsTab: React.FC<SectorsShiftsTabProps> = ({ employees }) => {
  const [selectedShift, setSelectedShift] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<number>(() => {
    // Default no mês corrente (Outubro = 10 na simulação de 2026 ou mês atual da máquina)
    const nowMonth = new Date().getMonth() + 1;
    return nowMonth === 10 ? 10 : 10; // Foco em Outubro conforme dados de competência da fábrica
  });
  const [birthdaySearch, setBirthdaySearch] = useState<string>('');
  const [copiedMural, setCopiedMural] = useState(false);

  // Agrupamentos por Turno
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

  // Principais Células Operacionais Fabris de KBA1
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
      criticalJobs: 'Técnico de Segurança, Enfermeiro do Trabalho, Analista G&G',
      coverage: '100%',
      alert: null
    }
  ];

  const filteredCells = operationalCells.filter(cell => {
    const matchesSearch = cell.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          cell.macroarea.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          cell.criticalJobs.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

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
    }> = [];

    employees.forEach(emp => {
      if (!emp.birthDate) return;
      const parts = emp.birthDate.split('-');
      if (parts.length >= 3) {
        const m = parseInt(parts[1], 10);
        const d = parseInt(parts[2], 10);
        if (m === selectedMonth) {
          const isFemale = (emp.gender || '').toLowerCase().startsWith('f');
          let tenureYears = 0;
          if (emp.admissionDate) {
            const admYear = parseInt(emp.admissionDate.split('-')[0], 10);
            tenureYears = Math.max(0, 2026 - admYear);
          }
          list.push({
            emp,
            day: d,
            dayFormatted: `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`,
            isFemale,
            tenureYears
          });
        }
      }
    });

    // Ordenação cronológica por dia do aniversário
    list.sort((a, b) => a.day - b.day);

    // Contagem por turno para o mês selecionado
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

  // Filtragem dos aniversariantes por turno e busca
  const filteredBirthdays = useMemo(() => {
    return birthdayData.list.filter(item => {
      if (selectedShift !== 'all' && item.emp.shiftCategory !== selectedShift) {
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
  }, [birthdayData.list, selectedShift, birthdaySearch]);

  // Copiar lista formatada para mural do WhatsApp / Quadro de Avisos do Turno
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
      text += `*${shift.toUpperCase()}* (${items.length}):\n`;
      items.forEach(it => {
        text += `• Dia ${it.dayFormatted}: ${it.emp.name} — ${it.emp.locationName}\n`;
      });
      text += `\n`;
    });

    text += `🎉 Parabéns a todos os aniversariantes! Gente & Gestão KBA1`;

    navigator.clipboard.writeText(text).then(() => {
      setCopiedMural(true);
      setTimeout(() => setCopiedMural(false), 3000);
    });
  };

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. TOPO: CONTEXTO DE SETORES & TURNOS */}
      {/* ========================================================================= */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#0a3641] text-white flex items-center justify-center shadow-sm">
            <Clock className="w-6 h-6 text-[#6ffbbe]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-[#0b1c30] tracking-tight">Setores Fabris & Escalas de Turnos</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#ecfdf5] text-[#047857] border border-[#a7f3d0]">
                Ocupação Plena
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Gestão de contingente, postos críticos, escalas operacionais e boa prática de celebrações na unidade KBA1
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span>Total Alocado: <strong className="text-[#0b1c30] font-bold">{employees.length || 353}</strong> colaboradores</span>
          <span className="text-slate-300">|</span>
          <span>Cobertura Global: <strong className="text-[#047857] font-bold">96,8%</strong></span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. OS 5 CARDS DAS ESCALAS DE TURNO (INTERATIVOS) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {shiftGroups.map(grp => (
          <div 
            key={grp.id} 
            className={`p-4 rounded-xl border transition-all ${
              selectedShift === grp.id 
                ? 'bg-[#eff4ff] border-[#306576] shadow-md ring-2 ring-[#306576]/20' 
                : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-sm'
            }`}
            onClick={() => setSelectedShift(selectedShift === grp.id ? 'all' : grp.id)}
            style={{ cursor: 'pointer' }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#0a3641]">{grp.title}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${grp.statusColor}`}>
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
                <strong className={grp.id === 'Turno C' ? 'text-amber-800' : 'text-[#047857]'}>{grp.absRate}</strong>
              </div>
              <div className="flex justify-between">
                <span>Aniversariantes ({MONTH_NAMES[selectedMonth - 1].slice(0, 3)}):</span>
                <strong className="text-purple-700 font-black">
                  🎂 {birthdayData.byShift[grp.id] || 0}
                </strong>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* 3. BOA PRÁTICA: LISTA DE ANIVERSARIANTES DO MÊS CORRENTE POR SETOR E TURNO */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-5">
        
        {/* Cabeçalho da Seção de Aniversariantes */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white flex items-center justify-center shadow-sm shrink-0">
              <Cake className="w-6 h-6 text-purple-200" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-black text-[#0b1c30] tracking-tight">
                  Aniversariantes do Mês — Setores & Escalas de Turno
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-600" /> Boa Prática G&G
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Reconhecimento, integração de equipes e celebração nas passagens de turno da planta Feira de Santana
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Seletor de Mês */}
            <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
              <CalendarDays className="w-4 h-4 text-slate-400 ml-1.5" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-transparent text-xs font-black text-slate-800 focus:outline-none pr-2 py-1 cursor-pointer"
              >
                {MONTH_NAMES.map((name, idx) => (
                  <option key={name} value={idx + 1}>
                    {name} ({idx + 1 === 10 ? 'Mês Corrente' : `${idx + 1}`})
                  </option>
                ))}
              </select>
            </div>

            {/* Botão Copiar Lista para Mural */}
            <button
              onClick={handleCopyMural}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                copiedMural 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-[#0a3641] hover:bg-[#134e5e] text-[#6ffbbe]'
              }`}
              title="Copiar lista organizada para WhatsApp ou mural do turno"
            >
              {copiedMural ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedMural ? 'Lista Copiada!' : 'Copiar p/ Mural de Turno'}</span>
            </button>
          </div>
        </div>

        {/* Resumo Rápido dos Aniversariantes do Mês Selecionado */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-purple-700 uppercase block">Total no Mês</span>
              <span className="text-xl font-black text-purple-900">{birthdayData.list.length}</span>
            </div>
            <PartyPopper className="w-5 h-5 text-purple-500" />
          </div>

          <div 
            onClick={() => setSelectedShift(selectedShift === 'Turno A' ? 'all' : 'Turno A')}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${
              selectedShift === 'Turno A' ? 'bg-sky-100 border-sky-400 font-bold' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <span className="text-[10px] text-slate-500 font-bold uppercase block">T1 (Manhã)</span>
            <span className="text-lg font-black text-slate-900">{birthdayData.byShift['Turno A'] || 0} colab.</span>
          </div>

          <div 
            onClick={() => setSelectedShift(selectedShift === 'Turno B' ? 'all' : 'Turno B')}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${
              selectedShift === 'Turno B' ? 'bg-indigo-100 border-indigo-400 font-bold' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <span className="text-[10px] text-slate-500 font-bold uppercase block">T2 (Tarde)</span>
            <span className="text-lg font-black text-slate-900">{birthdayData.byShift['Turno B'] || 0} colab.</span>
          </div>

          <div 
            onClick={() => setSelectedShift(selectedShift === 'Turno C' ? 'all' : 'Turno C')}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${
              selectedShift === 'Turno C' ? 'bg-amber-100 border-amber-400 font-bold' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <span className="text-[10px] text-slate-500 font-bold uppercase block">T3 (Noite)</span>
            <span className="text-lg font-black text-slate-900">{birthdayData.byShift['Turno C'] || 0} colab.</span>
          </div>

          <div 
            onClick={() => setSelectedShift(selectedShift === 'Administrativo' ? 'all' : 'Administrativo')}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${
              selectedShift === 'Administrativo' ? 'bg-emerald-100 border-emerald-400 font-bold' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <span className="text-[10px] text-slate-500 font-bold uppercase block">ADM / Apoio</span>
            <span className="text-lg font-black text-slate-900">{birthdayData.byShift['Administrativo'] || 0} colab.</span>
          </div>

          <div 
            onClick={() => setSelectedShift(selectedShift === 'Outras Jornadas' ? 'all' : 'Outras Jornadas')}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${
              selectedShift === 'Outras Jornadas' ? 'bg-rose-100 border-rose-400 font-bold' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <span className="text-[10px] text-slate-500 font-bold uppercase block">Outras Jornadas</span>
            <span className="text-lg font-black text-slate-900">{birthdayData.byShift['Outras Jornadas'] || 0} colab.</span>
          </div>
        </div>

        {/* Barra de Filtro e Busca de Aniversariantes */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-slate-500 mr-1">Filtrar Turno:</span>
            {['all', 'Turno A', 'Turno B', 'Turno C', 'Administrativo', 'Outras Jornadas'].map(s => (
              <button
                key={s}
                onClick={() => setSelectedShift(s)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  selectedShift === s
                    ? 'bg-[#0a3641] text-[#6ffbbe] shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {s === 'all' ? 'Todos os Turnos' : s}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar aniversariante, setor..."
              value={birthdaySearch}
              onChange={(e) => setBirthdaySearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-[#f8f9ff] text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#306576]"
            />
          </div>
        </div>

        {/* Tabela dos Aniversariantes do Mês */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200/90 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#eff4ff] text-[#306576] uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="py-2.5 px-3 text-center min-w-[70px]">Dia</th>
                <th className="py-2.5 px-3">Colaborador(a)</th>
                <th className="py-2.5 px-2 text-center">Gênero</th>
                <th className="py-2.5 px-3">Local / Setor Fabril</th>
                <th className="py-2.5 px-3">Turno / Escala</th>
                <th className="py-2.5 px-3">Gestor Imediato</th>
                <th className="py-2.5 px-3 text-center">Tempo de Casa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredBirthdays.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Nenhum aniversariante encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredBirthdays.map(({ emp, dayFormatted, isFemale, tenureYears }) => (
                  <tr key={emp.prn} className="hover:bg-purple-50/30 transition-colors">
                    
                    {/* Dia com Badge Comemorativo */}
                    <td className="py-2.5 px-3 text-center">
                      <span className="inline-flex items-center gap-1 font-mono font-black text-xs px-2.5 py-1 rounded-lg bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-900 border border-purple-200 shadow-2xs">
                        🎂 {dayFormatted}
                      </span>
                    </td>

                    {/* Nome do Colaborador */}
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-[#0b1c30] block">{emp.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">PRN: {emp.prn} • {emp.jobTitle}</span>
                    </td>

                    {/* Gênero */}
                    <td className="py-2.5 px-2 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isFemale ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-sky-50 text-sky-800 border border-sky-100'
                      }`}>
                        {isFemale ? '👩 Fem' : '👨 Masc'}
                      </span>
                    </td>

                    {/* Setor */}
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      {emp.locationName}
                    </td>

                    {/* Turno */}
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

                    {/* Gestor */}
                    <td className="py-2.5 px-3 text-slate-600">
                      {emp.immediateManager}
                    </td>

                    {/* Tempo de Casa */}
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

      {/* ========================================================================= */}
      {/* 4. TABELA DE CÉLULAS OPERACIONAIS E POSTOS CRÍTICOS */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
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
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
  );
};
