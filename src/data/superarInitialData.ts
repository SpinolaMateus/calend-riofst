export interface SuperarAudit {
  id: string;
  name: string;
  meta: string;
  metaNumeric: number;
  months: { [month: string]: string | number | null };
  media: string | number | null;
  unit: '%' | 'pontos';
}

export interface SuperarMonthlyIndicator {
  id: string;
  name: string;
  category: 'M - Moral' | 'S - Segurança' | 'C - Custo';
  alavanca: 'Moral' | 'Segurança' | 'Custo';
  pilar: 'ET';
  unit: '%' | 'unidades' | 'horas' | 'índice';
  polarity: 'higher_is_better' | 'lower_is_better';
  peso: number; // Ex: 20 para 20%
  meta1: number;
  meta3: number;
  meta5: number;
  months: { [month: string]: number | null };
  media: number;
  acumulado?: number | string;
  notes?: string;
  seloBronzeCriteria?: {
    minimoAceitavel: number;
    metaGrau: number;
    superacao: number;
    total2025?: number;
  };
}

export interface SeloPremise {
  id: string;
  description: string;
  target: string;
  currentValue: string;
  status: 'atendida' | 'em_andamento' | 'gap';
}

export const SUPERAR_AUDITS_INITIAL: SuperarAudit[] = [
  {
    id: 'aud_passo',
    name: 'AUDITORIA DE PASSO',
    meta: '92%',
    metaNumeric: 92,
    months: {
      JAN: 91, FEV: 91, MAR: 91, ABR: null, MAI: null, JUN: null,
      JUL: null, AGO: null, SET: null, OUT: null, NOV: null, DEZ: null
    },
    media: 91.0,
    unit: '%'
  },
  {
    id: 'aud_selo',
    name: 'AUDITORIA DE SELO',
    meta: '92%',
    metaNumeric: 92,
    months: {
      JAN: 95.83, FEV: 95.83, MAR: 95.83, ABR: null, MAI: null, JUN: null,
      JUL: null, AGO: null, SET: null, OUT: null, NOV: null, DEZ: null
    },
    media: 95.83,
    unit: '%'
  },
  {
    id: 'aud_pilar',
    name: 'AUDITORIA DE PILAR',
    meta: '92%',
    metaNumeric: 92,
    months: {
      JAN: null, FEV: null, MAR: null, ABR: null, MAI: null, JUN: null,
      JUL: null, AGO: null, SET: null, OUT: null, NOV: null, DEZ: null
    },
    media: 'Em ciclo',
    unit: '%'
  },
  {
    id: 'conf_processo',
    name: 'CONFIRMAÇÃO DE PROCESSO',
    meta: '5.0',
    metaNumeric: 5.0,
    months: {
      JAN: 3.8, FEV: 4.6, MAR: 4.6, ABR: null, MAI: null, JUN: null,
      JUL: null, AGO: null, SET: null, OUT: null, NOV: null, DEZ: null
    },
    media: 4.33,
    unit: 'pontos'
  },
  {
    id: 'auto_avaliacao',
    name: 'AUTO AVALIAÇÃO',
    meta: '92%',
    metaNumeric: 92,
    months: {
      JAN: 96, FEV: 96, MAR: 96, ABR: null, MAI: null, JUN: null,
      JUL: null, AGO: null, SET: null, OUT: null, NOV: null, DEZ: null
    },
    media: 96.0,
    unit: '%'
  }
];

export const SUPERAR_INDICATORS_INITIAL: SuperarMonthlyIndicator[] = [
  {
    id: 'habilidade_piloto',
    name: 'Atendimento da matriz de habilidade por função (Piloto)',
    category: 'M - Moral',
    alavanca: 'Moral',
    pilar: 'ET',
    unit: '%',
    polarity: 'higher_is_better',
    peso: 20,
    meta1: 84.8,
    meta3: 90.0,
    meta5: 95.0,
    months: {
      JAN: 90.0, FEV: 91.1, MAR: 96.0, ABR: 91.0, MAI: 91.7, JUN: 87.0,
      JUL: 87.0, AGO: 87.0, SET: 96.0, OUT: null, NOV: null, DEZ: null
    },
    media: 90.8,
    acumulado: 'N/A',
    notes: 'A matriz de habilidade da piloto está caminhando para 99%, foram devidamente mapeadas e o aplicador DTO está delegado no sistema, necessário agora fazer uma troca de turno para acompanhar por ser necessário usar o tablet.',
    seloBronzeCriteria: {
      minimoAceitavel: 84.8,
      metaGrau: 90.0,
      superacao: 95.0,
      total2025: 84.8
    }
  },
  {
    id: 'conhecimento_unidade',
    name: 'Atendimento da matriz de conhecimento (Unidade)',
    category: 'M - Moral',
    alavanca: 'Moral',
    pilar: 'ET',
    unit: '%',
    polarity: 'higher_is_better',
    peso: 20,
    meta1: 83.9,
    meta3: 88.0,
    meta5: 93.0,
    months: {
      JAN: 71.0, FEV: 77.0, MAR: 82.0, ABR: 80.0, MAI: 95.5, JUN: 92.0,
      JUL: 94.0, AGO: 91.0, SET: 91.0, OUT: null, NOV: null, DEZ: null
    },
    media: 85.9,
    acumulado: 'N/A',
    notes: 'A matriz de conhecimento da unidade vinha com indicador de 98% de meta em dezembro, em janeiro caiu para 77%, tudo indica que existiu uma inclusão em massa para vários temas.',
    seloBronzeCriteria: {
      minimoAceitavel: 83.9,
      metaGrau: 88.0,
      superacao: 93.0,
      total2025: 83.9
    }
  },
  {
    id: 'conhecimento_pilares',
    name: 'Atendimento da matriz de conhecimento dos Pilares do Superar',
    category: 'M - Moral',
    alavanca: 'Moral',
    pilar: 'ET',
    unit: '%',
    polarity: 'higher_is_better',
    peso: 10,
    meta1: 70.0,
    meta3: 75.0,
    meta5: 80.0,
    months: {
      JAN: 49.59, FEV: 54.0, MAR: 59.0, ABR: 62.07, MAI: 81.5, JUN: 82.0,
      JUL: 82.0, AGO: 85.0, SET: 82.0, OUT: null, NOV: null, DEZ: null
    },
    media: 70.8,
    acumulado: 'N/A',
    notes: 'A matriz de conhecimento dos pilares foi construída com quase 30 temas, necessário revisar os temas, como exemplo temos um tema de treinamento para o pilar ET que demora 24 horas para terminar, sem relação com o pilar diretamente.',
    seloBronzeCriteria: {
      minimoAceitavel: 70.0,
      metaGrau: 75.0,
      superacao: 80.0,
      total2025: 31.5
    }
  },
  {
    id: 'obrigatorios_portal_enk',
    name: 'Atendimento nos treinamentos obrigatórios do Portal ENK (Unidade)',
    category: 'M - Moral',
    alavanca: 'Segurança',
    pilar: 'ET',
    unit: '%',
    polarity: 'higher_is_better',
    peso: 10,
    meta1: 90.0,
    meta3: 95.0,
    meta5: 100.0,
    months: {
      JAN: 99.0, FEV: 100.0, MAR: 100.0, ABR: 100.0, MAI: 100.0, JUN: 100.0,
      JUL: 100.0, AGO: 86.0, SET: 95.0, OUT: null, NOV: null, DEZ: null
    },
    media: 97.8,
    acumulado: 'N/A',
    notes: 'Obrigatório portal ENK é como prática da unidade fazer o treinamento na integração, não deixamos ir para área sem terminar os temas obrigatórios.',
    seloBronzeCriteria: {
      minimoAceitavel: 90.0,
      metaGrau: 95.0,
      superacao: 100.0,
      total2025: 96.5
    }
  },
  {
    id: 'instrutores_internos',
    name: 'Treinamentos realizados por instrutores internos (Unidade)',
    category: 'M - Moral',
    alavanca: 'Moral',
    pilar: 'ET',
    unit: '%',
    polarity: 'higher_is_better',
    peso: 10,
    meta1: 80.0,
    meta3: 80.0,
    meta5: 80.0,
    months: {
      JAN: 100.0, FEV: 100.0, MAR: 100.0, ABR: 92.3, MAI: 100.0, JUN: 100.0,
      JUL: 100.0, AGO: 100.0, SET: 88.88, OUT: null, NOV: null, DEZ: null
    },
    media: 97.9,
    acumulado: 'N/A',
    notes: 'Todos treinamentos da unidade são feitos por instrutores internos, pensamos com o tempo rever a métrica, devido a essa característica.',
    seloBronzeCriteria: {
      minimoAceitavel: 80.0,
      metaGrau: 80.0,
      superacao: 80.0,
      total2025: 37.3
    }
  },
  {
    id: 'jornada_lideranca',
    name: 'Adesão nas ações da jornada da liderança (Unidade)',
    category: 'M - Moral',
    alavanca: 'Moral',
    pilar: 'ET',
    unit: '%',
    polarity: 'higher_is_better',
    peso: 10,
    meta1: 80.0,
    meta3: 80.0,
    meta5: 80.0,
    months: {
      JAN: 86.0, FEV: 86.0, MAR: 79.0, ABR: 83.0, MAI: 83.0, JUN: 92.0,
      JUL: 100.0, AGO: 100.0, SET: 88.0, OUT: null, NOV: null, DEZ: null
    },
    media: 88.6,
    acumulado: 'N/A',
    notes: 'Jornada da liderança está ainda em andamento, temos até abril para o primeiro tema o indicado é o que foi feito no ano passado.',
    seloBronzeCriteria: {
      minimoAceitavel: 80.0,
      metaGrau: 80.0,
      superacao: 80.0,
      total2025: 82.6
    }
  },
  {
    id: 'perdas_mao_de_obra',
    name: 'Perdas causadas por falha de mão de obra (Unidade)',
    category: 'C - Custo',
    alavanca: 'Custo',
    pilar: 'ET',
    unit: 'unidades',
    polarity: 'lower_is_better',
    peso: 20,
    meta1: 10.0,
    meta3: 11.0,
    meta5: 9.0,
    months: {
      JAN: 3.0, FEV: 7.0, MAR: 7.0, ABR: 7.0, MAI: 7.0, JUN: 7.0,
      JUL: 7.0, AGO: 7.0, SET: 7.0, OUT: null, NOV: null, DEZ: null
    },
    media: 6.5,
    acumulado: 'N/A',
    notes: 'A perda por mão de obra foi feita com memorial de cálculo, com a visita do educador técnico foi solicitado uma revisão para que o memorial de cálculo seja padronizado e que caminhemos para avaliação e análise com ferramentas de TWTTP e HERCA.',
    seloBronzeCriteria: {
      minimoAceitavel: 10.0,
      metaGrau: 11.0,
      superacao: 9.0,
      total2025: 4.0
    }
  },
  {
    id: 'requisitos_legais',
    name: 'Atendimento de treinamentos nos requisitos legais (Unidade)',
    category: 'S - Segurança',
    alavanca: 'Segurança',
    pilar: 'ET',
    unit: '%',
    polarity: 'higher_is_better',
    peso: 20,
    meta1: 90.0,
    meta3: 95.0,
    meta5: 100.0,
    months: {
      JAN: 98.0, FEV: 100.0, MAR: 97.0, ABR: 96.0, MAI: 97.3, JUN: 97.0,
      JUL: 98.0, AGO: 98.0, SET: 97.0, OUT: null, NOV: null, DEZ: null
    },
    media: 97.6,
    acumulado: 'N/A',
    notes: 'Os requisitos legais têm sido prioridade na unidade, focando nas metas antecipadas, alguns casos no ano passado foram NR colocadas para unidade como estratégia de forma única gerando GAP para todos.',
    seloBronzeCriteria: {
      minimoAceitavel: 90.0,
      metaGrau: 95.0,
      superacao: 100.0,
      total2025: 92.0
    }
  },
  {
    id: 'turnover',
    name: 'Turnover',
    category: 'M - Moral',
    alavanca: 'Moral',
    pilar: 'ET',
    unit: '%',
    polarity: 'lower_is_better',
    peso: 20,
    meta1: 1.12,
    meta3: 1.10,
    meta5: 1.06,
    months: {
      JAN: 1.26, FEV: 1.93, MAR: 0.59, ABR: 2.26, MAI: 0.90, JUN: 0.75,
      JUL: 0.45, AGO: 1.68, SET: 2.26, OUT: null, NOV: null, DEZ: null
    },
    media: 1.34,
    acumulado: 12.08,
    notes: 'Acompanhamento rigoroso de retenção com foco no período probatório de 90 dias e turnos com maior turnover.',
    seloBronzeCriteria: {
      minimoAceitavel: 1.56,
      metaGrau: 1.06,
      superacao: 0.60,
      total2025: 1.28
    }
  }
];

export const SELO_PREMISES_INITIAL: SeloPremise[] = [
  {
    id: 'premise_1',
    description: 'Mínimo de 80% adesão / participação nas ações da jornada da Liderança na Unidade.',
    target: '≥ 80.0%',
    currentValue: '88.6%',
    status: 'atendida'
  },
  {
    id: 'premise_2',
    description: 'Mínimo de 75% de atendimento na Matriz de Conhecimento, conforme critério de abrangência do Selo.',
    target: '≥ 75.0%',
    currentValue: '85.9%',
    status: 'atendida'
  },
  {
    id: 'premise_3',
    description: 'Mínimo de 75% de atendimento na matriz de habilidades para todos os cargos, conforme critério de abrangência do Selo.',
    target: '≥ 75.0%',
    currentValue: '90.8%',
    status: 'atendida'
  },
  {
    id: 'premise_4',
    description: 'Mínimo de 95% de atendimento nos treinamentos de requisitos legais da Unidade (NRs + Obrigatórios Portal ENK).',
    target: '≥ 95.0%',
    currentValue: '97.6%',
    status: 'atendida'
  }
];
