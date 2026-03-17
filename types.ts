
export type Page = 'Início' | 'Produtos' | 'Clientes' | 'Marketing' | 'Gravações' | 'Projetos' | 'Eventos' | 'Financeiro' | 'Configurações' | 'Músicos';

export enum LeadStatus {
  Novo = 'Novo',
  EmConversa = 'Em Conversa',
  Esfriou = 'Esfriou',
  Convertido = 'Convertido',
}

export enum ProductionStage {
    PreProducao = 'Pré-produção',
    Gravacao = 'Gravação',
    Edicao = 'Edição/Afinação',
    Mixagem = 'Mixagem',
    Masterizacao = 'Masterização',
    Revisao = 'Revisão do Cliente',
    Finalizado = 'Finalizado',
}

export enum TrackStatus {
    AFazer = 'A fazer',
    EmAndamento = 'Em andamento',
    Concluido = 'Concluído',
}

export interface ProjectTrack {
    id: string;
    projectId: string;
    title: string;
    statusPreProd: TrackStatus;
    statusRec: TrackStatus;
    statusEdit: TrackStatus;
    statusMix: TrackStatus;
    statusMaster: TrackStatus;
    notes?: string;
    order: number;
}

export interface Project {
    id: string;
    name: string;
    clientId: string;
    stage: ProductionStage;
    progress: number; // 0-100
    folderLink?: string;
    deadline?: string;
    musiciansIds: string[];
    notes?: string;
    createdAt: string;
    updatedAt: string;
    isComplex?: boolean; // Se True, habilita a gestão de faixas
}

export interface ClientActivity {
    id: string;
    type: 'note' | 'whatsapp_import' | 'system' | 'task';
    content: string;
    date: string; // ISO string
}

export interface Client {
  id: string;
  name: string;
  company?: string;
  email?: string;
  whatsapp: string;
  gender: 'male' | 'female';
  status: 'Active' | 'Inactive' | 'Lead';
  lastProjectDate: string;
  // Lead specific fields
  leadStage?: LeadStatus;
  nextFollowUp?: string; // YYYY-MM-DD
  notes?: string;
  history?: ClientActivity[];
  createdAt?: string;
}

export interface Musician {
    id: string;
    name: string;
    instruments: string[]; 
    cacheValue: number;
    pixKey: string;
    whatsapp: string;
    gender: 'male' | 'female';
    rating: number; 
    notes?: string;
    avatarUrl?: string; 
    cpf?: string;
    ecad?: string;
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
  date: string; 
  description: string;
  color: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
  source: 'HopeOS' | 'Google' | 'Lead';
  completed?: boolean;
  archived?: boolean;
  order?: number;
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
  date: string; 
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
    data: string; 
    deliveryDate?: string; 
    horaInicio: string; 
    horaFim: string; 
    horasEstimadas: number;
    valorUnitario: number;
    quantidade: number;
    valorTotal: number;
    statusPagamentoInicial: PaymentStatus;
    notes: string;
    status: RecordingStatus;
    createdAt: string;
    updatedAt: string;
    googleEventId?: string;
}

export enum StatusPagamento {
    AReceber = 'A Receber',
    Pago = 'Pago',
    Parcial = 'Parcial',
    Cancelado = 'Cancelado',
}

export interface LancamentoFinanceiro {
    id: string;
    gravacaoId: string; 
    eventId?: string; 
    produtoId: string;
    clienteId: string;
    valorPrevisto: number;
    valorRecebido: number;
    statusPagamento: StatusPagamento;
    dataPrevista: string; 
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
    data: string; 
    categoria: string;
    observacoes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ExpensePreset {
    id: string;
    name: string; 
    description: string; 
    category: string;
    amount: number;
}

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
    productId?: string; 
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
        imageUrl?: string; 
        description?: string;
    };
    audience?: {
        primary?: string;
        interests?: string;
    };
    rating?: number; 
    notes?: string; 
    checklist?: CampaignChecklistItem[];
    createdAt: string;
    updatedAt: string;
}

export interface AppState {
    clients: Client[];
    financials: FinancialTransaction[];
    products: Product[];
    recordings: Recording[];
    projects: Project[];
    projectTracks: ProjectTrack[];
    copywriting: Copywriting[];
    events: Event[];
    eventInterests: EventInterest[];
    calendarEvents: CalendarEvent[];
    lancamentos: LancamentoFinanceiro[];
    saidas: SaidaFinanceira[];
    campaigns: Campaign[];
    expensePresets: ExpensePreset[];
    musicians: Musician[];
    isCloudSyncEnabled: boolean;
    whatsappSendMethod?: 'browser' | 'extension' | 'api';
    whatsappApiUrl?: string;
    whatsappApiKey?: string;
    whatsappSessionName?: string;
    googleTokens?: any;
}
