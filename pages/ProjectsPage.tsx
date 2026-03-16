
import React, { useState, useMemo, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { Project, ProductionStage, Client, ProjectTrack, TrackStatus } from '../types';
import { Modal } from '../components/Modal';
import { AbstractAvatar } from '../components/AbstractAvatar';
import { ProjectsIcon, LinkIcon, CalendarIcon, TrashIcon, ClockIcon, PlusIcon, CheckIcon, MusicIcon, StarIcon } from '../components/icons/Icons';

const stageColors: { [key in ProductionStage]: string } = {
    [ProductionStage.PreProducao]: 'bg-indigo-100 text-indigo-800',
    [ProductionStage.Gravacao]: 'bg-blue-100 text-blue-800',
    [ProductionStage.Edicao]: 'bg-yellow-100 text-yellow-800',
    [ProductionStage.Mixagem]: 'bg-purple-100 text-purple-800',
    [ProductionStage.Masterizacao]: 'bg-pink-100 text-pink-800',
    [ProductionStage.Revisao]: 'bg-orange-100 text-orange-800',
    [ProductionStage.Finalizado]: 'bg-green-100 text-green-800',
};

const trackStatusColors: { [key in TrackStatus]: string } = {
    [TrackStatus.AFazer]: 'bg-gray-100 text-gray-500',
    [TrackStatus.EmAndamento]: 'bg-yellow-100 text-yellow-700',
    [TrackStatus.Concluido]: 'bg-green-100 text-green-700',
};

const stageProgress: { [key in ProductionStage]: number } = {
    [ProductionStage.PreProducao]: 10,
    [ProductionStage.Gravacao]: 30,
    [ProductionStage.Edicao]: 50,
    [ProductionStage.Mixagem]: 70,
    [ProductionStage.Masterizacao]: 85,
    [ProductionStage.Revisao]: 95,
    [ProductionStage.Finalizado]: 100,
};

// --- Helper for calculating complex project progress ---
const calculateComplexProgress = (tracks: ProjectTrack[]) => {
    if (tracks.length === 0) return 0;
    const weights = { [TrackStatus.AFazer]: 0, [TrackStatus.EmAndamento]: 50, [TrackStatus.Concluido]: 100 };
    let totalPoints = 0;
    const stagesPerTrack = 5; // Pre, Rec, Edit, Mix, Master
    
    tracks.forEach(t => {
        totalPoints += weights[t.statusPreProd] + weights[t.statusRec] + weights[t.statusEdit] + weights[t.statusMix] + weights[t.statusMaster];
    });

    return Math.round(totalPoints / (tracks.length * stagesPerTrack * 100) * 100);
};

export const ProjectsPage: React.FC = () => {
    const { appState, setAppState } = useAppContext();
    const { projects, clients } = appState;
    const projectTracks = appState.projectTracks || []; // Proteção contra undefined

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStage, setFilterStage] = useState<ProductionStage | 'All'>('All');
    
    // UI State para linha de inserção rápida
    const [inlineTrackTitle, setInlineTrackTitle] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const [newProject, setNewProject] = useState<Partial<Project>>({
        name: '',
        clientId: '',
        stage: ProductionStage.PreProducao,
        isComplex: true,
        folderLink: '',
        deadline: '',
        notes: ''
    });

    const clientsById = useMemo(() => clients.reduce((acc, c) => ({...acc, [c.id]: c}), {} as Record<string, Client>), [clients]);

    const filteredProjects = useMemo(() => {
        return projects
            .filter(p => filterStage === 'All' ? true : p.stage === filterStage)
            .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || (clientsById[p.clientId]?.name.toLowerCase().includes(searchTerm.toLowerCase())));
    }, [projects, filterStage, searchTerm, clientsById]);

    const handleSaveProject = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProject.name || !newProject.clientId) return;

        const now = new Date().toISOString();
        const projectId = `proj-${Date.now()}`;
        const projectToAdd: Project = {
            id: projectId,
            name: newProject.name!,
            clientId: newProject.clientId!,
            stage: newProject.stage || ProductionStage.PreProducao,
            progress: 0,
            isComplex: newProject.isComplex,
            folderLink: newProject.folderLink,
            deadline: newProject.deadline,
            musiciansIds: [],
            notes: newProject.notes,
            createdAt: now,
            updatedAt: now
        };

        setAppState(prev => ({ ...prev, projects: [projectToAdd, ...prev.projects] }));
        setIsAddModalOpen(false);
        setNewProject({ stage: ProductionStage.PreProducao, isComplex: true });
    };

    const handleUpdateTrackStatus = (trackId: string, stageField: keyof ProjectTrack, nextStatus: TrackStatus) => {
        setAppState(prev => {
            const currentTracks = prev.projectTracks || [];
            const updatedTracks = currentTracks.map(t => t.id === trackId ? { ...t, [stageField]: nextStatus } : t);
            
            // Recalcular progresso do projeto pai
            const track = updatedTracks.find(t => t.id === trackId);
            if (!track) return prev;

            const siblingTracks = updatedTracks.filter(t => t.projectId === track.projectId);
            const newProgress = calculateComplexProgress(siblingTracks);

            return {
                ...prev,
                projectTracks: updatedTracks,
                projects: prev.projects.map(p => p.id === track.projectId ? { ...p, progress: newProgress, updatedAt: new Date().toISOString() } : p)
            };
        });
    };

    const handleQuickAddTrack = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProject || !inlineTrackTitle.trim()) return;

        const newTrack: ProjectTrack = {
            id: `track-${Date.now()}`,
            projectId: selectedProject.id,
            title: inlineTrackTitle,
            statusPreProd: TrackStatus.AFazer,
            statusRec: TrackStatus.AFazer,
            statusEdit: TrackStatus.AFazer,
            statusMix: TrackStatus.AFazer,
            statusMaster: TrackStatus.AFazer,
            order: (projectTracks.filter(t => t.projectId === selectedProject.id).length) + 1
        };

        setAppState(prev => ({
            ...prev,
            projectTracks: [...(prev.projectTracks || []), newTrack]
        }));
        
        setInlineTrackTitle('');
        // Mantém o foco no input para adicionar várias músicas seguidas
        inputRef.current?.focus();
    };

    const handleUpdateTrackNotes = (trackId: string, notes: string) => {
        setAppState(prev => ({
            ...prev,
            projectTracks: (prev.projectTracks || []).map(t => t.id === trackId ? { ...t, notes } : t)
        }));
    };

    const StatusCell = ({ status, onClick }: { status: TrackStatus, onClick: () => void }) => {
        return (
            <button 
                onClick={onClick}
                className={`w-full px-2 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all text-center ${trackStatusColors[status]}`}
            >
                {status}
            </button>
        );
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
                <h2 className="text-3xl font-bold text-primary-text">Produções em Andamento</h2>
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <input 
                        type="text" 
                        placeholder="Buscar projeto ou artista..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="px-4 py-2 border border-border-color rounded-full bg-white focus:outline-none focus:ring-2 focus:ring-apple-blue flex-1 min-w-[250px]"
                    />
                    <button 
                        onClick={() => setIsAddModalOpen(true)}
                        className="rounded-full px-5 py-2 bg-apple-blue text-white font-medium hover:bg-apple-blue-hover transition-colors flex items-center gap-2 whitespace-nowrap"
                    >
                        <PlusIcon className="w-4 h-4" />
                        Nova Produção
                    </button>
                </div>
            </div>

            {/* Grid de Projetos */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 overflow-y-auto pb-6">
                {filteredProjects.map(project => {
                    const client = clientsById[project.clientId];
                    const tracksCount = projectTracks.filter(t => t.projectId === project.id).length;
                    
                    return (
                        <div 
                            key={project.id} 
                            onClick={() => setSelectedProject(project)}
                            className="bg-white rounded-2xl border border-border-color shadow-sm p-6 hover:shadow-md transition-all cursor-pointer group"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${stageColors[project.stage]}`}>
                                    {project.stage}
                                </span>
                                {project.deadline && (
                                    <div className="flex items-center gap-1 text-[10px] font-bold text-secondary-text uppercase">
                                        <CalendarIcon className="w-3 h-3" />
                                        {new Date(project.deadline + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                    </div>
                                )}
                            </div>

                            <h3 className="text-xl font-bold text-primary-text mb-1 leading-tight group-hover:text-apple-blue transition-colors">{project.name}</h3>
                            <div className="flex items-center gap-2 mb-6">
                                <AbstractAvatar name={client?.name || ''} gender={client?.gender || 'female'} size={20} />
                                <p className="text-sm text-secondary-text font-medium">{client?.name || 'Artista Desconhecido'}</p>
                                {project.isComplex && <span className="text-[10px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full font-bold uppercase">{tracksCount} Faixas</span>}
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-end">
                                    <span className="text-[10px] font-bold text-secondary-text uppercase tracking-widest">Conclusão</span>
                                    <span className="text-xs font-black text-primary-text">{project.progress}%</span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full transition-all duration-1000 ease-out ${project.progress === 100 ? 'bg-apple-green' : 'bg-apple-blue'}`} 
                                        style={{ width: `${project.progress}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Dashboard Detalhado (Modal de Tabela estilo Notion) */}
            {selectedProject && (
                <Modal isOpen={!!selectedProject} onClose={() => setSelectedProject(null)} title={selectedProject.name} className="max-w-[95vw] w-full h-[90vh]">
                    <div className="flex flex-col h-full">
                        {/* Header do Dossiê */}
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-border-color">
                             <div className="flex items-center gap-4">
                                <div className="bg-indigo-50 p-4 rounded-3xl">
                                    <MusicIcon className="w-8 h-8 text-indigo-600" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-primary-text leading-tight">{selectedProject.name}</h2>
                                    <p className="text-secondary-text font-medium flex items-center gap-1">Artista: <span className="text-primary-text font-bold">{clientsById[selectedProject.clientId]?.name}</span></p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                {selectedProject.folderLink && (
                                    <a href={selectedProject.folderLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-white border border-border-color rounded-full text-sm font-bold text-secondary-text hover:text-primary-text hover:bg-gray-50 transition-all shadow-sm">
                                        <LinkIcon className="w-4 h-4" /> Link Drive
                                    </a>
                                )}
                                <button 
                                    onClick={() => inputRef.current?.focus()}
                                    className="flex items-center gap-2 px-6 py-2 bg-apple-blue text-white rounded-full text-sm font-bold shadow-md hover:bg-apple-blue-hover transition-all"
                                >
                                    <PlusIcon className="w-4 h-4" /> Nova Música
                                </button>
                            </div>
                        </div>

                        {/* Tabela de Faixas */}
                        <div className="flex-1 overflow-auto custom-scrollbar">
                            <table className="w-full border-collapse">
                                <thead className="sticky top-0 bg-white z-10">
                                    <tr className="border-b border-border-color text-left">
                                        <th className="py-3 px-4 text-[10px] font-black uppercase text-secondary-text tracking-widest w-64">Música</th>
                                        <th className="py-3 px-4 text-[10px] font-black uppercase text-secondary-text tracking-widest text-center">Pré Produção</th>
                                        <th className="py-3 px-4 text-[10px] font-black uppercase text-secondary-text tracking-widest text-center">Gravação</th>
                                        <th className="py-3 px-4 text-[10px] font-black uppercase text-secondary-text tracking-widest text-center">Edição</th>
                                        <th className="py-3 px-4 text-[10px] font-black uppercase text-secondary-text tracking-widest text-center">Mix</th>
                                        <th className="py-3 px-4 text-[10px] font-black uppercase text-secondary-text tracking-widest text-center">Master</th>
                                        <th className="py-3 px-4 text-[10px] font-black uppercase text-secondary-text tracking-widest min-w-[200px]">Resumo IA / Notas</th>
                                        <th className="py-3 px-4 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {projectTracks.filter(t => t.projectId === selectedProject.id).sort((a,b) => a.order - b.order).map(track => (
                                        <tr key={track.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-2">
                                                    <MusicIcon className="w-4 h-4 text-gray-300" />
                                                    <span className="font-bold text-sm text-primary-text">{track.title}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-2">
                                                <StatusCell 
                                                    status={track.statusPreProd} 
                                                    onClick={() => {
                                                        const sequence = [TrackStatus.AFazer, TrackStatus.EmAndamento, TrackStatus.Concluido];
                                                        const next = sequence[(sequence.indexOf(track.statusPreProd) + 1) % sequence.length];
                                                        handleUpdateTrackStatus(track.id, 'statusPreProd', next);
                                                    }}
                                                />
                                            </td>
                                            <td className="py-4 px-2">
                                                <StatusCell 
                                                    status={track.statusRec} 
                                                    onClick={() => {
                                                        const sequence = [TrackStatus.AFazer, TrackStatus.EmAndamento, TrackStatus.Concluido];
                                                        const next = sequence[(sequence.indexOf(track.statusRec) + 1) % sequence.length];
                                                        handleUpdateTrackStatus(track.id, 'statusRec', next);
                                                    }}
                                                />
                                            </td>
                                            <td className="py-4 px-2">
                                                <StatusCell 
                                                    status={track.statusEdit} 
                                                    onClick={() => {
                                                        const sequence = [TrackStatus.AFazer, TrackStatus.EmAndamento, TrackStatus.Concluido];
                                                        const next = sequence[(sequence.indexOf(track.statusEdit) + 1) % sequence.length];
                                                        handleUpdateTrackStatus(track.id, 'statusEdit', next);
                                                    }}
                                                />
                                            </td>
                                            <td className="py-4 px-2">
                                                <StatusCell 
                                                    status={track.statusMix} 
                                                    onClick={() => {
                                                        const sequence = [TrackStatus.AFazer, TrackStatus.EmAndamento, TrackStatus.Concluido];
                                                        const next = sequence[(sequence.indexOf(track.statusMix) + 1) % sequence.length];
                                                        handleUpdateTrackStatus(track.id, 'statusMix', next);
                                                    }}
                                                />
                                            </td>
                                            <td className="py-4 px-2">
                                                <StatusCell 
                                                    status={track.statusMaster} 
                                                    onClick={() => {
                                                        const sequence = [TrackStatus.AFazer, TrackStatus.EmAndamento, TrackStatus.Concluido];
                                                        const next = sequence[(sequence.indexOf(track.statusMaster) + 1) % sequence.length];
                                                        handleUpdateTrackStatus(track.id, 'statusMaster', next);
                                                    }}
                                                />
                                            </td>
                                            <td className="py-4 px-4">
                                                <input 
                                                    type="text" 
                                                    value={track.notes || ''} 
                                                    placeholder="Notas rápidas..."
                                                    onChange={(e) => handleUpdateTrackNotes(track.id, e.target.value)}
                                                    className="w-full text-xs bg-transparent border-b border-transparent focus:border-gray-200 outline-none italic text-secondary-text"
                                                />
                                            </td>
                                            <td className="py-4 px-2 text-right">
                                                <button 
                                                    onClick={() => { if(confirm('Excluir música?')) setAppState(prev => ({...prev, projectTracks: (prev.projectTracks || []).filter(t => t.id !== track.id)})); }}
                                                    className="text-gray-300 hover:text-apple-red transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {/* Linha de Inserção estilo Notion */}
                                    <tr className="bg-gray-50/30">
                                        <td className="py-4 px-4" colSpan={8}>
                                            <form onSubmit={handleQuickAddTrack} className="flex items-center gap-2">
                                                <PlusIcon className="w-4 h-4 text-gray-400" />
                                                <input 
                                                    ref={inputRef}
                                                    type="text" 
                                                    placeholder="Adicionar nova música..."
                                                    value={inlineTrackTitle}
                                                    onChange={(e) => setInlineTrackTitle(e.target.value)}
                                                    className="flex-1 bg-transparent text-sm font-medium border-none outline-none text-primary-text"
                                                />
                                                {inlineTrackTitle && (
                                                    <span className="text-[10px] font-bold text-secondary-text uppercase bg-white border px-2 py-1 rounded shadow-sm">Enter p/ salvar</span>
                                                )}
                                            </form>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Rodapé de Status */}
                        <div className="mt-auto pt-6 border-t border-border-color flex justify-between items-center bg-white">
                             <div className="flex items-center gap-6">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-secondary-text uppercase tracking-widest">Progresso Total</span>
                                    <span className="text-xl font-black text-primary-text">{selectedProject.progress}%</span>
                                </div>
                                <div className="h-8 w-px bg-gray-200"></div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-secondary-text uppercase tracking-widest">Prazo</span>
                                    <span className="text-sm font-bold text-apple-orange">{selectedProject.deadline ? new Date(selectedProject.deadline + 'T12:00:00').toLocaleDateString('pt-BR') : 'Sem prazo'}</span>
                                </div>
                             </div>
                             <div className="flex gap-3">
                                <button onClick={() => { if(confirm('Excluir projeto inteiro?')) { setAppState(prev => ({...prev, projects: prev.projects.filter(p => p.id !== selectedProject.id)})); setSelectedProject(null); } }} className="text-apple-red text-xs font-bold uppercase px-4 py-2 hover:bg-red-50 rounded-full transition-all">Excluir Projeto</button>
                                <button onClick={() => setSelectedProject(null)} className="px-8 py-2 bg-gray-900 text-white font-black rounded-full shadow-lg hover:scale-105 transition-all">Salvar e Sair</button>
                             </div>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Modal para Novo Projeto */}
            {isAddModalOpen && (
                <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Nova Produção">
                    <form onSubmit={handleSaveProject} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-secondary-text mb-1">Título do Álbum/EP/Single</label>
                            <input 
                                type="text" 
                                value={newProject.name || ''} 
                                onChange={e => setNewProject({...newProject, name: e.target.value})}
                                className="w-full px-3 py-2 border border-border-color rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-apple-blue"
                                placeholder="Ex: Álbum 'Luz e Sombra'"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary-text mb-1">Artista / Cliente</label>
                            <select 
                                value={newProject.clientId || ''} 
                                onChange={e => setNewProject({...newProject, clientId: e.target.value})}
                                className="w-full px-3 py-2 border border-border-color rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-apple-blue"
                                required
                            >
                                <option value="">Selecione...</option>
                                {clients.filter(c => c.status === 'Active').map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-secondary-text mb-1">Estágio Inicial</label>
                                <select 
                                    value={newProject.stage} 
                                    onChange={e => setNewProject({...newProject, stage: e.target.value as ProductionStage})}
                                    className="w-full px-3 py-2 border border-border-color rounded-lg bg-white"
                                >
                                    {Object.values(ProductionStage).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary-text mb-1">Prazo Estimado</label>
                                <input 
                                    type="date" 
                                    value={newProject.deadline || ''} 
                                    onChange={e => setNewProject({...newProject, deadline: e.target.value})}
                                    className="w-full px-3 py-2 border border-border-color rounded-lg bg-white"
                                />
                            </div>
                        </div>
                         <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-border-color">
                            <input 
                                type="checkbox" 
                                id="isComplex" 
                                checked={newProject.isComplex} 
                                onChange={e => setNewProject({...newProject, isComplex: e.target.checked})}
                                className="w-4 h-4 text-apple-blue rounded"
                            />
                            <label htmlFor="isComplex" className="text-sm font-bold text-primary-text">Ativar Gestão de Faixas (Múltiplas Músicas)</label>
                        </div>
                        <div className="pt-4 flex justify-end gap-3">
                            <button type="button" onClick={() => setIsAddModalOpen(false)} className="rounded-full px-5 py-2 font-bold text-secondary-text">Cancelar</button>
                            <button type="submit" className="rounded-full px-8 py-2 bg-apple-blue text-white font-black shadow-md hover:bg-apple-blue-hover transition-all">Abrir Projeto</button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};
