
import React, { useRef, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { ProductsPage } from './ProductsPage';

const STORAGE_KEY = 'hope-os-storage-v1';

type SettingsTab = 'backup' | 'products';

export const SettingsPage: React.FC = () => {
    const { appState, setAppState } = useAppContext();
    const [activeTab, setActiveTab] = useState<SettingsTab>('backup');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExport = () => {
        const dataString = localStorage.getItem(STORAGE_KEY);
        if (!dataString) {
            alert("Nenhum dado encontrado para exportar.");
            return;
        }

        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(dataString)}`;

        const link = document.createElement("a");
        link.href = jsonString;
        const date = new Date().toISOString().split('T')[0];
        link.download = `hope-os-backup-${date}.json`;
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
                if (typeof text !== 'string') throw new Error("File is not a valid text file.");
                
                // Basic validation
                const importedData = JSON.parse(text);
                
                // We check for some core keys, but don't require ALL of them to allow backward compatibility if new modules are added
                // However, to ensure it's a HopeOS file, at least some key ones should exist.
                const essentialKeys = ['clients', 'recordings', 'products'];
                const hasEssentialKeys = essentialKeys.every(key => key in importedData);
                
                if (hasEssentialKeys) {
                    // We can merge or replace. Here we replace to ensure consistency.
                    localStorage.setItem(STORAGE_KEY, text);
                    alert(`Importação concluída com sucesso! A aplicação será recarregada para aplicar os novos dados.`);
                    window.location.reload();
                } else {
                    alert('O arquivo selecionado não parece ser um backup válido do HOPE OS (faltam chaves essenciais).');
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

    return (
        <div className="h-full flex flex-col">
            <h2 className="text-3xl font-bold text-primary-text mb-6">Configurações</h2>
            
             {/* Tabs */}
             <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl w-fit mb-6">
                <button
                    onClick={() => setActiveTab('backup')}
                    className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                        activeTab === 'backup'
                            ? 'bg-white text-primary-text shadow-sm'
                            : 'text-secondary-text hover:text-primary-text'
                    }`}
                >
                    Geral & Backup
                </button>
                <button
                    onClick={() => setActiveTab('products')}
                    className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                        activeTab === 'products'
                            ? 'bg-white text-primary-text shadow-sm'
                            : 'text-secondary-text hover:text-primary-text'
                    }`}
                >
                    Produtos & Serviços
                </button>
            </div>

            <div className="flex-1 overflow-y-auto">
                {activeTab === 'backup' && (
                    <div className="bg-white rounded-2xl border border-border-color shadow-sm p-6 animate-fadeIn">
                        <h3 className="text-xl font-semibold text-primary-text">Backup de Dados</h3>
                        <p className="text-secondary-text mt-2 mb-6">
                            Exporte todos os seus dados (Clientes, Financeiro, Campanhas, etc.) para um arquivo .json para backup ou para transferir para outro dispositivo.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={handleExport}
                                className="w-full sm:w-auto flex-1 rounded-full px-6 py-3 bg-apple-blue text-white font-semibold hover:bg-apple-blue-hover transition-colors flex items-center justify-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                Exportar Dados (.json)
                            </button>
                            <button
                                onClick={handleImportClick}
                                className="w-full sm:w-auto flex-1 rounded-full px-6 py-3 bg-white border-2 border-apple-blue text-apple-blue font-semibold hover:bg-apple-blue/10 transition-colors flex items-center justify-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 5 17 10"/><line x1="12" y1="5" x2="12" y2="15"/></svg>
                                Importar Dados (.json)
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

                {activeTab === 'products' && (
                    <div className="animate-fadeIn h-full">
                        <ProductsPage />
                    </div>
                )}
            </div>
        </div>
    );
};
