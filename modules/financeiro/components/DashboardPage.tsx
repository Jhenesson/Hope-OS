
import React, { useMemo, useState } from 'react';
import { useFinanceData } from '../context/FinanceDataContext';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { DollarSignIcon, CalendarIcon, RecordingsIcon, TrendingUpIcon, ClockIcon } from '../../../components/icons/Icons';
import { StatusPagamento } from '../../../types';
import { AbstractAvatar } from '../../../components/AbstractAvatar';

const ArrowUpCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16V8" /><path d="m8 12 4-4 4 4" /></svg>
);
const ArrowDownCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v8" /><path d="m8 12 4 4 4-4" /></svg>
);
const AlertCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
);

interface StatCardProps {
    title: string;
    value: string;
    icon: React.ReactNode;
    iconBg: string;
    subValue?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, iconBg, subValue }) => (
    <div className="bg-gray-50/70 rounded-2xl border border-border-color/50 p-6 flex flex-col justify-between transition-all hover:bg-white hover:shadow-sm">
        <div className="flex items-center justify-between text-secondary-text">
            <span className="text-[10px] font-bold uppercase tracking-widest">{title}</span>
            <div className={`p-2 rounded-xl ${iconBg}`}>
                {icon}
            </div>
        </div>
        <div>
            <p className="text-2xl font-bold text-primary-text mt-4 tracking-tight">{value}</p>
            {subValue && <p className="text-[10px] text-secondary-text mt-1 font-medium">{subValue}</p>}
        </div>
    </div>
);

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/95 backdrop-blur-xl p-4 rounded-2xl border border-border-color shadow-2xl z-50">
                <p className="font-bold text-primary-text mb-3 text-xs uppercase tracking-widest">{label}</p>
                {payload.map((pld: any, index: number) => (
                    <div key={index} className="flex items-center gap-3 mb-2 last:mb-0">
                        <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: pld.fill }}></div>
                        <span className="text-xs font-medium text-secondary-text">{pld.name}:</span>
                        <span className="text-sm font-bold text-primary-text ml-auto">{formatCurrency(Number(pld.value))}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

const CHART_COLORS = ['#007AFF', '#34C759', '#FF9500', '#AF52DE', '#FF2D55', '#5856D6', '#FFCC00'];

export const DashboardPage: React.FC = () => {
    const { lancamentos, saidas } = useFinanceData();
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

    const availableMonths = useMemo(() => {
        const months = new Set<string>();
        const now = new Date().toISOString().slice(0, 7);
        months.add(now);
        lancamentos.forEach(l => {
            months.add(l.dataPrevista.slice(0, 7));
            l.datasPagamentos?.forEach(p => months.add(p.data.slice(0, 7)));
        });
        saidas.forEach(s => months.add(s.data.slice(0, 7)));
        return Array.from(months).sort().reverse();
    }, [lancamentos, saidas]);

    const formatMonthLabel = (monthStr: string) => {
        const [year, month] = monthStr.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        return date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase());
    };

    const stats = useMemo(() => {
        const [year, month] = selectedMonth.split('-').map(Number);
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const isCurrentMonth = now.getUTCFullYear() === year && (now.getUTCMonth() + 1) === month;

        // Data de corte para cálculo de atrasados:
        // Se for o mês atual, o corte é hoje. Se for mês passado, o corte é o último dia daquele mês.
        const lastDayOfMonth = new Date(year, month, 0).toISOString().split('T')[0];
        const limitDate = isCurrentMonth ? todayStr : lastDayOfMonth;

        // 1. Vendas do Mês Selecionado (Competência)
        const vendas = lancamentos
            .filter(l => {
                const d = new Date(l.dataPrevista + "T12:00:00Z");
                return d.getUTCMonth() === month - 1 && d.getUTCFullYear() === year;
            })
            .reduce((sum, l) => sum + l.valorPrevisto, 0);

        // 2. Recebido no Caixa no Mês Selecionado
        let recebido = 0;
        lancamentos.forEach(l => {
            l.datasPagamentos?.forEach(p => {
                const d = new Date(p.data + "T12:00:00Z");
                if (d.getUTCMonth() === month - 1 && d.getUTCFullYear() === year) {
                    recebido += p.valor;
                }
            });
        });

        // 3. ATRASADOS (Relativo ao mês selecionado)
        // O que venceu ATÉ o limite definido e não tinha sido pago ATÉ o limite definido.
        const atrasados = lancamentos
            .filter(l => l.dataPrevista < limitDate) // Venceu antes do ponto de corte
            .reduce((sum, l) => {
                // Soma o que foi pago APENAS até a data limite
                const paidUntilLimit = l.datasPagamentos
                    ?.filter(p => p.data <= limitDate)
                    .reduce((s, p) => s + p.valor, 0) || 0;
                
                const debtAtThatTime = l.valorPrevisto - paidUntilLimit;
                return sum + (debtAtThatTime > 0 ? debtAtThatTime : 0);
            }, 0);

        // 4. Saídas do Mês Selecionado
        const despesas = saidas
             .filter(s => {
                const d = new Date(s.data + "T12:00:00Z");
                return d.getUTCMonth() === month - 1 && d.getUTCFullYear() === year;
            })
            .reduce((sum, s) => sum + s.valor, 0);

        return {
            vendas,
            recebido,
            atrasados,
            despesas,
            balanco: recebido - despesas,
            isCurrentMonth
        };
    }, [lancamentos, saidas, selectedMonth]);

    const performanceData = useMemo(() => {
        return [
            {
                name: 'Fluxo Mensal',
                'Vendas': stats.vendas,
                'Caixa': stats.recebido,
                'Saídas': stats.despesas
            }
        ];
    }, [stats]);

    const categoryData = useMemo(() => {
        const [year, month] = selectedMonth.split('-').map(Number);
        const counts: Record<string, number> = {};
        
        lancamentos.forEach(l => {
            const category = l.product?.category || 'Outros';
            l.datasPagamentos?.forEach(p => {
                const d = new Date(p.data + "T12:00:00Z");
                if (d.getUTCMonth() === month - 1 && d.getUTCFullYear() === year) {
                    counts[category] = (counts[category] || 0) + p.valor;
                }
            });
        });

        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a,b) => b.value - a.value);
    }, [lancamentos, selectedMonth]);

    const extratoRecebimentos = useMemo(() => {
        const [year, month] = selectedMonth.split('-').map(Number);
        const payments: { data: string; cliente: string; produto: string; valor: number; gender?: 'male' | 'female' }[] = [];

        lancamentos.forEach(l => {
            l.datasPagamentos?.forEach(p => {
                const d = new Date(p.data + "T12:00:00Z");
                if (d.getUTCMonth() === month - 1 && d.getUTCFullYear() === year) {
                    payments.push({
                        data: p.data,
                        cliente: l.client?.name || 'Cliente Desconhecido',
                        produto: l.product?.name || 'Serviço',
                        valor: p.valor,
                        gender: l.client?.gender
                    });
                }
            });
        });

        return payments.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
    }, [lancamentos, selectedMonth]);

    return (
        <div className="p-1 space-y-8 animate-fadeIn pb-12">
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-text tracking-tight">Fluxo de Caixa</h1>
                    <p className="text-secondary-text mt-1 text-sm font-medium">
                        Resumo de entradas e pendências • {formatMonthLabel(selectedMonth)}
                    </p>
                </div>
                <div className="flex items-center gap-3 bg-white p-1 rounded-full border border-border-color shadow-sm">
                    <div className="pl-4 text-secondary-text"><CalendarIcon className="w-4 h-4" /></div>
                    <select 
                        value={selectedMonth} 
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="bg-transparent border-none outline-none font-bold text-apple-blue py-2 pr-4 cursor-pointer text-sm"
                    >
                        {availableMonths.map(m => <option key={m} value={m}>{formatMonthLabel(m)}</option>)}
                    </select>
                </div>
            </div>
            
            {/* Stat Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Vendas" 
                    value={formatCurrency(stats.vendas)} 
                    subValue="Volume do período"
                    icon={<ClockIcon className="w-5 h-5 text-indigo-600" />} 
                    iconBg="bg-indigo-50" 
                />
                <StatCard 
                    title="Caixa" 
                    value={formatCurrency(stats.recebido)} 
                    subValue="Entradas reais no mês"
                    icon={<ArrowUpCircleIcon className="w-5 h-5 text-apple-green" />} 
                    iconBg="bg-green-50" 
                />
                <StatCard 
                    title="Atrasados" 
                    value={formatCurrency(stats.atrasados)} 
                    subValue={stats.isCurrentMonth ? "Pendentes até hoje" : `Pendentes até o fim de ${formatMonthLabel(selectedMonth).split(' ')[0]}`}
                    icon={<AlertCircleIcon className="w-5 h-5 text-apple-red" />} 
                    iconBg="bg-red-50" 
                />
                <StatCard 
                    title="Saldo Líquido" 
                    value={formatCurrency(stats.balanco)} 
                    subValue="Resultado operacional"
                    icon={<DollarSignIcon className="w-5 h-5 text-gray-700" />} 
                    iconBg="bg-gray-200" 
                />
            </div>

            {/* Analytical Panels */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 1. Performance */}
                <div className="bg-white rounded-[2.5rem] border border-border-color shadow-sm p-8 flex flex-col h-[520px]">
                    <h3 className="text-lg font-bold text-primary-text mb-6">Performance</h3>
                    <div className="flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={performanceData} barGap={12} margin={{ left: -30, right: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                <XAxis dataKey="name" hide />
                                <YAxis tickFormatter={v => formatCurrency(v).replace('R$', '').trim()} tick={{ fill: '#9CA3AF', fontSize: 10 }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                                <Bar name="Vendas" dataKey="Vendas" fill="#AF52DE" radius={[8, 8, 8, 8]} barSize={50} />
                                <Bar name="Caixa" dataKey="Caixa" fill="#34C759" radius={[8, 8, 8, 8]} barSize={50} />
                                <Bar name="Saídas" dataKey="Saídas" fill="#FF3B30" radius={[8, 8, 8, 8]} barSize={50} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-50 grid grid-cols-2 gap-4">
                         <div className="text-center">
                            <p className="text-[9px] text-secondary-text font-bold uppercase tracking-wider">Eficiência</p>
                            <p className="text-sm font-bold text-apple-green">{stats.vendas > 0 ? ((stats.recebido / stats.vendas) * 100).toFixed(1) : 0}%</p>
                         </div>
                         <div className="text-center">
                            <p className="text-[9px] text-secondary-text font-bold uppercase tracking-wider">Burn Rate</p>
                            <p className="text-sm font-bold text-apple-red">{stats.recebido > 0 ? ((stats.despesas / stats.recebido) * 100).toFixed(1) : 0}%</p>
                         </div>
                    </div>
                </div>

                {/* 2. Origem */}
                <div className="bg-white rounded-[2.5rem] border border-border-color shadow-sm p-8 flex flex-col h-[520px]">
                    <h3 className="text-lg font-bold text-primary-text mb-6">Origem das Entradas</h3>
                    <div className="flex-1 relative">
                        {categoryData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie 
                                        data={categoryData} 
                                        dataKey="value" 
                                        cx="50%" 
                                        cy="45%" 
                                        innerRadius={70} 
                                        outerRadius={95} 
                                        paddingAngle={6} 
                                        strokeWidth={0}
                                    >
                                        {categoryData.map((_, index) => <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend 
                                        layout="vertical" 
                                        verticalAlign="bottom" 
                                        align="center"
                                        iconSize={6}
                                        formatter={(value) => <span className="text-[9px] font-bold text-secondary-text uppercase ml-1">{value}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-secondary-text opacity-20 text-center">
                                <RecordingsIcon className="w-12 h-12 mb-4 mx-auto" />
                                <p className="text-xs font-medium">Nenhum pagamento</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. Extrato */}
                <div className="bg-white rounded-[2.5rem] border border-border-color shadow-sm p-8 flex flex-col h-[520px]">
                    <h3 className="text-lg font-bold text-primary-text mb-6">Extrato de Recebimentos</h3>
                    <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2">
                        {extratoRecebimentos.length > 0 ? (
                            <div className="space-y-4">
                                {extratoRecebimentos.map((pay, i) => (
                                    <div key={i} className="flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <AbstractAvatar name={pay.cliente} gender={pay.gender || 'female'} size={32} />
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-primary-text truncate">{pay.cliente}</p>
                                                <p className="text-[10px] text-secondary-text">
                                                    {new Date(pay.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} • {pay.produto}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="text-xs font-black text-apple-green">{formatCurrency(pay.valor)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-secondary-text opacity-30 italic text-xs text-center">
                                <TrendingUpIcon className="w-10 h-10 mb-2 opacity-50" />
                                <p>Sem movimentações<br/>reais neste mês.</p>
                            </div>
                        )}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
                        <span className="text-[10px] font-bold text-secondary-text uppercase">Total Recebido</span>
                        <span className="text-sm font-black text-apple-green">{formatCurrency(stats.recebido)}</span>
                    </div>
                </div>
            </div>
            
            {/* Overdue Alert Card */}
            <div className={`rounded-[2.5rem] p-10 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden transition-all ${stats.atrasados > 0 ? 'bg-rose-950' : 'bg-gray-900'}`}>
                <div className="absolute top-0 right-0 w-96 h-96 bg-apple-blue/10 rounded-full -mr-48 -mt-48 blur-[100px]"></div>
                
                <div className="relative z-10 flex items-center gap-6">
                    <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center backdrop-blur-md ${stats.atrasados > 0 ? 'bg-red-500/20' : 'bg-white/10'}`}>
                         <TrendingUpIcon className={`w-8 h-8 ${stats.atrasados > 0 ? 'text-apple-red' : 'text-apple-green'}`} />
                    </div>
                    <div>
                        <h4 className="text-2xl font-bold mb-1">{stats.atrasados > 0 ? 'Pendências Detectadas' : 'Tudo em Dia'}</h4>
                        <p className="text-gray-400 text-sm max-w-md">
                            {stats.atrasados > 0 
                                ? `Havia ${formatCurrency(stats.atrasados)} pendentes até esta data. Revise os prazos para garantir a saúde do seu fluxo.` 
                                : `Não havia serviços atrasados até o fim deste período. Gestão financeira impecável!`}
                        </p>
                    </div>
                </div>
                
                <div className="relative z-10 text-center md:text-right">
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">
                        Atrasado no Período
                    </p>
                    <p className={`text-4xl font-black ${stats.atrasados > 0 ? 'text-apple-red' : 'text-white'}`}>
                        {formatCurrency(stats.atrasados)}
                    </p>
                </div>
            </div>
        </div>
    );
};
