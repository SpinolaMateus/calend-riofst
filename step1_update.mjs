import fs from 'fs';

const orig = fs.readFileSync('src/components/PeopleAnalyticsView.tsx', 'utf8');

// 1. Add imports for our new subcomponents
let updated = orig;

// Replace import statement at top
const importReplacement = `import React, { useState, useMemo, useRef } from 'react';
import { 
  Users, Building2, Briefcase, Clock, Calendar, BarChart3, 
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, 
  Search, Filter, X, Download, FileSpreadsheet, Plus, 
  ArrowLeft, RefreshCw, Layers, ShieldCheck, ChevronRight,
  Info, Sparkles, UserCheck, ShieldAlert, Check, HelpCircle,
  FolderTree, GitCommit, FileText, UploadCloud, Edit3, ArrowUpRight,
  Factory, Sliders, Menu
} from 'lucide-react';
import { 
  Employee, PeopleAnalyticsKPI, PeopleAnalyticsFilter, 
  ShiftCategory, ActionPlanItem, ExcelImportSummary 
} from '../types/peopleAnalytics';
import { 
  OFFICIAL_GG_KPIS, 
  generateInitialBahiaEmployees, 
  INITIAL_MACROAREA_MAPPINGS, 
  INITIAL_ACTION_PLANS 
} from '../data/initialPeopleAnalytics';
import * as XLSX from 'xlsx';
import { copyElementAsImage, exportElementToPDF } from '../utils/exportUtils';
import { ExecutiveOverviewTab } from './peopleAnalytics/ExecutiveOverviewTab';
import { IndicatorsGGTab } from './peopleAnalytics/IndicatorsGGTab';
import { AbsenteeismMovementsTab } from './peopleAnalytics/AbsenteeismMovementsTab';
import { SectorsShiftsTab } from './peopleAnalytics/SectorsShiftsTab';
import { AuditFormulasModal } from './peopleAnalytics/AuditFormulasModal';
import { CalculationRulesModal } from './peopleAnalytics/CalculationRulesModal';`;

updated = updated.replace(/import React, \{ useState[\s\S]*?from '\.\.\/utils\/exportUtils';/, importReplacement);

// 2. Add state for modals inside PeopleAnalyticsView component
const stateToAdd = `  // Modais de Governança e Regras
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isCalculationRulesModalOpen, setIsCalculationRulesModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
`;

updated = updated.replace(
  '  // Modais e Diálogos',
  stateToAdd + '\n  // Modais e Diálogos'
);

fs.writeFileSync('src/components/PeopleAnalyticsView.tsx', updated);
console.log('Imports and state added successfully');

