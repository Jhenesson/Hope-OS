
import React, { useRef, useState } from 'react';
import { useAppContext } from '../../../context/AppContext';
import { useFinanceData } from '../context/FinanceDataContext';
import { TrashIcon, UserPlusIcon } from '../../../components/icons/Icons';

type Tab = 'backup' | 'presets';

export const ConfiguracoesPage: React.FC = () => {
    const { appState, setAppState } = useAppContext();
    const { expensePresets, addExpensePreset, deleteExpensePreset } = useFinanceData();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [activeTab, setActiveTab] = useState<Tab>('backup');

    // Preset Form State
    const [newPreset, setNewPreset] = useState({ name: '', description: '', category: '', amount: 0 });

    const handleExport = () => {
        const financeData = {
            lancamentos: appState.lancamentos,
            saidas: appState.saidas,
            expensePresets: appState.expensePresets
        };

        const dataString = JSON.stringify(financeData, null, 2);
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(dataString)}`;

        const link = document.createElement("a");
        link.href = jsonString;
        const date = new Date().toISOString().split('T')[0];
        link.download = `hope-os-financeiro-backup-${date}.json`;
        link.click();
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };
    
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error("Arquivo inválido.");
                
                const importedData = JSON.parse(text);
                
                if (Array.isArray(importedData.lancamentos) && Array.isArray(importedData.saidas)) {
                    if (window.confirm('Isso substituirá seus dados financeiros atuais (Lançamentos, Saídas e Predefinições) pelos dados do arquivo. Dados de clientes e produtos serão mantidos. Deseja continuar?')) {
                        setAppState(prev => ({
                            ...prev,
                            lancamentos: importedData.lancamentos,
                            saidas: importedData.saidas,
                            expensePresets: importedData.expensePresets || prev.expensePresets
                        }));
                        alert('Dados financeiros importados com sucesso!');
                    }
                } else {
                    alert('O arquivo selecionado não contém dados financeiros válidos do HOPE OS.');
                }
            } catch (error) {
                console.error("Failed to parse JSON file:", error);
                alert('Erro ao importar o arquivo. Verifique se é um arquivo .json válido.');
            } finally {
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        };
        reader.readAsText(file);
    };

    const handleAddPreset = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPreset.name || !newPreset.description || !newPreset.amount) return;
        addExpensePreset(newPreset);
        setNewPreset({ name: '', description: '', category: '', amount: 0 });
    };

    return (
        <div className="p-1 h-full flex flex-col">
            <h1 className="text-3xl font-bold text-primary-text mb-6">Configurações Financeiras</h1>
            
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl w-fit mb-6">
                <button
                    onClick={() => setActiveTab('backup')}
                    className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                        activeTab === 'backup'
                            ? 'bg-white text-primary-text shadow-sm'
                            : 'text-secondary-text hover:text-primary-text'
                    }`}
                >
                    Dados & Backup
                </button>
                <button
                    onClick={() => setActiveTab('presets')}
                    className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                        activeTab === 'presets'
                            ? 'bg-white text-primary-text shadow-sm'
                            : 'text-secondary-text hover:text-primary-text'
                    }`}
                >
                    Predefinições de Gastos
                </button>
            </div>

            <div className="flex-1 overflow-y-auto">
                {activeTab === 'backup' && (
                    <div className="bg-gray-50/70 rounded-2xl border border-border-color/50 p-6">
                        <h3 className="text-xl font-semibold text-primary-text">Dados do Módulo Financeiro</h3>
                        <p className="text-secondary-text mt-2 mb-6 max-w-2xl">
                            Exporte especificamente os dados de <strong>Lançamentos (Entradas)</strong> e <strong>Saídas</strong>. 
                            Isso é útil para backups mensais ou migração de dados financeiros sem afetar o cadastro de clientes e produtos.
                        </p>
                        
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={handleExport}
                                className="w-full sm:w-auto rounded-full px-6 py-3 bg-apple-blue text-white font-semibold hover:bg-apple-blue-hover transition-colors flex items-center justify-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                Exportar Financeiro (.json)
                            </button>
                            <button
                                onClick={handleImportClick}
                                className="w-full sm:w-auto rounded-full px-6 py-3 bg-white border-2 border-apple-blue text-apple-blue font-semibold hover:bg-apple-blue/10 transition-colors flex items-center justify-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 5 17 10"/><line x1="12" y1="5" x2="12" y2="15"/></svg>
                                Importar Financeiro (.json)
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept=".json"
                                className="hidden"
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'presets' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
                        {/* List of Presets */}
                        <div className="bg-white rounded-2xl border border-border-color shadow-sm p-6">
                            <h3 className="text-lg font-bold text-primary-text mb-4">Atalhos Cadastrados</h3>
                            {expensePresets.length > 0 ? (
                                <div className="space-y-3">
                                    {expensePresets.map(preset => (
                                        <div key={preset.id} className="flex items-center justify-between p-3 rounded-xl border border-border-color bg-gray-50">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                                                    {preset.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-primary-text">{preset.name}</p>
                                                    <p className="text-xs text-secondary-text">{preset.description} • {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(preset.amount)}</p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => deleteExpensePreset(preset.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-secondary-text text-sm text-center py-8">Nenhum atalho cadastrado.</p>
                            )}
                        </div>

                        {/* Add Form */}
                        <div className="bg-white rounded-2xl border border-border-color shadow-sm p-6 h-fit">
                            <h3 className="text-lg font-bold text-primary-text mb-4">Novo Atalho</h3>
                            <form onSubmit={handleAddPreset} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-secondary-text mb-1">Nome do Botão (Curto)</label>
                                    <input 
                                        type="text" 
                                        value={newPreset.name}
                                        onChange={e => setNewPreset({...newPreset, name: e.target.value})}
                                        className="w-full px-3 py-2 border border-border-color rounded-lg bg-white focus:ring-2 focus:ring-apple-blue outline-none"
                                        placeholder="Ex: Bruno"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary-text mb-1">Descrição Padrão</label>
                                    <input 
                                        type="text" 
                                        value={newPreset.description}
                                        onChange={e => setNewPreset({...newPreset, description: e.target.value})}
                                        className="w-full px-3 py-2 border border-border-color rounded-lg bg-white focus:ring-2 focus:ring-apple-blue outline-none"
                                        placeholder="Ex: Diária Bruno"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary-text mb-1">Categoria Padrão</label>
                                    <input 
                                        type="text" 
                                        value={newPreset.category}
                                        onChange={e => setNewPreset({...newPreset, category: e.target.value})}
                                        className="w-full px-3 py-2 border border-border-color rounded-lg bg-white focus:ring-2 focus:ring-apple-blue outline-none"
                                        placeholder="Ex: Mão de Obra"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary-text mb-1">Valor Padrão (R$)</label>
                                    <input 
                                        type="number" 
                                        value={newPreset.amount || ''}
                                        onChange={e => setNewPreset({...newPreset, amount: parseFloat(e.target.value) || 0})}
                                        className="w-full px-3 py-2 border border-border-color rounded-lg bg-white focus:ring-2 focus:ring-apple-blue outline-none"
                                        placeholder="0,00"
                                        required
                                    />
                                </div>
                                <button 
                                    type="submit" 
                                    className="w-full rounded-full px-5 py-2.5 bg-apple-blue text-white font-medium hover:bg-apple-blue-hover transition-colors flex items-center justify-center gap-2"
                                >
                                    <UserPlusIcon className="w-4 h-4" />
                                    Cadastrar Atalho
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
