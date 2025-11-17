import React, { useState, useMemo } from 'react';
import { MOCK_CALENDAR_EVENTS } from '../constants';
import { CalendarEvent } from '../types';
import { Modal } from '../components/Modal';

const eventColors = {
    blue: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-500' },
    green: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-500' },
    red: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-500' },
    yellow: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-500' },
};

const GoogleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48px" height="48px">
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.99,36.62,44,31.023,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
    </svg>
);


export const CalendarPage: React.FC = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

    const daysInMonth = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const days = [];
        // Add padding for days before the 1st
        for (let i = 0; i < firstDay.getDay(); i++) {
            days.push(null);
        }
        // Add days of the month
        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push(new Date(year, month, i));
        }
        return days;
    }, [currentDate]);

    const eventsByDate = useMemo(() => {
        return MOCK_CALENDAR_EVENTS.reduce((acc, event) => {
            const date = event.date;
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(event);
            return acc;
        }, {} as Record<string, CalendarEvent[]>);
    }, []);

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    if (!isConnected) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center bg-white rounded-2xl border border-border-color shadow-sm p-8">
                <GoogleIcon className="w-16 h-16 mb-4" />
                <h2 className="text-2xl font-bold text-primary-text">Sincronize seu Calendário</h2>
                <p className="mt-2 max-w-md text-secondary-text">
                    Conecte sua conta do Google Agenda para visualizar todos os seus compromissos, tarefas e prazos de projetos em um só lugar.
                </p>
                <button
                    onClick={() => setIsConnected(true)}
                    className="mt-6 rounded-full px-6 py-3 bg-apple-blue text-white font-semibold hover:bg-apple-blue-hover transition-colors flex items-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                    Conectar com Google Agenda
                </button>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <h2 className="text-3xl font-bold text-primary-text">
                        {currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase())}
                    </h2>
                    <div className="flex items-center gap-1">
                        <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-gray-100 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
                        <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-gray-100 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></button>
                    </div>
                </div>
                <button className="rounded-full px-5 py-2 bg-apple-blue text-white font-medium hover:bg-apple-blue-hover transition-colors">
                    Adicionar Evento
                </button>
            </div>
            <div className="flex-1 bg-white rounded-2xl border border-border-color shadow-sm p-4">
                <div className="grid grid-cols-7 gap-px">
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                        <div key={day} className="text-center text-xs font-semibold text-secondary-text py-2">{day}</div>
                    ))}
                    {daysInMonth.map((day, index) => {
                        const dateKey = day ? `${day.getFullYear()}-${(day.getMonth() + 1).toString().padStart(2, '0')}-${day.getDate().toString().padStart(2, '0')}` : '';
                        const dayEvents = day ? eventsByDate[dateKey] || [] : [];
                        const isToday = day && day.toDateString() === new Date().toDateString();

                        return (
                            <div key={index} className="h-32 bg-gray-50/30 rounded-lg p-1.5 flex flex-col">
                                {day && (
                                    <>
                                        <span className={`text-xs font-semibold ${isToday ? 'bg-apple-blue text-white rounded-full flex items-center justify-center w-5 h-5' : 'text-primary-text'}`}>{day.getDate()}</span>
                                        <div className="mt-1 space-y-1 overflow-y-auto">
                                            {dayEvents.map(event => (
                                                <button key={event.id} onClick={() => setSelectedEvent(event)} className={`w-full text-left text-xs font-medium p-1 rounded ${eventColors[event.color].bg} ${eventColors[event.color].text} border-l-2 ${eventColors[event.color].border} truncate`}>
                                                    {event.title}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
             {selectedEvent && (
                <Modal isOpen={!!selectedEvent} onClose={() => setSelectedEvent(null)} title={selectedEvent.title}>
                    <div className="space-y-4">
                        <p className="text-secondary-text">{selectedEvent.description}</p>
                        <div className="flex items-center justify-between pt-4 border-t border-border-color mt-4">
                            {/* Fix: Changed event.source to selectedEvent.source to correctly reference the selected event object. */}
                            <span className={`px-2.5 py-1 text-sm font-semibold rounded-full ${selectedEvent.source === 'Google' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                               {selectedEvent.source === 'Google' ? 'Google Agenda' : 'Hope OS'}
                            </span>
                            <p className="text-lg font-medium text-primary-text">{new Date(selectedEvent.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}</p>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};
