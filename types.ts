
export type Page = 'Início' | 'Produtos' | 'Clientes' | 'Marketing' | 'Gravações' | 'Projetos' | 'Eventos' | 'Financeiro' | 'Tarefas & Calendário' | 'Configurações';

export enum LeadStatus {
  Novo = 'Novo',
  EmConversa = 'Em Conversa',
  Fechamento = 'Fechamento',
  Convertido = 'Convertido',
  Perdido = 'Perdido',
}

export interface Lead {
  id: string;
  name: string;
  company: string;
  gender: 'male' | 'female';
  status: LeadStatus;
  lastContact: string;
  email?: string;
  whatsapp?: string;
  notes?: string; // Quick notes
  nextFollowUp?: string; // YYYY-MM-DD schedule
}

export interface Client {
  id: string;
  name: string;
  email?: string;
  whatsapp: string;
  gender: 'male' | 'female';
  status: 'Active' | 'Inactive' | 'Lead';
  lastProjectDate: string;
}

export interface FinancialTransaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  category: string;
}

export enum ProductCategory {
    VideoAcustico = 'Vídeo Acústico',
    VideoBanda = 'Vídeo com Banda',
    HopeSession = 'Hope Session Colaborativa',
    PocketShow = 'Pocket Show',
    DrumDay = 'DrumDay',
    ProducaoMusical = 'Produção Musical (Single)',
    Gravacao = 'Gravação',
    PosProducaoAudio = 'Pós-produção de Áudio',
}

export interface Product {
    id: string;
    name: string;
    price: string;
    description: string;
    category: ProductCategory;
    horasEstimadas: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  description: string;
  color: 'blue' | 'green' | 'red' | 'yellow';
  source: 'HopeOS' | 'Google';
}

export enum CopyCategory {
    Instagram = 'Instagram',
    WhatsApp = 'WhatsApp',
    Email = 'Email',
    Website = 'Website',
    Outro = 'Outro',
}

export interface Copywriting {
    id: string;
    title: string;
    content: string;
    category: CopyCategory;
    createdAt: string;
    updatedAt: string;
}

export interface Event {
  id: string;
  name: string;
  description: string;
  date: string; // YYYY-MM-DD
}

export enum EventInterestStatus {
  Interessado = 'Interessado',
  Confirmado = 'Confirmado',
  Compareceu = 'Compareceu',
}

export interface EventInterest {
  id: string;
  clientId: string;
  eventId: string;
  status: EventInterestStatus;
  notes?: string;
}

export enum RecordingStatus {
    Agendada = 'Agendada',
    Concluída = 'Concluída',
    Cancelada = 'Cancelada',
}

export enum PaymentStatus {
    Pendente = 'Pendente',
    Entrada25 = 'Entrada 25%',
    Entrada50 = 'Entrada 50%',
    Entrada75 = 'Entrada 75%',
    PagoIntegral = 'Pagamento Integral (100%)',
}

export interface Recording {
    id: string;
    clientId: string;
    productId: string;
    data: string; // YYYY-MM-DD
    horaInicio: string; // HH:mm
    horaFim: string; // HH:mm
    horasEstimadas: number;
    valorUnitario: number;
    quantidade: number;
    valorTotal: number;
    statusPagamentoInicial: PaymentStatus;
    notes: string;
    status: RecordingStatus;
    createdAt: string;
    updatedAt: string;
}

// --- FINANCIAL MODULE TYPES ---

export enum StatusPagamento {
    AReceber = 'A Receber',
    Pago = 'Pago',
    Parcial = 'Parcial',
    Cancelado = 'Cancelado',
}

export interface LancamentoFinanceiro {
    id: string;
    gravacaoId: string; // Link to the original recording
    eventId?: string; // Link to an event (Optional)
    produtoId: string;
    clienteId: string;
    valorPrevisto: number;
    valorRecebido: number;
    statusPagamento: StatusPagamento;
    dataPrevista: string; // Copied from recording
    datasPagamentos?: { id: string; data: string; valor: number; tipo: string }[];
    formaPagamento?: string;
    observacoes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface SaidaFinanceira {
    id: string;
    descricao: string;
    valor: number;
    data: string; // YYYY-MM-DD
    categoria: string;
    observacoes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ExpensePreset {
    id: string;
    name: string; // Display name for button (e.g. "Bruno")
    description: string; // Default description field value
    category: string;
    amount: number;
}

// --- CAMPAIGNS MODULE TYPES ---

export enum CampaignStatus {
    Ativa = 'Ativa',
    Concluida = 'Concluída',
    Rascunho = 'Rascunho',
    Arquivada = 'Arquivada'
}

export enum CampaignObjective {
    Leads = 'Leads',
    Vendas = 'Vendas',
    Engajamento = 'Engajamento',
    Lancamento = 'Lançamento',
    Branding = 'Branding'
}

export interface CampaignChecklistItem {
    id: string;
    text: string;
    completed: boolean;
}

export interface Campaign {
    id: string;
    name: string;
    objective: CampaignObjective;
    status: CampaignStatus;
    startDate: string;
    endDate?: string;
    productId?: string; // Related product (optional)
    budget?: number;
    spent?: number;
    results?: {
        leads?: number;
        sales?: number;
        clicks?: number;
        reach?: number;
    };
    copy?: {
        main: string;
        secondary?: string;
        hashtags?: string;
    };
    visuals?: {
        imageUrl?: string; // URL or Placeholder
        description?: string;
    };
    audience?: {
        primary?: string;
        interests?: string;
    };
    rating?: number; // 1 to 5 stars
    notes?: string; // HTML/Rich Text content
    checklist?: CampaignChecklistItem[];
    createdAt: string;
    updatedAt: string;
}
