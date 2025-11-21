import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Recording, RecordingStatus, Client, Product, PaymentStatus, Lead, LeadStatus } from '../types';
import { Modal } from '../components/Modal';
import { useAppContext } from '../context/AppContext';
import { AbstractAvatar } from '../components/AbstractAvatar';
import { RecordingsIcon, TrashIcon, CalendarIcon, DownloadIcon, ClockIcon } from '../components/icons/Icons';

const statusColors: { [key in RecordingStatus]: string } = {
  [RecordingStatus.Agendada]: 'bg-blue-100 text-blue-800',
  [RecordingStatus.Concluída]: 'bg-green-100 text-green-800',
  [RecordingStatus.Cancelada]: 'bg-red-100 text-red-800',
};

const ChevronDownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
);

type RecordingWithData = Recording & { client: Client | undefined; product: Product | undefined };

// --- RecordingListItem Component ---
interface RecordingListItemProps {
  recording: Recording;
  client?: Client;
  product?: Product;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

const RecordingListItem: React.FC<RecordingListItemProps> = ({ recording, client, product, onClick, onDelete }) => {
  return (
    <div
      onClick={onClick}
      className="group relative bg-white rounded-xl border border-border-color p-4 cursor-pointer shadow-sm hover:border-apple-blue hover:shadow-md transition-all duration-200"
    >
      <div className="flex justify-between items-start mb-2">
         <div className="flex items-center gap-3">
            <AbstractAvatar name={client?.name || '?'} gender={client?.gender || 'female'} size={36} />
            <div>
                <h4 className="font-semibold text-sm text-primary-text leading-tight">{client?.name || 'Cliente desconhecido'}</h4>
                <p className="text-xs text-secondary-text">{product?.name || 'Serviço'}</p>
            </div>
         </div>
         <button
            onClick={onDelete}
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full text-gray-400 hover:bg-red-50 hover:text-apple-red transition-all"
            title="Excluir"
         >
             <TrashIcon className="w-4 h-4" />
         </button>
      </div>
      
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border-color/50">
         <div className="flex flex-col">
             <span className="text-xs font-bold text-primary-text">
                {new Date(recording.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit' })}
             </span>
             <span className="text-[10px] text-secondary-text uppercase">
                {new Date(recording.data + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short' })}
             </span>
         </div>
         <div className="text-right">
             <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-full ${statusColors[recording.status]}`}>
                {recording.status}
             </span>
             <p className="text-xs text-secondary-text mt-1 font-mono">{recording.horaInicio}</p>
         </div>
      </div>
    </div>
  );
};

// --- RecordingCalendar Component ---
const RecordingCalendar: React.FC<{ recordings: Recording[], clientsById: Record<string, Client>, onEventClick: (rec: Recording) => void }> = ({ recordings, clientsById, onEventClick }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

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
        return recordings.reduce((acc, event) => {
            const date = event.data;
            if (!acc[date]) { acc[date] = []; }
            acc[date].push(event);
            return acc;
        }, {} as Record<string, Recording[]>);
    }, [recordings]);

    return (
        <div className="bg-white rounded-2xl border border-border-color shadow-sm p-6 h-full flex flex-col">
             <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-primary-text flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-apple-blue" />
                    Visão Mensal
                </h3>
                <div className="flex items-center gap-2 bg-gray-100 rounded-full p-1">
                    <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-2 rounded-full hover:bg-white hover:shadow-sm transition-all"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
                    <span className="font-semibold text-sm text-primary-text w-32 text-center select-none">{currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase())}</span>
                    <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-2 rounded-full hover:bg-white hover:shadow-sm transition-all"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></button>
                </div>
            </div>
            <div className="grid grid-cols-7 gap-px flex-1 bg-gray-200 border border-gray-200 rounded-lg overflow-hidden">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => <div key={day} className="bg-gray-50 text-center text-xs font-bold text-secondary-text py-2 uppercase tracking-wide">{day}</div>)}
                {daysInMonth.map((day, index) => {
                    const dateKey = day ? `${day.getFullYear()}-${(day.getMonth() + 1).toString().padStart(2, '0')}-${day.getDate().toString().padStart(2, '0')}` : '';
                    const dayEvents = day ? (eventsByDate[dateKey] || []) : [];
                    const isToday = day && day.toDateString() === new Date().toDateString();
                    
                    if (!day) return <div key={index} className="bg-white min-h-[80px]"></div>;

                    return (
                        <div key={index} className={`bg-white p-2 flex flex-col min-h-[80px] transition-colors hover:bg-gray-50`}>
                            <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full mb-1 ${isToday ? 'bg-apple-blue text-white' : 'text-secondary-text'}`}>{day.getDate()}</span>
                            <div className="flex-1 space-y-1 overflow-y-auto custom-scrollbar max-h-[80px]">
                                {dayEvents.map(event => (
                                    <button 
                                        key={event.id} 
                                        onClick={() => onEventClick(event)} 
                                        className={`w-full text-left text-[10px] font-medium px-1.5 py-0.5 rounded border-l-2 truncate transition-opacity hover:opacity-80 ${
                                            event.status === RecordingStatus.Concluída ? 'bg-green-50 text-green-800 border-green-500' :
                                            event.status === RecordingStatus.Cancelada ? 'bg-red-50 text-red-800 border-red-500' :
                                            'bg-blue-50 text-blue-800 border-blue-500'
                                        }`}
                                        title={`${clientsById[event.clientId]?.name} - ${event.horaInicio}`}
                                    >
                                        {clientsById[event.clientId]?.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}


// --- RecordingsPage Component ---
export const RecordingsPage: React.FC = () => {
  const { appState, setAppState } = useAppContext();
  const { recordings, clients, products, leads } = appState;

  const [selectedRec, setSelectedRec] = useState<Recording | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [recordingToDelete, setRecordingToDelete] = useState<Recording | null>(null);
  
  const initialNewRecState: Omit<Recording, 'id' | 'createdAt' | 'updatedAt'> = {
      clientId: '', 
      productId: '',
      data: new Date().toISOString().split('T')[0],
      horaInicio: '09:00',
      horaFim: '13:00', // Will be auto calculated
      horasEstimadas: 4,
      valorUnitario: 0,
      quantidade: 1,
      valorTotal: 0,
      statusPagamentoInicial: PaymentStatus.Pendente,
      notes: '',
      status: RecordingStatus.Agendada,
  };
  const [newRec, setNewRec] = useState(initialNewRecState);
  const [editedRec, setEditedRec] = useState<Recording | null>(null);

  // Searchable Dropdown States
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const clientsById = useMemo(() => clients.reduce((acc, c) => ({...acc, [c.id]: c}), {} as Record<string, Client>), [clients]);
  const productsById = useMemo(() => products.reduce((acc, p) => ({...acc, [p.id]: p}), {} as Record<string, Product>), [products]);

  // Filter for Sidebar List: ONLY Scheduled (Agendada) AND Future/Present
  const sidebarRecordings = useMemo(() => {
      const now = new Date();
      return recordings.filter(r => {
          // Must be Scheduled
          if (r.status !== RecordingStatus.Agendada) return false;
          
          // Must be in the future (or currently happening)
          try {
            const endTime = r.horaFim || '23:59';
            const recEndDate = new Date(`${r.data}T${endTime}`);
            return recEndDate > now;
          } catch (e) {
            return true; 
          }
      });
  }, [recordings]);

  // Filter for Calendar: Scheduled AND Completed
  const calendarRecordings = useMemo(() => {
      return recordings.filter(r => r.status === RecordingStatus.Agendada || r.status === RecordingStatus.Concluída);
  }, [recordings]);

  // Prepare data for Sidebar grouping
  const sidebarRecordingsWithData = useMemo(() => sidebarRecordings.map(r => ({
      ...r,
      client: clientsById[r.clientId],
      product: productsById[r.productId]
  })), [sidebarRecordings, clientsById, productsById]);

  // Group Sidebar Recordings by Month
  const groupedSidebarRecordings = useMemo(() => {
      const groups: Record<string, RecordingWithData[]> = {};
      const sorted = [...sidebarRecordingsWithData].sort((a, b) => new Date(`${a.data}T${a.horaInicio}`).getTime() - new Date(`${b.data}T${b.horaInicio}`).getTime());

      sorted.forEach(rec => {
          const dateObj = new Date(rec.data + 'T12:00:00');
          const monthKey = dateObj.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase());
          
          if (!groups[monthKey]) groups[monthKey] = [];
          groups[monthKey].push(rec);
      });
      return groups;
  }, [sidebarRecordingsWithData]);
  
   const clientAndLeadOptions = useMemo(() => {
    const clientOptions = clients.map(c => ({ value: c.id, label: `${c.name} (Cliente)`, type: 'client' as const, name: c.name }));
    const leadOptions = leads.filter(l => l.status !== LeadStatus.Convertido && l.status !== LeadStatus.Perdido).map(l => ({ value: l.id, label: `${l.name} (Lead)`, type: 'lead' as const, name: l.name }));
    return [...clientOptions, ...leadOptions];
  }, [clients, leads]);

  // Filter options based on search
  const filteredClientOptions = useMemo(() => {
      if (!clientSearchTerm) return clientAndLeadOptions;
      const lowerSearch = clientSearchTerm.toLowerCase();
      return clientAndLeadOptions.filter(opt => opt.label.toLowerCase().includes(lowerSearch));
  }, [clientAndLeadOptions, clientSearchTerm]);

  const parsePrice = (priceString: string): number => {
      if (!priceString) return 0;
      const cleanedString = priceString.replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
      const price = parseFloat(cleanedString);
      return isNaN(price) ? 0 : price;
  };

  // --- AUTO CALCULATION EFFECTS ---

  // 1. Calculate Total Value based on Unit Price and Quantity
  useEffect(() => {
    if (isAddModalOpen) {
        const total = newRec.valorUnitario * newRec.quantidade;
        setNewRec(prev => ({ ...prev, valorTotal: total }));
    }
  }, [isAddModalOpen, newRec.valorUnitario, newRec.quantidade]);
  
  // 2. Calculate Unit Price based on Product and Quantity (specifically for "Vídeo Acústico")
  useEffect(() => {
      if (isAddModalOpen && newRec.productId) {
          const product = products.find(p => p.id === newRec.productId);
          if (product) {
              let price = parsePrice(product.price);
              
              // Special Logic: Vídeo Acústico
              if (product.id === 'prod-1' || product.name.toLowerCase().includes('vídeo acústico')) {
                  if (newRec.quantidade >= 2) {
                      price = 250;
                  } else {
                      price = 350;
                  }
              }
              
              setNewRec(prev => ({ 
                  ...prev, 
                  valorUnitario: price,
                  // Also update total immediately to avoid lag
                  valorTotal: price * prev.quantidade
              }));
          }
      }
  }, [newRec.productId, newRec.quantidade, isAddModalOpen, products]);

  // 3. Calculate End Time based on Start Time and Estimated Hours
  useEffect(() => {
      if (isAddModalOpen && newRec.horaInicio && newRec.horasEstimadas) {
          try {
              const [hoursStr, minutesStr] = newRec.horaInicio.split(':');
              const startHours = parseInt(hoursStr);
              const startMinutes = parseInt(minutesStr);
              
              const totalStartMinutes = (startHours * 60) + startMinutes;
              const durationMinutes = newRec.horasEstimadas * 60;
              
              const totalEndMinutes = totalStartMinutes + durationMinutes;
              
              // Handle day rollover if needed, though usually just wrapping % 24 for display
              let endHours = Math.floor(totalEndMinutes / 60) % 24;
              let endMinutes = Math.floor(totalEndMinutes % 60);
              
              const formattedEnd = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
              
              setNewRec(prev => ({ ...prev, horaFim: formattedEnd }));
          } catch (e) {
              // ignore parse errors during typing
          }
      }
  }, [newRec.horaInicio, newRec.horasEstimadas, isAddModalOpen]);

  useEffect(() => {
    if (isEditing && editedRec) {
        const total = editedRec.valorUnitario * editedRec.quantidade;
        setEditedRec(prev => prev ? { ...prev, valorTotal: total } : null);
    }
  }, [isEditing, editedRec?.valorUnitario, editedRec?.quantidade]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
            setIsClientDropdownOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpenModal = (rec: Recording) => {
    setSelectedRec(rec);
    setEditedRec(rec);
    setIsEditing(false);
  };
  
  const handleAddNewRec = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRec.clientId || !newRec.productId || !newRec.data) return;

    const selectedOption = clientAndLeadOptions.find(opt => opt.value === newRec.clientId);
    let finalClientId = newRec.clientId;
    let newClient: Client | null = null;
    let leadToConvertId: string | null = null;
    
    if (selectedOption?.type === 'lead') {
        const leadToConvert = leads.find(l => l.id === newRec.clientId);
        if (leadToConvert) {
            newClient = {
                id: `client-${Date.now()}`,
                name: leadToConvert.name,
                whatsapp: leadToConvert.whatsapp || '',
                email: leadToConvert.email || '',
                gender: leadToConvert.gender,
                status: 'Active',
                lastProjectDate: new Date().toISOString().split('T')[0],
            };
            leadToConvertId = leadToConvert.id;
            finalClientId = newClient.id;
        }
    }

    const recToAdd: Recording = {
        id: `rec-${Date.now()}`,
        ...newRec,
        clientId: finalClientId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    
    setAppState(prev => {
        let updatedLeads = prev.leads;
        let updatedClients = prev.clients;
        
        if(newClient && leadToConvertId) {
            updatedClients = [...prev.clients, newClient];
            updatedLeads = prev.leads.map(l => l.id === leadToConvertId ? { ...l, status: LeadStatus.Convertido } : l);
        }

        return {
            ...prev,
            clients: updatedClients,
            leads: updatedLeads,
            recordings: [recToAdd, ...prev.recordings],
        }
    });

    setIsAddModalOpen(false);
    setNewRec(initialNewRecState);
    setClientSearchTerm('');
  };
  
  const handleSaveChanges = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editedRec) return;
    const updatedRec = { ...editedRec, updatedAt: new Date().toISOString() };
    setAppState(prev => ({
        ...prev,
        recordings: prev.recordings.map(r => r.id === updatedRec.id ? updatedRec : r)
    }));
    setSelectedRec(updatedRec);
    setIsEditing(false);
  };

  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>, mode: 'add' | 'edit') => {
      const productId = e.target.value;
      const product = products.find(p => p.id === productId);
      // We set standard price here, but the useEffect will override it for acoustic video logic in 'add' mode
      const price = product ? parsePrice(product.price) : 0;
      const hours = product ? product.horasEstimadas : 0;
      
      if (mode === 'add') {
        setNewRec(prev => ({...prev, productId, valorUnitario: price, horasEstimadas: hours }));
      } else if (mode === 'edit' && editedRec) {
        setEditedRec(prev => prev ? {...prev, productId, valorUnitario: price, horasEstimadas: hours} : null);
      }
  };

  const handleDeleteRecording = () => {
    if (!recordingToDelete) return;
    setAppState(prev => ({
        ...prev,
        recordings: prev.recordings.filter(r => r.id !== recordingToDelete.id)
    }));
    setRecordingToDelete(null);
  };

  const handleExportCalendar = () => {
      if (recordings.length === 0) {
          alert("Nenhuma gravação para exportar.");
          return;
      }

      let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Hope OS//Gravações//PT\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\n";

      recordings.forEach(rec => {
          if (rec.status === RecordingStatus.Cancelada) return;

          const client = clientsById[rec.clientId];
          const product = productsById[rec.productId];
          
          const startStr = `${rec.data.replace(/-/g, '')}T${rec.horaInicio.replace(':', '')}00`;
          const endStr = `${rec.data.replace(/-/g, '')}T${rec.horaFim.replace(':', '')}00`;
          const nowStr = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

          icsContent += "BEGIN:VEVENT\n";
          icsContent += `UID:${rec.id}@hopeos.app\n`;
          icsContent += `DTSTAMP:${nowStr}\n`;
          icsContent += `DTSTART:${startStr}\n`;
          icsContent += `DTEND:${endStr}\n`;
          icsContent += `SUMMARY:${product?.name || 'Gravação'} - ${client?.name || 'Cliente'}\n`;
          icsContent += `DESCRIPTION:Cliente: ${client?.name || ''}\\nServiço: ${product?.name || ''}\\nNotas: ${rec.notes || ''}\n`;
          icsContent += `STATUS:${rec.status === RecordingStatus.Concluída ? 'CONFIRMED' : 'TENTATIVE'}\n`;
          icsContent += "END:VEVENT\n";
      });

      icsContent += "END:VCALENDAR";

      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.setAttribute('download', 'agenda_gravacoes_hope.ics');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  // Date formatting helper for the card
  const formatCardDate = (dateStr: string) => {
      const date = new Date(dateStr + 'T12:00:00');
      return {
          weekday: date.toLocaleDateString('pt-BR', { weekday: 'long' }),
          day: date.getDate(),
          month: date.toLocaleDateString('pt-BR', { month: 'long' })
      };
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-primary-text">Gravações</h2>
        <div className="flex gap-3">
            <button 
                onClick={handleExportCalendar}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-border-color rounded-full text-secondary-text font-medium hover:bg-gray-50 hover:text-primary-text transition-colors"
                title="Baixar agenda para Google Calendar/Outlook"
            >
                <DownloadIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Exportar Agenda</span>
            </button>
            <button onClick={() => { setNewRec(initialNewRecState); setIsAddModalOpen(true); }} className="rounded-full px-5 py-2 bg-apple-blue text-white font-medium hover:bg-apple-blue-hover transition-colors">
            Nova Gravação
            </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden">
          {/* Left Sidebar */}
          <div className="lg:col-span-4 overflow-y-auto pr-2 custom-scrollbar space-y-6 h-full">
             {Object.keys(groupedSidebarRecordings).length > 0 ? (
                 Object.entries(groupedSidebarRecordings).map(([month, recs]: [string, RecordingWithData[]]) => (
                    <div key={month}>
                        <h3 className="text-xs font-bold text-secondary-text uppercase tracking-wider mb-3 sticky top-0 bg-app-bg py-2 z-10">{month}</h3>
                        <div className="space-y-3">
                            {recs.map(rec => (
                                <RecordingListItem
                                    key={rec.id}
                                    recording={rec}
                                    client={rec.client}
                                    product={rec.product}
                                    onClick={() => handleOpenModal(rec)}
                                    onDelete={(e) => {
                                        e.stopPropagation();
                                        setRecordingToDelete(rec);
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                 ))
             ) : (
                 <div className="text-center py-10 text-secondary-text">
                     <p>Nenhuma gravação futura agendada.</p>
                 </div>
             )}
          </div>

          {/* Right Side: Calendar */}
          <div className="lg:col-span-8 h-full overflow-hidden">
               <RecordingCalendar recordings={calendarRecordings} clientsById={clientsById} onEventClick={handleOpenModal} />
          </div>
      </div>

       {selectedRec && editedRec && (
        <Modal isOpen={!!selectedRec} onClose={() => setSelectedRec(null)} title={isEditing ? 'Editando Gravação' : ''} className={isEditing ? '' : 'bg-transparent shadow-none border-none'} headerClassName={isEditing ? '' : 'hidden'}>
          {isEditing ? (
            <form onSubmit={handleSaveChanges} className="space-y-4">
               {/* Edit Form Content */}
               <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-secondary-text mb-1">Cliente</label>
                        <input value={clientsById[editedRec.clientId]?.name || 'Cliente não encontrado'} disabled className="w-full px-3 py-2 border border-border-color rounded-lg bg-gray-100" />
                    </div>
                    <div>
                        <label htmlFor="productId" className="block text-sm font-medium text-secondary-text mb-1">Produto/Serviço</label>
                        <select name="productId" value={editedRec.productId} onChange={(e) => handleProductChange(e, 'edit')} className="w-full px-3 py-2 border border-border-color rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-apple-blue transition-shadow">
                            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="valorUnitario" className="block text-sm font-medium text-secondary-text mb-1">Valor (R$)</label>
                        <input type="number" name="valorUnitario" value={editedRec.valorUnitario} onChange={(e) => setEditedRec({...editedRec, valorUnitario: parseFloat(e.target.value) || 0})} className="w-full px-3 py-2 border border-border-color rounded-lg bg-white"/>
                    </div>
                    <div>
                        <label htmlFor="quantidade" className="block text-sm font-medium text-secondary-text mb-1">Quantidade</label>
                        <input type="number" name="quantidade" min="1" value={editedRec.quantidade} onChange={(e) => setEditedRec({...editedRec, quantidade: parseInt(e.target.value) || 1})} className="w-full px-3 py-2 border border-border-color rounded-lg bg-white"/>
                    </div>
                     <div className="col-span-2">
                        <label htmlFor="valorTotal" className="block text-sm font-medium text-secondary-text mb-1">Valor Total (R$)</label>
                        <input type="number" name="valorTotal" value={editedRec.valorTotal} onChange={(e) => setEditedRec({...editedRec, valorTotal: parseFloat(e.target.value) || 0})} className="w-full px-3 py-2 border border-border-color rounded-lg bg-white"/>
                    </div>
                     <div className="col-span-2">
                        <label htmlFor="horasEstimadas" className="block text-sm font-medium text-secondary-text mb-1">Horas</label>
                        <input type="number" name="horasEstimadas" min="0" step="0.5" value={editedRec.horasEstimadas} onChange={(e) => setEditedRec({...editedRec, horasEstimadas: parseFloat(e.target.value) || 0})} className="w-full px-3 py-2 border border-border-color rounded-lg bg-white"/>
                    </div>
                    <div>
                        <label htmlFor="data" className="block text-sm font-medium text-secondary-text mb-1">Data</label>
                        <input type="date" name="data" value={editedRec.data} onChange={(e) => setEditedRec({...editedRec, data: e.target.value})} className="w-full px-3 py-2 border border-border-color rounded-lg bg-white"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-secondary-text mb-1">Horário</label>
                        <div className="flex gap-2">
                            <input type="time" name="horaInicio" value={editedRec.horaInicio} onChange={(e) => setEditedRec({...editedRec, horaInicio: e.target.value})} className="w-full px-3 py-2 border border-border-color rounded-lg bg-white"/>
                            <input type="time" name="horaFim" value={editedRec.horaFim} onChange={(e) => setEditedRec({...editedRec, horaFim: e.target.value})} className="w-full px-3 py-2 border border-border-color rounded-lg bg-white"/>
                        </div>
                    </div>
                     <div className="col-span-2">
                         <label htmlFor="statusPagamentoInicial" className="block text-sm font-medium text-secondary-text mb-1">Status do Pagamento</label>
                         <select name="statusPagamentoInicial" value={editedRec.statusPagamentoInicial} onChange={(e) => setEditedRec({...editedRec, statusPagamentoInicial: e.target.value as PaymentStatus})} className="w-full px-3 py-2 border border-border-color rounded-lg bg-white">
                            {Object.values(PaymentStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="col-span-2">
                         <label htmlFor="status" className="block text-sm font-medium text-secondary-text mb-1">Status</label>
                         <select name="status" value={editedRec.status} onChange={(e) => setEditedRec({...editedRec, status: e.target.value as RecordingStatus})} className="w-full px-3 py-2 border border-border-color rounded-lg bg-white">
                            {Object.values(RecordingStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
               </div>
              <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => { setIsEditing(false); setEditedRec(selectedRec); }} className="rounded-full px-4 py-2 bg-white border border-gray-200 text-gray-700 font-medium hover:bg-gray-100 transition-colors">Cancelar</button>
                  <button type="submit" className="rounded-full px-5 py-2 bg-apple-blue text-white font-medium hover:bg-apple-blue-hover transition-colors">Salvar Alterações</button>
              </div>
            </form>
          ) : (
             // PREMIUM CONFIRMATION CARD
             <div className="flex flex-col items-center">
                 <div className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100 w-full max-w-md relative">
                    {/* Gradient Top Bar */}
                    <div className="h-3 w-full bg-gradient-to-r from-[#007AFF] via-[#AF52DE] to-[#FF2D55]"></div>

                    <div className="p-8 space-y-6">
                        {/* Header */}
                        <div className="text-center">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-3">HOPE RISE STUDIOS</h3>
                            <h2 className="text-2xl font-bold text-gray-900 leading-tight">Confirmação da<br/>Sua Gravação</h2>
                        </div>

                        {/* Hero Date & Time */}
                        <div className="bg-gray-50 rounded-2xl p-6 text-center border border-gray-100/80">
                            <p className="text-indigo-600 font-bold text-xs uppercase tracking-wide mb-1">
                                {formatCardDate(selectedRec.data).weekday}
                            </p>
                            <p className="text-3xl font-bold text-gray-900 mb-2">
                                {formatCardDate(selectedRec.data).day} de {formatCardDate(selectedRec.data).month}
                            </p>
                            <div className="flex items-center justify-center gap-2 text-gray-600 mt-2 bg-white px-3 py-1 rounded-full inline-flex shadow-sm border border-gray-100">
                                <ClockIcon className="w-4 h-4 text-gray-400" />
                                <span className="text-base font-medium font-mono tracking-tight">{selectedRec.horaInicio} — {selectedRec.horaFim}</span>
                            </div>
                        </div>

                        {/* Details List */}
                        <div className="space-y-4 px-2">
                            <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                                <span className="text-sm text-gray-400 font-medium">Cliente</span>
                                <span className="text-sm font-semibold text-gray-900">{clientsById[selectedRec.clientId]?.name}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                                <span className="text-sm text-gray-400 font-medium">Serviço</span>
                                <span className="text-sm font-bold text-indigo-600">{productsById[selectedRec.productId]?.name}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                                <span className="text-sm text-gray-400 font-medium">Duração</span>
                                <span className="text-sm font-medium text-gray-900">{selectedRec.horasEstimadas}h</span>
                            </div>
                             <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-400 font-medium">Status</span>
                                <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-full ${statusColors[selectedRec.status]}`}>
                                    {selectedRec.status}
                                </span>
                            </div>
                        </div>

                        {/* Notes Section */}
                        {selectedRec.notes && (
                            <div className="bg-yellow-50/50 p-4 rounded-xl border border-yellow-100/50 text-center">
                                <p className="text-sm text-yellow-800 italic">
                                    "{selectedRec.notes}"
                                </p>
                            </div>
                        )}

                        {/* Footer */}
                        <div className="text-center pt-4 border-t border-gray-100">
                            <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase">
                                Hope Rise • Produção Musical & Áudio/Vídeo
                            </p>
                        </div>
                    </div>
                 </div>

                 {/* Action Buttons Outside Card */}
                 <div className="mt-6 flex items-center gap-4">
                     <button
                        onClick={() => {
                            if (selectedRec) {
                                setRecordingToDelete(selectedRec);
                                setSelectedRec(null);
                            }
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-red-600 hover:bg-white rounded-full transition-all text-sm font-medium"
                     >
                         <TrashIcon className="w-4 h-4" />
                         Excluir
                     </button>
                     
                     <button 
                        onClick={() => setSelectedRec(null)} 
                        className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full text-sm font-medium transition-colors"
                     >
                         Fechar
                     </button>

                     <button
                        onClick={() => setIsEditing(true)}
                        className="px-6 py-2 bg-white text-apple-blue border border-apple-blue hover:bg-blue-50 rounded-full text-sm font-bold transition-colors shadow-sm"
                     >
                        Editar
                     </button>
                 </div>
             </div>
          )}
        </Modal>
      )}

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Agendar Nova Gravação">
            <form onSubmit={handleAddNewRec} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 relative" ref={dropdownRef}>
                        <label htmlFor="clientSearch" className="block text-sm font-medium text-secondary-text mb-1">Cliente ou Lead</label>
                        <div className="relative">
                            <input
                                id="clientSearch"
                                type="text"
                                className="w-full px-3 py-2 border border-border-color rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-apple-blue pr-10"
                                placeholder="Selecione ou busque o cliente..."
                                value={clientSearchTerm}
                                onChange={(e) => {
                                    setClientSearchTerm(e.target.value);
                                    if (newRec.clientId && e.target.value !== clientAndLeadOptions.find(opt => opt.value === newRec.clientId)?.label) {
                                        setNewRec(prev => ({ ...prev, clientId: '' }));
                                    }
                                    setIsClientDropdownOpen(true);
                                }}
                                onFocus={() => setIsClientDropdownOpen(true)}
                                autoComplete="off"
                                required={!newRec.clientId}
                            />
                            <div 
                                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-primary-text"
                                onClick={() => {
                                    setIsClientDropdownOpen(!isClientDropdownOpen);
                                    if (!isClientDropdownOpen) {
                                        document.getElementById('clientSearch')?.focus();
                                    }
                                }}
                            >
                                <ChevronDownIcon />
                            </div>
                        </div>
                        
                        {isClientDropdownOpen && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-border-color rounded-lg shadow-lg max-h-60 overflow-y-auto animate-fadeIn">
                                {filteredClientOptions.length > 0 ? (
                                    filteredClientOptions.map(opt => (
                                        <div
                                            key={opt.value}
                                            className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm text-primary-text border-b border-gray-50 last:border-0 flex justify-between items-center"
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                setNewRec(prev => ({ ...prev, clientId: opt.value }));
                                                setClientSearchTerm(opt.label);
                                                setIsClientDropdownOpen(false);
                                            }}
                                        >
                                            <span>{opt.label}</span>
                                            {opt.value === newRec.clientId && <span className="text-apple-blue text-xs font-bold">✓</span>}
                                        </div>
                                    ))
                                ) : (
                                    <div className="px-4 py-3 text-sm text-gray-400 text-center">Nenhum cliente encontrado.</div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="col-span-2">
                        <label htmlFor="productId" className="block text-sm font-medium text-secondary-text mb-1">Produto/Serviço</label>
                        <select name="productId" value={newRec.productId} onChange={(e) => handleProductChange(e, 'add')} className="w-full px-3 py-2 border border-border-color rounded-lg bg-white" required>
                            <option value="" disabled>Selecione...</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="valorUnitario" className="block text-sm font-medium text-secondary-text mb-1">Valor (R$)</label>
                        <input type="number" name="valorUnitario" value={newRec.valorUnitario} onChange={(e) => setNewRec({...newRec, valorUnitario: parseFloat(e.target.value) || 0})} className="w-full px-3 py-2 border border-border-color rounded-lg bg-white" required/>
                    </div>
                    <div>
                        <label htmlFor="quantidade" className="block text-sm font-medium text-secondary-text mb-1">Quantidade</label>
                        <input type="number" name="quantidade" min="1" value={newRec.quantidade} onChange={(e) => setNewRec({...newRec, quantidade: parseInt(e.target.value) || 1})} className="w-full px-3 py-2 border border-border-color rounded-lg bg-white" required/>
                    </div>
                    <div>
                        <label htmlFor="valorTotal" className="block text-sm font-medium text-secondary-text mb-1">Valor Total (R$)</label>
                        <input type="number" name="valorTotal" value={newRec.valorTotal} onChange={(e) => setNewRec({...newRec, valorTotal: parseFloat(e.target.value) || 0})} className="w-full px-3 py-2 border border-border-color rounded-lg bg-white" required/>
                    </div>
                    <div>
                        <label htmlFor="horasEstimadas" className="block text-sm font-medium text-secondary-text mb-1">Horas (Estimadas)</label>
                        <input type="number" name="horasEstimadas" min="0" step="0.5" value={newRec.horasEstimadas} onChange={(e) => setNewRec({...newRec, horasEstimadas: parseFloat(e.target.value) || 0})} className="w-full px-3 py-2 border border-border-color rounded-lg bg-white" required/>
                    </div>
                    <div>
                        <label htmlFor="data" className="block text-sm font-medium text-secondary-text mb-1">Data</label>
                        <input type="date" name="data" value={newRec.data} onChange={(e) => setNewRec({...newRec, data: e.target.value})} className="w-full px-3 py-2 border border-border-color rounded-lg bg-white" required/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-secondary-text mb-1">Horário</label>
                        <div className="flex gap-2 items-end">
                            <div className="flex-1">
                                <label className="text-[10px] text-secondary-text mb-0.5 block">Início</label>
                                <input type="time" name="horaInicio" value={newRec.horaInicio} onChange={(e) => setNewRec({...newRec, horaInicio: e.target.value})} className="w-full px-3 py-2 border border-border-color rounded-lg bg-white" required/>
                            </div>
                            <div className="flex-1">
                                <label className="text-[10px] text-secondary-text mb-0.5 block">Fim (Automático)</label>
                                <input type="time" name="horaFim" value={newRec.horaFim} onChange={(e) => setNewRec({...newRec, horaFim: e.target.value})} className="w-full px-3 py-2 border border-border-color rounded-lg bg-gray-50 text-gray-600" required/>
                            </div>
                        </div>
                    </div>
                    <div className="col-span-2">
                        <label htmlFor="statusPagamentoInicial" className="block text-sm font-medium text-secondary-text mb-1">Status do Pagamento</label>
                        <select name="statusPagamentoInicial" value={newRec.statusPagamentoInicial} onChange={(e) => setNewRec({...newRec, statusPagamentoInicial: e.target.value as PaymentStatus})} className="w-full px-3 py-2 border border-border-color rounded-lg bg-white">
                            {Object.values(PaymentStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="col-span-2">
                        <label htmlFor="notes" className="block text-sm font-medium text-secondary-text mb-1">Notas/Observações</label>
                        <textarea name="notes" value={newRec.notes} onChange={(e) => setNewRec({...newRec, notes: e.target.value})} rows={3} className="w-full px-3 py-2 border border-border-color rounded-lg bg-white"></textarea>
                    </div>
                </div>
                <div className="pt-4 flex justify-end gap-3">
                    <button type="button" onClick={() => setIsAddModalOpen(false)} className="rounded-full px-4 py-2 bg-white border border-gray-200 text-gray-700 font-medium hover:bg-gray-100 transition-colors">Cancelar</button>
                    <button type="submit" className="rounded-full px-5 py-2 bg-apple-blue text-white font-medium hover:bg-apple-blue-hover transition-colors">Salvar Gravação</button>
                </div>
            </form>
        </Modal>

        {recordingToDelete && (
            <Modal
                isOpen={!!recordingToDelete}
                onClose={() => setRecordingToDelete(null)}
                title="Confirmar Exclusão"
            >
                <div className="text-center">
                    <p className="text-secondary-text">
                        Tem certeza que deseja excluir a gravação de <strong className="text-primary-text">{clientsById[recordingToDelete.clientId]?.name || 'Cliente desconhecido'}</strong> do dia {new Date(recordingToDelete.data + 'T12:00:00').toLocaleDateString('pt-BR')}?
                    </p>
                    <p className="text-secondary-text mt-2">Esta ação não pode ser desfeita.</p>
                    <div className="mt-6 flex justify-center gap-4">
                        <button
                            onClick={() => setRecordingToDelete(null)}
                            className="rounded-full px-6 py-2 bg-white border border-gray-200 text-gray-700 font-medium hover:bg-gray-100 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleDeleteRecording}
                            className="rounded-full px-6 py-2 bg-apple-red text-white font-medium hover:bg-red-700 transition-colors"
                        >
                            Confirmar Exclusão
                        </button>
                    </div>
                </div>
            </Modal>
        )}
    </div>
  );
};
