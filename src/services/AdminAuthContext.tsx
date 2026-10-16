import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { FORMATIONS_VIEWER_EMAIL, getSupabaseClient } from './supabaseClient';

interface AdminAuthContextValue {
  user: User | null;
  isAdmin: boolean;
  canViewSharedFormations: boolean;
  isLoading: boolean;
  hasAdminAccess: () => boolean;
  requestAdminAccess: (action?: () => void) => void;
  requestFormationsAccess: (action?: () => void) => void;
  cancelAdminAccess: () => void;
  signOutAdmin: () => Promise<void>;
}

type LoginMode = 'admin' | 'formations';

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export const AdminAuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const isAdminRef = useRef(false);
  const [canViewSharedFormations, setCanViewSharedFormations] = useState(false);
  const canViewSharedFormationsRef = useRef(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginMode, setLoginMode] = useState<LoginMode>('admin');
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const updateAdminState = (value: boolean) => {
    isAdminRef.current = value;
    setIsAdmin(value);
  };
  const updateFormationsAccess = (value: boolean) => {
    canViewSharedFormationsRef.current = value;
    setCanViewSharedFormations(value);
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
      if (!session) {
        updateAdminState(false);
        updateFormationsAccess(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const checkAdminRole = async () => {
      if (!user) {
        updateAdminState(false);
        updateFormationsAccess(false);
        return;
      }

      const client = getSupabaseClient();
      if (!client) {
        updateAdminState(false);
        updateFormationsAccess(false);
        return;
      }

      const [adminResult, viewerResult] = await Promise.all([
        client.from('app_admins').select('user_id').eq('user_id', user.id).maybeSingle(),
        client.from('formations_dashboard_viewers').select('user_id').eq('user_id', user.id).maybeSingle(),
      ]);

      if (cancelled) return;
      if (adminResult.error) console.error('Could not verify Supabase administrator role', adminResult.error);
      if (viewerResult.error) console.error('Could not verify shared formations access', viewerResult.error);
      const isAdminUser = !adminResult.error && Boolean(adminResult.data);
      updateAdminState(isAdminUser);
      updateFormationsAccess(isAdminUser || (!viewerResult.error && Boolean(viewerResult.data)));
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
    setLoginMode('admin');
    setPendingAction(() => action ?? null);
    setLoginError('');
    setIsLoginOpen(true);
  };

  const requestFormationsAccess = (action?: () => void) => {
    if (canViewSharedFormationsRef.current) {
      action?.();
      return;
    }
    setLoginMode('formations');
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
    updateFormationsAccess(false);
  };

  const handleSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setLoginError('');

    try {
      const client = getSupabaseClient();
      if (!client) throw new Error('Cliente Supabase não inicializado');
      if (password.length < 6) {
        throw new Error('A senha precisa ter pelo menos 6 caracteres.');
      }
      if (loginMode === 'admin' && username.trim().toUpperCase() !== 'GGFST') {
        throw new Error('Usuário ou senha inválidos.');
      }

      const { data, error } = await client.auth.signInWithPassword({
        email: loginMode === 'admin'
          ? import.meta.env.VITE_SUPABASE_ADMIN_EMAIL || 'ggfst@tgmjghxytbwafhrxdkyl.supabase.co'
          : FORMATIONS_VIEWER_EMAIL,
        password,
      });
      if (error) {
        if (error.message === 'Invalid login credentials') {
          throw new Error(
            loginMode === 'admin'
              ? 'Login não reconhecido. Confira se o usuário administrador foi criado e confirmado em Supabase > Authentication > Users.'
              : 'Senha não reconhecida. Confira a conta compartilhada do Dashboard em Supabase > Authentication > Users.'
          );
        }
        throw new Error(error.message);
      }
      if (!data.user) throw new Error('O Supabase não retornou um usuário autenticado.');

      const roleTable = loginMode === 'admin' ? 'app_admins' : 'formations_dashboard_viewers';
      const { data: role, error: roleError } = await client
        .from(roleTable)
        .select('user_id')
        .eq('user_id', data.user.id)
        .maybeSingle();

      if (roleError) {
        await client.auth.signOut();
        throw new Error(`Não foi possível verificar a autorização: ${roleError.message}`);
      }
      if (!role) {
        await client.auth.signOut();
        throw new Error(loginMode === 'admin'
          ? 'Esta conta não está autorizada como administradora. Solicite a inclusão no Supabase.'
          : 'Esta conta não está autorizada a visualizar o Dashboard de Formações.');
      }

      setUser(data.user);
      updateAdminState(loginMode === 'admin');
      updateFormationsAccess(true);
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
        canViewSharedFormations,
        isLoading,
        hasAdminAccess: () => isAdminRef.current,
        requestAdminAccess,
        requestFormationsAccess,
        cancelAdminAccess,
        signOutAdmin,
      }}
    >
      {children}
      {isLoginOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSignIn}
            className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mx-auto">
              <span className="text-xl font-bold" aria-hidden="true">A</span>
            </div>
            <div className="text-center">
              <h2 className="font-bold text-slate-900">
                {loginMode === 'admin' ? 'Acesso administrativo' : 'Acesso ao Dashboard de Formações'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {loginMode === 'admin'
                  ? 'Entre com o usuário administrativo cadastrado no Supabase.'
                  : 'Digite a senha compartilhada para visualizar o CSV online.'}
              </p>
            </div>
            {loginMode === 'admin' && (
              <label className="block text-xs font-semibold text-slate-700">
                Usuário
                <input
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="GGFST"
                  className="mt-1 w-full px-3 py-2.5 text-sm border border-slate-300 rounded-xl"
                />
              </label>
            )}
            <label className="block text-xs font-semibold text-slate-700">
              Senha
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1 w-full px-3 py-2.5 text-sm border border-slate-300 rounded-xl"
              />
            </label>
            {loginError && <p role="alert" className="text-xs text-red-700">{loginError}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={cancelAdminAccess}
                className="w-1/2 px-4 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-1/2 px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-50"
              >
                {isSubmitting ? 'Verificando...' : 'Entrar'}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 text-center">
              {loginMode === 'admin'
                ? <>A conta precisa estar cadastrada em <code>public.app_admins</code>.</>
                : <>A conta precisa estar autorizada em <code>public.formations_dashboard_viewers</code>.</>}
            </p>
          </form>
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
