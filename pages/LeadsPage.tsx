
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { LeadStatus, Client, CopyCategory, RecordingStatus, StatusPagamento, Product, LancamentoFinanceiro, ClientActivity, CalendarEvent } from '../types';
import { Modal } from '../components/Modal';
import { AbstractAvatar } from '../components/AbstractAvatar';
import { useAppContext } from '../context/AppContext';
import { TrashIcon, UserPlusIcon, CalendarIcon, PhoneIcon, MegaphoneIcon, RecordingsIcon, DollarSignIcon, ClockIcon, RefreshIcon, WhatsAppIcon, StarIcon } from '../components/icons/Icons';
import { GoogleGenAI } from "@google/genai";
import { sendWhatsAppMessage } from '../utils/whatsapp';

const statusColors: { [key in LeadStatus]: string } = {
  [LeadStatus.Novo]: 'bg-blue-100 text-blue-800',
  [LeadStatus.EmConversa]: 'bg-yellow-100 text-yellow-800',
  [LeadStatus.Esfriou]: 'bg-indigo-100 text-indigo-800',
  [LeadStatus.Convertido]: 'bg-green-100 text-green-800',
};

const recordingStatusColors: { [key in RecordingStatus]: string } = {
  [RecordingStatus.Agendada]: 'bg-blue-100 text-blue-800',
  [RecordingStatus.Concluída]: 'bg-green-100 text-green-800',
  [RecordingStatus.Cancelada]: 'bg-red-100 text-red-800',
};

// --- WhatsApp Template Menu ---
interface WhatsAppMenuProps {
    isOpen: boolean;
    onClose: () => void;
    phoneNumber: string;
    templates: { title: string; content: string }[];
    position: { x: number; y: number };
    sendMethod: 'browser' | 'extension';
}

const WhatsAppMenu: React.FC<WhatsAppMenuProps> = ({ isOpen, onClose, phoneNumber, templates, position, sendMethod }) => {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleSend = async (text: string) => {
        await sendWhatsAppMessage(phoneNumber, text, sendMethod);
        onClose();
    };

    return (
        <div 
            ref={menuRef}
            className="fixed z-[60] w-72 bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden animate-fadeIn"
            style={{ top: position.y, left: position.x }}
        >
            <div className="bg-gray-50/50 px-4 py-3 border-b border-border-color/50">
                <div className="flex items-center gap-2">
                    <WhatsAppIcon className="w-4 h-4 text-green-600" />
                    <p className="text-[10px] font-bold text-secondary-text uppercase tracking-wider">Modelos de Mensagem</p>
                </div>
            </div>
            <div className="max-h-80 overflow-y-auto custom-scrollbar p-1">
                {templates.length > 0 ? (
                    templates.map((tpl, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleSend(tpl.content)}
                            className="w-full text-left px-4 py-3 hover:bg-apple-blue/5 rounded-xl transition-all group"
                        >
                            <p className="text-sm font-bold text-primary-text group-hover:text-apple-blue transition-colors">{tpl.title}</p>
                            <p className="text-xs text-secondary-text line-clamp-2 mt-1 leading-relaxed">{tpl.content}</p>
                        </button>
                    ))
                ) : (
                    <div className="p-6 text-center">
                        <WhatsAppIcon className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                        <p className="text-xs text-secondary-text mb-3">Nenhum modelo salvo.</p>
                        <button onClick={() => handleSend('')} className="text-xs bg-apple-blue text-white px-4 py-2 rounded-full font-bold hover:bg-apple-blue-hover transition-colors">Iniciar Conversa</button>
                    </div>
                )}
            </div>
            <div className="p-2 bg-gray-50/30 border-t border-border-color/30">
                <button onClick={() => handleSend('')} className="w-full py-2 text-[10px] font-bold text-apple-blue uppercase hover:bg-white rounded-lg transition-colors">
                    Enviar Mensagem Vazia
                </button>
            </div>
        </div>
    );
};

// --- KanbanCard Component ---
interface KanbanCardProps {
  client: Client;
  onClick: () => void;
  onWhatsAppClick: (e: React.MouseEvent, phone: string) => void;
}
const KanbanCard: React.FC<KanbanCardProps> = ({ client, onClick, onWhatsAppClick }) => {
  const onDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    e.dataTransfer.setData('clientId', id);
  };

  // Lógica de Lead Frio: Criado há mais de 10 dias e ainda em "Novo" ou "Conversa" sem follow-up futuro
  const isColding = useMemo(() => {
    if (client.leadStage === LeadStatus.Esfriou || client.leadStage === LeadStatus.Convertido) return false;
    const createdAt = client.createdAt ? new Date(client.createdAt) : new Date();
    const diffDays = Math.floor((new Date().getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 10 && !client.nextFollowUp;
  }, [client]);

  return (
    <div
      draggable
      onClick={onClick}
      onDragStart={(e) => onDragStart(e, client.id)}
      className={`group bg-white rounded-lg border p-4 mb-4 cursor-grab active:cursor-grabbing shadow-sm hover:border-apple-blue transition-all hover:shadow-md relative ${isColding ? 'border-l-4 border-l-indigo-400' : 'border-border-color'}`}
    >
      {isColding && (
          <div className="absolute -top-2 -right-1 bg-indigo-500 text-white rounded-full p-1 shadow-sm" title="Lead esfriando...">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h10"/><path d="M9 4v16"/><path d="m3 9 3 3-3 3"/><path d="M12 6 9 9 6 6"/><path d="m20 12-3 3-3-3"/><path d="M14 18 17 15 20 18"/><path d="M17 4v12"/><path d="M22 12h-10"/></svg>
          </div>
      )}
      <div className="flex items-center gap-3">
        <AbstractAvatar name={client.name} gender={client.gender} size={40} />
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-primary-text truncate">{client.name}</h4>
          <p className="text-sm text-secondary-text truncate">{client.company || 'Pessoa Física'}</p>
        </div>
      </div>
      
      <div className="mt-4 flex items-center justify-between">
          <div className="text-xs text-secondary-text">
            {client.createdAt ? new Date(client.createdAt).toLocaleDateString('pt-BR') : 'Sem data'}
          </div>
          
          <button 
            onClick={(e) => {
                e.stopPropagation();
                onWhatsAppClick(e, client.whatsapp);
            }}
            className="p-1.5 rounded-full bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
            title="WhatsApp"
          >
              <WhatsAppIcon className="w-4 h-4" />
          </button>
      </div>

      {client.nextFollowUp && (
          <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-1 text-xs text-apple-blue font-medium">
              <CalendarIcon className="w-3 h-3" />
              <span>{new Date(client.nextFollowUp + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
          </div>
      )}
    </div>
  );
};

// --- KanbanColumn Component ---
interface KanbanColumnProps {
  status: LeadStatus;
  clients: Client[];
  onDrop: (status: LeadStatus, e: React.DragEvent<HTMLDivElement>) => void;
  onCardClick: (client: Client) => void;
  onWhatsAppClick: (e: React.MouseEvent, phone: string) => void;
}
const KanbanColumn: React.FC<KanbanColumnProps> = ({ status, clients, onDrop, onCardClick, onWhatsAppClick }) => {
  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    onDrop(status, e);
  };
  
  return (
    <div onDragOver={onDragOver} onDrop={handleDrop} className="flex-1 min-w-[280px] bg-gray-50/50 rounded-2xl p-4 h-full overflow-y-auto custom-scrollbar">
      <div className="flex items-center justify-between mb-4 sticky top-0 bg-gray-50/50 py-2 z-10">
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[status]}`}>{status}</span>
        <span className="text-sm font-semibold text-secondary-text">{clients.length}</span>
      </div>
      <div>
        {clients.map(client => <KanbanCard key={client.id} client={client} onClick={() => onCardClick(client)} onWhatsAppClick={onWhatsAppClick} />)}
      </div>
    </div>
  );
};

export const LeadsPage: React.FC = () => {
  const { appState, setAppState } = useAppContext();
  const { clients, copywriting, recordings, lancamentos, products } = appState;

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [detailTab, setDetailTab] = useState<'info' | 'history' | 'finance'>('info');
  
  const [newLeadForm, setNewLeadForm] = useState<Partial<Client>>({ 
      name: '', 
      company: '', 
      gender: 'female', 
      whatsapp: '', 
      status: 'Lead', 
      leadStage: LeadStatus.Novo 
  });
  const [useExistingClient, setUseExistingClient] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [magicPasteText, setMagicPasteText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      setIsParsing(true);
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: `Analise este histórico de conversa do WhatsApp e extraia as informações para o CRM. 
          Responda APENAS em JSON no formato: 
          {
            "name": "Nome do Cliente", 
            "whatsapp": "Número com DDD", 
            "summary": "Resumo da conversa e o que foi combinado",
            "suggestedStatus": "Novo" | "Em Conversa" | "Esfriou" | "Convertido",
            "nextAction": "O que fazer a seguir"
          }
          
          Conversa:
          ${content.slice(0, 10000)}`, // Limitando para não estourar o contexto se for gigante
          config: { responseMimeType: "application/json" }
        });

        const result = JSON.parse(response.text || '{}');
        if (result.name) {
          const newActivity: ClientActivity = {
            id: `act-${Date.now()}`,
            type: 'whatsapp_import',
            content: `Importação de Chat: ${result.summary}\n\nPRÓXIMA AÇÃO: ${result.nextAction}`,
            date: new Date().toISOString()
          };
          const newLead: Client = {
            id: `client-${Date.now()}`,
            name: result.name,
            whatsapp: result.whatsapp || '',
            status: result.suggestedStatus === 'Convertido' ? 'Active' : 'Lead',
            leadStage: result.suggestedStatus || LeadStatus.Novo,
            notes: result.summary,
            history: [newActivity],
            createdAt: new Date().toISOString(),
            lastProjectDate: 'N/A',
            gender: 'female'
          };
          setAppState(prev => ({ ...prev, clients: [newLead, ...prev.clients] }));
          alert(`Lead "${result.name}" importado com sucesso com base na conversa!`);
        }
      } catch (error) {
        console.error("Erro ao processar arquivo:", error);
        alert("Erro ao analisar a conversa. Verifique o formato do arquivo.");
      } finally {
        setIsParsing(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleMagicPaste = async () => {
    if (!magicPasteText.trim()) return;
    setIsParsing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Extraia o NOME, o WHATSAPP (com DDD) e um BREVE RESUMO do interesse deste contato. Responda APENAS em JSON no formato: {"name": "...", "whatsapp": "...", "summary": "..."}. Se não encontrar, deixe vazio. Texto: "${magicPasteText}"`,
        config: { responseMimeType: "application/json" }
      });
      
      const result = JSON.parse(response.text || '{}');
      if (result.name || result.whatsapp) {
        setNewLeadForm(prev => ({
          ...prev,
          name: result.name || prev.name,
          whatsapp: result.whatsapp || prev.whatsapp,
          notes: result.summary || prev.notes
        }));
        setMagicPasteText('');
      }
    } catch (error) {
      console.error("Erro ao processar texto:", error);
    } finally {
      setIsParsing(false);
    }
  };

  const [whatsAppMenuOpen, setWhatsAppMenuOpen] = useState(false);
  const [whatsAppMenuPos, setWhatsAppMenuPos] = useState({ x: 0, y: 0 });
  const [activePhone, setActivePhone] = useState('');
  const [newNote, setNewNote] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTitle, setScheduleTitle] = useState('Entrar em contato');

  const handleAddNote = () => {
    if (!selectedClient || !newNote.trim()) return;
    const activity: ClientActivity = {
      id: `act-${Date.now()}`,
      type: 'note',
      content: newNote,
      date: new Date().toISOString()
    };
    setAppState(prev => ({
      ...prev,
      clients: prev.clients.map(c => c.id === selectedClient.id ? { ...c, history: [activity, ...(c.history || [])] } : c)
    }));
    setSelectedClient(prev => prev ? { ...prev, history: [activity, ...(prev.history || [])] } : null);
    setNewNote('');
  };

  const handleScheduleTask = () => {
    if (!selectedClient || !scheduleDate) return;
    const calendarEvent: CalendarEvent = {
      id: `evt-${Date.now()}`,
      title: `${scheduleTitle}: ${selectedClient.name}`,
      date: scheduleDate,
      description: `Tarefa agendada para o lead ${selectedClient.name}`,
      color: 'blue',
      source: 'Lead'
    };
    const activity: ClientActivity = {
      id: `act-${Date.now()}-task`,
      type: 'task',
      content: `Tarefa agendada: ${scheduleTitle} para ${new Date(scheduleDate).toLocaleDateString('pt-BR')}`,
      date: new Date().toISOString()
    };
    setAppState(prev => ({
      ...prev,
      calendarEvents: [calendarEvent, ...prev.calendarEvents],
      clients: prev.clients.map(c => c.id === selectedClient.id ? { ...c, nextFollowUp: scheduleDate, history: [activity, ...(c.history || [])] } : c)
    }));
    setSelectedClient(prev => prev ? { ...prev, nextFollowUp: scheduleDate, history: [activity, ...(prev.history || [])] } : null);
    setScheduleDate('');
    alert('Tarefa agendada com sucesso!');
  };

  const whatsAppTemplates = copywriting.filter(c => c.category === CopyCategory.WhatsApp);
  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const leadsInPipeline = useMemo(() => {
    return clients.filter(c => c.leadStage !== undefined);
  }, [clients]);

  // Leads que podem ser "esfriados" automaticamente (Mais de 15 dias sem follow up em colunas quentes)
  const coldLeadsCandidates = useMemo(() => {
    return leadsInPipeline.filter(c => {
        if (c.leadStage === LeadStatus.Esfriou || c.leadStage === LeadStatus.Convertido) return false;
        const created = c.createdAt ? new Date(c.createdAt) : new Date();
        const diff = Math.floor((new Date().getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        return diff > 15 && !c.nextFollowUp;
    });
  }, [leadsInPipeline]);

  const sweepColdLeads = () => {
      if (coldLeadsCandidates.length === 0) {
          alert("Nenhum lead estagnado detectado no momento.");
          return;
      }
      if (confirm(`Mover ${coldLeadsCandidates.length} leads estagnados para a coluna "Esfriou"?`)) {
          const coldIds = new Set(coldLeadsCandidates.map(c => c.id));
          setAppState(prev => ({
              ...prev,
              clients: prev.clients.map(c => coldIds.has(c.id) ? { ...c, leadStage: LeadStatus.Esfriou } : c)
          }));
      }
  };

  // Derived data for the selected lead
  const clientProjects = useMemo(() => {
    if (!selectedClient) return [];
    return recordings.filter(r => r.clientId === selectedClient.id).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [selectedClient, recordings]);

  const clientFinances = useMemo(() => {
    if (!selectedClient) return { ltv: 0, pending: 0, list: [] };
    const list = lancamentos.filter(l => l.clienteId === selectedClient.id);
    const ltv = list.reduce((sum, l) => sum + l.valorRecebido, 0);
    const pending = list.reduce((sum, l) => sum + (l.valorPrevisto - l.valorRecebido), 0);
    return { ltv, pending, list };
  }, [selectedClient, lancamentos]);

  const handleWhatsAppClick = (e: React.MouseEvent, phone: string) => {
      e.preventDefault();
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      setWhatsAppMenuPos({ x: Math.min(rect.left, window.innerWidth - 270), y: Math.min(rect.bottom + 5, window.innerHeight - 300) });
      setActivePhone(phone);
      setWhatsAppMenuOpen(true);
  };

  const handleDrop = (newStage: LeadStatus, e: React.DragEvent<HTMLDivElement>) => {
    const clientId = e.dataTransfer.getData('clientId');
    if (clientId) {
        const activity: ClientActivity = {
            id: `act-${Date.now()}-drop`,
            type: 'system',
            content: `Status alterado para: ${newStage}`,
            date: new Date().toISOString()
        };
        setAppState(prev => ({
            ...prev,
            clients: prev.clients.map(c => {
                if (c.id === clientId) {
                    const status = newStage === LeadStatus.Convertido ? 'Active' : 'Lead';
                    return { ...c, leadStage: newStage, status: status as Client['status'], history: [activity, ...(c.history || [])] };
                }
                return c;
            })
        }));
    }
  };

  const handleAddNewLead = (e: React.FormEvent) => {
    e.preventDefault();
    const initialActivity: ClientActivity = {
        id: `act-${Date.now()}-init`,
        type: 'system',
        content: newLeadForm.notes ? `Lead criado com resumo: ${newLeadForm.notes}` : 'Lead criado no sistema',
        date: new Date().toISOString()
    };
    if (useExistingClient && newLeadForm.id) {
        setAppState(prev => ({
            ...prev,
            clients: prev.clients.map(c => c.id === newLeadForm.id ? { ...c, leadStage: LeadStatus.Novo, status: 'Lead', history: [initialActivity, ...(c.history || [])] } : c)
        }));
    } else if (newLeadForm.name && newLeadForm.whatsapp) {
        const contactToAdd: Client = {
            id: `client-${Date.now()}`,
            name: newLeadForm.name,
            company: newLeadForm.company,
            whatsapp: newLeadForm.whatsapp,
            gender: newLeadForm.gender as 'male' | 'female',
            status: 'Lead',
            leadStage: LeadStatus.Novo,
            lastProjectDate: 'N/A',
            history: [initialActivity],
            createdAt: new Date().toISOString()
        };
        setAppState(prev => ({ ...prev, clients: [contactToAdd, ...prev.clients] }));
    }
    setIsAddModalOpen(false);
    setNewLeadForm({ name: '', company: '', gender: 'female', whatsapp: '', status: 'Lead', leadStage: LeadStatus.Novo });
  };

  const handleConvertToClient = () => {
      if (!selectedClient) return;
      setAppState(prev => ({
          ...prev,
          clients: prev.clients.map(c => c.id === selectedClient.id ? { ...c, status: 'Active', leadStage: LeadStatus.Convertido } : c)
      }));
      alert(`${selectedClient.name} agora é um Cliente Ativo!`);
      setSelectedClient(null);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-primary-text">Pipeline de Vendas</h2>
            {coldLeadsCandidates.length > 0 && (
                <button 
                    onClick={sweepColdLeads}
                    className="flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase rounded-full border border-indigo-100 hover:bg-indigo-100 transition-all"
                >
                    <RefreshIcon className="w-3 h-3" /> {coldLeadsCandidates.length} Leads Estagnados
                </button>
            )}
        </div>
        <div className="flex items-center gap-3">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept=".txt" 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isParsing}
            className="rounded-full px-4 py-2 bg-white border border-border-color text-secondary-text text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            {isParsing ? <RefreshIcon className="w-4 h-4 animate-spin" /> : <WhatsAppIcon className="w-4 h-4 text-green-600" />}
            {isParsing ? 'Analisando...' : 'Importar Chat (.txt)'}
          </button>
          <button onClick={() => setIsAddModalOpen(true)} className="rounded-full px-5 py-2 bg-apple-blue text-white font-medium hover:bg-apple-blue-hover transition-colors">
            Novo Lead
          </button>
        </div>
      </div>
      <div className="flex-1 flex gap-6 overflow-x-auto pb-4">
        {Object.values(LeadStatus).map(status => (
          <KanbanColumn
            key={status}
            status={status}
            clients={leadsInPipeline.filter(c => c.leadStage === status)}
            onCardClick={(c) => { setSelectedClient(c); setDetailTab('info'); }}
            onDrop={handleDrop}
            onWhatsAppClick={handleWhatsAppClick}
          />
        ))}
      </div>

       {selectedClient && (
        <Modal isOpen={!!selectedClient} onClose={() => setSelectedClient(null)} title={isEditing ? `Editando Lead` : 'Dossiê do Contato'} className="max-w-2xl">
           {!isEditing && (
            <div className="flex border-b border-border-color mb-6">
                <button onClick={() => setDetailTab('info')} className={`px-4 py-2 text-sm font-medium transition-colors relative ${detailTab === 'info' ? 'text-apple-blue' : 'text-secondary-text hover:text-primary-text'}`}>
                    Dados
                    {detailTab === 'info' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-apple-blue rounded-full"></span>}
                </button>
                <button onClick={() => setDetailTab('history')} className={`px-4 py-2 text-sm font-medium transition-colors relative ${detailTab === 'history' ? 'text-apple-blue' : 'text-secondary-text hover:text-primary-text'}`}>
                    Histórico {clientProjects.length > 0 && <span className="ml-1 bg-gray-100 px-1.5 py-0.5 rounded-full text-[10px]">{clientProjects.length}</span>}
                    {detailTab === 'history' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-apple-blue rounded-full"></span>}
                </button>
                <button onClick={() => setDetailTab('finance')} className={`px-4 py-2 text-sm font-medium transition-colors relative ${detailTab === 'finance' ? 'text-apple-blue' : 'text-secondary-text hover:text-primary-text'}`}>
                    Financeiro
                    {detailTab === 'finance' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-apple-blue rounded-full"></span>}
                </button>
            </div>
          )}

          {detailTab === 'info' && !isEditing && (
             <div className="flex flex-col">
                <div className="flex items-center gap-6 mb-8">
                    <AbstractAvatar name={selectedClient.name} gender={selectedClient.gender} size={80} />
                    <div className="flex-1">
                        <h3 className="text-2xl font-black text-primary-text">{selectedClient.name}</h3>
                        <p className="text-secondary-text font-medium">{selectedClient.company || 'Pessoa Física'}</p>
                        <div className="mt-2 flex items-center gap-2">
                             <span className={`px-3 py-1 text-[10px] font-black uppercase rounded-full ${statusColors[selectedClient.leadStage as LeadStatus]}`}>{selectedClient.leadStage}</span>
                             {selectedClient.nextFollowUp && (
                                 <span className="px-3 py-1 text-[10px] font-black uppercase rounded-full bg-blue-50 text-blue-700 border border-blue-100 flex items-center gap-1">
                                     <CalendarIcon className="w-3 h-3" /> {new Date(selectedClient.nextFollowUp + 'T12:00:00').toLocaleDateString('pt-BR')}
                                 </span>
                             )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Notepad Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-black text-primary-text uppercase tracking-wider">Bloco de Notas / Timeline</h4>
                        </div>
                        <div className="bg-gray-50 rounded-2xl p-4 border border-border-color/60">
                            <textarea 
                                value={newNote}
                                onChange={e => setNewNote(e.target.value)}
                                placeholder="Escreva uma nova nota ou observação..."
                                className="w-full bg-transparent text-sm border-none focus:ring-0 resize-none h-20 placeholder:text-gray-400"
                            />
                            <div className="flex justify-end mt-2">
                                <button 
                                    onClick={handleAddNote}
                                    disabled={!newNote.trim()}
                                    className="px-4 py-1.5 bg-apple-blue text-white text-[10px] font-black uppercase rounded-full hover:bg-apple-blue-hover transition-all disabled:opacity-50"
                                >
                                    Salvar Nota
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                            {selectedClient.history?.map((act) => (
                                <div key={act.id} className="bg-white border border-border-color/50 p-3 rounded-xl shadow-sm">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                                            act.type === 'whatsapp_import' ? 'bg-green-100 text-green-700' : 
                                            act.type === 'task' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                            {act.type === 'whatsapp_import' ? 'WhatsApp' : act.type === 'task' ? 'Agendamento' : 'Nota'}
                                        </span>
                                        <span className="text-[9px] text-secondary-text font-bold">{new Date(act.date).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <p className="text-xs text-primary-text leading-relaxed whitespace-pre-wrap">{act.content}</p>
                                </div>
                            ))}
                            {(!selectedClient.history || selectedClient.history.length === 0) && (
                                <p className="text-center text-xs text-secondary-text py-4 italic">Nenhuma nota registrada ainda.</p>
                            )}
                        </div>
                    </div>

                    {/* Scheduling Section */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-black text-primary-text uppercase tracking-wider">Agendar Próximo Passo</h4>
                        <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100 space-y-3">
                            <div>
                                <label className="block text-[9px] font-black text-blue-700 uppercase mb-1">O que fazer?</label>
                                <input 
                                    type="text" 
                                    value={scheduleTitle}
                                    onChange={e => setScheduleTitle(e.target.value)}
                                    className="w-full px-3 py-2 text-xs border border-blue-200 rounded-xl bg-white focus:ring-2 focus:ring-apple-blue outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[9px] font-black text-blue-700 uppercase mb-1">Quando?</label>
                                <input 
                                    type="date" 
                                    value={scheduleDate}
                                    onChange={e => setScheduleDate(e.target.value)}
                                    className="w-full px-3 py-2 text-xs border border-blue-200 rounded-xl bg-white focus:ring-2 focus:ring-apple-blue outline-none"
                                />
                            </div>
                            <button 
                                onClick={handleScheduleTask}
                                disabled={!scheduleDate}
                                className="w-full py-2 bg-blue-600 text-white text-[10px] font-black uppercase rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                            >
                                <CalendarIcon className="w-3 h-3" /> Agendar Tarefa
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            <button onClick={(e) => handleWhatsAppClick(e, selectedClient.whatsapp)} className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-green-50 text-green-700 font-bold text-sm border border-green-200 hover:bg-green-100 transition-colors">
                                <WhatsAppIcon className="w-5 h-5" /> WhatsApp
                            </button>
                        </div>
                    </div>
                </div>
                
                <div className="pt-6 border-t border-border-color flex justify-between items-center">
                <button onClick={() => { if(confirm('Excluir este lead?')) setAppState(prev => ({...prev, clients: prev.clients.map(c => c.id === selectedClient.id ? {...c, leadStage: undefined} : c)})); setSelectedClient(null); }} className="p-2 text-gray-400 hover:text-apple-red hover:bg-red-50 rounded-full"><TrashIcon className="w-5 h-5" /></button>
                <div className="flex gap-3">
                    {selectedClient.status !== 'Active' && (
                         <button onClick={handleConvertToClient} className="flex items-center gap-2 rounded-full px-4 py-2 bg-white border border-green-200 text-green-700 font-black text-xs uppercase">
                            <UserPlusIcon className="w-4 h-4" /> Converter p/ Cliente
                        </button>
                    )}
                    <button onClick={() => setIsEditing(true)} className="rounded-full px-5 py-2 bg-apple-blue text-white font-black text-sm shadow-sm hover:bg-apple-blue-hover transition-colors">Editar</button>
                </div>
              </div>
            </div>
          )}

          {detailTab === 'history' && (
              <div className="space-y-4 animate-fadeIn">
                  <h4 className="text-sm font-black text-primary-text flex items-center gap-2 mb-4">
                      <RecordingsIcon className="w-4 h-4 text-apple-blue" /> Jornada do Cliente
                  </h4>
                  {clientProjects.length > 0 ? (
                      <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                          {clientProjects.map(proj => {
                              const product = products.find(p => p.id === proj.productId);
                              return (
                                  <div key={proj.id} className="bg-white border border-border-color p-4 rounded-2xl">
                                      <div className="flex justify-between items-start mb-2">
                                          <div>
                                              <p className="text-sm font-black text-primary-text">{product?.name || 'Serviço'}</p>
                                              <p className="text-[10px] text-secondary-text mt-1 uppercase font-bold">{new Date(proj.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                                          </div>
                                          <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-full ${recordingStatusColors[proj.status]}`}>{proj.status}</span>
                                      </div>
                                  </div>
                              );
                          })}
                      </div>
                  ) : (
                      <div className="text-center py-12 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                          <p className="text-sm font-medium text-secondary-text">Este lead ainda não concluiu nenhum projeto.</p>
                      </div>
                  )}
              </div>
          )}

          {detailTab === 'finance' && (
              <div className="space-y-6 animate-fadeIn">
                   <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-2xl border border-border-color/60">
                            <p className="text-[10px] font-bold text-secondary-text uppercase mb-1">Total Já Investido</p>
                            <p className="text-xl font-black text-primary-text">{formatCurrency(clientFinances.ltv)}</p>
                        </div>
                        <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                            <p className="text-[10px] font-bold text-red-700 uppercase mb-1">Saldo a Receber</p>
                            <p className="text-xl font-black text-red-800">{formatCurrency(clientFinances.pending)}</p>
                        </div>
                   </div>
              </div>
          )}

          {isEditing && (
            <form className="space-y-4 animate-fadeIn" onSubmit={(e) => {
                e.preventDefault();
                setAppState(prev => ({ ...prev, clients: prev.clients.map(c => c.id === selectedClient.id ? selectedClient : c) }));
                setIsEditing(false);
            }}>
               <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-secondary-text uppercase mb-1">Nome</label>
                    <input type="text" value={selectedClient.name} onChange={e => setSelectedClient({...selectedClient, name: e.target.value})} className="w-full px-3 py-2 border border-border-color rounded-lg focus:ring-2 focus:ring-apple-blue" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-secondary-text uppercase mb-1">Próximo Contato</label>
                    <input type="date" value={selectedClient.nextFollowUp || ''} onChange={e => setSelectedClient({...selectedClient, nextFollowUp: e.target.value})} className="w-full px-3 py-2 border border-border-color rounded-lg focus:ring-2 focus:ring-apple-blue" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-secondary-text uppercase mb-1">Status Pipeline</label>
                    <select value={selectedClient.leadStage} onChange={e => setSelectedClient({...selectedClient, leadStage: e.target.value as any})} className="w-full px-3 py-2 border border-border-color rounded-lg bg-white">
                        {Object.values(LeadStatus).map(st => <option key={st} value={st}>{st}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                      <label className="block text-xs font-bold text-secondary-text uppercase mb-1">Notas da Negociação</label>
                      <textarea value={selectedClient.notes || ''} onChange={e => setSelectedClient({...selectedClient, notes: e.target.value})} rows={4} className="w-full px-3 py-2 border border-border-color rounded-lg focus:ring-2 focus:ring-apple-blue" />
                  </div>
               </div>
              <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsEditing(false)} className="rounded-full px-6 py-2 border border-gray-200 text-gray-700 font-bold text-sm">Cancelar</button>
                  <button type="submit" className="rounded-full px-8 py-2 bg-apple-blue text-white font-black text-sm">Salvar</button>
              </div>
            </form>
          )}
        </Modal>
      )}

      {isAddModalOpen && (
        <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Nova Negociação">
            <div className="mb-6 flex bg-gray-100 p-1 rounded-xl">
                <button onClick={() => setUseExistingClient(false)} className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${!useExistingClient ? 'bg-white shadow-sm' : 'text-secondary-text'}`}>Novo Contato</button>
                <button onClick={() => setUseExistingClient(true)} className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${useExistingClient ? 'bg-white shadow-sm' : 'text-secondary-text'}`}>Cliente Existente</button>
            </div>
            <form onSubmit={handleAddNewLead} className="space-y-4">
                {!useExistingClient && (
                    <div className="bg-apple-blue/5 p-4 rounded-2xl border border-apple-blue/10 mb-4">
                        <label className="block text-[10px] font-black text-apple-blue uppercase mb-2">Colar do WhatsApp (Mágica)</label>
                        <div className="flex gap-2">
                            <textarea 
                                value={magicPasteText}
                                onChange={e => setMagicPasteText(e.target.value)}
                                placeholder="Cole aqui o texto do contato ou mensagem..."
                                className="flex-1 px-3 py-2 text-xs border border-apple-blue/20 rounded-xl bg-white focus:ring-2 focus:ring-apple-blue outline-none resize-none h-12"
                            />
                            <button 
                                type="button"
                                onClick={handleMagicPaste}
                                disabled={isParsing || !magicPasteText}
                                className="px-4 bg-apple-blue text-white rounded-xl hover:bg-apple-blue-hover transition-all disabled:opacity-50 flex items-center justify-center"
                            >
                                {isParsing ? <RefreshIcon className="w-4 h-4 animate-spin" /> : <StarIcon className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                )}

                {useExistingClient ? (
                    <div>
                        <label className="block text-sm font-medium text-secondary-text mb-1">Selecione o Cliente</label>
                        <select className="w-full px-3 py-2 border border-border-color rounded-lg bg-white" onChange={e => { const c = clients.find(cl => cl.id === e.target.value); if(c) setNewLeadForm(c); }}>
                            <option value="">Escolher...</option>
                            {clients.filter(c => c.leadStage === undefined).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                ) : (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-secondary-text mb-1">Nome Completo</label>
                            <input type="text" value={newLeadForm.name} onChange={e => setNewLeadForm({...newLeadForm, name: e.target.value})} className="w-full px-3 py-2 border border-border-color rounded-lg bg-white" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary-text mb-1">WhatsApp</label>
                            <input type="text" value={newLeadForm.whatsapp} onChange={e => setNewLeadForm({...newLeadForm, whatsapp: e.target.value})} className="w-full px-3 py-2 border border-border-color rounded-lg bg-white" required />
                        </div>
                    </>
                )}
                <div className="pt-4 flex justify-end gap-3">
                    <button type="button" onClick={() => setIsAddModalOpen(false)} className="rounded-full px-5 py-2 font-bold text-secondary-text">Cancelar</button>
                    <button type="submit" className="rounded-full px-8 py-2 bg-apple-blue text-white font-black shadow-md hover:bg-apple-blue-hover">Abrir Negócio</button>
                </div>
            </form>
        </Modal>
      )}

      <WhatsAppMenu isOpen={whatsAppMenuOpen} onClose={() => setWhatsAppMenuOpen(false)} phoneNumber={activePhone} templates={whatsAppTemplates} position={whatsAppMenuPos} sendMethod={appState.whatsappSendMethod || 'browser'} />
    </div>
  );
};
