
import { Lead, LeadStatus, Client, FinancialTransaction, Product, ProductCategory, CalendarEvent, Copywriting, CopyCategory } from './types';

export const MOCK_LEADS: Lead[] = [
  { id: 'lead-1', name: 'Alice Johnson', company: 'Creative Solutions', gender: 'female', status: LeadStatus.Novo, lastContact: '2 dias atrás' },
  { id: 'lead-2', name: 'Bob Williams', company: 'Tech Innovators', gender: 'male', status: LeadStatus.Novo, lastContact: '5 horas atrás' },
  { id: 'lead-3', name: 'Charlie Brown', company: 'Design Co.', gender: 'male', status: LeadStatus.EmConversa, lastContact: 'Ontem' },
  { id: 'lead-4', name: 'Diana Miller', company: 'Marketing Gurus', gender: 'female', status: LeadStatus.Fechamento, lastContact: 'Hoje' },
  { id: 'lead-5', name: 'Ethan Davis', company: 'Future Forward', gender: 'male', status: LeadStatus.Convertido, lastContact: '1 semana atrás' },
  { id: 'lead-6', name: 'Fiona Garcia', company: 'Global Brands', gender: 'female', status: LeadStatus.Perdido, lastContact: '2 semanas atrás' },
  { id: 'lead-7', name: 'George Rodriguez', company: 'Soundwave Studios', gender: 'male', status: LeadStatus.EmConversa, lastContact: '3 dias atrás' },
];

export const MOCK_CLIENTS: Client[] = [
    { id: 'client-1', name: 'Olivia Martinez', email: 'olivia.m@soundwave.com', company: 'Soundwave Studios', gender: 'female', status: 'Active', lastProjectDate: '2024-07-15' },
    { id: 'client-2', name: 'Liam Hernandez', email: 'liam.h@visionary.io', company: 'Visionary Films', gender: 'male', status: 'Active', lastProjectDate: '2024-06-20' },
    { id: 'client-3', name: 'Sophia Lopez', email: 'sophia.l@harmony.co', company: 'Harmony Records', gender: 'female', status: 'Inactive', lastProjectDate: '2023-11-05' },
    { id: 'client-4', name: 'Noah Gonzalez', email: 'noah.g@adpulse.com', company: 'AdPulse Media', gender: 'male', status: 'Active', lastProjectDate: '2024-07-28' },
    { id: 'client-5', name: 'Isabella Wilson', email: 'isabella.w@brandboost.net', company: 'BrandBoost', gender: 'female', status: 'Lead', lastProjectDate: 'N/A' },
];

export const MOCK_FINANCIAL_DATA: FinancialTransaction[] = [
    { id: 'fin-1', description: 'Projeto Visionary Films', amount: 15000, type: 'income', date: '2024-07-20', category: 'Gravação' },
    { id: 'fin-2', description: 'Assinatura Adobe CC', amount: 350, type: 'expense', date: '2024-07-05', category: 'Software' },
    { id: 'fin-3', description: 'Aluguel do Estúdio', amount: 4500, type: 'expense', date: '2024-07-01', category: 'Estrutura' },
    { id: 'fin-4', description: 'Campanha AdPulse', amount: 8500, type: 'income', date: '2024-07-28', category: 'Marketing' },
    { id: 'fin-5', description: 'Equipamento de Áudio', amount: 2200, type: 'expense', date: '2024-07-12', category: 'Equipamento' },
    { id: 'fin-6', description: 'Jingle para BrandBoost', amount: 4000, type: 'income', date: '2024-06-15', category: 'Produção' },
    { id: 'fin-7', description: 'Manutenção de Equipamento', amount: 500, type: 'expense', date: '2024-06-18', category: 'Manutenção' },
];

export const MOCK_PRODUCTS: Product[] = [
    { id: 'prod-1', name: 'Vídeo Acústico (2 Músicas)', price: 'R$ 500', description: 'Gravação de vídeo em formato acústico para duas músicas.', category: ProductCategory.Vídeo },
    { id: 'prod-2', name: 'Vídeo com Banda', price: 'R$ 1.500 / música', description: 'Produção de vídeo clipe com banda completa.', category: ProductCategory.Vídeo },
    { id: 'prod-3', name: 'Hope Session Colaborativa', price: 'R$ 1.500 / música', description: 'Sessão de gravação em vídeo com outros artistas.', category: ProductCategory.Vídeo },
    { id: 'prod-4', name: 'Pocket Show', price: '~ R$ 5.000', description: 'Gravação de um show completo em formato intimista.', category: ProductCategory.Vídeo },
    { id: 'prod-5', name: 'DrumDay', price: 'R$ 250 / música', description: 'Gravação profissional de bateria para suas músicas.', category: ProductCategory.GravaçãoDeÁudio },
    { id: 'prod-6', name: 'Produção Musical (Single)', price: 'R$ 500', description: 'Produção completa de um single, do arranjo à finalização.', category: ProductCategory.ProduçãoMusical },
    { id: 'prod-7', name: 'Gravação de Voz/Instrumento', price: 'R$ 150 a R$ 250 / hora', description: 'Hora de estúdio para gravação com técnico.', category: ProductCategory.GravaçãoDeÁudio },
    { id: 'prod-8', name: 'Gravação de Áudio Multipista', price: 'R$ 350 a R$ 500', description: 'Sessões de gravação com múltiplos instrumentos.', category: ProductCategory.GravaçãoDeÁudio },
    { id: 'prod-9', name: 'Mixagem', price: 'R$ 150', description: 'Mixagem profissional de uma faixa.', category: ProductCategory.PósProduçãoDeÁudio },
    { id: 'prod-10', name: 'Masterização', price: 'R$ 100', description: 'Masterização para plataformas digitais.', category: ProductCategory.PósProduçãoDeÁudio },
    { id: 'prod-11', name: 'Edição de Áudio', price: 'R$ 80 a R$ 150', description: 'Afinação, quantização e limpeza de áudios.', category: ProductCategory.PósProduçãoDeÁudio },
];

const today = new Date();
const year = today.getFullYear();
const month = (today.getMonth() + 1).toString().padStart(2, '0');

export const MOCK_CALENDAR_EVENTS: CalendarEvent[] = [
  { id: 'cal-1', title: 'Gravação - Visionary Films', date: `${year}-${month}-10`, description: 'Gravação do clipe da banda "The Vistas"', color: 'blue', source: 'HopeOS' },
  { id: 'cal-2', title: 'Reunião de Pré-produção', date: `${year}-${month}-15`, description: 'Alinhamento com a equipe da AdPulse Media', color: 'yellow', source: 'Google' },
  { id: 'cal-3', title: 'Entrega - Projeto Soundwave', date: `${year}-${month}-22`, description: 'Entrega final da mixagem e masterização.', color: 'green', source: 'HopeOS' },
  { id: 'cal-4', title: 'Call com Novo Lead', date: `${year}-${month}-22`, description: 'Primeira conversa com a "Global Brands"', color: 'yellow', source: 'Google' },
  { id: 'cal-5', title: 'Pagamento Aluguel', date: `${year}-${month}-05`, description: 'Vencimento do aluguel do estúdio.', color: 'red', source: 'HopeOS' },
];

export const MOCK_COPYWRITING: Copywriting[] = [
    { id: 'copy-1', title: 'Lançamento de Single (Feed)', content: '🚀 NOVO SOM NA ÁREA! 🚀 "Caminhos Cruzados" já está disponível em todas as plataformas digitais. Uma jornada sonora que vai te levar pra outro lugar. Ouça agora! Link na bio. #NovoSingle #MusicaNova #HopeRise', category: CopyCategory.Instagram, createdAt: '2024-07-29' },
    { id: 'copy-2', title: 'Mensagem de Orçamento', content: 'Olá! Agradecemos o seu contato. Para te passar um orçamento preciso para o seu projeto de gravação, poderia me contar um pouco mais sobre o que você tem em mente? Quantas músicas são, qual o estilo, etc. Fico no aguardo! Atenciosamente, Equipe Hope Rise.', category: CopyCategory.WhatsApp, createdAt: '2024-07-28' },
    { id: 'copy-3', title: 'E-mail de Follow-up', content: 'Olá [Nome do Cliente], tudo bem?\n\nSó passando para saber se você teve a oportunidade de dar uma olhada na proposta que te enviei.\n\nQualquer dúvida, estou à disposição!\n\nAbraço,\nEquipe Hope Rise', category: CopyCategory.Email, createdAt: '2024-07-27' },
    { id: 'copy-4', title: 'Texto "Sobre Nós"', content: 'A Hope Rise é mais do que um estúdio: é um hub criativo onde a sua música ganha vida. Combinamos tecnologia de ponta com uma paixão genuína por som para entregar resultados que emocionam e conectam. Venha fazer parte da nossa história.', category: CopyCategory.Website, createdAt: '2024-07-26' },
    { id: 'copy-5', title: 'Lançamento de Clipe (Stories)', content: '🔥 SAIU! 🔥 Nosso novo clipe para "Caminhos Cruzados" já está no YouTube. Corre pra ver, foi feito com muito carinho! ARRASTA PRA CIMA!', category: CopyCategory.Instagram, createdAt: '2024-07-25' },
    { id: 'copy-6', title: 'Mensagem de Boas-Vindas', content: 'Seja bem-vindo(a) à Hope Rise! Estamos muito felizes em ter você por aqui. Explore nossos serviços e não hesite em nos chamar se precisar de algo. 🎶', category: CopyCategory.WhatsApp, createdAt: '2024-07-24' },
];