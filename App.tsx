import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { LeadsPage } from './pages/LeadsPage';
import { ClientsPage } from './pages/ClientsPage';
import { FinancialPage } from './pages/FinancialPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { ProductsPage } from './pages/ProductsPage';
import { CalendarPage } from './pages/CalendarPage';
import { DashboardPage } from './pages/DashboardPage';
import { TextosCopysPage } from './pages/TextosCopysPage';

type Page = 'Início' | 'Produtos' | 'Clientes' | 'Leads' | 'Projetos' | 'Campanhas' | 'Textos & Copys' | 'Financeiro' | 'Tarefas & Calendário' | 'Configurações';

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<Page>('Início');

  const renderPage = () => {
    switch (activePage) {
      case 'Início':
        return <DashboardPage />;
      case 'Produtos':
        return <ProductsPage />;
      case 'Leads':
        return <LeadsPage />;
      case 'Clientes':
        return <ClientsPage />;
      case 'Financeiro':
        return <FinancialPage />;
      case 'Tarefas & Calendário':
        return <CalendarPage />;
      case 'Textos & Copys':
        return <TextosCopysPage />;
      case 'Projetos':
      case 'Campanhas':
      case 'Configurações':
        return <PlaceholderPage title={activePage} />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="bg-app-bg text-primary-text min-h-screen">
      <main className="p-4 sm:p-6 md:p-8 pb-28">
        {renderPage()}
      </main>
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
    </div>
  );
};

export default App;