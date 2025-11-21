
import React, { useState, useMemo, useEffect } from 'react';
import { Event, EventInterest, EventInterestStatus, Client, StatusPagamento } from '../types';
import { Modal } from '../components/Modal';
import { AbstractAvatar } from '../components/AbstractAvatar';
import { EventsIcon as PageIcon, CalendarIcon, SettingsIcon, TrashIcon, DollarSignIcon, CheckIcon } from '../components/icons/Icons';
import { useAppContext } from '../context/AppContext';
import { FinanceDataProvider, useFinanceData } from '../modules/financeiro/context/FinanceDataContext';

const interestStatusColors: { [key in EventInterestStatus]: string } = {
    [EventInterestStatus.Interessado]: 'bg-yellow-100 text-yellow-800',
    [EventInterestStatus.Confirmado]: 'bg-green-100 text-green-800',
    [EventInterestStatus.Compareceu]: 'bg-blue-100 text-blue-800',
};

const EditIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
);

// --- Event Payment Modal Component ---
interface EventPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    client: Client;
    event: Event;
}

const EventPaymentModal: React.FC<EventPaymentModalProps> = ({ isOpen, onClose, client, event }) => {
    const { addLancamento, products } = useFinanceData();
    const [matchedProductId, setMatchedProductId] = useState('');
    const [amountTotal, setAmountTotal] = useState(0);
    const [amountPaid, setAmountPaid] = useState(0);
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [paymentOption, setPaymentOption] = useState<'25' | '50' | '100' | 'custom'>('25');

    // Helper to parse price string like "R$ 1.500,00" or "R$ 350" to number
    const parsePrice = (priceString: string): number => {
        if (!priceString) return 0;
        // Remove non-numeric characters except comma and dot, then normalize
        // Assuming format is either 1.000,00 (PT-BR) or simple number
        const cleaned = priceString.replace(/[^\d,.-]/g, '').replace('.', '').replace(',', '.');
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? 0 : parsed;
    };

    const formatMoney = (value: number) => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    // Auto-detect product and price based on event name
    useEffect(() => {
        if (event && products.length > 0) {
            // Find product with matching name
            const product = products.find(p => 
                p.name.toLowerCase().includes(event.name.toLowerCase()) || 
                event.name.toLowerCase().includes(p.name.toLowerCase())
            );

            if (product) {
                setMatchedProductId(product.id);
                setAmountTotal(parsePrice(product.price));
            } else {
                setMatchedProductId('');
                setAmountTotal(0);
            }
        }
    }, [event, products]);

    // Update amountPaid when total changes or option changes
    useEffect(() => {
        if (amountTotal > 0 && paymentOption !== 'custom') {
            if (paymentOption === '25') setAmountPaid(amountTotal * 0.25);
            if (paymentOption === '50') setAmountPaid(amountTotal * 0.50);
            if (paymentOption === '100') setAmountPaid(amountTotal);
        }
    }, [amountTotal, paymentOption]);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (amountTotal <= 0) return;

        let status = StatusPagamento.AReceber;
        // Using a small epsilon for float comparison or simply >=
        if (amountPaid >= amountTotal - 0.01) status = StatusPagamento.Pago;
        else if (amountPaid > 0) status = StatusPagamento.Parcial;

        const paymentHistory = amountPaid > 0 ? [{
            id: `pay-evt-${Date.now()}`,
            data: paymentDate,
            valor: amountPaid,
            tipo: paymentOption === 'custom' ? 'Pagamento Manual' : `Entrada ${paymentOption}%`
        }] : [];

        addLancamento({
            gravacaoId: `manual-evt-${Date.now()}`, // Events don't necessarily have a 'recording', so we use a manual ID
            eventId: event.id, // CRITICAL: Link to event
            produtoId: matchedProductId || 'prod-other', // Fallback or matched product
            clienteId: client.id,
            valorPrevisto: amountTotal,
            valorRecebido: amountPaid,
            statusPagamento: status,
            dataPrevista: paymentDate,
            datasPagamentos: paymentHistory,
            observacoes: `Pagamento referente ao evento: ${event.name}`
        });

        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Registrar Pagamento do Evento">
            <form onSubmit={handleSave} className="space-y-4">
                <div className="bg-gray-50 p-3 rounded-lg border border-border-color">
                    <p className="text-sm text-secondary-text">Cliente: <span className="font-semibold text-primary-text">{client.name}</span></p>
                    <p className="text-sm text-secondary-text">Evento: <span className="font-semibold text-primary-text">{event.name}</span></p>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-secondary-text mb-1">Valor Total do Evento (R$)</label>
                    <input 
                        type="number" 
                        value={amountTotal} 
                        onChange={e => setAmountTotal(parseFloat(e.target.value) || 0)} 
                        className="w-full px-3 py-2 border border-border-color rounded-lg bg-white focus:ring-2 focus:ring-apple-blue outline-none"
                        placeholder="0.00"
                        required
                    />
                    {matchedProductId && <p className="text-xs text-green-600 mt-1">Valor sugerido com base no produto encontrado.</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-secondary-text mb-2">Selecione o Pagamento</label>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <button
                            type="button"
                            onClick={() => setPaymentOption('25')}
                            className={`p-3 rounded-xl border text-center transition-all ${paymentOption === '25' ? 'bg-apple-blue text-white border-apple-blue shadow-md' : 'bg-white border-border-color text-secondary-text hover:bg-gray-50'}`}
                        >
                            <span className="block text-xs font-medium opacity-90">Entrada 25%</span>
                            <span className="block text-lg font-bold">{formatMoney(amountTotal * 0.25)}</span>
                        </button>
                        
                        <button
                            type="button"
                            onClick={() => setPaymentOption('50')}
                            className={`p-3 rounded-xl border text-center transition-all ${paymentOption === '50' ? 'bg-apple-blue text-white border-apple-blue shadow-md' : 'bg-white border-border-color text-secondary-text hover:bg-gray-50'}`}
                        >
                             <span className="block text-xs font-medium opacity-90">Entrada 50%</span>
                             <span className="block text-lg font-bold">{formatMoney(amountTotal * 0.50)}</span>
                        </button>
                        
                        <button
                            type="button"
                            onClick={() => setPaymentOption('100')}
                            className={`p-3 rounded-xl border text-center transition-all ${paymentOption === '100' ? 'bg-apple-blue text-white border-apple-blue shadow-md' : 'bg-white border-border-color text-secondary-text hover:bg-gray-50'}`}
                        >
                             <span className="block text-xs font-medium opacity-90">Integral</span>
                             <span className="block text-lg font-bold">{formatMoney(amountTotal)}</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setPaymentOption('custom')}
                            className={`p-3 rounded-xl border text-center transition-all ${paymentOption === 'custom' ? 'bg-apple-blue text-white border-apple-blue shadow-md' : 'bg-white border-border-color text-secondary-text hover:bg-gray-50'}`}
                        >
                             <span className="block text-xs font-medium opacity-90">Outro</span>
                             <span className="block text-lg font-bold">Manual</span>
                        </button>
                    </div>

                    {paymentOption === 'custom' && (
                        <div className="animate-fadeIn">
                             <label className="block text-xs font-medium text-secondary-text mb-1">Digite o Valor (R$)</label>
                            <input 
                                type="number" 
                                value={amountPaid} 
                                onChange={e => setAmountPaid(parseFloat(e.target.value) || 0)} 
                                className="w-full px-3 py-2 border border-border-color rounded-lg bg-white focus:ring-2 focus:ring-apple-blue outline-none"
                                placeholder="0.00"
                            />
                        </div>
                    )}
                    
                    {paymentOption !== 'custom' && (
                         <p className="text-xs text-gray-500 mt-1 text-center">
                             Valor selecionado: <span className="font-bold text-primary-text">{formatMoney(amountPaid)}</span>
                             {paymentOption === '25' && ' (Confirma a presença)'}
                         </p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-secondary-text mb-1">Data do Pagamento</label>
                    <input 
                        type="date" 
                        value={paymentDate} 
                        onChange={e => setPaymentDate(e.target.value)} 
                        className="w-full px-3 py-2 border border-border-color rounded-lg bg-white focus:ring-2 focus:ring-apple-blue outline-none"
                        required
                    />
                </div>

                <div className="pt-4 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="rounded-full px-4 py-2 bg-white border border-gray-200 text-gray-700 font-medium hover:bg-gray-100">Cancelar</button>
                    <button type="submit" className="rounded-full px-5 py-2 bg-apple-blue text-white font-medium hover:bg-apple-blue-hover">Salvar Pagamento</button>
                </div>
            </form>
        </Modal>
    );
};

// --- Participant Notes Modal ---
interface ParticipantNotesModalProps {
    isOpen: boolean;
    onClose: () => void;
    interest: EventInterest;
    client: Client;
}

const ParticipantNotesModal: React.FC<ParticipantNotesModalProps> = ({ isOpen, onClose, interest, client }) => {
    const { setAppState } = useAppContext();
    const [notes, setNotes] = useState(interest.notes || '');

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setAppState(prev => ({
            ...prev,
            eventInterests: prev.eventInterests.map(i => i.id === interest.id ? { ...i, notes } : i)
        }));
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Notas: ${client.name}`}>
            <form onSubmit={handleSave} className="space-y-4">
                <div className="flex items-center gap-3 mb-4 bg-gray-50 p-3 rounded-xl">
                    <AbstractAvatar name={client.name} gender={client.gender} size={48} />
                    <div>
                        <p className="font-bold text-primary-text">{client.name}</p>
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${interestStatusColors[interest.status]}`}>
                            {interest.status}
                        </span>
                    </div>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-secondary-text mb-1">Bloco de Notas / Observações</label>
                    <textarea 
                        value={notes} 
                        onChange={(e) => setNotes(e.target.value)} 
                        rows={6} 
                        className="w-full px-3 py-2 border border-border-color rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-apple-blue transition-shadow" 
                        placeholder="Ex: Vegetariano, precisa de transporte, pagou em dinheiro..."
                    />
                </div>

                <div className="pt-2 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="rounded-full px-4 py-2 bg-white border border-gray-200 text-gray-700 font-medium hover:bg-gray-100">Cancelar</button>
                    <button type="submit" className="rounded-full px-5 py-2 bg-apple-blue text-white font-medium hover:bg-apple-blue-hover">Salvar Notas</button>
                </div>
            </form>
        </Modal>
    );
};


// --- Event Details & Dashboard Modal ---
interface EventDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: Event;
    interests: EventInterest[];
    clientsById: Record<string, Client>;
    onEditEvent: (event: Event) => void;
}

const EventDetailsModal: React.FC<EventDetailsModalProps> = ({ isOpen, onClose, event, interests, clientsById, onEditEvent }) => {
    const { setAppState } = useAppContext();
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [notesModalOpen, setNotesModalOpen] = useState(false);
    const [selectedClientForPayment, setSelectedClientForPayment] = useState<Client | null>(null);
    const [selectedInterestForNotes, setSelectedInterestForNotes] = useState<{ interest: EventInterest, client: Client } | null>(null);
    const [deletingInterestId, setDeletingInterestId] = useState<string | null>(null);
    
    const [localEvent, setLocalEvent] = useState(event);
    const [isEditingDescription, setIsEditingDescription] = useState(false);

    const handleSaveDescription = () => {
        setAppState(prev => ({
            ...prev,
            events: prev.events.map(e => e.id === localEvent.id ? localEvent : e)
        }));
        setIsEditingDescription(false);
    };

    const handleOpenPayment = (client: Client) => {
        setSelectedClientForPayment(client);
        setPaymentModalOpen(true);
    };

    const handleDeleteClick = (e: React.MouseEvent, interestId: string) => {
        e.stopPropagation();
        setDeletingInterestId(interestId);
    };

    const confirmDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (deletingInterestId) {
             setAppState(prev => ({
                ...prev,
                eventInterests: prev.eventInterests.filter(i => i.id !== deletingInterestId)
            }));
            setDeletingInterestId(null);
        }
    };

    const cancelDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        setDeletingInterestId(null);
    }

    const handleOpenNotes = (interest: EventInterest, client: Client) => {
        setSelectedInterestForNotes({ interest, client });
        setNotesModalOpen(true);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Dashboard do Evento" headerClassName="bg-gray-50">
             <div className="space-y-6">
                {/* Header Info */}
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold text-primary-text">{localEvent.name}</h2>
                         <div className="flex items-center gap-2 text-sm text-secondary-text mt-1 font-medium">
                            <CalendarIcon className="w-4 h-4" />
                            <span>{new Date(localEvent.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</span>
                        </div>
                    </div>
                    <button onClick={() => onEditEvent(localEvent)} className="text-apple-blue text-sm font-medium hover:underline">Editar Dados</button>
                </div>

                {/* Editable Description */}
                <div className="bg-white border border-border-color rounded-xl p-4 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="text-xs font-bold text-secondary-text uppercase tracking-wide">Anotações / Configurações</h4>
                        {!isEditingDescription ? (
                            <button onClick={() => setIsEditingDescription(true)} className="text-xs text-apple-blue font-medium">Editar</button>
                        ) : (
                            <button onClick={handleSaveDescription} className="text-xs text-apple-green font-bold">Salvar</button>
                        )}
                    </div>
                    {isEditingDescription ? (
                        <textarea 
                            className="w-full p-2 border border-border-color rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue"
                            rows={3}
                            value={localEvent.description}
                            onChange={(e) => setLocalEvent({...localEvent, description: e.target.value})}
                        />
                    ) : (
                         <p className="text-sm text-secondary-text whitespace-pre-wrap">{localEvent.description}</p>
                    )}
                </div>

                {/* Participants List */}
                <div>
                    <h3 className="text-lg font-bold text-primary-text mb-4">Lista de Participantes ({interests.length})</h3>
                    <div className="bg-gray-50 rounded-xl border border-border-color overflow-hidden max-h-80 overflow-y-auto">
                        {interests.length > 0 ? (
                            <table className="w-full text-left">
                                <thead className="bg-gray-100 border-b border-border-color">
                                    <tr>
                                        <th className="p-3 text-xs font-semibold text-secondary-text">Cliente</th>
                                        <th className="p-3 text-xs font-semibold text-secondary-text">Status</th>
                                        <th className="p-3 text-xs font-semibold text-secondary-text text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {interests.map(interest => {
                                        const client = clientsById[interest.clientId];
                                        if (!client) return null;
                                        return (
                                            <tr key={interest.id} className="border-b border-border-color/50 last:border-b-0 hover:bg-white transition-colors">
                                                <td className="p-3">
                                                    <div className="flex items-center gap-3">
                                                        <AbstractAvatar name={client.name} gender={client.gender} size={32} />
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-sm font-medium text-primary-text">{client.name}</p>
                                                                {interest.notes && <div className="w-2 h-2 bg-apple-orange rounded-full" title="Possui observações"></div>}
                                                            </div>
                                                            <p className="text-xs text-secondary-text">{client.whatsapp}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                     <span className={`px-2 py-1 text-xs font-semibold rounded-full ${interestStatusColors[interest.status]}`}>
                                                        {interest.status}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-right">
                                                    {deletingInterestId === interest.id ? (
                                                        <div className="flex items-center justify-end gap-2 animate-fadeIn">
                                                            <span className="text-xs text-red-600 font-medium hidden sm:inline">Confirmar?</span>
                                                            <button 
                                                                type="button"
                                                                onClick={confirmDelete}
                                                                className="p-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                                                                title="Sim, remover"
                                                            >
                                                                <CheckIcon className="w-4 h-4" />
                                                            </button>
                                                            <button 
                                                                type="button"
                                                                onClick={cancelDelete}
                                                                className="p-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                                                title="Cancelar"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-end gap-2">
                                                            {interest.status !== EventInterestStatus.Confirmado && interest.status !== EventInterestStatus.Compareceu ? (
                                                                <button 
                                                                    type="button"
                                                                    onClick={() => handleOpenPayment(client)}
                                                                    className="text-xs bg-white border border-border-color text-primary-text hover:border-apple-blue hover:text-apple-blue px-2 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1"
                                                                    title="Registrar Pagamento"
                                                                >
                                                                    <DollarSignIcon className="w-3 h-3" />
                                                                    <span className="hidden sm:inline">Pagar</span>
                                                                </button>
                                                            ) : (
                                                                <span className="text-xs text-green-600 font-medium flex items-center justify-end gap-1 px-2">
                                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                                    OK
                                                                </span>
                                                            )}
                                                            
                                                            <button 
                                                                type="button"
                                                                onClick={() => handleOpenNotes(interest, client)}
                                                                className="p-1.5 text-secondary-text hover:text-apple-blue hover:bg-blue-50 rounded-lg transition-colors"
                                                                title="Editar Notas"
                                                            >
                                                                <EditIcon className="w-4 h-4" />
                                                            </button>

                                                            <button 
                                                                type="button"
                                                                onClick={(e) => handleDeleteClick(e, interest.id)}
                                                                className="p-1.5 text-secondary-text hover:text-apple-red hover:bg-red-50 rounded-lg transition-colors"
                                                                title="Remover Participante"
                                                            >
                                                                <TrashIcon className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        ) : (
                            <div className="p-6 text-center text-secondary-text text-sm">Nenhum interessado registrado ainda.</div>
                        )}
                    </div>
                </div>
            </div>
            
            {selectedClientForPayment && paymentModalOpen && (
                <EventPaymentModal 
                    isOpen={paymentModalOpen} 
                    onClose={() => { setPaymentModalOpen(false); setSelectedClientForPayment(null); }}
                    client={selectedClientForPayment}
                    event={event}
                />
            )}

            {selectedInterestForNotes && notesModalOpen && (
                <ParticipantNotesModal
                    isOpen={notesModalOpen}
                    onClose={() => { setNotesModalOpen(false); setSelectedInterestForNotes(null); }}
                    interest={selectedInterestForNotes.interest}
                    client={selectedInterestForNotes.client}
                />
            )}
        </Modal>
    );
};


// --- Main Page Component ---
const EventsPageContent: React.FC = () => {
    const { appState, setAppState } = useAppContext();
    const { events, eventInterests: interests, clients } = appState;

    const setEvents = (value: React.SetStateAction<Event[]>) => {
        setAppState(prev => ({ ...prev, events: typeof value === 'function' ? value(prev.events) : value }));
    };

    const setInterests = (value: React.SetStateAction<EventInterest[]>) => {
        setAppState(prev => ({ ...prev, eventInterests: typeof value === 'function' ? value(prev.eventInterests) : value }));
    };

    const [isAddInterestModalOpen, setIsAddInterestModalOpen] = useState(false);
    const [newInterest, setNewInterest] = useState<Omit<EventInterest, 'id'>>({
        clientId: clients[0]?.id || '',
        eventId: events[0]?.id || '',
        status: EventInterestStatus.Interessado,
        notes: '',
    });

    const [isManageModalOpen, setIsManageModalOpen] = useState(false);
    const [isEventFormModalOpen, setIsEventFormModalOpen] = useState(false);
    const [currentEvent, setCurrentEvent] = useState<Partial<Event> | null>(null);
    
    // State for Details Modal
    const [selectedEventForDetails, setSelectedEventForDetails] = useState<Event | null>(null);

    const clientsById = useMemo(() => {
        return clients.reduce((acc, client) => {
            acc[client.id] = client;
            return acc;
        }, {} as Record<string, Client>);
    }, [clients]);

    // Ensure default selection logic runs when modal opens, preventing "empty" validation error if user doesn't change dropdowns
    useEffect(() => {
        if (isAddInterestModalOpen) {
            setNewInterest(prev => {
                 // Check if current selected IDs are valid
                 const isClientValid = prev.clientId && clients.some(c => c.id === prev.clientId);
                 const isEventValid = prev.eventId && events.some(e => e.id === prev.eventId);

                 // If valid, keep them. If not, default to first item.
                 const nextClientId = isClientValid ? prev.clientId : (clients[0]?.id || '');
                 const nextEventId = isEventValid ? prev.eventId : (events[0]?.id || '');
                 
                 // Only update if changed to avoid infinite loops
                 if (nextClientId !== prev.clientId || nextEventId !== prev.eventId) {
                     return { ...prev, clientId: nextClientId, eventId: nextEventId };
                 }
                 return prev;
            });
        }
    }, [isAddInterestModalOpen, clients, events]);


    const handleAddInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setNewInterest(prev => ({ ...prev, [name]: value }));
    };

    const handleAddNewInterest = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newInterest.clientId || !newInterest.eventId) return;

        const interestToAdd: EventInterest = {
            id: `interest-${Date.now()}`,
            ...newInterest,
        };
        setInterests(prev => [interestToAdd, ...prev]);
        setIsAddInterestModalOpen(false);
        setNewInterest({
            clientId: clients[0]?.id || '',
            eventId: events[0]?.id || '',
            status: EventInterestStatus.Interessado,
            notes: '',
        });
    };
    
    const handleOpenEventForm = (event: Event | null) => {
        setCurrentEvent(event ? { ...event } : { name: '', description: '', date: new Date().toISOString().split('T')[0] });
        setIsEventFormModalOpen(true);
    };

    const handleDeleteEvent = (eventId: string) => {
        if (window.confirm('Tem certeza que deseja excluir este evento? Todos os interesses associados serão removidos.')) {
            setEvents(prev => prev.filter(e => e.id !== eventId));
            setInterests(prev => prev.filter(i => i.eventId !== eventId));
        }
    };
    
    const handleEventFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (!currentEvent) return;
        const { name, value } = e.target;
        setCurrentEvent(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveEvent = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentEvent || !currentEvent.name || !currentEvent.date || !currentEvent.description) return;

        if (currentEvent.id) {
            setEvents(prev => prev.map(e => e.id === currentEvent.id ? (currentEvent as Event) : e));
        } else {
            const newEvent: Event = {
                id: `event-${Date.now()}`,
                name: currentEvent.name,
                description: currentEvent.description,
                date: currentEvent.date,
            };
            setEvents(prev => [...prev, newEvent]);
        }
        setIsEventFormModalOpen(false);
        setCurrentEvent(null);
    };


    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-primary-text">Eventos</h2>
                 <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsAddInterestModalOpen(true)}
                        className="rounded-full px-5 py-2 bg-apple-blue text-white font-medium hover:bg-apple-blue-hover transition-colors">
                        Adicionar Interesse
                    </button>
                    <button
                        onClick={() => setIsManageModalOpen(true)}
                        className="p-2.5 rounded-full bg-white border border-border-color text-secondary-text hover:bg-gray-50 hover:text-primary-text transition-colors"
                        aria-label="Gerenciar eventos"
                    >
                        <SettingsIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {events.map(event => {
                    const eventInterests = interests.filter(i => i.eventId === event.id);
                    return (
                        <button 
                            key={event.id} 
                            onClick={() => setSelectedEventForDetails(event)}
                            className="bg-white rounded-2xl border border-border-color shadow-sm p-6 flex flex-col text-left hover:border-apple-blue transition-colors group"
                        >
                            <div className="flex items-start gap-3 mb-2">
                                <div className="bg-purple-100 rounded-full p-2 mt-1 group-hover:bg-purple-200 transition-colors">
                                    <PageIcon className="w-6 h-6 text-purple-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-primary-text">{event.name}</h3>
                                    <p className="text-sm text-secondary-text mt-1 line-clamp-2">{event.description}</p>
                                    <div className="flex items-center gap-2 text-sm text-secondary-text mt-2 font-medium">
                                        <CalendarIcon className="w-4 h-4" />
                                        <span>{new Date(event.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-border-color w-full">
                                <h4 className="font-semibold text-sm text-secondary-text mb-3">
                                    Clientes Interessados ({eventInterests.length})
                                </h4>
                                <div className="space-y-2 w-full">
                                    {eventInterests.slice(0, 3).map(interest => { // Show only top 3
                                        const client = clientsById[interest.clientId];
                                        if (!client) return null;
                                        return (
                                            <div key={interest.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50/50">
                                                <div className="flex items-center gap-2">
                                                    <AbstractAvatar name={client.name} gender={client.gender} size={24} />
                                                    <p className="text-sm font-medium text-primary-text truncate max-w-[120px]">{client.name}</p>
                                                </div>
                                                <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${interestStatusColors[interest.status]}`}>
                                                    {interest.status}
                                                </span>
                                            </div>
                                        );
                                    })}
                                    {eventInterests.length > 3 && (
                                        <p className="text-xs text-center text-secondary-text pt-1">e mais {eventInterests.length - 3}...</p>
                                    )}
                                    {eventInterests.length === 0 && (
                                        <p className="text-sm text-secondary-text text-center py-2">Nenhum cliente interessado ainda.</p>
                                    )}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Event Dashboard / Details Modal */}
            {selectedEventForDetails && (
                <EventDetailsModal 
                    isOpen={!!selectedEventForDetails}
                    onClose={() => setSelectedEventForDetails(null)}
                    event={selectedEventForDetails}
                    interests={interests.filter(i => i.eventId === selectedEventForDetails.id)}
                    clientsById={clientsById}
                    onEditEvent={handleOpenEventForm}
                />
            )}

            <Modal isOpen={isAddInterestModalOpen} onClose={() => setIsAddInterestModalOpen(false)} title="Registrar Interesse em Evento">
                <form onSubmit={handleAddNewInterest} className="space-y-4">
                    <div>
                        <label htmlFor="eventId" className="block text-sm font-medium text-secondary-text mb-1">Evento</label>
                        <select name="eventId" value={newInterest.eventId} onChange={handleAddInputChange} className="w-full px-3 py-2 border border-border-color rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-apple-blue transition-shadow" required>
                            {events.map(event => <option key={event.id} value={event.id}>{event.name} ({new Date(event.date + 'T12:00:00').toLocaleDateString('pt-BR')})</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="clientId" className="block text-sm font-medium text-secondary-text mb-1">Cliente</label>
                        <select name="clientId" value={newInterest.clientId} onChange={handleAddInputChange} className="w-full px-3 py-2 border border-border-color rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-apple-blue transition-shadow" required>
                            {clients.map(client => <option key={client.id} value={client.id}>{client.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-secondary-text mb-1">Status</label>
                        <select name="status" value={newInterest.status} onChange={handleAddInputChange} className="w-full px-3 py-2 border border-border-color rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-apple-blue transition-shadow" required>
                            {Object.values(EventInterestStatus).map(status => <option key={status} value={status}>{status}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-secondary-text mb-1">Notas</label>
                        <textarea name="notes" value={newInterest.notes} onChange={handleAddInputChange} rows={3} className="w-full px-3 py-2 border border-border-color rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-apple-blue transition-shadow" placeholder="Alguma observação importante?"></textarea>
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={() => setIsAddInterestModalOpen(false)} className="rounded-full px-4 py-2 bg-white border border-gray-200 text-gray-700 font-medium hover:bg-gray-100 transition-colors">Cancelar</button>
                        <button type="submit" className="rounded-full px-5 py-2 bg-apple-blue text-white font-medium hover:bg-apple-blue-hover transition-colors">Salvar Interesse</button>
                    </div>
                </form>
            </Modal>
            
            <Modal isOpen={isManageModalOpen} onClose={() => setIsManageModalOpen(false)} title="Gerenciar Eventos">
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {events.map(event => (
                        <div key={event.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200/80">
                            <div>
                                <p className="font-semibold text-primary-text">{event.name}</p>
                                <p className="text-sm text-secondary-text">{new Date(event.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => handleOpenEventForm(event)} className="font-medium text-sm text-apple-blue hover:underline">Editar</button>
                                <button onClick={() => handleDeleteEvent(event.id)} className="p-2 text-gray-400 hover:text-apple-red hover:bg-red-50 rounded-full transition-colors" aria-label="Excluir evento">
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-6 pt-4 border-t border-border-color flex justify-end">
                    <button onClick={() => handleOpenEventForm(null)} className="rounded-full px-5 py-2 bg-apple-green text-white font-medium hover:bg-green-600 transition-colors">
                        Adicionar Novo Evento
                    </button>
                </div>
            </Modal>
            
            {currentEvent && (
                <Modal isOpen={isEventFormModalOpen} onClose={() => setIsEventFormModalOpen(false)} title={currentEvent.id ? 'Editar Evento' : 'Adicionar Novo Evento'}>
                    <form onSubmit={handleSaveEvent} className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-secondary-text mb-1">Nome do Evento</label>
                            <input type="text" name="name" id="name" value={currentEvent.name || ''} onChange={handleEventFormChange} className="w-full px-3 py-2 border border-border-color rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-apple-blue transition-shadow" required />
                        </div>
                        <div>
                            <label htmlFor="date" className="block text-sm font-medium text-secondary-text mb-1">Data</label>
                            <input type="date" name="date" id="date" value={currentEvent.date || ''} onChange={handleEventFormChange} className="w-full px-3 py-2 border border-border-color rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-apple-blue transition-shadow" required />
                        </div>
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-secondary-text mb-1">Descrição</label>
                            <textarea name="description" id="description" value={currentEvent.description || ''} onChange={handleEventFormChange} rows={3} className="w-full px-3 py-2 border border-border-color rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-apple-blue transition-shadow" required></textarea>
                        </div>
                        <div className="pt-4 flex justify-end gap-3">
                            <button type="button" onClick={() => setIsEventFormModalOpen(false)} className="rounded-full px-4 py-2 bg-white border border-gray-200 text-gray-700 font-medium hover:bg-gray-100 transition-colors">Cancelar</button>
                            <button type="submit" className="rounded-full px-5 py-2 bg-apple-blue text-white font-medium hover:bg-apple-blue-hover transition-colors">Salvar Evento</button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};

export const EventsPage: React.FC = () => (
    <FinanceDataProvider>
        <EventsPageContent />
    </FinanceDataProvider>
);
