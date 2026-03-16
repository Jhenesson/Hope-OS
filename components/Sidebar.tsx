
import React from 'react';
import { HomeIcon, ClientsIcon, RecordingsIcon, ProjectsIcon, FinanceIcon, SettingsIcon, EventsIcon, MegaphoneIcon, MusicIcon } from './icons/Icons';
import { Page } from '../types';

interface SidebarProps {
  activePage: Page;
  setActivePage: (page: Page) => void;
}

const navItems = [
  { name: 'Início', icon: HomeIcon },
  { name: 'Clientes', icon: ClientsIcon },
  { name: 'Marketing', icon: MegaphoneIcon },
  { name: 'Gravações', icon: RecordingsIcon },
  { name: 'Projetos', icon: ProjectsIcon },
  { name: 'Eventos', icon: EventsIcon },
  { name: 'Músicos', icon: MusicIcon },
  { name: 'Financeiro', icon: FinanceIcon },
  { name: 'Configurações', icon: SettingsIcon },
];


export const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage }) => {
  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center justify-center gap-2 bg-white/40 backdrop-blur-xl rounded-2xl p-2 shadow-lg border border-white/30 z-50">
      <ul className="flex items-center gap-1">
        {navItems.map((item) => (
          <li key={item.name}>
            <button
              onClick={() => setActivePage(item.name as Page)}
              className={`relative flex flex-col items-center justify-center h-16 w-20 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-110 hover:bg-white/60 focus:outline-none ${
                activePage === item.name
                  ? 'bg-white shadow-sm'
                  : ''
              }`}
              aria-label={item.name}
            >
              <item.icon className={`h-6 w-6 transition-colors ${activePage === item.name ? 'text-apple-blue' : 'text-primary-text'}`} />
              <span className={`mt-1 text-xs font-medium text-center transition-colors ${activePage === item.name ? 'text-apple-blue' : 'text-primary-text'}`}>
                {item.name}
              </span>
              {activePage === item.name && (
                <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-apple-blue rounded-full"></span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};