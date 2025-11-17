

import React, { useMemo } from 'react';
import { MOCK_LEADS, MOCK_CLIENTS, MOCK_CALENDAR_EVENTS, MOCK_FINANCIAL_DATA } from '../constants';
import { LeadStatus, CalendarEvent } from '../types';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { LeadsIcon, ClientsIcon, ProjectsIcon, DollarSignIcon, VideoIcon } from '../components/icons/Icons';
import { AbstractAvatar } from '../components/AbstractAvatar';

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

// --- DashboardPage Component ---
export const DashboardPage: React.FC = () => {
    
    // --- Data Computations ---
    const newLeadsCount = useMemo(() => MOCK_LEADS.filter(l => l.status === LeadStatus.Novo).length, []);
    const activeClientsCount = useMemo(() => MOCK_CLIENTS.filter(c => c.status === 'Active').length, []);
    
    const { totalIncome, totalExpense } = useMemo(() => {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const monthlyData = MOCK_FINANCIAL_DATA.filter(t => {
            const tDate = new Date(t.date);
            return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
        });
        const income = monthlyData.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expense = monthlyData.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        return { totalIncome: income, totalExpense: expense };
    }, []);

    const upcomingEvents = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return MOCK_CALENDAR_EVENTS
            .filter(event => new Date(event.date + 'T12:00:00') >= today)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(0, 4);
    }, []);

    const { todaysRecordings, thisWeeksRecordings } = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Start of today
        const todayString = today.toDateString();

        const endOfWeek = new Date(today);
        endOfWeek.setDate(today.getDate() + 7); // Up to 7 days from now

        const todays: CalendarEvent[] = [];
        const thisWeeks: CalendarEvent[] = [];

        MOCK_CALENDAR_EVENTS.forEach(event => {
            // Add T12:00:00 to avoid timezone issues where the date might be interpreted as the previous day
            const eventDate = new Date(event.date + 'T12:00:00');
            eventDate.setHours(0, 0, 0, 0);

            if (eventDate.toDateString() === todayString) {
                todays.push(event);
            }

            if (eventDate >= today && eventDate < endOfWeek) {
                thisWeeks.push(event);
            }
        });
        
        thisWeeks.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        return { todaysRecordings: todays, thisWeeksRecordings: thisWeeks };
    }, []);

    const recentLeads = useMemo(() => MOCK_LEADS.slice(0, 5), []);
    
    const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    const chartData = [{ name: 'Este Mês', Receita: totalIncome, Despesas: totalExpense }];

    const eventColors = {
        blue: 'bg-blue-500',
        green: 'bg-green-500',
        red: 'bg-red-500',
        yellow: 'bg-yellow-500',
    };

    return (
        <div className="flex flex-col gap-6">
            <h2 className="text-3xl font-bold text-primary-text">Início</h2>
            
            {/* --- Stat Cards Grid --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatCard title="Novos Leads" value={newLeadsCount} icon={<LeadsIcon className="w-6 h-6 text-blue-500" />} />
                <StatCard title="Clientes Ativos" value={activeClientsCount} icon={<ClientsIcon className="w-6 h-6 text-green-500" />} />
                <StatCard title="Projetos em Andamento" value="8" icon={<ProjectsIcon className="w-6 h-6 text-purple-500" />} />
                <StatCard title="Faturamento do Mês" value={formatCurrency(totalIncome)} icon={<DollarSignIcon className="w-6 h-6 text-yellow-500" />} />
            </div>

             {/* --- Recording Sessions --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-border-color shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-primary-text mb-4">Gravações de Hoje</h3>
                    <div className="space-y-4">
                        {todaysRecordings.length > 0 ? todaysRecordings.map(event => (
                            <div key={event.id} className="flex items-start gap-4">
                                <div className={`w-1.5 h-full rounded-full ${eventColors[event.color]} min-h-[40px]`}></div>
                                <div>
                                    <p className="font-medium text-primary-text">{event.title}</p>
                                    <p className="text-sm text-secondary-text">{event.description}</p>
                                </div>
                            </div>
                        )) : (
                           <div className="flex flex-col items-center justify-center text-center h-full py-8">
                                <VideoIcon className="w-10 h-10 text-gray-300 mb-2" />
                                <p className="text-sm text-secondary-text">Nenhuma gravação para hoje.</p>
                           </div>
                        )}
                    </div>
                </div>
                <div className="bg-white rounded-2xl border border-border-color shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-primary-text mb-4">Gravações da Semana</h3>
                    <div className="space-y-4">
                        {thisWeeksRecordings.length > 0 ? thisWeeksRecordings.map(event => (
                            <div key={event.id} className="flex items-center justify-between">
                                <div className="flex items-start gap-4">
                                    <div className={`w-1.5 h-full rounded-full ${eventColors[event.color]} min-h-[40px]`}></div>
                                    <div>
                                        <p className="font-medium text-primary-text">{event.title}</p>
                                        <p className="text-sm text-secondary-text">{event.description}</p>
                                    </div>
                                </div>
                                <span className="text-xs text-secondary-text whitespace-nowrap pl-2">
                                    {new Date(event.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short' })}
                                </span>
                            </div>
                        )) : (
                            <div className="flex flex-col items-center justify-center text-center h-full py-8">
                                <VideoIcon className="w-10 h-10 text-gray-300 mb-2" />
                                <p className="text-sm text-secondary-text">Nenhuma gravação agendada.</p>
                           </div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- Main Content Grid --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Upcoming Deadlines */}
                <div className="lg:col-span-1 bg-white rounded-2xl border border-border-color shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-primary-text mb-4">Próximos Prazos</h3>
                    <div className="space-y-4">
                        {upcomingEvents.length > 0 ? upcomingEvents.map(event => (
                            <div key={event.id} className="flex items-start gap-4">
                                <div className={`w-1.5 h-10 rounded-full ${eventColors[event.color]}`}></div>
                                <div>
                                    <p className="font-medium text-primary-text">{event.title}</p>
                                    <p className="text-sm text-secondary-text">{new Date(event.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' })}</p>
                                </div>
                            </div>
                        )) : (
                           <p className="text-sm text-secondary-text">Nenhum evento próximo.</p> 
                        )}
                    </div>
                </div>

                {/* Recent Leads & Financial Overview */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    
                    {/* Recent Leads */}
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

                    {/* Financial Chart */}
                    <div className="bg-white rounded-2xl border border-border-color shadow-sm p-6 h-64 flex flex-col">
                         <h3 className="text-lg font-semibold text-primary-text mb-4">Visão Financeira</h3>
                         <div className="flex-1">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#6B7280' }} />
                                    <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => formatCurrency(value as number).replace('R$', '')} tick={{ fill: '#6B7280' }} />
                                    <Tooltip contentStyle={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: '0.5rem' }} formatter={(value) => formatCurrency(value as number)} />
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