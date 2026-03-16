import React, { useState, useMemo } from 'react';
import { useFinanceData } from '../context/FinanceDataContext';
import { StatusPagamento } from '../../../types';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    LineChart, Line, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { DollarSignIcon } from '../../../components/icons/Icons';

type Period = 'currentMonth' | 'lastMonth' | 'last3Months' | 'last6Months' | 'lastYear' | 'all';

const ArrowUpCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16V8" /><path d="m8 12 4-4 4 4" /></svg>
);
const ArrowDownCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v8" /><path d="m8 12 4 4 4-4" /></svg>
);
const ChevronLeftIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
);
const ChevronRightIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
);

interface StatCardProps { title: string; value: string; icon: React.ReactNode; iconBg: string; }
const StatCard: React.FC<StatCardProps> = ({ title, value, icon, iconBg }) => (
    <div className="bg-white rounded-2xl border border-border-color shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between text-secondary-text">
            <span className="text-[10px] font-black uppercase tracking-widest">{title}</span>
            <div className={`p-2 rounded-xl ${iconBg}`}>{icon}</div>
        </div>
        <div><p className="text-3xl font-black text-primary-text mt-2 tracking-tight">{value}</p></div>
    </div>
);

const CHART_COLORS = ['#007AFF', '#34C759', '#FF9500', '#FF3B30', '#AF52DE', '#5856D6', '#FF2D55'];

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const CategoryExtratoTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-white/95 backdrop-blur-md p-4 rounded-xl border border-border-color shadow-xl min-w-[220px] z-50">
                <p className="font-black text-primary-text mb-3 text-xs uppercase tracking-tighter border-b pb-2">{data.name}</p>
                <div className="space-y-1.5">
                    {data.details.map((item: any, i: number) => (
                        <div key={i} className="flex justify-between items-center gap-4">
                            <span className="text-[11px] font-medium text-secondary-text truncate max-w-[130px]">{item.client}</span>
                            <span className="text-[11px] font-bold text-primary-text">{formatCurrency(item.value)}</span>
                        </div>
                    ))}
                </div>
                <div className="mt-3 pt-2 border-t flex justify-between items-center text-[10px] font-black uppercase">
                    <span className="text-secondary-text">Total Vendas</span>
                    <span className="text-apple-blue">{formatCurrency(data.value)}</span>
                </div>
            </div>
        );
    }
    return null;
};

const ClientExtratoTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-white/95 backdrop-blur-md p-4 rounded-xl border border-border-color shadow-xl min-w-[260px] z-50">
                <div className="flex justify-between items-start border-b pb-2 mb-3">
                    <p className="font-black text-primary-text text-xs uppercase tracking-tighter">{data.name}</p>
                    <span className="text-[9px] font-black text-secondary-text uppercase bg-gray-100 px-1.5 py-0.5 rounded">Extrato Vendas</span>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                    {data.details.map((item: any, i: number) => (
                        <div key={i} className="flex flex-col border-b border-gray-50 last:border-0 pb-1.5 mb-1.5">
                            <div className="flex justify-between items-center gap-4">
                                <span className="text-[11px] font-bold text-primary-text truncate max-w-[170px]">{item.product}</span>
                                <span className="text-[11px] font-black text-apple-green">{formatCurrency(item.value)}</span>
                            </div>
                            <span className="text-[9px] font-medium text-secondary-text uppercase">{new Date(item.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' })}</span>
                        </div>
                    ))}
                </div>
                <div className="mt-3 pt-2 border-t flex justify-between items-center text-[10px] font-black uppercase">
                    <span className="text-secondary-text">Volume Total</span>
                    <span className="text-apple-green font-black">{formatCurrency(data.value)}</span>
                </div>
            </div>
        );
    }
    return null;
};

const EvolutionTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/95 backdrop-blur-md p-4 rounded-xl border border-border-color shadow-xl min-w-[180px] z-50">
                <p className="font-black text-primary-text mb-3 text-xs uppercase tracking-widest border-b pb-2">{label}</p>
                {payload.map((pld: any, index: number) => (
                    <div key={index} className="flex items-center justify-between gap-6 mb-2 last:mb-0">
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pld.color }}></div>
                            <span className="text-[10px] font-bold text-secondary-text uppercase">{pld.name}:</span>
                        </div>
                        <span className="text-[11px] font-black text-primary-text">{formatCurrency(pld.value)}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

const BalanceTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-gray-900/95 backdrop-blur-md p-4 rounded-xl border border-gray-700 shadow-2xl text-white z-50 min-w-[180px]">
                <p className="font-black mb-3 text-[10px] uppercase tracking-widest text-gray-400">{label}</p>
                <div className="space-y-2">
                    {payload.map((p: any, i: number) => (
                        <div key={i} className="flex justify-between items-center gap-4">
                            <span className="text-[11px] font-medium text-gray-300">{p.name}:</span>
                            <span className="text-[11px] font-black" style={{ color: p.color || p.fill }}>{formatCurrency(p.value)}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

export const PainelAnaliticoPage: React.FC = () => {
    const { lancamentos, saidas } = useFinanceData();
    const [period, setPeriod] = useState<Period>('all');
    
    // Lista de meses disponíveis para os seletores (YYYY-MM)
    const availablePerformanceMonths = useMemo(() => {
        const months = new Set<string>();
        const now = new Date();
        
        // Garantir que temos pelo menos os últimos 24 meses
        for (let i = 23; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.add(d.toISOString().slice(0, 7));
        }
        
        // Adicionar meses dos lançamentos se houver algo fora desse range
        lancamentos.forEach(l => {
            months.add(l.dataPrevista.slice(0, 7));
        });
        
        return Array.from(months).sort().reverse();
    }, [lancamentos]);

    // Estados para o intervalo customizado de Performance de Vendas
    const [perfStartMonth, setPerfStartMonth] = useState(availablePerformanceMonths[5] || availablePerformanceMonths[availablePerformanceMonths.length-1]);
    const [perfEndMonth, setPerfEndMonth] = useState(availablePerformanceMonths[0]);
    
    const [threeMonthOffset, setThreeMonthOffset] = useState(0);

    // Added formatMonthLabel to fix missing name error
    const formatMonthLabel = (monthStr: string) => {
        const [year, month] = monthStr.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        return date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase());
    };

    const filteredData = useMemo(() => {
        const now = new Date();
        let startDate = new Date();
        let endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        switch (period) {
            case 'currentMonth': startDate = new Date(now.getFullYear(), now.getMonth(), 1); break;
            case 'lastMonth': startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1); endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59); break;
            case 'last3Months': startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1); break;
            case 'last6Months': startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1); break;
            case 'lastYear': startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1); break;
            case 'all': startDate = new Date(2020, 0, 1); endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0); break;
        }
        startDate.setHours(0, 0, 0, 0);
        return { startDate, endDate };
    }, [period]);

    const stats = useMemo(() => {
        const { startDate, endDate } = filteredData;
        
        let receitaTotal = 0;
        lancamentos.forEach(l => {
            l.datasPagamentos?.forEach(p => {
                const d = new Date(p.data + 'T12:00:00');
                if (d >= startDate && d <= endDate) receitaTotal += p.valor;
            });
        });

        const volumeVendas = lancamentos.filter(l => {
            const d = new Date(l.dataPrevista + 'T12:00:00');
            return d >= startDate && d <= endDate;
        }).reduce((sum, l) => sum + l.valorPrevisto, 0);

        const totalSaidas = saidas.filter(s => {
            const d = new Date(s.data + 'T12:00:00');
            return d >= startDate && d <= endDate;
        }).reduce((sum, s) => sum + Number(s.valor || 0), 0);

        return { receitaTotal, volumeVendas, totalSaidas, balanco: receitaTotal - totalSaidas };
    }, [lancamentos, saidas, filteredData]);

    const chartData = useMemo(() => {
        const { startDate, endDate } = filteredData;
        const now = new Date();
        const getLabel = (date: Date) => date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).toUpperCase();

        // --- Evolução da Receita (Vendas vs Caixa) ---
        const evolutionMap: Record<string, { Vendas: number, Caixa: number, timestamp: number }> = {};
        let dCursor = new Date(startDate);
        if (period === 'all') {
            dCursor = new Date(now.getFullYear(), now.getMonth() - 11, 1);
        }
        const actualEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const loopEnd = period === 'all' ? actualEnd : endDate;

        let tempCursor = new Date(dCursor);
        while (tempCursor <= loopEnd) {
            const label = getLabel(tempCursor);
            evolutionMap[label] = { Vendas: 0, Caixa: 0, timestamp: tempCursor.getTime() };
            tempCursor.setMonth(tempCursor.getMonth() + 1);
        }

        lancamentos.forEach(l => {
            const workDate = new Date(l.dataPrevista + 'T12:00:00');
            const workLabel = getLabel(workDate);
            if (evolutionMap[workLabel]) evolutionMap[workLabel].Vendas += l.valorPrevisto;

            l.datasPagamentos?.forEach(p => {
                const payDate = new Date(p.data + 'T12:00:00');
                const payLabel = getLabel(payDate);
                if (evolutionMap[payLabel]) evolutionMap[payLabel].Caixa += p.valor;
            });
        });

        const evolucaoReceita = Object.entries(evolutionMap)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => a.timestamp - b.timestamp);

        // --- Distribuição e Top Categorias ---
        const catAggregation: Record<string, { total: number, details: Record<string, number> }> = {};
        lancamentos.forEach(l => {
            const date = new Date(l.dataPrevista + 'T12:00:00');
            if (date >= startDate && date <= endDate) {
                const cat = l.product?.category || 'Outros';
                const client = l.client?.name || 'Anônimo';
                if (!catAggregation[cat]) catAggregation[cat] = { total: 0, details: {} };
                catAggregation[cat].total += l.valorPrevisto;
                catAggregation[cat].details[client] = (catAggregation[cat].details[client] || 0) + l.valorPrevisto;
            }
        });

        const totalVendasPeriodo = Object.values(catAggregation).reduce((a, b) => a + b.total, 0);
        const distribuicaoCategoria = Object.entries(catAggregation).map(([name, data]) => {
            const pct = totalVendasPeriodo > 0 ? (data.total / totalVendasPeriodo) * 100 : 0;
            return { name: `${name} (${pct.toFixed(0)}%)`, value: data.total };
        }).sort((a, b) => b.value - a.value);

        const topCategoriasValor = Object.entries(catAggregation).map(([name, data]) => ({
            name,
            value: data.total,
            details: Object.entries(data.details).map(([client, val]) => ({ client, value: val })).sort((a, b) => b.value - a.value).slice(0, 5)
        })).sort((a, b) => b.value - a.value).slice(0, 10);

        // --- Performance de Vendas (INTERVALO CUSTOMIZADO) ---
        const salesPerformanceStats = [];
        const globalCategoryTotals: Record<string, number> = {};
        
        // Determinar o intervalo real
        const startArr = perfStartMonth.split('-').map(Number);
        const endArr = perfEndMonth.split('-').map(Number);
        
        let current = new Date(startArr[0], startArr[1] - 1, 1);
        const targetEnd = new Date(endArr[0], endArr[1] - 1, 1);
        
        // Se o usuário inverter as datas, inverter o loop
        const isReversed = current > targetEnd;
        if (isReversed) {
            current = new Date(targetEnd);
        }
        
        const finalLimit = isReversed ? new Date(startArr[0], startArr[1] - 1, 1) : targetEnd;
        
        let countMonths = 0;
        while (current <= finalLimit) {
            const label = getLabel(current);
            const monthCats: Record<string, number> = {};
            let monthTotal = 0;
            
            lancamentos.forEach(l => {
                const ld = new Date(l.dataPrevista + 'T12:00:00');
                if (ld.getMonth() === current.getMonth() && ld.getFullYear() === current.getFullYear()) {
                    const cat = l.product?.category || 'Outros';
                    monthCats[cat] = (monthCats[cat] || 0) + l.valorPrevisto;
                    monthTotal += l.valorPrevisto;
                    globalCategoryTotals[cat] = (globalCategoryTotals[cat] || 0) + l.valorPrevisto;
                }
            });
            
            const top3 = Object.entries(monthCats)
                .map(([name, val]) => ({ name, val }))
                .sort((a, b) => b.val - a.val)
                .slice(0, 3);
                
            salesPerformanceStats.push({ label, top3, total: monthTotal });
            current.setMonth(current.getMonth() + 1);
            countMonths++;
        }
        
        const categoryAverages = Object.entries(globalCategoryTotals)
            .map(([name, total]) => ({ name, avg: total / (countMonths || 1) }))
            .sort((a, b) => b.avg - a.avg);

        // --- Balanço Geral Trimestral ---
        const balancoGeral = [];
        for (let i = 2 + threeMonthOffset; i >= 0 + threeMonthOffset; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const label = getLabel(d);
            const m = d.getMonth();
            const y = d.getFullYear();
            let recebidos = 0;
            lancamentos.forEach(l => {
                l.datasPagamentos?.forEach(p => {
                    const pd = new Date(p.data + 'T12:00:00');
                    if (pd.getMonth() === m && pd.getFullYear() === y) recebidos += p.valor;
                });
            });
            const mensais = lancamentos.filter(l => {
                const ld = new Date(l.dataPrevista + 'T12:00:00');
                return ld.getMonth() === m && ld.getFullYear() === y;
            });
            const agendado = mensais.reduce((sum, l) => sum + l.valorPrevisto, 0);
            const restante = mensais.reduce((sum, l) => sum + (l.valorPrevisto - l.valorRecebido), 0);
            const mesSaidas = saidas.filter(s => {
                const sd = new Date(s.data + 'T12:00:00');
                return sd.getMonth() === m && sd.getFullYear() === y;
            }).reduce((sum, s) => sum + s.valor, 0);
            balancoGeral.push({ name: label, 'Vendas': agendado, 'Caixa': recebidos, 'Pendente': restante, 'Saídas': mesSaidas });
        }

        const clientDetailsGranular: Record<string, { total: number, details: { product: string, value: number, date: string }[] }> = {};
        lancamentos.forEach(l => {
            const date = new Date(l.dataPrevista + 'T12:00:00');
            if (date >= startDate && date <= endDate) {
                const clientName = l.client?.name || 'Anônimo';
                const productName = l.product?.name || 'Serviço';
                if (!clientDetailsGranular[clientName]) clientDetailsGranular[clientName] = { total: 0, details: [] };
                clientDetailsGranular[clientName].total += l.valorPrevisto;
                clientDetailsGranular[clientName].details.push({ product: productName, value: l.valorPrevisto, date: l.dataPrevista });
            }
        });
        const topClientes = Object.entries(clientDetailsGranular).map(([name, data]) => ({
            name,
            value: data.total,
            details: data.details.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 12)
        })).sort((a, b) => b.value - a.value).slice(0, 10);

        return { 
            evolucaoReceita, distribuicaoCategoria, topCategoriasValor, 
            topClientes, balancoGeral, salesPerformanceStats, categoryAverages 
        };
    }, [lancamentos, saidas, filteredData, perfStartMonth, perfEndMonth, threeMonthOffset, period]);

    return (
        <div className="p-1 space-y-8 animate-fadeIn pb-12">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-primary-text tracking-tighter uppercase">Painel Analítico</h1>
                    <p className="text-xs text-secondary-text font-bold tracking-widest">Inteligência Financeira Hope OS</p>
                </div>
                <select 
                    value={period} 
                    onChange={e => setPeriod(e.target.value as Period)}
                    className="px-4 py-2 border-2 border-border-color rounded-full bg-white font-bold text-sm focus:ring-2 focus:ring-apple-blue transition-all cursor-pointer"
                >
                    <option value="all">Todo Histórico</option>
                    <option value="currentMonth">Este Mês</option>
                    <option value="lastMonth">Mês Passado</option>
                    <option value="last3Months">Últimos 3 Meses</option>
                    <option value="last6Months">Últimos 6 Meses</option>
                    <option value="lastYear">Último Ano</option>
                </select>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Caixa (Período)" value={formatCurrency(stats.receitaTotal)} icon={<ArrowUpCircleIcon className="w-5 h-5 text-apple-green"/>} iconBg="bg-green-50" />
                <StatCard title="Vendas (Período)" value={formatCurrency(stats.volumeVendas)} icon={<DollarSignIcon className="w-5 h-5 text-apple-orange"/>} iconBg="bg-orange-50" />
                <StatCard title="Saídas" value={formatCurrency(stats.totalSaidas)} icon={<ArrowDownCircleIcon className="w-5 h-5 text-apple-red"/>} iconBg="bg-red-50" />
                <StatCard title="Balanço Líquido" value={formatCurrency(stats.balanco)} icon={<DollarSignIcon className="w-5 h-5 text-apple-blue"/>} iconBg="bg-blue-50" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-gray-50/70 rounded-3xl border border-border-color/50 p-6 min-h-[400px] flex flex-col">
                    <h3 className="text-lg font-black text-primary-text mb-2 uppercase tracking-tight">Tendência: Vendas vs. Caixa</h3>
                    <p className="text-[10px] text-secondary-text font-bold uppercase mb-6">Volume de contratos vs Entradas reais</p>
                    <div className="flex-1">
                        <ResponsiveContainer width="100%" height={320}>
                            <LineChart data={chartData.evolucaoReceita} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 10, fontWeight: 700 }} />
                                <YAxis tickFormatter={val => formatCurrency(val).replace('R$', '')} tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                                <Tooltip content={<EvolutionTooltip />} />
                                <Legend verticalAlign="bottom" align="center" height={36} iconType="circle" />
                                <Line name="Vendas" type="monotone" dataKey="Vendas" stroke="#007AFF" strokeWidth={3} dot={{ r: 4, fill: '#007AFF' }} activeDot={{ r: 6 }} />
                                <Line name="Caixa" type="monotone" dataKey="Caixa" stroke="#FF9500" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3, fill: '#FF9500' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-gray-50/70 rounded-3xl border border-border-color/50 p-6 min-h-[400px] flex flex-col">
                    <h3 className="text-lg font-black text-primary-text mb-6 uppercase tracking-tight">Distribuição por Categoria</h3>
                    <div className="flex-1">
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data={chartData.distribuicaoCategoria} dataKey="value" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5}>
                                    {chartData.distribuicaoCategoria.map((_, index) => <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} strokeWidth={0} />)}
                                </Pie>
                                <Tooltip />
                                <Legend layout="vertical" verticalAlign="middle" align="right" iconType="circle" iconSize={8} formatter={(value) => <span className="text-secondary-text text-[10px] font-bold uppercase ml-1">{value}</span>} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-gray-50/70 rounded-3xl border border-border-color/50 p-6 min-h-[350px] flex flex-col">
                    <h3 className="text-lg font-black text-primary-text mb-6 uppercase tracking-tight">Top Categorias (Vendas)</h3>
                    <div className="flex-1">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={chartData.topCategoriasValor} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                                <XAxis type="number" hide />
                                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10, fontWeight: 700, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CategoryExtratoTooltip />} cursor={{ fill: '#F3F4F6' }} />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                                    {chartData.topCategoriasValor.map((_, index) => <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-gray-50/70 rounded-3xl border border-border-color/50 p-6 min-h-[350px] flex flex-col">
                    <h3 className="text-lg font-black text-primary-text mb-6 uppercase tracking-tight">Top Clientes (Volume Vendas)</h3>
                    <div className="flex-1">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={chartData.topClientes} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                                <XAxis type="number" hide />
                                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10, fontWeight: 700, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                                <Tooltip content={<ClientExtratoTooltip />} cursor={{ fill: '#F3F4F6' }} />
                                <Bar dataKey="value" fill="#34C759" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* PERFORMANCE DE VENDAS */}
            <div className="bg-white rounded-[2.5rem] border border-border-color shadow-sm p-8 flex flex-col gap-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-black text-primary-text uppercase tracking-tight">Performance de Vendas</h3>
                        <p className="text-[10px] text-secondary-text font-bold uppercase tracking-widest">Análise temporal de fechamentos e tendências por categoria</p>
                    </div>
                    
                    <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-2xl border border-border-color/60">
                        <div className="flex items-center gap-2">
                             <span className="text-[9px] font-black text-secondary-text uppercase">De</span>
                             <select 
                                value={perfStartMonth} 
                                onChange={e => setPerfStartMonth(e.target.value)}
                                className="bg-white border border-border-color rounded-lg px-3 py-1 text-xs font-bold text-apple-blue outline-none"
                             >
                                 {availablePerformanceMonths.map(m => <option key={m} value={m}>{formatMonthLabel(m)}</option>)}
                             </select>
                        </div>
                        <div className="flex items-center gap-2">
                             <span className="text-[9px] font-black text-secondary-text uppercase">Até</span>
                             <select 
                                value={perfEndMonth} 
                                onChange={e => setPerfEndMonth(e.target.value)}
                                className="bg-white border border-border-color rounded-lg px-3 py-1 text-xs font-bold text-apple-blue outline-none"
                             >
                                 {availablePerformanceMonths.map(m => <option key={m} value={m}>{formatMonthLabel(m)}</option>)}
                             </select>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
                    {chartData.salesPerformanceStats.map((month, idx) => (
                        <div key={idx} className="bg-gray-50 rounded-2xl p-4 border border-border-color/50 flex flex-col min-h-[180px] hover:shadow-sm transition-shadow">
                            <p className="text-[10px] font-black text-secondary-text uppercase tracking-widest mb-3 pb-2 border-b">{month.label}</p>
                            <div className="space-y-3 flex-1">
                                {month.top3.map((cat, cIdx) => (
                                    <div key={cIdx}>
                                        <p className="text-[9px] font-black text-primary-text truncate uppercase">{cat.name}</p>
                                        <p className="text-xs font-black text-apple-blue">{formatCurrency(cat.val)}</p>
                                    </div>
                                ))}
                                {month.top3.length === 0 && <p className="text-[10px] italic text-secondary-text">Sem vendas</p>}
                            </div>
                            <div className="mt-4 pt-2 border-t border-gray-200/50">
                                <p className="text-[8px] font-black text-secondary-text uppercase tracking-widest">Total Mês</p>
                                <p className="text-sm font-black text-primary-text">{formatCurrency(month.total)}</p>
                            </div>
                        </div>
                    ))}
                    
                    <div className="bg-gray-900 rounded-2xl p-4 border border-gray-700 flex flex-col shadow-xl min-h-[180px]">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 pb-2 border-b border-gray-700">Média no Período</p>
                        <div className="space-y-4 flex-1">
                            {chartData.categoryAverages.slice(0, 4).map((avg, aIdx) => (
                                <div key={aIdx}>
                                    <p className="text-[9px] font-black text-gray-200 truncate uppercase">{avg.name}</p>
                                    <p className="text-xs font-black text-apple-green">{formatCurrency(avg.avg)}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* BALANÇO GERAL TRIMESTRAL */}
            <div className="bg-white rounded-[2.5rem] border border-border-color shadow-sm p-8 min-h-[420px] flex flex-col">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-black text-primary-text uppercase tracking-tight">Balanço Geral Trimestral</h3>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setThreeMonthOffset(prev => prev + 3)} className="p-2.5 rounded-full hover:bg-gray-100 transition-all border border-border-color"><ChevronLeftIcon /></button>
                        <button onClick={() => setThreeMonthOffset(prev => Math.max(0, prev - 3))} className="p-2.5 rounded-full hover:bg-gray-100 transition-all border border-border-color" disabled={threeMonthOffset === 0}><ChevronRightIcon /></button>
                    </div>
                </div>
                <div className="flex-1">
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={chartData.balancoGeral} margin={{ top: 20, right: 30, left: 10, bottom: 5 }} barGap={8}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 700 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10 }} tickFormatter={v => formatCurrency(v).replace('R$', '').trim()} />
                            <Tooltip content={<BalanceTooltip />} cursor={{ fill: '#F9FAFB' }} />
                            <Legend iconType="circle" wrapperStyle={{ paddingTop: 20, fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }} />
                            <Bar name="Vendas" dataKey="Vendas" fill="#007AFF" radius={[4, 4, 0, 0]} barSize={32} />
                            <Bar name="Caixa" dataKey="Caixa" fill="#34C759" radius={[4, 4, 0, 0]} barSize={32} />
                            <Bar name="Pendente" dataKey="Pendente" fill="#AF52DE" radius={[4, 4, 0, 0]} barSize={32} />
                            <Bar name="Saídas" dataKey="Saídas" fill="#FF3B30" radius={[4, 4, 0, 0]} barSize={32} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};