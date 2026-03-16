
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { LeadStatus, CalendarEvent, Client, Product, RecordingStatus, Page, Recording, PaymentStatus, Event } from '../types';
import { LeadsIcon, ClientsIcon, RecordingsIcon, CalendarIcon, CheckIcon, ClockIcon, PlusIcon, HistoryIcon, ArchiveIcon, TrashIcon, RefreshIcon, PhoneIcon, LinkIcon, EventsIcon } from '../components/icons/Icons';
import { AbstractAvatar } from '../components/AbstractAvatar';
import { useAppContext } from '../context/AppContext';
import { sendWhatsAppMessage } from '../utils/whatsapp';
import { Modal } from '../components/Modal';

// --- Icons ---
const EventIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
        <path d="M8 14h.01"></path>
        <path d="M12 14h.01"></path>
        <path d="M16 14h.01"></path>
        <path d="M8 18h.01"></path>
        <path d="M12 18h.01"></path>
        <path d="M16 18h.01"></path>
    </svg>
);

const TruckIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13"></rect>
        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
        <circle cx="5.5" cy="18.5" r="2.5"></circle>
        <circle cx="18.5" cy="18.5" r="2.5"></circle>
    </svg>
);

const ChevronDownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
);

const DollarSignIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"></line>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
  </svg>
);

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    colorClass: string;
}
const StatCard: React.FC<StatCardProps> = ({ title, value, icon, colorClass }) => (
    <div className="bg-white rounded-2xl border border-border-color shadow-sm p-6 flex items-start justify-between">
        <div>
            <p className="text-sm font-medium text-secondary-text">{title}</p>
            <p className="text-3xl font-bold text-primary-text mt-2">{value}</p>
        </div>
        <div className={`rounded-full p-2 ${colorClass}`}>
            {icon}
        </div>
    </div>
);

function addBusinessDays(dateStr: string, days: number): Date {
    const date = new Date(dateStr + 'T12:00:00');
    let count = 0;
    while (count < days) {
        date.setDate(date.getDate() + 1);
        const dayOfWeek = date.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { count++; }
    }
    return date;
}

type ScheduleItem = {
    type: 'recording' | 'event';
    id: string;
    date: string;
    title: string;
    subtitle: string;
    startTime?: string;
    endTime?: string;
    clientGender?: 'male' | 'female';
    clientName?: string;
};

type RecordingWithDetails = Recording & {
    client?: Client;
    product?: Product;
    deliveryDateObj?: Date;
    formattedDeliveryDate?: string;
};

interface DashboardPageProps {
    setActivePage: (page: Page) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ setActivePage }) => {
    const { appState, setAppState } = useAppContext();
    const { clients, lancamentos, recordings, products, calendarEvents, events } = appState;
    
    const [editingDelivery, setEditingDelivery] = useState<RecordingWithDetails | null>(null);
    const [newDeliveryDate, setNewDeliveryDate] = useState('');
    const [deliveryLink, setDeliveryLink] = useState('');
    const [isDeliveryHistoryOpen, setIsDeliveryHistoryOpen] = useState(false);
    const [deliveryToUndo, setDeliveryToUndo] = useState<RecordingWithDetails | null>(null);

    const [isAddDeliveryModalOpen, setIsAddDeliveryModalOpen] = useState(false);
    const [newManualDelivery, setNewManualDelivery] = useState({
        clientId: '',
        productId: '',
        date: new Date().toISOString().split('T')[0]
    });

    const [clientSearchTerm, setClientSearchTerm] = useState('');
    const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const filteredClientsForManual = useMemo(() => {
        if (!clientSearchTerm) return clients;
        return clients.filter(c => c.name.toLowerCase().includes(clientSearchTerm.toLowerCase()));
    }, [clients, clientSearchTerm]);

    const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
    const [newTask, setNewTask] = useState<{title: string, date: string, description: string}>({
        title: '',
        date: new Date().toISOString().split('T')[0],
        description: ''
    });

    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [draggedTaskIndex, setDraggedTaskIndex] = useState<number | null>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsClientDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleOpenDeliveryModal = (rec: RecordingWithDetails, calculatedDate: string) => {
        setEditingDelivery(rec);
        setNewDeliveryDate(rec.deliveryDate || calculatedDate);
        setDeliveryLink('');
    };

    const handleSaveDeliveryData = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingDelivery) return;
        const updatedNotes = deliveryLink ? `${editingDelivery.notes || ''}\n\n[Link]: ${deliveryLink}` : editingDelivery.notes;
        setAppState(prev => ({
            ...prev,
            recordings: prev.recordings.map(r => r.id === editingDelivery.id ? { ...r, deliveryDate: newDeliveryDate, notes: updatedNotes || '' } : r)
        }));
        setEditingDelivery(null);
    };

    const handleCompleteDelivery = () => {
        if (!editingDelivery) return;
        const updatedNotes = deliveryLink ? `${editingDelivery.notes || ''}\n\n[Entrega]: ${deliveryLink}` : editingDelivery.notes;
        setAppState(prev => ({
            ...prev,
            recordings: prev.recordings.map(r => r.id === editingDelivery.id ? { ...r, status: RecordingStatus.Concluída, deliveryDate: newDeliveryDate, notes: updatedNotes || '' } : r)
        }));
        setEditingDelivery(null);
    };

    const handleConfirmUndoDelivery = () => {
        if (!deliveryToUndo) return;
        setAppState(prev => ({
            ...prev,
            recordings: prev.recordings.map(r => r.id === deliveryToUndo.id ? { ...r, status: RecordingStatus.Agendada } : r)
        }));
        setDeliveryToUndo(null);
    };

    const handleAddManualDelivery = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newManualDelivery.clientId || !newManualDelivery.productId) return;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const newRec: Recording = {
            id: `manual-del-${Date.now()}`,
            clientId: newManualDelivery.clientId,
            productId: newManualDelivery.productId,
            data: yesterday.toISOString().split('T')[0],
            deliveryDate: newManualDelivery.date,
            status: RecordingStatus.Agendada,
            horaInicio: '00:00',
            horaFim: '00:00',
            horasEstimadas: 0,
            valorUnitario: 0,
            quantidade: 1,
            valorTotal: 0,
            statusPagamentoInicial: PaymentStatus.Pendente,
            notes: 'Entrega manual adicionada.',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        setAppState(prev => ({ ...prev, recordings: [newRec, ...prev.recordings] }));
        setIsAddDeliveryModalOpen(false);
        setNewManualDelivery({ clientId: '', productId: '', date: new Date().toISOString().split('T')[0] });
        setClientSearchTerm('');
    };

    const handleSendDeliveryWhatsApp = async () => {
        if (!editingDelivery || !editingDelivery.client?.whatsapp) {
            alert("Cliente sem número de WhatsApp cadastrado.");
            return;
        }
        const cleanNumber = editingDelivery.client.whatsapp.replace(/\D/g, '');
        const linkToUse = deliveryLink || '[LINK NÃO INSERIDO]';
        const messageTemplate = `Quero agradecer mais uma vez pela confiança no meu trabalho. Foi incrível poder gravar esse projeto com você e capturar toda a sua essência artística!\n\nSegue o link com o trabalho finalizado:\n${linkToUse}\n\nEspero que você curta tanto quanto eu gostei de produzir! Ficou realmente incrível e reflete o talento e dedicação que você colocou nesse projeto.\n\nMuito obrigado e sucesso sempre!`;
        await sendWhatsAppMessage(cleanNumber, messageTemplate, appState.whatsappSendMethod);
    };

    const handleAddTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTask.title || !newTask.date) return;
        const maxOrder = calendarEvents.reduce((max, evt) => Math.max(max, evt.order || 0), 0);
        const task: CalendarEvent = {
            id: `task-${Date.now()}`,
            title: newTask.title,
            date: newTask.date,
            description: newTask.description,
            color: 'blue',
            source: 'HopeOS',
            completed: false,
            archived: false,
            order: maxOrder + 1
        };
        setAppState(prev => ({ ...prev, calendarEvents: [...prev.calendarEvents, task] }));
        setIsAddTaskModalOpen(false);
        setNewTask({ title: '', date: new Date().toISOString().split('T')[0], description: '' });
    };

    const handleToggleTask = (task: any) => {
        if (task.source === 'Lead') {
            const clientId = task.id.replace('lead-task-', '');
            setAppState(prev => ({
                ...prev,
                clients: prev.clients.map(c => c.id === clientId ? { ...c, lastContact: 'Hoje', nextFollowUp: undefined } : c)
            }));
        } else {
            setAppState(prev => ({
                ...prev,
                calendarEvents: prev.calendarEvents.map(evt => evt.id === task.id ? { ...evt, completed: !evt.completed } : evt)
            }));
        }
    };

    const handleArchiveCompletedTasks = () => {
        setAppState(prev => ({
            ...prev,
            calendarEvents: prev.calendarEvents.map(evt => evt.completed ? { ...evt, archived: true } : evt)
        }));
    };

    const handleRestoreTask = (id: string) => {
        setAppState(prev => ({
            ...prev,
            calendarEvents: prev.calendarEvents.map(evt => evt.id === id ? { ...evt, archived: false, completed: false } : evt)
        }));
    };

    const handleDeleteArchivedTask = (id: string) => {
        setAppState(prev => ({ ...prev, calendarEvents: prev.calendarEvents.filter(evt => evt.id !== id) }));
    };

    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedTaskIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, targetIndex: number) => {
        e.preventDefault();
        if (draggedTaskIndex === null) return;
        const visibleManualTasks = [...calendarEvents].filter(evt => !evt.archived).sort((a, b) => (a.order || 0) - (b.order || 0));
        const itemToMove = visibleManualTasks[draggedTaskIndex];
        visibleManualTasks.splice(draggedTaskIndex, 1);
        visibleManualTasks.splice(targetIndex, 0, itemToMove);
        const updatedTasks = visibleManualTasks.map((t, idx) => ({ ...t, order: idx }));
        setAppState(prev => {
            const archivedTasks = prev.calendarEvents.filter(evt => evt.archived);
            return { ...prev, calendarEvents: [...archivedTasks, ...updatedTasks] };
        });
        setDraggedTaskIndex(null);
    };

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const activeClientsCount = useMemo(() => clients.filter(c => c.status === 'Active').length, [clients]);
    const newLeadsCount = useMemo(() => clients.filter(c => c.status === 'Lead' && c.leadStage === LeadStatus.Novo).length, [clients]);
    
    const eventsInMonthCount = useMemo(() => events.filter(e => {
        const d = new Date(e.date + 'T12:00:00');
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length, [events, currentMonth, currentYear]);

    const monthlyRevenue = useMemo(() => lancamentos.reduce((acc, lanc) => {
        if (lanc.datasPagamentos && lanc.datasPagamentos.length > 0) {
            const monthPayments = lanc.datasPagamentos.filter(p => {
                const pDate = new Date(p.data + 'T12:00:00');
                return pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear;
            });
            return acc + monthPayments.reduce((sum, p) => sum + p.valor, 0);
        }
        return acc;
    }, 0), [lancamentos, currentMonth, currentYear]);

    const upcomingSchedules = useMemo(() => {
        const now = new Date();
        now.setHours(0,0,0,0);
        const clientsById = clients.reduce((acc, client) => ({ ...acc, [client.id]: client }), {} as Record<string, Client>);
        const productsById = products.reduce((acc, product) => ({ ...acc, [product.id]: product }), {} as Record<string, Product>);

        const recItems: ScheduleItem[] = recordings
            .filter(rec => {
                const recDate = new Date(rec.data + 'T12:00:00');
                return recDate >= now && rec.status === RecordingStatus.Agendada;
            })
            .map(rec => ({
                type: 'recording',
                id: rec.id,
                date: rec.data,
                startTime: rec.horaInicio,
                endTime: rec.horaFim,
                title: clientsById[rec.clientId]?.name || 'Cliente Desconhecido',
                subtitle: productsById[rec.productId]?.name || 'Serviço',
                clientGender: clientsById[rec.clientId]?.gender,
                clientName: clientsById[rec.clientId]?.name
            }));

        const eventItems: ScheduleItem[] = events
            .filter(evt => {
                const evtDate = new Date(evt.date + 'T12:00:00');
                return evtDate >= now;
            })
            .map(evt => ({
                type: 'event',
                id: evt.id,
                date: evt.date,
                title: evt.name,
                subtitle: 'Evento / Workshop',
                startTime: 'Dia Todo',
                endTime: ''
            }));

        return [...recItems, ...eventItems]
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(0, 10);
    }, [recordings, events, clients, products]);

    const leadTasks = useMemo(() => clients.filter(c => c.nextFollowUp && c.status === 'Lead').sort((a, b) => new Date(a.nextFollowUp!).getTime() - new Date(b.nextFollowUp!).getTime()).map(c => ({ id: `lead-task-${c.id}`, title: `Contato: ${c.name}`, date: c.nextFollowUp!, description: `Pipeline: ${c.leadStage || ''}`, color: 'purple', source: 'Lead', completed: false })), [clients]);
    const manualTasks = useMemo(() => calendarEvents.filter(evt => !evt.archived).sort((a, b) => (a.order || 0) - (b.order || 0)), [calendarEvents]);
    const archivedTasks = useMemo(() => calendarEvents.filter(evt => evt.archived).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [calendarEvents]);

    const upcomingDeliveries = useMemo(() => {
        const now = new Date();
        now.setHours(0,0,0,0);
        const clientsById = clients.reduce((acc, client) => ({ ...acc, [client.id]: client }), {} as Record<string, Client>);
        const productsById = products.reduce((acc, product) => ({ ...acc, [product.id]: product }), {} as Record<string, Product>);
        return recordings.filter(rec => rec.status !== RecordingStatus.Cancelada && rec.status !== RecordingStatus.Concluída).map(rec => {
                let deliveryDateObj = rec.deliveryDate ? new Date(rec.deliveryDate + 'T12:00:00') : addBusinessDays(rec.data, 5);
                return { ...rec, client: clientsById[rec.clientId], product: productsById[rec.productId], deliveryDateObj, formattedDeliveryDate: deliveryDateObj.toISOString().split('T')[0] };
            }).sort((a, b) => a.deliveryDateObj.getTime() - b.deliveryDateObj.getTime()).slice(0, 5);
    }, [recordings, clients, products]);

    const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    return (
        <div className="flex flex-col gap-6 h-full">
            <h2 className="text-3xl font-bold text-primary-text">Início</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatCard title="Clientes Ativos" value={activeClientsCount} icon={<ClientsIcon className="w-6 h-6 text-blue-600" />} colorClass="bg-blue-100"/>
                <StatCard title="Novos Leads" value={newLeadsCount} icon={<LeadsIcon className="w-6 h-6 text-green-600" />} colorClass="bg-green-100"/>
                <StatCard title="Eventos do Mês" value={eventsInMonthCount} icon={<EventIcon className="w-6 h-6 text-purple-600" />} colorClass="bg-purple-100"/>
                <StatCard title="Faturamento Mensal" value={formatCurrency(monthlyRevenue)} icon={<DollarSignIcon className="w-6 h-6 text-yellow-600" />} colorClass="bg-yellow-100"/>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
                <div className="bg-white rounded-2xl border border-border-color shadow-sm p-6 flex flex-col h-full overflow-hidden">
                     <div className="flex items-center justify-between mb-4 flex-shrink-0">
                        <h3 className="text-lg font-bold text-primary-text flex items-center gap-2">
                            <CalendarIcon className="w-5 h-5 text-apple-blue" /> Agendamentos
                        </h3>
                    </div>
                    <div className="space-y-3 overflow-y-auto custom-scrollbar pr-2">
                        {upcomingSchedules.map((item, index) => {
                            const isEvent = item.type === 'event';
                            return (
                                <div key={`${item.type}-${item.id}`} className={`rounded-xl p-3 border flex flex-col gap-2 transition-all cursor-pointer shadow-sm ${isEvent ? 'bg-purple-50/50 border-purple-200' : 'bg-gray-50 border-border-color/50'}`} onClick={() => item.type === 'recording' ? setActivePage('Gravações') : setActivePage('Eventos')}>
                                    <div className="flex items-center gap-3">
                                        {item.type === 'recording' ? <AbstractAvatar name={item.clientName || ''} gender={item.clientGender || 'female'} size={36} /> : <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center"><EventsIcon className="w-5 h-5" /></div>}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm truncate">{item.title}</p>
                                            <p className="text-[10px] font-bold uppercase tracking-wider truncate">{item.subtitle}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-1">
                                        <div className="flex items-center gap-1.5 text-xs font-medium"><CalendarIcon className="w-3.5 h-3.5" />{new Date(item.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</div>
                                        <div className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border bg-white border-gray-200">{item.startTime}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-border-color shadow-sm p-6 flex flex-col h-full overflow-hidden">
                    <div className="flex items-center justify-between mb-4 flex-shrink-0">
                        <h3 className="text-lg font-bold text-primary-text flex items-center gap-2">
                            <CheckIcon className="w-5 h-5 text-green-500" /> Tarefas
                        </h3>
                    </div>
                    <div className="space-y-2 overflow-y-auto custom-scrollbar pr-2 flex-1">
                        {leadTasks.map(task => (
                            <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl border border-purple-100 bg-purple-50 mb-2">
                                <button onClick={() => handleToggleTask(task)} className="w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 bg-white border-purple-300"></button>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm text-purple-900 truncate">{task.title}</p>
                                    <p className="text-xs text-purple-700 truncate">{task.description}</p>
                                </div>
                            </div>
                        ))}
                        {manualTasks.map((task, index) => (
                            <div key={task.id} draggable onDragStart={(e) => handleDragStart(e, index)} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, index)} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${task.completed ? 'opacity-60' : 'bg-white border-border-color/60'}`}>
                                <button onClick={() => handleToggleTask(task)} className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${task.completed ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'}`}>
                                    {task.completed && <CheckIcon className="w-3.5 h-3.5" />}
                                </button>
                                <div className={`flex-1 min-w-0 ${task.completed ? 'line-through text-gray-400' : ''}`}>
                                    <p className="font-medium text-sm truncate">{task.title}</p>
                                    <p className="text-xs text-secondary-text truncate">{task.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-border-color shadow-sm p-6 flex flex-col h-full overflow-hidden">
                    <div className="flex items-center justify-between mb-4 flex-shrink-0">
                        <h3 className="text-lg font-bold text-primary-text flex items-center gap-2">
                            <TruckIcon className="w-5 h-5 text-apple-orange" /> Próximas Entregas
                        </h3>
                    </div>
                    <div className="space-y-3 overflow-y-auto custom-scrollbar pr-2">
                        {upcomingDeliveries.map(delivery => {
                            const daysLeft = Math.ceil((delivery.deliveryDateObj.getTime() - new Date().setHours(0,0,0,0)) / (1000 * 60 * 60 * 24));
                            return (
                                <div key={delivery.id} className="bg-gray-50 rounded-xl p-3 border border-border-color/50 hover:border-apple-blue cursor-pointer" onClick={() => handleOpenDeliveryModal(delivery, delivery.formattedDeliveryDate || '')}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm truncate">{delivery.client?.name}</p>
                                            <p className="text-xs text-secondary-text truncate">{delivery.product?.name}</p>
                                        </div>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${daysLeft <= 2 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{daysLeft === 0 ? 'Hoje' : `${daysLeft} dias`}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            
            {/* Modal Components can remain similar to previous versions but using unified clients list */}
        </div>
    );
};
