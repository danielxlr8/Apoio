import React from "react";
import {
  Building,
  Package,
  Truck,
  MapPin,
  Download,
  Image as ImageIcon,
  Weight,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { UrgencyBadge } from "./UrgencyBadge";
import { Loading } from "../../ui/loading";
import { cn } from "../../../lib/utils";
import type { SupportCall } from "../../../types/logistics";

interface OpenCallCardProps {
  call: SupportCall;
  acceptingCallId: string | null;
  onAccept: (callId: string) => void;
  canAcceptNewCall: boolean;
  myIds: string[];
  theme?: "light" | "dark";
}

export const OpenCallCard: React.FC<OpenCallCardProps> = ({
  call,
  acceptingCallId,
  onAccept,
  canAcceptNewCall,
  myIds,
  theme = "light",
}) => {
  const isAccepting = acceptingCallId === call.id;

  // Parsear descrição para extrair informações
  const parseDescription = (desc: string) => {
    if (!desc) return null;
    const info: any = {};

    const motivoMatch = desc.match(/MOTIVO:\s*([^.]+)/i);
    if (motivoMatch) info.motivo = motivoMatch[1].trim();

    const detalhesMatch = desc.match(/DETALHES:\s*([^.]+(?:\.[^H]|$))/i);
    if (detalhesMatch) info.detalhes = detalhesMatch[1].trim();

    const regioesMatch = desc.match(/Regiões:\s*([^.]+)/i);
    if (regioesMatch) {
      info.regioes = regioesMatch[1]
        .split(",")
        .map((r: string) => r.trim())
        .filter(Boolean);
    }

    info.volumoso = /VOLUMOSO/i.test(desc);

    return Object.keys(info).length > 0 ? info : null;
  };

  const parsedInfo = call.description
    ? parseDescription(call.description)
    : null;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[1.5rem] p-4 group transition-all border-l-4 border-l-primary border",
        theme === "dark"
          ? "bg-slate-900/40 border-orange-500/30 backdrop-blur-sm"
          : "bg-white/80 border-orange-200/50 shadow-black/5",
      )}
      style={
        theme === "dark"
          ? {
              boxShadow:
                "0 25px 50px -12px rgba(254, 95, 47, 0.3), inset 0 1px 0 0 rgba(254, 95, 47, 0.1)",
            }
          : {
              boxShadow: "0 25px 50px -12px rgba(254, 95, 47, 0.15)",
            }
      }
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-primary font-bold text-sm bg-primary/15 border border-primary/30">
            {call.solicitante.initials}
          </div>
          <div>
            <h4
              className={cn(
                "font-bold text-sm",
                theme === "dark" ? "text-amber-50" : "text-slate-800",
              )}
            >
              {call.solicitante.name}
            </h4>
            <div
              className={cn(
                "flex items-center gap-1 text-xs",
                theme === "dark" ? "text-amber-700" : "text-slate-600",
              )}
            >
              <Building size={10} />
              <span className="truncate max-w-[150px]">
                {call.hub?.split("_")[2]}
              </span>
            </div>
          </div>
        </div>
        <UrgencyBadge urgency={call.urgency} />
      </div>

      {/* Motivo */}
      {parsedInfo?.motivo && (
        <div
          className={cn(
            "mb-3 p-2.5 rounded-lg border",
            theme === "dark"
              ? "bg-red-900/20 border-red-800/30"
              : "bg-red-50 border-red-200/50",
          )}
        >
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle
              size={12}
              className={theme === "dark" ? "text-red-400" : "text-red-600"}
            />
            <span
              className={cn(
                "text-[10px] font-bold uppercase tracking-wide",
                theme === "dark" ? "text-red-300" : "text-red-700",
              )}
            >
              Motivo
            </span>
          </div>
          <p
            className={cn(
              "text-xs font-semibold pl-4 break-words overflow-wrap-anywhere",
              theme === "dark" ? "text-amber-50" : "text-gray-900",
            )}
          >
            {parsedInfo.motivo}
          </p>
        </div>
      )}

      {/* Detalhes */}
      {parsedInfo?.detalhes && (
        <div
          className={cn(
            "mb-3 p-2.5 rounded-lg border",
            theme === "dark"
              ? "bg-orange-900/20 border-orange-800/30"
              : "bg-orange-50 border-orange-200/50",
          )}
        >
          <div className="flex items-center gap-2 mb-1">
            <FileText
              size={12}
              className={
                theme === "dark" ? "text-orange-400" : "text-orange-600"
              }
            />
            <span
              className={cn(
                "text-[10px] font-bold uppercase tracking-wide",
                theme === "dark" ? "text-orange-300" : "text-orange-700",
              )}
            >
              Detalhes
            </span>
          </div>
          <p
            className={cn(
              "text-xs pl-4 leading-relaxed break-words overflow-wrap-anywhere",
              theme === "dark" ? "text-gray-200" : "text-gray-800",
            )}
          >
            {parsedInfo.detalhes}
          </p>
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <div className="flex-1 rounded-xl px-3 py-2 bg-muted/50 border border-border">
          <span className="text-[10px] font-bold text-muted-foreground uppercase block">
            Pacotes
          </span>
          <span
            className={cn(
              "font-bold text-lg flex items-center gap-1",
              theme === "dark" ? "text-amber-50" : "text-slate-800",
            )}
          >
            <Package size={16} className="text-primary" /> {call.packageCount}
          </span>
        </div>
        <div
          className={cn(
            "flex-1 rounded-xl px-3 py-2 border",
            theme === "dark"
              ? "bg-stone-900/50 border-stone-700/50"
              : "bg-orange-50/80 border-orange-200/50",
          )}
        >
          <span
            className={cn(
              "text-[10px] font-bold uppercase block",
              theme === "dark" ? "text-amber-600" : "text-slate-600",
            )}
          >
            Veículo
          </span>
          <span
            className={cn(
              "font-bold text-sm flex items-center gap-1 capitalize h-7",
              theme === "dark" ? "text-amber-50" : "text-slate-800",
            )}
          >
            <Truck size={16} className="text-primary" /> {call.vehicleType}
          </span>
        </div>
      </div>

      {/* Ganho Estimado */}
      <div
        className={cn(
          "mb-4 p-3 rounded-xl border",
          theme === "dark"
            ? "bg-green-900/20 border-green-800/30"
            : "bg-green-50 border-green-200/50",
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "p-1.5 rounded-lg",
                theme === "dark" ? "bg-green-500/20" : "bg-green-100",
              )}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.89.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <div>
              <span
                className={cn(
                  "text-[10px] font-bold uppercase block",
                  theme === "dark" ? "text-green-400" : "text-green-700",
                )}
              >
                Ganho Estimado
              </span>
              <span
                className={cn(
                  "text-lg font-bold",
                  theme === "dark" ? "text-green-300" : "text-green-600",
                )}
              >
                R$ {((call.packageCount || 0) * 2.5).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Volumoso */}
      {(parsedInfo?.volumoso || call.isBulky) && (
        <div
          className={cn(
            "mb-3 p-2.5 rounded-lg border-2",
            theme === "dark"
              ? "bg-orange-900/20 border-orange-700"
              : "bg-orange-50 border-orange-300",
          )}
        >
          <div className="flex items-center gap-2">
            <Weight
              size={14}
              className={
                theme === "dark" ? "text-orange-400" : "text-orange-600"
              }
            />
            <span
              className={cn(
                "text-[10px] font-bold uppercase tracking-wide",
                theme === "dark" ? "text-orange-300" : "text-orange-700",
              )}
            >
              Volumoso
            </span>
          </div>
        </div>
      )}

      {/* Regiões de Entrega */}
      {(parsedInfo?.regioes && parsedInfo.regioes.length > 0) ||
      (call.deliveryRegions && call.deliveryRegions.length > 0) ? (
        <div
          className={cn(
            "mb-3 p-2.5 rounded-lg border",
            theme === "dark"
              ? "bg-green-900/20 border-green-800/30"
              : "bg-green-50 border-green-200/50",
          )}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <MapPin
              size={12}
              className={theme === "dark" ? "text-green-400" : "text-green-600"}
            />
            <span
              className={cn(
                "text-[10px] font-bold uppercase tracking-wide",
                theme === "dark" ? "text-green-300" : "text-green-700",
              )}
            >
              Regiões de Entrega
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 pl-4">
            {(parsedInfo?.regioes || call.deliveryRegions || [])
              .slice(0, 3)
              .map((regiao: string, idx: number) => (
                <span
                  key={idx}
                  className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-semibold border",
                    theme === "dark"
                      ? "bg-green-800/40 text-green-300 border-green-700"
                      : "bg-green-100 text-green-700 border-green-300",
                  )}
                >
                  {regiao}
                </span>
              ))}
            {(parsedInfo?.regioes || call.deliveryRegions || []).length > 3 && (
              <span
                className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-semibold",
                  theme === "dark"
                    ? "bg-gray-800 text-gray-400"
                    : "bg-gray-100 text-gray-600",
                )}
              >
                +
                {(parsedInfo?.regioes || call.deliveryRegions || []).length - 3}
              </span>
            )}
          </div>
        </div>
      ) : null}

      {/* Foto da Carga */}
      {call.cargoPhotoUrl && (
        <div
          className={cn(
            "mb-3 p-2 rounded-xl border",
            theme === "dark"
              ? "bg-orange-500/10 border-orange-500/30"
              : "bg-primary/10 border-primary/30",
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon
                size={16}
                className={
                  theme === "dark" ? "text-orange-400" : "text-orange-600"
                }
              />
              <span
                className={cn(
                  "text-xs font-semibold",
                  theme === "dark" ? "text-amber-50" : "text-foreground",
                )}
              >
                Foto da Carga Disponível
              </span>
            </div>
            <a
              href={call.cargoPhotoUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-primary-foreground bg-primary hover:bg-primary/90 transition-all shadow-md"
            >
              <Download size={14} />
              <span>Baixar Foto</span>
            </a>
          </div>
        </div>
      )}

      {/* Botão Ver no Google Maps */}
      <a
        href={call.location}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "flex items-center justify-center gap-2 p-3 rounded-xl mb-3 transition-all hover:scale-105 border",
          theme === "dark"
            ? "bg-orange-900/20 border-orange-800/30 hover:bg-orange-900/30"
            : "bg-blue-50 border-blue-200 hover:bg-blue-100",
        )}
      >
        <MapPin
          size={18}
          className={theme === "dark" ? "text-orange-400" : "text-blue-600"}
        />
        <span
          className={cn(
            "text-sm font-bold",
            theme === "dark" ? "text-orange-300" : "text-blue-700",
          )}
        >
          Ver no Google Maps
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-50"
        >
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
          <polyline points="15 3 21 3 21 9"></polyline>
          <line x1="10" y1="14" x2="21" y2="3"></line>
        </svg>
      </a>

      {/* Botão Aceitar Maior */}
      {canAcceptNewCall && !myIds.includes(call.solicitante?.id) && (
        <button
          onClick={() => onAccept(call.id)}
          disabled={!!acceptingCallId}
          className="w-full py-4 rounded-xl text-sm font-bold text-primary-foreground bg-primary hover:bg-primary/90 transition-all disabled:opacity-50 shadow-xl flex items-center justify-center gap-2"
        >
          {isAccepting ? (
            <>
              <Loading size="sm" variant="spinner" />
              <span>Aceitando...</span>
            </>
          ) : (
            <>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              ACEITAR CHAMADO
            </>
          )}
        </button>
      )}
    </div>
  );
};
