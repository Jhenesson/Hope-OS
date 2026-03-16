
/// <reference types="vite/client" />
import React, { useRef, useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { ProductsPage } from './ProductsPage';
import { getSupabaseClient } from '../lib/supabaseClient';
import { ClipboardCopyIcon, CheckIcon, CalendarIcon } from '../components/icons/Icons';

const STORAGE_KEY = 'hope-os-storage-v1';

type SettingsTab = 'backup' | 'cloud' | 'products' | 'integrations';
type SqlTab = 'essential' | 'integrations';

export const SettingsPage: React.FC = () => {
    const { appState, setAppState, syncToCloud, loadFromCloud, syncStatus } = useAppContext();
    const [activeTab, setActiveTab] = useState<SettingsTab>('backup');
    const [activeSqlTab, setActiveSqlTab] = useState<SqlTab>('essential');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Cloud State
    const [supabaseUrl, setSupabaseUrl] = useState('');
    const [supabaseKey, setSupabaseKey] = useState('');
    const [isSyncing, setIsSyncing] = useState(false);
    const [sqlCopied, setSqlCopied] = useState(false);
    const [googleConnected, setGoogleConnected] = useState(false);
    const [oauthDebug, setOauthDebug] = useState<{ 
        redirectUri: string; 
        clientIdStatus: string; 
        envRedirectUri: string;
        appUrl: string;
        cookieStatus: string;
        cookiesReceived: string[];
    } | null>(null);

    useEffect(() => {
        checkGoogleStatus();
        fetchOauthDebug();
    }, []);

    const fetchOauthDebug = async () => {
        try {
            const res = await fetch('/api/auth/google/debug');
            const data = await res.json();
            setOauthDebug(data);
        } catch (error) {
            console.error('Error fetching OAuth debug:', error);
        }
    };

    const checkGoogleStatus = async () => {
        try {
            const res = await fetch('/api/auth/google/status');
            const data = await res.json();
            setGoogleConnected(data.connected);
            setOauthDebug(data);
        } catch (error) {
            console.error('Error checking Google status:', error);
        }
    };

    const handleConnectGoogle = async () => {
        try {
            const res = await fetch('/api/auth/google/url');
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ error: 'Erro desconhecido no servidor' }));
                throw new Error(errorData.error || `Erro HTTP: ${res.status}`);
            }
            const { url } = await res.json();
            
            const authWindow = window.open(url, 'google_auth', 'width=600,height=700');
            
            const handleMessage = (event: MessageEvent) => {
                if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
                    setGoogleConnected(true);
                    if (event.data.tokens) {
                        setAppState(prev => ({ ...prev, googleTokens: event.data.tokens }));
                    }
                    window.removeEventListener('message', handleMessage);
                }
            };
            window.addEventListener('message', handleMessage);
        } catch (error: any) {
            console.error('Error connecting to Google:', error);
            alert(`Erro ao conectar com o Google: ${error.message}`);
        }
    };

    const [isDisconnecting, setIsDisconnecting] = useState(false);

    const handleLogoutGoogle = async () => {
        if (!confirm('Deseja desconectar sua conta do Google?')) return;
        
        setIsDisconnecting(true);
        try {
            console.log('Logging out of Google...');
            const response = await fetch('/api/auth/google/logout', { method: 'POST' });
            
            // Always clear local state even if server fails
            setAppState(prev => ({ ...prev, googleTokens: undefined }));
            setGoogleConnected(false);
            setOauthDebug(prev => ({ ...prev, cookieStatus: 'Ausente', cookiesReceived: [] }));
            
            if (response.ok) {
                console.log('Server logout successful');
                alert('Conta do Google desconectada com sucesso!');
            } else {
                console.warn('Server logout returned non-OK status:', response.status);
                alert('Conexão removida localmente. O servidor pode ainda ter uma sessão ativa.');
            }
        } catch (error) {
            console.error('Error logging out of Google:', error);
            setAppState(prev => ({ ...prev, googleTokens: undefined }));
            setGoogleConnected(false);
            alert('Erro ao desconectar no servidor. A conexão foi removida localmente.');
        } finally {
            setIsDisconnecting(false);
        }
    };

    useEffect(() => {
        setSupabaseUrl(localStorage.getItem('hope_os_supabase_url') || import.meta.env.VITE_SUPABASE_URL || '');
        setSupabaseKey(localStorage.getItem('hope_os_supabase_key') || import.meta.env.VITE_SUPABASE_ANON_KEY || '');
    }, []);

    const handleSaveCloudConfig = () => {
        localStorage.setItem('hope_os_supabase_url', supabaseUrl);
        localStorage.setItem('hope_os_supabase_key', supabaseKey);
        alert('Configurações de nuvem salvas! Recarregue a página para aplicar.');
    };

    const handleCloudSync = async (direction: 'upload' | 'download') => {
        setIsSyncing(true);
        if (direction === 'upload') {
            const success = await syncToCloud();
            if (success) alert('Dados enviados para a nuvem com sucesso!');
        } else {
            if (confirm('Isso substituirá seus dados locais pelos dados da nuvem. Continuar?')) {
                const success = await loadFromCloud();
                if (success) alert('Dados baixados da nuvem com sucesso!');
            }
        }
        setIsSyncing(false);
    };

    const handleExport = () => {
        const dataString = localStorage.getItem(STORAGE_KEY);
        if (!dataString) {
            alert("Nenhum dado encontrado para exportar.");
            return;
        }

        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(dataString)}`;

        const link = document.createElement("a");
        link.href = jsonString;
        const date = new Date().toISOString().split('T')[0];
        link.download = `hope-os-backup-${date}.json`;
        link.click();
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };
    
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error("File is not a valid text file.");
                
                // Basic validation
                const importedData = JSON.parse(text);
                
                // We check for some core keys
                const essentialKeys = ['clients', 'recordings', 'products'];
                const hasEssentialKeys = essentialKeys.every(key => key in importedData);
                
                if (hasEssentialKeys) {
                    localStorage.setItem(STORAGE_KEY, text);
                    alert(`Importação concluída com sucesso! A aplicação será recarregada.`);
                    window.location.reload();
                } else {
                    alert('O arquivo não parece ser um backup válido do HOPE OS.');
                }
            } catch (error) {
                console.error("Failed to parse JSON file:", error);
                alert('Erro ao importar o arquivo. Verifique se é um arquivo .json válido.');
            } finally {
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        };
        reader.readAsText(file);
    };

    const getSqlScript = (type: SqlTab) => {
        if (type === 'essential') {
            return `-- 1. TABELA DE BACKUP (Essencial para o App funcionar)
create table if not exists hope_os_backup (
  id bigint primary key generated always as identity,
  data jsonb not null,
  updated_at timestamptz default now()
);

-- Habilitar acesso público (Simplificado)
alter table hope_os_backup enable row level security;
create policy "Enable all access" on hope_os_backup for all using (true) with check (true);

-- Criar registro inicial
insert into hope_os_backup (data) values ('{}');`;
        } else {
            return `-- 2. TABELAS PARA INTEGRAÇÃO (n8n / Zapier / WhatsApp)
-- Permite que ferramentas externas insiram leads e clientes

-- Tabela de Leads
create table if not exists leads (
  id text primary key,
  name text not null,
  company text,
  status text,
  whatsapp text,
  email text,
  notes text,
  "lastContact" text,
  "nextFollowUp" text,
  gender text,
  updated_at timestamptz default now()
);
alter table leads enable row level security;
create policy "Enable all access leads" on leads for all using (true) with check (true);

-- Tabela de Clientes
create table if not exists clients (
  id text primary key,
  name text not null,
  email text,
  whatsapp text,
  status text,
  gender text,
  "lastProjectDate" text,
  updated_at timestamptz default now()
);
alter table clients enable row level security;
create policy "Enable all access clients" on clients for all using (true) with check (true);`;
        }
    };

    const handleCopySql = () => {
        navigator.clipboard.writeText(getSqlScript(activeSqlTab));
        setSqlCopied(true);
        setTimeout(() => setSqlCopied(false), 2000);
    };

    return (
        <div className="h-full flex flex-col">
            <h2 className="text-3xl font-bold text-primary-text mb-6">Configurações</h2>
            
             {/* Tabs */}
             <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl w-fit mb-6 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('backup')}
                    className={`px-6 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                        activeTab === 'backup'
                            ? 'bg-white text-primary-text shadow-sm'
                            : 'text-secondary-text hover:text-primary-text'
                    }`}
                >
                    Backup Local
                </button>
                <button
                    onClick={() => setActiveTab('cloud')}
                    className={`px-6 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                        activeTab === 'cloud'
                            ? 'bg-white text-primary-text shadow-sm'
                            : 'text-secondary-text hover:text-primary-text'
                    }`}
                >
                    Nuvem / Database
                </button>
                <button
                    onClick={() => setActiveTab('products')}
                    className={`px-6 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                        activeTab === 'products'
                            ? 'bg-white text-primary-text shadow-sm'
                            : 'text-secondary-text hover:text-primary-text'
                    }`}
                >
                    Produtos & Serviços
                </button>
                <button
                    onClick={() => setActiveTab('integrations')}
                    className={`px-6 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                        activeTab === 'integrations'
                            ? 'bg-white text-primary-text shadow-sm'
                            : 'text-secondary-text hover:text-primary-text'
                    }`}
                >
                    Integrações
                </button>
            </div>

            <div className="flex-1 overflow-y-auto">
                {activeTab === 'backup' && (
                    <div className="bg-white rounded-2xl border border-border-color shadow-sm p-6 animate-fadeIn">
                        <h3 className="text-xl font-semibold text-primary-text">Backup de Dados (Arquivo)</h3>
                        <p className="text-secondary-text mt-2 mb-6">
                            Exporte todos os seus dados para um arquivo .json. Útil para backups manuais.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={handleExport}
                                className="w-full sm:w-auto flex-1 rounded-full px-6 py-3 bg-apple-blue text-white font-semibold hover:bg-apple-blue-hover transition-colors flex items-center justify-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                Exportar Dados (.json)
                            </button>
                            <button
                                onClick={handleImportClick}
                                className="w-full sm:w-auto flex-1 rounded-full px-6 py-3 bg-white border-2 border-apple-blue text-apple-blue font-semibold hover:bg-apple-blue/10 transition-colors flex items-center justify-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 5 17 10"/><line x1="12" y1="5" x2="12" y2="15"/></svg>
                                Importar Dados (.json)
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept=".json"
                                className="hidden"
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'cloud' && (
                    <div className="bg-white rounded-2xl border border-border-color shadow-sm p-6 animate-fadeIn space-y-6">
                        
                        {/* Connection Config */}
                        <div>
                            <h3 className="text-xl font-semibold text-primary-text">Conexão Supabase</h3>
                            <p className="text-secondary-text mt-1 text-sm">
                                Configure as chaves para habilitar a sincronização e integração.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-4 bg-gray-50 p-4 rounded-xl border border-border-color">
                            <div>
                                <label className="block text-sm font-medium text-secondary-text mb-1">Método de Envio do WhatsApp</label>
                                <select 
                                    value={appState.whatsappSendMethod || 'browser'}
                                    onChange={(e) => setAppState(prev => ({ ...prev, whatsappSendMethod: e.target.value as 'browser' | 'extension' | 'api' }))}
                                    className="w-full px-3 py-2 border border-border-color rounded-lg focus:ring-2 focus:ring-apple-blue outline-none text-sm bg-white"
                                >
                                    <option value="browser">Abrir no Navegador (Padrão - wa.me)</option>
                                    <option value="extension">Enviar via Extensão (Hope Lead System)</option>
                                    <option value="api">API Direta (WAHA - Cloudflare)</option>
                                </select>
                                <p className="text-xs text-secondary-text mt-1">A opção "API Direta" envia mensagens instantaneamente sem abrir abas.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary-text mb-1">Supabase Project URL</label>
                                <input 
                                    type="text" 
                                    value={supabaseUrl} 
                                    onChange={(e) => setSupabaseUrl(e.target.value)} 
                                    className="w-full px-3 py-2 border border-border-color rounded-lg focus:ring-2 focus:ring-apple-blue outline-none text-sm"
                                    placeholder="https://xyz.supabase.co"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary-text mb-1">Supabase Anon Key</label>
                                <input 
                                    type="password" 
                                    value={supabaseKey} 
                                    onChange={(e) => setSupabaseKey(e.target.value)} 
                                    className="w-full px-3 py-2 border border-border-color rounded-lg focus:ring-2 focus:ring-apple-blue outline-none text-sm"
                                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6Ik..."
                                />
                            </div>
                            <button 
                                onClick={handleSaveCloudConfig}
                                className="mt-2 w-full py-2 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-black transition-colors"
                            >
                                Salvar Chaves
                            </button>
                        </div>

                        {/* Setup Help Section */}
                        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 text-white">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-sm font-bold flex items-center gap-2 text-white">
                                    ⚡ Configuração do Banco de Dados (SQL)
                                </h4>
                                <div className="flex bg-gray-700 rounded-lg p-0.5">
                                    <button 
                                        onClick={() => setActiveSqlTab('essential')}
                                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${activeSqlTab === 'essential' ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}
                                    >
                                        Essencial (Backup)
                                    </button>
                                    <button 
                                        onClick={() => setActiveSqlTab('integrations')}
                                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${activeSqlTab === 'integrations' ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}
                                    >
                                        Integrações (n8n)
                                    </button>
                                </div>
                            </div>
                            
                            <p className="text-xs text-gray-400 mb-3">
                                Cole o código abaixo no <a href="https://supabase.com/dashboard" target="_blank" className="underline text-apple-blue font-bold hover:text-blue-400">SQL Editor do Supabase</a> para criar as tabelas necessárias.
                            </p>
                            
                            <div className="relative bg-gray-950 rounded-lg p-4 border border-gray-700">
                                <pre className="text-[11px] text-green-400 font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">
                                    {getSqlScript(activeSqlTab)}
                                </pre>
                                <button 
                                    onClick={handleCopySql}
                                    className="absolute top-3 right-3 bg-white/10 hover:bg-white/20 text-white text-xs px-3 py-1.5 rounded-md flex items-center gap-2 transition-colors border border-white/10"
                                >
                                    {sqlCopied ? <><CheckIcon className="w-3 h-3" /> Copiado</> : <><ClipboardCopyIcon className="w-3 h-3" /> Copiar</>}
                                </button>
                            </div>
                        </div>

                        {/* Auto-Sync Toggle */}
                        <div className="flex items-center justify-between bg-blue-50 p-4 rounded-xl border border-blue-100">
                            <div>
                                <h4 className="font-bold text-primary-text flex items-center gap-2">
                                    Sincronização Automática
                                </h4>
                                <p className="text-xs text-secondary-text mt-1">Salvar alterações automaticamente e carregar ao iniciar.</p>
                            </div>
                            <div className="flex items-center gap-4">
                                {/* Status Indicator */}
                                {syncStatus === 'saving' && <span className="text-xs font-bold text-blue-600 animate-pulse">☁️ Salvando...</span>}
                                {syncStatus === 'saved' && <span className="text-xs font-bold text-green-600">✔ Sincronizado</span>}
                                {syncStatus === 'error' && <span className="text-xs font-bold text-red-600">✖ Erro</span>}
                                {syncStatus === 'loading' && <span className="text-xs font-bold text-blue-600 animate-pulse">⬇ Baixando...</span>}

                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={appState.isCloudSyncEnabled} 
                                        onChange={(e) => setAppState(prev => ({ ...prev, isCloudSyncEnabled: e.target.checked }))}
                                        className="sr-only peer" 
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-apple-blue"></div>
                                </label>
                            </div>
                        </div>

                        {/* Manual Controls */}
                        <div className="pt-4 border-t border-border-color">
                            <h4 className="text-sm font-bold text-primary-text mb-4 uppercase tracking-wide">Sincronização Manual</h4>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <button
                                    onClick={() => handleCloudSync('upload')}
                                    disabled={isSyncing || !supabaseUrl}
                                    className={`flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${!supabaseUrl ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-blue-600 hover:bg-blue-50 border border-blue-200'}`}
                                >
                                    {isSyncing ? 'Enviando...' : (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                            Enviar para Nuvem (Upload)
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => handleCloudSync('download')}
                                    disabled={isSyncing || !supabaseUrl}
                                    className={`flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${!supabaseUrl ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-green-600 hover:bg-green-50 border border-green-200'}`}
                                >
                                    {isSyncing ? 'Baixando...' : (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                            Baixar da Nuvem (Download)
                                        </>
                                    )}
                                </button>
                            </div>
                            <p className="text-xs text-secondary-text mt-3 text-center">
                                "Enviar" sobrescreve o backup na nuvem com seus dados atuais.<br/>
                                "Baixar" sobrescreve seus dados locais com o backup da nuvem.
                            </p>
                        </div>
                    </div>
                )}

                {activeTab === 'products' && (
                    <div className="animate-fadeIn h-full">
                        <ProductsPage />
                    </div>
                )}

                {activeTab === 'integrations' && (
                    <div className="animate-fadeIn space-y-8">
                        <div className="bg-white rounded-3xl border border-border-color p-8 shadow-sm">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-600">
                                    <CalendarIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-primary-text">Google Agenda</h3>
                                    <p className="text-sm text-secondary-text">Sincronize suas gravações diretamente com seu calendário pessoal.</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl border border-border-color">
                                <div className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full ${(googleConnected || appState.googleTokens) ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
                                    <span className="text-sm font-bold text-primary-text">
                                        {(googleConnected || appState.googleTokens) ? 'Conectado' : 'Não conectado'}
                                    </span>
                                </div>
                                
                                {(googleConnected || appState.googleTokens) ? (
                                    <button 
                                        onClick={handleLogoutGoogle}
                                        disabled={isDisconnecting}
                                        className={`px-6 py-2 bg-white border border-red-200 text-red-600 rounded-xl text-sm font-bold hover:bg-red-50 transition-all ${isDisconnecting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {isDisconnecting ? 'Desconectando...' : 'Desconectar'}
                                    </button>
                                ) : (
                                    <button 
                                        onClick={handleConnectGoogle}
                                        className="px-6 py-2 bg-apple-blue text-white rounded-xl text-sm font-bold hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20"
                                    >
                                        Conectar Google Agenda
                                    </button>
                                )}
                            </div>

                            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                                <p className="text-xs text-blue-700 leading-relaxed">
                                     <strong>Nota:</strong> Após conectar, você verá um botão de sincronização em cada agendamento na página de Gravações.
                                 </p>
                                 <p className="text-[10px] text-blue-600 mt-2 italic">
                                     Se a conexão não persistir, tente abrir a aplicação em uma nova aba (ícone no canto superior direito do editor).
                                 </p>
                            </div>

                            <div className="mt-8 pt-8 border-t border-border-color">
                                <h3 className="text-xl font-bold text-primary-text mb-4">Configuração WhatsApp API (WAHA)</h3>
                                <div className="space-y-4 bg-gray-50 p-6 rounded-2xl border border-border-color">
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-text mb-1">URL da API (WAHA)</label>
                                        <input 
                                            type="text" 
                                            value={appState.whatsappApiUrl || ''} 
                                            onChange={(e) => setAppState(prev => ({ ...prev, whatsappApiUrl: e.target.value }))} 
                                            className="w-full px-3 py-2 border border-border-color rounded-lg focus:ring-2 focus:ring-apple-blue outline-none text-sm bg-white"
                                            placeholder="https://sua-url.trycloudflare.com/api"
                                        />
                                        <p className="text-[10px] text-secondary-text mt-1">A URL deve terminar em /api (sem a barra final).</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-text mb-1">API Key (X-Api-Key)</label>
                                        <input 
                                            type="password" 
                                            value={appState.whatsappApiKey || ''} 
                                            onChange={(e) => setAppState(prev => ({ ...prev, whatsappApiKey: e.target.value }))} 
                                            className="w-full px-3 py-2 border border-border-color rounded-lg focus:ring-2 focus:ring-apple-blue outline-none text-sm bg-white"
                                            placeholder="Sua chave de API"
                                        />
                                    </div>
                                    <div className="p-3 bg-yellow-50 border border-yellow-100 rounded-lg space-y-2">
                                        <p className="text-[10px] text-yellow-700">
                                            <strong>Atenção:</strong> Se o envio de texto falhar, verifique se a sua sessão no WAHA está conectada e se a URL acima está acessível.
                                        </p>
                                        <p className="text-[10px] text-yellow-800 font-medium">
                                            ℹ️ <strong>Dica de Imagens:</strong> A engine <code>NOWEB</code> do WAHA (versão gratuita) não permite enviar imagens. Se a opção <code>WEBJS</code> não aparecer no seu painel, você pode usar o método <strong>"Abrir no Navegador"</strong> acima quando precisar enviar o card visual, ou considerar a versão Plus do WAHA.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {oauthDebug && (
                                <div className="mt-8 pt-8 border-t border-border-color">
                                    <h4 className="text-xs font-bold text-secondary-text uppercase tracking-widest mb-4">Configuração Técnica (Debug)</h4>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-[10px] text-secondary-text uppercase mb-1">URI de Redirecionamento (Copie para o Google Console)</p>
                                            <div className="flex items-center gap-2">
                                                <code className="flex-1 p-2 bg-gray-100 rounded text-[10px] font-mono break-all">{oauthDebug.redirectUri}</code>
                                                <button 
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(oauthDebug.redirectUri);
                                                        alert('Copiado!');
                                                    }}
                                                    className="p-2 hover:bg-gray-200 rounded transition-colors"
                                                >
                                                    <ClipboardCopyIcon className="w-4 h-4 text-secondary-text" />
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-secondary-text uppercase mb-1">Status da Conexão</p>
                                            <div className="flex flex-col gap-1">
                                                <span className={`text-[10px] font-bold ${oauthDebug.cookieStatus === 'Presente' ? 'text-green-600' : 'text-red-600'}`}>
                                                    Cookie: {oauthDebug.cookieStatus}
                                                </span>
                                                <span className="text-[10px] text-secondary-text">
                                                    Cookies Ativos: {oauthDebug.cookiesReceived.join(', ') || 'Nenhum'}
                                                </span>
                                                {/* @ts-ignore */}
                                                {oauthDebug.userAgent && (
                                                    <span className="text-[10px] text-secondary-text mt-1">
                                                        Navegador: {oauthDebug.userAgent}
                                                    </span>
                                                )}
                                                <button 
                                                    onClick={() => {
                                                        setAppState(prev => ({ ...prev, googleTokens: undefined }));
                                                        setGoogleConnected(false);
                                                        alert('Dados locais limpos forçadamente.');
                                                    }}
                                                    className="mt-2 text-[10px] text-red-500 hover:underline text-left"
                                                >
                                                    Limpar dados locais (Force)
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
