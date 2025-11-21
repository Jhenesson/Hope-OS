
import React from 'react';
import { FinancePage } from '../types';
import { HomeIcon, FinanceIcon, CalendarIcon, SettingsIcon, BarChartIcon } from '../../../components/icons/Icons';

const ArrowDownCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v8" />
        <path d="m8 12 4 4 4-4" />
    </svg>
);


interface FinanceNavbarProps {
    activePage: FinancePage;
    setActivePage: (page: FinancePage) => void;
}

const navItems = [
    { name: 'Dashboard', icon: HomeIcon },
    { name: 'Painel Analítico', icon: BarChartIcon },
    { name: 'Lançamentos', icon: FinanceIcon },
    { name: 'Saídas', icon: ArrowDownCircleIcon },
    { name: 'Calendário', icon: CalendarIcon },
    { name: 'Configurações', icon: SettingsIcon },
];

export const FinanceNavbar: React.FC<FinanceNavbarProps> = ({ activePage, setActivePage }) => {
    return (
        <nav className="w-full md:w-64 flex-shrink-0">
            <h2 className="text-lg font-bold text-primary-text px-4 mb-4">Financeiro</h2>
            <ul className="space-y-2">
                {navItems.map(item => (
                    <li key={item.name}>
                        <button
                            onClick={() => setActivePage(item.name as FinancePage)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left transition-colors ${
                                activePage === item.name
                                ? 'bg-apple-blue/10 text-apple-blue font-semibold'
                                : 'text-secondary-text hover:bg-gray-100'
                            }`}
                        >
                            <item.icon className={`w-5 h-5`} />
                            <span>{item.name}</span>
                        </button>
                    </li>
                ))}
            </ul>
        </nav>
    );
};
