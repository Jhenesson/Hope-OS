
import React, { useMemo } from 'react';
import { useFinanceData } from '../context/FinanceDataContext';
import { StatusPagamento } from '../../../types';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend, BarChart, Bar } from 'recharts';
import { DollarSignIcon } from '../../../components/icons/Icons';

const ArrowUpCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16V8" />
        <path d="m8 12 4-4 4 4" />
    </svg>
);
const ArrowDownCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v8" />
        <path d="m8 12 4 4 4-4" />
    </svg>
);
const ClockIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
    </svg>
);


interface StatCardProps {
    title: string;
    value: string;
    icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon }) => (
    <div className="bg-gray-50/70 rounded-2xl border border-border-color/50 p-6 flex flex-col justify-between min-h-[140px]">
        <div className="flex items-start justify-between text-secondary-text gap-4">
            <span className="text-sm font-medium leading-tight">{title}</span>
            <div className="shrink-0">
                {icon}
            </div>
        </div>
        <div>
            <p className="text-2xl font-bold text-primary-text mt-2">{value}</p>
        </div>
    </div>
);

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/80 backdrop-blur-sm p-3 rounded-lg border border-border-color shadow-md">
                <p className="font-semibold text-primary-text mb-1">{label || payload[0].name}</p>
                {payload.map((pld: any, index: number) => (
                    <p key={index} style={{ color: pld.fill || pld.color }} className="text-sm">
                        {`${pld.name ? '' : 'Valor: '}${formatCurrency(Number(pld.value))}`}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const COLORS = ['#007AFF', '#34C759', '#FF9500', '#AF52DE', '#FF2D55', '#5856D6', '#FFCC00', '#8E8E93'];

export const DashboardPage: React.FC = () => {
    const { lancamentos, saidas } = useFinanceData();

    const monthlyStats = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const getMonthYear = (dateStr: string) => {
            const date = new Date(dateStr + "T12:00:00Z");
            return { month: date.getUTCMonth(), year: date.getUTCFullYear() };
        }

        // Filter for current month lancamentos (based on dataPrevista)
        const currentMonthLancamentos = lancamentos.filter(l => {
            const { month, year } = getMonthYear(l.dataPrevista);
            return month === currentMonth && year === currentYear;
        });

        // 1. Receita Total (Prevista): Sum of ALL 'valorPrevisto' for this month
        const receitaTotalPrevista = currentMonthLancamentos.reduce((sum, l) => sum + l.valorPrevisto, 0);

        // 2. Receita Recebida: Sum of ALL 'valorRecebido' for this month
        const receitaRecebida = currentMonthLancamentos.reduce((sum, l) => sum + l.valorRecebido, 0);

        // 3. Total Pendente: Difference
        const totalPendente = receitaTotalPrevista - receitaRecebida;
        
        // 4. Total Saídas
        const totalSaidas = saidas
             .filter(s => {
                const { month, year } = getMonthYear(s.data);
                return month === currentMonth && year === currentYear;
            })
            .reduce((sum: number, s) => sum + s.valor, 0);

        return {
            receitaTotalPrevista,
            receitaRecebida,
            totalPendente,
            totalSaidas,
            balanco: receitaRecebida - totalSaidas,
        };
    }, [lancamentos, saidas]);

    const revenueEvolutionData = useMemo(() => {
        const data: { name: string, Receita: number }[] = [];
        const now = new Date();

        for (let i = 5; i >= 0; i--) {
            const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthName = targetDate.toLocaleString('pt-BR', { month: 'short' }).replace(/^\w/, c => c.toUpperCase()).replace('.', '');
            
            const monthRevenue = lancamentos
                .filter(l => {
                    const lancDate = new Date(l.dataPrevista + "T00:00:00");
                    return lancDate.getMonth() === targetDate.getMonth() && lancDate.getFullYear() === targetDate.getFullYear() &&
                           (l.statusPagamento === StatusPagamento.Pago || l.statusPagamento === StatusPagamento.Parcial);
                })
                .reduce((sum: number, l) => sum + l.valorRecebido, 0);

            data.push({ name: monthName, Receita: monthRevenue });
        }
        return data;
    }, [lancamentos]);

    const categoryData = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const filtered = lancamentos.filter(l => {
             const lDate = new Date(l.dataPrevista + "T12:00:00Z");
             // Filter for Current Month AND (Paid OR Partial) to show income sources
             return lDate.getMonth() === currentMonth &&
                    lDate.getFullYear() === currentYear &&
                    l.valorRecebido > 0;
        });

        const totalRevenue = filtered.reduce((sum: number, l) => sum + l.valorRecebido, 0);

        const data = filtered.reduce((acc: Record<string, number>, l) => {
            const cat = l.product?.category || 'Outros';
            const current = acc[cat] || 0;
            acc[cat] = current + l.valorRecebido;
            return acc;
        }, {} as Record<string, number>);

        // Return sorted descending by value
        return Object.entries(data)
            .map(([name, value]: [string, number]) => ({ 
                name: totalRevenue > 0 ? `${name} (${((value / totalRevenue) * 100).toFixed(0)}%)` : name,
                value: value
            }))
            .sort((a, b) => b.value - a.value);
    }, [lancamentos]);

    const productData = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const data = lancamentos.filter(l => {
             const lDate = new Date(l.dataPrevista + "T12:00:00Z");
             return lDate.getMonth() === currentMonth &&
                    lDate.getFullYear() === currentYear &&
                    l.valorRecebido > 0;
        }).reduce((acc: Record<string, number>, l) => {
            const name = l.product?.name || 'Outros';
            acc[name] = (acc[name] || 0) + l.valorRecebido;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(data)
            .map(([name, value]: [string, number]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [lancamentos]);

    return (
        <div className="p-1">
            <h1 className="text-3xl font-bold text-primary-text mb-6">Dashboard Financeiro</h1>
            
            {/* Stats Grid - Expanded to 5 columns for larger screens or wrapping */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 gap-6">
                <StatCard 
                    title="Receita Total (Prevista)" 
                    value={formatCurrency(monthlyStats.receitaTotalPrevista)} 
                    icon={<DollarSignIcon className="w-6 h-6 text-apple-blue"/>} 
                />
                <StatCard 
                    title="Receita Recebida" 
                    value={formatCurrency(monthlyStats.receitaRecebida)} 
                    icon={<ArrowUpCircleIcon className="w-6 h-6 text-apple-green"/>} 
                />
                <StatCard 
                    title="Total Pendente" 
                    value={formatCurrency(monthlyStats.totalPendente)} 
                    icon={<ClockIcon className="w-6 h-6 text-apple-orange"/>} 
                />
                <StatCard 
                    title="Saídas no Mês" 
                    value={formatCurrency(monthlyStats.totalSaidas)} 
                    icon={<ArrowDownCircleIcon className="w-6 h-6 text-apple-red"/>} 
                />
                <StatCard 
                    title="Balanço Líquido" 
                    value={formatCurrency(monthlyStats.balanco)} 
                    icon={<DollarSignIcon className="w-6 h-6 text-gray-500"/>} 
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                <div className="bg-gray-50/70 rounded-2xl border border-border-color/50 p-6 min-h-[350px] flex flex-col">
                    <h3 className="text-lg font-semibold text-primary-text mb-4">Evolução da Receita</h3>
                    <div className="flex-1">
                         <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={revenueEvolutionData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="name" tick={{ fill: '#6B7280' }} fontSize={12} />
                                <YAxis tickFormatter={val => formatCurrency(Number(val) || 0).replace(/\s/g, '\u00A0').replace('R$', '')} tick={{ fill: '#6B7280' }} fontSize={12} />
                                <Tooltip content={<CustomTooltip />} />
                                <Line type="monotone" dataKey="Receita" stroke="#007AFF" strokeWidth={3} dot={{ r: 4, fill: '#007AFF', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-gray-50/70 rounded-2xl border border-border-color/50 p-6 min-h-[350px] flex flex-col">
                    <h3 className="text-lg font-semibold text-primary-text mb-4">Entradas por Categoria (Mês Atual)</h3>
                    <div className="flex-1">
                        {categoryData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend 
                                        layout="vertical" 
                                        verticalAlign="middle" 
                                        align="right"
                                        iconType="circle"
                                        iconSize={8}
                                        formatter={(value) => <span className="text-secondary-text text-xs ml-1">{value}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-secondary-text opacity-60">
                                <DollarSignIcon className="w-12 h-12 mb-2" />
                                <p>Sem entradas registradas este mês</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* FULL WIDTH CHART: Revenue by Product */}
                <div className="lg:col-span-2 bg-gray-50/70 rounded-2xl border border-border-color/50 p-6 min-h-[350px] flex flex-col">
                    <h3 className="text-lg font-semibold text-primary-text mb-4">Receita por Produtos Vendidos (Mês Atual)</h3>
                    <div className="flex-1">
                        {productData.length > 0 ? (
                             <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={productData} layout="vertical" margin={{ top: 5, right: 50, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                                    <XAxis type="number" tickFormatter={val => formatCurrency(Number(val) || 0).replace('R$', '')} fontSize={12} tick={{ fill: '#6B7280' }} />
                                    <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 12, fill: '#6B7280' }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar 
                                        dataKey="value" 
                                        name="Receita" 
                                        barSize={20} 
                                        radius={[0, 4, 4, 0]} 
                                        fill="#007AFF"
                                        label={{ 
                                            position: 'right', 
                                            fill: '#6B7280', 
                                            fontSize: 12,
                                            formatter: (value: number) => formatCurrency(value)
                                        }}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-secondary-text opacity-60">
                                <DollarSignIcon className="w-12 h-12 mb-2" />
                                <p>Sem vendas de produtos registradas este mês</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
