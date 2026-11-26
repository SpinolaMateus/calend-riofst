import React, { useRef, useState } from 'react';
import { 
  FileDown, Printer, FileSpreadsheet, Upload, Copy,
  Palette, Settings, RotateCcw, Plus, Calendar, 
  Tv, Table as TableIcon, Clock, ChevronDown, ListChecks,
  Cloud, Save, RefreshCw, CheckCircle2, Camera, Columns3
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
  onSyncCloud?: () => void;
  isCloudSyncing?: boolean;
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
  onSyncCloud,
  isCloudSyncing = false,
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
    <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-40">
      {/* Top Branding & Action Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        {/* Unit Info & Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm tracking-tight shrink-0">
            CI
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-base font-bold text-slate-900 tracking-tight">
                {unitInfo.unitName}
              </h1>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                <span className={`w-1.5 h-1.5 rounded-full ${isCloudSyncing ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                {isCloudSyncing ? 'Sincronizando...' : 'Nuvem conectada'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {unitInfo.cohortName} • <span className="text-slate-700 font-medium">{unitInfo.period}</span>
            </p>
          </div>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto justify-end">
          {/* Cloud Save Button */}
          {onSyncCloud && (
            <button
              type="button"
              onClick={onSyncCloud}
              disabled={isCloudSyncing}
              data-capture-ignore
              title="Salvar e sincronizar todas as atividades no Supabase"
              className="h-8 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {isCloudSyncing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-500" />
              ) : (
                <Save className="w-3.5 h-3.5 text-emerald-600" />
              )}
              <span>{isCloudSyncing ? 'Salvando...' : 'Salvar'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onCopyAsImage}
            disabled={isCopyingImage}
            data-capture-ignore
            className="h-8 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
            title="Tirar print completo de toda a tabela (copia para área de transferência e baixa PNG)"
          >
            <Camera className="w-3.5 h-3.5 text-slate-500" />
            <span>{isCopyingImage ? 'Capturando...' : 'Print'}</span>
          </button>

          {/* Quick PDF Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={isExportingPDF}
              className="h-8 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <FileDown className="w-3.5 h-3.5 text-slate-500" />
              <span>{isExportingPDF ? 'Gerando...' : 'PDF'}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showExportMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowExportMenu(false)}
                />
                <div className="absolute right-0 mt-1 w-56 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50 text-xs">
                  <button
                    onClick={() => {
                      setShowExportMenu(false);
                      onExportPDF();
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 font-medium text-slate-700"
                  >
                    <FileDown className="w-4 h-4 text-slate-500" />
                    <div>
                      <div className="font-semibold text-slate-900">Baixar PDF</div>
                      <div className="text-[10px] text-slate-400">Download direto (.pdf)</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setShowExportMenu(false);
                      onPrintPDF();
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 font-medium text-slate-700 border-t border-slate-100"
                  >
                    <Printer className="w-4 h-4 text-slate-500" />
                    <div>
                      <div className="font-semibold text-slate-900">Imprimir / Salvar em PDF</div>
                      <div className="text-[10px] text-slate-400">Impressão vetorial do navegador</div>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Excel Export */}
          <button
            onClick={onExportExcel}
            className="h-8 px-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
            title="Baixar planilha Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" /> Excel
          </button>

          {/* Excel Import */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="h-8 px-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
            title="Importar planilha XLS ou XLSX"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" /> Importar
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* New Activity Button (Primary CTA) */}
          <button
            onClick={onOpenNewSession}
            className="h-8 px-3.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Nova Atividade
          </button>

          {/* Secondary Tools */}
          <div className="flex items-center gap-0.5 border-l border-slate-200 pl-1.5 ml-0.5">
            <button
              onClick={onOpenAreaManager}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Gerenciar cores e áreas"
            >
              <Palette className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenUnitSettings}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Configurações da Unidade"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={onResetDefault}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Restaurar dados originais da planilha"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium text-slate-500 mr-1">Agenda:</span>
          {INTEGRATION_AUDIENCES.map((audience) => (
            <button
              key={audience.id}
              type="button"
              onClick={() => onSelectAudience(audience.id)}
              aria-pressed={selectedAudience === audience.id}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-colors ${
                selectedAudience === audience.id
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {audience.label}
              <span className={`ml-1.5 text-[11px] ${selectedAudience === audience.id ? 'text-slate-300' : 'text-slate-400'}`}>
                {audienceCounts[audience.id]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Sub-bar: View Modes & Days Filter */}
      <div className="bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center justify-between gap-3">
          {/* View Mode Buttons */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-200/70 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => onChangeViewMode('table')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Tabela XLS</span>
            </button>

            <button
              onClick={() => onChangeViewMode('timeline')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                viewMode === 'timeline'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Colunas por Dia</span>
            </button>

            <button
              onClick={() => onChangeViewMode('weekly-grid')}
              aria-pressed={viewMode === 'weekly-grid'}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                viewMode === 'weekly-grid'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Columns3 className="w-3.5 h-3.5" />
              <span>Grade por Área</span>
            </button>

            <button
              onClick={() => onChangeViewMode('status')}
              aria-pressed={viewMode === 'status'}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                viewMode === 'status'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListChecks className="w-3.5 h-3.5" />
              <span>Status</span>
            </button>

            <button
              onClick={() => onChangeViewMode('display')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                viewMode === 'display'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>Mural TV</span>
            </button>
          </div>

          {/* Days Filter Tabs */}
          <div className="flex items-center gap-1">
            <span className="text-xs font-medium text-slate-500 mr-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Dia:
            </span>
            <button
              onClick={() => onSelectDay('all')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                selectedDay === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Todos
            </button>
            {availableDays.map((d) => (
              <button
                key={d}
                onClick={() => onSelectDay(d)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                  selectedDay === d
                    ? 'bg-slate-900 text-white'
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
