

import React, { createContext, useContext } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Lead, Client, FinancialTransaction, Product, Recording, Copywriting, Event, EventInterest, CalendarEvent, LancamentoFinanceiro, SaidaFinanceira, Campaign, ExpensePreset } from '../types';
import { 
    MOCK_LEADS, 
    MOCK_CLIENTS, 
    MOCK_FINANCIAL_DATA, 
    MOCK_PRODUCTS,
    MOCK_RECORDINGS,
    MOCK_COPYWRITING,
    MOCK_EVENTS,
    MOCK_EVENT_INTERESTS,
    MOCK_CALENDAR_EVENTS,
    MOCK_LANCAMENTOS,
    MOCK_SAIDAS,
    MOCK_CAMPAIGNS,
    MOCK_EXPENSE_PRESETS,
} from '../constants';

interface AppState {
    leads: Lead[];
    clients: Client[];
    financials: FinancialTransaction[];
    products: Product[];
    recordings: Recording[];
    copywriting: Copywriting[];
    events: Event[];
    eventInterests: EventInterest[];
    calendarEvents: CalendarEvent[];
    lancamentos: LancamentoFinanceiro[];
    saidas: SaidaFinanceira[];
    campaigns: Campaign[];
    expensePresets: ExpensePreset[];
}

interface AppContextType {
    appState: AppState;
    setAppState: React.Dispatch<React.SetStateAction<AppState>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const initialAppState: AppState = {
    leads: MOCK_LEADS,
    clients: MOCK_CLIENTS,
    financials: MOCK_FINANCIAL_DATA,
    products: MOCK_PRODUCTS,
    recordings: MOCK_RECORDINGS,
    copywriting: MOCK_COPYWRITING,
    events: MOCK_EVENTS,
    eventInterests: MOCK_EVENT_INTERESTS,
    calendarEvents: MOCK_CALENDAR_EVENTS,
    lancamentos: MOCK_LANCAMENTOS,
    saidas: MOCK_SAIDAS,
    campaigns: MOCK_CAMPAIGNS,
    expensePresets: MOCK_EXPENSE_PRESETS,
};

const STORAGE_KEY = 'hope-os-storage-v1';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [appState, setAppState] = useLocalStorage<AppState>(STORAGE_KEY, initialAppState);

    return (
        <AppContext.Provider value={{ appState, setAppState }}>
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
