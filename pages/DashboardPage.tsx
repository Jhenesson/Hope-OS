
import React, { useMemo } from 'react';
import { LeadStatus, CalendarEvent, Client, Product, RecordingStatus, Page, Recording } from '../types';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import { LeadsIcon, ClientsIcon, ProjectsIcon, DollarSignIcon, RecordingsIcon, CalendarIcon, BellIcon, PhoneIcon } from '../components/icons/Icons';
import { AbstractAvatar } from '../components/AbstractAvatar';
import { useAppContext } from '../context/AppContext';

// --- Reusable StatCard Component ---
interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
}
const StatCard: React.FC<StatCardProps> = ({ title, value, icon }) => (
    <div className="bg-white rounded-2xl border border-border-color shadow-sm p-6 flex items-start justify-between">
        <div>
            <p className="text-sm font-medium text-secondary-text">{title}</p>
            <p className="text-3xl font-bold text-primary-text mt-2">{value}</p>
        </div>
        <div className="bg-gray-100 rounded-full p-2">
            {icon}
        </div>
    </div>
);

interface DashboardPageProps {
    setActivePage: (page: Page) => void;
}

// --- DashboardPage Component ---
export const DashboardPage: React.FC<DashboardPageProps> = ({ setActivePage }) => {
    const { appState } = useAppContext();
    const { leads, clients, financials, recordings, products } = appState;
    
    // --- Data Computations ---
    const newLeadsCount = useMemo(() => leads.filter(l => l.status === LeadStatus.Novo).length, [leads]);
    const activeClientsCount = useMemo(() => clients.filter(c => c.status === 'Active').length, [clients]);
    
    const { totalIncome, totalExpense } = useMemo(() => {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const monthlyData = financials.filter(t => {
            const tDate = new Date(t.date + 'T00:00:00');
            return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
        });
        const income = monthlyData.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expense = monthlyData.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        return { totalIncome: income, totalExpense: expense };
    }, [financials]);

    const upcomingRecordings = useMemo(() => {
        const now = new Date();
        const clientsById = clients.reduce((acc, client) => ({ ...acc, [client.id]: client }), {} as Record<string, Client>);
        const productsById = products.reduce((acc, product) => ({ ...acc, [product.id]: product }), {} as Record<string, Product>);

        return recordings
            .filter(rec => {
                if (!rec.data || !rec.horaInicio) return false;
                const recDateTime = new Date(`${rec.data}T${rec.horaInicio}`);
                return recDateTime > now && rec.status === RecordingStatus.Agendada;
            })
            .sort((a, b) => {
                const dateA = new Date(`${a.data}T${a.horaInicio}`);
                const dateB = new Date(`${b.data}T${b.horaInicio}`);
                return dateA.getTime() - dateB.getTime();
            })
            .map(rec => ({
                ...rec,
                client: clientsById[rec.clientId],
                product: productsById[rec.productId],
            }));
    }, [recordings, clients, products]);

    const groupedUpcomingRecordings = useMemo(() => {
        type Grouped = Record<string, (Recording & { client?: Client; product?: Product })[]>;
        const groups: Grouped = {};

        upcomingRecordings.slice(1).forEach(rec => {
            const dateStr = new Date(rec.data + 'T12:00:00').toLocaleDateString('pt-BR', {
                weekday: 'long',
                day: '2-digit',
                month: 'long'
            });
            if (!groups[dateStr]) {
                groups[dateStr] = [];
            }
            groups[dateStr].push(rec);
        });
        return groups;
    }, [upcomingRecordings]);
    
    const nextRecording = upcomingRecordings[0];

    const recentLeads = useMemo(() => leads.slice(0, 5), [leads]);

    // --- Leads to Contact Today ---
    const leadsToContactToday = useMemo(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        return leads.filter(lead => lead.nextFollowUp === todayStr);
    }, [leads]);
    
    const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    const chartData = [{ name: 'Este Mês', Receita: totalIncome, Despesas: totalExpense }];

    return (
        <div className="flex flex-col gap-6">
            <h2 className="text-3xl font-bold text-primary-text">Início</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatCard title="Novos Leads" value={newLeadsCount} icon={<LeadsIcon className="w-6 h-6 text-blue-500" />} />
                <StatCard title="Clientes Ativos" value={activeClientsCount} icon={<ClientsIcon className="w-6 h-6 text-green-500" />} />
                <StatCard title="Projetos em Andamento" value="8" icon={<ProjectsIcon className="w-6 h-6 text-purple-500" />} />
                <StatCard title="Faturamento do Mês" value={formatCurrency(totalIncome)} icon={<DollarSignIcon className="w-6 h-6 text-yellow-500" />} />
            </div>
            
            {/* --- Today's Calls / Schedule Section --- */}
            {leadsToContactToday.length > 0 && (
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl border border-orange-200 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-orange-100 p-2 rounded-full">
                            <BellIcon className="w-5 h-5 text-orange-600" />
                        </div>
                        <h3 className="text-lg font-bold text-primary-text">Contatos Agendados para Hoje</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {leadsToContactToday.map(lead => (
                            <div key={lead.id} className="bg-white p-4 rounded-xl border border-orange-100 shadow-sm flex flex-col justify-between">
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <h4 className="font-bold text-primary-text">{lead.name}</h4>
                                        <p className="text-xs text-secondary-text">{lead.company}</p>
                                    </div>
                                    <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Ligar</span>
                                </div>
                                {lead.notes && (
                                    <p className="text-sm text-secondary-text bg-gray-50 p-2 rounded-lg mb-3 italic truncate">
                                        "{lead.notes}"
                                    </p>
                                )}
                                <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
                                    <div className="flex items-center gap-1 text-secondary-text text-xs">
                                        <PhoneIcon className="w-3 h-3" />
                                        <span>{lead.whatsapp || 'Sem número'}</span>
                                    </div>
                                    <button 
                                        onClick={() => setActivePage('Marketing')}
                                        className="text-xs font-bold text-apple-blue hover:underline"
                                    >
                                        Ver Lead →
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                <div className="lg:col-span-1 bg-white rounded-2xl border border-border-color shadow-sm p-6">
                     <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-primary-text">Próximas Gravações</h3>
                        <button onClick={() => setActivePage('Gravações')} className="text-sm font-medium text-apple-blue hover:underline">
                            Ver tudo
                        </button>
                    </div>
                    <div className="space-y-4">
                        {nextRecording ? (
                           <>
                                <div className="bg-blue-50 border-2 border-apple-blue/50 rounded-xl p-4">
                                    <p className="text-xs font-bold text-apple-blue uppercase mb-2">A SEGUIR</p>
                                    <div className="flex items-center gap-3">
                                        <AbstractAvatar name={nextRecording.client?.name || ''} gender={nextRecording.client?.gender || 'female'} size={40} />
                                        <div>
                                            <p className="font-semibold text-primary-text">{nextRecording.client?.name}</p>
                                            <p className="text-sm text-secondary-text">{nextRecording.product?.name}</p>
                                        </div>
                                    </div>
                                    <div className="mt-3 text-center bg-white/60 rounded-lg p-2">
                                        <p className="text-sm font-bold text-primary-text">{new Date(nextRecording.data + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' })}</p>
                                        <p className="text-sm font-medium text-secondary-text">{nextRecording.horaInicio} - {nextRecording.horaFim}</p>
                                    </div>
                                </div>
                                
                                {Object.keys(groupedUpcomingRecordings).map((date) => {
                                    const recs = groupedUpcomingRecordings[date];
                                    return (
                                        <div key={date}>
                                            <p className="font-semibold text-sm text-secondary-text my-3">{date}</p>
                                            <div className="space-y-3">
                                                {recs.map(rec => (
                                                    <div key={rec.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50/70">
                                                        <div className="font-mono text-xs text-center text-secondary-text border-r border-border-color pr-3">
                                                            <div>{rec.horaInicio}</div>
                                                            <div>às</div>
                                                            <div>{rec.horaFim}</div>
                                                        </div>
                                                        <AbstractAvatar name={rec.client?.name || ''} gender={rec.client?.gender || 'female'} size={32} />
                                                        <div>
                                                            <p className="font-medium text-sm text-primary-text">{rec.client?.name}</p>
                                                            <p className="text-xs text-secondary-text">{rec.product?.name}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}

                           </>
                        ) : (
                           <div className="flex flex-col items-center justify-center text-center h-full py-8">
                                <CalendarIcon className="w-10 h-10 text-gray-300 mb-2" />
                                <p className="text-sm text-secondary-text">Nenhuma gravação futura agendada.</p>
                           </div>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-2 flex flex-col gap-6">
                    
                    <div className="bg-white rounded-2xl border border-border-color shadow-sm p-6">
                        <h3 className="text-lg font-semibold text-primary-text mb-4">Leads Recentes</h3>
                        <div className="space-y-3">
                            {recentLeads.map(lead => (
                                <div key={lead.id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <AbstractAvatar name={lead.name} gender={lead.gender} size={40} />
                                        <div>
                                            <p className="font-medium text-primary-text">{lead.name}</p>
                                            <p className="text-sm text-secondary-text">{lead.company}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-secondary-text">{lead.lastContact}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-border-color shadow-sm p-6 h-64 flex flex-col">
                         <h3 className="text-lg font-semibold text-primary-text mb-4">Visão Financeira</h3>
                         <div className="flex-1">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#6B7280' }} />
                                    <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => formatCurrency(Number(value) || 0).replace('R$', '')} tick={{ fill: '#6B7280' }} />
                                    <Tooltip contentStyle={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: '0.5rem' }} formatter={(value) => formatCurrency(Number(value) || 0)} />
                                    <Bar dataKey="Receita" fill="#34C759" radius={[4, 4, 0, 0]} barSize={30} />
                                    <Bar dataKey="Despesas" fill="#FF3B30" radius={[4, 4, 0, 0]} barSize={30} />
                                </BarChart>
                            </ResponsiveContainer>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
