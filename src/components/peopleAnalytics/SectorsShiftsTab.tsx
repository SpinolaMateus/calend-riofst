import React, { useState } from 'react';
import { 
  Clock, Users, Factory, Layers, AlertTriangle, 
  CheckCircle2, Search, Filter, ShieldCheck, ChevronRight
} from 'lucide-react';
import { Employee, ShiftCategory } from '../../types/peopleAnalytics';

interface SectorsShiftsTabProps {
  employees: Employee[];
}

export const SectorsShiftsTab: React.FC<SectorsShiftsTabProps> = ({ employees }) => {
  const [selectedShift, setSelectedShift] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

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
              Gestão de contingente, postos críticos e escalas de trabalho da planta KBA1 Feira de Santana
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
      {/* 2. OS 5 CARDS DAS ESCALAS DE TURNO */}
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
                <span>Horas Extras:</span>
                <strong className={grp.id === 'Turno C' ? 'text-amber-900 font-bold' : 'text-slate-700'}>{grp.otRate}</strong>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* 3. TABELA DE CÉLULAS OPERACIONAIS E POSTOS CRÍTICOS */}
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

