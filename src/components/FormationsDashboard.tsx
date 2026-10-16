import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart3, Check, ChevronDown, CircleHelp, Download, FileUp,
  Search, Table2, Upload, Users, X,
} from 'lucide-react';
import './FormationsDashboard.css';

type FormationRow = Record<string, string> & {
  _fullname: string;
  _cargo: string;
  _status: string;
  _prn: string;
  _uo: string;
  _pending: 'pending' | 'done';
  _searchText: string;
};

type MatrixKind = 'conhecimento' | 'habilidade' | null;
type FacetKey = 'nome' | 'prn' | 'uo' | 'cargo' | 'matriz' | 'estado';
type Facets = Record<FacetKey, string[]>;
type ColumnId = 'A' | 'B';

interface ColumnState {
  facets: Facets;
  matrixKind: MatrixKind;
  query: string;
  page: number;
}

interface ColumnData {
  filteredCount: number;
  uniqueCount: number;
  peopleCount: number;
  trainingCount: number;
  matrixCount: number;
  doneCount: number;
  pendingCount: number;
  matchingCount: number;
  pageCount: number;
  page: number;
  rows: FormationRow[];
}

interface ChartData {
  doneCount: number;
  pendingCount: number;
  peopleCount: number;
  trainingCount: number;
  completionByUnit: { label: string; value: number }[];
  completionByRole: { label: string; value: number }[];
  pendingByTraining: { label: string; value: number }[];
}

interface WorkerResponse {
  type: 'loaded' | 'filtered' | 'facet-options' | 'exported' | 'error';
  requestId: number;
  rowCount?: number;
  columns?: Record<ColumnId, ColumnData>;
  chartData?: ChartData;
  columnId?: ColumnId;
  facetKey?: FacetKey;
  values?: string[];
  total?: number;
  csv?: string;
  message?: string;
}

const FACET_DEFINITIONS: { key: FacetKey; label: string }[] = [
  { key: 'nome', label: 'Colaborador' },
  { key: 'prn', label: 'PRN / Utilizador' },
  { key: 'uo', label: 'Unidade organizacional' },
  { key: 'cargo', label: 'Cargo' },
  { key: 'matriz', label: 'ID da matriz' },
  { key: 'estado', label: 'Estado / conclusão' },
];
const EMPTY_FACETS: Facets = {
  nome: [], prn: [], uo: [], cargo: [], matriz: [], estado: [],
};

const EMPTY_COLUMN: ColumnState = {
  facets: EMPTY_FACETS,
  matrixKind: null,
  query: '',
  page: 1,
};

const EMPTY_COLUMN_DATA: ColumnData = {
  filteredCount: 0,
  uniqueCount: 0,
  peopleCount: 0,
  trainingCount: 0,
  matrixCount: 0,
  doneCount: 0,
  pendingCount: 0,
  matchingCount: 0,
  pageCount: 1,
  page: 1,
  rows: [],
};

const EMPTY_CHART_DATA: ChartData = {
  doneCount: 0,
  pendingCount: 0,
  peopleCount: 0,
  trainingCount: 0,
  completionByUnit: [],
  completionByRole: [],
  pendingByTraining: [],
};

const normalizeText = (value: unknown) => String(value ?? '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase('pt-BR')
  .trim();

function FilterSelect({
  label, selected, onChange, onSearch, searchContext,
}: {
  label: string;
  selected: string[];
  onChange: (value: string[]) => void;
  onSearch: (query: string) => Promise<{ values: string[]; total: number }>;
  searchContext: string;
}) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [values, setValues] = useState<string[]>([]);
  const [totalValues, setTotalValues] = useState(0);
  const onSearchRef = useRef(onSearch);

  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    setIsLoading(true);
    setSearchError('');
    const timer = window.setTimeout(() => {
      void onSearchRef.current(query).then((result) => {
        if (!active) return;
        setValues(result.values);
        setTotalValues(result.total);
      }).catch((error: unknown) => {
        if (!active) return;
        console.error('Could not load formation filter options', error);
        setSearchError('Não foi possível carregar as opções. Tente novamente.');
      }).finally(() => {
        if (active) setIsLoading(false);
      });
    }, 100);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [isOpen, query, searchContext]);

  return (
    <details className="formation-filter" onToggle={(event) => setIsOpen(event.currentTarget.open)}>
      <summary>
        <span>{label}</span>
        <span className={`formation-filter-count ${selected.length ? 'is-selected' : ''}`}>
          {selected.length || 'Todos'} <ChevronDown size={14} />
        </span>
      </summary>
      <div className="formation-filter-menu">
        <label className="formation-filter-search">
          <Search size={14} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filtrar opções..."
            aria-label={`Pesquisar ${label}`}
          />
        </label>
        <div className="formation-filter-actions">
          <button type="button" onClick={() => onChange([...new Set([...selected, ...values])])}>
            Selecionar visíveis
          </button>
          <button type="button" onClick={() => onChange([])}>Limpar</button>
        </div>
        <div className="formation-filter-options">
          {values.length ? values.map((value) => (
            <label key={value}>
              <input
                type="checkbox"
                checked={selected.includes(value)}
                onChange={(event) => onChange(
                  event.target.checked
                    ? [...selected, value]
                    : selected.filter((item) => item !== value),
                )}
              />
              <span>{value}</span>
            </label>
          )) : !isLoading && <p className="formation-muted">{searchError || 'Sem opções correspondentes.'}</p>}
          {isLoading && <p className="formation-muted">Carregando opções...</p>}
          {totalValues > values.length && (
            <p className="formation-muted">
              Mostrando {values.length} de {totalValues}. Refine a pesquisa para localizar outras opções.
            </p>
          )}
        </div>
      </div>
    </details>
  );
}

function formatPercent(value: number) {
  return `${value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

function BarChart({ items, suffix = '' }: { items: { label: string; value: number }[]; suffix?: string }) {
  if (!items.length) return <div className="formation-chart-empty">Sem dados para os filtros atuais</div>;
  const max = Math.max(1, ...items.map((item) => item.value));

  return (
    <div className="formation-bars">
      {items.map((item) => (
        <div className="formation-bar-row" key={item.label} title={`${item.label}: ${item.value}${suffix}`}>
          <span className="formation-bar-label">{item.label}</span>
          <div className="formation-bar-track">
            <div className="formation-bar-fill" style={{ width: `${Math.max(2, (item.value / max) * 100)}%` }} />
          </div>
          <strong>{item.value}{suffix}</strong>
        </div>
      ))}
    </div>
  );
}

function CompletionDonut({ done, pending }: { done: number; pending: number }) {
  const total = done + pending;
  const percentage = total ? (done / total) * 100 : 0;
  const circumference = 2 * Math.PI * 62;

  return (
    <div className="formation-donut-layout">
      <svg viewBox="0 0 160 160" role="img" aria-label={`${formatPercent(percentage)} de aproveitamento`}>
        <circle cx="80" cy="80" r="62" className="formation-donut-track" />
        {total > 0 && (
          <>
            <circle
              cx="80" cy="80" r="62" className="formation-donut-done"
              strokeDasharray={`${circumference * (done / total)} ${circumference}`}
            />
            {pending > 0 && (
              <circle
                cx="80" cy="80" r="62" className="formation-donut-pending"
                strokeDasharray={`${circumference * (pending / total)} ${circumference}`}
                strokeDashoffset={-circumference * (done / total)}
              />
            )}
          </>
        )}
        <text x="80" y="77" textAnchor="middle" className="formation-donut-percent">
          {formatPercent(percentage)}
        </text>
        <text x="80" y="98" textAnchor="middle" className="formation-donut-caption">APROVEITAMENTO</text>
      </svg>
      <div className="formation-donut-legend">
        <span><i className="formation-legend-done" />Realizados <strong>{done}</strong></span>
        <span><i className="formation-legend-pending" />Pendentes <strong>{pending}</strong></span>
      </div>
    </div>
  );
}

const UPLOAD_DATABASE = 'formations-dashboard';
const UPLOAD_STORE = 'uploads';
const LAST_UPLOAD_KEY = 'last';

interface StoredUpload {
  key: string;
  name: string;
  type: string;
  lastModified: number;
  savedAt: number;
  blob: Blob;
}

function openUploadDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(UPLOAD_DATABASE, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(UPLOAD_STORE, { keyPath: 'key' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Não foi possível abrir o armazenamento local.'));
  });
}

async function saveLastUpload(file: File) {
  const database = await openUploadDatabase();
  const savedAt = Date.now();
  const record: StoredUpload = {
    key: LAST_UPLOAD_KEY,
    name: file.name,
    type: file.type,
    lastModified: file.lastModified,
    savedAt,
    blob: file,
  };

  return new Promise<number>((resolve, reject) => {
    const transaction = database.transaction(UPLOAD_STORE, 'readwrite');
    transaction.objectStore(UPLOAD_STORE).put(record);
    transaction.oncomplete = () => {
      database.close();
      resolve(savedAt);
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error ?? new Error('Não foi possível guardar a planilha neste navegador.'));
    };
    transaction.onabort = () => {
      database.close();
      reject(transaction.error ?? new Error('O armazenamento local recusou a planilha.'));
    };
  });
}

async function readLastUpload() {
  const database = await openUploadDatabase();
  return new Promise<{ file: File; savedAt: number } | null>((resolve, reject) => {
    const transaction = database.transaction(UPLOAD_STORE, 'readonly');
    const request = transaction.objectStore(UPLOAD_STORE).get(LAST_UPLOAD_KEY);
    let saved: StoredUpload | undefined;
    request.onsuccess = () => {
      saved = request.result as StoredUpload | undefined;
    };
    transaction.oncomplete = () => {
      database.close();
      resolve(saved ? {
        file: new File([saved.blob], saved.name, {
          type: saved.type,
          lastModified: saved.lastModified,
        }),
        savedAt: saved.savedAt,
      } : null);
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error ?? new Error('Não foi possível recuperar a última planilha.'));
    };
    transaction.onabort = () => {
      database.close();
      reject(transaction.error ?? new Error('A leitura da planilha salva foi interrompida.'));
    };
  });
}

export function FormationsDashboard() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const loadVersionRef = useRef(0);
  const filterRequestRef = useRef(0);
  const exportRequestRef = useRef(0);
  const facetRequestRef = useRef(0);
  const pendingFacetRequestsRef = useRef(new Map<number, {
    resolve: (result: { values: string[]; total: number }) => void;
    reject: (error: Error) => void;
  }>());
  const pendingFileRef = useRef<{ file: File; persist: boolean; requestId: number } | null>(null);
  const loadedRowsRef = useRef(0);
  const [rowCount, setRowCount] = useState(0);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [storageError, setStorageError] = useState('');
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [lastSavedName, setLastSavedName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [workerReady, setWorkerReady] = useState(false);
  const [columnData, setColumnData] = useState<Record<ColumnId, ColumnData>>({
    A: EMPTY_COLUMN_DATA,
    B: EMPTY_COLUMN_DATA,
  });
  const [chartData, setChartData] = useState<ChartData>(EMPTY_CHART_DATA);
  const [activeView, setActiveView] = useState<'comparison' | 'charts'>('comparison');
  const [chartSource, setChartSource] = useState<ColumnId>('A');
  const [columns, setColumns] = useState<Record<ColumnId, ColumnState>>({
    A: { ...EMPTY_COLUMN, facets: { ...EMPTY_FACETS } },
    B: { ...EMPTY_COLUMN, facets: { ...EMPTY_FACETS } },
  });

  const loadFile = (file?: File, persist = true) => {
    if (!file) return;
    if (!file.name.toLocaleLowerCase().endsWith('.csv')) {
      setError('Selecione um ficheiro CSV.');
      return;
    }
    const loadVersion = ++loadVersionRef.current;
    filterRequestRef.current += 1;
    setIsLoading(true);
    setIsFiltering(false);
    setWorkerReady(false);
    setError('');
    pendingFacetRequestsRef.current.forEach(({ reject }) => {
      reject(new Error('A planilha foi alterada antes de carregar as opções.'));
    });
    pendingFacetRequestsRef.current.clear();
    pendingFileRef.current = { file, persist, requestId: loadVersion };
    if (!workerRef.current) {
      const worker = new Worker(new URL('./FormationsCsv.worker.ts', import.meta.url), { type: 'module' });
      workerRef.current = worker;
      worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const response = event.data;
        if (response.type === 'error') {
          if (response.requestId < 0) {
            const pending = pendingFacetRequestsRef.current.get(response.requestId);
            if (pending) {
              pendingFacetRequestsRef.current.delete(response.requestId);
              pending.reject(new Error(response.message || 'Não foi possível carregar as opções.'));
            }
            return;
          }
          if (response.requestId !== loadVersionRef.current
            && response.requestId !== filterRequestRef.current
            && response.requestId !== exportRequestRef.current) return;
          if (pendingFileRef.current?.requestId === response.requestId) {
            setIsLoading(false);
            setWorkerReady(loadedRowsRef.current > 0);
          }
          setIsFiltering(false);
          setError(response.message || 'Não foi possível processar a planilha.');
          return;
        }
        if (response.type === 'facet-options') {
          const pending = pendingFacetRequestsRef.current.get(response.requestId);
          if (!pending) return;
          pendingFacetRequestsRef.current.delete(response.requestId);
          pending.resolve({
            values: response.values ?? [],
            total: response.total ?? 0,
          });
          return;
        }
        if (response.type === 'loaded') {
          const pending = pendingFileRef.current;
          if (!pending || response.requestId !== pending.requestId) return;
          pendingFileRef.current = null;
          loadedRowsRef.current = response.rowCount ?? 0;
          setRowCount(loadedRowsRef.current);
          setFileName(pending.file.name);
          setIsLoading(false);
          setWorkerReady(true);
          setColumns({
            A: { ...EMPTY_COLUMN, facets: { ...EMPTY_FACETS } },
            B: { ...EMPTY_COLUMN, facets: { ...EMPTY_FACETS } },
          });
          setColumnData({ A: EMPTY_COLUMN_DATA, B: EMPTY_COLUMN_DATA });
          setChartData(EMPTY_CHART_DATA);
          if (pending.persist) {
            setStorageError('');
            void saveLastUpload(pending.file).then((savedAt) => {
              setLastSavedAt(savedAt);
              setLastSavedName(pending.file.name);
            }).catch((caught: unknown) => {
              console.error('Could not save the last formations CSV in IndexedDB', caught);
              setStorageError('A planilha foi carregada, mas não pôde ser salva neste navegador.');
            });
          }
          return;
        }
        if (response.type === 'filtered' && response.requestId === filterRequestRef.current
          && response.columns && response.chartData) {
          setColumnData(response.columns);
          setChartData(response.chartData);
          setIsFiltering(false);
          setError('');
          return;
        }
        if (response.type === 'exported' && response.requestId === exportRequestRef.current && response.csv) {
          const url = URL.createObjectURL(new Blob([response.csv], { type: 'text/csv;charset=utf-8' }));
          const link = document.createElement('a');
          link.href = url;
          link.download = `matriz_${response.columnId}_filtrada.csv`;
          link.click();
          URL.revokeObjectURL(url);
        }
      };
      worker.onerror = () => {
        setIsLoading(false);
        setIsFiltering(false);
        setWorkerReady(false);
        pendingFacetRequestsRef.current.forEach(({ reject }) => {
          reject(new Error('O processamento da planilha foi interrompido.'));
        });
        pendingFacetRequestsRef.current.clear();
        setError('Não foi possível processar a planilha. Confira o arquivo e tente novamente.');
      };
    }
    workerRef.current.postMessage({ type: 'load', requestId: loadVersion, file });
  };

  useEffect(() => {
    let cancelled = false;
    const restoreVersion = loadVersionRef.current;
    void readLastUpload().then((saved) => {
      if (cancelled || loadVersionRef.current !== restoreVersion || !saved) return;
      setLastSavedAt(saved.savedAt);
      setLastSavedName(saved.file.name);
      loadFile(saved.file, false);
    }).catch((caught: unknown) => {
      if (cancelled) return;
      console.error('Could not restore the last formations CSV from IndexedDB', caught);
      setStorageError('Não foi possível recuperar a planilha salva neste navegador.');
    });
    return () => {
      cancelled = true;
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  const updateColumn = (id: ColumnId, update: (column: ColumnState) => ColumnState) => {
    setColumns((current) => ({ ...current, [id]: update(current[id]) }));
  };

  useEffect(() => {
    const worker = workerRef.current;
    if (!workerReady || !worker) return;
    const requestId = ++filterRequestRef.current;
    setIsFiltering(true);
    const timer = window.setTimeout(() => {
      worker.postMessage({ type: 'filter', requestId, columns, chartSource });
    }, 100);
    return () => window.clearTimeout(timer);
  }, [columns, chartSource, workerReady]);

  const exportCSV = (id: ColumnId) => {
    const worker = workerRef.current;
    if (!worker || !workerReady) return;
    const requestId = ++exportRequestRef.current;
    worker.postMessage({ type: 'export', requestId, columnId: id, column: columns[id] });
  };

  const searchFacetOptions = (id: ColumnId, facetKey: FacetKey, query: string) => (
    new Promise<{ values: string[]; total: number }>((resolve, reject) => {
      const worker = workerRef.current;
      if (!worker || !workerReady) {
        reject(new Error('Carregue uma planilha antes de pesquisar as opções.'));
        return;
      }
      const requestId = -(++facetRequestRef.current);
      pendingFacetRequestsRef.current.set(requestId, { resolve, reject });
      worker.postMessage({
        type: 'facet-options',
        requestId,
        columnId: id,
        column: columns[id],
        facetKey,
        query,
      });
    })
  );

  const renderColumn = (id: ColumnId, title: string, columnData: ColumnData) => {
    const state = columns[id];
    const { rows: tableRows } = columnData;
    const percentage = columnData.uniqueCount
      ? (columnData.doneCount / columnData.uniqueCount) * 100
      : 0;

    return (
      <section className="formation-panel" key={id}>
        <header className="formation-panel-header">
          <span className={`formation-badge formation-badge-${id.toLowerCase()}`}>{id}</span>
          <h2>{title}</h2>
          <span className="formation-panel-total">{columnData.filteredCount} registos</span>
        </header>
        <div className="formation-panel-body">
          <div className="formation-filters">
            {FACET_DEFINITIONS.map(({ key, label }) => {
              return (
                <FilterSelect
                  key={key}
                  label={label}
                  selected={state.facets[key]}
                  searchContext={JSON.stringify([
                    state.matrixKind,
                    FACET_DEFINITIONS
                      .filter((definition) => definition.key !== key)
                      .map((definition) => [definition.key, state.facets[definition.key]]),
                  ])}
                  onSearch={(query) => searchFacetOptions(id, key, query)}
                  onChange={(selected) => updateColumn(id, (current) => ({
                    ...current,
                    facets: { ...current.facets, [key]: selected },
                    page: 1,
                  }))}
                />
              );
            })}
          </div>

          <div className="formation-column-controls">
            <div className="formation-matrix-type">
              <span>Tipo de matriz</span>
              <div>
                <button
                  type="button"
                  className={state.matrixKind === 'conhecimento' ? 'is-active' : ''}
                  onClick={() => updateColumn(id, (current) => ({
                    ...current, matrixKind: current.matrixKind === 'conhecimento' ? null : 'conhecimento',
                    page: 1,
                  }))}
                >Conhecimento (MC)</button>
                <button
                  type="button"
                  className={state.matrixKind === 'habilidade' ? 'is-active' : ''}
                  onClick={() => updateColumn(id, (current) => ({
                    ...current, matrixKind: current.matrixKind === 'habilidade' ? null : 'habilidade',
                    page: 1,
                  }))}
                >Habilidade (MH)</button>
              </div>
            </div>
            <div className="formation-column-actions">
              <span className="formation-live-filter">{isFiltering ? 'Atualizando filtros...' : 'Filtros em tempo real'}</span>
              <button
                type="button"
                className="formation-button"
                onClick={() => updateColumn(id, () => ({ ...EMPTY_COLUMN, facets: { ...EMPTY_FACETS } }))}
              ><X size={14} /> Limpar</button>
              <button
                type="button"
                className="formation-button"
                onClick={() => exportCSV(id)}
                disabled={!columnData.uniqueCount || !workerReady}
              ><Download size={14} /> Exportar CSV</button>
            </div>
          </div>

          <div className="formation-stats">
            {[
              ['Registos', columnData.filteredCount],
              ['Pessoas', columnData.peopleCount],
              ['Formações', columnData.trainingCount],
              ['Matrizes', columnData.matrixCount],
            ].map(([label, value]) => (
              <div className="formation-stat" key={label}>
                <span>{label}</span><strong>{value}</strong>
              </div>
            ))}
          </div>

          <div className="formation-completion">
            <div className="formation-completion-heading">
              <span>Aproveitamento de formações</span>
              <strong className={percentage >= 80 ? 'is-high' : percentage >= 50 ? 'is-medium' : 'is-low'}>
                {formatPercent(percentage)}
              </strong>
            </div>
            <div className="formation-progress">
              <span style={{ width: `${percentage}%` }} className={percentage >= 80 ? 'is-high' : percentage >= 50 ? 'is-medium' : 'is-low'} />
            </div>
            <div className="formation-completion-foot">
              <span><i className="formation-legend-done" />Realizados: <strong>{columnData.doneCount}</strong></span>
              <span><i className="formation-legend-pending" />Pendentes: <strong>{columnData.pendingCount}</strong></span>
              <span>Total único: <strong>{columnData.uniqueCount}</strong></span>
            </div>
          </div>

          <label className="formation-table-search">
            <Search size={15} />
            <input
              value={state.query}
              onChange={(event) => updateColumn(id, (current) => ({
                ...current, query: event.target.value, page: 1,
              }))}
              placeholder="Pesquisa rápida (nome, cargo, unidade, formação, ID)..."
              aria-label={`Pesquisar na matriz ${id}`}
            />
          </label>
          <div className="formation-table-wrap">
            <table>
              <thead><tr>
                <th>ID Item</th><th>Colaborador</th><th>Cargo</th><th>Unidade organizacional</th>
                <th>Formação</th><th>Estado</th><th>Matriz</th>
              </tr></thead>
              <tbody>
                {tableRows.map((row, index) => {
                  const pendingRow = row._pending === 'pending';
                  return (
                    <tr key={`${row['ID do Item']}-${row._fullname}-${row['ID da Matriz']}-${index}`}>
                      <td><span className="formation-chip">{row['ID do Item']}</span></td>
                      <td className="formation-person">{row._fullname}</td>
                      <td>{row._cargo || '—'}</td>
                      <td>{row._uo || '—'}</td>
                      <td>{row['Título do Item']}</td>
                      <td><span className={`formation-status ${pendingRow ? 'is-pending' : 'is-done'}`}>
                        <i />{row._status || 'Não Realizado'}
                      </span></td>
                      <td><span className="formation-chip formation-chip-matrix">{row['ID da Matriz']}</span></td>
                    </tr>
                  );
                })}
                {!tableRows.length && (
                  <tr><td colSpan={7} className="formation-empty">
                      {columnData.filteredCount ? 'Nenhum registo encontrado para os critérios selecionados.' : 'Carregue um CSV para visualizar os registos.'}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
          {columnData.matchingCount > 0 && (
            <div className="formation-pagination">
              <span>
                Mostrando {(columnData.page - 1) * 100 + 1}–{Math.min(columnData.page * 100, columnData.matchingCount)}
                {' '}de {columnData.matchingCount} resultados
              </span>
              <div>
                <button
                  type="button"
                  className="formation-button"
                  disabled={columnData.page <= 1 || isFiltering}
                  onClick={() => updateColumn(id, (current) => ({ ...current, page: columnData.page - 1 }))}
                >Anterior</button>
                <span>Página {columnData.page} de {columnData.pageCount}</span>
                <button
                  type="button"
                  className="formation-button"
                  disabled={columnData.page >= columnData.pageCount || isFiltering}
                  onClick={() => updateColumn(id, (current) => ({ ...current, page: columnData.page + 1 }))}
                >Próxima</button>
              </div>
            </div>
          )}
        </div>
      </section>
    );
  };

  return (
    <main className="formations-dashboard">
      <div className="formation-topbar">
        <div className="formation-brand">
          <div className="formation-brand-icon"><BarChart3 size={23} /></div>
          <div>
            <h1>Dashboard de Formações</h1>
            <p>Comparação de matrizes · Multifiltros inteligentes · Análise por cargo e UO</p>
          </div>
        </div>
        <div
          className="formation-upload"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            loadFile(event.dataTransfer.files[0]);
          }}
        >
          <button
            type="button"
            className="formation-upload-button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
          >
            <Upload size={16} /> {isLoading ? 'Processando CSV...' : 'Carregar CSV'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            hidden
            onChange={(event) => {
              loadFile(event.target.files?.[0]);
              event.target.value = '';
            }}
          />
          <div>
            <strong>Fonte de dados (CSV)</strong>
            <span>{isLoading ? 'A processar a planilha em segundo plano...' : fileName ? `${fileName} · ${rowCount} registos` : 'Arraste um ficheiro ou clique ao lado'}</span>
            {lastSavedAt !== null && (
              <span className="formation-last-upload">
                Último envio: {lastSavedName} · {new Date(lastSavedAt).toLocaleString('pt-BR')}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="formation-content">
        {error && <div className="formation-error" role="alert"><CircleHelp size={17} />{error}</div>}
        {storageError && <div className="formation-storage-error" role="status">{storageError}</div>}
        <nav className="formation-tabs" aria-label="Abas do dashboard">
          <button
            type="button"
            className={activeView === 'comparison' ? 'is-active' : ''}
            onClick={() => setActiveView('comparison')}
          ><Table2 size={16} /> Comparação de Matrizes</button>
          <button
            type="button"
            className={activeView === 'charts' ? 'is-active' : ''}
            onClick={() => setActiveView('charts')}
          ><BarChart3 size={16} /> Análise Gráfica</button>
        </nav>

        {activeView === 'comparison' ? (
          <div className="formation-comparison">
            {renderColumn('A', 'Matriz de Referência (A)', columnData.A)}
            {renderColumn('B', 'Matriz de Comparação (B)', columnData.B)}
          </div>
        ) : (
          <section className="formation-analysis">
            <div className="formation-chart-source" aria-label="Fonte dos gráficos">
              <button type="button" className={chartSource === 'A' ? 'is-active' : ''} onClick={() => setChartSource('A')}>
                Fonte: Matriz de Referência (A)
              </button>
              <button type="button" className={chartSource === 'B' ? 'is-active' : ''} onClick={() => setChartSource('B')}>
                Fonte: Matriz de Comparação (B)
              </button>
            </div>
            <div className="formation-summary">
              {[
                { label: 'Total de pessoas', value: chartData.peopleCount, icon: <Users size={17} /> },
                { label: 'Formações únicas', value: chartData.trainingCount, icon: <FileUp size={17} /> },
                { label: 'Concluídos', value: chartData.doneCount, tone: 'done', icon: <Check size={17} /> },
                { label: 'Pendentes', value: chartData.pendingCount, tone: 'pending', icon: <X size={17} /> },
                { label: 'Taxa de aproveitamento', value: formatPercent((chartSource === 'A' ? columnData.A.uniqueCount : columnData.B.uniqueCount) ? (chartData.doneCount / (chartSource === 'A' ? columnData.A.uniqueCount : columnData.B.uniqueCount)) * 100 : 0), tone: 'percent', icon: <BarChart3 size={17} /> },
              ].map((stat) => (
                <div className={`formation-summary-card ${stat.tone ?? ''}`} key={stat.label}>
                  <span>{stat.icon}{stat.label}</span><strong>{stat.value}</strong>
                </div>
              ))}
            </div>
            <div className="formation-chart-grid">
              <section className="formation-chart-card">
                <h3>Proporção: realizados vs. pendentes</h3>
                <CompletionDonut done={chartData.doneCount} pending={chartData.pendingCount} />
              </section>
              <section className="formation-chart-card">
                <h3>Top 10 formações com mais pendências</h3>
                <BarChart items={chartData.pendingByTraining} />
              </section>
              <section className="formation-chart-card">
                <h3>Aproveitamento por unidade organizacional (%)</h3>
                <BarChart items={chartData.completionByUnit} suffix="%" />
              </section>
              <section className="formation-chart-card">
                <h3>Aproveitamento por cargo (%)</h3>
                <BarChart items={chartData.completionByRole} suffix="%" />
              </section>
            </div>
          </section>
        )}
        {!rowCount && !error && (
          <div className="formation-hint"><FileUp size={18} /> Carregue a exportação CSV da matriz para começar a análise.</div>
        )}
      </div>
    </main>
  );
}
