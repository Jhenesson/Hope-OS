
import React, { useState, useMemo } from 'react';
import { useFinanceData } from '../context/FinanceDataContext';
import { LancamentoFinanceiro, ProductCategory } from '../../../types';
import { Modal } from '../../../components/Modal';

const categoryColors: { [key in ProductCategory]: string } = {
    [ProductCategory.VideoAcustico]: 'bg-red-100 text-red-800 border-red-500',
    [ProductCategory.VideoBanda]: 'bg-red-100 text-red-800 border-red-500',
    [ProductCategory.HopeSession]: 'bg-orange-100 text-orange-800 border-orange-500',
    [ProductCategory.PocketShow]: 'bg-pink-100 text-pink-800 border-pink-500',
    [ProductCategory.DrumDay]: 'bg-purple-100 text-purple-800 border-purple-500',
    [ProductCategory.ProducaoMusical]: 'bg-purple-100 text-purple-800 border-purple-500',
    [ProductCategory.Gravacao]: 'bg-blue-100 text-blue-800 border-blue-500',
    [ProductCategory.PosProducaoAudio]: 'bg-yellow-100 text-yellow-800 border-yellow-500',
};

const getCategoryColor = (category?: ProductCategory) => {
    if (category && categoryColors[category]) {
        return categoryColors[category];
    }
    return 'bg-gray-100 text-gray-800 border-gray-500';
}

export const CalendarioPage: React.FC = () => {
    const { lancamentos } = useFinanceData();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedLanc, setSelectedLanc] = useState<LancamentoFinanceiro | null>(null);

    const daysInMonth = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const days = [];
        for (let i = 0; i < firstDay.getDay(); i++) { days.push(null); }
        for (let i = 1; i <= lastDay.getDate(); i++) { days.push(new Date(year, month, i)); }
        return days;
    }, [currentDate]);

    const eventsByDate = useMemo(() => {
        return lancamentos.reduce((acc, event) => {
            const date = event.dataPrevista;
            if (!acc[date]) { acc[date] = []; }
            acc[date].push(event);
            return acc;
        }, {} as Record<string, LancamentoFinanceiro[]>);
    }, [lancamentos]);
    
    return (
        <div className="p-1">
            <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="text-xl font-semibold text-primary-text">Calendário Financeiro</h3>
                <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-2 rounded-full hover:bg-gray-100 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
                    <span className="font-semibold text-primary-text w-32 text-center">{currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase())}</span>
                    <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-2 rounded-full hover:bg-gray-100 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></button>
                </div>
            </div>
             <div className="grid grid-cols-7 gap-px">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => <div key={day} className="text-center text-xs font-semibold text-secondary-text py-2">{day}</div>)}
                {daysInMonth.map((day, index) => {
                    const dateKey = day ? `${day.getFullYear()}-${(day.getMonth() + 1).toString().padStart(2, '0')}-${day.getDate().toString().padStart(2, '0')}` : '';
                    const dayEvents = day ? eventsByDate[dateKey] || [] : [];
                    const isToday = day && day.toDateString() === new Date().toDateString();
                    return (
                        <div key={index} className="h-28 bg-gray-50/30 rounded-lg p-1.5 flex flex-col">
                            {day && <>
                                <span className={`text-xs font-semibold ${isToday ? 'bg-apple-blue text-white rounded-full flex items-center justify-center w-5 h-5' : 'text-primary-text'}`}>{day.getDate()}</span>
                                <div className="mt-1 space-y-1 overflow-y-auto">
                                    {dayEvents.map(event => (
                                        <button key={event.id} onClick={() => setSelectedLanc(event)} className={`w-full text-left text-xs font-medium p-1 rounded border-l-2 ${getCategoryColor(event.product?.category)} truncate`}>
                                            {event.client?.name}
                                        </button>
                                    ))}
                                </div>
                            </>}
                        </div>
                    );
                })}
            </div>
            
            {selectedLanc && (
                <Modal isOpen={!!selectedLanc} onClose={() => setSelectedLanc(null)} title="Detalhes do Lançamento">
                    <div className="space-y-4">
                        <p><strong>Cliente:</strong> {selectedLanc.client?.name}</p>
                        <p><strong>Produto:</strong> {selectedLanc.product?.name}</p>
                        <p><strong>Valor Previsto:</strong> {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedLanc.valorPrevisto)}</p>
                        <p><strong>Status:</strong> {selectedLanc.statusPagamento}</p>
                    </div>
                </Modal>
            )}
        </div>
    );
};