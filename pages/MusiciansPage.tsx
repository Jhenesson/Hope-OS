
import React, { useState, useMemo, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { sendWhatsAppMessage } from '../utils/whatsapp';
import { Musician, SaidaFinanceira } from '../types';
import { Modal } from '../components/Modal';
import { AbstractAvatar } from '../components/AbstractAvatar';
import { StarIcon, PhoneIcon, ClipboardCopyIcon, PlusIcon, DollarSignIcon, TrashIcon, CheckIcon, ImageIcon, CopyIcon } from '../components/icons/Icons';

export const MusiciansPage: React.FC = () => {
    const { appState, setAppState } = useAppContext();
    const musicians = appState.musicians || [];

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [currentMusician, setCurrentMusician] = useState<Partial<Musician>>({});
    const [searchTerm, setSearchTerm] = useState('');
    const [copiedPixId, setCopiedPixId] = useState<string | null>(null);
    const [copiedAllId, setCopiedAllId] = useState<string | null>(null);
    
    // Payment Modal State
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentData, setPaymentData] = useState({ musicianId: '', amount: 0, date: '', description: '' });

    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- Actions ---

    const handleSaveMusician = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentMusician.name) return;

        const instrumentsArray = typeof currentMusician.instruments === 'string' 
            ? (currentMusician.instruments as string).split(',').map((s: string) => s.trim())
            : currentMusician.instruments || [];

        if (currentMusician.id) {
            setAppState(prev => ({
                ...prev,
                musicians: (prev.musicians || []).map(m => m.id === currentMusician.id ? { ...currentMusician, instruments: instrumentsArray } as Musician : m)
            }));
        } else {
            const newMusician: Musician = {
                id: `mus-${Date.now()}`,
                name: currentMusician.name || '',
                instruments: instrumentsArray,
                cacheValue: Number(currentMusician.cacheValue) || 0,
                pixKey: currentMusician.pixKey || '',
                whatsapp: currentMusician.whatsapp || '',
                gender: currentMusician.gender || 'male',
                rating: Number(currentMusician.rating) || 5,
                notes: currentMusician.notes || '',
                avatarUrl: currentMusician.avatarUrl,
                cpf: currentMusician.cpf || '',
                ecad: currentMusician.ecad || ''
            };
            setAppState(prev => ({
                ...prev,
                musicians: [...(prev.musicians || []), newMusician]
            }));
        }
        setIsAddModalOpen(false);
        setCurrentMusician({});
    };

    const handleDeleteMusician = (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir este músico?')) {
            setAppState(prev => ({
                ...prev,
                musicians: (prev.musicians || []).filter(m => m.id !== id)
            }));
        }
    };

    const handleOpenPayment = (musician: Musician) => {
        setPaymentData({
            musicianId: musician.id,
            amount: musician.cacheValue,
            date: new Date().toISOString().split('T')[0],
            description: `Cachê ${musician.name}`
        });
        setIsPaymentModalOpen(true);
    };

    const confirmPayment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!paymentData.amount || !paymentData.description) return;

        const newExpense: SaidaFinanceira = {
            id: `saida-mus-${Date.now()}`,
            descricao: paymentData.description,
            valor: Number(paymentData.amount),
            data: paymentData.date,
            categoria: 'Cachê Músicos',
            observacoes: 'Gerado via módulo Músicos',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        setAppState(prev => ({
            ...prev,
            saidas: [...prev.saidas, newExpense]
        }));

        setIsPaymentModalOpen(false);
        alert('Pagamento lançado no financeiro com sucesso!');
    };

    const handleCopyPix = (key: string, id: string) => {
        navigator.clipboard.writeText(key);
        setCopiedPixId(id);
        setTimeout(() => setCopiedPixId(null), 2000);
    };

    const handleCopyAllData = (musician: Musician) => {
        const text = `*Dados do Músico*
Nome: ${musician.name}
Instrumentos: ${musician.instruments.join(', ')}
Cachê: ${formatCurrency(musician.cacheValue)}
WhatsApp: ${musician.whatsapp}
PIX: ${musician.pixKey}
${musician.cpf ? `CPF: ${musician.cpf}` : ''}
${musician.ecad ? `ECAD: ${musician.ecad}` : ''}
${musician.notes ? `Obs: ${musician.notes}` : ''}`.trim();

        navigator.clipboard.writeText(text);
        setCopiedAllId(musician.id);
        setTimeout(() => setCopiedAllId(null), 2000);
    };

    const handleWhatsApp = async (phone: string) => {
        await sendWhatsAppMessage(phone, '', appState.whatsappSendMethod);
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCurrentMusician(prev => ({ ...prev, avatarUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const filteredMusicians = useMemo(() => {
        return musicians.filter(m => 
            m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            m.instruments.some(i => i.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [musicians, searchTerm]);

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    return (
        <div className="h-full flex flex-col">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
                <h2 className="text-3xl font-bold text-primary-text">Músicos</h2>
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <input 
                        type="text" 
                        placeholder="Buscar músico ou instrumento..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="px-4 py-2 border border-border-color rounded-full bg-white focus:outline-none focus:ring-2 focus:ring-apple-blue flex-1"
                    />
                    <button 
                        onClick={() => { setCurrentMusician({ gender: 'male', rating: 5, instruments: [] }); setIsAddModalOpen(true); }}
                        className="rounded-full px-5 py-2 bg-apple-blue text-white font-medium hover:bg-apple-blue-hover transition-colors flex items-center gap-2 whitespace-nowrap"
                    >
                        <PlusIcon className="w-4 h-4" />
                        Adicionar
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 overflow-y-auto pb-4">
                {filteredMusicians.map(musician => (
                    <div key={musician.id} className="bg-white rounded-2xl border border-border-color shadow-sm p-5 hover:shadow-md transition-all group relative">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                {musician.avatarUrl ? (
                                    <div className="w-14 h-14 rounded-full overflow-hidden border border-gray-100 shadow-sm bg-gray-50 flex-shrink-0">
                                        <img src={musician.avatarUrl} alt={musician.name} className="w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <AbstractAvatar name={musician.name} gender={musician.gender} size={56} />
                                )}
                                <div className="min-w-0">
                                    <h3 className="font-bold text-lg text-primary-text truncate">{musician.name}</h3>
                                    <div className="flex items-center gap-1 text-yellow-400">
                                        {[...Array(5)].map((_, i) => (
                                            <StarIcon key={i} className={`w-3 h-3 ${i < (musician.rating || 0) ? 'fill-current' : 'text-gray-200 fill-current'}`} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={() => { setCurrentMusician({...musician}); setIsAddModalOpen(true); }}
                                className="text-apple-blue hover:text-apple-blue-hover transition-colors text-xs font-bold bg-blue-50 px-3 py-1 rounded-full"
                            >
                                Editar
                            </button>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-4">
                            {(musician.instruments || []).map((inst, i) => (
                                <span key={i} className="px-2 py-1 bg-purple-50 text-purple-700 text-[10px] font-bold uppercase tracking-wider rounded border border-purple-100">
                                    {inst}
                                </span>
                            ))}
                        </div>

                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-secondary-text">Cachê Padrão</span>
                                <span className="font-bold text-primary-text">{formatCurrency(musician.cacheValue || 0)}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {musician.cpf && (
                                    <div className="flex flex-col">
                                        <span className="text-[9px] text-secondary-text uppercase font-bold tracking-tighter">CPF</span>
                                        <span className="text-[10px] text-primary-text font-mono">{musician.cpf}</span>
                                    </div>
                                )}
                                {musician.ecad && (
                                    <div className="flex flex-col">
                                        <span className="text-[9px] text-secondary-text uppercase font-bold tracking-tighter">ECAD</span>
                                        <span className="text-[10px] text-primary-text font-mono">{musician.ecad}</span>
                                    </div>
                                )}
                            </div>
                            {musician.notes && (
                                <p className="text-xs text-secondary-text bg-gray-50 p-2 rounded-lg italic line-clamp-2">"{musician.notes}"</p>
                            )}
                        </div>

                        <div className="grid grid-cols-4 gap-1 pt-4 border-t border-border-color/50">
                            {musician.whatsapp && (
                                <button 
                                    onClick={() => handleWhatsApp(musician.whatsapp)}
                                    className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg hover:bg-green-50 text-secondary-text hover:text-green-700 transition-colors"
                                    title="WhatsApp"
                                >
                                    <PhoneIcon className="w-5 h-5" />
                                    <span className="text-[10px] font-medium">Conversar</span>
                                </button>
                            )}
                            {musician.pixKey && (
                                <button 
                                    onClick={() => handleCopyPix(musician.pixKey, musician.id)}
                                    className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg hover:bg-gray-100 text-secondary-text hover:text-primary-text transition-colors"
                                    title={musician.pixKey}
                                >
                                    {copiedPixId === musician.id ? <CheckIcon className="w-5 h-5 text-green-600" /> : <ClipboardCopyIcon className="w-5 h-5" />}
                                    <span className="text-[10px] font-medium">{copiedPixId === musician.id ? 'Copiado!' : 'Pix'}</span>
                                </button>
                            )}
                            <button 
                                onClick={() => handleCopyAllData(musician)}
                                className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg hover:bg-purple-50 text-secondary-text hover:text-purple-600 transition-colors"
                                title="Copiar todos os dados"
                            >
                                {copiedAllId === musician.id ? <CheckIcon className="w-5 h-5 text-green-600" /> : <CopyIcon className="w-5 h-5" />}
                                <span className="text-[10px] font-medium">{copiedAllId === musician.id ? 'Copiado!' : 'Dados'}</span>
                            </button>
                            <button 
                                onClick={() => handleOpenPayment(musician)}
                                className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg hover:bg-blue-50 text-secondary-text hover:text-apple-blue transition-colors"
                                title="Lançar Saída"
                            >
                                <DollarSignIcon className="w-5 h-5" />
                                <span className="text-[10px] font-medium">Pagar</span>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add/Edit Modal */}
            {isAddModalOpen && (
                <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title={currentMusician.id ? 'Editar Músico' : 'Novo Músico'}>
                    <form onSubmit={handleSaveMusician} className="space-y-4">
                        
                        {/* Avatar Upload Trigger */}
                        <div className="flex flex-col items-center mb-6">
                            <div 
                                className="relative group cursor-pointer w-28 h-28" 
                                onClick={handleAvatarClick}
                                title="Clique para alterar a foto"
                            >
                                <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-xl bg-gray-50 ring-1 ring-black/5">
                                    {currentMusician.avatarUrl ? (
                                        <img src={currentMusician.avatarUrl} alt={currentMusician.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <AbstractAvatar name={currentMusician.name || 'Novo'} gender={currentMusician.gender || 'male'} size={112} />
                                    )}
                                </div>
                                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-[2px]">
                                    <div className="flex flex-col items-center text-white scale-90 group-hover:scale-100 transition-transform">
                                        <ImageIcon className="w-6 h-6 mb-1 shadow-sm" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Trocar Foto</span>
                                    </div>
                                </div>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    onChange={handleFileChange} 
                                    className="hidden" 
                                    accept="image/*"
                                />
                            </div>
                            <p className="text-[10px] text-secondary-text mt-2 uppercase font-bold tracking-widest">Clique na foto para subir</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-secondary-text mb-1">Nome</label>
                            <input 
                                type="text" 
                                value={currentMusician.name || ''} 
                                onChange={e => setCurrentMusician({...currentMusician, name: e.target.value})}
                                className="w-full px-3 py-2 border border-border-color rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-apple-blue"
                                required 
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-secondary-text mb-1">Cachê Padrão (R$)</label>
                                <input 
                                    type="number" 
                                    value={currentMusician.cacheValue || ''} 
                                    onChange={e => setCurrentMusician({...currentMusician, cacheValue: parseFloat(e.target.value)})}
                                    className="w-full px-3 py-2 border border-border-color rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-apple-blue"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary-text mb-1">Chave PIX</label>
                                <input 
                                    type="text" 
                                    value={currentMusician.pixKey || ''} 
                                    onChange={e => setCurrentMusician({...currentMusician, pixKey: e.target.value})}
                                    className="w-full px-3 py-2 border border-border-color rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-apple-blue"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary-text mb-1">Instrumentos (separados por vírgula)</label>
                            <input 
                                type="text" 
                                value={currentMusician.instruments ? (Array.isArray(currentMusician.instruments) ? currentMusician.instruments.join(', ') : currentMusician.instruments) : ''} 
                                onChange={e => setCurrentMusician({...currentMusician, instruments: e.target.value})}
                                className="w-full px-3 py-2 border border-border-color rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-apple-blue"
                                placeholder="Ex: Guitarra, Violão, Baixo"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-secondary-text mb-1">WhatsApp</label>
                                <input 
                                    type="text" 
                                    value={currentMusician.whatsapp || ''} 
                                    onChange={e => setCurrentMusician({...currentMusician, whatsapp: e.target.value})}
                                    className="w-full px-3 py-2 border border-border-color rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-apple-blue"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary-text mb-1">Avaliação (1-5)</label>
                                <select 
                                    value={currentMusician.rating || 5} 
                                    onChange={e => setCurrentMusician({...currentMusician, rating: parseInt(e.target.value)})}
                                    className="w-full px-3 py-2 border border-border-color rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-apple-blue"
                                >
                                    <option value="5">⭐⭐⭐⭐⭐ (Excelente)</option>
                                    <option value="4">⭐⭐⭐⭐ (Muito Bom)</option>
                                    <option value="3">⭐⭐⭐ (Bom)</option>
                                    <option value="2">⭐⭐ (Regular)</option>
                                    <option value="1">⭐ (Ruim)</option>
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-secondary-text mb-1">CPF</label>
                                <input 
                                    type="text" 
                                    value={currentMusician.cpf || ''} 
                                    onChange={e => setCurrentMusician({...currentMusician, cpf: e.target.value})}
                                    className="w-full px-3 py-2 border border-border-color rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-apple-blue"
                                    placeholder="000.000.000-00"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary-text mb-1">Código ECAD</label>
                                <input 
                                    type="text" 
                                    value={currentMusician.ecad || ''} 
                                    onChange={e => setCurrentMusician({...currentMusician, ecad: e.target.value})}
                                    className="w-full px-3 py-2 border border-border-color rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-apple-blue"
                                    placeholder="Opcional"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary-text mb-1">Observações</label>
                            <textarea 
                                value={currentMusician.notes || ''} 
                                onChange={e => setCurrentMusician({...currentMusician, notes: e.target.value})}
                                rows={3}
                                className="w-full px-3 py-2 border border-border-color rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-apple-blue"
                            />
                        </div>
                        
                        <div className="flex justify-between items-center pt-4">
                            {currentMusician.id ? (
                                <button 
                                    type="button" 
                                    onClick={() => { handleDeleteMusician(currentMusician.id!); setIsAddModalOpen(false); }}
                                    className="text-red-500 hover:text-red-700 font-medium text-sm flex items-center gap-1"
                                >
                                    <TrashIcon className="w-4 h-4" /> Excluir
                                </button>
                            ) : <div></div>}
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="rounded-full px-4 py-2 border border-gray-200 text-secondary-text font-medium hover:bg-gray-50 transition-colors">Cancelar</button>
                                <button type="submit" className="rounded-full px-5 py-2 bg-apple-blue text-white font-medium hover:bg-apple-blue-hover shadow-sm">Salvar Alterações</button>
                            </div>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Payment Modal */}
            {isPaymentModalOpen && (
                <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Lançar Pagamento de Cachê">
                    <form onSubmit={confirmPayment} className="space-y-4">
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-4">
                            <p className="text-sm text-blue-800">Isso criará automaticamente uma saída no módulo Financeiro.</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary-text mb-1">Descrição</label>
                            <input 
                                type="text" 
                                value={paymentData.description} 
                                onChange={e => setPaymentData({...paymentData, description: e.target.value})}
                                className="w-full px-3 py-2 border border-border-color rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-apple-blue"
                                required 
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-secondary-text mb-1">Valor (R$)</label>
                                <input 
                                    type="number" 
                                    value={paymentData.amount} 
                                    onChange={e => setPaymentData({...paymentData, amount: parseFloat(e.target.value)})}
                                    className="w-full px-3 py-2 border border-border-color rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-apple-blue"
                                    required 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary-text mb-1">Data</label>
                                <input 
                                    type="date" 
                                    value={paymentData.date} 
                                    onChange={e => setPaymentData({...paymentData, date: e.target.value})}
                                    className="w-full px-3 py-2 border border-border-color rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-apple-blue"
                                    required 
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="rounded-full px-4 py-2 border border-gray-200 text-secondary-text font-medium hover:bg-gray-50">Cancelar</button>
                            <button type="submit" className="rounded-full px-5 py-2 bg-apple-green text-white font-medium hover:bg-green-600 shadow-md">Confirmar Pagamento</button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};
