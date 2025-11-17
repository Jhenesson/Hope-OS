
import React, { useMemo, useState } from 'react';
import { MOCK_FINANCIAL_DATA } from '../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FinancialTransaction } from '../types';
import { Modal } from '../components/Modal';
import { TrashIcon } from '../components/icons/Icons';

interface StatCardProps {
    title: string;
    value: string;
    change?: string;
    changeType?: 'positive' | 'negative';
    icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, changeType, icon }) => {
    const changeColor = changeType === 'positive' ? 'text-apple-green' : 'text-apple-red';
    return (
        <div className="bg-white rounded-2xl border border-border-color shadow-sm p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between text-secondary-text">
                <span className="text-sm font-medium">{title}</span>
                {icon}
            </div>
            <div>
                <p className="text-3xl font-bold text-primary-text mt-2">{value}</p>
                {change && (
                    <p className={`text-sm mt-1 ${changeColor}`}>{change}</p>
                )}
            </div>
        </div>
    );
};

const IncomeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-apple-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
);

const ExpenseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-apple-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
    </svg>
);

const BalanceIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-apple-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 6h12l3-6H3zm18 12H3" />
    </svg>
);


export const FinancialPage: React.FC = () => {
    const [transactions, setTransactions] = useState<FinancialTransaction[]>(MOCK_FINANCIAL_DATA);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newTransaction, setNewTransaction] = useState<Omit<FinancialTransaction, 'id'>>({
        description: '',
        amount: 0,
        type: 'income',
        date: new Date().toISOString().split('T')[0],
        category: '',
    });

    const monthlyData = useMemo(() => {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        return transactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
        });
    }, [transactions]);

    const totalIncome = useMemo(() => monthlyData.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0), [monthlyData]);
    const totalExpense = useMemo(() => monthlyData.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0), [monthlyData]);
    const balance = totalIncome - totalExpense;

    const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    const chartData = [
        { name: 'Este Mês', Receita: totalIncome, Despesas: totalExpense }
    ];

    const handleAddInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const finalValue = type === 'number' ? parseFloat(value) : value;
        setNewTransaction(prev => ({ ...prev, [name]: finalValue as any }));
    };

    const handleAddNewTransaction = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTransaction.description || newTransaction.amount <= 0 || !newTransaction.category) return;
        
        const transactionToAdd: FinancialTransaction = {
            id: `fin-${Date.now()}`,
            ...newTransaction,
        };
        setTransactions(prev => [transactionToAdd, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        setIsAddModalOpen(false);
        setNewTransaction({
            description: '',
            amount: 0,
            type: 'income',
            date: new Date().toISOString().split('T')[0],
            category: '',
        });
    };

    const handleDeleteTransaction = (id: string) => {
        setTransactions(prev => prev.filter(t => t.id !== id));
    };

    return (
        <div className="h-full flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-primary-text">Financeiro</h2>
                <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="rounded-full px-5 py-2 bg-apple-blue text-white font-medium hover:bg-apple-blue-hover transition-colors">
                    Adicionar Transação
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Receita no Mês" value={formatCurrency(totalIncome)} icon={<IncomeIcon />} change="+5.2% vs mês passado" changeType="positive"/>
                <StatCard title="Saídas no Mês" value={formatCurrency(totalExpense)} icon={<ExpenseIcon />} change="+1.8% vs mês passado" changeType="negative" />
                <StatCard title="Balanço" value={formatCurrency(balance)} icon={<BalanceIcon />} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-border-color shadow-sm p-6 min-h-[300px] flex flex-col">
                    <h3 className="text-lg font-semibold text-primary-text mb-4">Visão Geral</h3>
                    <div className="flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#6B7280' }} />
                                <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => formatCurrency(value as number)} tick={{ fill: '#6B7280' }} />
                                <Tooltip contentStyle={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: '0.5rem' }} formatter={(value) => formatCurrency(value as number)} />
                                <Legend wrapperStyle={{ color: '#6B7280' }} />
                                <Bar dataKey="Receita" fill="#34C759" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Despesas" fill="#FF3B30" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-border-color shadow-sm overflow-hidden">
                    <h3 className="text-lg font-semibold text-primary-text p-6 pb-2">Histórico de Transações</h3>
                    <div className="overflow-x-auto max-h-[350px]">
                        <table className="w-full text-left">
                            <thead className="border-b border-border-color bg-white/80 backdrop-blur-sm sticky top-0">
                                <tr>
                                    <th className="p-4 font-semibold text-sm text-secondary-text">Descrição</th>
                                    <th className="p-4 font-semibold text-sm text-secondary-text">Valor</th>
                                    <th className="p-4 font-semibold text-sm text-secondary-text">Data</th>
                                    <th className="p-4 font-semibold text-sm text-secondary-text">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map(transaction => (
                                    <tr key={transaction.id} className="border-b border-border-color last:border-b-0 hover:bg-gray-50/30 transition-colors">
                                        <td className="p-4">
                                            <p className="font-medium text-primary-text">{transaction.description}</p>
                                            <p className="text-xs text-secondary-text">{transaction.category}</p>
                                        </td>
                                        <td className={`p-4 font-medium ${transaction.type === 'income' ? 'text-apple-green' : 'text-apple-red'}`}>
                                            {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
                                        </td>
                                        <td className="p-4 text-sm text-secondary-text">{new Date(transaction.date + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                                        <td className="p-4">
                                            <button 
                                                onClick={() => handleDeleteTransaction(transaction.id)}
                                                className="p-2 text-gray-400 hover:text-apple-red hover:bg-red-50 rounded-full transition-colors"
                                                aria-label="Deletar transação"
                                            >
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {isAddModalOpen && (
                <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Adicionar Nova Transação">
                    <form onSubmit={handleAddNewTransaction} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-secondary-text mb-1">Tipo de Transação</label>
                            <div className="flex gap-4">
                                <label className="flex items-center">
                                    <input type="radio" name="type" value="income" checked={newTransaction.type === 'income'} onChange={handleAddInputChange} className="h-4 w-4 text-apple-green focus:ring-apple-green border-gray-300" />
                                    <span className="ml-2 text-sm text-primary-text">Receita</span>
                                </label>
                                <label className="flex items-center">
                                    <input type="radio" name="type" value="expense" checked={newTransaction.type === 'expense'} onChange={handleAddInputChange} className="h-4 w-4 text-apple-red focus:ring-apple-red border-gray-300" />
                                    <span className="ml-2 text-sm text-primary-text">Despesa</span>
                                </label>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-secondary-text mb-1">Descrição</label>
                            <input type="text" name="description" id="description" value={newTransaction.description} onChange={handleAddInputChange} className="w-full px-3 py-2 border border-border-color rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-apple-blue transition-shadow" required />
                        </div>
                        <div>
                            <label htmlFor="amount" className="block text-sm font-medium text-secondary-text mb-1">Valor (R$)</label>
                            <input type="number" name="amount" id="amount" value={newTransaction.amount === 0 ? '' : newTransaction.amount} onChange={handleAddInputChange} min="0.01" step="0.01" className="w-full px-3 py-2 border border-border-color rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-apple-blue transition-shadow" required />
                        </div>
                         <div>
                            <label htmlFor="category" className="block text-sm font-medium text-secondary-text mb-1">Categoria</label>
                            <input type="text" name="category" id="category" value={newTransaction.category} onChange={handleAddInputChange} className="w-full px-3 py-2 border border-border-color rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-apple-blue transition-shadow" required />
                        </div>
                        <div>
                            <label htmlFor="date" className="block text-sm font-medium text-secondary-text mb-1">Data</label>
                            <input type="date" name="date" id="date" value={newTransaction.date} onChange={handleAddInputChange} className="w-full px-3 py-2 border border-border-color rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-apple-blue transition-shadow" required />
                        </div>
                        <div className="pt-4 flex justify-end gap-3">
                            <button type="button" onClick={() => setIsAddModalOpen(false)} className="rounded-full px-4 py-2 bg-white border border-gray-200 text-gray-700 font-medium hover:bg-gray-100 transition-colors">Cancelar</button>
                            <button type="submit" className="rounded-full px-5 py-2 bg-apple-blue text-white font-medium hover:bg-apple-blue-hover transition-colors">Salvar Transação</button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};
