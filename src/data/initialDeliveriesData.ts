import { JobVacancy, GGDeliverable } from '../types/peopleAnalytics';

// Vagas Iniciais Abertas em KBA1 por Fases (RP -> Shortlist -> Entrevista -> Exames Médicos -> Integração)
export const INITIAL_JOB_VACANCIES: JobVacancy[] = [
  {
    id: 'vac-1',
    code: 'RP-2026-081',
    jobTitle: 'Operador Empilhadeira I',
    locationName: 'EXPEDICAO FST',
    macroarea: 'Logística & Expedição',
    shiftCategory: 'Turno A',
    manager: 'Souza de Jesus, Edson',
    reason: 'Substituição',
    priority: 'Alta',
    stage: 'Exames Médicos',
    openDate: '2026-10-05',
    slaTargetDays: 30,
    stageDates: {
      rpDate: '2026-10-05',
      shortlistDate: '2026-10-12',
      interviewDate: '2026-10-19',
      medicalExamDate: '2026-10-26',
    },
    finalCandidateName: 'Luciano Santana dos Santos',
    notes: 'Aguardando liberação do ASO Admissional pela clínica credenciada para agendar integração.',
  },
  {
    id: 'vac-2',
    code: 'RP-2026-082',
    jobTitle: 'Operador de Onduladeira',
    locationName: 'ONDULADEIRA FST',
    macroarea: 'Operação Fabril',
    shiftCategory: 'Turno C',
    manager: 'Carlos / MP',
    reason: 'Aumento de Quadro',
    priority: 'Urgente',
    stage: 'Entrevista',
    openDate: '2026-10-10',
    slaTargetDays: 30,
    stageDates: {
      rpDate: '2026-10-10',
      shortlistDate: '2026-10-18',
      interviewDate: '2026-10-27',
    },
    finalCandidateName: 'Marcos Vinicius Pereira',
    notes: 'Entrevista técnica com liderança do Turno 3 agendada. Cargo crítico de linha contínua.',
  },
  {
    id: 'vac-3',
    code: 'RP-2026-083',
    jobTitle: 'Mecânico Industrial',
    locationName: 'MANUTENCAO MECANICA',
    macroarea: 'Manutenção & Utilidades',
    shiftCategory: 'Administrativo',
    manager: 'Marcos / GA',
    reason: 'Substituição',
    priority: 'Alta',
    stage: 'Shortlist',
    openDate: '2026-10-14',
    slaTargetDays: 40,
    stageDates: {
      rpDate: '2026-10-14',
      shortlistDate: '2026-10-22',
    },
    notes: 'Triagem de 5 currículos com experiência em redutores e sistemas hidráulicos de papelão.',
  },
  {
    id: 'vac-4',
    code: 'RP-2026-084',
    jobTitle: 'Impressor Flexográfico (Martin)',
    locationName: 'CONVERSAO IMPRESSORAS',
    macroarea: 'Operação Fabril',
    shiftCategory: 'Turno B',
    manager: 'Ramon / ENK',
    reason: 'Substituição',
    priority: 'Normal',
    stage: 'RP',
    openDate: '2026-10-24',
    slaTargetDays: 35,
    stageDates: {
      rpDate: '2026-10-24',
    },
    notes: 'RP aberta e validada pela gerência industrial. Divulgação iniciada no portal interno e LinkedIn.',
  },
  {
    id: 'vac-5',
    code: 'RP-2026-085',
    jobTitle: 'Analista de Qualidade Jr',
    locationName: 'QUALIDADE ASSEGURADA',
    macroarea: 'Qualidade & SESMT',
    shiftCategory: 'Administrativo',
    manager: 'Júlia / Superar',
    reason: 'Aumento de Quadro',
    priority: 'Normal',
    stage: 'Integração',
    openDate: '2026-09-28',
    slaTargetDays: 35,
    stageDates: {
      rpDate: '2026-09-28',
      shortlistDate: '2026-10-06',
      interviewDate: '2026-10-14',
      medicalExamDate: '2026-10-21',
      integrationDate: '2026-11-03',
    },
    finalCandidateName: 'Beatriz Almeida Costa',
    notes: 'Processo concluído com êxito! Candidata aprovada e agendada para turma de integração KBA1 de 03/11.',
  },
  {
    id: 'vac-6',
    code: 'RP-2026-086',
    jobTitle: 'Eletromecânico de Utilidades',
    locationName: 'CALDEIRA & UTILIDADES',
    macroarea: 'Manutenção & Utilidades',
    shiftCategory: 'Turno A',
    manager: 'Carlos / MP',
    reason: 'Aumento de Quadro',
    priority: 'Urgente',
    stage: 'Shortlist',
    openDate: '2026-10-02',
    slaTargetDays: 30,
    stageDates: {
      rpDate: '2026-10-02',
      shortlistDate: '2026-10-15',
    },
    notes: 'SLA em atenção (27 dias). Requer certificação NR-10 e NR-13 para operação de caldeiras.',
  },
  {
    id: 'vac-7',
    code: 'RP-2026-087',
    jobTitle: 'Ajudante de Produção',
    locationName: 'COLADEIRAS BOBST',
    macroarea: 'Operação Fabril',
    shiftCategory: 'Turno C',
    manager: 'Carlos / MP',
    reason: 'Substituição',
    priority: 'Normal',
    stage: 'Entrevista',
    openDate: '2026-10-18',
    slaTargetDays: 25,
    stageDates: {
      rpDate: '2026-10-18',
      shortlistDate: '2026-10-23',
      interviewDate: '2026-10-29',
    },
    finalCandidateName: 'Felipe Barreto Ramos',
    notes: 'Entrevista coletiva realizada com 4 finalistas da região de Feira de Santana.',
  }
];

// Entregáveis Estratégicos de Gente & Gestão (DHO, Clima, Relações Trabalhistas e SSMA)
export const INITIAL_GG_DELIVERABLES: GGDeliverable[] = [
  {
    id: 'del-1',
    code: 'ENT-2026-01',
    title: 'Pesquisa de Pulso & Clima Organizacional KBA1',
    category: 'Clima & Engajamento',
    scope: 'Toda a Fábrica (353 colaboradores)',
    responsible: 'Gente & Gestão',
    targetDate: '2026-11-15',
    status: 'Em Andamento',
    progressPct: 65,
    notes: 'Coleta em totens digitais e formulários físicos nos turnos operacionais (T1, T2, T3).',
  },
  {
    id: 'del-2',
    code: 'ENT-2026-02',
    title: 'Ciclo de Avaliação de Experiência (45 e 90 dias)',
    category: 'DHO & Treinamento',
    scope: 'Admitidos do 3º Trimestre (38 colab)',
    responsible: 'BP RH / Supervisores',
    targetDate: '2026-10-31',
    status: 'Em Andamento',
    progressPct: 85,
    notes: 'Feedback estruturado entre gestores imediatos e novos admitidos em acompanhamento.',
  },
  {
    id: 'del-3',
    code: 'ENT-2026-03',
    title: 'Auditoria de Passo & Concessão Selo Bronze Superar',
    category: 'DHO & Treinamento',
    scope: 'Pilar ET (Educação e Treinamento)',
    responsible: 'Coordenação Superar',
    targetDate: '2026-10-20',
    completedDate: '2026-10-18',
    status: 'Concluído',
    progressPct: 100,
    notes: 'Auditoria finalizada com 95.83% de conformidade e 4 premissas atendidas com sucesso.',
  },
  {
    id: 'del-4',
    code: 'ENT-2026-04',
    title: 'Reciclagem Obrigatória NR-12 e NR-35 Operacional',
    category: 'SSMA & Saúde Ocupacional',
    scope: 'Manutenção & Onduladeira (64 colab)',
    responsible: 'SESMT / Instrutores Internos',
    targetDate: '2026-11-10',
    status: 'Planejado',
    progressPct: 30,
    notes: 'Turmas divididas em horário de transição de turno para não impactar a produção.',
  },
  {
    id: 'del-5',
    code: 'ENT-2026-05',
    title: 'Campanha Novembro Azul & Exames Preventivos',
    category: 'SSMA & Saúde Ocupacional',
    scope: 'Público Masculino (295 colaboradores)',
    responsible: 'Ambulatório Médico KBA1',
    targetDate: '2026-11-25',
    status: 'Planejado',
    progressPct: 20,
    notes: 'Palestras de conscientização com médico do trabalho e agendamento de exames PSA.',
  },
  {
    id: 'del-6',
    code: 'ENT-2026-06',
    title: 'Integração de 12 Novos Operadores de Conversão',
    category: 'Recrutamento & Seleção',
    scope: 'Setores Conversão & Expedição',
    responsible: 'DHO / Gente & Gestão',
    targetDate: '2026-11-03',
    status: 'Em Andamento',
    progressPct: 75,
    notes: 'Cronograma de 5 dias estruturado com visita fabril, EPIs, cultura Klabin e segurança.',
  }
];

// Cálculo de SLA e Aging para uma vaga
export function calculateVacancyAnalytics(v: JobVacancy, refDate = new Date()) {
  const [y, m, d] = v.openDate.split('-').map(Number);
  const open = new Date(y, (m || 1) - 1, d || 1);
  const diffTime = refDate.getTime() - open.getTime();
  const daysOpen = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

  const slaRemaining = v.slaTargetDays - daysOpen;
  let slaStatus: 'no_prazo' | 'atencao' | 'atrasado' = 'no_prazo';

  if (v.stage === 'Admitido') {
    slaStatus = daysOpen <= v.slaTargetDays ? 'no_prazo' : 'atrasado';
  } else if (daysOpen > v.slaTargetDays) {
    slaStatus = 'atrasado';
  } else if (daysOpen > v.slaTargetDays * 0.75) {
    slaStatus = 'atencao';
  }

  return {
    daysOpen,
    slaRemaining,
    slaStatus,
  };
}
