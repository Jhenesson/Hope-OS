
import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { AppState } from '../types';
import { 
    MOCK_CLIENTS, 
    MOCK_FINANCIAL_DATA, 
    MOCK_PRODUCTS,
    MOCK_RECORDINGS,
    MOCK_PROJECTS,
    MOCK_PROJECT_TRACKS,
    MOCK_COPYWRITING,
    MOCK_EVENTS,
    MOCK_EVENT_INTERESTS,
    MOCK_CALENDAR_EVENTS,
    MOCK_LANCAMENTOS,
    MOCK_SAIDAS,
    MOCK_CAMPAIGNS,
    MOCK_EXPENSE_PRESETS,
    MOCK_MUSICIANS,
} from '../constants';
import { getSupabaseClient } from '../lib/supabaseClient';

interface AppContextType {
    appState: AppState;
    setAppState: React.Dispatch<React.SetStateAction<AppState>>;
    syncToCloud: (silent?: boolean) => Promise<boolean>;
    loadFromCloud: (silent?: boolean) => Promise<boolean>;
    syncStatus: 'idle' | 'saving' | 'saved' | 'error' | 'loading';
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Define the full default state
const initialAppState: AppState = {
    clients: MOCK_CLIENTS,
    financials: MOCK_FINANCIAL_DATA,
    products: MOCK_PRODUCTS,
    recordings: MOCK_RECORDINGS,
    projects: MOCK_PROJECTS,
    projectTracks: MOCK_PROJECT_TRACKS,
    copywriting: MOCK_COPYWRITING,
    events: MOCK_EVENTS,
    eventInterests: MOCK_EVENT_INTERESTS,
    calendarEvents: MOCK_CALENDAR_EVENTS,
    lancamentos: MOCK_LANCAMENTOS,
    saidas: MOCK_SAIDAS,
    campaigns: MOCK_CAMPAIGNS,
    expensePresets: MOCK_EXPENSE_PRESETS,
    musicians: MOCK_MUSICIANS,
    isCloudSyncEnabled: false,
    whatsappSendMethod: 'browser',
    whatsappApiUrl: 'https://waha.hoperiseprodutora.com/api',
    whatsappApiKey: 'hope_waha_key',
    whatsappSessionName: 'default',
};

const STORAGE_KEY = 'hope-os-storage-v1';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [appState, setAppState] = useLocalStorage<AppState>(STORAGE_KEY, initialAppState);
    const [syncStatus, setSyncStatus] = useState<'idle' | 'saving' | 'saved' | 'error' | 'loading'>('idle');
    const isRemoteUpdate = useRef(false);

    const syncToCloud = async (silent = false): Promise<boolean> => {
        const supabase = getSupabaseClient();
        if (!supabase) {
            if (!silent) alert('Configure as chaves do Supabase nas Configurações primeiro.');
            return false;
        }

        try {
            if (!silent) setSyncStatus('saving');
            const { error: backupError } = await supabase
                .from('hope_os_backup')
                .insert([{ data: appState }]);

            if (backupError) {
                console.error('Supabase sync error:', backupError);
                if (!silent) alert(`Erro ao salvar na nuvem: ${backupError.message}`);
                setSyncStatus('error');
                return false;
            }
            
            setSyncStatus('saved');
            setTimeout(() => setSyncStatus('idle'), 3000);
            return true;
        } catch (err) {
            console.error('Unexpected sync error:', err);
            setSyncStatus('error');
            return false;
        }
    };

    const loadFromCloud = async (silent = false): Promise<boolean> => {
        const supabase = getSupabaseClient();
        if (!supabase) return false;
        try {
            if (!silent) setSyncStatus('loading');
            const { data, error } = await supabase
                .from('hope_os_backup')
                .select('data')
                .order('id', { ascending: false })
                .limit(1)
                .single();

            if (error) {
                console.error('Supabase load error:', error);
                if (!silent) alert(`Erro ao carregar da nuvem: ${error.message}`);
                setSyncStatus('error');
                return false;
            }

            if (data && data.data) {
                isRemoteUpdate.current = true;
                setAppState(data.data);
                setSyncStatus('saved');
                setTimeout(() => setSyncStatus('idle'), 3000);
                return true;
            }
            setSyncStatus('idle');
            return false;
        } catch (err) {
            console.error('Unexpected load error:', err);
            setSyncStatus('error');
            return false;
        }
    };

    useEffect(() => {
        if (appState.isCloudSyncEnabled) {
            loadFromCloud(true);
        }

        setAppState(prev => {
            const keys = Object.keys(initialAppState) as Array<keyof AppState>;
            let hasChanges = false;
            const migratedState = { ...prev };

            keys.forEach(key => {
                if (migratedState[key] === undefined) {
                    (migratedState as any)[key] = initialAppState[key];
                    hasChanges = true;
                }
            });

            // Migration for WhatsApp API URL: Force update if it's an old temporary URL
            if (migratedState.whatsappApiUrl && migratedState.whatsappApiUrl.includes('trycloudflare.com')) {
                migratedState.whatsappApiUrl = initialAppState.whatsappApiUrl;
                hasChanges = true;
            }

            return hasChanges ? migratedState : prev;
        });
    }, []);

    useEffect(() => {
        if (!appState.isCloudSyncEnabled) return;
        if (isRemoteUpdate.current) {
            isRemoteUpdate.current = false;
            return;
        }
        const timer = setTimeout(() => {
            syncToCloud(true);
        }, 10000);
        return () => clearTimeout(timer);
    }, [appState]);

    return (
        <AppContext.Provider value={{ appState, setAppState, syncToCloud, loadFromCloud, syncStatus }}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};
