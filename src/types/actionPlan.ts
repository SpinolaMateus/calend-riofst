export type ActionPlanStatus = 'not_started' | 'in_progress' | 'completed' | 'delayed' | 'cancelled';
export type ActionPlanPriority = 'baixa' | 'media' | 'alta' | 'critica';

export interface ActionPlanItem {
  id: string;
  title: string;
  responsible: string;
  department: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  status: ActionPlanStatus;
  progress: number;  // 0 - 100
  priority: ActionPlanPriority;
  deliverable?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const INITIAL_ACTION_PLANS: ActionPlanItem[] = [
  {
    id: 'act-1',
    title: 'Adequação da Sala de Integração e Equipamentos Multimídia',
    responsible: 'Facilities / TI',
    department: 'FACILITIES',
    startDate: '2026-10-01',
    endDate: '2026-10-15',
    status: 'completed',
    progress: 100,
    priority: 'alta',
    deliverable: 'Checklist de equipamentos e sonorização homologados',
    notes: 'Novos projetores e microfones sem fio instalados.',
  },
  {
    id: 'act-2',
    title: 'Revisão das Matrizes de Formação por Cargo (PRN)',
    responsible: 'Gente & Gestão',
    department: 'GENTE E GESTÃO',
    startDate: '2026-10-10',
    endDate: '2026-10-31',
    status: 'in_progress',
    progress: 75,
    priority: 'alta',
    deliverable: 'Planilha atualizada de matrizes por UO',
    notes: 'Validação em andamento junto aos gestores de produção.',
  },
  {
    id: 'act-3',
    title: 'Treinamento Prático de NR-12 e Segurança Operacional',
    responsible: 'Eng. de Segurança',
    department: 'SEGURANÇA',
    startDate: '2026-10-20',
    endDate: '2026-11-10',
    status: 'in_progress',
    progress: 40,
    priority: 'critica',
    deliverable: 'Lista de presença com assinaturas e certificados',
    notes: 'Turmas divididas em turnos A e B.',
  },
  {
    id: 'act-4',
    title: 'Auditoria de Processos de Integração e Acolhimento',
    responsible: 'Qualidade / RH',
    department: 'QUALIDADE',
    startDate: '2026-11-05',
    endDate: '2026-11-20',
    status: 'not_started',
    progress: 0,
    priority: 'media',
    deliverable: 'Relatório executivo de conformidade',
    notes: 'Aplicar formulário de satisfação com os novos colaboradores.',
  },
  {
    id: 'act-5',
    title: 'Migração e Homologação dos Dados no Supabase Realtime',
    responsible: 'Equipe de TI',
    department: 'TI',
    startDate: '2026-10-15',
    endDate: '2026-10-29',
    status: 'completed',
    progress: 100,
    priority: 'alta',
    deliverable: 'Tabelas RLS ativas e conectividade 100%',
    notes: 'Events, Integração e Formações sincronizados na nuvem.',
  },
];

