
import React, { useState } from 'react';
import { LeadsPage } from './LeadsPage';
import { CampaignsPage } from './CampaignsPage';
import { TextosCopysPage } from './TextosCopysPage';
import { CustomerMarketingDashboard } from './CustomerMarketingDashboard';

type MarketingTab = 'Leads' | 'Inteligência' | 'Campanhas' | 'Textos & Copys';

export const MarketingPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<MarketingTab>('Leads');

    return (
        <div className="h-full flex flex-col">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                 <h2 className="text-3xl font-bold text-primary-text">Marketing Hub</h2>
                 
                 {/* Navigation Tabs */}
                 <div className="flex bg-gray-100 p-1 rounded-full w-full md:w-auto overflow-x-auto custom-scrollbar">
                    {(['Leads', 'Inteligência', 'Campanhas', 'Textos & Copys'] as MarketingTab[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 md:flex-none px-6 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                                activeTab === tab
                                    ? 'bg-white text-primary-text shadow-sm'
                                    : 'text-secondary-text hover:text-primary-text'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 h-full overflow-hidden">
                <div className="h-full animate-fadeIn">
                    {activeTab === 'Leads' && <LeadsPage />}
                    {activeTab === 'Inteligência' && <CustomerMarketingDashboard />}
                    {activeTab === 'Campanhas' && <CampaignsPage />}
                    {activeTab === 'Textos & Copys' && <TextosCopysPage />}
                </div>
            </div>
            
             <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
            `}</style>
        </div>
    );
};
