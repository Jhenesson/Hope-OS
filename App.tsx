
import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { ClientsPage } from './pages/ClientsPage';
import { FinancialPage } from './pages/FinancialPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { DashboardPage } from './pages/DashboardPage';
import { EventsPage } from './pages/EventsPage';
import { SettingsPage } from './pages/SettingsPage';
import { RecordingsPage } from './pages/RecordingsPage';
import { MarketingPage } from './pages/MarketingPage';
import { MusiciansPage } from './pages/MusiciansPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { Page } from './types';
import { AppProvider } from './context/AppContext';

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<Page>('Início');

  const renderPage = () => {
    switch (activePage) {
      case 'Início':
        return <DashboardPage setActivePage={setActivePage} />;
      case 'Marketing':
        return <MarketingPage />;
      case 'Gravações':
        return <RecordingsPage />;
      case 'Clientes':
        return <ClientsPage />;
      case 'Financeiro':
        return <FinancialPage />;
      case 'Eventos':
        return <EventsPage />;
      case 'Músicos':
        return <MusiciansPage />;
      case 'Projetos':
        return <ProjectsPage />;
      case 'Configurações':
        return <SettingsPage />;
      default:
        return <DashboardPage setActivePage={setActivePage} />;
    }
  };

  return (
    <AppProvider>
      <div className="bg-app-bg text-primary-text min-h-screen">
        <main className="p-4 sm:p-6 md:p-8 pb-28">
          {renderPage()}
        </main>
        <Sidebar activePage={activePage} setActivePage={setActivePage} />
      </div>
    </AppProvider>
  );
};

export default App;
