import React, { useMemo, useRef, useState } from 'react';
import {
  BarChart3, Check, ChevronDown, CircleHelp, Download, FileUp,
  Search, Table2, Upload, Users, X,
} from 'lucide-react';
import './FormationsDashboard.css';

type FormationRow = Record<string, string> & {
  _fullname: string;
  _cargo: string;
  _status: string;
};

type MatrixKind = 'conhecimento' | 'habilidade' | null;
type FacetKey = 'nome' | 'prn' | 'uo' | 'cargo' | 'matriz' | 'estado';
type Facets = Record<FacetKey, string[]>;
type ColumnId = 'A' | 'B';

interface ColumnState {
  facets: Facets;
  matrixKind: MatrixKind;
  query: string;
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
};

const normalizeText = (value: unknown) => String(value ?? '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase('pt-BR')
  .trim();

const isPending = (status: string) => {
  const normalized = normalizeText(status);
  return !normalized || [
    'nao realizado', 'pendente', 'nao concluido', 'not completed',
    'incomplete', 'in progress', 'em andamento',
  ].includes(normalized);
};

const getField = (row: FormationRow, candidates: string[]) => {
  const header = Object.keys(row).find((key) => candidates.some((candidate) => normalizeText(key) === normalizeText(candidate)));
  return header ? row[header] : '';
};

const getOrganizationalUnit = (row: FormationRow) => {
  const number = getField(row, ['Unidade Organizacional', 'Organizational Unit ID', 'UO']);
  const description = getField(row, [
    'Descrição da Unidade Organizacional', 'Descricao da Unidade Organizacional',
    'Descrição UO', 'Organizational Unit Description',
  ]);
  const name = number
    ? description.replace(/\s*\(([^()]*)\)\s*$/, (suffix, value: string) =>
      normalizeText(value) === normalizeText(number) ? '' : suffix).trim()
    : description;

  if (number && name) return `${number} - ${name}`;
  return number || name;
};

const getFacetValue = (row: FormationRow, key: FacetKey) => {
  switch (key) {
    case 'nome': return row._fullname;
    case 'prn': return getField(row, ['Usuário', 'User', 'PRN', 'Utilizador', 'User ID']);
    case 'uo': return getOrganizationalUnit(row);
    case 'cargo': return row._cargo;
    case 'matriz': return row['ID da Matriz'] || '';
    case 'estado': return isPending(row._status) ? 'Pendentes' : 'Realizados';
  }
};

function parseCSV(text: string): FormationRow[] {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? '';
  const delimiter = (firstLine.match(/;/g)?.length ?? 0) >= (firstLine.match(/,/g)?.length ?? 0)
    ? ';'
    : ',';
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const next = text[index + 1];
    if (character === '"') {
      if (quoted && next === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === delimiter && !quoted) {
      row.push(field);
      field = '';
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && next === '\n') index += 1;
      row.push(field);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      field = '';
    } else {
      field += character;
    }
  }

  if (field || row.length) {
    row.push(field);
    if (row.some((value) => value.trim())) rows.push(row);
  }
  if (rows.length < 2) throw new Error('O CSV precisa conter cabeçalho e pelo menos um registo.');

  const headers = rows[0].map((header) => header.trim().replace(/^\uFEFF/, ''));
  const headerMap = new Map(headers.map((header) => [normalizeText(header), header]));
  const findHeader = (candidates: string[]) => candidates
    .map(normalizeText)
    .map((candidate) => headerMap.get(candidate))
    .find((header): header is string => Boolean(header));

  const firstNameField = findHeader(['Nome', 'Primeiro Nome', 'First Name']);
  const lastNameField = findHeader(['Sobrenome', 'Último Nome', 'Last Name']);
  const fullNameField = findHeader(['Nome Completo', 'Nome do Colaborador', 'Full Name', 'Colaborador']);
  const itemIdField = findHeader(['ID do Item', 'Item ID', 'ID Item']);
  const itemTitleField = findHeader(['Título do Item', 'Titulo do Item', 'Título da Formação', 'Formação', 'Training Title']);
  const matrixField = findHeader(['ID da Matriz', 'Matriz ID', 'Matrix ID']);
  const cargoField = findHeader([
    'Descrição do Cargo', 'Cargo', 'Descrição Cargo', 'Função', 'Cargo/Função',
    'Job Title', 'Posição',
  ]);
  const statusField = findHeader([
    'Status de Conclusão', 'Status de Conclusao', 'Status', 'Estado', 'Aproveitamento',
  ]);

  const missing = [
    !firstNameField && !fullNameField && 'Nome ou Nome Completo',
    !itemIdField && 'ID do Item',
    !itemTitleField && 'Título do Item',
    !matrixField && 'ID da Matriz',
  ].filter(Boolean);
  if (missing.length) {
    throw new Error(`Colunas obrigatórias não encontradas: ${missing.join(', ')}.`);
  }

  const data: FormationRow[] = rows.slice(1).map((values): FormationRow => {
    const item: Record<string, string> = {};
    headers.forEach((header, index) => {
      item[header] = String(values[index] ?? '').trim();
    });
    const fullName = fullNameField
      ? item[fullNameField]
      : `${firstNameField ? item[firstNameField] : ''} ${lastNameField ? item[lastNameField] : ''}`;

    return {
      ...item,
      _fullname: fullName.trim().replace(/\s+/g, ' '),
      _cargo: cargoField ? item[cargoField] ?? '' : '',
      _status: statusField ? item[statusField] ?? '' : '',
    };
  }).filter((item) => item._fullname || item['ID do Item']);

  if (!data.length) throw new Error('O CSV não contém registos utilizáveis.');
  return data;
}

function uniqueRows(rows: FormationRow[]) {
  const unique = new Map<string, FormationRow>();
  rows.forEach((row) => {
    const key = [
      row['ID do Item'], row._fullname, row['Título do Item'], row['ID da Matriz'],
    ].join('|||');
    unique.set(key, row);
  });
  return [...unique.values()];
}

function FilterSelect({
  label, values, selected, onChange,
}: {
  label: string;
  values: string[];
  selected: string[];
  onChange: (value: string[]) => void;
}) {
  const [query, setQuery] = useState('');
  const visible = values.filter((value) => normalizeText(value).includes(normalizeText(query)));

  return (
    <details className="formation-filter">
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
          <button type="button" onClick={() => onChange([...new Set([...selected, ...visible])])}>
            Selecionar visíveis
          </button>
          <button type="button" onClick={() => onChange([])}>Limpar</button>
        </div>
        <div className="formation-filter-options">
          {visible.length ? visible.map((value) => (
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
          )) : <p className="formation-muted">Sem opções correspondentes.</p>}
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

export function FormationsDashboard() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<FormationRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [activeView, setActiveView] = useState<'comparison' | 'charts'>('comparison');
  const [chartSource, setChartSource] = useState<ColumnId>('A');
  const [columns, setColumns] = useState<Record<ColumnId, ColumnState>>({
    A: { ...EMPTY_COLUMN, facets: { ...EMPTY_FACETS } },
    B: { ...EMPTY_COLUMN, facets: { ...EMPTY_FACETS } },
  });

  const loadFile = (file?: File) => {
    if (!file) return;
    if (!file.name.toLocaleLowerCase().endsWith('.csv')) {
      setError('Selecione um ficheiro CSV.');
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => setError('Não foi possível ler o ficheiro CSV.');
    reader.onload = () => {
      try {
        const parsed = parseCSV(String(reader.result ?? ''));
        setRows(parsed);
        setFileName(file.name);
        setError('');
        setColumns({
          A: { ...EMPTY_COLUMN, facets: { ...EMPTY_FACETS } },
          B: { ...EMPTY_COLUMN, facets: { ...EMPTY_FACETS } },
        });
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Não foi possível interpretar o CSV.');
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  const updateColumn = (id: ColumnId, update: (column: ColumnState) => ColumnState) => {
    setColumns((current) => ({ ...current, [id]: update(current[id]) }));
  };

  const getFilteredRows = (id: ColumnId, exceptFacet?: FacetKey) => rows.filter((row) => {
    const state = columns[id];
    const matrix = String(row['ID da Matriz'] ?? '').trim().toLocaleUpperCase();
    if (state.matrixKind === 'habilidade' && !matrix.startsWith('MH')) return false;
    if (state.matrixKind === 'conhecimento' && matrix.startsWith('MH')) return false;
    return FACET_DEFINITIONS.every(({ key }) => {
      if (key === exceptFacet) return true;
      const selected = state.facets[key];
      return !selected.length || selected.includes(getFacetValue(row, key));
    });
  });

  const filteredA = useMemo(() => getFilteredRows('A'), [rows, columns]);
  const filteredB = useMemo(() => getFilteredRows('B'), [rows, columns]);
  const uniqueA = useMemo(() => uniqueRows(filteredA), [filteredA]);
  const uniqueB = useMemo(() => uniqueRows(filteredB), [filteredB]);
  const chartRows = chartSource === 'A' ? uniqueA : uniqueB;
  const doneCount = chartRows.filter((row) => !isPending(row._status)).length;
  const pendingCount = chartRows.length - doneCount;
  const peopleCount = new Set(chartRows.map((row) => row._fullname)).size;
  const trainingCount = new Set(chartRows.map((row) => row['Título do Item'])).size;
  const completionBy = (getValue: (row: FormationRow) => string) => {
    const groups = new Map<string, { done: number; total: number }>();
    chartRows.forEach((row) => {
      const label = getValue(row) || 'Não informado';
      const group = groups.get(label) ?? { done: 0, total: 0 };
      group.total += 1;
      if (!isPending(row._status)) group.done += 1;
      groups.set(label, group);
    });
    return [...groups.entries()]
      .map(([label, value]) => ({ label, value: Number(((value.done / value.total) * 100).toFixed(1)) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 12);
  };
  const pendingByTraining = [...chartRows.reduce((groups, row) => {
    if (isPending(row._status)) {
      const label = row['Título do Item'] || 'Não informado';
      groups.set(label, (groups.get(label) ?? 0) + 1);
    }
    return groups;
  }, new Map<string, number>()).entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const exportCSV = (id: ColumnId) => {
    const exportRows = uniqueRows(getFilteredRows(id));
    const headers = ['ID do Item', 'Nome', 'Cargo', 'Unidade Organizacional', 'Título da Formação', 'Status', 'ID da Matriz'];
    const quote = (value: string) => `"${String(value).replace(/"/g, '""')}"`;
    const content = `\uFEFF${[
      headers,
      ...exportRows.map((row) => [
        row['ID do Item'] ?? '', row._fullname, row._cargo, getOrganizationalUnit(row),
        row['Título do Item'] ?? '', row._status || 'Não Realizado', row['ID da Matriz'] ?? '',
      ]),
    ].map((line) => line.map(quote).join(';')).join('\r\n')}`;
    const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `matriz_${id}_filtrada.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderColumn = (id: ColumnId, title: string, columnRows: FormationRow[]) => {
    const state = columns[id];
    const unique = uniqueRows(columnRows);
    const done = unique.filter((row) => !isPending(row._status)).length;
    const pending = unique.length - done;
    const percentage = unique.length ? (done / unique.length) * 100 : 0;
    const query = normalizeText(state.query);
    const tableRows = unique
      .filter((row) => !query || normalizeText([
        row['ID do Item'], row._fullname, row._cargo, getOrganizationalUnit(row),
        row['Título do Item'], row['ID da Matriz'],
      ].join(' ')).includes(query))
      .sort((a, b) => a._fullname.localeCompare(b._fullname, 'pt-BR'));

    return (
      <section className="formation-panel" key={id}>
        <header className="formation-panel-header">
          <span className={`formation-badge formation-badge-${id.toLowerCase()}`}>{id}</span>
          <h2>{title}</h2>
          <span className="formation-panel-total">{columnRows.length} registos</span>
        </header>
        <div className="formation-panel-body">
          <div className="formation-filters">
            {FACET_DEFINITIONS.map(({ key, label }) => {
              const facetOptions = [...new Set(getFilteredRows(id, key).map((row) => getFacetValue(row, key)).filter(Boolean))]
                .sort((a, b) => a.localeCompare(b, 'pt-BR'));
              return (
                <FilterSelect
                  key={key}
                  label={label}
                  values={facetOptions}
                  selected={state.facets[key]}
                  onChange={(selected) => updateColumn(id, (current) => ({
                    ...current,
                    facets: { ...current.facets, [key]: selected },
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
                  }))}
                >Conhecimento (MC)</button>
                <button
                  type="button"
                  className={state.matrixKind === 'habilidade' ? 'is-active' : ''}
                  onClick={() => updateColumn(id, (current) => ({
                    ...current, matrixKind: current.matrixKind === 'habilidade' ? null : 'habilidade',
                  }))}
                >Habilidade (MH)</button>
              </div>
            </div>
            <div className="formation-column-actions">
              <span className="formation-live-filter">Filtros em tempo real</span>
              <button
                type="button"
                className="formation-button"
                onClick={() => updateColumn(id, () => ({ ...EMPTY_COLUMN, facets: { ...EMPTY_FACETS } }))}
              ><X size={14} /> Limpar</button>
              <button
                type="button"
                className="formation-button"
                onClick={() => exportCSV(id)}
                disabled={!unique.length}
              ><Download size={14} /> Exportar CSV</button>
            </div>
          </div>

          <div className="formation-stats">
            {[
              ['Registos', columnRows.length],
              ['Pessoas', new Set(unique.map((row) => row._fullname)).size],
              ['Formações', new Set(unique.map((row) => row['Título do Item'])).size],
              ['Matrizes', new Set(unique.map((row) => row['ID da Matriz'])).size],
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
              <span><i className="formation-legend-done" />Realizados: <strong>{done}</strong></span>
              <span><i className="formation-legend-pending" />Pendentes: <strong>{pending}</strong></span>
              <span>Total único: <strong>{unique.length}</strong></span>
            </div>
          </div>

          <label className="formation-table-search">
            <Search size={15} />
            <input
              value={state.query}
              onChange={(event) => updateColumn(id, (current) => ({ ...current, query: event.target.value }))}
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
                  const pendingRow = isPending(row._status);
                  return (
                    <tr key={`${row['ID do Item']}-${row._fullname}-${row['ID da Matriz']}-${index}`}>
                      <td><span className="formation-chip">{row['ID do Item']}</span></td>
                      <td className="formation-person">{row._fullname}</td>
                      <td>{row._cargo || '—'}</td>
                      <td>{getOrganizationalUnit(row) || '—'}</td>
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
                    {rows.length ? 'Nenhum registo encontrado para os critérios selecionados.' : 'Carregue um CSV para visualizar os registos.'}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
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
          <button type="button" className="formation-upload-button" onClick={() => fileInputRef.current?.click()}>
            <Upload size={16} /> Carregar CSV
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
            <span>{fileName ? `${fileName} · ${rows.length} registos` : 'Arraste um ficheiro ou clique ao lado'}</span>
          </div>
        </div>
      </div>

      <div className="formation-content">
        {error && <div className="formation-error" role="alert"><CircleHelp size={17} />{error}</div>}
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
            {renderColumn('A', 'Matriz de Referência (A)', filteredA)}
            {renderColumn('B', 'Matriz de Comparação (B)', filteredB)}
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
                { label: 'Total de pessoas', value: peopleCount, icon: <Users size={17} /> },
                { label: 'Formações únicas', value: trainingCount, icon: <FileUp size={17} /> },
                { label: 'Concluídos', value: doneCount, tone: 'done', icon: <Check size={17} /> },
                { label: 'Pendentes', value: pendingCount, tone: 'pending', icon: <X size={17} /> },
                { label: 'Taxa de aproveitamento', value: formatPercent(chartRows.length ? (doneCount / chartRows.length) * 100 : 0), tone: 'percent', icon: <BarChart3 size={17} /> },
              ].map((stat) => (
                <div className={`formation-summary-card ${stat.tone ?? ''}`} key={stat.label}>
                  <span>{stat.icon}{stat.label}</span><strong>{stat.value}</strong>
                </div>
              ))}
            </div>
            <div className="formation-chart-grid">
              <section className="formation-chart-card">
                <h3>Proporção: realizados vs. pendentes</h3>
                <CompletionDonut done={doneCount} pending={pendingCount} />
              </section>
              <section className="formation-chart-card">
                <h3>Top 10 formações com mais pendências</h3>
                <BarChart items={pendingByTraining} />
              </section>
              <section className="formation-chart-card">
                <h3>Aproveitamento por unidade organizacional (%)</h3>
                <BarChart items={completionBy(getOrganizationalUnit)} suffix="%" />
              </section>
              <section className="formation-chart-card">
                <h3>Aproveitamento por cargo (%)</h3>
                <BarChart items={completionBy((row) => row._cargo)} suffix="%" />
              </section>
            </div>
          </section>
        )}
        {!rows.length && !error && (
          <div className="formation-hint"><FileUp size={18} /> Carregue a exportação CSV da matriz para começar a análise.</div>
        )}
      </div>
    </main>
  );
}
