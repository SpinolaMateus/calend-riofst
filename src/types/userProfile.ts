export type UserRole = 'admin' | 'user';

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  role: UserRole;
  department: string;
  prn?: string;
  avatarColor?: string;
}

export const DEFAULT_USER_PROFILES: UserProfile[] = [
  {
    id: 'user-admin',
    name: 'GGFST - Administrador',
    email: 'ggfst@tgmjghxytbwafhrxdkyl.supabase.co',
    role: 'admin',
    department: 'Gente & Gestão',
    avatarColor: 'from-indigo-600 to-violet-700',
  },
  {
    id: 'user-mateus',
    name: 'Mateus Spínola',
    email: 'mateus@klabin.com.br',
    role: 'admin',
    department: 'Gente & Gestão',
    avatarColor: 'from-blue-600 to-cyan-600',
  },
  {
    id: 'user-julia',
    name: 'Julia Santos',
    role: 'user',
    department: 'Gente & Gestão',
    avatarColor: 'from-purple-500 to-pink-500',
  },
  {
    id: 'user-tatiele',
    name: 'Tatiele Silva',
    role: 'user',
    department: 'Gente & Gestão',
    avatarColor: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'user-lidiane',
    name: 'Lidiane Oliveira',
    role: 'user',
    department: 'Benefícios',
    avatarColor: 'from-amber-500 to-orange-600',
  },
  {
    id: 'user-rafael',
    name: 'Rafael Santos',
    role: 'user',
    department: 'TI',
    avatarColor: 'from-cyan-600 to-blue-700',
  },
  {
    id: 'user-facilities',
    name: 'Allan / Facilities',
    role: 'user',
    department: 'Facilities',
    avatarColor: 'from-rose-500 to-pink-600',
  },
  {
    id: 'user-seguranca',
    name: 'Eng. de Segurança',
    role: 'user',
    department: 'Segurança do Trabalho',
    avatarColor: 'from-orange-600 to-red-600',
  },
  {
    id: 'user-superar',
    name: 'Ramon / Equipe Superar',
    role: 'user',
    department: 'Superar',
    avatarColor: 'from-slate-700 to-slate-900',
  },
];
