import React, { useState } from 'react';
import { 
  Users, Shield, ShieldCheck, UserPlus, UserCheck, 
  Trash2, Edit3, X, Check, Lock, Building2, Mail, 
  RotateCcw, Sparkles, Eye, AlertCircle, Info
} from 'lucide-react';
import { UserProfile, UserRole } from '../types/userProfile';
import { useUserProfile } from '../services/UserProfileContext';

interface UserManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAdminAuth?: () => void;
}

export const UserManagerModal: React.FC<UserManagerModalProps> = ({
  isOpen,
  onClose,
  onOpenAdminAuth,
}) => {
  const { 
    currentUser, 
    users, 
    isEffectiveAdmin, 
    setCurrentUser, 
    addUser, 
    updateUser, 
    deleteUser, 
    resetDefaultUsers 
  } = useUserProfile();

  const [isCreating, setIsCreating] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formDept, setFormDept] = useState('Gente & Gestão');
  const [formRole, setFormRole] = useState<UserRole>('user');
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleStartCreate = () => {
    setEditingUserId(null);
    setFormName('');
    setFormEmail('');
    setFormDept('Gente & Gestão');
    setFormRole('user');
    setIsCreating(true);
  };

  const handleStartEdit = (user: UserProfile) => {
    setIsCreating(false);
    setEditingUserId(user.id);
    setFormName(user.name);
    setFormEmail(user.email || '');
    setFormDept(user.department || 'Gente & Gestão');
    setFormRole(user.role);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (isCreating) {
      const created = addUser({
        name: formName.trim(),
        email: formEmail.trim() || undefined,
        department: formDept.trim() || 'Geral',
        role: formRole,
      });
      showFeedback(`Usuário "${created.name}" criado com sucesso!`);
      setIsCreating(false);
    } else if (editingUserId) {
      updateUser(editingUserId, {
        name: formName.trim(),
        email: formEmail.trim() || undefined,
        department: formDept.trim() || 'Geral',
        role: formRole,
      });
      showFeedback('Dados do usuário atualizados com sucesso!');
      setEditingUserId(null);
    }
  };

  const handleDeleteUser = (id: string, name: string) => {
    if (confirm(`Tem certeza que deseja remover o usuário "${name}"?`)) {
      const ok = deleteUser(id);
      if (ok) {
        showFeedback(`Usuário "${name}" excluído.`);
      } else {
        alert('Não é possível remover o único usuário do sistema.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[120] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="relative bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight">Gestão de Usuários & Administrador</h2>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  {users.length} usuários
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Controle de perfis, permissões e privacidade no Plano de Ação Gantt
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className="px-6 py-2.5 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Content Body (Scrollable) */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          
          {/* Active User Highlight Bar */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${currentUser.avatarColor || 'from-indigo-600 to-violet-600'} text-white font-black text-sm flex items-center justify-center shadow-xs shrink-0`}>
                {currentUser.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Usuário Ativo Agora:</span>
                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                    currentUser.role === 'admin' 
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    {currentUser.role === 'admin' ? '🛡️ Administrador' : '👤 Usuário Padrão'}
                  </span>
                </div>
                <div className="text-sm font-black text-slate-900">
                  {currentUser.name}
                </div>
                <div className="text-xs text-slate-500">
                  {currentUser.department} {currentUser.email ? `• ${currentUser.email}` : ''}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {currentUser.role !== 'admin' && onOpenAdminAuth && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAdminAuth();
                  }}
                  className="px-3 py-1.5 text-xs font-bold rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 flex items-center gap-1.5 transition-all"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Elevar para Admin Supabase</span>
                </button>
              )}
            </div>
          </div>

          {/* Privacy & Scope Rules Card */}
          <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 text-xs text-indigo-950 space-y-2">
            <div className="font-bold flex items-center gap-1.5 text-indigo-900">
              <Info className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Como funcionam as permissões e a privacidade no Gantt:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="bg-white/80 p-2.5 rounded-xl border border-indigo-100 space-y-1">
                <span className="font-extrabold text-indigo-900 flex items-center gap-1">
                  🌐 Plano Padrão Aberto
                </span>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Visível para toda a unidade e todos os colaboradores. Ideal para cronogramas institucionais e pilares de rotina.
                </p>
              </div>
              <div className="bg-white/80 p-2.5 rounded-xl border border-indigo-100 space-y-1">
                <span className="font-extrabold text-purple-900 flex items-center gap-1">
                  🔒 Plano Pessoal (Privado)
                </span>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Cada usuário gerencia suas ações privadas. O <strong>Administrador</strong> tem acesso total para ver o que todos postam e acompanhar o progresso global.
                </p>
              </div>
            </div>
          </div>

          {/* Create / Edit Form (Conditional) */}
          {(isCreating || editingUserId) && (
            <form onSubmit={handleSaveUser} className="p-4 rounded-2xl bg-white border border-indigo-200 shadow-sm space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                  {isCreating ? 'Novo Perfil de Usuário' : 'Editar Dados do Usuário'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingUserId(null);
                  }}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  Cancelar
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Nome do Usuário / Colaborador *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ex: Mateus Spínola"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">E-mail ou Identificador</label>
                  <input
                    type="text"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="Ex: mateus@klabin.com.br"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Setor / Departamento</label>
                  <input
                    type="text"
                    value={formDept}
                    onChange={(e) => setFormDept(e.target.value)}
                    placeholder="Ex: Gente & Gestão, TI, Produção"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Papel / Nível de Acesso</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="user">👤 Usuário Padrão (Plano Aberto + Pessoal)</option>
                    <option value="admin">🛡️ Administrador (Vê o que todos postam + Gerenciamento)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingUserId(null);
                  }}
                  className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Salvar Usuário</span>
                </button>
              </div>
            </form>
          )}

          {/* User List Header & Action */}
          <div className="flex items-center justify-between pt-1">
            <span className="font-extrabold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-600" />
              Usuários do Sistema ({users.length})
            </span>

            {!isCreating && !editingUserId && (
              <button
                type="button"
                onClick={handleStartCreate}
                className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all flex items-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Novo Usuário</span>
              </button>
            )}
          </div>

          {/* Users Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {users.map((u) => {
              const isCurrent = currentUser.id === u.id;
              const isAdmin = u.role === 'admin';

              return (
                <div
                  key={u.id}
                  className={`p-3.5 rounded-2xl bg-white border transition-all flex flex-col justify-between gap-3 ${
                    isCurrent
                      ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${u.avatarColor || 'from-slate-600 to-slate-800'} text-white font-black text-xs flex items-center justify-center shrink-0`}>
                        {u.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                          <span>{u.name}</span>
                          {isCurrent && (
                            <span className="text-[9px] font-black text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                              VOCÊ
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[170px]">
                          {u.department}
                        </div>
                      </div>
                    </div>

                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border shrink-0 ${
                      isAdmin
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {isAdmin ? 'Admin' : 'Usuário'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
                    {!isCurrent ? (
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentUser(u);
                          showFeedback(`Alternado para "${u.name}"`);
                        }}
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Usar este perfil</span>
                      </button>
                    ) : (
                      <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>Perfil ativo</span>
                      </span>
                    )}

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(u)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Editar Usuário"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      {users.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(u.id, u.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Excluir Usuário"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Reset to defaults button */}
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => {
                if (confirm('Restaurar lista de usuários para o modelo padrão da unidade?')) {
                  resetDefaultUsers();
                  showFeedback('Usuários restaurados para o padrão.');
                }
              }}
              className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restaurar lista padrão</span>
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500">
            Conectado como <strong className="text-slate-800">{currentUser.name}</strong> ({currentUser.role === 'admin' ? 'Administrador Geral' : 'Usuário Padrão'})
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors"
          >
            Concluir & Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
