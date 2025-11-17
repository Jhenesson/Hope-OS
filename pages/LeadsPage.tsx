import React, { useState } from 'react';
import { Lead, LeadStatus } from '../types';
import { MOCK_LEADS } from '../constants';
import { Modal } from '../components/Modal';
import { AbstractAvatar } from '../components/AbstractAvatar';

const statusColors: { [key in LeadStatus]: string } = {
  [LeadStatus.Novo]: 'bg-blue-100 text-blue-800',
  [LeadStatus.EmConversa]: 'bg-yellow-100 text-yellow-800',
  [LeadStatus.Fechamento]: 'bg-purple-100 text-purple-800',
  [LeadStatus.Convertido]: 'bg-green-100 text-green-800',
  [LeadStatus.Perdido]: 'bg-red-100 text-red-800',
};

// --- KanbanCard Component ---
interface KanbanCardProps {
  lead: Lead;
  onClick: () => void;
}
const KanbanCard: React.FC<KanbanCardProps> = ({ lead, onClick }) => {
  const onDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    e.dataTransfer.setData('leadId', id);
  };

  return (
    <div
      draggable
      onClick={onClick}
      onDragStart={(e) => onDragStart(e, lead.id)}
      className="bg-white rounded-lg border border-border-color p-4 mb-4 cursor-grab active:cursor-grabbing shadow-sm hover:border-apple-blue transition-colors"
    >
      <div className="flex items-center gap-3">
        <AbstractAvatar name={lead.name} gender={lead.gender} size={40} />
        <div>
          <h4 className="font-semibold text-primary-text">{lead.name}</h4>
          <p className="text-sm text-secondary-text">{lead.company}</p>
        </div>
      </div>
      <div className="mt-4 text-xs text-secondary-text">
        Último contato: {lead.lastContact}
      </div>
    </div>
  );
};


// --- KanbanColumn Component ---
interface KanbanColumnProps {
  status: LeadStatus;
  leads: Lead[];
  onDrop: (status: LeadStatus, e: React.DragEvent<HTMLDivElement>) => void;
  onCardClick: (lead: Lead) => void;
}
const KanbanColumn: React.FC<KanbanColumnProps> = ({ status, leads, onDrop, onCardClick }) => {
  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    onDrop(status, e);
  };
  
  return (
    <div
      onDragOver={onDragOver}
      onDrop={handleDrop}
      className="flex-1 min-w-[280px] bg-gray-50/50 rounded-2xl p-4"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[status]}`}>
            {status}
            </span>
        </div>
        <span className="text-sm font-semibold text-secondary-text">{leads.length}</span>
      </div>
      <div>
        {leads.map(lead => <KanbanCard key={lead.id} lead={lead} onClick={() => onCardClick(lead)} />)}
      </div>
    </div>
  );
};


// --- LeadsPage Component ---
export const LeadsPage: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>(MOCK_LEADS);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newLead, setNewLead] = useState<Omit<Lead, 'id' | 'lastContact'>>({
      name: '',
      company: '',
      gender: 'female',
      status: LeadStatus.Novo,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editedLead, setEditedLead] = useState<Lead | null>(null);

  const handleDrop = (newStatus: LeadStatus, e: React.DragEvent<HTMLDivElement>) => {
    const leadId = e.dataTransfer.getData('leadId');
    if (leadId) {
        setLeads(prevLeads => prevLeads.map(l => l.id === leadId ? {...l, status: newStatus} : l))
    }
  };

  const statuses = Object.values(LeadStatus);

  const handleOpenModal = (lead: Lead) => {
    setSelectedLead(lead);
    setEditedLead(lead);
    setIsEditing(false);
  };

  const handleCloseModal = () => {
    setSelectedLead(null);
    setEditedLead(null);
    setIsEditing(false);
  };
  
  const handleAddInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setNewLead(prev => ({...prev, [name]: value as any }));
  };

  const handleAddNewLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLead.name || !newLead.company) return;

    const leadToAdd: Lead = {
        id: `lead-${Date.now()}`,
        lastContact: 'Agora',
        ...newLead,
    };
    setLeads(prevLeads => [leadToAdd, ...prevLeads]);
    setIsAddModalOpen(false);
    setNewLead({ name: '', company: '', gender: 'female', status: LeadStatus.Novo });
  };
  
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!editedLead) return;
    const { name, value } = e.target;
    setEditedLead({ ...editedLead, [name]: value as any });
  };

  const handleSaveChanges = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editedLead) return;
    setLeads(leads.map(l => l.id === editedLead.id ? editedLead : l));
    setSelectedLead(editedLead);
    setIsEditing(false);
  };


  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-primary-text">Leads</h2>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="rounded-full px-5 py-2 bg-apple-blue text-white font-medium hover:bg-apple-blue-hover transition-colors">
          Adicionar Lead
        </button>
      </div>
      <div className="flex-1 flex gap-6 overflow-x-auto pb-4">
        {statuses.map(status => (
          <KanbanColumn
            key={status}
            status={status}
            leads={leads.filter(lead => lead.status === status)}
            onCardClick={handleOpenModal}
            onDrop={handleDrop}
          />
        ))}
      </div>

       {selectedLead && editedLead && (
        <Modal isOpen={!!selectedLead} onClose={handleCloseModal} title={isEditing ? `Editando ${selectedLead.name}` : selectedLead.name}>
          {isEditing ? (
            <form onSubmit={handleSaveChanges} className="space-y-4">
               <div>
                <label htmlFor="name" className="block text-sm font-medium text-secondary-text mb-1 text-left">Nome</label>
                <input type="text" name="name" id="name" value={editedLead.name} onChange={handleEditChange} className="w-full px-3 py-2 border border-border-color rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-apple-blue transition-shadow" />
              </div>
              <div>
                <label htmlFor="company" className="block text-sm font-medium text-secondary-text mb-1 text-left">Empresa</label>
                <input type="text" name="company" id="company" value={editedLead.company} onChange={handleEditChange} className="w-full px-3 py-2 border border-border-color rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-apple-blue transition-shadow" />
              </div>
              <div>
                  <label className="block text-sm font-medium text-secondary-text mb-1 text-left">Gênero</label>
                  <div className="flex gap-4">
                      <label className="flex items-center">
                          <input type="radio" name="gender" value="female" checked={editedLead.gender === 'female'} onChange={handleEditChange} className="h-4 w-4 text-apple-blue focus:ring-apple-blue border-gray-300" />
                          <span className="ml-2 text-sm text-primary-text">Feminino</span>
                      </label>
                      <label className="flex items-center">
                          <input type="radio" name="gender" value="male" checked={editedLead.gender === 'male'} onChange={handleEditChange} className="h-4 w-4 text-apple-blue focus:ring-apple-blue border-gray-300" />
                          <span className="ml-2 text-sm text-primary-text">Masculino</span>
                      </label>
                  </div>
              </div>
               <div>
                  <label htmlFor="status" className="block text-sm font-medium text-secondary-text mb-1 text-left">Status</label>
                  <select name="status" id="status" value={editedLead.status} onChange={handleEditChange} className="w-full px-3 py-2 border border-border-color rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-apple-blue transition-shadow">
                      {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => { setIsEditing(false); setEditedLead(selectedLead); }} className="rounded-full px-4 py-2 bg-white border border-gray-200 text-gray-700 font-medium hover:bg-gray-100 transition-colors">Cancelar</button>
                  <button type="submit" className="rounded-full px-5 py-2 bg-apple-blue text-white font-medium hover:bg-apple-blue-hover transition-colors">Salvar Alterações</button>
              </div>
            </form>
          ) : (
             <div className="flex flex-col">
              <div className="flex flex-col items-center text-center">
                <div className="mb-4">
                  <AbstractAvatar name={selectedLead.name} gender={selectedLead.gender} size={96} />
                </div>
                <p className="text-md text-secondary-text">{selectedLead.company}</p>
                <div className="mt-4">
                  <span className={`px-3 py-1 text-sm font-semibold rounded-full ${statusColors[selectedLead.status]}`}>
                    {selectedLead.status}
                  </span>
                </div>
                <p className="mt-4 text-sm text-secondary-text">Último contato: {selectedLead.lastContact}</p>
              </div>
               <div className="pt-6 mt-4 border-t border-border-color flex justify-end">
                <button onClick={() => setIsEditing(true)} className="rounded-full px-5 py-2 bg-apple-blue text-white font-medium hover:bg-apple-blue-hover transition-colors">
                  Editar
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {isAddModalOpen && (
        <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Adicionar Novo Lead">
            <form onSubmit={handleAddNewLead} className="space-y-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-secondary-text mb-1">Nome Completo</label>
                    <input type="text" name="name" value={newLead.name} onChange={handleAddInputChange} className="w-full px-3 py-2 border border-border-color rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-apple-blue transition-shadow" required />
                </div>
                <div>
                    <label htmlFor="company" className="block text-sm font-medium text-secondary-text mb-1">Empresa</label>
                    <input type="text" name="company" value={newLead.company} onChange={handleAddInputChange} className="w-full px-3 py-2 border border-border-color rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-apple-blue transition-shadow" required />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-secondary-text mb-1">Gênero</label>
                    <div className="flex gap-4">
                        <label className="flex items-center">
                            <input type="radio" name="gender" value="female" checked={newLead.gender === 'female'} onChange={handleAddInputChange} className="h-4 w-4 text-apple-blue focus:ring-apple-blue border-gray-300" />
                            <span className="ml-2 text-sm text-primary-text">Feminino</span>
                        </label>
                        <label className="flex items-center">
                            <input type="radio" name="gender" value="male" checked={newLead.gender === 'male'} onChange={handleAddInputChange} className="h-4 w-4 text-apple-blue focus:ring-apple-blue border-gray-300" />
                            <span className="ml-2 text-sm text-primary-text">Masculino</span>
                        </label>
                    </div>
                </div>
                <div className="pt-4 flex justify-end gap-3">
                    <button type="button" onClick={() => setIsAddModalOpen(false)} className="rounded-full px-4 py-2 bg-white border border-gray-200 text-gray-700 font-medium hover:bg-gray-100 transition-colors">Cancelar</button>
                    <button type="submit" className="rounded-full px-5 py-2 bg-apple-blue text-white font-medium hover:bg-apple-blue-hover transition-colors">Salvar Lead</button>
                </div>
            </form>
        </Modal>
      )}
    </div>
  );
};
