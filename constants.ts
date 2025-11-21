
import { Lead, LeadStatus, Client, FinancialTransaction, Product, ProductCategory, CalendarEvent, Copywriting, CopyCategory, Event, EventInterest, EventInterestStatus, Recording, RecordingStatus, PaymentStatus, LancamentoFinanceiro, StatusPagamento, SaidaFinanceira, Campaign, CampaignStatus, CampaignObjective, ExpensePreset } from './types';

const todayStr = new Date().toISOString().split('T')[0];
const now = new Date().toISOString();
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const nextWeek = new Date();
nextWeek.setDate(nextWeek.getDate() + 7);
const year = new Date().getFullYear();
const month = (new Date().getMonth() + 1).toString().padStart(2, '0');

export const MOCK_LEADS: Lead[] = [
  { id: 'lead-1', name: 'Alice Johnson', company: 'Creative Solutions', gender: 'female', status: LeadStatus.Novo, lastContact: '2 dias atrás', email: 'alice.j@creative.com', whatsapp: '+55 11 91111-1111', notes: 'Interessada em vídeo com banda. Ligar para confirmar orçamento.', nextFollowUp: todayStr },
  { id: 'lead-2', name: 'Bob Williams', company: 'Tech Innovators', gender: 'male', status: LeadStatus.Novo, lastContact: '5 horas atrás', notes: 'Pediu portfolio por email.' },
  { id: 'lead-3', name: 'Charlie Brown', company: 'Design Co.', gender: 'male', status: LeadStatus.EmConversa, lastContact: 'Ontem', whatsapp: '+55 11 93333-3333', nextFollowUp: '2024-12-25' },
  { id: 'lead-4', name: 'Diana Miller', company: 'Marketing Gurus', gender: 'female', status: LeadStatus.Fechamento, lastContact: 'Hoje', nextFollowUp: todayStr, notes: 'Enviar contrato final.' },
  { id: 'lead-5', name: 'Ethan Davis', company: 'Future Forward', gender: 'male', status: LeadStatus.Convertido, lastContact: '1 semana atrás' },
  { id: 'lead-6', name: 'Fiona Garcia', company: 'Global Brands', gender: 'female', status: LeadStatus.Perdido, lastContact: '2 semanas atrás' },
  { id: 'lead-7', name: 'George Rodriguez', company: 'Soundwave Studios', gender: 'male', status: LeadStatus.EmConversa, lastContact: '3 dias atrás', email: 'george@soundwave.com' },
];

export const MOCK_CLIENTS: Client[] = [
    { id: 'client-1', name: 'Olivia Martinez', email: 'olivia.m@soundwave.com', whatsapp: '+55 11 98765-4321', gender: 'female', status: 'Active', lastProjectDate: '2024-07-15' },
    { id: 'client-2', name: 'Liam Hernandez', email: 'liam.h@visionary.io', whatsapp: '+55 21 91234-5678', gender: 'male', status: 'Active', lastProjectDate: '2024-06-20' },
    { id: 'client-3', name: 'Sophia Lopez', email: 'sophia.l@harmony.co', whatsapp: '+55 31 99999-8888', gender: 'female', status: 'Inactive', lastProjectDate: '2023-11-05' },
    { id: 'client-4', name: 'Noah Gonzalez', email: 'noah.g@adpulse.com', whatsapp: '+55 41 98888-7777', gender: 'male', status: 'Active', lastProjectDate: '2024-07-28' },
    { id: 'client-5', name: 'Isabella Wilson', email: 'isabella.w@brandboost.net', whatsapp: '+55 51 97777-6666', gender: 'female', status: 'Lead', lastProjectDate: 'N/A' },
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
    { id: 'prod-1', name: 'Vídeo Acústico', price: 'R$ 350 (ou R$ 250/un acima de 2)', description: 'Gravação de vídeo em formato acústico. R$ 350 unidade ou R$ 250 cada (min 2).', category: ProductCategory.VideoAcustico, horasEstimadas: 4, createdAt: now, updatedAt: now },
    { id: 'prod-2', name: 'Vídeo com Banda', price: 'R$ 1.500 / música', description: 'Produção de vídeo clipe com banda completa.', category: ProductCategory.VideoBanda, horasEstimadas: 8, createdAt: now, updatedAt: now },
    { id: 'prod-3', name: 'Hope Session Colaborativa', price: 'R$ 1.500 / música', description: 'Sessão de gravação em vídeo com outros artistas.', category: ProductCategory.HopeSession, horasEstimadas: 6, createdAt: now, updatedAt: now },
    { id: 'prod-4', name: 'Pocket Show', price: '~ R$ 5.000', description: 'Gravação de um show completo em formato intimista.', category: ProductCategory.PocketShow, horasEstimadas: 12, createdAt: now, updatedAt: now },
    { id: 'prod-5', name: 'DrumDay', price: 'R$ 250 / música', description: 'Gravação profissional de bateria para suas músicas.', category: ProductCategory.DrumDay, horasEstimadas: 2, createdAt: now, updatedAt: now },
    { id: 'prod-6', name: 'Produção Musical (Single)', price: 'R$ 500', description: 'Produção completa de um single, do arranjo à finalização.', category: ProductCategory.ProducaoMusical, horasEstimadas: 10, createdAt: now, updatedAt: now },
    { id: 'prod-7', name: 'Gravação de Voz/Instrumento', price: 'R$ 150 a R$ 250 / hora', description: 'Hora de estúdio para gravação com técnico.', category: ProductCategory.Gravacao, horasEstimadas: 1, createdAt: now, updatedAt: now },
    { id: 'prod-8', name: 'Gravação de Áudio Multipista', price: 'R$ 350 a R$ 500', description: 'Sessões de gravação com múltiplos instrumentos.', category: ProductCategory.Gravacao, horasEstimadas: 3, createdAt: now, updatedAt: now },
    { id: 'prod-9', name: 'Mixagem', price: 'R$ 150', description: 'Mixagem profissional de uma faixa.', category: ProductCategory.PosProducaoAudio, horasEstimadas: 2, createdAt: now, updatedAt: now },
    { id: 'prod-10', name: 'Masterização', price: 'R$ 100', description: 'Masterização para plataformas digitais.', category: ProductCategory.PosProducaoAudio, horasEstimadas: 1, createdAt: now, updatedAt: now },
    { id: 'prod-11', name: 'Edição de Áudio', price: 'R$ 80 a R$ 150', description: 'Afinação, quantização e limpeza de áudios.', category: ProductCategory.PosProducaoAudio, horasEstimadas: 1.5, createdAt: now, updatedAt: now },
];

export const MOCK_RECORDINGS: Recording[] = [
    { id: 'rec-1', clientId: 'client-1', productId: 'prod-1', data: '2024-08-22', horaInicio: '14:00', horaFim: '18:00', horasEstimadas: 4, valorUnitario: 500, quantidade: 1, valorTotal: 500, statusPagamentoInicial: PaymentStatus.Entrada50, notes: 'Gravação para o single "Amanhecer". Levar violão de nylon.', status: RecordingStatus.Agendada, createdAt: '2024-07-20', updatedAt: '2024-07-20' },
    { id: 'rec-2', clientId: 'client-2', productId: 'prod-5', data: '2024-08-25', horaInicio: '10:00', horaFim: '18:00', horasEstimadas: 8, valorUnitario: 250, quantidade: 3, valorTotal: 750, statusPagamentoInicial: PaymentStatus.PagoIntegral, notes: 'Sessão de DrumDay para 3 faixas do EP. Estimativa de 2h por faixa, mais setup.', status: RecordingStatus.Agendada, createdAt: '2024-07-18', updatedAt: '2024-07-18' },
    { id: 'rec-3', clientId: 'client-4', productId: 'prod-2', data: '2024-07-25', horaInicio: '09:00', horaFim: '17:00', horasEstimadas: 8, valorUnitario: 1500, quantidade: 1, valorTotal: 1500, statusPagamentoInicial: PaymentStatus.PagoIntegral, notes: 'Clipe da música "Noite em neon". Finalizado com sucesso.', status: RecordingStatus.Concluída, createdAt: '2024-06-15', updatedAt: '2024-07-25' },
    { id: 'rec-4', clientId: 'client-3', productId: 'prod-7', data: '2024-08-15', horaInicio: '11:00', horaFim: '12:00', horasEstimadas: 1, valorUnitario: 150, quantidade: 1, valorTotal: 150, statusPagamentoInicial: PaymentStatus.Pendente, notes: 'Cliente cancelou por motivos de saúde.', status: RecordingStatus.Cancelada, createdAt: '2024-07-01', updatedAt: '2024-07-01' },
    { id: 'rec-5', clientId: 'client-5', productId: 'prod-6', data: '2024-08-28', horaInicio: '13:00', horaFim: '18:00', horasEstimadas: 5, valorUnitario: 500, quantidade: 1, valorTotal: 500, statusPagamentoInicial: PaymentStatus.Pendente, notes: 'Pré-produção e arranjos. Pode levar menos que o padrão.', status: RecordingStatus.Agendada, createdAt: '2024-07-22', updatedAt: '2024-07-22' },
    { id: 'rec-6', clientId: 'client-1', productId: 'prod-9', data: nextWeek.toISOString().split('T')[0], horaInicio: '15:00', horaFim: '17:00', horasEstimadas: 2, valorUnitario: 150, quantidade: 1, valorTotal: 150, statusPagamentoInicial: PaymentStatus.Entrada50, notes: 'Mixagem da faixa "Amanhecer".', status: RecordingStatus.Agendada, createdAt: '2024-07-25', updatedAt: '2024-07-25' },
    { id: 'rec-7', clientId: 'client-2', productId: 'prod-10', data: tomorrow.toISOString().split('T')[0], horaInicio: '10:00', horaFim: '13:00', horasEstimadas: 3, valorUnitario: 100, quantidade: 3, valorTotal: 300, statusPagamentoInicial: PaymentStatus.Pendente, notes: 'Masterização do EP (3 faixas).', status: RecordingStatus.Agendada, createdAt: '2024-07-28', updatedAt: '2024-07-28' },
];

export const MOCK_CALENDAR_EVENTS: CalendarEvent[] = [
  { id: 'cal-1', title: 'Gravação - Visionary Films', date: `${year}-${month}-10`, description: 'Gravação do clipe da banda "The Vistas"', color: 'blue', source: 'HopeOS' },
  { id: 'cal-2', title: 'Reunião de Pré-produção', date: `${year}-${month}-15`, description: 'Alinhamento com a equipe da AdPulse Media', color: 'yellow', source: 'Google' },
  { id: 'cal-3', title: 'Entrega - Projeto Soundwave', date: `${year}-${month}-22`, description: 'Entrega final da mixagem e masterização.', color: 'green', source: 'HopeOS' },
  { id: 'cal-4', title: 'Call com Novo Lead', date: `${year}-${month}-22`, description: 'Primeira conversa com a "Global Brands"', color: 'yellow', source: 'Google' },
  { id: 'cal-5', title: 'Pagamento Aluguel', date: `${year}-${month}-05`, description: 'Vencimento do aluguel do estúdio.', color: 'red', source: 'HopeOS' }
];

export const MOCK_COPYWRITING: Copywriting[] = [
    { id: 'copy-1', title: 'Legenda Campanha Inverno', content: 'O frio chegou, mas o som não para! ❄️🎸\n\nVenha gravar sua Hope Session com condições especiais neste inverno.', category: CopyCategory.Instagram, createdAt: now, updatedAt: now },
    { id: 'copy-2', title: 'Mensagem WhatsApp Lead', content: 'Olá! Tudo bem? Vi seu interesse em nossos serviços de produção. Gostaria de agendar uma visita?', category: CopyCategory.WhatsApp, createdAt: now, updatedAt: now },
];

export const MOCK_EVENTS: Event[] = [
    { id: 'evt-1', name: 'Workshop de Mixagem', description: 'Técnicas avançadas de mixagem in-the-box.', date: `${year}-${month}-20` },
];

export const MOCK_EVENT_INTERESTS: EventInterest[] = [
    { id: 'int-1', clientId: 'client-1', eventId: 'evt-1', status: EventInterestStatus.Confirmado, notes: 'Pago via Pix' },
];

export const MOCK_LANCAMENTOS: LancamentoFinanceiro[] = [
    { 
        id: 'lanc-1', 
        gravacaoId: 'rec-3', 
        produtoId: 'prod-2', 
        clienteId: 'client-4', 
        valorPrevisto: 1500, 
        valorRecebido: 1500, 
        statusPagamento: StatusPagamento.Pago, 
        dataPrevista: '2024-07-25',
        createdAt: now,
        updatedAt: now
    },
];

export const MOCK_SAIDAS: SaidaFinanceira[] = [
    { id: 'saida-1', descricao: 'Energia Elétrica', valor: 450, data: `${year}-${month}-10`, categoria: 'Contas Fixas', createdAt: now, updatedAt: now },
];

export const MOCK_EXPENSE_PRESETS: ExpensePreset[] = [
    { id: 'preset-1', name: 'Bruno', description: 'Bruno', category: 'Assistente Técnico Audio Visual', amount: 50 }
];

export const MOCK_CAMPAIGNS: Campaign[] = [
    { 
        id: 'camp-1', 
        name: 'DrumDay 2024', 
        objective: CampaignObjective.Vendas, 
        status: CampaignStatus.Ativa, 
        startDate: `${year}-${month}-01`,
        endDate: `${year}-${month}-30`,
        budget: 1000,
        spent: 450,
        results: { leads: 12, sales: 2 },
        createdAt: now,
        updatedAt: now
    }
];
