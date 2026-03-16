
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useFinanceData } from '../context/FinanceDataContext';
import { LancamentoFinanceiro, StatusPagamento } from '../../../types';
import { Modal } from '../../../components/Modal';
import { TrashIcon } from '../../../components/icons/Icons';

const statusColors: { [key in StatusPagamento]: string } = {
    [StatusPagamento.AReceber]: 'bg-yellow-100 text-yellow-800',
    [StatusPagamento.Pago]: 'bg-green-100 text-green-800',
    [StatusPagamento.Parcial]: 'bg-blue-100 text-blue-800',
    [StatusPagamento.Cancelado]: 'bg-red-100 text-red-800',
};

// Payment condition options for the dropdown
const PAYMENT_CONDITIONS = [
    { label: 'Pendente (0%)', value: 0, status: StatusPagamento.AReceber },
    { label: 'Entrada 25%', value: 0.25, status: StatusPagamento.Parcial },
    { label: 'Entrada 50%', value: 0.50, status: StatusPagamento.Parcial },
    { label: 'Entrada 75%', value: 0.75, status: StatusPagamento.Parcial },
    { label: 'Pagamento Integral (100%)', value: 1, status: StatusPagamento.Pago },
];

// Types of individual payments
const PAYMENT_TYPES = [
    'Entrada 25%',
    'Entrada 50%',
    'Integral',
    'Parcial',
    'Restante'
];

const ChevronDownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
);

export const LancamentosPage: React.FC = () => {
    const { lancamentos, updateLancamento, deleteLancamento, addLancamento, clients, products } = useFinanceData();
    
    // State for Edit/Delete/Payment Registration
    const [selectedLancamento, setSelectedLancamento] = useState<LancamentoFinanceiro | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // State for Adding new Payment inside the Modal
    const [newPaymentDate, setNewPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [newPaymentValue, setNewPaymentValue] = useState<number>(0);
    const [newPaymentType, setNewPaymentType] = useState<string>('Parcial');

    // State for Adding New Launch (Manual)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [paymentCondition, setPaymentCondition] = useState(PAYMENT_CONDITIONS[0].label); // Default to Pendente
    
    // Client Search / Combobox State
    const [clientSearchTerm, setClientSearchTerm] = useState(''); 
    const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Sorting State
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'dataPrevista', direction: 'desc' });

    // Filter State
    const [filterMonth, setFilterMonth] = useState<string>('all');


    const initialNewLancamentoState = {
        clienteId: '',
        produtoId: '',
        dataPrevista: new Date().toISOString().split('T')[0],
        valorPrevisto: 0,
        valorRecebido: 0,
        statusPagamento: StatusPagamento.AReceber,
        observacoes: ''
    };
    const [newLancamento, setNewLancamento] = useState(initialNewLancamentoState);

    const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    // --- Helper: Get Available Months ---
    const availableMonths = useMemo(() => {
        const months = new Set<string>();
        months.add(new Date().toISOString().slice(0, 7)); 
        
        lancamentos.forEach(l => {
            if (l.dataPrevista) {
                months.add(l.dataPrevista.slice(0, 7));
            }
        });
        return Array.from(months).sort().reverse();
    }, [lancamentos]);

    const formatMonthLabel = (monthStr: string) => {
        const [year, month] = monthStr.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        return date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase());
    };


    // --- Effect: Recalculate Total based on Product and Quantity ---
    useEffect(() => {
        if (isAddModalOpen && newLancamento.produtoId) {
            const product = products.find(p => p.id === newLancamento.produtoId);
            if (product) {
                let unitPrice = 0;
                if (product.id === 'prod-1' || product.name.toLowerCase().includes('vídeo acústico')) {
                    unitPrice = quantity >= 2 ? 250 : 350;
                } else {
                    const cleaned = product.price.replace('R$', '').replace(/\./g, '').replace(',', '.').split('/')[0].trim();
                    unitPrice = parseFloat(cleaned) || 0;
                }
                const total = unitPrice * quantity;
                setNewLancamento(prev => ({ ...prev, valorPrevisto: total }));
            }
        }
    }, [newLancamento.produtoId, quantity, isAddModalOpen, products]);

    // --- Effect: Recalculate Valor Recebido based on Payment Condition ---
    useEffect(() => {
        if (isAddModalOpen) {
            const condition = PAYMENT_CONDITIONS.find(c => c.label === paymentCondition);
            if (condition) {
                const received = newLancamento.valorPrevisto * condition.value;
                setNewLancamento(prev => ({ 
                    ...prev, 
                    valorRecebido: received,
                    statusPagamento: condition.status 
                }));
            }
        }
    }, [paymentCondition, newLancamento.valorPrevisto, isAddModalOpen]);

    // --- Effect: Auto-calculate payment value when type changes ---
    useEffect(() => {
        if (selectedLancamento) {
            const total = selectedLancamento.valorPrevisto;
            const paid = selectedLancamento.valorRecebido;
            const remaining = total - paid;

            if (newPaymentType === 'Entrada 25%') {
                setNewPaymentValue(total * 0.25);
            } else if (newPaymentType === 'Entrada 50%') {
                setNewPaymentValue(total * 0.50);
            } else if (newPaymentType === 'Integral') {
                setNewPaymentValue(total);
            } else if (newPaymentType === 'Restante') {
                setNewPaymentValue(remaining > 0 ? remaining : 0);
            } 
        }
    }, [newPaymentType, selectedLancamento]);

    const filteredClients = useMemo(() => {
        if (!clientSearchTerm) return clients;
        return clients.filter(c => c.name.toLowerCase().includes(clientSearchTerm.toLowerCase()));
    }, [clients, clientSearchTerm]);


    // Filtering and Sorting Logic
    const sortedLancamentos = useMemo(() => {
        let filtered = [...lancamentos];

        if (filterMonth !== 'all') {
            filtered = filtered.filter(l => l.dataPrevista.startsWith(filterMonth));
        }

        if (sortConfig !== null) {
            filtered.sort((a, b) => {
                let aValue: any;
                let bValue: any;

                switch (sortConfig.key) {
                    case 'dataPrevista':
                        aValue = new Date(a.dataPrevista).getTime();
                        bValue = new Date(b.dataPrevista).getTime();
                        break;
                    case 'createdAt':
                        aValue = new Date(a.createdAt).getTime();
                        bValue = new Date(b.createdAt).getTime();
                        break;
                    case 'cliente':
                        aValue = a.client?.name || '';
                        bValue = b.client?.name || '';
                        break;
                    case 'produto':
                        aValue = a.product?.name || '';
                        bValue = b.product?.name || '';
                        break;
                    case 'valorPrevisto':
                        aValue = a.valorPrevisto;
                        bValue = b.valorPrevisto;
                        break;
                    case 'valorRecebido':
                        aValue = a.valorRecebido;
                        bValue = b.valorRecebido;
                        break;
                    case 'valorRestante':
                        aValue = a.valorPrevisto - a.valorRecebido;
                        bValue = b.valorPrevisto - b.valorRecebido;
                        break;
                     case 'status':
                        aValue = a.statusPagamento;
                        bValue = b.statusPagamento;
                        break;
                    default:
                        return 0;
                }

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return filtered;
    }, [lancamentos, sortConfig, filterMonth]);

    const requestSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };
    
    const getSortIcon = (name: string) => {
        if (sortConfig.key !== name) return <span className="text-gray-300 ml-1 text-xs">↕</span>;
        return sortConfig.direction === 'asc' ? <span className="ml-1 text-xs">↑</span> : <span className="ml-1 text-xs">↓</span>;
    };


    const handleOpenModal = (lanc: LancamentoFinanceiro) => {
        setSelectedLancamento(lanc);
        setIsDeleting(false);
        setNewPaymentValue(0);
        setNewPaymentType('Parcial');
        setNewPaymentDate(new Date().toISOString().split('T')[0]);
    };

    const handleCloseModal = () => {
        setSelectedLancamento(null);
        setIsDeleting(false);
        setIsAddModalOpen(false);
        setNewLancamento(initialNewLancamentoState);
        setQuantity(1);
        setPaymentCondition(PAYMENT_CONDITIONS[0].label);
        setClientSearchTerm('');
        setIsClientDropdownOpen(false);
    };

    const handleAddPayment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedLancamento || newPaymentValue <= 0) return;

        const updatedRecebido = selectedLancamento.valorRecebido + newPaymentValue;
        
        let newStatus = selectedLancamento.statusPagamento;
        if (updatedRecebido >= selectedLancamento.valorPrevisto - 0.01) {
            newStatus = StatusPagamento.Pago;
        } else if (updatedRecebido > 0) {
            newStatus = StatusPagamento.Parcial;
        } else {
            newStatus = StatusPagamento.AReceber;
        }

        const newPaymentRecord = {
            id: `pay-${Date.now()}`,
            data: newPaymentDate,
            valor: newPaymentValue,
            tipo: newPaymentType
        };

        const updatedLancamento = {
            ...selectedLancamento,
            valorRecebido: updatedRecebido,
            statusPagamento: newStatus,
            datasPagamentos: [...(selectedLancamento.datasPagamentos || []), newPaymentRecord]
        };

        updateLancamento(updatedLancamento);
        setSelectedLancamento(updatedLancamento); 
        setNewPaymentValue(0); 
    };


    const handleAddLancamento = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newLancamento.clienteId || !newLancamento.produtoId) return;

        const initialPaymentHistory = newLancamento.valorRecebido > 0 ? [{
            id: `pay-init-${Date.now()}`,
            data: newLancamento.dataPrevista,
            valor: newLancamento.valorRecebido,
            tipo: paymentCondition
        }] : [];

        addLancamento({
            gravacaoId: `manual-${Date.now()}`,
            produtoId: newLancamento.produtoId,
            clienteId: newLancamento.clienteId,
            valorPrevisto: newLancamento.valorPrevisto,
            valorRecebido: newLancamento.valorRecebido,
            statusPagamento: newLancamento.statusPagamento,
            dataPrevista: newLancamento.dataPrevista,
            datasPagamentos: initialPaymentHistory,
            observacoes: newLancamento.observacoes,
        });
        handleCloseModal();
    };

    const handleConfirmDelete = () => {
        if (selectedLancamento) {
            deleteLancamento(selectedLancamento.id);
            handleCloseModal();
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsClientDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const todayStr = new Date().toISOString().split('T')[0];

    return (
        <div className="p-1">
            <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <h1 className="text-3xl font-bold text-primary-text whitespace-nowrap">Lançamentos</h1>
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
                    onClick={() => setIsAddModalOpen(true)}
                    className="w-full md:w-auto rounded-full px-5 py-2 bg-apple-blue text-white font-medium hover:bg-apple-blue-hover transition-colors"
                >
                    Adicionar Lançamento
                </button>
            </div>

            <div className="bg-gray-50/70 rounded-2xl border border-border-color/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b border-border-color bg-white/50">
                            <tr>
                                <th className="p-4 font-semibold text-sm text-secondary-text cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => requestSort('dataPrevista')}>
                                    Vencimento {getSortIcon('dataPrevista')}
                                </th>
                                <th className="p-4 font-semibold text-sm text-secondary-text cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => requestSort('createdAt')}>
                                    Data Lançamento {getSortIcon('createdAt')}
                                </th>
                                <th className="p-4 font-semibold text-sm text-secondary-text cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => requestSort('cliente')}>
                                    Cliente {getSortIcon('cliente')}
                                </th>
                                <th className="p-4 font-semibold text-sm text-secondary-text cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => requestSort('produto')}>
                                    Produto {getSortIcon('produto')}
                                </th>
                                <th className="p-4 font-semibold text-sm text-secondary-text cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => requestSort('valorPrevisto')}>
                                    Valor Total {getSortIcon('valorPrevisto')}
                                </th>
                                <th className="p-4 font-semibold text-sm text-secondary-text cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => requestSort('valorRecebido')}>
                                    Recebido {getSortIcon('valorRecebido')}
                                </th>
                                <th className="p-4 font-semibold text-sm text-secondary-text cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => requestSort('valorRestante')}>
                                    Pendente {getSortIcon('valorRestante')}
                                </th>
                                <th className="p-4 font-semibold text-sm text-secondary-text cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => requestSort('status')}>
                                    Status {getSortIcon('status')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedLancamentos.map((lanc, index) => {
                                const valorRestante = lanc.valorPrevisto - lanc.valorRecebido;
                                const currentMonth = lanc.dataPrevista.slice(0, 7);
                                const prevMonth = index > 0 ? sortedLancamentos[index - 1].dataPrevista.slice(0, 7) : null;
                                const showSeparator = filterMonth === 'all' && sortConfig.key === 'dataPrevista' && currentMonth !== prevMonth;

                                const isPaid = valorRestante <= 0.01;
                                const isRecebidoZero = lanc.valorRecebido <= 0.01;
                                
                                // Lógica de atraso coerente com o Dashboard
                                const isOverdue = !isPaid && lanc.dataPrevista < todayStr;
                                const isUrgent = !isPaid && (lanc.dataPrevista === todayStr);

                                return (
                                    <React.Fragment key={lanc.id}>
                                        {showSeparator && (
                                            (() => {
                                                const monthItems = sortedLancamentos.filter(i => i.dataPrevista.slice(0, 7) === currentMonth);
                                                const sumPrevisto = monthItems.reduce((acc, curr) => acc + curr.valorPrevisto, 0);
                                                const sumRecebido = monthItems.reduce((acc, curr) => acc + curr.valorRecebido, 0);
                                                const sumRestante = sumPrevisto - sumRecebido;
                                                const isSumPaid = sumRestante <= 0.01;

                                                return (
                                                    <tr className="bg-gray-100 border-y-2 border-gray-200">
                                                        <td colSpan={4} className="py-4 px-4 text-base font-bold text-gray-800 uppercase tracking-wider sticky left-0">
                                                            {formatMonthLabel(currentMonth)}
                                                        </td>
                                                        <td className="py-4 px-4 text-base font-bold text-primary-text">
                                                            {formatCurrency(sumPrevisto)}
                                                        </td>
                                                        <td className={`py-4 px-4 text-base font-bold text-apple-green`}>
                                                            {formatCurrency(sumRecebido)}
                                                        </td>
                                                        <td className={`py-4 px-4 text-base font-bold ${isSumPaid ? 'text-gray-400' : 'text-apple-red'}`}>
                                                            {formatCurrency(sumRestante)}
                                                        </td>
                                                        <td className="py-4 px-4"></td>
                                                    </tr>
                                                );
                                            })()
                                        )}
                                        <tr
                                            className="border-b border-border-color/50 last:border-b-0 hover:bg-gray-100/50 transition-colors cursor-pointer"
                                            onClick={() => handleOpenModal(lanc)}
                                        >
                                            <td className="p-4 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <span className={`font-medium ${isOverdue ? 'text-apple-red' : isUrgent ? 'text-apple-orange' : 'text-primary-text'}`}>
                                                        {new Date(lanc.dataPrevista + 'T12:00:00').toLocaleDateString('pt-BR')}
                                                    </span>
                                                    {isOverdue && <span className="text-[9px] font-black uppercase text-white bg-apple-red px-1.5 py-0.5 rounded shadow-sm">Vencido</span>}
                                                    {isUrgent && <span className="text-[9px] font-black uppercase text-white bg-apple-orange px-1.5 py-0.5 rounded shadow-sm">Hoje</span>}
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm text-secondary-text">{new Date(lanc.createdAt).toLocaleDateString('pt-BR')}</td>
                                            <td className="p-4 font-medium text-primary-text">{lanc.client?.name || '...'}</td>
                                            <td className="p-4 text-sm text-secondary-text">{lanc.product?.name || '...'}</td>
                                            <td className="p-4 text-sm font-semibold text-primary-text">{formatCurrency(lanc.valorPrevisto)}</td>
                                            <td className={`p-4 text-sm font-semibold ${isRecebidoZero ? 'text-gray-400' : 'text-apple-green'}`}>{formatCurrency(lanc.valorRecebido)}</td>
                                            <td className={`p-4 text-sm font-semibold ${isPaid ? 'text-gray-400' : 'text-apple-red'}`}>{formatCurrency(valorRestante)}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[lanc.statusPagamento]}`}>
                                                    {lanc.statusPagamento}
                                                </span>
                                            </td>
                                        </tr>
                                    </React.Fragment>
                                );
                            })}
                            {sortedLancamentos.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-secondary-text">
                                        Nenhum lançamento encontrado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* REGISTER PAYMENT MODAL */}
            {selectedLancamento && (
                <Modal isOpen={!!selectedLancamento} onClose={handleCloseModal} title={isDeleting ? 'Confirmar Exclusão' : `Recebimentos: ${selectedLancamento.client?.name}`} headerClassName="bg-gray-50">
                    {isDeleting ? (
                        <div className="text-center space-y-6">
                            <p className="text-secondary-text">Deseja excluir o lançamento de <strong className="text-primary-text">{selectedLancamento.client?.name}</strong>?</p>
                            <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100">
                                ⚠️ Atenção: Se este lançamento estiver vinculado a uma gravação, ela será marcada como <strong>Cancelada</strong>.
                            </p>
                            <div className="flex justify-center gap-4">
                                <button onClick={() => setIsDeleting(false)} className="rounded-full px-6 py-2 border border-gray-200 text-gray-700 font-bold">Cancelar</button>
                                <button onClick={handleConfirmDelete} className="rounded-full px-6 py-2 bg-apple-red text-white font-bold">Confirmar Exclusão</button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-4 rounded-xl border border-border-color/60">
                                    <p className="text-[10px] text-secondary-text uppercase font-bold">Valor Total</p>
                                    <p className="text-lg font-black text-primary-text">{formatCurrency(selectedLancamento.valorPrevisto)}</p>
                                </div>
                                <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                                    <p className="text-[10px] text-green-800 uppercase font-bold">Total Pago</p>
                                    <p className="text-lg font-black text-green-700">{formatCurrency(selectedLancamento.valorRecebido)}</p>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-xs font-bold text-secondary-text uppercase mb-2">Histórico de Pagamentos</h4>
                                {selectedLancamento.datasPagamentos && selectedLancamento.datasPagamentos.length > 0 ? (
                                    <div className="bg-white border border-border-color rounded-xl overflow-hidden">
                                        <table className="w-full text-xs text-left">
                                            <thead className="bg-gray-50 border-b">
                                                <tr>
                                                    <th className="p-2 text-secondary-text">Data</th>
                                                    <th className="p-2 text-secondary-text">Tipo</th>
                                                    <th className="p-2 text-secondary-text text-right">Valor</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {selectedLancamento.datasPagamentos.map((pay, idx) => (
                                                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                        <td className="p-2">{new Date(pay.data + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                                                        <td className="p-2 text-gray-600 font-medium">{pay.tipo || '-'}</td>
                                                        <td className="p-2 text-right font-black text-green-700">{formatCurrency(pay.valor)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-400 italic bg-gray-50 p-4 rounded-xl border border-dashed text-center">Nenhum pagamento registrado.</p>
                                )}
                            </div>

                            <div className="bg-gray-50 p-4 rounded-2xl border border-border-color/60">
                                <h4 className="text-xs font-bold text-primary-text uppercase mb-3">Adicionar Pagamento</h4>
                                <form onSubmit={handleAddPayment} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[10px] font-black text-secondary-text uppercase mb-1">Data</label>
                                            <input type="date" value={newPaymentDate} onChange={(e) => setNewPaymentDate(e.target.value)} className="w-full px-3 py-2 text-sm border border-border-color rounded-lg focus:ring-2 focus:ring-apple-blue outline-none" required />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-secondary-text uppercase mb-1">Tipo</label>
                                            <select value={newPaymentType} onChange={(e) => setNewPaymentType(e.target.value)} className="w-full px-3 py-2 text-sm border border-border-color rounded-lg bg-white outline-none">
                                                {PAYMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 items-end">
                                        <div className="flex-1">
                                            <label className="block text-[10px] font-black text-secondary-text uppercase mb-1">Valor (R$)</label>
                                            <input type="number" value={newPaymentValue || ''} onChange={(e) => setNewPaymentValue(parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 text-sm border border-border-color rounded-lg focus:ring-2 focus:ring-apple-blue outline-none" placeholder="0,00" step="0.01" min="0.01" required />
                                        </div>
                                        <button type="submit" className="bg-apple-blue hover:bg-apple-blue-hover text-white text-sm font-black px-6 py-2 rounded-lg transition-all shadow-sm">Registrar</button>
                                    </div>
                                </form>
                            </div>

                            <div className="flex justify-between items-center pt-2">
                                 <button type="button" onClick={() => setIsDeleting(true)} className="p-2 text-gray-400 hover:text-apple-red hover:bg-red-50 rounded-full transition-colors"><TrashIcon className="w-5 h-5" /></button>
                                <button type="button" onClick={handleCloseModal} className="text-sm text-gray-500 hover:text-primary-text font-bold">Fechar</button>
                            </div>
                        </div>
                    )}
                </Modal>
            )}

            {/* ADD NEW LAUNCH MODAL */}
            {isAddModalOpen && (
                <Modal isOpen={isAddModalOpen} onClose={handleCloseModal} title="Novo Lançamento" headerClassName="bg-blue-50">
                    <form onSubmit={handleAddLancamento} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-secondary-text mb-1">Serviço</label>
                                <select value={newLancamento.produtoId} onChange={(e) => setNewLancamento({ ...newLancamento, produtoId: e.target.value })} className="w-full px-3 py-2 border border-border-color rounded-lg bg-white outline-none focus:ring-2 focus:ring-apple-blue" required>
                                    <option value="" disabled>Escolha...</option>
                                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>

                            <div className="md:col-span-2 relative" ref={dropdownRef}>
                                <label className="block text-sm font-bold text-secondary-text mb-1">Cliente</label>
                                <div className="relative">
                                    <input type="text" className="w-full px-3 py-2 border border-border-color rounded-lg bg-white outline-none pr-10 focus:ring-2 focus:ring-apple-blue" placeholder="Busque o cliente..." value={clientSearchTerm} onChange={(e) => { setClientSearchTerm(e.target.value); if (newLancamento.clienteId && e.target.value !== clients.find(c => c.id === newLancamento.clienteId)?.name) { setNewLancamento({ ...newLancamento, clienteId: '' }); } setIsClientDropdownOpen(true); }} onFocus={() => setIsClientDropdownOpen(true)} autoComplete="off" required={!newLancamento.clienteId} />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400" onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}><ChevronDownIcon /></div>
                                </div>
                                {isClientDropdownOpen && (
                                    <div className="absolute z-50 w-full mt-1 bg-white border border-border-color rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                        {filteredClients.length > 0 ? (
                                            filteredClients.map(c => (
                                                <div key={c.id} className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm text-primary-text border-b border-gray-50 last:border-0 flex justify-between items-center font-medium" onMouseDown={(e) => { e.preventDefault(); setNewLancamento({ ...newLancamento, clienteId: c.id }); setClientSearchTerm(c.name); setIsClientDropdownOpen(false); }}>
                                                    <span>{c.name}</span>
                                                    {c.id === newLancamento.clienteId && <span className="text-apple-blue text-xs font-bold">✓</span>}
                                                </div>
                                            ))
                                        ) : ( <div className="px-4 py-3 text-sm text-gray-400 text-center">Nenhum encontrado.</div> )}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-secondary-text mb-1">Vencimento</label>
                                <input type="date" value={newLancamento.dataPrevista} onChange={(e) => setNewLancamento({ ...newLancamento, dataPrevista: e.target.value })} className="w-full px-3 py-2 border border-border-color rounded-lg bg-white outline-none focus:ring-2 focus:ring-apple-blue" required />
                            </div>

                             <div>
                                <label className="block text-sm font-bold text-secondary-text mb-1">Quantidade</label>
                                <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value) || 1)} className="w-full px-3 py-2 border border-border-color rounded-lg bg-white outline-none" required />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-secondary-text mb-1">Valor Total (R$)</label>
                                <input type="number" value={newLancamento.valorPrevisto || ''} onChange={(e) => setNewLancamento({ ...newLancamento, valorPrevisto: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-border-color rounded-lg bg-white outline-none focus:ring-2 focus:ring-apple-blue" required />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-bold text-secondary-text mb-1">Pagamento Inicial</label>
                                <select value={paymentCondition} onChange={(e) => setPaymentCondition(e.target.value)} className="w-full px-3 py-2 border border-border-color rounded-lg bg-white outline-none">
                                    {PAYMENT_CONDITIONS.map(cond => <option key={cond.label} value={cond.label}>{cond.label}</option>)}
                                </select>
                            </div>
                        </div>
                       
                        <div className="pt-4 flex justify-end gap-3">
                            <button type="button" onClick={handleCloseModal} className="rounded-full px-5 py-2 font-bold text-secondary-text transition-colors">Cancelar</button>
                            <button type="submit" className="rounded-full px-8 py-2 bg-apple-blue text-white font-black shadow-md hover:bg-apple-blue-hover transition-colors">Salvar Lançamento</button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};
