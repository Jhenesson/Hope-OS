
import { LeadStatus, Client, FinancialTransaction, Product, ProductCategory, CalendarEvent, Copywriting, CopyCategory, Event, EventInterest, EventInterestStatus, Recording, RecordingStatus, PaymentStatus, LancamentoFinanceiro, StatusPagamento, SaidaFinanceira, Campaign, CampaignStatus, CampaignObjective, ExpensePreset, Musician, Project, ProductionStage, ProjectTrack, TrackStatus } from './types';

const now = new Date().toISOString();
const year = new Date().getFullYear();
const month = (new Date().getMonth() + 1).toString().padStart(2, '0');

export const MOCK_CLIENTS: Client[] = [
    { id: 'client-1', name: 'Olivia Martinez', email: 'olivia.m@soundwave.com', whatsapp: '+55 11 98765-4321', gender: 'female', status: 'Active', lastProjectDate: '2025-02-15', createdAt: '2024-05-10T10:00:00Z' },
    { id: 'client-2', name: 'Liam Hernandez', email: 'liam.h@visionary.io', whatsapp: '+55 21 91234-5678', gender: 'male', status: 'Active', lastProjectDate: '2025-01-20', createdAt: '2024-06-12T10:00:00Z' },
    { id: 'client-3', name: 'Sophia Lopez', email: 'sophia.l@harmony.co', whatsapp: '+55 31 99999-8888', gender: 'female', status: 'Active', lastProjectDate: '2024-11-05', createdAt: '2024-07-20T10:00:00Z' },
    { id: 'client-4', name: 'Noah Gonzalez', email: 'noah.g@adpulse.com', whatsapp: '+55 41 98888-7777', gender: 'male', status: 'Active', lastProjectDate: '2025-03-02', createdAt: '2024-08-05T10:00:00Z' },
    { id: 'client-5', name: 'Isabella Wilson', email: 'isabella.w@brandboost.net', whatsapp: '+55 51 97777-6666', gender: 'female', status: 'Lead', lastProjectDate: 'N/A', leadStage: LeadStatus.Novo, createdAt: now },
    { id: 'client-6', name: 'Alice Johnson', company: 'Creative Solutions', gender: 'female', status: 'Active', lastProjectDate: '2025-02-28', whatsapp: '+55 11 91111-1111', createdAt: '2024-10-15T10:00:00Z' },
];

export const MOCK_PRODUCTS: Product[] = [
    { id: 'prod-1', name: 'Vídeo Acústico', price: 'R$ 350', description: 'Gravação de vídeo em formato acústico.', category: ProductCategory.VideoAcustico, horasEstimadas: 4, createdAt: now, updatedAt: now },
    { id: 'prod-2', name: 'Vídeo com Banda', price: 'R$ 1.500', description: 'Produção de vídeo clipe com banda completa.', category: ProductCategory.VideoBanda, horasEstimadas: 8, createdAt: now, updatedAt: now },
    { id: 'prod-5', name: 'DrumDay', price: 'R$ 250', description: 'Gravação profissional de bateria.', category: ProductCategory.DrumDay, horasEstimadas: 2, createdAt: now, updatedAt: now },
    { id: 'prod-6', name: 'Produção Musical', price: 'R$ 500', description: 'Produção completa de um single.', category: ProductCategory.ProducaoMusical, horasEstimadas: 10, createdAt: now, updatedAt: now },
    { id: 'prod-9', name: 'Mixagem', price: 'R$ 150', description: 'Mixagem profissional de uma faixa.', category: ProductCategory.PosProducaoAudio, horasEstimadas: 2, createdAt: now, updatedAt: now },
];

// --- LANÇAMENTOS (RECEITAS) ---
export const MOCK_LANCAMENTOS: LancamentoFinanceiro[] = [
    // MARÇO 2025 (Mês Atual)
    { id: 'l-mar-1', gravacaoId: 'man-1', produtoId: 'prod-2', clienteId: 'client-1', valorPrevisto: 1500, valorRecebido: 750, statusPagamento: StatusPagamento.Parcial, dataPrevista: '2025-03-10', datasPagamentos: [{ id: 'p1', data: '2025-03-01', valor: 750, tipo: 'Entrada' }], createdAt: now, updatedAt: now },
    { id: 'l-mar-1-extra', gravacaoId: 'man-1-extra', produtoId: 'prod-2', clienteId: 'client-1', valorPrevisto: 1500, valorRecebido: 1500, statusPagamento: StatusPagamento.Pago, dataPrevista: '2025-03-15', datasPagamentos: [{ id: 'p1-extra', data: '2025-03-15', valor: 1500, tipo: 'Integral' }], createdAt: now, updatedAt: now },
    { id: 'l-mar-2', gravacaoId: 'man-2', produtoId: 'prod-1', clienteId: 'client-4', valorPrevisto: 350, valorRecebido: 350, statusPagamento: StatusPagamento.Pago, dataPrevista: '2025-03-02', datasPagamentos: [{ id: 'p2', data: '2025-03-02', valor: 350, tipo: 'Integral' }], createdAt: now, updatedAt: now },
    { id: 'l-mar-3', gravacaoId: 'man-3', produtoId: 'prod-5', clienteId: 'client-6', valorPrevisto: 250, valorRecebido: 0, statusPagamento: StatusPagamento.AReceber, dataPrevista: '2025-03-25', createdAt: now, updatedAt: now },
    
    // FEVEREIRO 2025
    { id: 'l-feb-1', gravacaoId: 'man-4', produtoId: 'prod-6', clienteId: 'client-2', valorPrevisto: 2000, valorRecebido: 2000, statusPagamento: StatusPagamento.Pago, dataPrevista: '2025-02-15', datasPagamentos: [{ id: 'p3', data: '2025-02-15', valor: 2000, tipo: 'Integral' }], createdAt: now, updatedAt: now },
    { id: 'l-feb-2', gravacaoId: 'man-5', produtoId: 'prod-1', clienteId: 'client-1', valorPrevisto: 700, valorRecebido: 700, statusPagamento: StatusPagamento.Pago, dataPrevista: '2025-02-10', datasPagamentos: [{ id: 'p4', data: '2025-02-08', valor: 700, tipo: 'Antecipado' }], createdAt: now, updatedAt: now },
    { id: 'l-feb-3', gravacaoId: 'man-6', produtoId: 'prod-9', clienteId: 'client-3', valorPrevisto: 450, valorRecebido: 450, statusPagamento: StatusPagamento.Pago, dataPrevista: '2025-02-28', datasPagamentos: [{ id: 'p5', data: '2025-02-28', valor: 450, tipo: 'Integral' }], createdAt: now, updatedAt: now },
    
    // JANEIRO 2025
    { id: 'l-jan-1', gravacaoId: 'man-7', produtoId: 'prod-2', clienteId: 'client-4', valorPrevisto: 1500, valorRecebido: 1500, statusPagamento: StatusPagamento.Pago, dataPrevista: '2025-01-20', datasPagamentos: [{ id: 'p6', data: '2025-01-20', valor: 1500, tipo: 'Pix' }], createdAt: now, updatedAt: now },
    { id: 'l-jan-2', gravacaoId: 'man-8', produtoId: 'prod-5', clienteId: 'client-2', valorPrevisto: 500, valorRecebido: 500, statusPagamento: StatusPagamento.Pago, dataPrevista: '2025-01-05', datasPagamentos: [{ id: 'p7', data: '2025-01-05', valor: 500, tipo: 'Dinheiro' }], createdAt: now, updatedAt: now },
    
    // DEZEMBRO 2024
    { id: 'l-dec-1', gravacaoId: 'man-9', produtoId: 'prod-6', clienteId: 'client-3', valorPrevisto: 3000, valorRecebido: 3000, statusPagamento: StatusPagamento.Pago, dataPrevista: '2024-12-12', datasPagamentos: [{ id: 'p8', data: '2024-12-10', valor: 3000, tipo: 'Boleto' }], createdAt: now, updatedAt: now },
    { id: 'l-dec-2', gravacaoId: 'man-10', produtoId: 'prod-1', clienteId: 'client-1', valorPrevisto: 350, valorRecebido: 350, statusPagamento: StatusPagamento.Pago, dataPrevista: '2024-12-20', datasPagamentos: [{ id: 'p9', data: '2024-12-20', valor: 350, tipo: 'Pix' }], createdAt: now, updatedAt: now },
    
    // NOVEMBRO 2024
    { id: 'l-nov-1', gravacaoId: 'man-11', produtoId: 'prod-2', clienteId: 'client-6', valorPrevisto: 1500, valorRecebido: 1500, statusPagamento: StatusPagamento.Pago, dataPrevista: '2024-11-05', datasPagamentos: [{ id: 'p10', data: '2024-11-05', valor: 1500, tipo: 'Integral' }], createdAt: now, updatedAt: now },
    { id: 'l-nov-2', gravacaoId: 'man-12', produtoId: 'prod-9', clienteId: 'client-2', valorPrevisto: 300, valorRecebido: 300, statusPagamento: StatusPagamento.Pago, dataPrevista: '2024-11-25', datasPagamentos: [{ id: 'p11', data: '2024-11-25', valor: 300, tipo: 'Integral' }], createdAt: now, updatedAt: now },
];

// --- SAÍDAS (DESPESAS) ---
export const MOCK_SAIDAS: SaidaFinanceira[] = [
    // MARÇO 2025
    { id: 's-mar-1', descricao: 'Aluguel Estúdio', valor: 1200, data: '2025-03-05', categoria: 'Infraestrutura', createdAt: now, updatedAt: now },
    { id: 's-mar-2', descricao: 'Energia Elétrica', valor: 340, data: '2025-03-10', categoria: 'Contas Fixas', createdAt: now, updatedAt: now },
    { id: 's-mar-3', descricao: 'Marketing Instagram', valor: 200, data: '2025-03-12', categoria: 'Marketing', createdAt: now, updatedAt: now },
    
    // FEVEREIRO 2025
    { id: 's-feb-1', descricao: 'Aluguel Estúdio', valor: 1200, data: '2025-02-05', categoria: 'Infraestrutura', createdAt: now, updatedAt: now },
    { id: 's-feb-2', descricao: 'Cachê Músico: Bruno', valor: 250, data: '2025-02-15', categoria: 'Mão de Obra', createdAt: now, updatedAt: now },
    { id: 's-feb-3', descricao: 'Manutenção Ar Condicionado', valor: 180, data: '2025-02-20', categoria: 'Manutenção', createdAt: now, updatedAt: now },
    
    // JANEIRO 2025
    { id: 's-jan-1', descricao: 'Aluguel Estúdio', valor: 1200, data: '2025-01-05', categoria: 'Infraestrutura', createdAt: now, updatedAt: now },
    { id: 's-jan-2', descricao: 'Novo Microfone SM7B', valor: 2800, data: '2025-01-15', categoria: 'Equipamentos', createdAt: now, updatedAt: now },
    
    // DEZEMBRO 2024
    { id: 's-dec-1', descricao: 'Aluguel Estúdio', valor: 1200, data: '2024-12-05', categoria: 'Infraestrutura', createdAt: now, updatedAt: now },
    { id: 's-dec-2', descricao: 'Confraternização Fim de Ano', valor: 650, data: '2024-12-20', categoria: 'Outros', createdAt: now, updatedAt: now },

    // NOVEMBRO 2024
    { id: 's-nov-1', descricao: 'Aluguel Estúdio', valor: 1200, data: '2024-11-05', categoria: 'Infraestrutura', createdAt: now, updatedAt: now },
    { id: 's-nov-2', descricao: 'Assinatura Software', valor: 90, data: '2024-11-10', categoria: 'Softwares', createdAt: now, updatedAt: now },
];

export const MOCK_PROJECTS: Project[] = [
    { id: 'proj-1', name: 'Produção Álbum: Renascer', clientId: 'client-1', stage: ProductionStage.Mixagem, progress: 45, folderLink: 'https://drive.google.com/drive/folders/123', deadline: '2025-04-20', musiciansIds: ['mus-1'], notes: 'Produção completa com 3 faixas.', isComplex: true, createdAt: now, updatedAt: now },
    { id: 'proj-2', name: 'Single "Ecos do Deserto"', clientId: 'client-2', stage: ProductionStage.Gravacao, progress: 30, deadline: '2025-03-15', musiciansIds: [], isComplex: false, createdAt: now, updatedAt: now }
];

export const MOCK_PROJECT_TRACKS: ProjectTrack[] = [
    { id: 'track-1', projectId: 'proj-1', title: 'Corrida do Ouro', statusPreProd: TrackStatus.Concluido, statusRec: TrackStatus.Concluido, statusEdit: TrackStatus.Concluido, statusMix: TrackStatus.Concluido, statusMaster: TrackStatus.Concluido, order: 1 },
    { id: 'track-2', projectId: 'proj-1', title: 'Mar de Ilusões', statusPreProd: TrackStatus.Concluido, statusRec: TrackStatus.Concluido, statusEdit: TrackStatus.AFazer, statusMix: TrackStatus.AFazer, statusMaster: TrackStatus.AFazer, notes: 'Refazer baixo', order: 2 },
];

export const MOCK_RECORDINGS: Recording[] = [
    // Corrected property name from 'hoursEstimadas' to 'horasEstimadas' to match the Recording interface
    { id: 'rec-3', clientId: 'client-4', productId: 'prod-2', data: '2025-03-25', horaInicio: '09:00', horaFim: '17:00', horasEstimadas: 8, valorUnitario: 1500, quantidade: 1, valorTotal: 1500, statusPagamentoInicial: PaymentStatus.PagoIntegral, notes: 'Clipe da música "Noite em neon".', status: RecordingStatus.Agendada, createdAt: now, updatedAt: now },
];

export const MOCK_CALENDAR_EVENTS: CalendarEvent[] = [
  { id: 'cal-1', title: 'Gravação - Visionary Films', date: `${year}-${month}-10`, description: 'Gravação do clipe da banda "The Vistas"', color: 'blue', source: 'HopeOS' },
];

export const MOCK_COPYWRITING: Copywriting[] = [
    { id: 'copy-1', title: 'Legenda Inverno', content: 'O frio chegou, mas o som não para!', category: CopyCategory.Instagram, createdAt: now, updatedAt: now },
];

export const MOCK_EVENTS: Event[] = [
    { id: 'evt-1', name: 'Workshop de Mixagem', description: 'Técnicas avançadas de mixagem.', date: `${year}-${month}-20` },
];

export const MOCK_EVENT_INTERESTS: EventInterest[] = [
    { id: 'int-1', clientId: 'client-1', eventId: 'evt-1', status: EventInterestStatus.Confirmado, notes: 'Pago via Pix' },
];

export const MOCK_FINANCIAL_DATA: FinancialTransaction[] = [];

export const MOCK_EXPENSE_PRESETS: ExpensePreset[] = [
    { id: 'preset-1', name: 'Bruno', description: 'Bruno', category: 'Assistente Técnico', amount: 50 }
];

export const MOCK_CAMPAIGNS: Campaign[] = [
    { id: 'camp-1', name: 'DrumDay 2024', objective: CampaignObjective.Vendas, status: CampaignStatus.Ativa, startDate: `${year}-${month}-01`, endDate: `${year}-${month}-30`, budget: 1000, spent: 450, results: { leads: 12, sales: 2 }, createdAt: now, updatedAt: now }
];

export const MOCK_MUSICIANS: Musician[] = [
    { id: 'mus-1', name: 'Carlos Guitarra', instruments: ['Guitarra'], cacheValue: 200, pixKey: 'carlos@pix.com', whatsapp: '+55 11 99999-9999', gender: 'male', rating: 5 },
];
