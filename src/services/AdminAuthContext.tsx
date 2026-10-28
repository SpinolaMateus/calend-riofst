import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { ShieldCheck, Lock, User as UserIcon, X, Loader2, AlertCircle } from 'lucide-react';
import { getSupabaseClient } from './supabaseClient';

interface AdminAuthContextValue {
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  hasAdminAccess: () => boolean;
  requestAdminAccess: (action?: () => void) => void;
  cancelAdminAccess: () => void;
  signOutAdmin: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export const AdminAuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const isAdminRef = useRef(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const updateAdminState = (value: boolean) => {
    isAdminRef.current = value;
    setIsAdmin(value);
  };

  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) {
      setIsLoading(false);
      return;
    }

    const loadSession = async () => {
      const { data, error } = await client.auth.getSession();
      if (error) console.error('Could not restore Supabase session', error);
      setUser(data.session?.user ?? null);
      setIsLoading(false);
    };

    void loadSession();
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) updateAdminState(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const checkAdminRole = async () => {
      if (!user) {
        updateAdminState(false);
        return;
      }

      const client = getSupabaseClient();
      if (!client) {
        updateAdminState(false);
        return;
      }

      const { data, error } = await client
        .from('app_admins')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (cancelled) return;
      if (error) {
        console.error('Could not verify Supabase administrator role', error);
        updateAdminState(false);
        return;
      }
      updateAdminState(Boolean(data));
    };

    void checkAdminRole();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const requestAdminAccess = (action?: () => void) => {
    if (isAdminRef.current) {
      action?.();
      return;
    }
    setPendingAction(() => action ?? null);
    setLoginError('');
    setIsLoginOpen(true);
  };

  const cancelAdminAccess = () => {
    setIsLoginOpen(false);
    setPendingAction(null);
    setLoginError('');
  };

  const signOutAdmin = async () => {
    const client = getSupabaseClient();
    if (!client) throw new Error('Cliente Supabase não inicializado');

    const { error } = await client.auth.signOut();
    if (error) throw new Error(error.message);
    updateAdminState(false);
  };

  const handleSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setLoginError('');

    try {
      const client = getSupabaseClient();
      if (!client) throw new Error('Cliente Supabase não inicializado');
      if (username.trim().toUpperCase() !== 'GGFST') {
        throw new Error('Usuário ou senha inválidos.');
      }
      if (password.length < 6) {
        throw new Error('O Supabase exige senha com pelo menos 6 caracteres. A senha GGFST tem apenas 5.');
      }

      const { data, error } = await client.auth.signInWithPassword({
        email: import.meta.env.VITE_SUPABASE_ADMIN_EMAIL || 'ggfst@tgmjghxytbwafhrxdkyl.supabase.co',
        password,
      });
      if (error) {
        if (error.message === 'Invalid login credentials') {
          throw new Error(
            'Login não reconhecido. Confira se o usuário administrador foi criado e confirmado em Supabase > Authentication > Users, e se a senha tem pelo menos 6 caracteres.'
          );
        }
        throw new Error(error.message);
      }
      if (!data.user) throw new Error('O Supabase não retornou um usuário autenticado.');

      const { data: role, error: roleError } = await client
        .from('app_admins')
        .select('user_id')
        .eq('user_id', data.user.id)
        .maybeSingle();

      if (roleError) throw new Error(`Não foi possível verificar o acesso administrativo: ${roleError.message}`);
      if (!role) {
        await client.auth.signOut();
        throw new Error('Esta conta não está autorizada como administradora. Solicite a inclusão no Supabase.');
      }

      setUser(data.user);
      updateAdminState(true);
      setIsLoginOpen(false);
      setPassword('');
      const action = pendingAction;
      setPendingAction(null);
      if (action) window.setTimeout(action, 0);
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Falha ao autenticar no Supabase.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        isAdmin,
        isLoading,
        hasAdminAccess: () => isAdminRef.current,
        requestAdminAccess,
        cancelAdminAccess,
        signOutAdmin,
      }}
    >
      {children}
      {isLoginOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-slate-200/90 p-7 space-y-6">
            
            {/* Close Button */}
            <button
              onClick={cancelAdminAccess}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header Icon & Title */}
            <div className="text-center space-y-2">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 text-white flex items-center justify-center mx-auto shadow-md shadow-indigo-500/20">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Acesso Administrativo
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Entre com as credenciais administrativas autorizadas no Supabase.
              </p>
            </div>

            <form onSubmit={handleSignIn} className="space-y-4">
              {/* Username Input */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Usuário Administrador
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    autoComplete="username"
                    required
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="GGFST"
                    className="w-full pl-9.5 pr-3 py-2.5 text-xs font-semibold text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all bg-slate-50/50"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Senha de Acesso
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9.5 pr-3 py-2.5 text-xs font-semibold text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all bg-slate-50/50"
                  />
                </div>
              </div>

              {/* Error Message */}
              {loginError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span className="leading-snug">{loginError}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={cancelAdminAccess}
                  className="w-1/2 px-4 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-1/2 px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Verificando...</span>
                    </>
                  ) : (
                    <span>Entrar</span>
                  )}
                </button>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <p className="text-[11px] text-slate-400 text-center">
                  A conta precisa estar cadastrada na tabela <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600 font-mono">public.app_admins</code>.
                </p>
              </div>
            </form>

          </div>
        </div>
      )}
    </AdminAuthContext.Provider>
  );
};

export function useAdminAuth(): AdminAuthContextValue {
  const context = useContext(AdminAuthContext);
  if (!context) throw new Error('useAdminAuth precisa ser usado dentro de AdminAuthProvider.');
  return context;
}
