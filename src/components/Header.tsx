import React, { useRef, useState } from 'react';
import { 
  FileDown, Printer, FileSpreadsheet, Upload, Copy,
  Palette, Settings, RotateCcw, Plus, Calendar, 
  Tv, Table as TableIcon, Clock, ChevronDown
} from 'lucide-react';
import { INTEGRATION_AUDIENCES, IntegrationAudience, UnitInfo, ViewMode } from '../types/schedule';

interface HeaderProps {
  unitInfo: UnitInfo;
  viewMode: ViewMode;
  onChangeViewMode: (mode: ViewMode) => void;
  selectedDay: number | 'all';
  onSelectDay: (day: number | 'all') => void;
  availableDays: number[];
  selectedAudience: IntegrationAudience;
  audienceCounts: Record<IntegrationAudience, number>;
  onSelectAudience: (audience: IntegrationAudience) => void;
  onOpenNewSession: () => void;
  onExportPDF: () => void;
  onPrintPDF: () => void;
  onCopyAsImage: () => void;
  isCopyingImage: boolean;
  onExportExcel: () => void;
  onImportExcel: (file: File) => void;
  onOpenAreaManager: () => void;
  onOpenUnitSettings: () => void;
  onResetDefault: () => void;
  isExportingPDF: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  unitInfo,
  viewMode,
  onChangeViewMode,
  selectedDay,
  onSelectDay,
  availableDays,
  selectedAudience,
  audienceCounts,
  onSelectAudience,
  onOpenNewSession,
  onExportPDF,
  onPrintPDF,
  onCopyAsImage,
  isCopyingImage,
  onExportExcel,
  onImportExcel,
  onOpenAreaManager,
  onOpenUnitSettings,
  onResetDefault,
  isExportingPDF,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImportExcel(e.target.files[0]);
      e.target.value = '';
    }
  };

  return (
    <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      {/* Top Branding & Action Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Unit Info & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-700 via-indigo-600 to-purple-600 text-white flex items-center justify-center font-black text-lg shadow-md shrink-0">
            CI
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-slate-900 tracking-tight">
                {unitInfo.unitName}
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200/60">
                Divulgação Oficial
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {unitInfo.cohortName} • <span className="text-slate-700 font-semibold">{unitInfo.period}</span>
            </p>
          </div>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={onCopyAsImage}
            disabled={isCopyingImage}
            data-capture-ignore
            className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
            title="Copiar a agenda completa como imagem"
          >
            <Copy className="w-4 h-4" />
            {isCopyingImage ? 'Capturando...' : 'Copiar como imagem'}
          </button>

          {/* New Activity Button */}
          <button
            onClick={onOpenNewSession}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm hover:shadow-md transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" /> Nova Atividade
          </button>

          {/* Quick PDF Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={isExportingPDF}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
            >
              <FileDown className="w-4 h-4" />
              <span>{isExportingPDF ? 'Gerando...' : 'Exportar PDF'}</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-80" />
            </button>

            {showExportMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowExportMenu(false)}
                />
                <div className="absolute right-0 mt-1 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 text-xs animate-in fade-in zoom-in-95">
                  <button
                    onClick={() => {
                      setShowExportMenu(false);
                      onExportPDF();
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 font-medium text-slate-700"
                  >
                    <FileDown className="w-4 h-4 text-rose-600" />
                    <div>
                      <div className="font-bold text-slate-900">Baixar PDF Imediato</div>
                      <div className="text-[10px] text-slate-400">Download em 1 clique (.pdf)</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setShowExportMenu(false);
                      onPrintPDF();
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 font-medium text-slate-700 border-t border-slate-100"
                  >
                    <Printer className="w-4 h-4 text-indigo-600" />
                    <div>
                      <div className="font-bold text-slate-900">Imprimir / Salvar em PDF</div>
                      <div className="text-[10px] text-slate-400">Qualidade vetorial sem perda</div>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Excel Export */}
          <button
            onClick={onExportExcel}
            className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
            title="Baixar planilha Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4" /> Excel
          </button>

          {/* Excel Import */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-2xs"
            title="Importar planilha XLS ou XLSX"
          >
            <Upload className="w-4 h-4 text-slate-500" /> Importar XLS
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Secondary Tools */}
          <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
            <button
              onClick={onOpenAreaManager}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Gerenciar cores e áreas"
            >
              <Palette className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenUnitSettings}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Configurações da Unidade"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={onResetDefault}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Restaurar dados originais da planilha"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 mr-1">Agenda:</span>
          {INTEGRATION_AUDIENCES.map((audience) => (
            <button
              key={audience.id}
              type="button"
              onClick={() => onSelectAudience(audience.id)}
              aria-pressed={selectedAudience === audience.id}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                selectedAudience === audience.id
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-indigo-50 hover:text-indigo-700'
              }`}
            >
              {audience.label}
              <span className={`ml-1.5 ${selectedAudience === audience.id ? 'text-indigo-100' : 'text-slate-400'}`}>
                {audienceCounts[audience.id]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Sub-bar: View Modes & Days Filter */}
      <div className="bg-slate-50/80 border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3">
          {/* View Mode Buttons */}
          <div className="flex items-center bg-slate-200/80 p-0.5 rounded-xl border border-slate-300/60 shadow-2xs">
            <button
              onClick={() => onChangeViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'table'
                  ? 'bg-black text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Tabela XLS (Modelo Original)</span>
            </button>

            <button
              onClick={() => onChangeViewMode('timeline')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'timeline'
                  ? 'bg-black text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Cronograma Visual (Colunas por Dia)</span>
            </button>

            <button
              onClick={() => onChangeViewMode('display')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'display'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>Tela de Divulgação (TV / Mural)</span>
            </button>
          </div>

          {/* Days Filter Tabs */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Dia:
            </span>
            <button
              onClick={() => onSelectDay('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                selectedDay === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Todos os Dias
            </button>
            {availableDays.map((d) => (
              <button
                key={d}
                onClick={() => onSelectDay(d)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  selectedDay === d
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                Dia {d}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};
