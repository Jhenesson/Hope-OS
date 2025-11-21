

import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useAppContext } from '../../../context/AppContext';
import { Client, LancamentoFinanceiro, Product, Recording, SaidaFinanceira, StatusPagamento, RecordingStatus, EventInterestStatus, ExpensePreset } from '../../../types';

interface FinanceDataContextType {
    lancamentos: (LancamentoFinanceiro & { product?: Product, client?: Client, recording?: Recording })[];
    saidas: SaidaFinanceira[];
    expensePresets: ExpensePreset[];
    addLancamento: (lancamento: Omit<LancamentoFinanceiro, 'id' | 'createdAt' | 'updatedAt'>) => void;
    updateLancamento: (lancamento: LancamentoFinanceiro) => void;
    deleteLancamento: (id: string) => void;
    addSaida: (saida: Omit<SaidaFinanceira, 'id' | 'createdAt' | 'updatedAt'>) => void;
    updateSaida: (saida: SaidaFinanceira) => void;
    deleteSaida: (id: string) => void;
    addExpensePreset: (preset: Omit<ExpensePreset, 'id'>) => void;
    deleteExpensePreset: (id: string) => void;
    clients: Client[];
    products: Product[];
}

const FinanceDataContext = createContext<FinanceDataContextType | undefined>(undefined);

export const FinanceDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { appState, setAppState } = useAppContext();
    const { recordings, products, clients, lancamentos, saidas, expensePresets } = appState;

    // --- SYNC LOGIC: Create financial entries from recordings if they don't exist ---
    useEffect(() => {
        setAppState(prev => {
            const existingGravacaoIds = new Set(prev.lancamentos.map(l => l.gravacaoId));
            const newLancamentos: LancamentoFinanceiro[] = [];
            let hasChanges = false;

            // Only sync recordings that are NOT canceled
            prev.recordings.filter(r => r.status !== RecordingStatus.Cancelada).forEach(rec => {
                if (!existingGravacaoIds.has(rec.id)) {
                    hasChanges = true;
                    const now = new Date().toISOString();
                    const newLancamento: LancamentoFinanceiro = {
                        id: `lanc-${Date.now()}-${rec.id}`,
                        gravacaoId: rec.id,
                        produtoId: rec.productId,
                        clienteId: rec.clientId,
                        valorPrevisto: rec.valorTotal,
                        valorRecebido: 0,
                        statusPagamento: StatusPagamento.AReceber,
                        dataPrevista: rec.data,
                        createdAt: now,
                        updatedAt: now,
                    };
                    newLancamentos.push(newLancamento);
                }
            });

            if (hasChanges) {
                return { ...prev, lancamentos: [...prev.lancamentos, ...newLancamentos] };
            }
            return prev;
        });
    }, [recordings, setAppState]); 
    
    const clientsById = useMemo(() => clients.reduce((acc, c) => ({...acc, [c.id]: c}), {} as Record<string, Client>), [clients]);
    const productsById = useMemo(() => products.reduce((acc, p) => ({...acc, [p.id]: p}), {} as Record<string, Product>), [products]);
    const recordingsById = useMemo(() => recordings.reduce((acc, r) => ({...acc, [r.id]: r}), {} as Record<string, Recording>), [recordings]);

    const lancamentosWithData = useMemo(() => {
        return lancamentos.map(lanc => ({
            ...lanc,
            client: clientsById[lanc.clienteId],
            product: productsById[lanc.produtoId],
            recording: recordingsById[lanc.gravacaoId]
        })).sort((a,b) => new Date(b.dataPrevista).getTime() - new Date(a.dataPrevista).getTime())
    }, [lancamentos, clientsById, productsById, recordingsById]);
    
    // --- CRUD Functions for Finance Data ---

    const addLancamento = (lancamento: Omit<LancamentoFinanceiro, 'id' | 'createdAt' | 'updatedAt'>) => {
        const now = new Date().toISOString();
        const newLancamento: LancamentoFinanceiro = {
            id: `lanc-${Date.now()}`,
            ...lancamento,
            createdAt: now,
            updatedAt: now,
        };

        setAppState(prev => {
            let updatedInterests = prev.eventInterests;

            // AUTOMATION: If it's an event payment and >= 25% paid, confirm the interest
            if (newLancamento.eventId && newLancamento.clienteId) {
                const percentagePaid = newLancamento.valorRecebido / newLancamento.valorPrevisto;
                if (percentagePaid >= 0.25) {
                     updatedInterests = prev.eventInterests.map(interest => {
                        if (interest.eventId === newLancamento.eventId && interest.clientId === newLancamento.clienteId) {
                            return { ...interest, status: EventInterestStatus.Confirmado };
                        }
                        return interest;
                    });
                }
            }

            return {
                ...prev,
                lancamentos: [newLancamento, ...prev.lancamentos],
                eventInterests: updatedInterests
            };
        });
    };

    const updateLancamento = (lancamentoToUpdate: LancamentoFinanceiro) => {
        setAppState(prev => {
             let updatedInterests = prev.eventInterests;

            // AUTOMATION: Check for status update on edit as well
            if (lancamentoToUpdate.eventId && lancamentoToUpdate.clienteId) {
                const percentagePaid = lancamentoToUpdate.valorRecebido / lancamentoToUpdate.valorPrevisto;
                if (percentagePaid >= 0.25) {
                     updatedInterests = prev.eventInterests.map(interest => {
                        if (interest.eventId === lancamentoToUpdate.eventId && interest.clientId === lancamentoToUpdate.clienteId && interest.status !== EventInterestStatus.Confirmado) {
                            return { ...interest, status: EventInterestStatus.Confirmado };
                        }
                        return interest;
                    });
                }
            }

            return {
                ...prev,
                lancamentos: prev.lancamentos.map(l => l.id === lancamentoToUpdate.id ? { ...lancamentoToUpdate, updatedAt: new Date().toISOString() } : l),
                eventInterests: updatedInterests
            };
        });
    };

    const deleteLancamento = (id: string) => {
        setAppState(prev => {
            const lancamento = prev.lancamentos.find(l => l.id === id);
            const newLancamentos = prev.lancamentos.filter(l => l.id !== id);
            
            let newRecordings = prev.recordings;
            if (lancamento && lancamento.gravacaoId && !lancamento.gravacaoId.startsWith('manual-')) {
                newRecordings = prev.recordings.map(r => 
                    r.id === lancamento.gravacaoId ? { ...r, status: RecordingStatus.Cancelada } : r
                );
            }
            
            return {
                ...prev,
                lancamentos: newLancamentos,
                recordings: newRecordings
            };
        });
    };

    const addSaida = (saida: Omit<SaidaFinanceira, 'id' | 'createdAt' | 'updatedAt'>) => {
        const now = new Date().toISOString();
        const newSaida: SaidaFinanceira = {
            id: `saida-${Date.now()}`,
            ...saida,
            createdAt: now,
            updatedAt: now,
        };
        setAppState(prev => ({ ...prev, saidas: [newSaida, ...prev.saidas] }));
    };

    const updateSaida = (saidaToUpdate: SaidaFinanceira) => {
        setAppState(prev => ({
            ...prev,
            saidas: prev.saidas.map(s => s.id === saidaToUpdate.id ? { ...saidaToUpdate, updatedAt: new Date().toISOString() } : s)
        }));
    };

    const deleteSaida = (id: string) => {
        setAppState(prev => ({
            ...prev,
            saidas: prev.saidas.filter(s => s.id !== id)
        }));
    };

    const addExpensePreset = (preset: Omit<ExpensePreset, 'id'>) => {
        const newPreset: ExpensePreset = {
            id: `preset-${Date.now()}`,
            ...preset
        };
        setAppState(prev => ({ ...prev, expensePresets: [...(prev.expensePresets || []), newPreset] }));
    }

    const deleteExpensePreset = (id: string) => {
        setAppState(prev => ({
            ...prev,
            expensePresets: prev.expensePresets.filter(p => p.id !== id)
        }));
    }

    const value = {
        lancamentos: lancamentosWithData,
        saidas,
        expensePresets: expensePresets || [],
        addLancamento,
        updateLancamento,
        deleteLancamento,
        addSaida,
        updateSaida,
        deleteSaida,
        addExpensePreset,
        deleteExpensePreset,
        clients,
        products,
    };

    return (
        <FinanceDataContext.Provider value={value}>
            {children}
        </FinanceDataContext.Provider>
    );
};

export const useFinanceData = () => {
    const context = useContext(FinanceDataContext);
    if (context === undefined) {
        throw new Error('useFinanceData must be used within a FinanceDataProvider');
    }
    return context;
};
