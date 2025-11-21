
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Campaign, CampaignStatus, CampaignObjective, ProductCategory, CampaignChecklistItem } from '../types';
import { Modal } from '../components/Modal';
import { RocketIcon, TargetIcon, MegaphoneIcon, ImageIcon, TrendingUpIcon, TrashIcon, DollarSignIcon, BoldIcon, ItalicIcon, ListIcon, CheckSquareIcon } from '../components/icons/Icons';

const objectiveColors: { [key in CampaignObjective]: string } = {
    [CampaignObjective.Leads]: 'bg-blue-100 text-blue-800',
    [CampaignObjective.Vendas]: 'bg-green-100 text-green-800',
    [CampaignObjective.Engajamento]: 'bg-yellow-100 text-yellow-800',
    [CampaignObjective.Lancamento]: 'bg-purple-100 text-purple-800',
    [CampaignObjective.Branding]: 'bg-pink-100 text-pink-800',
};

const statusColors: { [key in CampaignStatus]: string } = {
    [CampaignStatus.Ativa]: 'bg-green-500',
    [CampaignStatus.Concluida]: 'bg-gray-500',
    [CampaignStatus.Rascunho]: 'bg-yellow-500',
    [CampaignStatus.Arquivada]: 'bg-red-500',
};

// --- Components ---

const RichTextEditor: React.FC<{ initialValue: string; onChange: (val: string) => void }> = ({ initialValue, onChange }) => {
    const contentRef = useRef<HTMLDivElement>(null);

    const execCmd = (command: string, value: string | undefined = undefined) => {
        document.execCommand(command, false, value);
        if (contentRef.current) {
            onChange(contentRef.current.innerHTML);
        }
    };

    return (
        <div className="border border-border-color rounded-lg overflow-hidden bg-white shadow-sm flex flex-col h-full min-h-[300px]">
            <div className="bg-gray-50 border-b border-border-color p-2 flex items-center gap-2 sticky top-0 z-10">
                <button type="button" onClick={() => execCmd('bold')} className="p-1.5 hover:bg-gray-200 rounded transition-colors text-secondary-text" title="Negrito"><BoldIcon className="w-4 h-4" /></button>
                <button type="button" onClick={() => execCmd('italic')} className="p-1.5 hover:bg-gray-200 rounded transition-colors text-secondary-text" title="Itálico"><ItalicIcon className="w-4 h-4" /></button>
                <button type="button" onClick={() => execCmd('underline')} className="p-1.5 hover:bg-gray-200 rounded transition-colors text-secondary-text font-underline" title="Sublinhado"><span className="underline font-bold text-sm px-1">U</span></button>
                <div className="w-px h-4 bg-gray-300 mx-1"></div>
                <button type="button" onClick={() => execCmd('insertUnorderedList')} className="p-1.5 hover:bg-gray-200 rounded transition-colors text-secondary-text" title="Lista com marcadores"><ListIcon className="w-4 h-4" /></button>
                 <div className="w-px h-4 bg-gray-300 mx-1"></div>
                 <button type="button" onClick={() => execCmd('formatBlock', 'H3')} className="p-1.5 hover:bg-gray-200 rounded transition-colors text-secondary-text font-bold text-sm" title="Título">H1</button>
                 <button type="button" onClick={() => execCmd('formatBlock', 'P')} className="p-1.5 hover:bg-gray-200 rounded transition-colors text-secondary-text text-sm" title="Parágrafo">P</button>
            </div>
            <div
                ref={contentRef}
                contentEditable
                className="flex-1 p-6 focus:outline-none overflow-y-auto prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: initialValue }}
                onInput={(e) => onChange(e.currentTarget.innerHTML)}
                onBlur={(e) => onChange(e.currentTarget.innerHTML)}
            />
        </div>
    );
};

const Checklist: React.FC<{ items: CampaignChecklistItem[]; onChange: (items: CampaignChecklistItem[]) => void }> = ({ items, onChange }) => {
    const [newItemText, setNewItemText] = useState('');

    const handleToggle = (id: string) => {
        const updated = items.map(item => item.id === id ? { ...item, completed: !item.completed } : item);
        onChange(updated);
    };

    const handleDelete = (id: string) => {
        const updated = items.filter(item => item.id !== id);
        onChange(updated);
    };

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemText.trim()) return;
        const newItem: CampaignChecklistItem = {
            id: `chk-${Date.now()}`,
            text: newItemText,
            completed: false
        };
        onChange([...items, newItem]);
        setNewItemText('');
    };

    return (
        <div className="bg-white border border-border-color rounded-lg p-4 shadow-sm h-full flex flex-col">
            <h4 className="text-sm font-bold text-secondary-text mb-3 flex items-center gap-2 flex-shrink-0">
                <CheckSquareIcon className="w-4 h-4" /> Checklist da Campanha
            </h4>
            <div className="space-y-2 mb-3 flex-1 overflow-y-auto custom-scrollbar">
                {items.map(item => (
                    <div key={item.id} className="flex items-center gap-3 group">
                        <button 
                            type="button"
                            onClick={() => handleToggle(item.id)}
                            className={`w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${item.completed ? 'bg-apple-blue border-apple-blue text-white' : 'bg-white border-gray-300 text-transparent hover:border-apple-blue'}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        </button>
                        <span className={`flex-1 text-sm ${item.completed ? 'text-gray-400 line-through' : 'text-primary-text'}`}>{item.text}</span>
                        <button 
                            type="button" 
                            onClick={() => handleDelete(item.id)}
                            className="text-gray-300 hover:text-apple-red opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                        >
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    </div>
                ))}
                {items.length === 0 && <p className="text-xs text-gray-400 italic">Nenhuma tarefa adicionada.</p>}
            </div>
            <div className="flex gap-2 mt-2 pt-2 border-t border-border-color/50 flex-shrink-0">
                <input 
                    type="text" 
                    value={newItemText}
                    onChange={(e) => setNewItemText(e.target.value)}
                    placeholder="Nova tarefa..."
                    className="flex-1 text-sm bg-transparent focus:outline-none"
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd(e)}
                />
                <button type="button" onClick={handleAdd} className="text-xs font-medium text-apple-blue hover:underline">Adicionar</button>
            </div>
        </div>
    );
};

const StatCard: React.FC<{ title: string; value: string; subtitle?: string; icon: React.ReactNode }> = ({ title, value, subtitle, icon }) => (
    <div className="bg-white rounded-2xl border border-border-color shadow-sm p-5 flex items-start justify-between">
        <div>
            <p className="text-sm font-medium text-secondary-text">{title}</p>
            <p className="text-2xl font-bold text-primary-text mt-1">{value}</p>
            {subtitle && <p className="text-xs text-secondary-text mt-1">{subtitle}</p>}
        </div>
        <div className="bg-gray-50 rounded-full p-2 text-apple-blue">
            {icon}
        </div>
    </div>
);

const CampaignCard: React.FC<{ campaign: Campaign; onClick: () => void }> = ({ campaign, onClick }) => (
    <div onClick={onClick} className="bg-white rounded-2xl border border-border-color shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-all hover:-translate-y-1 group">
        <div className="h-32 bg-gray-100 relative overflow-hidden flex items-center justify-center">
             {campaign.visuals?.imageUrl ? (
                <img src={campaign.visuals.imageUrl} alt={campaign.name} className="w-full h-full object-cover" />
             ) : (
                <div className="flex flex-col items-center text-gray-300">
                    <ImageIcon className="w-12 h-12" />
                    <span className="text-xs mt-2 font-medium uppercase tracking-wider">Sem imagem</span>
                </div>
             )}
             <div className="absolute top-3 right-3">
                <span className={`flex h-3 w-3 rounded-full ${statusColors[campaign.status]} ring-2 ring-white shadow-sm`} title={campaign.status}></span>
             </div>
        </div>
        <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-md ${objectiveColors[campaign.objective]}`}>
                    {campaign.objective}
                </span>
            </div>
            <h3 className="font-bold text-primary-text leading-tight mb-2 line-clamp-2">{campaign.name}</h3>
            
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-border-color/50">
                 <div className="text-xs text-secondary-text">
                    {new Date(campaign.startDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} 
                    {campaign.endDate ? ` - ${new Date(campaign.endDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}` : ''}
                 </div>
                 {campaign.budget ? (
                     <div className="text-xs font-semibold text-primary-text bg-gray-100 px-2 py-1 rounded-md">
                         {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(campaign.budget)}
                     </div>
                 ) : null}
            </div>
        </div>
    </div>
);

const TimelineRow: React.FC<{ campaign: Campaign }> = ({ campaign }) => {
    const now = new Date();
    const start = new Date(campaign.startDate);
    const end = campaign.endDate ? new Date(campaign.endDate) : null;
    
    return (
        <div className="flex items-center gap-4 py-3 border-b border-border-color/50 last:border-0">
             <div className={`w-2 h-2 rounded-full flex-shrink-0 ${statusColors[campaign.status]}`}></div>
             <div className="flex-1 min-w-0">
                 <p className="text-sm font-medium text-primary-text truncate">{campaign.name}</p>
                 <p className="text-xs text-secondary-text">
                     {start.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                     {end ? ` → ${end.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}` : ''}
                 </p>
             </div>
             <span className={`px-2 py-1 text-[10px] font-semibold rounded-full whitespace-nowrap ${objectiveColors[campaign.objective]}`}>
                 {campaign.objective}
             </span>
        </div>
    );
};


export const CampaignsPage: React.FC = () => {
    const { appState, setAppState } = useAppContext();
    const { campaigns, products } = appState;
    
    const [activeTab, setActiveTab] = useState<'dashboard' | 'library'>('dashboard');
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editorTab, setEditorTab] = useState<'strategy' | 'notebook'>('strategy');
    const [currentCampaign, setCurrentCampaign] = useState<Partial<Campaign>>({});
    
    // --- Computed Data ---
    const activeCampaigns = useMemo(() => campaigns.filter(c => c.status === CampaignStatus.Ativa), [campaigns]);
    
    const totalInvested = useMemo(() => campaigns.reduce((sum, c) => sum + (c.spent || 0), 0), [campaigns]);
    const totalLeads = useMemo(() => campaigns.reduce((sum, c) => sum + (c.results?.leads || 0), 0), [campaigns]);
    const avgCPL = totalLeads > 0 ? totalInvested / totalLeads : 0;

    const upcomingCampaigns = useMemo(() => {
        return [...campaigns]
            .filter(c => c.status !== CampaignStatus.Arquivada)
            .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
            .slice(0, 5);
    }, [campaigns]);

    // --- Handlers ---
    const handleOpenEditor = (campaign?: Campaign) => {
        if (campaign) {
            setCurrentCampaign({ ...campaign });
        } else {
            setCurrentCampaign({
                name: '',
                status: CampaignStatus.Rascunho,
                objective: CampaignObjective.Leads,
                startDate: new Date().toISOString().split('T')[0],
                copy: { main: '' },
                results: { leads: 0, sales: 0, clicks: 0, reach: 0 },
                notes: '',
                checklist: []
            });
        }
        setEditorTab('strategy');
        setIsEditorOpen(true);
    };

    const handleSaveCampaign = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentCampaign.name) return;

        const now = new Date().toISOString();
        
        if (currentCampaign.id) {
            // Edit
            setAppState(prev => ({
                ...prev,
                campaigns: prev.campaigns.map(c => c.id === currentCampaign.id ? { ...currentCampaign, updatedAt: now } as Campaign : c)
            }));
        } else {
            // Create
            const newCampaign: Campaign = {
                ...currentCampaign as Campaign,
                id: `camp-${Date.now()}`,
                createdAt: now,
                updatedAt: now,
            };
             setAppState(prev => ({
                ...prev,
                campaigns: [newCampaign, ...prev.campaigns]
            }));
        }
        setIsEditorOpen(false);
    };
    
    const handleDeleteCampaign = () => {
        if (currentCampaign.id && window.confirm('Tem certeza que deseja excluir esta campanha?')) {
             setAppState(prev => ({
                ...prev,
                campaigns: prev.campaigns.filter(c => c.id !== currentCampaign.id)
            }));
            setIsEditorOpen(false);
        }
    };
    
    const handleInputChange = (field: string, value: any) => {
        setCurrentCampaign(prev => ({ ...prev, [field]: value }));
    };
    
    const handleNestedChange = (parent: 'copy' | 'results' | 'visuals' | 'audience', field: string, value: any) => {
        setCurrentCampaign(prev => ({
            ...prev,
            [parent]: {
                ...prev[parent],
                [field]: value
            }
        }));
    };

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
                <h2 className="text-3xl font-bold text-primary-text">Campanhas</h2>
                <div className="flex bg-gray-100 p-1 rounded-full">
                    <button 
                        onClick={() => setActiveTab('dashboard')}
                        className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'dashboard' ? 'bg-white text-primary-text shadow-sm' : 'text-secondary-text hover:text-primary-text'}`}
                    >
                        Dashboard
                    </button>
                    <button 
                        onClick={() => setActiveTab('library')}
                        className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'library' ? 'bg-white text-primary-text shadow-sm' : 'text-secondary-text hover:text-primary-text'}`}
                    >
                        Biblioteca
                    </button>
                </div>
                <button 
                    onClick={() => handleOpenEditor()}
                    className="rounded-full px-5 py-2 bg-apple-blue text-white font-medium hover:bg-apple-blue-hover transition-colors flex items-center gap-2"
                >
                    <RocketIcon className="w-4 h-4" />
                    Nova Campanha
                </button>
            </div>

            {/* Dashboard View */}
            {activeTab === 'dashboard' && (
                <div className="flex-1 overflow-y-auto">
                     {/* Stats Row */}
                     <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                        <StatCard title="Campanhas Ativas" value={activeCampaigns.length.toString()} icon={<MegaphoneIcon className="w-6 h-6" />} />
                        <StatCard title="Leads Gerados" value={totalLeads.toString()} subtitle="Total histórico" icon={<TargetIcon className="w-6 h-6" />} />
                        <StatCard title="Custo por Lead" value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(avgCPL)} subtitle="Média global" icon={<TrendingUpIcon className="w-6 h-6" />} />
                        <StatCard title="Total Investido" value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(totalInvested)} icon={<DollarSignIcon className="w-6 h-6" />} />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Active/Recent Campaigns List */}
                        <div className="lg:col-span-2 bg-white rounded-2xl border border-border-color shadow-sm p-6">
                            <h3 className="text-lg font-bold text-primary-text mb-4">Timeline de Campanhas</h3>
                            <div className="flex flex-col">
                                {upcomingCampaigns.length > 0 ? (
                                    upcomingCampaigns.map(camp => (
                                        <div key={camp.id} onClick={() => handleOpenEditor(camp)} className="cursor-pointer hover:bg-gray-50 transition-colors rounded-lg px-2 -mx-2">
                                            <TimelineRow campaign={camp} />
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-secondary-text text-sm py-4">Nenhuma campanha recente.</p>
                                )}
                            </div>
                             <button onClick={() => setActiveTab('library')} className="mt-4 text-sm font-medium text-apple-blue hover:underline">Ver todas as campanhas</button>
                        </div>

                        {/* Quick Ideas / Inspiration Placeholder */}
                        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-sm p-6 text-white flex flex-col justify-between relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="text-lg font-bold mb-2 text-amber-400">Insights Criativos</h3>
                                <p className="text-sm text-gray-300 mb-4">
                                    "A melhor copy é aquela que fala com a emoção antes da razão. Tente focar no benefício final do DrumDay."
                                </p>
                            </div>
                             <div className="relative z-10 mt-4">
                                <button className="text-xs font-bold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors">
                                    Gerar Ideia com IA
                                </button>
                            </div>
                            <div className="absolute -bottom-4 -right-4 opacity-10">
                                <RocketIcon className="w-32 h-32" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Library View */}
            {activeTab === 'library' && (
                <div className="flex-1 overflow-y-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-6">
                        {campaigns.map(camp => (
                            <CampaignCard key={camp.id} campaign={camp} onClick={() => handleOpenEditor(camp)} />
                        ))}
                    </div>
                    {campaigns.length === 0 && (
                        <div className="text-center py-20">
                            <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                <MegaphoneIcon className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-primary-text">Nenhuma campanha criada</h3>
                            <p className="text-secondary-text mt-1">Comece criando sua primeira campanha de marketing.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Editor Modal */}
            {isEditorOpen && (
                <Modal 
                    isOpen={isEditorOpen} 
                    onClose={() => setIsEditorOpen(false)} 
                    title={currentCampaign.id ? 'Editar Campanha' : 'Nova Campanha'} 
                    headerClassName="bg-gray-50"
                    className="max-w-[95vw] w-full lg:max-w-6xl h-[90vh]"
                >
                    <form onSubmit={handleSaveCampaign} className="flex flex-col h-full">
                        
                        {/* Tab Switcher */}
                        <div className="flex border-b border-border-color mb-4 flex-shrink-0">
                            <button 
                                type="button"
                                onClick={() => setEditorTab('strategy')}
                                className={`px-4 py-2 text-sm font-medium transition-colors relative ${editorTab === 'strategy' ? 'text-apple-blue' : 'text-secondary-text hover:text-primary-text'}`}
                            >
                                Planejamento
                                {editorTab === 'strategy' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-apple-blue"></span>}
                            </button>
                            <button 
                                type="button"
                                onClick={() => setEditorTab('notebook')}
                                className={`px-4 py-2 text-sm font-medium transition-colors relative ${editorTab === 'notebook' ? 'text-apple-blue' : 'text-secondary-text hover:text-primary-text'}`}
                            >
                                Caderno & Tarefas
                                {editorTab === 'notebook' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-apple-blue"></span>}
                            </button>
                        </div>

                        {/* Scrollable Content Area */}
                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col">
                             <div className="mb-4">
                                <label className="block text-sm font-medium text-secondary-text mb-1">Nome da Campanha</label>
                                <input 
                                    type="text" 
                                    value={currentCampaign.name} 
                                    onChange={(e) => handleInputChange('name', e.target.value)} 
                                    className="w-full px-3 py-2 border border-border-color rounded-lg focus:ring-2 focus:ring-apple-blue outline-none font-semibold text-lg"
                                    placeholder="Ex: Lançamento Single Inverno"
                                    required 
                                />
                            </div>

                            {editorTab === 'strategy' && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fadeIn">
                                    {/* LEFT COLUMN: STRATEGY */}
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-bold text-secondary-text uppercase tracking-wide border-b border-border-color pb-1">Estratégia</h4>
                                        
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-medium text-secondary-text mb-1">Objetivo</label>
                                                <select 
                                                    value={currentCampaign.objective} 
                                                    onChange={(e) => handleInputChange('objective', e.target.value)}
                                                    className="w-full px-2 py-2 border border-border-color rounded-lg bg-white text-sm focus:ring-2 focus:ring-apple-blue outline-none"
                                                >
                                                    {Object.values(CampaignObjective).map(obj => <option key={obj} value={obj}>{obj}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-secondary-text mb-1">Status</label>
                                                <select 
                                                    value={currentCampaign.status} 
                                                    onChange={(e) => handleInputChange('status', e.target.value)}
                                                    className="w-full px-2 py-2 border border-border-color rounded-lg bg-white text-sm focus:ring-2 focus:ring-apple-blue outline-none"
                                                >
                                                    {Object.values(CampaignStatus).map(st => <option key={st} value={st}>{st}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-medium text-secondary-text mb-1">Início</label>
                                                <input 
                                                    type="date" 
                                                    value={currentCampaign.startDate} 
                                                    onChange={(e) => handleInputChange('startDate', e.target.value)} 
                                                    className="w-full px-2 py-2 border border-border-color rounded-lg text-sm focus:ring-2 focus:ring-apple-blue outline-none"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-secondary-text mb-1">Fim</label>
                                                <input 
                                                    type="date" 
                                                    value={currentCampaign.endDate || ''} 
                                                    onChange={(e) => handleInputChange('endDate', e.target.value)} 
                                                    className="w-full px-2 py-2 border border-border-color rounded-lg text-sm focus:ring-2 focus:ring-apple-blue outline-none"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-secondary-text mb-1">Produto Relacionado</label>
                                            <select 
                                                value={currentCampaign.productId || ''} 
                                                onChange={(e) => handleInputChange('productId', e.target.value)}
                                                className="w-full px-2 py-2 border border-border-color rounded-lg bg-white text-sm focus:ring-2 focus:ring-apple-blue outline-none"
                                            >
                                                <option value="">Nenhum</option>
                                                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    {/* RIGHT COLUMN: CREATIVE */}
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-bold text-secondary-text uppercase tracking-wide border-b border-border-color pb-1">Criativos & Copy</h4>
                                        <div>
                                            <label className="block text-xs font-medium text-secondary-text mb-1">Copy Principal</label>
                                            <textarea 
                                                value={currentCampaign.copy?.main || ''} 
                                                onChange={(e) => handleNestedChange('copy', 'main', e.target.value)}
                                                rows={5}
                                                className="w-full px-3 py-2 border border-border-color rounded-lg text-sm focus:ring-2 focus:ring-apple-blue outline-none"
                                                placeholder="Digite o texto principal do anúncio..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-secondary-text mb-1">Link da Imagem</label>
                                            <input 
                                                type="text" 
                                                value={currentCampaign.visuals?.imageUrl || ''} 
                                                onChange={(e) => handleNestedChange('visuals', 'imageUrl', e.target.value)}
                                                className="w-full px-3 py-2 border border-border-color rounded-lg text-sm focus:ring-2 focus:ring-apple-blue outline-none"
                                                placeholder="https://..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {editorTab === 'notebook' && (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn h-full">
                                    <div className="lg:col-span-2 flex flex-col h-full min-h-[300px]">
                                        <h4 className="text-xs font-bold text-secondary-text uppercase tracking-wide mb-2 flex-shrink-0">Bloco de Notas (Rascunho)</h4>
                                        <div className="flex-1">
                                            <RichTextEditor 
                                                initialValue={currentCampaign.notes || ''} 
                                                onChange={(val) => handleInputChange('notes', val)} 
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-6">
                                        <div className="flex-1 min-h-[250px]">
                                            <Checklist 
                                                items={currentCampaign.checklist || []} 
                                                onChange={(items) => handleInputChange('checklist', items)} 
                                            />
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded-xl border border-border-color flex-shrink-0">
                                             <h4 className="text-xs font-bold text-secondary-text uppercase tracking-wide border-b border-border-color pb-2 mb-3 flex items-center gap-2">
                                                 <DollarSignIcon className="w-4 h-4" /> Resultados
                                             </h4>
                                             <div className="space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <label className="text-sm text-secondary-text">Orçamento</label>
                                                    <input type="number" value={currentCampaign.budget || ''} onChange={(e) => handleInputChange('budget', parseFloat(e.target.value))} className="w-24 text-right px-2 py-1 border border-border-color rounded-lg text-sm bg-white" placeholder="R$" />
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <label className="text-sm text-secondary-text">Gasto</label>
                                                    <input type="number" value={currentCampaign.spent || ''} onChange={(e) => handleInputChange('spent', parseFloat(e.target.value))} className="w-24 text-right px-2 py-1 border border-border-color rounded-lg text-sm bg-white" placeholder="R$" />
                                                </div>
                                                 <div className="flex justify-between items-center">
                                                    <label className="text-sm text-secondary-text">Leads</label>
                                                    <input type="number" value={currentCampaign.results?.leads || ''} onChange={(e) => handleNestedChange('results', 'leads', parseFloat(e.target.value))} className="w-24 text-right px-2 py-1 border border-border-color rounded-lg text-sm bg-white" />
                                                </div>
                                             </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer Buttons (Fixed at Bottom of Form) */}
                        <div className="flex justify-between pt-4 mt-2 border-t border-border-color flex-shrink-0 bg-white">
                            {currentCampaign.id ? (
                                <button 
                                    type="button" 
                                    onClick={handleDeleteCampaign}
                                    className="p-2 text-gray-400 hover:text-apple-red hover:bg-red-50 rounded-full transition-colors"
                                >
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            ) : <div></div>}
                            
                            <div className="flex gap-3">
                                <button 
                                    type="button" 
                                    onClick={() => setIsEditorOpen(false)} 
                                    className="rounded-full px-4 py-2 bg-white border border-gray-200 text-gray-700 font-medium hover:bg-gray-100"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit" 
                                    className="rounded-full px-5 py-2 bg-apple-blue text-white font-medium hover:bg-apple-blue-hover"
                                >
                                    Salvar Campanha
                                </button>
                            </div>
                        </div>

                    </form>
                </Modal>
            )}
        </div>
    );
};
