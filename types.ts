
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
}

export interface Client {
  id: string;
  name: string;
  email: string;
  company: string;
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
    Vídeo = 'Vídeo',
    ProduçãoMusical = 'Produção Musical',
    GravaçãoDeÁudio = 'Gravação de Áudio',
    PósProduçãoDeÁudio = 'Pós-produção de Áudio',
}

export interface Product {
    id: string;
    name: string;
    price: string;
    description: string;
    category: ProductCategory;
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
}
