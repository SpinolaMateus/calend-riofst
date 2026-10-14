import React from 'react';
import { 
  Calendar, Clock, Shield, Cloud, FileSpreadsheet, 
  Tv, FileDown, MapPin, ArrowRight, CheckCircle2, Lock
} from 'lucide-react';
import { UnitInfo } from '../types/schedule';

interface HomeScreenProps {
  unitInfo: UnitInfo;
  onSelectIntegration: () => void;
  onSelectCalendar: () => void;
  integrationEventsCount: number;
  calendarEventsCount: number;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  unitInfo,
  onSelectIntegration,
  onSelectCalendar,
  integrationEventsCount,
  calendarEventsCount,
}) => {
  const todayFormatted = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="max-w-6xl mx-auto py-8 sm:py-12 px-4 space-y-10 animate-in fade-in duration-300">
      {/* Hero Welcome Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-8 sm:p-12 shadow-2xl border border-slate-800">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-80 h-80 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              PORTAL UNIFICADO DA UNIDADE
            </span>
            <span className="text-xs text-slate-400 capitalize">
              • {todayFormatted}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
            Gestão & Divulgação de Cronogramas e Eventos
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Selecione o módulo corporativo que deseja acessar. Gerencie a integração de novos colaboradores ou o calendário mensal sincronizado na nuvem.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-6 text-xs text-slate-300 font-medium">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Nuvem Supabase Ativa</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Exportação Rápida em PDF</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Faixas Arrastáveis por Horário</span>
            </div>
          </div>
        </div>
      </div>

      {/* Module Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Module 1: Cronograma de Integração */}
        <div 
          onClick={onSelectIntegration}
          className="group relative bg-white rounded-3xl p-8 border border-slate-200/90 shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col justify-between hover:-translate-y-1"
        >
          <div className="space-y-5">
            {/* Top header */}
            <div className="flex items-center justify-between">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <Clock className="w-7 h-7" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-200">
                Modelo XLS da Unidade
              </span>
            </div>

            {/* Title & Description */}
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors tracking-tight">
                Cronograma de Integração da Unidade
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Painel oficial e editável dos 3 dias de integração de novos colaboradores, com visualização em colunas verticais ou faixas horizontais, abrangência de horário com cores e geração rápida de PDF.
              </p>
            </div>

            {/* Key feature pills */}
            <div className="grid grid-cols-2 gap-2.5 pt-2 text-xs">
              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 font-medium">
                <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="truncate">Faixas Arrastáveis</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 font-medium">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="truncate">Tabela XLS Fiel</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 font-medium">
                <FileDown className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="truncate">PDF Imediato</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 font-medium">
                <Tv className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="truncate">Modo TV / Mural</span>
              </div>
            </div>
          </div>

          {/* CTA Footer */}
          <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              {integrationEventsCount} atividades cadastradas
            </span>
            <div className="flex items-center gap-2 font-bold text-sm text-indigo-600 group-hover:translate-x-1 transition-transform">
              <span>Acessar Cronograma</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Module 2: Calendário & Gestão de Eventos Corporativos */}
        <div 
          onClick={onSelectCalendar}
          className="group relative bg-white rounded-3xl p-8 border border-slate-200/90 shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col justify-between hover:-translate-y-1"
        >
          <div className="space-y-5">
            {/* Top header */}
            <div className="flex items-center justify-between">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-600 to-cyan-600 text-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <Calendar className="w-7 h-7" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider bg-sky-50 text-sky-700 px-3 py-1 rounded-full border border-sky-200">
                  Nuvem Supabase
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 px-2 py-1 rounded-full border border-amber-200 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-amber-600" /> Senha (GGFST)
                </span>
              </div>
            </div>

            {/* Title & Description */}
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900 group-hover:text-sky-600 transition-colors tracking-tight">
                Calendário & Gestão de Eventos
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Gestão mensal de eventos e reuniões corporativas integrado à nuvem Supabase. Controle de salas (Aroeira, Bambuzal, Obeia...), arrastar compromissos entre dias e controle por senha corporativa.
              </p>
            </div>

            {/* Key feature pills */}
            <div className="grid grid-cols-2 gap-2.5 pt-2 text-xs">
              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 font-medium">
                <Cloud className="w-4 h-4 text-sky-600 shrink-0" />
                <span className="truncate">Nuvem Supabase</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 font-medium">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="truncate">Controle de Salas</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 font-medium">
                <Shield className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="truncate">Senha Protegida</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 font-medium">
                <FileSpreadsheet className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="truncate">Exportar CSV</span>
              </div>
            </div>
          </div>

          {/* CTA Footer */}
          <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              {calendarEventsCount} eventos registrados
            </span>
            <div className="flex items-center gap-2 font-bold text-sm text-sky-600 group-hover:translate-x-1 transition-transform">
              <span>Acessar Calendário</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
