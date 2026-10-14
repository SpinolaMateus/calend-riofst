import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';
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

      const { data, error } = await client.auth.signInWithPassword({
        email: import.meta.env.VITE_SUPABASE_ADMIN_EMAIL || 'ggfst@tgmjghxytbwafhrxdkyl.supabase.co',
        password,
      });
      if (error) throw new Error(error.message);
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
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSignIn}
            className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mx-auto">
              <span className="text-xl font-bold" aria-hidden="true">A</span>
            </div>
            <div className="text-center">
              <h2 className="font-bold text-slate-900">Acesso administrativo</h2>
              <p className="text-xs text-slate-500 mt-1">Entre com o usuário administrativo cadastrado no Supabase.</p>
            </div>
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
              A conta precisa estar cadastrada em <code>public.app_admins</code>.
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
