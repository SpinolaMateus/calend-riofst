import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2, Copy, Check, Home, ShieldAlert } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  moduleName?: string;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
    copied: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log detalhado no console para depuração técnica
    console.error(`[ErrorBoundary${this.props.moduleName ? ` - ${this.props.moduleName}` : ''}] Capturou um erro:`, error, errorInfo);

    // Salvar diagnóstico no sessionStorage para recuperação e análise
    try {
      const diagnostic = {
        timestamp: new Date().toISOString(),
        module: this.props.moduleName || 'Root',
        message: error?.message || 'Erro desconhecido',
        name: error?.name,
        stack: error?.stack,
        componentStack: errorInfo?.componentStack,
        url: window.location.href,
        userAgent: navigator.userAgent,
      };
      sessionStorage.setItem('last_app_error', JSON.stringify(diagnostic));
    } catch {
      // Ignora falha de gravação de telemetria
    }
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetModule = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, copied: false });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  private handleClearStorageAndReload = () => {
    if (window.confirm('Tem certeza que deseja restaurar as configurações locais e recarregar? Dados não sincronizados com a nuvem podem ser redefinidos aos valores padrão.')) {
      try {
        // Remove chaves principais que poderiam ter ficado corrompidas
        const keysToRemove = [
          'cronograma_integracao_sessions_v1',
          'cronograma_integracao_areas_v1',
          'cronograma_integracao_unit_v1',
          'cronograma_integracao_audience_v1',
          'app_calendar_events_v3',
          'app_formations_records_v1',
          'app_action_plan_actions_v1',
          'last_app_error'
        ];
        keysToRemove.forEach((k) => localStorage.removeItem(k));
      } catch (e) {
        console.error('Falha ao limpar armazenamento', e);
      }
      window.location.reload();
    }
  };

  private handleCopyDiagnostic = () => {
    const { error, errorInfo } = this.state;
    const diagnosticText = [
      `=== RELATÓRIO DE DIAGNÓSTICO DO SISTEMA ===`,
      `Data/Hora: ${new Date().toLocaleString('pt-BR')}`,
      `Módulo: ${this.props.moduleName || 'Aplicação Principal'}`,
      `Mensagem: ${error?.message || 'N/A'}`,
      `Tipo: ${error?.name || 'Error'}`,
      `URL: ${window.location.href}`,
      `Navegador: ${navigator.userAgent}`,
      `--- Stack Trace do Erro ---`,
      error?.stack || 'Sem stack trace',
      `--- Component Stack ---`,
      errorInfo?.componentStack || 'Sem component stack',
    ].join('\n');

    navigator.clipboard.writeText(diagnosticText).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 3000);
    }).catch(() => {
      // Fallback
      alert('Não foi possível copiar automaticamente para a área de transferência.');
    });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isSubModule = Boolean(this.props.moduleName);

      return (
        <div
          className={`flex flex-col items-center justify-center ${
            isSubModule ? 'p-6 my-4 bg-rose-50/70 border border-rose-200 rounded-2xl shadow-sm' : 'min-h-screen bg-slate-50 p-4 sm:p-8'
          }`}
        >
          <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            {/* Cabeçalho do Erro */}
            <div className="bg-gradient-to-r from-rose-500 to-red-600 px-6 py-5 text-white flex items-center gap-3">
              <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                <ShieldAlert className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold tracking-tight">
                  {isSubModule
                    ? `Instabilidade no Módulo: ${this.props.moduleName}`
                    : 'Instabilidade Temporária Detectada'}
                </h2>
                <p className="text-xs text-rose-100 mt-0.5">
                  O sistema evitou uma tela em branco e protegeu seus dados.
                </p>
              </div>
            </div>

            {/* Corpo da Notificação */}
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3 p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs sm:text-sm">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">O que aconteceu?</p>
                  <p className="mt-0.5 text-slate-600">
                    Ocorreu um erro interno de renderização:{' '}
                    <span className="font-mono text-rose-700 font-medium">
                      {this.state.error?.message || 'Falha desconhecida'}
                    </span>
                  </p>
                </div>
              </div>

              {/* Detalhes Técnicos Dobráveis */}
              <details className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700">
                <summary className="font-semibold cursor-pointer text-slate-600 hover:text-slate-900 select-none">
                  Ver detalhes técnicos para suporte
                </summary>
                <div className="mt-2.5 max-h-48 overflow-y-auto space-y-2 font-mono text-[11px] bg-slate-900 text-emerald-400 p-3 rounded-lg leading-relaxed">
                  <div>
                    <span className="text-slate-400">Erro:</span> {this.state.error?.name}: {this.state.error?.message}
                  </div>
                  {this.state.error?.stack && (
                    <div>
                      <span className="text-slate-400">Stack:</span>
                      <pre className="whitespace-pre-wrap text-[10px] text-slate-300 mt-1">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>

              {/* Botões de Ação */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                {isSubModule ? (
                  <button
                    onClick={this.handleResetModule}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-xl shadow-sm transition-all"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Tentar Novamente
                  </button>
                ) : (
                  <button
                    onClick={this.handleReload}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-xl shadow-sm transition-all"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Recarregar Página
                  </button>
                )}

                <button
                  onClick={this.handleCopyDiagnostic}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-xl border border-slate-300 transition-all"
                  title="Copiar relatório para suporte"
                >
                  {this.state.copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copiar Relatório
                    </>
                  )}
                </button>

                <button
                  onClick={this.handleClearStorageAndReload}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-medium text-xs rounded-xl border border-rose-200 transition-all"
                  title="Redefinir dados corrompidos locais"
                >
                  <Trash2 className="w-4 h-4" />
                  Restaurar Padrão
                </button>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 text-center">
              Se o problema persistir após recarregar, utilize a opção "Restaurar Padrão" ou entre em contato com o suporte.
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
