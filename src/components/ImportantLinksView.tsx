import React, { useState, useMemo } from 'react';
import { 
  ExternalLink, Plus, Search, Filter, Bookmark, BookmarkCheck,
  Edit3, Trash2, Copy, Check, ArrowLeft, Globe, FolderPlus,
  Settings, RefreshCw, X, Link as LinkIcon, Sparkles, Folder,
  Shield, CheckCircle2, LayoutGrid, List, AlertCircle
} from 'lucide-react';
import { ImportantLink, ImportantLinkCategory } from '../types/importantLinks';
import { INITIAL_IMPORTANT_LINKS, INITIAL_LINK_CATEGORIES } from '../data/initialImportantLinks';

interface ImportantLinksViewProps {
  onBackToHome: () => void;
}

const STORAGE_KEY_LINKS = 'klabin_important_links_v1';
const STORAGE_KEY_CATEGORIES = 'klabin_link_categories_v1';

const COLOR_PALETTE = [
  { name: 'Índigo', hex: '#4f46e5' },
  { name: 'Teal / Verde Água', hex: '#0d9488' },
  { name: 'Laranja / Âmbar', hex: '#ea580c' },
  { name: 'Azul Céu', hex: '#0284c7' },
  { name: 'Verde Esmeralda', hex: '#16a34a' },
  { name: 'Roxo / Violeta', hex: '#9333ea' },
  { name: 'Rosa / Carmim', hex: '#e11d48' },
  { name: 'Ardósia / Grafite', hex: '#475569' },
];

export const ImportantLinksView: React.FC<ImportantLinksViewProps> = ({ onBackToHome }) => {
  // Estado das Categorias
  const [categories, setCategories] = useState<ImportantLinkCategory[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CATEGORIES);
      return saved ? JSON.parse(saved) : INITIAL_LINK_CATEGORIES;
    } catch {
      return INITIAL_LINK_CATEGORIES;
    }
  });

  // Estado dos Links
  const [links, setLinks] = useState<ImportantLink[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LINKS);
      return saved ? JSON.parse(saved) : INITIAL_IMPORTANT_LINKS;
    } catch {
      return INITIAL_IMPORTANT_LINKS;
    }
  });

  // Filtros e busca
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterOnlyPinned, setFilterOnlyPinned] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modais
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [linkToEdit, setLinkToEdit] = useState<ImportantLink | null>(null);

  // Formulário de Link
  const [formTitle, setFormTitle] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formColor, setFormColor] = useState('#4f46e5');
  const [formIsPinned, setFormIsPinned] = useState(false);

  // Formulário de Nova Categoria no Modal de Categorias
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#4f46e5');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');
  const [editingCatColor, setEditingCatColor] = useState('');

  // Toast temporário
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Salvar links no localStorage
  const persistLinks = (newLinks: ImportantLink[]) => {
    setLinks(newLinks);
    try {
      localStorage.setItem(STORAGE_KEY_LINKS, JSON.stringify(newLinks));
    } catch (e) {
      console.error('Erro ao salvar links:', e);
    }
  };

  // Salvar categorias no localStorage
  const persistCategories = (newCategories: ImportantLinkCategory[]) => {
    setCategories(newCategories);
    try {
      localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(newCategories));
    } catch (e) {
      console.error('Erro ao salvar categorias:', e);
    }
  };

  // Abrir modal de novo link
  const handleOpenNewLink = () => {
    setLinkToEdit(null);
    setFormTitle('');
    setFormUrl('');
    setFormDescription('');
    setFormCategoryId(categories[0]?.id || 'cat_geral');
    setFormColor(categories[0]?.color || '#4f46e5');
    setFormIsPinned(false);
    setIsLinkModalOpen(true);
  };

  // Abrir modal de edição
  const handleOpenEditLink = (link: ImportantLink) => {
    setLinkToEdit(link);
    setFormTitle(link.title);
    setFormUrl(link.url);
    setFormDescription(link.description);
    setFormCategoryId(link.categoryId);
    setFormColor(link.color || '#4f46e5');
    setFormIsPinned(Boolean(link.isPinned));
    setIsLinkModalOpen(true);
  };

  // Salvar link (criação ou edição)
  const handleSaveLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formUrl.trim()) {
      showToast('Preencha o título e a URL do link.');
      return;
    }

    let cleanUrl = formUrl.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://${cleanUrl}`;
    }

    const cat = categories.find(c => c.id === formCategoryId) || categories[0];

    if (linkToEdit) {
      // Atualizar existente
      const updated = links.map(l => l.id === linkToEdit.id ? {
        ...l,
        title: formTitle.trim(),
        url: cleanUrl,
        description: formDescription.trim(),
        categoryId: cat.id,
        categoryName: cat.name,
        color: formColor,
        isPinned: formIsPinned,
        updatedAt: new Date().toISOString(),
      } : l);
      persistLinks(updated);
      showToast('Link atualizado com sucesso!');
    } else {
      // Inserir novo
      const newLink: ImportantLink = {
        id: `link_${Date.now()}`,
        title: formTitle.trim(),
        url: cleanUrl,
        description: formDescription.trim(),
        categoryId: cat.id,
        categoryName: cat.name,
        color: formColor,
        isPinned: formIsPinned,
        createdAt: new Date().toISOString(),
      };
      persistLinks([newLink, ...links]);
      showToast('Novo link adicionado!');
    }

    setIsLinkModalOpen(false);
  };

  // Excluir link
  const handleDeleteLink = (id: string, title: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o link "${title}"?`)) {
      const filtered = links.filter(l => l.id !== id);
      persistLinks(filtered);
      showToast('Link excluído com sucesso.');
    }
  };

  // Alternar fixado / favorito
  const handleTogglePin = (id: string) => {
    const updated = links.map(l => {
      if (l.id === id) {
        const nextPinned = !l.isPinned;
        showToast(nextPinned ? 'Link fixado no topo!' : 'Link desafixado.');
        return { ...l, isPinned: nextPinned };
      }
      return l;
    });
    persistLinks(updated);
  };

  // Copiar URL do link
  const handleCopyUrl = (link: ImportantLink) => {
    navigator.clipboard.writeText(link.url);
    setCopiedLinkId(link.id);
    showToast('Link copiado para a área de transferência!');
    setTimeout(() => setCopiedLinkId(null), 2000);
  };

  // Criar nova categoria
  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const newCat: ImportantLinkCategory = {
      id: `cat_${Date.now()}`,
      name: newCatName.trim(),
      color: newCatColor,
    };
    persistCategories([...categories, newCat]);
    setNewCatName('');
    showToast(`Categoria "${newCat.name}" criada com sucesso!`);
  };

  // Salvar edição de categoria
  const handleSaveEditCategory = (catId: string) => {
    if (!editingCatName.trim()) return;
    const updatedCats = categories.map(c => c.id === catId ? {
      ...c,
      name: editingCatName.trim(),
      color: editingCatColor || c.color,
    } : c);
    persistCategories(updatedCats);

    // Atualiza nome e cor nos links correspondentes
    const updatedLinks = links.map(l => l.categoryId === catId ? {
      ...l,
      categoryName: editingCatName.trim(),
      color: editingCatColor || l.color,
    } : l);
    persistLinks(updatedLinks);

    setEditingCategoryId(null);
    showToast('Categoria atualizada!');
  };

  // Excluir categoria
  const handleDeleteCategory = (catId: string, catName: string) => {
    const linkedCount = links.filter(l => l.categoryId === catId).length;
    if (categories.length <= 1) {
      showToast('Você deve manter pelo menos uma categoria no sistema.');
      return;
    }
    if (window.confirm(`Excluir a categoria "${catName}"? ${linkedCount > 0 ? `Os ${linkedCount} links vinculados serão movidos para "Geral".` : ''}`)) {
      const remainingCats = categories.filter(c => c.id !== catId);
      const fallbackCat = remainingCats[0];
      persistCategories(remainingCats);

      if (linkedCount > 0) {
        const remappedLinks = links.map(l => l.categoryId === catId ? {
          ...l,
          categoryId: fallbackCat.id,
          categoryName: fallbackCat.name,
        } : l);
        persistLinks(remappedLinks);
      }
      showToast(`Categoria "${catName}" removida.`);
    }
  };

  // Restaurar padrões iniciais
  const handleResetToDefault = () => {
    if (window.confirm('Deseja restaurar a lista padrão oficial de links e categorias da Klabin?')) {
      persistCategories(INITIAL_LINK_CATEGORIES);
      persistLinks(INITIAL_IMPORTANT_LINKS);
      showToast('Links e categorias restaurados para o padrão oficial.');
    }
  };

  // Filtragem dos links
  const filteredLinks = useMemo(() => {
    return links.filter(link => {
      // Filtro de Categoria
      if (selectedCategory !== 'all' && link.categoryId !== selectedCategory) {
        return false;
      }
      // Filtro de Fixados
      if (filterOnlyPinned && !link.isPinned) {
        return false;
      }
      // Filtro de Busca
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inTitle = link.title.toLowerCase().includes(q);
        const inDesc = link.description.toLowerCase().includes(q);
        const inUrl = link.url.toLowerCase().includes(q);
        const inCat = link.categoryName.toLowerCase().includes(q);
        const inTags = link.tags?.some(t => t.toLowerCase().includes(q)) ?? false;
        return inTitle || inDesc || inUrl || inCat || inTags;
      }
      return true;
    }).sort((a, b) => {
      // Fixados aparecem primeiro
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return a.title.localeCompare(b.title, 'pt-BR');
    });
  }, [links, selectedCategory, filterOnlyPinned, searchQuery]);

  return (
    <div className="min-h-full py-8 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#132F46] text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. TOP HEADER BANNER - EXECUTIVE & CLEAN */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-[#132F46] rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        {/* Glows */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={onBackToHome}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/10"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar ao Início</span>
              </button>
              
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                <Globe className="w-3.5 h-3.5" />
                Hub Corporativo de Links
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white flex items-center gap-2">
              Links Importantes & Portais da Unidade
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Acesse rapidamente os portais institucionais, sistemas operacionais, serviços de G&G, segurança e ferramentas de rotina da Klabin Feira de Santana.
            </p>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2.5 flex-wrap self-start md:self-auto shrink-0">
            <button
              onClick={handleOpenNewLink}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs transition-all shadow-md flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Link</span>
            </button>

            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              <span>Gerenciar Categorias</span>
            </button>

            <button
              onClick={handleResetToDefault}
              title="Restaurar lista oficial padrão"
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white border border-white/10 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats summary bar */}
        <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total de Links</span>
            <span className="text-lg font-black text-white">{links.length}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Categorias Ativas</span>
            <span className="text-lg font-black text-white">{categories.length}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Links Fixados</span>
            <span className="text-lg font-black text-amber-300">{links.filter(l => l.isPinned).length}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Links Filtrados</span>
            <span className="text-lg font-black text-emerald-300">{filteredLinks.length}</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SEARCH, CATEGORY PILLS & VIEW TOGGLE */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Campo de Busca Rápida */}
          <div className="relative flex-1 max-w-lg">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar por título, descrição, categoria ou URL..."
              className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Toggle Fixados & Modo de Visualização */}
          <div className="flex items-center gap-2 self-end md:self-auto flex-wrap">
            <button
              onClick={() => setFilterOnlyPinned(prev => !prev)}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
                filterOnlyPinned
                  ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${filterOnlyPinned ? 'text-amber-600 fill-amber-500' : 'text-slate-400'}`} />
              <span>Apenas Fixados ({links.filter(l => l.isPinned).length})</span>
            </button>

            <div className="inline-flex rounded-xl bg-slate-100 p-0.5 border border-slate-200">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Visualização em Grade de Cards"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'table'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Visualização em Tabela Compacta"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Pills Slider / Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
              selectedCategory === 'all'
                ? 'bg-[#132F46] text-white border-[#132F46] shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Todas as Categorias ({links.length})
          </button>

          {categories.map(cat => {
            const count = links.filter(l => l.categoryId === cat.id).length;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 border ${
                  isSelected
                    ? 'text-white shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
                style={isSelected ? { backgroundColor: cat.color, borderColor: cat.color } : {}}
              >
                <span 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: isSelected ? '#ffffff' : cat.color }} 
                />
                <span>{cat.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isSelected ? 'bg-black/20 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. CONTENT AREA — GRID DE CARDS OU TABELA */}
      {/* ========================================================================= */}
      {filteredLinks.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/90 shadow-xs space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <LinkIcon className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800">Nenhum link encontrado</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Não encontramos nenhum link com os filtros ou termo de busca atuais. Tente buscar por outro termo ou adicione um novo link.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory('all'); setFilterOnlyPinned(false); }}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Limpar Filtros
            </button>
            <button
              onClick={handleOpenNewLink}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-xs"
            >
              Adicionar Novo Link
            </button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        /* ----------------------------------------------------------------- */
        /* GRID DE CARDS MODERNOS */
        /* ----------------------------------------------------------------- */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredLinks.map(link => {
            const cat = categories.find(c => c.id === link.categoryId);
            const badgeColor = link.color || cat?.color || '#4f46e5';

            return (
              <div
                key={link.id}
                className="group relative bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between hover:-translate-y-1"
                style={{ borderTopColor: badgeColor, borderTopWidth: '4px' }}
              >
                <div className="space-y-3.5">
                  {/* Top card header: Category Badge & Pin toggle */}
                  <div className="flex items-center justify-between gap-2">
                    <span 
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                      style={{ 
                        backgroundColor: `${badgeColor}15`, 
                        color: badgeColor,
                        border: `1px solid ${badgeColor}30` 
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: badgeColor }} />
                      {link.categoryName}
                    </span>

                    <button
                      onClick={() => handleTogglePin(link.id)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        link.isPinned
                          ? 'text-amber-500 bg-amber-50 hover:bg-amber-100'
                          : 'text-slate-300 hover:text-amber-500 hover:bg-slate-50'
                      }`}
                      title={link.isPinned ? "Desafixar do topo" : "Fixar no topo"}
                    >
                      <Bookmark className={`w-4 h-4 ${link.isPinned ? 'fill-amber-500' : ''}`} />
                    </button>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-1.5">
                    <h3 className="text-base font-black text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug tracking-tight">
                      {link.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                      {link.description || 'Sem descrição cadastrada.'}
                    </p>
                  </div>

                  {/* URL Snippet */}
                  <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-100 truncate">
                    <Globe className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{link.url.replace(/^https?:\/\//i, '')}</span>
                  </div>
                </div>

                {/* Bottom Card Actions */}
                <div className="pt-4 mt-5 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCopyUrl(link)}
                      className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                      title="Copiar URL"
                    >
                      {copiedLinkId === link.id ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      onClick={() => handleOpenEditLink(link)}
                      className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      title="Editar Link"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteLink(link.id, link.title)}
                      className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Excluir Link"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Open Link Button */}
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-xs hover:opacity-95"
                    style={{ backgroundColor: badgeColor }}
                  >
                    <span>Acessar</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ----------------------------------------------------------------- */
        /* TABELA COMPACTA DE LINKS */
        /* ----------------------------------------------------------------- */
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#132F46] text-white text-[11px] font-bold">
                <tr>
                  <th className="py-3 px-3 text-center w-12">Fixado</th>
                  <th className="py-3 px-4 min-w-[200px]">Título do Link</th>
                  <th className="py-3 px-3 min-w-[150px]">Categoria</th>
                  <th className="py-3 px-4 min-w-[250px]">Descrição</th>
                  <th className="py-3 px-4 min-w-[200px]">Endereço (URL)</th>
                  <th className="py-3 px-4 text-center min-w-[140px]">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredLinks.map(link => {
                  const badgeColor = link.color || '#4f46e5';
                  return (
                    <tr key={link.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleTogglePin(link.id)}
                          className={link.isPinned ? 'text-amber-500' : 'text-slate-300 hover:text-amber-500'}
                          title={link.isPinned ? "Desafixar" : "Fixar"}
                        >
                          <Bookmark className={`w-4 h-4 mx-auto ${link.isPinned ? 'fill-amber-500' : ''}`} />
                        </button>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {link.title}
                      </td>
                      <td className="py-3 px-3">
                        <span 
                          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                          style={{ 
                            backgroundColor: `${badgeColor}15`, 
                            color: badgeColor,
                            border: `1px solid ${badgeColor}30` 
                          }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: badgeColor }} />
                          {link.categoryName}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                        {link.description}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 max-w-xs truncate">
                        {link.url}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors"
                            title="Abrir em Nova Aba"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => handleCopyUrl(link)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                            title="Copiar URL"
                          >
                            {copiedLinkId === link.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => handleOpenEditLink(link)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                            title="Editar"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteLink(link.id, link.title)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MODAL: ADICIONAR / EDITAR LINK */}
      {/* ========================================================================= */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <LinkIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {linkToEdit ? 'Editar Link Importante' : 'Novo Link Importante'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Preencha as informações para organizar o hub de links da fábrica.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsLinkModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLink} className="space-y-4 text-xs">
              {/* Título */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Título do Link *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ex: Portal ENK Treinamentos, Ficha de EPIs..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* URL */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Endereço Web (URL) *</label>
                <input
                  type="text"
                  required
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  placeholder="Ex: https://enk.klabin.com.br"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Categoria */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 block">Categoria *</label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsLinkModalOpen(false);
                      setIsCategoryModalOpen(true);
                    }}
                    className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-1"
                  >
                    <FolderPlus className="w-3 h-3" /> Gerenciar Categorias
                  </button>
                </div>
                <select
                  value={formCategoryId}
                  onChange={(e) => {
                    setFormCategoryId(e.target.value);
                    const selected = categories.find(c => c.id === e.target.value);
                    if (selected) setFormColor(selected.color);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Descrição */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Descrição ou Finalidade</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Breve resumo para orientar os colaboradores sobre o que é feito neste portal..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Seletor de Cor do Destaque */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Cor de Identificação</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {COLOR_PALETTE.map(cp => (
                    <button
                      key={cp.hex}
                      type="button"
                      onClick={() => setFormColor(cp.hex)}
                      className={`w-7 h-7 rounded-xl flex items-center justify-center transition-transform ${
                        formColor === cp.hex ? 'scale-115 ring-2 ring-offset-2 ring-slate-800' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: cp.hex }}
                      title={cp.name}
                    >
                      {formColor === cp.hex && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Checkbox Fixado */}
              <div className="pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formIsPinned}
                    onChange={(e) => setFormIsPinned(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                  />
                  <span className="font-bold text-slate-800">Fixar link no topo (Destaque)</span>
                </label>
              </div>

              {/* Botões do Rodapé */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsLinkModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-xs"
                >
                  {linkToEdit ? 'Salvar Alterações' : 'Adicionar Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL: GERENCIAMENTO DE CATEGORIAS */}
      {/* ========================================================================= */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
                  <Folder className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Gerenciar Categorias de Links
                  </h3>
                  <p className="text-xs text-slate-500">
                    Crie, renomeie ou altere as cores das categorias do hub.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Criar Nova Categoria */}
            <form onSubmit={handleCreateCategory} className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3 text-xs">
              <span className="font-bold text-slate-800 block">Adicionar Nova Categoria</span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Nome da categoria (ex: Manuais, Financeiro...)"
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
                
                {/* Seletor de Cor rápido */}
                <input
                  type="color"
                  value={newCatColor}
                  onChange={(e) => setNewCatColor(e.target.value)}
                  className="w-9 h-9 p-0.5 rounded-xl border border-slate-200 cursor-pointer bg-white"
                  title="Escolha a cor da categoria"
                />

                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 transition-colors shadow-xs"
                >
                  Criar
                </button>
              </div>
            </form>

            {/* Lista de Categorias Existentes */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1 text-xs">
              <span className="font-bold text-slate-600 block text-[11px] uppercase tracking-wider">
                Categorias Atuais ({categories.length})
              </span>

              {categories.map(cat => {
                const count = links.filter(l => l.categoryId === cat.id).length;
                const isEditing = editingCategoryId === cat.id;

                return (
                  <div 
                    key={cat.id}
                    className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3 shadow-2xs"
                  >
                    {isEditing ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={editingCatName}
                          onChange={(e) => setEditingCatName(e.target.value)}
                          className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-800 focus:outline-none"
                        />
                        <input
                          type="color"
                          value={editingCatColor}
                          onChange={(e) => setEditingCatColor(e.target.value)}
                          className="w-8 h-8 p-0.5 rounded-lg border border-slate-200 cursor-pointer"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEditCategory(cat.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-teal-600 text-white font-bold text-xs"
                        >
                          Salvar
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingCategoryId(null)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2.5">
                          <span 
                            className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                            style={{ backgroundColor: cat.color }}
                          />
                          <div>
                            <span className="font-bold text-slate-800 block">{cat.name}</span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {count} {count === 1 ? 'link associado' : 'links associados'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCategoryId(cat.id);
                              setEditingCatName(cat.name);
                              setEditingCatColor(cat.color);
                            }}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors"
                            title="Editar Categoria"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat.id, cat.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                            title="Excluir Categoria"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Fechar */}
            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
