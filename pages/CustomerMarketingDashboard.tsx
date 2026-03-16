
import React, { useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { sendWhatsAppMessage } from '../utils/whatsapp';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AbstractAvatar } from '../components/AbstractAvatar';
import { RocketIcon, TrendingUpIcon, CalendarIcon, PhoneIcon } from '../components/icons/Icons';

const CHART_COLORS = ['#007AFF', '#34C759', '#FF9500', '#AF52DE', '#FF2D55'];

export const CustomerMarketingDashboard: React.FC = () => {
    const { appState } = useAppContext();
    const { clients, recordings, lancamentos } = appState;

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    // --- Intelligence Logic ---

    const customerLTV = useMemo(() => {
        const stats = clients.map(client => {
            const clientLancamentos = lancamentos.filter(l => l.clienteId === client.id);
            const totalSpent = clientLancamentos.reduce((sum, l) => sum + l.valorRecebido, 0);
            const projectsCount = recordings.filter(r => r.clientId === client.id).length;
            const lastProject = recordings
                .filter(r => r.clientId === client.id)
                .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())[0];

            return {
                ...client,
                ltv: totalSpent,
                projectsCount,
                lastDate: lastProject ? new Date(lastProject.data) : null,
                daysSinceLast: lastProject ? Math.floor((new Date().getTime() - new Date(lastProject.data).getTime()) / (1000 * 60 * 60 * 24)) : 999
            };
        });

        return stats.sort((a, b) => b.ltv - a.ltv);
    }, [clients, lancamentos, recordings]);

    const topCustomersChart = useMemo(() => {
        return customerLTV.slice(0, 10).map(c => ({ name: c.name, ltv: c.ltv }));
    }, [customerLTV]);

    const recurrenceStats = useMemo(() => {
        const recurring = customerLTV.filter(c => c.projectsCount > 1).length;
        const single = customerLTV.filter(c => c.projectsCount === 1).length;
        return [
            { name: 'Recorrentes', value: recurring },
            { name: 'Único Projeto', value: single }
        ];
    }, [customerLTV]);

    const inactiveAlerts = useMemo(() => {
        return customerLTV
            .filter(c => c.projectsCount > 0 && c.daysSinceLast > 90 && c.daysSinceLast < 365)
            .sort((a, b) => b.daysSinceLast - a.daysSinceLast)
            .slice(0, 5);
    }, [customerLTV]);

    // --- AI Suggestions (The "Brain") ---
    const aiSuggestions = useMemo(() => {
        const suggestions = [];

        // Best Customer Suggestion
        const best = customerLTV[0];
        if (best && best.ltv > 0) {
            suggestions.push({
                type: 'VIP',
                title: 'Ação VIP: Fidelidade Máxima',
                description: `${best.name} é seu cliente nº 1. Que tal oferecer um "Day-Off" de estúdio ou um brinde exclusivo para fortalecer a parceria?`,
                target: best
            });
        }

        // Churn Alert Suggestion
        const churn = inactiveAlerts[0];
        if (churn) {
            suggestions.push({
                type: 'REHEAT',
                title: 'Reaquecimento de Lead',
                description: `${churn.name} não grava há ${churn.daysSinceLast} dias. Envie o template de WhatsApp "Saudades do Estúdio" com uma condição especial para este mês.`,
                target: churn
            });
        }

        // High Frequency Suggestion
        const frequent = customerLTV.find(c => c.projectsCount >= 3);
        if (frequent) {
            suggestions.push({
                type: 'PACK',
                title: 'Oportunidade de Pacote',
                description: `${frequent.name} grava com frequência elevada. Ofereça um pacote pré-pago de 5 sessões para garantir sua agenda nos próximos meses.`,
                target: frequent
            });
        }

        return suggestions;
    }, [customerLTV, inactiveAlerts]);

    return (
        <div className="space-y-8 animate-fadeIn h-full overflow-y-auto custom-scrollbar pr-2">
            
            {/* AI HOPE BRAIN SECTION */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {aiSuggestions.map((sug, i) => (
                    <div key={i} className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <RocketIcon className="w-20 h-20" />
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full mb-3 inline-block ${
                            sug.type === 'VIP' ? 'bg-amber-500' : sug.type === 'REHEAT' ? 'bg-apple-blue' : 'bg-apple-green'
                        }`}>
                            Sugestão da IA
                        </span>
                        <h4 className="text-lg font-bold mb-2">{sug.title}</h4>
                        <p className="text-sm text-gray-400 mb-6 leading-relaxed">{sug.description}</p>
                        <button 
                            onClick={async () => { await sendWhatsAppMessage(sug.target.whatsapp, '', appState.whatsappSendMethod); }}
                            className="flex items-center gap-2 text-xs font-bold bg-white/10 hover:bg-white/20 transition-colors px-4 py-2 rounded-xl border border-white/10"
                        >
                            <PhoneIcon className="w-3 h-3" /> Falar com {sug.target.name.split(' ')[0]}
                        </button>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* LTV Ranking Chart */}
                <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-border-color shadow-sm p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-bold text-primary-text">Ranking de Clientes (LTV)</h3>
                            <p className="text-sm text-secondary-text">Clientes que geraram mais receita historicamente</p>
                        </div>
                        <div className="p-3 bg-green-50 rounded-2xl text-apple-green">
                            <TrendingUpIcon className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topCustomersChart} layout="vertical" margin={{ left: 30 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F3F4F6" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} fontSize={12} width={100} />
                                <Tooltip 
                                    formatter={(val: number) => formatCurrency(val)} 
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                />
                                <Bar dataKey="ltv" fill="#007AFF" radius={[0, 8, 8, 0]} barSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Recurrence Chart */}
                <div className="bg-white rounded-[2.5rem] border border-border-color shadow-sm p-8">
                    <h3 className="text-xl font-bold text-primary-text mb-2">Fidelidade</h3>
                    <p className="text-sm text-secondary-text mb-8">Taxa de retorno vs. Novos</p>
                    <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie 
                                    data={recurrenceStats} 
                                    innerRadius={70} 
                                    outerRadius={90} 
                                    paddingAngle={8} 
                                    dataKey="value"
                                    strokeWidth={0}
                                >
                                    {recurrenceStats.map((_, index) => <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="space-y-3 mt-4">
                        {recurrenceStats.map((stat, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i] }}></div>
                                    <span className="text-sm font-medium text-secondary-text">{stat.name}</span>
                                </div>
                                <span className="text-sm font-bold text-primary-text">{stat.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Inactivity Alerts Table */}
            <div className="bg-white rounded-[2.5rem] border border-border-color shadow-sm p-8">
                <div className="flex items-center gap-3 mb-6">
                    <CalendarIcon className="w-6 h-6 text-apple-orange" />
                    <h3 className="text-xl font-bold text-primary-text">Clientes em Risco (Esfriando)</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left border-b border-gray-100">
                                <th className="pb-4 text-xs font-black text-secondary-text uppercase tracking-widest">Cliente</th>
                                <th className="pb-4 text-xs font-black text-secondary-text uppercase tracking-widest">Última Gravação</th>
                                <th className="pb-4 text-xs font-black text-secondary-text uppercase tracking-widest">Tempo Inativo</th>
                                <th className="pb-4 text-xs font-black text-secondary-text uppercase tracking-widest">LTV Acumulado</th>
                                <th className="pb-4 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {inactiveAlerts.map(client => (
                                <tr key={client.id} className="group hover:bg-gray-50/50 transition-colors">
                                    <td className="py-4">
                                        <div className="flex items-center gap-3">
                                            <AbstractAvatar name={client.name} gender={client.gender} size={32} />
                                            <span className="font-bold text-primary-text">{client.name}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 text-sm text-secondary-text">
                                        {client.lastDate?.toLocaleDateString('pt-BR')}
                                    </td>
                                    <td className="py-4">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                                            client.daysSinceLast > 180 ? 'bg-red-50 text-red-700' : 'bg-orange-50 text-orange-700'
                                        }`}>
                                            {client.daysSinceLast} dias
                                        </span>
                                    </td>
                                    <td className="py-4 font-bold text-primary-text">
                                        {formatCurrency(client.ltv)}
                                    </td>
                                    <td className="py-4 text-right">
                                        <button 
                                            onClick={async () => { await sendWhatsAppMessage(client.whatsapp, '', appState.whatsappSendMethod); }}
                                            className="p-2 rounded-full bg-green-50 text-green-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Tentar contato"
                                        >
                                            <PhoneIcon className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
