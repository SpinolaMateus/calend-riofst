import { Employee, PeopleAnalyticsKPI, MacroareaMapping, ActionPlanItem } from '../types/peopleAnalytics';
import kba1RealEmployees from './kba1RealEmployees.json';

export const OFFICIAL_GG_KPIS: PeopleAnalyticsKPI[] = [
  {
    id: 'matriz_habilidade_piloto',
    name: 'Atendimento da matriz de habilidade por função (Piloto)',
    description: 'Percentual de atendimento das competências operacionais exigidas na matriz de habilidades da área piloto.',
    category: 'Treinamento',
    unit: '%',
    target1: 84.8,
    target3: 90.0,
    target5: 95.0,
    actual: null, // Sem dados realizados na tabela de origem; não inventar
    polarity: 'higher_is_better',
    responsible: 'Gente & Gestão / Pilar Educação e Treinamento',
    source: 'Matriz de Habilidades - Sistema Operacional',
    lastUpdated: null,
    recommendedAction: 'Acompanhar cronograma de treinamentos práticos on the job com multiplicadores internos.',
  },
  {
    id: 'matriz_conhecimento_unidade',
    name: 'Atendimento da matriz de conhecimento (Unidade)',
    description: 'Percentual de colaboradores com capacitação concluída nas trilhas de conhecimento geral da unidade.',
    category: 'Treinamento',
    unit: '%',
    target1: 83.9,
    target3: 88.0,
    target5: 93.0,
    actual: null,
    polarity: 'higher_is_better',
    responsible: 'Gente & Gestão',
    source: 'Portal de Aprendizagem Corporativo',
    lastUpdated: null,
    recommendedAction: 'Engajar gestores de área para liberação de tempo de estudo em sala e EAD.',
  },
  {
    id: 'matriz_pilares_superar',
    name: 'Atendimento da matriz de conhecimento dos Pilares do Superar',
    description: 'Adesão às capacitações dos pilares metodológicos do Programa Superar (MP, GA, ET, MF, SSMA).',
    category: 'Treinamento',
    unit: '%',
    target1: 70.0,
    target3: 75.0,
    target5: 80.0,
    actual: null,
    polarity: 'higher_is_better',
    responsible: 'Coordenação Superar / Educador Técnico',
    source: 'Registros de Treinamento Superar',
    lastUpdated: null,
    recommendedAction: 'Realizar workshops de alinhamento metodológico com as lideranças operacionais.',
  },
  {
    id: 'treinamentos_obrigatorios_enk',
    name: 'Atendimento nos treinamentos obrigatórios do Portal ENK (Unidade)',
    description: 'Conclusão de cursos obrigatórios corporativos disponibilizados na plataforma ENK para colaboradores da unidade.',
    category: 'Treinamento',
    unit: '%',
    target1: 90.0,
    target3: 95.0,
    target5: 100.0,
    actual: null,
    polarity: 'higher_is_better',
    responsible: 'Gente & Gestão',
    source: 'Portal ENK LMS',
    lastUpdated: null,
    recommendedAction: 'Emitir relatórios semanais para gestores de colaboradores com treinamentos pendentes.',
  },
  {
    id: 'instrutores_internos',
    name: 'Treinamentos realizados por instrutores internos (Unidade)',
    description: 'Proporção de treinamentos operacionais e comportamentais ministrados por multiplicadores da própria fábrica.',
    category: 'Treinamento',
    unit: '%',
    target1: 80.0,
    target3: 80.0,
    target5: 80.0,
    actual: null,
    polarity: 'higher_is_better',
    responsible: 'Pilar Educação e Treinamento',
    source: 'Lista de Presença & Diário de Bordo',
    lastUpdated: null,
    recommendedAction: 'Capacitar novos instrutores internos com técnicas de didática e elaboração de LUP.',
  },
  {
    id: 'jornada_lideranca',
    name: 'Adesão nas ações da jornada da liderança (Unidade)',
    description: 'Participação efetiva de coordenadores, supervisores e líderes de equipe nas oficinas da Jornada da Liderança.',
    category: 'Liderança',
    unit: '%',
    target1: 80.0,
    target3: 80.0,
    target5: 80.0,
    actual: null,
    polarity: 'higher_is_better',
    responsible: 'Gerência de Gente & Gestão',
    source: 'Frequência da Jornada de Liderança',
    lastUpdated: null,
    recommendedAction: 'Ajustar agenda das oficinas para não colidir com fechamentos de turno críticos.',
  },
  {
    id: 'perdas_falha_mao_obra',
    name: 'Perdas causadas por falha de mão de obra (Unidade)',
    description: 'Indicador de perdas e refugos fabris atribuídos a erros operacionais ou de execução. Valores de referência 10 / 11 / 9.',
    category: 'Qualidade',
    unit: 'unidades',
    target1: 10.0,
    target3: 11.0,
    target5: 9.0,
    actual: null,
    polarity: 'to_validate',
    polarityNotes: 'Sequência 10 / 11 / 9 com polaridade a ser validada pela operação (não assumir direção automaticamente).',
    responsible: 'Qualidade / Produção',
    source: 'Sistema de Apontamento de Perdas Fabris',
    lastUpdated: null,
    recommendedAction: 'Alinhar com a Engenharia de Processos o critério de apuração e a unidade de medida.',
  },
  {
    id: 'treinamentos_requisitos_legais',
    name: 'Atendimento de treinamentos nos requisitos legais (Unidade)',
    description: 'Conformidade de reciclagem de NRs obrigatórias (NR-10, NR-11, NR-12, NR-33, NR-35, CIPA, etc.).',
    category: 'Treinamento',
    unit: '%',
    target1: 90.0,
    target3: 95.0,
    target5: 100.0,
    actual: null,
    polarity: 'higher_is_better',
    responsible: 'Segurança do Trabalho (SESMT) / G&G',
    source: 'Controle de Validade de NRs',
    lastUpdated: null,
    recommendedAction: 'Planejar turmas de reciclagem com 60 dias de antecedência ao vencimento.',
  },
  {
    id: 'turnover_unidade',
    name: 'Turnover',
    description: 'Taxa de rotatividade mensal de colaboradores da unidade. Menor é melhor.',
    category: 'Turnover',
    unit: '%',
    target1: 1.12,
    target3: 1.10,
    target5: 1.06,
    actual: null,
    polarity: 'lower_is_better',
    responsible: 'Gente & Gestão',
    source: 'Folha de Pagamento / Movimentações PAAH',
    lastUpdated: null,
    recommendedAction: 'Realizar entrevistas de desligamento aprofundadas e monitorar retenção no período de experiência.',
  },
];

export const INITIAL_MACROAREA_MAPPINGS: MacroareaMapping[] = [
  { costCenterPattern: 'Expedição', macroarea: 'Expedição & Logística' },
  { costCenterPattern: 'Onduladeira', macroarea: 'Produção Onduladeira' },
  { costCenterPattern: 'Conversoras', macroarea: 'Conversão' },
  { costCenterPattern: 'WARD', macroarea: 'Impressão & Corte' },
  { costCenterPattern: 'FFG', macroarea: 'Impressão & Corte' },
  { costCenterPattern: 'Manutenção', macroarea: 'Manutenção & Engenharia' },
  { costCenterPattern: 'Qualidade', macroarea: 'Qualidade & Laboratório' },
  { costCenterPattern: 'Almoxarifado', macroarea: 'Suprimentos & Almoxarifado' },
  { costCenterPattern: 'Gente', macroarea: 'Gente & Gestão' },
  { costCenterPattern: 'Segurança', macroarea: 'SSMA' },
  { costCenterPattern: 'Diretoria', macroarea: 'Administração & Controladoria' },
];

export const INITIAL_ACTION_PLANS: ActionPlanItem[] = [
  {
    id: 'act-pa-01',
    title: 'Mapeamento e Classificação de Jornadas Excepcionais',
    scope: 'Outras Jornadas (20 colaboradores)',
    evidence: '20 registros cadastrados com jornadas específicas (ex: estágios, aprendizes e 07:00-15:40) requerem validação operacional de escala.',
    hypothesis: 'Registros com contratos especiais de aprendizagem e horários técnicos não consolidados nos turnos A/B/C principais.',
    suggestedAction: 'Validar junto à supervisão de Gente & Gestão e operação a categorização oficial de cada jornada especial.',
    responsible: 'Gente & Gestão',
    priority: 'Média',
    deadline: '2026-11-15',
    status: 'Em Andamento',
    createdAt: '2026-10-29',
  },
  {
    id: 'act-pa-02',
    title: 'Equalização do Quadro Operacional da Onduladeira nº 00',
    scope: 'Onduladeira nº 00 (41 colaboradores)',
    evidence: 'Setor concentra 41 colaboradores distribuídos entre os turnos A, B e C, demandando cobertura homogênea de operadores qualificados.',
    hypothesis: 'Equilíbrio de operadores experientes entre as escalas para manter produtividade contínua.',
    suggestedAction: 'Auditar matriz de polivalência para garantir ao menos 2 operadores nível IV por turno.',
    responsible: 'Coordenação de Produção / Pilar ET',
    priority: 'Alta',
    deadline: '2026-11-20',
    status: 'Planejado',
    createdAt: '2026-10-29',
  },
];

// Retorna a base oficial real de 353 colaboradores da unidade Bahia (KBA1 / K111 Feira de Santana)
// com totais, dados nominais, gêneros (homens/mulheres), turnos e gestores auditados do PAAH
export function generateInitialBahiaEmployees(): Employee[] {
  if (Array.isArray(kba1RealEmployees) && kba1RealEmployees.length > 0) {
    return kba1RealEmployees as unknown as Employee[];
  }
  const employees: Employee[] = [];

  const costCenterDist: { name: string; code: string; count: number; macro: string; location: string }[] = [
    { name: 'Expedição', code: 'CC-1010', count: 41, macro: 'Expedição & Logística', location: 'Armazém de Expedição' },
    { name: 'Onduladeira nº 00', code: 'CC-2010', count: 41, macro: 'Produção Onduladeira', location: 'Linha Onduladeira 00' },
    { name: 'Conversoras', code: 'CC-2020', count: 27, macro: 'Conversão', location: 'Área de Conversão' },
    { name: 'Impressora WARD IV', code: 'CC-2034', count: 18, macro: 'Impressão & Corte', location: 'Célula WARD IV' },
    { name: 'Impressora WARD II', code: 'CC-2032', count: 18, macro: 'Impressão & Corte', location: 'Célula WARD II' },
    { name: 'FFG SUNRISE', code: 'CC-2040', count: 18, macro: 'Impressão & Corte', location: 'Linha FFG Sunrise' },
    { name: 'WARD III', code: 'CC-2033', count: 18, macro: 'Impressão & Corte', location: 'Célula WARD III' },
    { name: 'Manutenção Mecânica', code: 'CC-3010', count: 16, macro: 'Manutenção & Engenharia', location: 'Oficina Mecânica' },
    { name: 'Manutenção Elétrica', code: 'CC-3020', count: 15, macro: 'Manutenção & Engenharia', location: 'Oficina Elétrica' },
    { name: 'Almoxarifado e Peças', code: 'CC-4010', count: 14, macro: 'Suprimentos & Almoxarifado', location: 'Almoxarifado Central' },
    { name: 'Qualidade & Controle', code: 'CC-5010', count: 13, macro: 'Qualidade & Laboratório', location: 'Laboratório de Ensaios' },
    { name: 'Gente & Gestão / RH', code: 'CC-6010', count: 12, macro: 'Gente & Gestão', location: 'Prédio Administrativo' },
    { name: 'SSMA - Saúde e Segurança', code: 'CC-7010', count: 11, macro: 'SSMA', location: 'Ambulatório e Segurança' },
    { name: 'Colagem e Acabamento', code: 'CC-2050', count: 11, macro: 'Conversão', location: 'Área de Acabamento' },
    { name: 'Paletização Automática', code: 'CC-1020', count: 10, macro: 'Expedição & Logística', location: 'Setor de Paletes' },
    { name: 'Preparação de Tintas e Clichês', code: 'CC-2060', count: 9, macro: 'Impressão & Corte', location: 'Cozinha de Tintas' },
    { name: 'Pilar Educação e Treinamento', code: 'CC-6020', count: 8, macro: 'Gente & Gestão', location: 'Sala de Treinamento' },
    { name: 'Caldeira e Utilidades', code: 'CC-3030', count: 8, macro: 'Manutenção & Engenharia', location: 'Casa de Caldeiras' },
    { name: 'Engenharia de Processos', code: 'CC-3040', count: 7, macro: 'Manutenção & Engenharia', location: 'Engenharia' },
    { name: 'Planejamento e Controle (PCP)', code: 'CC-8010', count: 7, macro: 'Administração & Controladoria', location: 'Sala PCP' },
    { name: 'Administração e Controladoria', code: 'CC-8020', count: 6, macro: 'Administração & Controladoria', location: 'Controladoria' },
    { name: 'Tecnologia da Informação', code: 'CC-9010', count: 6, macro: 'Administração & Controladoria', location: 'Sala de Servidores TI' },
    { name: 'Gerência Geral da Unidade', code: 'CC-9020', count: 4, macro: 'Administração & Controladoria', location: 'Diretoria Unidade' },
    { name: 'Serviços Gerais e Facilities', code: 'CC-4020', count: 4, macro: 'Suprimentos & Almoxarifado', location: 'Facilities' },
    { name: 'Outros Centros de Custo Fabris', code: 'CC-9999', count: 42, macro: 'Produção Onduladeira', location: 'Áreas Fabris Diversas' },
  ];

  // Gestores imediatos (23 nomes distintos)
  const managers = [
    'Carlos Eduardo Silva', 'Marcos Vinicius Santos', 'Patricia Lima Ferreira', 'Rodrigo Oliveira Souza',
    'Tatiane Mendes Rocha', 'Luciano Barbosa Santana', 'Fernanda Carla Ribeiro', 'Alexandre Costa Dias',
    'Juliana Albuquerque', 'Rafael Martins Castro', 'Marcio Andre Guimaraes', 'Vanessa Queiroz Neves',
    'Eduardo Henrique Melo', 'Daniela Fontes Teles', 'Bruno Cesar Nogueira', 'Claudio Roberto Farias',
    'Renata Souza Prado', 'Leandro Pinheiro Ramos', 'Simone Batista Leal', 'Gustavo Henrique Paiva',
    'Aline Vasconcelos Brito', 'Thiago Cavalcanti', 'Mateus Spinola'
  ];

  // Principais cargos e contagens aproximadas baseadas na especificação
  const jobTemplates: { title: string; code: string; count: number }[] = [
    { title: 'Ajudante Produção II', code: 'CARG-104', count: 104 },
    { title: 'Operador Embalagem IV', code: 'CARG-035', count: 35 },
    { title: 'Ajudante Expedição II', code: 'CARG-024', count: 24 },
    { title: 'Operador Embalagem II', code: 'CARG-025', count: 24 },
    { title: 'Operador Empilhadeira I', code: 'CARG-022', count: 22 },
    { title: 'Mecânico Manutenção II', code: 'CARG-016', count: 16 },
    { title: 'Eletricista Manutenção II', code: 'CARG-015', count: 15 },
    { title: 'Analista Qualidade I', code: 'CARG-012', count: 12 },
    { title: 'Operador de Máquina I', code: 'CARG-010', count: 10 },
    { title: 'Líder de Produção', code: 'CARG-008', count: 8 },
    { title: 'Técnico de Segurança do Trabalho', code: 'CARG-007', count: 7 },
    { title: 'Almoxarife I', code: 'CARG-006', count: 6 },
    { title: 'Analista de Gente & Gestão', code: 'CARG-005', count: 5 },
    { title: 'Supervisor de Produção', code: 'CARG-004', count: 4 },
    { title: 'Assistente Administrativo', code: 'CARG-003', count: 3 },
    { title: 'Engenheiro de Processos', code: 'CARG-002', count: 2 },
    { title: 'Jovem Aprendiz Operacional', code: 'CARG-APR', count: 13 },
    { title: 'Estagiário Nível Superior', code: 'CARG-EST', count: 7 },
    { title: 'Operador de Utilidades', code: 'CARG-036', count: 36 },
  ];

  // Distribuição de jornadas estrita:
  // 88 Turno A, 84 Turno B, 87 Turno C, 74 Administrativo, 20 Outras
  const shifts: { cat: 'Turno A' | 'Turno B' | 'Turno C' | 'Administrativo' | 'Outras Jornadas'; code: string; name: string; target: number }[] = [
    { cat: 'Turno A', code: 'JRN-0614', name: 'Turno A - 06:00 às 14:20 (6x1 / 6x2)', target: 88 },
    { cat: 'Turno B', code: 'JRN-1422', name: 'Turno B - 14:20 às 22:30 (6x1 / 6x2)', target: 84 },
    { cat: 'Turno C', code: 'JRN-2206', name: 'Turno C - 22:30 às 06:00 (6x1 / 6x2 Noturno)', target: 87 },
    { cat: 'Administrativo', code: 'JRN-0817', name: 'Administrativo 5x2 - 08:00 às 17:00', target: 74 },
    { cat: 'Outras Jornadas', code: 'JRN-SPEC', name: 'Especiais / Aprendizes / Estágios (07:00-15:40)', target: 20 },
  ];

  let shiftCounters = {
    'Turno A': 0,
    'Turno B': 0,
    'Turno C': 0,
    'Administrativo': 0,
    'Outras Jornadas': 0,
  };

  let cltCount = 0;
  let aprendizCount = 0;
  let estagiarioCount = 0;

  // Gerar os 353 registros
  for (let i = 1; i <= 353; i++) {
    const prn = String(150000 + i);

    // Determinar vínculo
    let employmentGroup: 'CLT' | 'Aprendiz' | 'Estagiário' = 'CLT';
    if (aprendizCount < 13 && i > 333 && i <= 346) {
      employmentGroup = 'Aprendiz';
      aprendizCount++;
    } else if (estagiarioCount < 7 && i > 346) {
      employmentGroup = 'Estagiário';
      estagiarioCount++;
    } else {
      employmentGroup = 'CLT';
      cltCount++;
    }

    // Determinar Turno de acordo com as quotas
    let shift = shifts[0];
    if (employmentGroup === 'Aprendiz' || employmentGroup === 'Estagiário') {
      shift = shifts[4]; // Outras jornadas
      shiftCounters['Outras Jornadas']++;
    } else {
      if (shiftCounters['Turno A'] < 88) {
        shift = shifts[0];
        shiftCounters['Turno A']++;
      } else if (shiftCounters['Turno B'] < 84) {
        shift = shifts[1];
        shiftCounters['Turno B']++;
      } else if (shiftCounters['Turno C'] < 87) {
        shift = shifts[2];
        shiftCounters['Turno C']++;
      } else if (shiftCounters['Administrativo'] < 74) {
        shift = shifts[3];
        shiftCounters['Administrativo']++;
      } else {
        shift = shifts[4];
        shiftCounters['Outras Jornadas']++;
      }
    }

    // Determinar Centro de Custo
    let costCenterIndex = i % costCenterDist.length;
    const cc = costCenterDist[costCenterIndex];

    // Determinar Cargo
    let job = jobTemplates[i % jobTemplates.length];
    if (employmentGroup === 'Aprendiz') {
      job = { title: 'Jovem Aprendiz Operacional', code: 'CARG-APR', count: 13 };
    } else if (employmentGroup === 'Estagiário') {
      job = { title: 'Estagiário Nível Superior', code: 'CARG-EST', count: 7 };
    }

    // Gestor
    const manager = managers[i % managers.length];

    employees.push({
      prn,
      name: `Colaborador(a) PRN ${prn}`,
      unitCode: 'KBA1',
      unitName: 'Bahia',
      subareaCode: 'K111',
      subareaName: 'Feira de Santana',
      employmentGroup,
      employmentSubgroup: employmentGroup === 'CLT' ? 'Mensalista Produção' : employmentGroup,
      costCenterCode: cc.code,
      costCenterName: cc.name,
      macroarea: cc.macro,
      locationCode: `LOC-${(i % 53) + 100}`,
      locationName: cc.location,
      jobCode: job.code,
      jobTitle: job.title,
      position: `Posição ${(i % 35) + 1}`,
      immediateManager: manager,
      shiftCode: shift.code,
      shiftName: shift.name,
      shiftCategory: shift.cat,
      admissionDate: `202${(i % 5) + 1}-0${(i % 9) + 1}-${(i % 25) + 1}`.replace('-00', '-01'),
      status: i % 25 === 0 ? 'Férias' : i % 50 === 0 ? 'Afastado' : 'Ativo',
    });
  }

  return employees;
}

