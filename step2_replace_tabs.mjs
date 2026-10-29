import fs from 'fs';

const orig = fs.readFileSync('src/components/PeopleAnalyticsView.tsx', 'utf8');

// Find boundaries
const returnIdx = orig.indexOf('  return (\n    <div id="people-analytics-capture-area"');
if (returnIdx === -1) {
  console.log('returnIdx not matched with exact whitespace, trying regex');
}

const lines = orig.split('\n');
let returnLineIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('return (') && lines[i+1]?.includes('people-analytics-capture-area')) {
    returnLineIdx = i;
    break;
  }
}
console.log('return line:', returnLineIdx);

// Find where {activeTab === 'headcount' starts
let headcountLineIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("{activeTab === 'headcount' && (")) {
    headcountLineIdx = i;
    break;
  }
}
console.log('headcount line:', headcountLineIdx);

// Find where {activeTab === 'trainings' starts and {activeTab === 'action_plans'
let trainingsLineIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("{activeTab === 'trainings' && (")) {
    trainingsLineIdx = i;
    break;
  }
}
console.log('trainings line:', trainingsLineIdx);

// Everything before returnLineIdx is component setup, state, memo, filters, handlers.
const componentHead = lines.slice(0, returnLineIdx).join('\n');

// Quadro de pessoal (headcount) from headcountLineIdx to next tab {activeTab === 'jobs_shifts'
// Wait, let's see the order of tabs in original:
// 854: overview
// 1280: headcount
// 1371: jobs_shifts
// 1427: indicators
// 1517: absenteeism
// 1565: movements
// 1612: trainings
// 1652: action_plans
// 1704: data_entry

let jobsShiftsLineIdx = -1;
let indicatorsLineIdx = -1;
let absenteeismLineIdx = -1;
let movementsLineIdx = -1;
let actionPlansLineIdx = -1;
let dataEntryLineIdx = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("{activeTab === 'jobs_shifts' && (")) jobsShiftsLineIdx = i;
  if (lines[i].includes("{activeTab === 'indicators' && (")) indicatorsLineIdx = i;
  if (lines[i].includes("{activeTab === 'absenteeism' && (")) absenteeismLineIdx = i;
  if (lines[i].includes("{activeTab === 'movements' && (")) movementsLineIdx = i;
  if (lines[i].includes("{activeTab === 'action_plans' && (")) actionPlansLineIdx = i;
  if (lines[i].includes("{activeTab === 'data_entry' && (")) dataEntryLineIdx = i;
}

console.log({
  headcountLineIdx,
  jobsShiftsLineIdx,
  indicatorsLineIdx,
  absenteeismLineIdx,
  movementsLineIdx,
  trainingsLineIdx,
  actionPlansLineIdx,
  dataEntryLineIdx
});

// We want to keep:
// - Headcount block: lines headcountLineIdx to jobsShiftsLineIdx - 1
// - Trainings block: lines trainingsLineIdx to actionPlansLineIdx - 1
// - ActionPlans block: lines actionPlansLineIdx to dataEntryLineIdx - 1
// - DataEntry block: from dataEntryLineIdx to end of tabs

const headcountBlock = lines.slice(headcountLineIdx, jobsShiftsLineIdx - 2).join('\n');
const trainingsBlock = lines.slice(trainingsLineIdx, actionPlansLineIdx - 2).join('\n');
const actionPlansBlock = lines.slice(actionPlansLineIdx, dataEntryLineIdx - 2).join('\n');

// Find where dataEntry ends (before modal / KPI modal)
let kpiModalLineIdx = -1;
for (let i = dataEntryLineIdx; i < lines.length; i++) {
  if (lines[i].includes("{isKPIModalOpen && selectedKPI && (")) {
    kpiModalLineIdx = i;
    break;
  }
}
console.log('kpiModalLineIdx:', kpiModalLineIdx);

const dataEntryBlock = lines.slice(dataEntryLineIdx, kpiModalLineIdx - 2).join('\n');
const modalsAndTail = lines.slice(kpiModalLineIdx).join('\n');

console.log('Blocks sliced successfully!');

// Now build the new component body
const newBody = `${componentHead}
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

      <aside className={\`fixed inset-y-0 left-0 z-50 w-72 bg-[#0a3641] text-white flex flex-col justify-between shadow-2xl transition-transform duration-200 lg:translate-x-0 \${
        isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }\`}>
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
              { id: 'headcount', label: \`Quadro de Pessoal (\${filteredEmployees.length})\`, icon: Users },
              { id: 'jobs_shifts', label: 'Setores & Turnos', icon: Clock },
              { id: 'indicators', label: 'Indicadores G&G (9)', icon: TrendingUp },
              { id: 'absenteeism', label: 'Absenteísmo & Movimentações', icon: TrendingDown },
              { id: 'trainings', label: 'Treinamento & DHO', icon: Layers },
              { id: 'action_plans', label: 'Inteligência Analítica', icon: AlertTriangle },
              { id: 'data_entry', label: 'Entrada de Dados', icon: UploadCloud },
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
                  className={\`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all \${
                    isActive
                      ? 'bg-[#306576] text-white border-l-4 border-[#6ffbbe] shadow-sm'
                      : 'text-[#a5cdda] hover:bg-[#306576]/40 hover:text-white'
                  }\`}
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

          {/* ABA 2: QUADRO DE PESSOAL */}
          {activeTab === 'headcount' && (
            ${headcountBlock.replace("{activeTab === 'headcount' && (", '').replace(/\n\s*\)\}\s*$/, '')}
          )}

          {/* ABA 3: SETORES & TURNOS */}
          {activeTab === 'jobs_shifts' && (
            <SectorsShiftsTab employees={filteredEmployees} />
          )}

          {/* ABA 4: INDICADORES G&G (OFICIAIS COM BENTO GRID E MATRIZ 1/3/5) */}
          {activeTab === 'indicators' && (
            <IndicatorsGGTab
              kpis={kpis}
              onOpenAuditModal={() => setIsAuditModalOpen(true)}
              onEditKPI={(kpi) => {
                setSelectedKPI(kpi);
                setKpiActualInput(String(kpi.actual !== null ? kpi.actual : ''));
                setIsKPIModalOpen(true);
              }}
            />
          )}

          {/* ABA 5 & 6: ABSENTEÍSMO & MOVIMENTAÇÕES */}
          {(activeTab === 'absenteeism' || activeTab === 'movements') && (
            <AbsenteeismMovementsTab />
          )}

          {/* ABA 7: TREINAMENTO & DHO */}
          {activeTab === 'trainings' && (
            ${trainingsBlock.replace("{activeTab === 'trainings' && (", '').replace(/\n\s*\)\}\s*$/, '')}
          )}

          {/* ABA 8: INTELIGÊNCIA ANALÍTICA & PLANOS DE AÇÃO */}
          {activeTab === 'action_plans' && (
            ${actionPlansBlock.replace("{activeTab === 'action_plans' && (", '').replace(/\n\s*\)\}\s*$/, '')}
          )}

          {/* ABA 9: ENTRADA DE DADOS & IMPORTAÇÃO EXCEL */}
          {activeTab === 'data_entry' && (
            ${dataEntryBlock.replace("{activeTab === 'data_entry' && (", '').replace(/\n\s*\)\}\s*$/, '')}
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

${modalsAndTail}
`;

fs.writeFileSync('src/components/PeopleAnalyticsView.tsx', newBody);
console.log('PeopleAnalyticsView updated with full high-fidelity layout!');

