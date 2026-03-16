
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Client, CopyCategory, Recording, LancamentoFinanceiro, StatusPagamento, RecordingStatus, LeadStatus } from '../types';
import { Modal } from '../components/Modal';
import { AbstractAvatar } from '../components/AbstractAvatar';
import { useAppContext } from '../context/AppContext';
import { TrashIcon, PhoneIcon, RecordingsIcon, DollarSignIcon, CalendarIcon, ClockIcon, WhatsAppIcon } from '../components/icons/Icons';
import { getSupabaseClient } from '../lib/supabaseClient';
import { sendWhatsAppMessage } from '../utils/whatsapp';

const statusStyles: { [key: string]: string } = {
  Active: 'bg-green-100 text-green-800',
  Inactive: 'bg-gray-100 text-gray-800',
  Lead: 'bg-blue-100 text-blue-800',
};

const recordingStatusColors: { [key in RecordingStatus]: string } = {
  [RecordingStatus.Agendada]: 'bg-blue-100 text-blue-800',
  [RecordingStatus.Concluída]: 'bg-green-100 text-green-800',
  [RecordingStatus.Cancelada]: 'bg-red-100 text-red-800',
};

const SearchIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const CloudDownloadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 17v-6"></path>
    <path d="M9 14l3 3 3-3"></path>
    <path d="M20 16.2A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"></path>
  </svg>
);

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

export const ClientsPage: React.FC = () => {
  const { appState, setAppState } = useAppContext();
  const { clients, copywriting, recordings, lancamentos, products } = appState;

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [detailTab, setDetailTab] = useState<'info' | 'history' | 'finance' | 'notes'>('info');
  const [isSyncingLeads, setIsSyncingLeads] = useState(false);

  const [newClient, setNewClient] = useState<Omit<Client, 'id' | 'lastProjectDate'>>({
    name: '',
    email: '',
    whatsapp: '',
    gender: 'female',
    status: 'Lead',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editedClient, setEditedClient] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  const [whatsAppMenuOpen, setWhatsAppMenuOpen] = useState(false);
  const [whatsAppMenuPos, setWhatsAppMenuPos] = useState({ x: 0, y: 0 });
  const [activePhone, setActivePhone] = useState('');

  const whatsAppTemplates = copywriting.filter(c => c.category === CopyCategory.WhatsApp);
  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const filteredClients = useMemo(() => {
    return clients
      .filter(client => statusFilter === 'All' ? true : client.status === statusFilter)
      .filter(client => 
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        client.whatsapp.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [clients, searchTerm, statusFilter]);

  // Derived data for the selected client
  const clientProjects = useMemo(() => {
    if (!selectedClient) return [];
    return recordings
      .filter(r => r.clientId === selectedClient.id)
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [selectedClient, recordings]);

  const clientFinances = useMemo(() => {
    if (!selectedClient) return { ltv: 0, pending: 0, list: [] };
    const list = lancamentos.filter(l => l.clienteId === selectedClient.id);
    const ltv = list.reduce((sum, l) => sum + l.valorRecebido, 0);
    const pending = list.reduce((sum, l) => sum + (l.valorPrevisto - l.valorRecebido), 0);
    return { ltv, pending, list };
  }, [selectedClient, lancamentos]);

  const handleOpenModal = (client: Client) => {
    setSelectedClient(client);
    setEditedClient(client);
    setDetailTab('info');
    setIsEditing(false);
  };

  const handleCloseModal = () => {
    setSelectedClient(null);
    setEditedClient(null);
    setIsEditing(false);
    setClientToDelete(null);
  };

  const handleSaveChanges = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editedClient) return;
    setAppState(prev => ({
        ...prev,
        clients: prev.clients.map(c => c.id === editedClient.id ? editedClient : c)
    }));
    setSelectedClient(editedClient);
    setIsEditing(false);
  };

  const handleDeleteClient = () => {
      if (clientToDelete) {
          setAppState(prev => ({ ...prev, clients: prev.clients.filter(c => c.id !== clientToDelete.id) }));
          handleCloseModal();
      }
  }

  const handleWhatsAppClick = (e: React.MouseEvent, phone: string) => {
      e.stopPropagation();
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      setWhatsAppMenuPos({ x: Math.min(rect.left, window.innerWidth - 270), y: Math.min(rect.bottom + 5, window.innerHeight - 300) });
      setActivePhone(phone);
      setWhatsAppMenuOpen(true);
  };

  const handleSyncWhatsAppLeads = async () => {
      const supabase = getSupabaseClient();
      if (!supabase) {
          alert('Configure o banco de dados Supabase nas Configurações primeiro.');
          return;
      }

      setIsSyncingLeads(true);
      try {
          const { data: leads, error } = await supabase
              .from('whatsapp_leads')
              .select('*')
              .eq('imported', false);

          if (error) throw error;

          if (!leads || leads.length === 0) {
              alert('Nenhum lead novo encontrado no WhatsApp.');
              setIsSyncingLeads(false);
              return;
          }

          const newClients: Client[] = leads.map((lead: any, index: number) => ({
              id: `lead-${Date.now()}-${index}`,
              name: lead.name,
              whatsapp: lead.whatsapp,
              gender: 'male', // Default, can be edited later
              status: 'Lead',
              leadStage: LeadStatus.Novo,
              lastProjectDate: '',
              notes: lead.notes,
              history: [{
                  id: `hist-${Date.now()}-${index}`,
                  type: 'whatsapp_import',
                  content: 'Importado via Hope Lead System (Extensão Chrome)',
                  date: new Date().toISOString()
              }]
          }));

          // Mark as imported in Supabase
          const idsToUpdate = leads.map((l: any) => l.id);
          const { error: updateError } = await supabase
              .from('whatsapp_leads')
              .update({ imported: true })
              .in('id', idsToUpdate);

          if (updateError) throw updateError;

          // Update local state
          setAppState(prev => ({
              ...prev,
              clients: [...newClients, ...prev.clients]
          }));

          alert(`${leads.length} lead(s) importado(s) com sucesso!`);
      } catch (err: any) {
          console.error('Error syncing leads:', err);
          alert(`Erro ao sincronizar leads: ${err.message}`);
      } finally {
          setIsSyncingLeads(false);
      }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
        <h2 className="text-3xl font-bold text-primary-text tracking-tight">Clientes</h2>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-64 border border-border-color rounded-full bg-white focus:outline-none focus:ring-2 focus:ring-apple-blue transition-shadow"
            />
          </div>
          <button 
            onClick={handleSyncWhatsAppLeads} 
            disabled={isSyncingLeads}
            className={`rounded-full px-4 py-2 border font-medium flex items-center gap-2 transition-colors ${isSyncingLeads ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white text-green-600 border-green-200 hover:bg-green-50'}`}
          >
            {isSyncingLeads ? (
                <div className="w-4 h-4 border-2 border-green-600/30 border-t-green-600 rounded-full animate-spin"></div>
            ) : (
                <CloudDownloadIcon className="w-4 h-4" />
            )}
            Puxar Leads do WhatsApp
          </button>
          <button onClick={() => setIsAddModalOpen(true)} className="rounded-full px-5 py-2 bg-apple-blue text-white font-medium hover:bg-apple-blue-hover transition-colors">
            Adicionar Cliente
          </button>
        </div>
      </div>

      <div className="mb-4">
        {['All', 'Active', 'Inactive', 'Lead'].map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`rounded-full px-4 py-2 mr-2 text-sm font-medium transition-colors ${
              statusFilter === status ? 'bg-primary-text text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="flex-1 bg-white rounded-2xl border border-border-color shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="border-b border-border-color bg-gray-50/50">
            <tr>
              <th className="p-4 font-semibold text-xs text-secondary-text uppercase">Nome</th>
              <th className="p-4 font-semibold text-xs text-secondary-text uppercase">WhatsApp</th>
              <th className="p-4 font-semibold text-xs text-secondary-text uppercase">Status</th>
              <th className="p-4 font-semibold text-xs text-secondary-text uppercase text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredClients.map(client => (
              <tr key={client.id} className="hover:bg-gray-50/30 transition-colors cursor-pointer group" onClick={() => handleOpenModal(client)}>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <AbstractAvatar name={client.name} gender={client.gender} size={36} />
                    <div>
                      <div className="font-bold text-primary-text text-sm">{client.name}</div>
                      <div className="text-xs text-secondary-text">{client.email}</div>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-sm text-secondary-text">{client.whatsapp}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-full ${statusStyles[client.status]}`}>{client.status}</span>
                </td>
                <td className="p-4 text-right">
                    <button onClick={(e) => handleWhatsAppClick(e, client.whatsapp)} className="p-2 rounded-full text-green-600 hover:bg-green-50 transition-colors" title="WhatsApp">
                        <WhatsAppIcon className="w-5 h-5" />
                    </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedClient && (
        <Modal isOpen={!!selectedClient} onClose={handleCloseModal} title={isEditing ? `Editando Perfil` : 'Perfil do Cliente'} className="max-w-2xl">
          {!isEditing && (
            <div className="flex border-b border-border-color mb-6 overflow-x-auto custom-scrollbar">
                <button onClick={() => setDetailTab('info')} className={`px-4 py-2 text-sm font-medium transition-colors relative whitespace-nowrap ${detailTab === 'info' ? 'text-apple-blue' : 'text-secondary-text hover:text-primary-text'}`}>
                    Dados
                    {detailTab === 'info' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-apple-blue rounded-full"></span>}
                </button>
                <button onClick={() => setDetailTab('history')} className={`px-4 py-2 text-sm font-medium transition-colors relative whitespace-nowrap ${detailTab === 'history' ? 'text-apple-blue' : 'text-secondary-text hover:text-primary-text'}`}>
                    Histórico {clientProjects.length > 0 && <span className="ml-1 bg-gray-100 px-1.5 py-0.5 rounded-full text-[10px]">{clientProjects.length}</span>}
                    {detailTab === 'history' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-apple-blue rounded-full"></span>}
                </button>
                <button onClick={() => setDetailTab('finance')} className={`px-4 py-2 text-sm font-medium transition-colors relative whitespace-nowrap ${detailTab === 'finance' ? 'text-apple-blue' : 'text-secondary-text hover:text-primary-text'}`}>
                    Financeiro
                    {detailTab === 'finance' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-apple-blue rounded-full"></span>}
                </button>
                <button onClick={() => setDetailTab('notes')} className={`px-4 py-2 text-sm font-medium transition-colors relative whitespace-nowrap ${detailTab === 'notes' ? 'text-apple-blue' : 'text-secondary-text hover:text-primary-text'}`}>
                    Notas
                    {detailTab === 'notes' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-apple-blue rounded-full"></span>}
                </button>
            </div>
          )}

          {detailTab === 'info' && !isEditing && (
            <div className="flex flex-col">
              <div className="flex items-center gap-6 mb-8">
                <AbstractAvatar name={selectedClient.name} gender={selectedClient.gender} size={80} />
                <div className="flex-1">
                    <h3 className="text-2xl font-black text-primary-text leading-tight">{selectedClient.name}</h3>
                    <p className="text-secondary-text font-medium">{selectedClient.company || 'Pessoa Física'}</p>
                    <div className="mt-2 flex gap-2">
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${statusStyles[selectedClient.status]}`}>{selectedClient.status}</span>
                        {selectedClient.leadStage && <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">{selectedClient.leadStage}</span>}
                    </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-2xl border border-border-color/50">
                      <p className="text-[10px] font-bold text-secondary-text uppercase mb-1">Contato</p>
                      <p className="text-sm font-semibold text-primary-text">{selectedClient.whatsapp}</p>
                      <p className="text-xs text-secondary-text truncate">{selectedClient.email || 'Sem e-mail'}</p>
                  </div>
                   <div className="bg-gray-50 p-4 rounded-2xl border border-border-color/50">
                      <p className="text-[10px] font-bold text-secondary-text uppercase mb-1">Fidelidade (LTV)</p>
                      <p className="text-sm font-black text-apple-green">{formatCurrency(clientFinances.ltv)}</p>
                      <p className="text-[10px] text-secondary-text">Investimento total no estúdio</p>
                  </div>
              </div>

              <div className="mt-6 flex justify-between pt-6 border-t border-border-color">
                <button onClick={() => setClientToDelete(selectedClient)} className="p-2 text-gray-400 hover:text-apple-red hover:bg-red-50 rounded-full transition-colors"><TrashIcon className="w-5 h-5" /></button>
                <div className="flex gap-3">
                    <button onClick={(e) => handleWhatsAppClick(e, selectedClient.whatsapp)} className="flex items-center gap-2 px-5 py-2 rounded-full bg-green-50 text-green-700 font-bold text-sm hover:bg-green-100 transition-colors border border-green-200">
                        <WhatsAppIcon className="w-4 h-4" /> WhatsApp
                    </button>
                    <button onClick={() => setIsEditing(true)} className="rounded-full px-6 py-2 bg-apple-blue text-white font-bold text-sm hover:bg-apple-blue-hover shadow-sm">Editar Perfil</button>
                </div>
              </div>
            </div>
          )}

          {detailTab === 'history' && (
              <div className="space-y-4 animate-fadeIn">
                  <h4 className="text-sm font-bold text-primary-text flex items-center gap-2 mb-4">
                      <RecordingsIcon className="w-4 h-4 text-apple-blue" /> Trabalhos Realizados
                  </h4>
                  {clientProjects.length > 0 ? (
                      <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                          {clientProjects.map(proj => {
                              const product = products.find(p => p.id === proj.productId);
                              return (
                                  <div key={proj.id} className="bg-white border border-border-color p-4 rounded-2xl shadow-sm hover:border-apple-blue transition-colors">
                                      <div className="flex justify-between items-start mb-2">
                                          <div>
                                              <p className="text-sm font-black text-primary-text">{product?.name || 'Serviço'}</p>
                                              <div className="flex items-center gap-2 text-xs text-secondary-text mt-1">
                                                  <CalendarIcon className="w-3 h-3" />
                                                  {new Date(proj.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                              </div>
                                          </div>
                                          <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-full ${recordingStatusColors[proj.status]}`}>{proj.status}</span>
                                      </div>
                                      <div className="mt-3 flex items-center justify-between pt-3 border-t border-gray-50">
                                          <div className="flex items-center gap-2 text-[10px] text-secondary-text font-bold">
                                              <ClockIcon className="w-3 h-3" />
                                              {proj.horaInicio} — {proj.horaFim}
                                          </div>
                                          <p className="text-xs font-black text-primary-text">{formatCurrency(proj.valorTotal)}</p>
                                      </div>
                                  </div>
                              );
                          })}
                      </div>
                  ) : (
                      <div className="text-center py-12 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                          <RecordingsIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-sm font-medium text-secondary-text">Nenhum projeto registrado para este cliente.</p>
                      </div>
                  )}
              </div>
          )}

          {detailTab === 'finance' && (
              <div className="space-y-6 animate-fadeIn">
                   <div className="grid grid-cols-2 gap-4">
                        <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
                            <p className="text-[10px] font-bold text-green-700 uppercase mb-1">Total Liquidado</p>
                            <p className="text-xl font-black text-green-800">{formatCurrency(clientFinances.ltv)}</p>
                        </div>
                        <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                            <p className="text-[10px] font-bold text-red-700 uppercase mb-1">A Receber / Saldo</p>
                            <p className="text-xl font-black text-red-800">{formatCurrency(clientFinances.pending)}</p>
                        </div>
                   </div>

                   <div>
                       <h4 className="text-sm font-bold text-primary-text flex items-center gap-2 mb-4">
                           <DollarSignIcon className="w-4 h-4 text-apple-green" /> Fluxo de Pagamentos
                       </h4>
                       <div className="bg-gray-50 border border-border-color rounded-2xl overflow-hidden">
                           <table className="w-full text-left text-sm">
                               <thead className="bg-gray-100 border-b border-border-color">
                                   <tr>
                                       <th className="p-3 font-semibold text-[10px] uppercase text-secondary-text">Data Prev.</th>
                                       <th className="p-3 font-semibold text-[10px] uppercase text-secondary-text">Status</th>
                                       <th className="p-3 font-semibold text-[10px] uppercase text-secondary-text text-right">Valor</th>
                                   </tr>
                               </thead>
                               <tbody className="divide-y divide-gray-100">
                                   {clientFinances.list.map(lanc => (
                                       <tr key={lanc.id} className="hover:bg-white transition-colors">
                                           <td className="p-3 font-medium text-xs">{new Date(lanc.dataPrevista + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                                           <td className="p-3">
                                               <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-full ${
                                                   lanc.statusPagamento === StatusPagamento.Pago ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                               }`}>{lanc.statusPagamento}</span>
                                           </td>
                                           <td className="p-3 text-right font-black text-primary-text text-xs">
                                               {formatCurrency(lanc.valorPrevisto)}
                                           </td>
                                       </tr>
                                   ))}
                                   {clientFinances.list.length === 0 && (
                                       <tr><td colSpan={3} className="p-8 text-center text-xs text-secondary-text italic">Sem registros financeiros.</td></tr>
                                   )}
                               </tbody>
                           </table>
                       </div>
                   </div>
              </div>
          )}

          {detailTab === 'notes' && !isEditing && (
              <div className="animate-fadeIn">
                  <div className="bg-yellow-50/50 p-5 rounded-2xl border border-yellow-100/50 min-h-[150px]">
                      {selectedClient.notes ? (
                          <p className="text-sm text-yellow-900 whitespace-pre-wrap leading-relaxed">
                              {selectedClient.notes}
                          </p>
                      ) : (
                          <div className="flex flex-col items-center justify-center h-full text-center py-8">
                              <p className="text-sm font-medium text-yellow-700/50 italic">Nenhuma nota registrada para este cliente.</p>
                          </div>
                      )}
                  </div>
                  <div className="mt-6 flex justify-end pt-6 border-t border-border-color">
                      <button onClick={() => setIsEditing(true)} className="rounded-full px-6 py-2 bg-apple-blue text-white font-bold text-sm hover:bg-apple-blue-hover shadow-sm">Editar Notas</button>
                  </div>
              </div>
          )}

          {isEditing && editedClient && (
            <form onSubmit={handleSaveChanges} className="space-y-4 animate-fadeIn">
              <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-secondary-text mb-1">Nome Completo</label>
                    <input type="text" name="name" value={editedClient.name} onChange={(e) => setEditedClient({...editedClient, name: e.target.value})} className="w-full px-3 py-2 border border-border-color rounded-lg focus:ring-2 focus:ring-apple-blue" required/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-text mb-1">E-mail</label>
                    <input type="email" name="email" value={editedClient.email || ''} onChange={(e) => setEditedClient({...editedClient, email: e.target.value})} className="w-full px-3 py-2 border border-border-color rounded-lg focus:ring-2 focus:ring-apple-blue" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-text mb-1">WhatsApp</label>
                    <input type="text" name="whatsapp" value={editedClient.whatsapp} onChange={(e) => setEditedClient({...editedClient, whatsapp: e.target.value})} className="w-full px-3 py-2 border border-border-color rounded-lg focus:ring-2 focus:ring-apple-blue" required/>
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-secondary-text mb-1">Gênero</label>
                      <select name="gender" value={editedClient.gender} onChange={(e) => setEditedClient({...editedClient, gender: e.target.value as any})} className="w-full px-3 py-2 border border-border-color rounded-lg bg-white">
                          <option value="female">Feminino</option>
                          <option value="male">Masculino</option>
                      </select>
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-secondary-text mb-1">Status</label>
                      <select name="status" value={editedClient.status} onChange={(e) => setEditedClient({...editedClient, status: e.target.value as any})} className="w-full px-3 py-2 border border-border-color rounded-lg bg-white">
                          <option value="Lead">Lead</option>
                          <option value="Active">Ativo</option>
                          <option value="Inactive">Inativo</option>
                      </select>
                  </div>
                  <div className="col-span-2">
                      <label className="block text-sm font-medium text-secondary-text mb-1">Notas / Observações</label>
                      <textarea 
                          name="notes" 
                          value={editedClient.notes || ''} 
                          onChange={(e) => setEditedClient({...editedClient, notes: e.target.value})} 
                          className="w-full px-3 py-2 border border-border-color rounded-lg focus:ring-2 focus:ring-apple-blue min-h-[100px] resize-y"
                          placeholder="Adicione informações importantes sobre o cliente ou lead..."
                      ></textarea>
                  </div>
              </div>
              <div className="pt-6 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsEditing(false)} className="rounded-full px-6 py-2 bg-white border border-gray-200 text-gray-700 font-bold text-sm">Cancelar</button>
                  <button type="submit" className="rounded-full px-8 py-2 bg-apple-blue text-white font-black text-sm shadow-md hover:bg-apple-blue-hover">Salvar Alterações</button>
              </div>
            </form>
          )}
        </Modal>
      )}

      {/* Simplified Add Client Modal */}
      {isAddModalOpen && (
        <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Novo Cliente">
          <form onSubmit={(e) => {
              e.preventDefault();
              const clientToAdd: Client = { id: `client-${Date.now()}`, lastProjectDate: 'N/A', createdAt: new Date().toISOString(), ...newClient };
              setAppState(prev => ({ ...prev, clients: [clientToAdd, ...prev.clients] }));
              setIsAddModalOpen(false);
          }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary-text mb-1">Nome Completo</label>
              <input type="text" onChange={e => setNewClient({...newClient, name: e.target.value})} className="w-full px-3 py-2 border border-border-color rounded-lg focus:ring-2 focus:ring-apple-blue" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-text mb-1">WhatsApp</label>
                  <input type="text" onChange={e => setNewClient({...newClient, whatsapp: e.target.value})} className="w-full px-3 py-2 border border-border-color rounded-lg focus:ring-2 focus:ring-apple-blue" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-text mb-1">Status Inicial</label>
                  <select onChange={e => setNewClient({...newClient, status: e.target.value as any})} className="w-full px-3 py-2 border border-border-color rounded-lg bg-white">
                    <option value="Lead">Lead</option>
                    <option value="Active">Ativo</option>
                  </select>
                </div>
            </div>
            <div className="pt-4 flex justify-end gap-3">
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="rounded-full px-5 py-2 text-secondary-text font-bold">Cancelar</button>
              <button type="submit" className="rounded-full px-6 py-2 bg-apple-blue text-white font-black shadow-md">Cadastrar</button>
            </div>
          </form>
        </Modal>
      )}

      {clientToDelete && (
          <Modal isOpen={!!clientToDelete} onClose={() => setClientToDelete(null)} title="Excluir Contato">
              <div className="text-center p-4">
                  <p className="text-secondary-text mb-6">Deseja realmente apagar <strong className="text-primary-text">{clientToDelete.name}</strong>? Todo o histórico de projetos continuará vinculado ao ID, mas o contato sumirá das listagens.</p>
                  <div className="flex justify-center gap-4">
                      <button onClick={() => setClientToDelete(null)} className="rounded-full px-6 py-2 border border-gray-200 font-bold">Manter</button>
                      <button onClick={handleDeleteClient} className="rounded-full px-6 py-2 bg-apple-red text-white font-bold shadow-md">Sim, excluir</button>
                  </div>
              </div>
          </Modal>
      )}

      <WhatsAppMenu isOpen={whatsAppMenuOpen} onClose={() => setWhatsAppMenuOpen(false)} phoneNumber={activePhone} templates={whatsAppTemplates} position={whatsAppMenuPos} sendMethod={appState.whatsappSendMethod || 'browser'} />
    </div>
  );
};
