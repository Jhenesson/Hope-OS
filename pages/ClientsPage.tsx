
import React, { useState, useMemo } from 'react';
import { Client } from '../types';
import { Modal } from '../components/Modal';
import { AbstractAvatar } from '../components/AbstractAvatar';
import { useAppContext } from '../context/AppContext';

const statusStyles: { [key: string]: string } = {
  Active: 'bg-green-100 text-green-800',
  Inactive: 'bg-gray-100 text-gray-800',
  Lead: 'bg-blue-100 text-blue-800',
};

const SearchIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);


export const ClientsPage: React.FC = () => {
  const { appState, setAppState } = useAppContext();
  const { clients } = appState;

  const setClients = (value: React.SetStateAction<Client[]>) => {
    setAppState(prev => ({
        ...prev,
        clients: typeof value === 'function' ? value(prev.clients) : value
    }));
  };
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newClient, setNewClient] = useState<Omit<Client, 'id' | 'lastProjectDate'>>({
    name: '',
    email: '',
    whatsapp: '',
    gender: 'female',
    status: 'Lead',
  });

  // States for editing
  const [isEditing, setIsEditing] = useState(false);
  const [editedClient, setEditedClient] = useState<Client | null>(null);


  const filteredClients = useMemo(() => {
    return clients
      .filter(client => {
        if (statusFilter === 'All') return true;
        return client.status === statusFilter;
      })
      .filter(client => 
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        client.whatsapp.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [clients, searchTerm, statusFilter]);

  const handleOpenModal = (client: Client) => {
    setSelectedClient(client);
    setEditedClient(client); // Pre-fill edit form state
    setIsEditing(false);      // Always start in view mode
  };

  const handleCloseModal = () => {
    setSelectedClient(null);
    setEditedClient(null);
    setIsEditing(false);
  };

  const handleAddInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewClient(prev => ({ ...prev, [name]: value as Client['status' | 'gender'] }));
  };

  const handleAddNewClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.name || !newClient.whatsapp) {
      return;
    }
    const clientToAdd: Client = {
      id: `client-${Date.now()}`,
      lastProjectDate: 'N/A',
      ...newClient,
    };
    setClients(prevClients => [clientToAdd, ...prevClients]);
    setIsAddModalOpen(false);
    setNewClient({ name: '', email: '', whatsapp: '', gender: 'female', status: 'Lead' });
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!editedClient) return;
    const { name, value } = e.target;
    setEditedClient({ ...editedClient, [name]: value as any });
  };

  const handleSaveChanges = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editedClient) return;
    setClients(clients.map(c => c.id === editedClient.id ? editedClient : c));
    setSelectedClient(editedClient); // Update the view with new data
    setIsEditing(false); // Switch back to view mode
  };


  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
        <h2 className="text-3xl font-bold text-primary-text">Clientes</h2>
        <div className="flex items-center gap-4">
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
            onClick={() => setIsAddModalOpen(true)}
            className="rounded-full px-5 py-2 bg-apple-blue text-white font-medium hover:bg-apple-blue-hover transition-colors">
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
              statusFilter === status
                ? 'bg-primary-text text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="flex-1 bg-white rounded-2xl border border-border-color shadow-sm flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead className="border-b border-border-color bg-gray-50/50 sticky top-0 z-10">
              <tr>
                <th className="p-4 font-semibold text-sm text-secondary-text">Nome</th>
                <th className="p-4 font-semibold text-sm text-secondary-text">WhatsApp</th>
                <th className="p-4 font-semibold text-sm text-secondary-text">Status</th>
                <th className="p-4 font-semibold text-sm text-secondary-text">Último Projeto</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map(client => (
                <tr 
                  key={client.id} 
                  className="border-b border-border-color last:border-b-0 hover:bg-gray-50/30 transition-colors cursor-pointer"
                  onClick={() => handleOpenModal(client)}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <AbstractAvatar name={client.name} gender={client.gender} size={40} />
                      <div>
                        <div className="font-medium text-primary-text">{client.name}</div>
                        <div className="text-sm text-secondary-text">{client.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-secondary-text">{client.whatsapp}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusStyles[client.status]}`}>
                      {client.status}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-secondary-text">{client.lastProjectDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {selectedClient && editedClient && (
        <Modal isOpen={!!selectedClient} onClose={handleCloseModal} title={isEditing ? `Editando ${selectedClient.name}` : selectedClient.name}>
          {isEditing ? (
            // --- EDIT FORM ---
            <form onSubmit={handleSaveChanges} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-secondary-text mb-1 text-left">Nome</label>
                <input type="text" name="name" id="name" value={editedClient.name} onChange={handleEditChange} className="w-full px-3 py-2 border border-border-color rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-apple-blue transition-shadow" required/>
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-secondary-text mb-1 text-left">Email (Opcional)</label>
                <input type="email" name="email" id="email" value={editedClient.email || ''} onChange={handleEditChange} className="w-full px-3 py-2 border border-border-color rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-apple-blue transition-shadow" />
              </div>
              <div>
                <label htmlFor="whatsapp" className="block text-sm font-medium text-secondary-text mb-1 text-left">WhatsApp</label>
                <input type="text" name="whatsapp" id="whatsapp" value={editedClient.whatsapp} onChange={handleEditChange} className="w-full px-3 py-2 border border-border-color rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-apple-blue transition-shadow" required/>
              </div>
              <div>
                  <label className="block text-sm font-medium text-secondary-text mb-1 text-left">Gênero</label>
                  <div className="flex gap-4">
                      <label className="flex items-center">
                          <input type="radio" name="gender" value="female" checked={editedClient.gender === 'female'} onChange={handleEditChange} className="h-4 w-4 text-apple-blue focus:ring-apple-blue border-gray-300" />
                          <span className="ml-2 text-sm text-primary-text">Feminino</span>
                      </label>
                      <label className="flex items-center">
                          <input type="radio" name="gender" value="male" checked={editedClient.gender === 'male'} onChange={handleEditChange} className="h-4 w-4 text-apple-blue focus:ring-apple-blue border-gray-300" />
                          <span className="ml-2 text-sm text-primary-text">Masculino</span>
                      </label>
                  </div>
              </div>
              <div>
                  <label htmlFor="status" className="block text-sm font-medium text-secondary-text mb-1 text-left">Status</label>
                  <select name="status" id="status" value={editedClient.status} onChange={handleEditChange} className="w-full px-3 py-2 border border-border-color rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-apple-blue transition-shadow">
                      <option value="Lead">Lead</option>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                  </select>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => { setIsEditing(false); setEditedClient(selectedClient); }} className="rounded-full px-4 py-2 bg-white border border-gray-200 text-gray-700 font-medium hover:bg-gray-100 transition-colors">Cancelar</button>
                  <button type="submit" className="rounded-full px-5 py-2 bg-apple-blue text-white font-medium hover:bg-apple-blue-hover transition-colors">Salvar Alterações</button>
              </div>
            </form>
          ) : (
            // --- DISPLAY VIEW ---
            <div className="flex flex-col">
              <div className="flex flex-col items-center text-center">
                <div className="mb-4">
                  <AbstractAvatar name={selectedClient.name} gender={selectedClient.gender} size={96} />
                </div>
                <p className="text-lg font-medium text-secondary-text">{selectedClient.email}</p>
                <p className="text-md text-secondary-text">{selectedClient.whatsapp}</p>
                <div className="mt-4">
                  <span className={`px-3 py-1 text-sm font-semibold rounded-full ${statusStyles[selectedClient.status]}`}>
                    {selectedClient.status}
                  </span>
                </div>
                <p className="mt-4 text-sm text-secondary-text">Último Projeto: {selectedClient.lastProjectDate}</p>
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
        <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Adicionar Novo Cliente">
          <form onSubmit={handleAddNewClient} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-secondary-text mb-1">Nome Completo</label>
              <input
                type="text"
                name="name"
                id="name"
                value={newClient.name}
                onChange={handleAddInputChange}
                className="w-full px-3 py-2 border border-border-color rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-apple-blue transition-shadow"
                required
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-secondary-text mb-1">E-mail (Opcional)</label>
              <input
                type="email"
                name="email"
                id="email"
                value={newClient.email || ''}
                onChange={handleAddInputChange}
                className="w-full px-3 py-2 border border-border-color rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-apple-blue transition-shadow"
              />
            </div>
            <div>
              <label htmlFor="whatsapp" className="block text-sm font-medium text-secondary-text mb-1">WhatsApp</label>
              <input
                type="text"
                name="whatsapp"
                id="whatsapp"
                value={newClient.whatsapp}
                onChange={handleAddInputChange}
                className="w-full px-3 py-2 border border-border-color rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-apple-blue transition-shadow"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-text mb-1">Gênero</label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input type="radio" name="gender" value="female" checked={newClient.gender === 'female'} onChange={handleAddInputChange} className="h-4 w-4 text-apple-blue focus:ring-apple-blue border-gray-300" />
                  <span className="ml-2 text-sm text-primary-text">Feminino</span>
                </label>
                <label className="flex items-center">
                  <input type="radio" name="gender" value="male" checked={newClient.gender === 'male'} onChange={handleAddInputChange} className="h-4 w-4 text-apple-blue focus:ring-apple-blue border-gray-300" />
                  <span className="ml-2 text-sm text-primary-text">Masculino</span>
                </label>
              </div>
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-secondary-text mb-1">Status</label>
              <select
                name="status"
                id="status"
                value={newClient.status}
                onChange={handleAddInputChange}
                className="w-full px-3 py-2 border border-border-color rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-apple-blue transition-shadow"
              >
                <option value="Lead">Lead</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div className="pt-4 flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-full px-4 py-2 bg-white border border-gray-200 text-gray-700 font-medium hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                className="rounded-full px-5 py-2 bg-apple-blue text-white font-medium hover:bg-apple-blue-hover transition-colors"
              >
                Salvar Cliente
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
