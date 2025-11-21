
import React, { useState, useMemo } from 'react';
import { useFinanceData } from '../context/FinanceDataContext';
import { StatusPagamento } from '../../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import { DollarSignIcon } from '../../../components/icons/Icons';

type Period = 'currentMonth' | 'lastMonth' | 'last3Months' | 'last6Months' | 'lastYear' | 'all';

const ArrowUpCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16V8" /><path d="m8 12 4-4 4 4" /></svg>
);
const ArrowDownCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v8" /><path d="m8 12 4 4 4-4" /></svg>
);
interface StatCardProps { title: string; value: string; icon: React.ReactNode; }
const StatCard: React.FC<StatCardProps> = ({ title, value, icon }) => (
    <div className="bg-gray-50/70 rounded-2xl border border-border-color/50 p-6 flex flex-col justify-between">
        <div className="flex items-center justify-between text-secondary-text"><span className="text-sm font-medium">{title}</span>{icon}</div>
        <div><p className="text-3xl font-bold text-primary-text mt-2">{value}</p></div>
    </div>
);

const CHART_COLORS = ['#007AFF', '#34C759', '#FF9500', '#FF3B30', '#AF52DE', '#5856D6', '#FF2D55'];

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/80 backdrop-blur-sm p-3 rounded-lg border border-border-color shadow-md">
                <p className="font-semibold text-primary-text">{label || payload[0].name}</p>
                {payload.map((pld: any, index: number) => (
                    <p key={index} style={{ color: pld.fill || pld.color }}>{`${pld.name.includes('(') ? 'Valor' : pld.name}: ${formatCurrency(pld.value)}`}</p>
                ))}
            </div>
        );
    }
    return null;
};

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export const PainelAnaliticoPage: React.FC = () => {
    const { lancamentos, saidas } = useFinanceData();
    const [period, setPeriod] = useState<Period>('all');

    const filteredData = useMemo(() => {
        const now = new Date();
        let startDate = new Date();
        let endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59); // End of current month

        switch (period) {
            case 'currentMonth':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'lastMonth':
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
                break;
            case 'last3Months':
                startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
                break;
            case 'last6Months':
                startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
                break;
            case 'lastYear':
                startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
                break;
            case 'all':
                startDate = new Date(0); // Epoch
                endDate = new Date();
                break;
        }
        
        startDate.setHours(0, 0, 0, 0);

        const filteredLancamentos = lancamentos.filter(l => {
            const date = new Date(l.dataPrevista + 'T00:00:00');
            return date >= startDate && date <= endDate;
        });

        const filteredSaidas = saidas.filter(s => {
            const date = new Date(s.data + 'T00:00:00');
            return date >= startDate && date <= endDate;
        });

        return { filteredLancamentos, filteredSaidas };
    }, [lancamentos, saidas, period]);

    const stats = useMemo(() => {
        // Ensure numeric casting using Number() to avoid string concatenation
        const receitaTotal = filteredData.filteredLancamentos
            .filter(l => l.statusPagamento === StatusPagamento.Pago || l.statusPagamento === StatusPagamento.Parcial)
            .reduce((sum, l) => sum + Number(l.valorRecebido || 0), 0);
        
        const receitaPrevista = filteredData.filteredLancamentos
            .filter(l => l.statusPagamento === StatusPagamento.AReceber || l.statusPagamento === StatusPagamento.Parcial)
            .reduce((sum, l) => sum + (Number(l.valorPrevisto || 0) - Number(l.valorRecebido || 0)), 0);

        const totalSaidas = filteredData.filteredSaidas.reduce((sum, s) => sum + Number(s.valor || 0), 0);

        return {
            receitaTotal,
            receitaPrevista,
            totalSaidas,
            balanco: receitaTotal - totalSaidas,
        };
    }, [filteredData]);

    const chartData = useMemo(() => {
        // --- Evolução da Receita por Mês ---
        const receitaPorMes = filteredData.filteredLancamentos.reduce((acc: Record<string, number>, l: any) => {
            const month = new Date(l.dataPrevista + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
            const val = Number(l.valorRecebido || 0);
            acc[month] = (acc[month] || 0) + val;
            return acc;
        }, {} as Record<string, number>);

        const evolucaoReceita = Object.entries(receitaPorMes).map(([name, Receita]) => ({ name, Receita: Receita as number })).reverse();
        
        // --- Receita por Categoria ---
        const receitaPorCategoria = filteredData.filteredLancamentos.reduce((acc: Record<string, number>, l: any) => {
            const category = l.product?.category || 'Outros';
            // CRITICAL: Explicitly cast to Number to ensure math addition, not string concatenation
            const val = Number(l.valorRecebido || 0);
            acc[category] = (acc[category] || 0) + val;
            return acc;
        }, {} as Record<string, number>);

        const totalReceitaCategoria = (Object.values(receitaPorCategoria) as number[]).reduce((sum: number, val: number) => sum + val, 0);

        // STRICT SORTING: Sort raw data first to ensure consistent order across all visualizations
        const sortedCategoryData = Object.entries(receitaPorCategoria)
            .map(([name, value]) => ({ name, value: Number(value) }))
            .sort((a, b) => b.value - a.value);

        // Data for Pie Chart (includes % in name)
        // Since sortedCategoryData is sorted descending, this array will also be sorted descending.
        const distribuicaoCategoria = sortedCategoryData.map(item => ({ 
            name: totalReceitaCategoria > 0 ? `${item.name} (${((item.value / totalReceitaCategoria) * 100).toFixed(0)}%)` : item.name,
            value: item.value
        }));

        // Data for Bar Chart (Raw names)
        const topCategoriasValor = sortedCategoryData.map(item => ({ 
            name: item.name,
            value: item.value
        }));

        // --- Receita por Cliente ---
        const receitaPorCliente = filteredData.filteredLancamentos.reduce((acc: Record<string, number>, l: any) => {
            const client = l.client?.name || 'Desconhecido';
            const val = Number(l.valorRecebido || 0);
            acc[client] = (acc[client] || 0) + val;
            return acc;
        }, {} as Record<string, number>);
        
        const topClientes = Object.entries(receitaPorCliente)
            .map(([name, value]) => ({ name, value: Number(value) }))
            .sort((a,b) => b.value - a.value)
            .slice(0, 10);

        // --- Fluxo de Pagamentos Diário ---
        const fluxoDiario = filteredData.filteredLancamentos.reduce((acc: Record<string, number>, l: any) => {
            const val = Number(l.valorRecebido || 0);
            if (val > 0) {
                 const day = new Date(l.dataPrevista + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
                 acc[day] = (acc[day] || 0) + val;
            }
            return acc;
        }, {} as Record<string, number>);

        const fluxoPagamentos = Object.entries(fluxoDiario).map(([name, Receita]) => ({ name, Receita: Receita as number }));

        return { evolucaoReceita, distribuicaoCategoria, topCategoriasValor, topClientes, fluxoPagamentos };
    }, [filteredData]);


    const periodOptions: { value: Period, label: string }[] = [
        { value: 'all', label: 'Tudo' },
        { value: 'currentMonth', label: 'Mês Atual' },
        { value: 'lastMonth', label: 'Mês Passado' },
        { value: 'last3Months', label: 'Últimos 3 Meses' },
        { value: 'last6Months', label: 'Últimos 6 Meses' },
        { value: 'lastYear', label: 'Último Ano' },
    ];

    return (
        <div className="p-1 space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <h1 className="text-3xl font-bold text-primary-text">Painel Analítico</h1>
                <select 
                    value={period} 
                    onChange={e => setPeriod(e.target.value as Period)}
                    className="px-4 py-2 border border-border-color rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-apple-blue transition-shadow"
                >
                    {periodOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatCard title="Receita Total" value={formatCurrency(stats.receitaTotal)} icon={<ArrowUpCircleIcon className="w-6 h-6 text-apple-green"/>} />
                <StatCard title="Receita Prevista" value={formatCurrency(stats.receitaPrevista)} icon={<DollarSignIcon className="w-6 h-6 text-apple-orange"/>} />
                <StatCard title="Saídas" value={formatCurrency(stats.totalSaidas)} icon={<ArrowDownCircleIcon className="w-6 h-6 text-apple-red"/>} />
                <StatCard title="Balanço" value={formatCurrency(stats.balanco)} icon={<DollarSignIcon className="w-6 h-6 text-apple-blue"/>} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-50/70 rounded-2xl border border-border-color/50 p-6 min-h-[300px] flex flex-col">
                    <h3 className="text-lg font-semibold text-primary-text mb-4">Evolução da Receita por Mês</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData.evolucaoReceita} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis dataKey="name" tick={{ fill: '#6B7280' }} fontSize={12} />
                            <YAxis tickFormatter={val => formatCurrency(Number(val) || 0).replace('R$', '')} tick={{ fill: '#6B7280' }} fontSize={12} />
                            <Tooltip content={<CustomTooltip />} />
                            <Line type="monotone" dataKey="Receita" stroke="#007AFF" strokeWidth={2} dot={{ r: 4, fill: '#007AFF' }} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                
                 <div className="bg-gray-50/70 rounded-2xl border border-border-color/50 p-6 min-h-[300px] flex flex-col">
                    <h3 className="text-lg font-semibold text-primary-text mb-4">Distribuição por Categoria</h3>
                     <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie 
                                data={chartData.distribuicaoCategoria} 
                                dataKey="value" 
                                cx="50%" 
                                cy="50%" 
                                innerRadius={60}
                                outerRadius={90}
                                paddingAngle={5}
                            >
                                {chartData.distribuicaoCategoria.map((entry, index) => <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} strokeWidth={0} />)}
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
                </div>

                <div className="bg-gray-50/70 rounded-2xl border border-border-color/50 p-6 min-h-[300px] flex flex-col">
                    <h3 className="text-lg font-semibold text-primary-text mb-4">Top Categorias por Receita</h3>
                    <ResponsiveContainer width="100%" height={300}>
                       <BarChart data={chartData.topCategoriasValor} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                            <XAxis type="number" tickFormatter={val => formatCurrency(Number(val) || 0).replace('R$', '')} fontSize={12} />
                            <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar 
                                dataKey="value" 
                                name="Receita" 
                                barSize={20}
                                label={{ 
                                    position: 'right', 
                                    fill: '#6B7280', 
                                    fontSize: 12,
                                    formatter: (value: number) => formatCurrency(value)
                                }}
                            >
                                {chartData.topCategoriasValor.map((entry, index) => <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-gray-50/70 rounded-2xl border border-border-color/50 p-6 min-h-[300px] flex flex-col">
                    <h3 className="text-lg font-semibold text-primary-text mb-4">Top Clientes por Receita</h3>
                    <ResponsiveContainer width="100%" height={300}>
                       <BarChart data={chartData.topClientes} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                            <XAxis type="number" tickFormatter={val => formatCurrency(Number(val) || 0).replace('R$', '')} fontSize={12} />
                            <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="value" name="Receita" barSize={20} fill="#34C759" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                 <div className="lg:col-span-2 bg-gray-50/70 rounded-2xl border border-border-color/50 p-6 min-h-[300px] flex flex-col">
                    <h3 className="text-lg font-semibold text-primary-text mb-4">Fluxo de Pagamentos Diário</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData.fluxoPagamentos} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis dataKey="name" tick={{ fill: '#6B7280' }} fontSize={12} />
                            <YAxis tickFormatter={val => formatCurrency(Number(val) || 0).replace('R$', '')} tick={{ fill: '#6B7280' }} fontSize={12} />
                            <Tooltip content={<CustomTooltip />} />
                            <Line type="monotone" dataKey="Receita" stroke="#FF9500" strokeWidth={2} dot={{ r: 4, fill: '#FF9500' }} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

            </div>
        </div>
    );
};
