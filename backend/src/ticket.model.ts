import mongoose, { Document, Schema } from "mongoose";
import type { UrgencyLevel, CallStatus } from "../../src/types/logistics";

// --- Schema para o objeto aninhado 'solicitante' ---
const SolicitanteSchema: Schema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    avatar: { type: String, default: null },
    initials: { type: String },
    phone: { type: String, default: null },
    shopeeId: { type: String, required: false },
  },
  { _id: false },
);

// --- Interface para o documento Ticket ---
export interface ITicket extends Document {
  _id: mongoose.Types.ObjectId;
  // ADIÇÃO CRÍTICA: Ponte com o Firebase para evitar o erro "Ticket não possui mongoId"
  firebaseId: string;
  userId: string;
  prompt: string;
  description: string;
  reason?: string;
  securityCode?: string;
  createdAt: Date;
  solicitante: {
    id: string;
    name: string;
    avatar?: string | null;
    initials?: string;
    phone?: string | null;
    shopeeId?: string;
  };
  location: string;
  hub: string;
  vehicleType: string;
  isBulky: boolean;
  routeId: string;
  urgency: UrgencyLevel;
  status: CallStatus;
  timestamp: Date;
  packageCount: number;
  deliveryRegions: string[];
}

// --- Schema principal do Ticket ---
const TicketSchema: Schema = new Schema({
  // ADIÇÃO DO CAMPO NO SCHEMA: Indexado para buscas rápidas durante exclusão/update
  firebaseId: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true },
  prompt: { type: String, required: true },
  description: { type: String, required: true },
  reason: { type: String, required: false },
  securityCode: { type: String, required: false },
  createdAt: { type: Date, default: Date.now },
  solicitante: { type: SolicitanteSchema, required: true },
  location: { type: String, required: true },
  hub: { type: String, required: true },
  vehicleType: { type: String, required: true },
  isBulky: { type: Boolean, default: false },
  routeId: { type: String, required: true },
  urgency: {
    type: String,
    enum: ["BAIXA", "MEDIA", "ALTA", "URGENTE"],
    required: true,
  },
  status: {
    type: String,
    enum: [
      "ABERTO",
      "EM ANDAMENTO",
      "AGUARDANDO_APROVACAO",
      "CONCLUIDO",
      "EXCLUIDO",
      "ARQUIVADO",
    ],
    default: "ABERTO",
  },
  timestamp: { type: Date, default: Date.now },
  packageCount: { type: Number, required: true },
  deliveryRegions: { type: [String], required: true },
});

// Exporta o modelo
export const Ticket = mongoose.model<ITicket>("Ticket", TicketSchema);
