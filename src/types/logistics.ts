// Tipos para o Sistema Logístico
export type UrgencyLevel = "BAIXA" | "MEDIA" | "ALTA" | "URGENTE";

export type CallStatus =
  | "ABERTO"
  | "EM ANDAMENTO"
  | "AGUARDANDO_APROVACAO"
  | "DEVOLUCAO"
  | "CONCLUIDO"
  | "EXCLUIDO"
  | "ARQUIVADO";

export interface Driver {
  uid: string;
  name: string;
  email: string;
  phone: string;
  status: "DISPONIVEL" | "INDISPONIVEL" | "EM_ROTA" | "OFFLINE";
  hub: string;
  vehicleType: string;
  avatar?: string;
  initials?: string;
  createdAt?: any;
  googleUid?: string;
  shopeeId?: string; // Propriedade para o ID interno da Shopee
  avatarUpdateCount?: number; // Contador de trocas de foto no mês atual
  lastAvatarUpdate?: any; // Timestamp da última atualização de foto (Firestore Timestamp)

  // --- NOVOS CAMPOS PARA RANKING E PERFIL (ADICIONADOS AGORA) ---
  gender?: string; // "Homem" | "Mulher"
  completedSupports?: number; // Contador de apoios para o Ranking
  ratingAverage?: number; // Média de estrelas (ex: 4.8)
  ratingCount?: number; // Quantidade de avaliações recebidas
}

export interface SupportCall {
  id: string;
  mongoId?: string;
  solicitante: {
    id: string;
    name: string;
    avatar?: string;
    initials?: string;
    phone?: string;
    shopeeId?: string;
  };
  assignedTo?: string;
  description: string;
  location: string;
  status: CallStatus;
  timestamp: any;
  urgency: UrgencyLevel;
  routeId?: string;
  vehicleType?: string;
  isBulky?: boolean;
  hub?: string;
  approvedBy?: string;
  deletedAt?: any;
  deletedBy?: string;
  packageCount?: number;
  deliveryRegions?: string[];
  cargoPhotoUrl?: string;

  // --- CAMPOS VISUAIS EXISTENTES ---
  driverName?: string; // Nome para exibição direta no card
  priority?: "NORMAL" | "URGENTE" | string; // Compatibilidade com a tag de urgência
  reason?: string; // Ex: "Roubo/Furto", "Acidente"
  details?: string; // Descrição detalhada para o card
  packages?: number; // Quantidade de pacotes (usado no visual novo)
  estimatedEarnings?: number; // Valor em Reais (R$)
  heavyLoad?: boolean; // Se é volumoso (usado na tag VOLUMOSO)
  region?: string; // Região principal (ex: "Zona Leste")

  // --- NOVOS CAMPOS PARA MAPA, SEGURANÇA E AVALIAÇÃO (ADICIONADOS AGORA) ---
  coordinates?: { latitude: number; longitude: number }; // Coordenadas para o Mapa (GeoPoint do Firestore)
  securityCode?: string; // PIN de 4 dígitos para validação
  rating?: number; // Nota dada ao atendimento (1-5)
  prestador?: {
    // Dados estáticos do prestador no momento do aceite
    id: string;
    name: string;
    avatar?: string | null;
    initials?: string;
    phone: string;
  };
}

// Interface para o histórico de mensagens do Chatbot
export interface ChatHistoryMessage {
  id: string;
  role: "user" | "model";
  parts: [{ text: string }];
  gifUrls?: string[];
  type?: "message" | "follow-up" | "role-selection" | "topic-selection";
}
