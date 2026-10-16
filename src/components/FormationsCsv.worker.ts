type FormationRow = Record<string, string> & {
  _fullname: string;
  _cargo: string;
  _status: string;
  _prn: string;
  _uo: string;
  _pending: 'pending' | 'done';
  _searchText: string;
};

type ColumnId = 'A' | 'B';
type MatrixKind = 'conhecimento' | 'habilidade' | null;
type FacetKey = 'nome' | 'prn' | 'uo' | 'cargo' | 'matriz' | 'estado';
type Facets = Record<FacetKey, string[]>;

interface ColumnState {
  facets: Facets;
  matrixKind: MatrixKind;
  query: string;
  page: number;
}

interface ParsedColumn {
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

interface LoadRequest {
  type: 'load';
  requestId: number;
  file: File;
}

interface FilterRequest {
  type: 'filter';
  requestId: number;
  columns: Record<ColumnId, ColumnState>;
  chartSource: ColumnId;
}

interface ExportRequest {
  type: 'export';
  requestId: number;
  columnId: ColumnId;
  column: ColumnState;
}

interface FacetOptionsRequest {
  type: 'facet-options';
  requestId: number;
  columnId: ColumnId;
  column: ColumnState;
  facetKey: FacetKey;
  query: string;
}

type WorkerRequest = LoadRequest | FilterRequest | ExportRequest | FacetOptionsRequest;

const FACET_KEYS: FacetKey[] = ['nome', 'prn', 'uo', 'cargo', 'matriz', 'estado'];
const PAGE_SIZE = 100;
const normalizeText = (value: unknown) => String(value ?? '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase('pt-BR')
  .trim();

let rows: FormationRow[] = [];
let latestLoadRequest = 0;
const columnCache: Partial<Record<ColumnId, {
  key: string;
  filteredCount: number;
  uniqueRows: FormationRow[];
  peopleCount: number;
  trainingCount: number;
  matrixCount: number;
  doneCount: number;
  chartData: ReturnType<typeof getChartData>;
}>> = {};
const facetOptionsCache = new Map<string, string[]>();

function parseCSV(text: string): FormationRow[] {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? '';
  const delimiter = (firstLine.match(/;/g)?.length ?? 0) >= (firstLine.match(/,/g)?.length ?? 0)
    ? ';'
    : ',';
  const parsedRows: string[][] = [];
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
      if (row.some((value) => value.trim())) parsedRows.push(row);
      row = [];
      field = '';
    } else {
      field += character;
    }
  }

  if (field || row.length) {
    row.push(field);
    if (row.some((value) => value.trim())) parsedRows.push(row);
  }
  if (parsedRows.length < 2) throw new Error('O CSV precisa conter cabeçalho e pelo menos um registo.');

  const headers = parsedRows[0].map((header) => header.trim().replace(/^\uFEFF/, ''));
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
  const userField = findHeader(['Usuário', 'User', 'PRN', 'Utilizador', 'User ID']);
  const unitNumberField = findHeader(['Unidade Organizacional', 'Organizational Unit ID', 'UO']);
  const unitDescriptionField = findHeader([
    'Descrição da Unidade Organizacional', 'Descricao da Unidade Organizacional',
    'Descrição UO', 'Organizational Unit Description',
  ]);

  const missing = [
    !firstNameField && !fullNameField && 'Nome ou Nome Completo',
    !itemIdField && 'ID do Item',
    !itemTitleField && 'Título do Item',
    !matrixField && 'ID da Matriz',
  ].filter(Boolean);
  if (missing.length) throw new Error(`Colunas obrigatórias não encontradas: ${missing.join(', ')}.`);
  if (!itemIdField || !itemTitleField || !matrixField) {
    throw new Error('O CSV precisa conter ID do Item, Título do Item e ID da Matriz.');
  }

  return parsedRows.slice(1).map((values): FormationRow | null => {
    const item: Record<string, string> = {};
    headers.forEach((header, index) => {
      item[header] = String(values[index] ?? '').trim();
    });
    const fullName = (fullNameField
      ? item[fullNameField]
      : `${firstNameField ? item[firstNameField] : ''} ${lastNameField ? item[lastNameField] : ''}`)
      .trim()
      .replace(/\s+/g, ' ');
    if (!fullName && !item[itemIdField]) return null;

    const cargo = cargoField ? item[cargoField] ?? '' : '';
    const status = statusField ? item[statusField] ?? '' : '';
    const number = unitNumberField ? item[unitNumberField] : '';
    const description = unitDescriptionField ? item[unitDescriptionField] : '';
    const unitName = number
      ? description.replace(/\s*\(([^()]*)\)\s*$/, (suffix, value: string) =>
        normalizeText(value) === normalizeText(number) ? '' : suffix).trim()
      : description;
    const unit = number && unitName ? `${number} - ${unitName}` : number || unitName;
    const normalizedStatus = normalizeText(status);
    const pending = !normalizedStatus || [
      'nao realizado', 'pendente', 'nao concluido', 'not completed',
      'incomplete', 'in progress', 'em andamento',
    ].includes(normalizedStatus);

    return {
      ...item,
      _fullname: fullName,
      _cargo: cargo,
      _status: status,
      _prn: userField ? item[userField] ?? '' : '',
      _uo: unit,
      _pending: pending ? 'pending' : 'done',
      _searchText: normalizeText([
        item[itemIdField], fullName, cargo, unit, item[itemTitleField], item[matrixField],
      ].join(' ')),
    };
  }).filter((item): item is FormationRow => item !== null);
}

function getFacetValue(row: FormationRow, key: FacetKey) {
  switch (key) {
    case 'nome': return row._fullname;
    case 'prn': return row._prn;
    case 'uo': return row._uo;
    case 'cargo': return row._cargo;
    case 'matriz': return row['ID da Matriz'] || '';
    case 'estado': return row._pending === 'pending' ? 'Pendentes' : 'Realizados';
  }
}

function deriveColumn(columnId: ColumnId, state: ColumnState) {
  const cacheKey = JSON.stringify([state.facets, state.matrixKind]);
  const cached = columnCache[columnId];
  if (cached?.key === cacheKey) return cached;

  const filteredRows: FormationRow[] = [];
  for (const row of rows) {
    const matrix = String(row['ID da Matriz'] ?? '').trim().toLocaleUpperCase();
    if (state.matrixKind === 'habilidade' && !matrix.startsWith('MH')) continue;
    if (state.matrixKind === 'conhecimento' && matrix.startsWith('MH')) continue;

    const values = FACET_KEYS.map((key) => getFacetValue(row, key));
    const matches = FACET_KEYS.map((key, index) => {
      const selected = state.facets[key];
      return !selected.length || selected.includes(values[index]);
    });
    if (matches.every(Boolean)) filteredRows.push(row);
  }

  const unique = new Map<string, FormationRow>();
  for (const row of filteredRows) {
    const key = [row['ID do Item'], row._fullname, row['Título do Item'], row['ID da Matriz']].join('|||');
    unique.set(key, row);
  }
  const uniqueRows = [...unique.values()].sort((a, b) => a._fullname.localeCompare(b._fullname, 'pt-BR'));
  const people = new Set<string>();
  const trainings = new Set<string>();
  const matrices = new Set<string>();
  let doneCount = 0;
  for (const row of uniqueRows) {
    people.add(row._fullname);
    trainings.add(row['Título do Item'] ?? '');
    matrices.add(row['ID da Matriz'] ?? '');
    if (row._pending === 'done') doneCount += 1;
  }
  const result = {
    key: cacheKey,
    filteredCount: filteredRows.length,
    uniqueRows,
    peopleCount: people.size,
    trainingCount: trainings.size,
    matrixCount: matrices.size,
    doneCount,
    chartData: getChartData(uniqueRows),
  };
  columnCache[columnId] = result;
  return result;
}

function getFacetOptions(request: FacetOptionsRequest) {
  const { columnId, column, facetKey } = request;
  const cacheKey = JSON.stringify([
    columnId,
    column.matrixKind,
    FACET_KEYS.filter((key) => key !== facetKey).map((key) => [key, column.facets[key]]),
    facetKey,
  ]);
  let options = facetOptionsCache.get(cacheKey);
  if (!options) {
    const available = new Set<string>();
    for (const row of rows) {
      const matrix = String(row['ID da Matriz'] ?? '').trim().toLocaleUpperCase();
      if (column.matrixKind === 'habilidade' && !matrix.startsWith('MH')) continue;
      if (column.matrixKind === 'conhecimento' && matrix.startsWith('MH')) continue;

      const matchesOtherFacets = FACET_KEYS.every((key) => (
        key === facetKey
        || !column.facets[key].length
        || column.facets[key].includes(getFacetValue(row, key))
      ));
      if (matchesOtherFacets) {
        const value = getFacetValue(row, facetKey);
        if (value) available.add(value);
      }
    }
    options = [...available].sort((a, b) => a.localeCompare(b, 'pt-BR'));
    facetOptionsCache.set(cacheKey, options);
  }

  const query = normalizeText(request.query);
  const matching = query ? options.filter((value) => normalizeText(value).includes(query)) : options;
  return { values: matching.slice(0, 200), total: matching.length };
}

function getPage(columnId: ColumnId, state: ColumnState): ParsedColumn {
  const derived = deriveColumn(columnId, state);
  const query = normalizeText(state.query);
  const matching = query
    ? derived.uniqueRows.filter((row) => row._searchText.includes(query))
    : derived.uniqueRows;
  const pageCount = Math.max(1, Math.ceil(matching.length / PAGE_SIZE));
  const page = Math.min(state.page, pageCount);
  return {
    filteredCount: derived.filteredCount,
    uniqueCount: derived.uniqueRows.length,
    peopleCount: derived.peopleCount,
    trainingCount: derived.trainingCount,
    matrixCount: derived.matrixCount,
    doneCount: derived.doneCount,
    pendingCount: derived.uniqueRows.length - derived.doneCount,
    matchingCount: matching.length,
    pageCount,
    page,
    rows: matching.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
  };
}

function getChartData(chartRows: FormationRow[]) {
  let doneCount = 0;
  const people = new Set<string>();
  const trainings = new Set<string>();
  const pendingByTraining = new Map<string, number>();
  const completionByUnit = new Map<string, { done: number; total: number }>();
  const completionByRole = new Map<string, { done: number; total: number }>();
  const addToGroup = (groups: Map<string, { done: number; total: number }>, label: string, done: boolean) => {
    const group = groups.get(label) ?? { done: 0, total: 0 };
    group.total += 1;
    if (done) group.done += 1;
    groups.set(label, group);
  };

  for (const row of chartRows) {
    const done = row._pending === 'done';
    const training = row['Título do Item'] || 'Não informado';
    people.add(row._fullname);
    trainings.add(training);
    if (done) doneCount += 1;
    else pendingByTraining.set(training, (pendingByTraining.get(training) ?? 0) + 1);
    addToGroup(completionByUnit, row._uo || 'Não informado', done);
    addToGroup(completionByRole, row._cargo || 'Não informado', done);
  }
  const percentages = (groups: Map<string, { done: number; total: number }>) => [...groups.entries()]
    .map(([label, value]) => ({ label, value: Number(((value.done / value.total) * 100).toFixed(1)) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 12);

  return {
    doneCount,
    pendingCount: chartRows.length - doneCount,
    peopleCount: people.size,
    trainingCount: trainings.size,
    completionByUnit: percentages(completionByUnit),
    completionByRole: percentages(completionByRole),
    pendingByTraining: [...pendingByTraining.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10),
  };
}

function toCSV(columnId: ColumnId, state: ColumnState) {
  const data = deriveColumn(columnId, state);
  const headers = ['ID do Item', 'Nome', 'Cargo', 'Unidade Organizacional', 'Título da Formação', 'Status', 'ID da Matriz'];
  const quote = (value: string) => `"${String(value).replace(/"/g, '""')}"`;
  return `\uFEFF${[
    headers,
    ...data.uniqueRows.map((row) => [
      row['ID do Item'] ?? '', row._fullname, row._cargo, row._uo,
      row['Título do Item'] ?? '', row._status || 'Não Realizado', row['ID da Matriz'] ?? '',
    ]),
  ].map((line) => line.map(quote).join(';')).join('\r\n')}`;
}

self.addEventListener('message', async (event: MessageEvent<WorkerRequest>) => {
  const request = event.data;
  try {
    if (request.type === 'load') {
      latestLoadRequest = request.requestId;
      const parsedRows = parseCSV(await request.file.text());
      if (request.requestId !== latestLoadRequest) return;
      rows = parsedRows;
      delete columnCache.A;
      delete columnCache.B;
      facetOptionsCache.clear();
      self.postMessage({ type: 'loaded', requestId: request.requestId, rowCount: rows.length });
      return;
    }

    if (request.type === 'filter') {
      const columnA = getPage('A', request.columns.A);
      const columnB = getPage('B', request.columns.B);
      const chartData = deriveColumn(request.chartSource, request.columns[request.chartSource]).chartData;
      self.postMessage({
        type: 'filtered',
        requestId: request.requestId,
        columns: { A: columnA, B: columnB },
        chartData,
      });
      return;
    }

    if (request.type === 'facet-options') {
      self.postMessage({
        type: 'facet-options',
        requestId: request.requestId,
        columnId: request.columnId,
        facetKey: request.facetKey,
        ...getFacetOptions(request),
      });
      return;
    }

    if (request.type === 'export') {
      self.postMessage({
        type: 'exported',
        requestId: request.requestId,
        columnId: request.columnId,
        csv: toCSV(request.columnId, request.column),
      });
    }
  } catch (error) {
    self.postMessage({
      type: 'error',
      requestId: request.type === 'load' ? request.requestId : request.requestId,
      message: error instanceof Error ? error.message : 'Ocorreu um erro ao processar a planilha.',
    });
  }
});
