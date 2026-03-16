
import React, { useState, useMemo, useEffect } from 'react';
import { useFinanceData } from '../context/FinanceDataContext';
import { SaidaFinanceira } from '../../../types';
import { Modal } from '../../../components/Modal';
import { TrashIcon, UserPlusIcon, CalendarIcon, CheckIcon } from '../../../components/icons/Icons';

type SaidasTab = 'list' | 'recurring';

export const SaidasPage: React.FC = () => {
    const { saidas, addSaida, updateSaida, deleteSaida, expensePresets } = useFinanceData();
    const [activeTab, setActiveTab] = useState<SaidasTab>('list');
    
    // --- STATES FOR LIST VIEW ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentSaida, setCurrentSaida] = useState<Partial<SaidaFinanceira> | null>(null);
    const currentMonthStr = new Date().toISOString().slice(0, 7); // YYYY-MM
    const [filterMonth, setFilterMonth] = useState<string>(currentMonthStr);

    // --- STATES FOR RECURRING VIEW ---
    const [selectedPresetId, setSelectedPresetId] = useState<string>('');
    const [calendarDate, setCalendarDate] = useState(new Date());

    // Initialize selected preset if available
    useEffect(() => {
        if (!selectedPresetId && expensePresets && expensePresets.length > 0) {
            setSelectedPresetId(expensePresets[0].id);
        }
    }, [expensePresets, selectedPresetId]);

    const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    
    // --- Helper: Get Available Months for List Filter ---
    const availableMonths = useMemo(() => {
        const months = new Set<string>();
        months.add(new Date().toISOString().slice(0, 7));

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

    // --- List View Logic ---
    const filteredSaidas = useMemo(() => {
        let result = [...saidas];
        if (filterMonth !== 'all') {
            result = result.filter(s => s.data.startsWith(filterMonth));
        }
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

    // --- Recurring/Calendar Logic ---
    const safePresets = expensePresets || [];
    const selectedPreset = useMemo(() => safePresets.find(p => p.id === selectedPresetId), [safePresets, selectedPresetId]);

    const daysInMonth = useMemo(() => {
        const year = calendarDate.getFullYear();
        const month = calendarDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const days = [];
        for (let i = 0; i < firstDay.getDay(); i++) { days.push(null); }
        for (let i = 1; i <= lastDay.getDate(); i++) { days.push(new Date(year, month, i)); }
        return days;
    }, [calendarDate]);

    // Identify days in the current calendar month that match the selected preset (Same Description and Amount)
    const markedDays = useMemo(() => {
        if (!selectedPreset) return {};
        const year = calendarDate.getFullYear();
        const month = calendarDate.getMonth();
        
        const map: Record<number, string> = {}; // Day -> Saida ID

        saidas.forEach(s => {
            const sDate = new Date(s.data + 'T12:00:00');
            // Match Description AND Amount AND Month/Year
            if (
                sDate.getFullYear() === year &&
                sDate.getMonth() === month &&
                s.descricao === selectedPreset.description && 
                s.valor === selectedPreset.amount
            ) {
                map[sDate.getDate()] = s.id;
            }
        });
        return map;
    }, [saidas, calendarDate, selectedPreset]);

    const totalRecurringMonth = Object.keys(markedDays).length * (selectedPreset?.amount || 0);

    const toggleDay = (day: number) => {
        if (!selectedPreset) return;
        
        const existingId = markedDays[day];
        
        if (existingId) {
            // Remove
            deleteSaida(existingId);
        } else {
            // Add
            const year = calendarDate.getFullYear();
            const month = calendarDate.getMonth() + 1;
            const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            
            addSaida({
                descricao: selectedPreset.description,
                categoria: selectedPreset.category,
                valor: selectedPreset.amount,
                data: dateStr
            });
        }
    };

    return (
        <div className="p-1 h-full flex flex-col">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
                <h1 className="text-3xl font-bold text-primary-text">Gestão de Saídas</h1>
                
                {/* Tab Switcher */}
                <div className="flex bg-gray-100 p-1 rounded-full">
                    <button
                        onClick={() => setActiveTab('list')}
                        className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                            activeTab === 'list'
                                ? 'bg-white text-primary-text shadow-sm'
                                : 'text-secondary-text hover:text-primary-text'
                        }`}
                    >
                        Histórico Geral
                    </button>
                    <button
                        onClick={() => setActiveTab('recurring')}
                        className={`px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                            activeTab === 'recurring'
                                ? 'bg-white text-primary-text shadow-sm'
                                : 'text-secondary-text hover:text-primary-text'
                        }`}
                    >
                        <UserPlusIcon className="w-4 h-4" />
                        Gastos Recorrentes
                    </button>
                </div>
            </div>

            {/* --- TAB: LIST VIEW --- */}
            {activeTab === 'list' && (
                <div className="animate-fadeIn flex flex-col h-full">
                    <div className="flex justify-between items-center mb-4">
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
                        <button
                            onClick={() => handleOpenModal(null)}
                            className="rounded-full px-5 py-2 bg-apple-blue text-white font-medium hover:bg-apple-blue-hover transition-colors"
                        >
                            Adicionar Saída
                        </button>
                    </div>

                    <div className="mb-4 bg-gray-50/70 rounded-2xl border border-border-color/50 p-4">
                        <p className="text-sm font-medium text-secondary-text">Total de Saídas ({filterMonth === 'all' ? 'Geral' : formatMonthLabel(filterMonth)})</p>
                        <p className="text-2xl font-bold text-apple-red">{formatCurrency(totalSaidas)}</p>
                    </div>

                    <div className="flex-1 overflow-auto bg-gray-50/70 rounded-2xl border border-border-color/50">
                        <table className="w-full text-left">
                            <thead className="border-b border-border-color bg-white/50 sticky top-0 z-10">
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
                </div>
            )}

            {/* --- TAB: RECURRING / CALENDAR VIEW --- */}
            {activeTab === 'recurring' && (
                <div className="animate-fadeIn grid grid-cols-1 lg:grid-cols-3 gap-6 h-full overflow-hidden">
                    
                    {/* Sidebar Selection */}
                    <div className="lg:col-span-1 bg-white rounded-2xl border border-border-color shadow-sm p-6 flex flex-col">
                        <h3 className="text-lg font-bold text-primary-text mb-4">Selecione o Perfil</h3>
                        
                        {safePresets.length > 0 ? (
                            <div className="space-y-2 flex-1 overflow-y-auto pr-2">
                                {safePresets.map(preset => (
                                    <button
                                        key={preset.id}
                                        onClick={() => setSelectedPresetId(preset.id)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                                            selectedPresetId === preset.id 
                                            ? 'border-apple-blue bg-blue-50/50 shadow-sm' 
                                            : 'border-border-color bg-white hover:bg-gray-50'
                                        }`}
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${selectedPresetId === preset.id ? 'bg-apple-blue text-white' : 'bg-gray-100 text-gray-500'}`}>
                                            {preset.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className={`font-semibold ${selectedPresetId === preset.id ? 'text-apple-blue' : 'text-primary-text'}`}>{preset.name}</p>
                                            <p className="text-xs text-secondary-text">{preset.description}</p>
                                            <p className="text-xs font-medium mt-0.5 text-gray-900">{formatCurrency(preset.amount)} / dia</p>
                                        </div>
                                        {selectedPresetId === preset.id && (
                                            <div className="ml-auto text-apple-blue"><CheckIcon className="w-5 h-5" /></div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-secondary-text bg-gray-50 rounded-xl border border-dashed border-border-color">
                                <p className="text-sm">Nenhuma predefinição encontrada.</p>
                                <p className="text-xs mt-2">Cadastre em "Configurações" para usar esta funcionalidade.</p>
                            </div>
                        )}

                        {selectedPreset && (
                            <div className="mt-6 pt-6 border-t border-border-color">
                                <div className="bg-gray-50 p-4 rounded-xl border border-border-color">
                                    <p className="text-xs text-secondary-text uppercase font-semibold mb-2">Resumo do Mês</p>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm text-gray-600">Dias Marcados:</span>
                                        <span className="text-sm font-bold text-primary-text">{Object.keys(markedDays).length}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Total a Pagar:</span>
                                        <span className="text-lg font-bold text-apple-blue">{formatCurrency(totalRecurringMonth)}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Calendar Area */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-border-color shadow-sm p-6 flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <button onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                </button>
                                <h3 className="text-xl font-bold text-primary-text w-40 text-center select-none">
                                    {calendarDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase())}
                                </h3>
                                <button onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                </button>
                            </div>
                            
                            {selectedPreset && (
                                <div className="text-xs text-secondary-text bg-gray-100 px-3 py-1.5 rounded-full flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-apple-blue"></div>
                                    Marcando: <strong>{selectedPreset.name}</strong>
                                </div>
                            )}
                        </div>

                        {selectedPreset ? (
                            <div className="grid grid-cols-7 gap-2 flex-1">
                                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                                    <div key={day} className="text-center text-xs font-bold text-gray-400 py-2 uppercase">{day}</div>
                                ))}
                                {daysInMonth.map((day, index) => {
                                    if (!day) return <div key={`empty-${index}`} className="bg-transparent"></div>;
                                    
                                    const dayNum = day.getDate();
                                    const isMarked = !!markedDays[dayNum];
                                    const isToday = day.toDateString() === new Date().toDateString();

                                    return (
                                        <button
                                            key={index}
                                            onClick={() => toggleDay(dayNum)}
                                            className={`
                                                relative rounded-xl border transition-all flex flex-col items-center justify-center h-24
                                                ${isMarked 
                                                    ? 'bg-blue-50 border-apple-blue shadow-sm' 
                                                    : 'bg-white border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                                                }
                                            `}
                                        >
                                            <span className={`
                                                text-sm font-semibold mb-1
                                                ${isMarked ? 'text-apple-blue' : 'text-gray-700'}
                                                ${isToday && !isMarked ? 'bg-gray-200 rounded-full w-6 h-6 flex items-center justify-center' : ''}
                                            `}>
                                                {dayNum}
                                            </span>
                                            
                                            {isMarked && (
                                                <div className="flex flex-col items-center animate-scaleIn">
                                                    <div className="w-8 h-8 rounded-full bg-apple-blue text-white flex items-center justify-center mb-1 shadow-sm">
                                                        <CheckIcon className="w-5 h-5" />
                                                    </div>
                                                    <span className="text-[10px] font-bold text-blue-700">{formatCurrency(selectedPreset.amount)}</span>
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-secondary-text opacity-60 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                                <CalendarIcon className="w-16 h-16 mb-4" />
                                <p>Selecione um perfil ao lado para gerenciar os dias.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* --- MODAL (List View Only) --- */}
            {isModalOpen && currentSaida && (
                <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={currentSaida.id ? 'Editar Saída' : 'Adicionar Saída'}>
                    
                    {/* QUICK ADD SECTION (Only for New Entries) */}
                    {!currentSaida.id && safePresets.length > 0 && (
                        <div className="mb-6 bg-blue-50/50 rounded-xl p-3 border border-blue-100">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-bold text-blue-800 uppercase tracking-wide">Atalhos Rápidos</p>
                                <span className="text-[10px] text-blue-400">Configure em Configurações</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {safePresets.map(preset => (
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
             <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scaleIn {
                    from { transform: scale(0.5); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
                .animate-scaleIn { animation: scaleIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
            `}</style>
        </div>
    );
};
