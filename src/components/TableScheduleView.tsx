import React, { useState, useEffect, useRef } from 'react';
import { 
  Edit2, Copy, Trash2, Search, Filter, 
  ChevronDown, Plus, Check, ArrowUpDown, 
  Trash, ArrowUp, ArrowDown, Scissors, ClipboardList,
  GripVertical, Calendar
} from 'lucide-react';
import { AreaDefinition, IntegrationSession } from '../types/schedule';
import { 
  parseTimeRange, calculateCH, formatTimeRange, 
  chToMinutes, minutesToTime, timeToMinutes, syncSessionTimeAndCH,
  sortSessionsByDayAndTime
} from '../utils/timeUtils';

interface TableScheduleViewProps {
  sessions: IntegrationSession[];
  areas: AreaDefinition[];
  selectedDay: number | 'all';
  onUpdateSession: (updated: IntegrationSession) => void;
  onDeleteSession: (id: string) => void;
  onDuplicateSession: (session: IntegrationSession) => void;
  onEditSession: (session: IntegrationSession) => void;
  onAddNewSession: (dia?: number) => void;
  onReorderSessions?: (reorderedSessions: IntegrationSession[]) => void;
}

export const TableScheduleView: React.FC<TableScheduleViewProps> = ({
  sessions,
  areas,
  selectedDay,
  onUpdateSession,
  onDeleteSession,
  onDuplicateSession,
  onEditSession,
  onAddNewSession,
  onReorderSessions,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAreaFilter, setSelectedAreaFilter] = useState<string>('all');
  const [editingCell, setEditingCell] = useState<{ id: string; field: keyof IntegrationSession } | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  // Drag and drop state
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // Selected row state (like selecting row 4 in Excel)
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  // Context menu state (like right-clicking row in Excel)
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    session: IntegrationSession | null;
    rowIndex: number;
  }>({
    visible: false,
    x: 0,
    y: 0,
    session: null,
    rowIndex: -1,
  });

  const contextMenuRef = useRef<HTMLDivElement | null>(null);

  // Close context menu on click outside or escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu((prev) => ({ ...prev, visible: false }));
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setContextMenu((prev) => ({ ...prev, visible: false }));
      }
      // If a row is selected and user presses Delete or Backspace
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedRowId && !editingCell) {
        const target = sessions.find((s) => s.id === selectedRowId);
        if (target) {
          if (window.confirm(`Deseja excluir a linha "${target.tema}" (Dia ${target.dia})?`)) {
            onDeleteSession(selectedRowId);
            setSelectedRowId(null);
          }
        }
      }
    };

    window.addEventListener('click', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('click', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedRowId, sessions, editingCell, onDeleteSession]);

  // Helper to get area styling
  const getAreaDef = (areaName: string) => {
    return areas.find((a) => a.name.toLowerCase() === areaName.toLowerCase());
  };

  // Filter and automatically group/sort sessions strictly by Day and Time
  const filteredSessions = sortSessionsByDayAndTime(
    sessions.filter((s) => {
      if (selectedDay !== 'all' && s.dia !== Number(selectedDay)) return false;
      if (selectedAreaFilter !== 'all' && s.area.toLowerCase() !== selectedAreaFilter.toLowerCase()) return false;
      if (!searchQuery.trim()) return true;

      const query = searchQuery.toLowerCase();
      return (
        s.tema.toLowerCase().includes(query) ||
        s.responsavel.toLowerCase().includes(query) ||
        s.area.toLowerCase().includes(query) ||
        s.local.toLowerCase().includes(query) ||
        s.codigo.toLowerCase().includes(query) ||
        s.entregavel.toLowerCase().includes(query) ||
        s.prn.toLowerCase().includes(query) ||
        (s.horarioText || '').toLowerCase().includes(query)
      );
    })
  );

  const handleStartInlineEdit = (s: IntegrationSession, field: keyof IntegrationSession) => {
    setEditingCell({ id: s.id, field });
    setEditValue(String(s[field] || ''));
  };

  const handleSaveInlineEdit = (session: IntegrationSession) => {
    if (!editingCell) return;

    let updatedSession: IntegrationSession = {
      ...session,
      [editingCell.field]: editValue,
    };

    if (editingCell.field === 'horarioText') {
      const parsed = parseTimeRange(editValue);
      if (parsed) {
        const newCh = calculateCH(parsed.startTime, parsed.endTime);
        updatedSession = {
          ...updatedSession,
          startTime: parsed.startTime,
          endTime: parsed.endTime,
          horarioText: formatTimeRange(parsed.startTime, parsed.endTime),
          ch: newCh,
        };
      }
    } else if (editingCell.field === 'ch') {
      const minutes = chToMinutes(editValue);
      if (minutes > 0 && session.startTime) {
        const startMins = timeToMinutes(session.startTime);
        const newEndMins = startMins + minutes;
        const newEndTime = minutesToTime(newEndMins);
        updatedSession = {
          ...updatedSession,
          endTime: newEndTime,
          horarioText: formatTimeRange(session.startTime, newEndTime),
          ch: calculateCH(session.startTime, newEndTime),
        };
      }
    }

    // Garante que o horário sempre sincronize com o cronograma visual e que a diferença entre início e fim reflita o CH
    const synchronized = syncSessionTimeAndCH(updatedSession);
    onUpdateSession(synchronized);
    setEditingCell(null);
  };

  // Handle right-click on row (Excel Context Menu)
  const handleContextMenu = (e: React.MouseEvent, session: IntegrationSession, index: number) => {
    e.preventDefault();
    setSelectedRowId(session.id);
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      session,
      rowIndex: index + 1,
    });
  };

  // Action: Insert row above or below
  const handleInsertRowAdjacent = (session: IntegrationSession, position: 'above' | 'below') => {
    onAddNewSession(session.dia);
  };

  // Delete row with confirmation
  const handleDeleteRow = (sessionId: string, topicName: string) => {
    if (window.confirm(`Deseja excluir a linha "${topicName}" da planilha?`)) {
      onDeleteSession(sessionId);
      if (selectedRowId === sessionId) {
        setSelectedRowId(null);
      }
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverId !== id) {
      setDragOverId(id);
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }

    const fromIndex = sessions.findIndex((s) => s.id === draggedId);
    const toIndex = sessions.findIndex((s) => s.id === targetId);

    if (fromIndex !== -1 && toIndex !== -1) {
      const targetSession = sessions[toIndex];
      const draggedSession = sessions[fromIndex];

      const reordered = [...sessions];
      const [removed] = reordered.splice(fromIndex, 1);
      
      // Se moveu para dentro de um dia específico, ajusta o dia automaticamente se desejar
      const updatedItem = {
        ...removed,
        dia: targetSession.dia, // herda o dia da linha onde foi solto!
      };
      
      reordered.splice(toIndex, 0, updatedItem);

      if (onReorderSessions) {
        onReorderSessions(reordered);
      } else {
        // Fallback: se onReorderSessions não for passado, atualiza a sessão individualmente
        onUpdateSession(updatedItem);
      }
    }

    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  // Mudar dia rapidamente
  const handleChangeDay = (session: IntegrationSession, newDay: number) => {
    const updated: IntegrationSession = {
      ...session,
      dia: newDay,
    };
    onUpdateSession(updated);
  };

  const selectedSession = sessions.find((s) => s.id === selectedRowId);

  return (
    <div className="space-y-3">
      {/* Excel Ribbon Action Bar (no-print) */}
      <div className="no-print bg-slate-100 border border-slate-300 p-2.5 rounded-xl shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Left: Excel-like Row Manipulation Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Delete Row Button (Highlighted if row is selected) */}
          <button
            onClick={() => {
              if (selectedSession) {
                handleDeleteRow(selectedSession.id, selectedSession.tema);
              } else {
                alert('Selecione primeiro uma linha da tabela (clique no número da linha ou no corpo) para excluir.');
              }
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs ${
              selectedSession
                ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                : 'bg-white hover:bg-red-50 text-red-600 border border-red-200'
            }`}
            title="Excluir linha selecionada (ou aperte a tecla Del)"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>
              {selectedSession ? `Excluir Linha Selecionada (${selectedSession.tema.slice(0, 20)}...)` : 'Excluir Linha'}
            </span>
            <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.2 bg-black/20 text-[10px] rounded font-mono">
              Del
            </kbd>
          </button>

          {/* Insert Row Button */}
          <button
            onClick={() => onAddNewSession(selectedSession ? selectedSession.dia : (selectedDay === 'all' ? 1 : Number(selectedDay)))}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-600" />
            <span>Inserir Linha</span>
          </button>

          {/* Duplicate Row Button */}
          {selectedSession && (
            <button
              onClick={() => onDuplicateSession(selectedSession)}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
            >
              <Copy className="w-3.5 h-3.5 text-indigo-600" />
              <span>Duplicar Linha</span>
            </button>
          )}

          {/* Search Box */}
          <div className="relative min-w-[200px] ml-2">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Localizar na planilha..."
              className="w-full bg-white border border-slate-300 rounded-lg pl-8 pr-2.5 py-1 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-black"
            />
          </div>

          {/* Area Filter */}
          <div className="flex items-center gap-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedAreaFilter}
              onChange={(e) => setSelectedAreaFilter(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-medium text-slate-700 focus:outline-hidden"
            >
              <option value="all">Todas as Áreas ({sessions.length})</option>
              {areas.map((a) => (
                <option key={a.id} value={a.name}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right Info and Quick Hint */}
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="hidden lg:inline bg-white px-2.5 py-1 rounded-md border border-slate-200 text-[11px]">
            ✋ <strong>Arrastar e Soltar:</strong> Arraste qualquer linha pelo ícone <GripVertical className="w-3 h-3 inline text-slate-400" /> para reordenar ou mudar de dia.
          </span>
          <span>
            Total: <strong>{filteredSessions.length}</strong> linhas
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SPREADSHEET TABLE - FAITHFUL TO THE USER'S EXCEL IMAGE */}
      {/* ========================================================================= */}
      <div 
        id="print-table-section" 
        className="bg-white border-2 border-black shadow-md overflow-visible print-container select-text"
      >
        <div className="w-full overflow-visible">
          <table className="w-full border-collapse text-xs font-sans table-auto">
            {/* Table Header: Solid Black with Excel Dropdown Buttons */}
            <thead>
              <tr className="bg-black text-white font-bold tracking-wider uppercase text-[11px] divide-x divide-slate-600 border-b-2 border-black select-none">
                {/* Excel Row Index Header (#) */}
                <th className="py-1.5 px-1 w-9 text-center bg-slate-900 border-r border-slate-700 text-slate-300 text-[10px]">
                  #
                </th>

                {/* DIA */}
                <th className="py-1.5 px-1 w-12 text-center bg-black">
                  <span>DIA</span>
                </th>

                {/* HORÁRIO */}
                <th className="py-1.5 px-1.5 text-center bg-black whitespace-nowrap">
                  <span>HORÁRIO</span>
                </th>

                {/* CH */}
                <th className="py-1.5 px-1 text-center bg-black whitespace-nowrap">
                  <span>CH</span>
                </th>

                {/* TEMA */}
                <th className="py-1.5 px-2 text-center bg-black">
                  <span>TEMA</span>
                </th>

                {/* ÁREA */}
                <th className="py-1.5 px-1.5 text-center bg-black">
                  <span>ÁREA</span>
                </th>

                {/* RESPONSÁVEL */}
                <th className="py-1.5 px-1.5 text-center bg-black">
                  <span>RESPONSÁVEL</span>
                </th>

                {/* PRN */}
                <th className="py-1.5 px-1 text-center bg-black">
                  <span>PRN</span>
                </th>

                {/* LOCAL */}
                <th className="py-1.5 px-1.5 text-center bg-black">
                  <span>LOCAL</span>
                </th>

                {/* CÓDIGO */}
                <th className="py-1.5 px-1 text-center bg-black">
                  <span>CÓDIGO</span>
                </th>

                {/* ENTREGÁVEL */}
                <th className="py-1.5 px-1.5 text-center bg-black">
                  <span>ENTREGÁVEL</span>
                </th>

                {/* AÇÕES (no-print) */}
                <th className="py-1.5 px-1 w-12 text-center bg-black no-print">
                  <span>AÇÕES</span>
                </th>
              </tr>
            </thead>

            {/* Table Rows */}
            <tbody className="divide-y divide-black border-b border-black">
              {filteredSessions.map((s, index) => {
                const isLunch = s.tema.trim().toUpperCase() === 'ALMOÇO';
                const areaDef = getAreaDef(s.area);
                const isSelected = selectedRowId === s.id;

                // Specific Area Colors matching the image exactly
                let areaBg = '#ffffff';
                let areaColor = '#000000';

                const upperArea = (s.area || '').toUpperCase();
                if (upperArea.includes('GENTE E GESTÃO')) {
                  areaBg = '#6b21a8';
                  areaColor = '#ffffff';
                } else if (upperArea.includes('FACILITIES')) {
                  areaBg = '#2563eb';
                  areaColor = '#ffffff';
                } else if (upperArea.includes('SAÚDE')) {
                  areaBg = '#00c04b';
                  areaColor = '#ffffff';
                } else if (upperArea.includes('SEGURANÇA')) {
                  areaBg = '#f59e0b';
                  areaColor = '#000000';
                } else if (upperArea.includes('SUPERAR')) {
                  areaBg = '#384354';
                  areaColor = '#ffffff';
                } else if (upperArea.includes('PRODUÇÃO')) {
                  areaBg = '#e45b17';
                  areaColor = '#ffffff';
                } else if (upperArea.includes('QUALIDADE')) {
                  areaBg = '#c2410c';
                  areaColor = '#ffffff';
                } else if (upperArea.includes('TI')) {
                  areaBg = '#ffffff';
                  areaColor = '#000000';
                } else if (areaDef) {
                  areaBg = areaDef.bgColor;
                  areaColor = areaDef.textColor;
                }

                // If lunch, the entire row is solid black with white text!
                if (isLunch) {
                  return (
                    <tr
                      key={s.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, s.id)}
                      onDragOver={(e) => handleDragOver(e, s.id)}
                      onDrop={(e) => handleDrop(e, s.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => setSelectedRowId(s.id)}
                      onContextMenu={(e) => handleContextMenu(e, s, index)}
                      className={`bg-black text-white font-bold divide-x divide-slate-700 transition-colors cursor-pointer ${
                        dragOverId === s.id ? 'border-t-4 border-indigo-400 bg-slate-800' : ''
                      } ${
                        draggedId === s.id ? 'opacity-40' : ''
                      } ${
                        isSelected ? 'ring-2 ring-indigo-400 bg-slate-900' : 'hover:bg-slate-900'
                      }`}
                    >
                      {/* Excel Row Index (#) + Drag Handle */}
                      <td className="py-2 px-1 text-center font-mono text-[10px] text-slate-400 bg-slate-950 border-r border-slate-800 select-none cursor-grab active:cursor-grabbing" title="Arraste para mover esta linha">
                        <div className="flex items-center justify-center gap-0.5">
                          <GripVertical className="w-3 h-3 text-slate-600 hover:text-white" />
                          <span>{index + 1}</span>
                        </div>
                      </td>

                      {/* DIA com seletor interativo */}
                      <td className="py-2.5 px-2 text-center text-2xl font-black border-r border-slate-700 relative group">
                        <select
                          value={s.dia}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleChangeDay(s, Number(e.target.value));
                          }}
                          className="bg-transparent text-white font-black text-xl text-center focus:outline-hidden cursor-pointer hover:bg-slate-800 rounded px-1"
                          title="Clique para alterar o Dia desta atividade"
                        >
                          {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                            <option key={d} value={d} className="bg-slate-900 text-white font-bold text-sm">
                              Dia {d}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* HORÁRIO */}
                      <td className="py-2 px-1.5 text-center font-bold border-r border-slate-700 whitespace-nowrap text-[11px]">
                        {s.horarioText || `${s.startTime} às ${s.endTime}`}
                      </td>

                      {/* CH */}
                      <td className="py-2 px-1 text-center font-bold border-r border-slate-700 text-[11px]">
                        {s.ch || '1h'}
                      </td>

                      {/* TEMA */}
                      <td className="py-2 px-2 text-center tracking-widest font-black border-r border-slate-700 text-xs">
                        ALMOÇO
                      </td>

                      {/* ÁREA */}
                      <td className="py-2 px-1.5 text-center font-bold border-r border-slate-700 text-[11px]">
                        N/A
                      </td>

                      {/* RESPONSÁVEL */}
                      <td className="py-2 px-1.5 text-center border-r border-slate-700 text-[11px]">
                        N/A
                      </td>

                      {/* PRN */}
                      <td className="py-2 px-1 text-center border-r border-slate-700 text-[11px]">
                        N/A
                      </td>

                      {/* LOCAL */}
                      <td className="py-2 px-1.5 text-center border-r border-slate-700 text-[11px]">
                        Refeitório
                      </td>

                      {/* CÓDIGO */}
                      <td className="py-2 px-1 text-center border-r border-slate-700 text-[11px]">
                        N/A
                      </td>

                      {/* ENTREGÁVEL */}
                      <td className="py-2 px-1.5 text-center border-r border-slate-700 text-[11px]">
                        N/A
                      </td>

                      {/* AÇÕES (no-print) */}
                      <td className="py-2.5 px-1 text-center no-print">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditSession(s);
                            }}
                            className="p-1 hover:text-indigo-400 text-slate-400"
                            title="Editar Linha"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteRow(s.id, s.tema);
                            }}
                            className="p-1 hover:text-red-400 text-slate-400"
                            title="Excluir Linha"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }

                // Standard Row
                return (
                  <tr
                    key={s.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, s.id)}
                    onDragOver={(e) => handleDragOver(e, s.id)}
                    onDrop={(e) => handleDrop(e, s.id)}
                    onDragEnd={handleDragEnd}
                    onClick={() => setSelectedRowId(s.id)}
                    onContextMenu={(e) => handleContextMenu(e, s, index)}
                    className={`divide-x divide-black transition-colors border-b border-black cursor-pointer ${
                      dragOverId === s.id ? 'border-t-4 border-indigo-600 bg-indigo-50' : ''
                    } ${
                      draggedId === s.id ? 'opacity-40' : ''
                    } ${
                      isSelected
                        ? 'bg-amber-100/60 ring-2 ring-black font-medium'
                        : 'bg-white hover:bg-slate-50 text-slate-900'
                    }`}
                  >
                    {/* Excel Row Index (#) + Drag Handle */}
                    <td 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRowId(s.id);
                      }}
                      className={`py-2 px-1 text-center font-mono text-[10px] select-none border-r border-black font-semibold cursor-grab active:cursor-grabbing ${
                        isSelected ? 'bg-black text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                      title={`Linha ${index + 1} • Arraste para mover para cima ou para baixo`}
                    >
                      <div className="flex items-center justify-center gap-0.5">
                        <GripVertical className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700" />
                        <span>{index + 1}</span>
                      </div>
                    </td>

                    {/* DIA: Large bold number com Seletor Direto para Troca Fácil */}
                    <td className="py-2 px-2 text-center text-2xl font-black text-black select-none border-r border-black relative">
                      <select
                        value={s.dia}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleChangeDay(s, Number(e.target.value));
                        }}
                        className="bg-transparent text-black font-black text-2xl text-center focus:outline-hidden cursor-pointer hover:bg-amber-100 rounded px-1"
                        title="Clique para alterar o Dia desta atividade"
                      >
                        {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                          <option key={d} value={d} className="text-black font-bold text-sm">
                            {d}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* HORÁRIO */}
                    <td 
                      onClick={() => handleStartInlineEdit(s, 'horarioText')}
                      className="py-1.5 px-1.5 text-center font-normal text-slate-900 border-r border-black whitespace-nowrap cursor-pointer hover:bg-amber-50 text-[11px]"
                      title="Clique duas vezes para editar horário"
                    >
                      {editingCell?.id === s.id && editingCell?.field === 'horarioText' ? (
                        <input
                          type="text"
                          autoFocus
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleSaveInlineEdit(s)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveInlineEdit(s)}
                          className="w-full text-center px-1 py-0.5 border border-indigo-600 rounded text-xs font-semibold"
                        />
                      ) : (
                        s.horarioText || `${s.startTime} às ${s.endTime}`
                      )}
                    </td>

                    {/* CH */}
                    <td 
                      onClick={() => handleStartInlineEdit(s, 'ch')}
                      className="py-1.5 px-1 text-center text-slate-900 border-r border-black whitespace-nowrap cursor-pointer hover:bg-amber-50 text-[11px]"
                      title="Clique para editar CH"
                    >
                      {editingCell?.id === s.id && editingCell?.field === 'ch' ? (
                        <input
                          type="text"
                          autoFocus
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleSaveInlineEdit(s)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveInlineEdit(s)}
                          className="w-full text-center px-1 py-0.5 border border-indigo-600 rounded text-xs font-semibold"
                        />
                      ) : (
                        s.ch || ''
                      )}
                    </td>

                    {/* TEMA */}
                    <td 
                      onClick={() => handleStartInlineEdit(s, 'tema')}
                      className="py-1.5 px-2 text-center text-slate-900 border-r border-black font-normal cursor-pointer hover:bg-amber-50 leading-tight text-xs"
                      title="Clique para editar Tema"
                    >
                      {editingCell?.id === s.id && editingCell?.field === 'tema' ? (
                        <input
                          type="text"
                          autoFocus
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleSaveInlineEdit(s)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveInlineEdit(s)}
                          className="w-full text-left px-1 py-0.5 border border-indigo-600 rounded text-xs font-semibold"
                        />
                      ) : (
                        s.tema
                      )}
                    </td>

                    {/* ÁREA: Full-cell colored block */}
                    <td 
                      className="py-1.5 px-1.5 text-center border-r border-black font-bold uppercase text-[10.5px] tracking-wide select-none"
                      style={{
                        backgroundColor: areaBg,
                        color: areaColor,
                      }}
                    >
                      {s.area}
                    </td>

                    {/* RESPONSÁVEL */}
                    <td 
                      onClick={() => handleStartInlineEdit(s, 'responsavel')}
                      className="py-1.5 px-1.5 text-center text-slate-900 border-r border-black cursor-pointer hover:bg-amber-50 text-[11px] leading-tight"
                      title="Clique para editar Responsável"
                    >
                      {editingCell?.id === s.id && editingCell?.field === 'responsavel' ? (
                        <input
                          type="text"
                          autoFocus
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleSaveInlineEdit(s)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveInlineEdit(s)}
                          className="w-full text-center px-1 py-0.5 border border-indigo-600 rounded text-xs"
                        />
                      ) : (
                        s.responsavel || ''
                      )}
                    </td>

                    {/* PRN */}
                    <td 
                      onClick={() => handleStartInlineEdit(s, 'prn')}
                      className="py-1.5 px-1 text-center font-sans text-slate-900 border-r border-black cursor-pointer hover:bg-amber-50 text-[11px]"
                      title="Clique para editar PRN"
                    >
                      {editingCell?.id === s.id && editingCell?.field === 'prn' ? (
                        <input
                          type="text"
                          autoFocus
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleSaveInlineEdit(s)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveInlineEdit(s)}
                          className="w-full text-center px-1 py-0.5 border border-indigo-600 rounded text-xs"
                        />
                      ) : (
                        s.prn || ''
                      )}
                    </td>

                    {/* LOCAL */}
                    <td 
                      onClick={() => handleStartInlineEdit(s, 'local')}
                      className="py-1.5 px-1.5 text-center text-slate-900 border-r border-black cursor-pointer hover:bg-amber-50 text-[11px]"
                      title="Clique para editar Local"
                    >
                      {editingCell?.id === s.id && editingCell?.field === 'local' ? (
                        <input
                          type="text"
                          autoFocus
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleSaveInlineEdit(s)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveInlineEdit(s)}
                          className="w-full text-center px-1 py-0.5 border border-indigo-600 rounded text-xs"
                        />
                      ) : (
                        s.local || 'Sala de Integração'
                      )}
                    </td>

                    {/* CÓDIGO */}
                    <td 
                      onClick={() => handleStartInlineEdit(s, 'codigo')}
                      className="py-1.5 px-1 text-center text-slate-900 border-r border-black cursor-pointer hover:bg-amber-50 text-[11px]"
                      title="Clique para editar Código"
                    >
                      {editingCell?.id === s.id && editingCell?.field === 'codigo' ? (
                        <input
                          type="text"
                          autoFocus
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleSaveInlineEdit(s)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveInlineEdit(s)}
                          className="w-full text-center px-1 py-0.5 border border-indigo-600 rounded text-xs"
                        />
                      ) : (
                        s.codigo || ''
                      )}
                    </td>

                    {/* ENTREGÁVEL */}
                    <td 
                      onClick={() => handleStartInlineEdit(s, 'entregavel')}
                      className="py-1.5 px-1.5 text-center text-slate-900 border-r border-black cursor-pointer hover:bg-amber-50 text-[11px]"
                      title="Clique para editar Entregável"
                    >
                      {editingCell?.id === s.id && editingCell?.field === 'entregavel' ? (
                        <input
                          type="text"
                          autoFocus
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleSaveInlineEdit(s)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveInlineEdit(s)}
                          className="w-full text-center px-1 py-0.5 border border-indigo-600 rounded text-xs"
                        />
                      ) : (
                        s.entregavel || ''
                      )}
                    </td>

                    {/* AÇÕES (no-print) */}
                    <td className="py-2 px-1 text-center no-print">
                      <div className="flex items-center justify-center gap-1 text-slate-400">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditSession(s);
                          }}
                          className="p-1 hover:text-indigo-600 rounded transition-colors"
                          title="Editar Linha"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDuplicateSession(s);
                          }}
                          className="p-1 hover:text-indigo-600 rounded transition-colors"
                          title="Duplicar Linha"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRow(s.id, s.tema);
                          }}
                          className="p-1 hover:text-red-600 text-red-500 rounded transition-colors"
                          title="Excluir Linha (Del)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredSessions.length === 0 && (
          <div className="p-8 text-center text-slate-500 text-sm">
            Nenhuma atividade encontrada com os filtros selecionados.
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* EXCEL CONTEXT MENU (POPS UP ON RIGHT-CLICK - FAMILIAR EXCEL EXPERIENCE) */}
      {/* ========================================================================= */}
      {contextMenu.visible && contextMenu.session && (
        <div
          ref={contextMenuRef}
          className="fixed z-50 bg-white border border-slate-300 rounded-xl shadow-2xl py-1.5 min-w-[210px] text-xs font-sans animate-in fade-in zoom-in-95"
          style={{
            top: `${Math.min(window.innerHeight - 200, contextMenu.y)}px`,
            left: `${Math.min(window.innerWidth - 220, contextMenu.x)}px`,
          }}
        >
          {/* Header indicator */}
          <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] font-bold text-slate-500 flex items-center justify-between">
            <span>Linha {contextMenu.rowIndex}</span>
            <span className="font-mono text-[10px] bg-slate-100 px-1 rounded">Dia {contextMenu.session.dia}</span>
          </div>

          {/* Delete Row - Primary Excel Action */}
          <button
            onClick={() => {
              if (contextMenu.session) {
                const s = contextMenu.session;
                setContextMenu((prev) => ({ ...prev, visible: false }));
                handleDeleteRow(s.id, s.tema);
              }
            }}
            className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 font-bold flex items-center justify-between transition-colors"
          >
            <span className="flex items-center gap-2">
              <Trash2 className="w-3.5 h-3.5" />
              <span>Excluir Linha</span>
            </span>
            <kbd className="font-mono text-[10px] bg-red-100 text-red-700 px-1 rounded">Del</kbd>
          </button>

          <div className="border-t border-slate-100 my-1" />

          {/* Insert Row Above */}
          <button
            onClick={() => {
              if (contextMenu.session) {
                const s = contextMenu.session;
                setContextMenu((prev) => ({ ...prev, visible: false }));
                handleInsertRowAdjacent(s, 'above');
              }
            }}
            className="w-full text-left px-3 py-1.5 text-slate-700 hover:bg-slate-100 flex items-center gap-2 transition-colors font-medium"
          >
            <ArrowUp className="w-3.5 h-3.5 text-slate-500" />
            <span>Inserir Linha Acima</span>
          </button>

          {/* Insert Row Below */}
          <button
            onClick={() => {
              if (contextMenu.session) {
                const s = contextMenu.session;
                setContextMenu((prev) => ({ ...prev, visible: false }));
                handleInsertRowAdjacent(s, 'below');
              }
            }}
            className="w-full text-left px-3 py-1.5 text-slate-700 hover:bg-slate-100 flex items-center gap-2 transition-colors font-medium"
          >
            <ArrowDown className="w-3.5 h-3.5 text-slate-500" />
            <span>Inserir Linha Abaixo</span>
          </button>

          {/* Duplicate Row */}
          <button
            onClick={() => {
              if (contextMenu.session) {
                const s = contextMenu.session;
                setContextMenu((prev) => ({ ...prev, visible: false }));
                onDuplicateSession(s);
              }
            }}
            className="w-full text-left px-3 py-1.5 text-slate-700 hover:bg-slate-100 flex items-center gap-2 transition-colors font-medium"
          >
            <Copy className="w-3.5 h-3.5 text-slate-500" />
            <span>Duplicar Linha</span>
          </button>

          {/* Quick Change Day Submenu in Context Menu */}
          <div className="border-t border-slate-100 my-1 pt-1 px-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Mover para o Dia:</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((d) => (
                <button
                  key={d}
                  onClick={() => {
                    if (contextMenu.session) {
                      handleChangeDay(contextMenu.session, d);
                      setContextMenu((prev) => ({ ...prev, visible: false }));
                    }
                  }}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors ${
                    contextMenu.session?.dia === d
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  Dia {d}
                </button>
              ))}
            </div>
          </div>

          {/* Edit in Modal */}
          <button
            onClick={() => {
              if (contextMenu.session) {
                const s = contextMenu.session;
                setContextMenu((prev) => ({ ...prev, visible: false }));
                onEditSession(s);
              }
            }}
            className="w-full text-left px-3 py-1.5 text-slate-700 hover:bg-slate-100 flex items-center gap-2 transition-colors font-medium border-t border-slate-100 mt-1"
          >
            <Edit2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>Editar Linha Completa...</span>
          </button>
        </div>
      )}
    </div>
  );
};
