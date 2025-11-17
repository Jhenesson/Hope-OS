import React, { useState, useMemo, useEffect } from 'react';
import { MOCK_COPYWRITING } from '../constants';
import { Copywriting, CopyCategory } from '../types';
import { ClipboardCopyIcon, CheckIcon } from '../components/icons/Icons';
import { Modal } from '../components/Modal';

const categoryColors: { [key in CopyCategory]: string } = {
    [CopyCategory.Instagram]: 'bg-gradient-to-r from-pink-100 to-purple-100 text-purple-800',
    [CopyCategory.WhatsApp]: 'bg-green-100 text-green-800',
    [CopyCategory.Email]: 'bg-blue-100 text-blue-800',
    [CopyCategory.Website]: 'bg-yellow-100 text-yellow-800',
    [CopyCategory.Outro]: 'bg-gray-100 text-gray-800',
};

// --- TextosCopysPage Component ---
export const TextosCopysPage: React.FC = () => {
    const [copywriting, setCopywriting] = useState<Copywriting[]>(MOCK_COPYWRITING);
    const [activeFilter, setActiveFilter] = useState<CopyCategory | 'All'>('All');
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Modal States
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedCopy, setSelectedCopy] = useState<Copywriting | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedCopy, setEditedCopy] = useState<Copywriting | null>(null);
    const [newCopy, setNewCopy] = useState<Omit<Copywriting, 'id' | 'createdAt'>>({
        title: '',
        content: '',
        category: CopyCategory.Instagram,
    });

    const filteredCopywriting = useMemo(() => {
        if (activeFilter === 'All') {
            return copywriting;
        }
        return copywriting.filter(c => c.category === activeFilter);
    }, [copywriting, activeFilter]);

    useEffect(() => {
        if (copiedId) {
            const timer = setTimeout(() => setCopiedId(null), 2000);
            return () => clearTimeout(timer);
        }
    }, [copiedId]);

    const handleCopy = (id: string, content: string) => {
        navigator.clipboard.writeText(content).then(() => {
            setCopiedId(id);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    };

    const handleCloseModal = () => {
        setIsAddModalOpen(false);
        setSelectedCopy(null);
        setIsEditing(false);
        setEditedCopy(null);
    };

    const handleOpenEditModal = (item: Copywriting) => {
        setSelectedCopy(item);
        setEditedCopy({ ...item });
        setIsEditing(false);
    };

    const handleAddInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewCopy(prev => ({ ...prev, [name]: value as any }));
    };

    const handleAddNewCopy = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCopy.title || !newCopy.content) return;

        const copyToAdd: Copywriting = {
            id: `copy-${Date.now()}`,
            createdAt: new Date().toISOString().split('T')[0],
            ...newCopy,
        };
        setCopywriting(prev => [copyToAdd, ...prev]);
        setIsAddModalOpen(false);
        setNewCopy({ title: '', content: '', category: CopyCategory.Instagram });
    };

    const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        if (!editedCopy) return;
        const { name, value } = e.target;
        setEditedCopy({ ...editedCopy, [name]: value as any });
    };
    
    const handleSaveChanges = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editedCopy) return;
        setCopywriting(copywriting.map(c => c.id === editedCopy.id ? editedCopy : c));
        setSelectedCopy(editedCopy);
        setIsEditing(false);
    };

    const categories = ['All', ...Object.values(CopyCategory)];

    return (
        <div className="h-full flex flex-col">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
                <h2 className="text-3xl font-bold text-primary-text">Textos & Copys</h2>
                <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="rounded-full px-5 py-2 bg-apple-blue text-white font-medium hover:bg-apple-blue-hover transition-colors">
                    Adicionar Texto
                </button>
            </div>

            <div className="mb-6 flex flex-wrap gap-2">
                {categories.map(category => (
                    <button
                        key={category}
                        onClick={() => setActiveFilter(category as CopyCategory | 'All')}
                        className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                            activeFilter === category
                                ? 'bg-primary-text text-white'
                                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                        {category === 'All' ? 'Todos' : category}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCopywriting.map(item => (
                    <div
                        key={item.id}
                        onClick={() => handleOpenEditModal(item)}
                        className="bg-white rounded-2xl border border-border-color shadow-sm p-6 flex flex-col justify-between text-left transition-transform transform hover:-translate-y-1 cursor-pointer"
                    >
                        <div>
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-lg font-semibold text-primary-text">{item.title}</h3>
                                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${categoryColors[item.category]}`}>
                                    {item.category}
                                </span>
                            </div>
                            <p className="text-sm text-secondary-text whitespace-pre-wrap max-h-40 overflow-y-auto pr-2">{item.content}</p>
                        </div>
                        <div className="mt-4 pt-4 border-t border-border-color flex items-center justify-between">
                            <span className="text-xs text-secondary-text">
                                Criado em: {new Date(item.createdAt + 'T12:00:00').toLocaleDateString('pt-BR')}
                            </span>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopy(item.id, item.content);
                                }}
                                className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                                    copiedId === item.id
                                        ? 'bg-apple-green text-white'
                                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300'
                                }`}
                            >
                                {copiedId === item.id ? <CheckIcon className="w-4 h-4" /> : <ClipboardCopyIcon className="w-4 h-4" />}
                                {copiedId === item.id ? 'Copiado!' : 'Copiar'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add New Copy Modal */}
            <Modal isOpen={isAddModalOpen} onClose={handleCloseModal} title="Adicionar Novo Texto">
                <form onSubmit={handleAddNewCopy} className="space-y-4">
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-secondary-text mb-1">Título</label>
                        <input type="text" name="title" value={newCopy.title} onChange={handleAddInputChange} className="w-full px-3 py-2 border border-border-color rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-apple-blue transition-shadow" required />
                    </div>
                    <div>
                        <label htmlFor="content" className="block text-sm font-medium text-secondary-text mb-1">Conteúdo</label>
                        <textarea name="content" value={newCopy.content} onChange={handleAddInputChange} rows={5} className="w-full px-3 py-2 border border-border-color rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-apple-blue transition-shadow" required />
                    </div>
                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-secondary-text mb-1">Categoria</label>
                        <select name="category" value={newCopy.category} onChange={handleAddInputChange} className="w-full px-3 py-2 border border-border-color rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-apple-blue transition-shadow">
                            {Object.values(CopyCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={handleCloseModal} className="rounded-full px-4 py-2 bg-white border border-gray-200 text-gray-700 font-medium hover:bg-gray-100 transition-colors">Cancelar</button>
                        <button type="submit" className="rounded-full px-5 py-2 bg-apple-blue text-white font-medium hover:bg-apple-blue-hover transition-colors">Salvar Texto</button>
                    </div>
                </form>
            </Modal>
            
            {/* Edit/View Copy Modal */}
            {selectedCopy && editedCopy && (
                <Modal isOpen={!!selectedCopy} onClose={handleCloseModal} title={isEditing ? `Editando "${selectedCopy.title}"` : selectedCopy.title}>
                    {isEditing ? (
                        <form onSubmit={handleSaveChanges} className="space-y-4">
                            <div>
                                <label htmlFor="title" className="block text-sm font-medium text-secondary-text mb-1">Título</label>
                                <input type="text" name="title" value={editedCopy.title} onChange={handleEditInputChange} className="w-full px-3 py-2 border border-border-color rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-apple-blue transition-shadow" required />
                            </div>
                             <div>
                                <label htmlFor="content" className="block text-sm font-medium text-secondary-text mb-1">Conteúdo</label>
                                <textarea name="content" value={editedCopy.content} onChange={handleEditInputChange} rows={5} className="w-full px-3 py-2 border border-border-color rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-apple-blue transition-shadow" required />
                            </div>
                             <div>
                                <label htmlFor="category" className="block text-sm font-medium text-secondary-text mb-1">Categoria</label>
                                <select name="category" value={editedCopy.category} onChange={handleEditInputChange} className="w-full px-3 py-2 border border-border-color rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-apple-blue transition-shadow">
                                    {Object.values(CopyCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsEditing(false)} className="rounded-full px-4 py-2 bg-white border border-gray-200 text-gray-700 font-medium hover:bg-gray-100 transition-colors">Cancelar</button>
                                <button type="submit" className="rounded-full px-5 py-2 bg-apple-blue text-white font-medium hover:bg-apple-blue-hover transition-colors">Salvar Alterações</button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-4">
                             <p className="text-secondary-text bg-gray-50 rounded-lg p-4 whitespace-pre-wrap">{selectedCopy.content}</p>
                             <div className="flex items-center justify-between pt-4 border-t border-border-color mt-4">
                                <span className={`px-2.5 py-1 text-sm font-semibold rounded-full ${categoryColors[selectedCopy.category]}`}>
                                    {selectedCopy.category}
                                </span>
                                <button onClick={() => setIsEditing(true)} className="rounded-full px-5 py-2 bg-apple-blue text-white font-medium hover:bg-apple-blue-hover transition-colors">
                                    Editar
                                </button>
                             </div>
                        </div>
                    )}
                </Modal>
            )}
        </div>
    );
};
