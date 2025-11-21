

import React, { useState, useMemo } from 'react';
import { useFinanceData } from '../context/FinanceDataContext';
import { SaidaFinanceira } from '../../../types';
import { Modal } from '../../../components/Modal';
import { TrashIcon, UserPlusIcon } from '../../../components/icons/Icons';

export const SaidasPage: React.FC = () => {
    const { saidas, addSaida, updateSaida, deleteSaida, expensePresets } = useFinanceData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentSaida, setCurrentSaida] = useState<Partial<SaidaFinanceira> | null>(null);

    // Filter State
    const currentMonthStr = new Date().toISOString().slice(0, 7); // YYYY-MM
    const [filterMonth, setFilterMonth] = useState<string>(currentMonthStr);

    const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    
    // --- Helper: Get Available Months ---
    const availableMonths = useMemo(() => {
        const months = new Set<string>();
        months.add(new Date().toISOString().slice(0, 7)); // Always add current month

        saidas.forEach(s => {
            if (s.data) {
                months.add(s.data.slice(0, 7));
            }
        });
        return Array.from(months).sort().reverse();
    }, [saidas]);

    const formatMonthLabel = (monthStr: string) => {
        const [year, month] = monthStr.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        return date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase());
    };

    // Filter and Sort Logic
    const filteredSaidas = useMemo(() => {
        let result = [...saidas];
        if (filterMonth !== 'all') {
            result = result.filter(s => s.data.startsWith(filterMonth));
        }
        // Sort by date descending
        return result.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
    }, [saidas, filterMonth]);


    const totalSaidas = filteredSaidas.reduce((sum, s) => sum + s.valor, 0);

    const handleOpenModal = (saida: Partial<SaidaFinanceira> | null) => {
        setCurrentSaida(saida ? { ...saida } : { descricao: '', valor: 0, data: new Date().toISOString().split('T')[0], categoria: '' });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentSaida(null);
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentSaida || !currentSaida.descricao || !currentSaida.valor) return;

        if (currentSaida.id) {
            updateSaida(currentSaida as SaidaFinanceira);
        } else {
            addSaida(currentSaida as Omit<SaidaFinanceira, 'id' | 'createdAt' | 'updatedAt'>);
        }
        handleCloseModal();
    };

    return (
        <div className="p-1">
            <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <h1 className="text-3xl font-bold text-primary-text whitespace-nowrap">Gestão de Saídas</h1>
                    <select 
                        value={filterMonth} 
                        onChange={(e) => setFilterMonth(e.target.value)}
                        className="bg-white border border-border-color rounded-full px-4 py-2 text-sm font-medium text-secondary-text focus:outline-none focus:ring-2 focus:ring-apple-blue transition-shadow cursor-pointer"
                    >
                        <option value="all">Todos os Meses</option>
                        {availableMonths.map(month => (
                            <option key={month} value={month}>{formatMonthLabel(month)}</option>
                        ))}
                    </select>
                </div>
                <button
                    onClick={() => handleOpenModal(null)}
                    className="w-full md:w-auto rounded-full px-5 py-2 bg-apple-blue text-white font-medium hover:bg-apple-blue-hover transition-colors"
                >
                    Adicionar Saída
                </button>
            </div>
            
             <div className="mb-6 bg-gray-50/70 rounded-2xl border border-border-color/50 p-4">
                 <p className="text-sm font-medium text-secondary-text">Total de Saídas ({filterMonth === 'all' ? 'Geral' : formatMonthLabel(filterMonth)})</p>
                 <p className="text-2xl font-bold text-apple-red">{formatCurrency(totalSaidas)}</p>
            </div>

            <div className="bg-gray-50/70 rounded-2xl border border-border-color/50 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="border-b border-border-color bg-white/50">
                        <tr>
                            <th className="p-4 font-semibold text-sm text-secondary-text">Data</th>
                            <th className="p-4 font-semibold text-sm text-secondary-text">Descrição</th>
                            <th className="p-4 font-semibold text-sm text-secondary-text">Categoria</th>
                            <th className="p-4 font-semibold text-sm text-secondary-text">Valor</th>
                            <th className="p-4 font-semibold text-sm text-secondary-text">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredSaidas.map((saida, index) => {
                            const currentMonth = saida.data.slice(0, 7);
                            const prevMonth = index > 0 ? filteredSaidas[index - 1].data.slice(0, 7) : null;
                            const showSeparator = filterMonth === 'all' && currentMonth !== prevMonth;

                            return (
                                <React.Fragment key={saida.id}>
                                    {showSeparator && (
                                        <tr>
                                            <td colSpan={5} className="py-2 px-4 bg-gray-100/80 text-xs font-bold text-secondary-text uppercase tracking-wider border-y border-border-color/50 sticky left-0">
                                                {formatMonthLabel(currentMonth)}
                                            </td>
                                        </tr>
                                    )}
                                    <tr className="border-b border-border-color/50 last:border-b-0 hover:bg-gray-100/50 transition-colors">
                                        <td className="p-4 text-sm text-primary-text">{new Date(saida.data + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                                        <td className="p-4 font-medium text-primary-text">{saida.descricao}</td>
                                        <td className="p-4 text-sm text-secondary-text">{saida.categoria}</td>
                                        <td className="p-4 text-sm font-semibold text-apple-red">{formatCurrency(saida.valor)}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => handleOpenModal(saida)} className="font-medium text-sm text-apple-blue hover:underline">Editar</button>
                                                <button onClick={() => deleteSaida(saida.id)} className="p-2 text-gray-400 hover:text-apple-red hover:bg-red-50 rounded-full transition-colors"><TrashIcon className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                </React.Fragment>
                            );
                        })}
                        {filteredSaidas.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-secondary-text">
                                    Nenhuma saída registrada para este período.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && currentSaida && (
                <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={currentSaida.id ? 'Editar Saída' : 'Adicionar Saída'}>
                    
                    {/* QUICK ADD SECTION (Only for New Entries) */}
                    {!currentSaida.id && expensePresets.length > 0 && (
                        <div className="mb-6 bg-blue-50/50 rounded-xl p-3 border border-blue-100">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-bold text-blue-800 uppercase tracking-wide">Atalhos Rápidos</p>
                                <span className="text-[10px] text-blue-400">Configure em Configurações</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {expensePresets.map(preset => (
                                    <button 
                                        key={preset.id}
                                        onClick={() => setCurrentSaida(prev => ({ 
                                            ...prev, 
                                            descricao: preset.description, 
                                            categoria: preset.category, 
                                            valor: preset.amount 
                                        }))}
                                        className="flex items-center gap-2 bg-white hover:bg-blue-50 border border-blue-100 hover:border-blue-200 rounded-lg p-2 transition-all shadow-sm text-left"
                                    >
                                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                            <span className="text-[10px] font-bold text-blue-600">{preset.name.substring(0, 1)}</span>
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="text-xs font-semibold text-primary-text truncate">{preset.name}</p>
                                            <p className="text-[10px] text-secondary-text truncate">{formatCurrency(preset.amount)}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSave} className="space-y-4">
                         <div>
                            <label className="block text-sm font-medium text-secondary-text mb-1">Descrição</label>
                            <input
                                type="text"
                                value={currentSaida.descricao || ''}
                                onChange={(e) => setCurrentSaida({ ...currentSaida, descricao: e.target.value })}
                                className="w-full px-3 py-2 border border-border-color rounded-lg bg-white focus:ring-2 focus:ring-apple-blue outline-none"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-secondary-text mb-1">Valor (R$)</label>
                                <input
                                    type="number"
                                    value={currentSaida.valor || ''}
                                    onChange={(e) => setCurrentSaida({ ...currentSaida, valor: parseFloat(e.target.value) || 0 })}
                                    className="w-full px-3 py-2 border border-border-color rounded-lg bg-white focus:ring-2 focus:ring-apple-blue outline-none"
                                    required
                                />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-secondary-text mb-1">Data</label>
                                <input
                                    type="date"
                                    value={currentSaida.data || ''}
                                    onChange={(e) => setCurrentSaida({ ...currentSaida, data: e.target.value })}
                                    className="w-full px-3 py-2 border border-border-color rounded-lg bg-white focus:ring-2 focus:ring-apple-blue outline-none"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary-text mb-1">Categoria</label>
                            <input
                                type="text"
                                value={currentSaida.categoria || ''}
                                onChange={(e) => setCurrentSaida({ ...currentSaida, categoria: e.target.value })}
                                className="w-full px-3 py-2 border border-border-color rounded-lg bg-white focus:ring-2 focus:ring-apple-blue outline-none"
                                placeholder="Ex: Equipamento, Marketing, Aluguel"
                                required
                            />
                        </div>
                        <div className="pt-4 flex justify-end gap-3">
                            <button type="button" onClick={handleCloseModal} className="rounded-full px-4 py-2 bg-white border border-gray-200 text-gray-700 font-medium hover:bg-gray-100 transition-colors">Cancelar</button>
                            <button type="submit" className="rounded-full px-5 py-2 bg-apple-blue text-white font-medium hover:bg-apple-blue-hover transition-colors">Salvar</button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};
