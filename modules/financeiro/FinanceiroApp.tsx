
import React, { useState } from 'react';
import { FinanceDataProvider } from './context/FinanceDataContext';
import { FinanceNavbar } from './components/FinanceNavbar';
import { FinancePage } from './types';
import { DashboardPage } from './components/DashboardPage';
import { LancamentosPage } from './components/LancamentosPage';
import { SaidasPage } from './components/SaidasPage';
import { CalendarioPage } from './components/CalendarioPage';
import { PainelAnaliticoPage } from './components/PainelAnaliticoPage';
import { ConfiguracoesPage } from './components/ConfiguracoesPage';


const renderPage = (page: FinancePage) => {
    switch(page) {
        case 'Dashboard':
            return <DashboardPage />;
        case 'Painel Analítico':
            return <PainelAnaliticoPage />;
        case 'Lançamentos':
            return <LancamentosPage />;
        case 'Saídas':
            return <SaidasPage />;
        case 'Calendário':
            return <CalendarioPage />;
        case 'Configurações':
             return <ConfiguracoesPage />;
        default:
            return <DashboardPage />;
    }
}

export const FinanceiroApp: React.FC = () => {
    const [activePage, setActivePage] = useState<FinancePage>('Dashboard');
    
    return (
        <FinanceDataProvider>
            <div className="flex flex-col md:flex-row h-full gap-6 bg-white rounded-2xl border border-border-color shadow-sm p-4">
                <FinanceNavbar activePage={activePage} setActivePage={setActivePage} />
                <main className="flex-1 h-full overflow-y-auto">
                    {renderPage(activePage)}
                </main>
            </div>
        </FinanceDataProvider>
    );
}
