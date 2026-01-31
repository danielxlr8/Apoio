import React from "react";
import {
  CheckCircle,
  XCircle,
  Zap,
  AlertTriangle,
  Search,
  Ticket,
} from "lucide-react";
import { cn } from "../../lib/utils";
import type { Driver, SupportCall } from "../../types/logistics";
import { OpenCallCard } from "./components/OpenCallCard";

interface StatusSectionProps {
  driver: Driver;
  onAvailabilityChange: (available: boolean) => void;
  filteredOpenCalls: SupportCall[];
  routeIdSearch: string;
  onRouteIdSearchChange: (value: string) => void;
  acceptingCallId: string | null;
  onAcceptCall: (callId: string) => void;
  theme?: "light" | "dark";
}

export const StatusSection: React.FC<StatusSectionProps> = ({
  driver,
  onAvailabilityChange,
  filteredOpenCalls,
  routeIdSearch,
  onRouteIdSearchChange,
  acceptingCallId,
  onAcceptCall,
  theme = "light",
}) => {
  // SE O CARD ESTIVER BRANCO, SIGNIFICA QUE 'theme' ESTÁ CHEGANDO COMO 'light'.
  // Verifique o DriverInterface.tsx.
  const isDark = theme === "dark";

  return (
    <div className="space-y-6 tab-content-enter">
      {/* --- CARD PRINCIPAL DE STATUS --- */}
      <div
        className={cn(
          "relative overflow-hidden rounded-[1.5rem] p-6 border transition-all duration-300",
          isDark
            ? "bg-[#1c1410] border-orange-500/30 shadow-none" // CORRIGIDO: Marrom escuro exato do Perfil
            : "bg-white/80 border-orange-200/50 shadow-sm",
        )}
        style={
          isDark
            ? { boxShadow: "inset 0 1px 0 0 rgba(254, 95, 47, 0.05)" }
            : { boxShadow: "0 25px 50px -12px rgba(254, 95, 47, 0.15)" }
        }
      >
        {/* Glow de fundo */}
        <div
          className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-5"
          style={{
            background: isDark
              ? driver.status === "DISPONIVEL"
                ? "#ea580c"
                : "#ef4444"
              : driver.status === "DISPONIVEL"
                ? "#10b981"
                : "#ef4444",
          }}
        />

        <div className="relative">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3
                className={cn(
                  "font-bold text-lg mb-1 uppercase tracking-wide",
                  isDark ? "text-white" : "text-[#FE5F2F1A]/90", // Texto Branco no Dark
                )}
              >
                Status de Operação
              </h3>
              <p
                className={cn(
                  "text-sm font-medium",
                  isDark ? "text-orange-500" : "text-orange-600",
                )}
              >
                Gerencie sua disponibilidade
              </p>
            </div>
            {/* Badge Status */}
            <div
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border",
                driver.status === "DISPONIVEL"
                  ? isDark
                    ? "text-emerald-400 bg-[#2a1712] border-emerald-500/30" // Fundo marrom avermelhado
                    : "text-emerald-600 bg-emerald-50 border-emerald-200"
                  : isDark
                    ? "text-red-400 bg-[#2a1712] border-red-500/30"
                    : "text-red-600 bg-red-50 border-red-200",
              )}
            >
              <div
                className={cn(
                  "w-2 h-2 rounded-full animate-pulse",
                  driver.status === "DISPONIVEL"
                    ? "bg-emerald-400"
                    : "bg-red-400",
                )}
              />
              {driver.status === "DISPONIVEL" ? "Online" : "Offline"}
            </div>
          </div>

          {/* Botões Toggle */}
          <div
            className={cn(
              "flex gap-3 mb-6 p-1 rounded-lg border",
              isDark
                ? "bg-[#120805] border-orange-500/10" // Fundo quase preto para contraste
                : "bg-orange-50 border-orange-100",
            )}
          >
            <button
              onClick={() => onAvailabilityChange(true)}
              className={cn(
                "flex-1 py-3 px-6 rounded-md font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2",
                driver.status === "DISPONIVEL"
                  ? "text-white bg-[#ea580c] shadow-md"
                  : isDark
                    ? "text-gray-400 hover:text-white hover:bg-white/5"
                    : "text-slate-500 hover:text-slate-800 hover:bg-white/50",
              )}
            >
              <CheckCircle size={18} />
              <span>Disponível</span>
            </button>
            <button
              onClick={() => onAvailabilityChange(false)}
              className={cn(
                "flex-1 py-3 px-6 rounded-md font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2",
                driver.status !== "DISPONIVEL"
                  ? "text-white bg-[#ea580c] shadow-md"
                  : isDark
                    ? "text-gray-400 hover:text-white hover:bg-white/5"
                    : "text-slate-500 hover:text-slate-800 hover:bg-white/50",
              )}
            >
              <XCircle size={18} />
              <span>Indisponível</span>
            </button>
          </div>

          {/* Info Box */}
          <div
            className={cn(
              "p-4 rounded-lg border",
              isDark
                ? "bg-[#2a1712] border-orange-500/20" // CORRIGIDO: Mesmo fundo dos inputs do Perfil
                : "bg-orange-50/50 border-orange-200",
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "p-2 rounded-lg",
                  driver.status === "DISPONIVEL"
                    ? isDark
                      ? "text-emerald-400 bg-emerald-950/30"
                      : "text-emerald-600 bg-emerald-100"
                    : isDark
                      ? "text-red-400 bg-red-950/30"
                      : "text-red-600 bg-red-100",
                )}
              >
                {driver.status === "DISPONIVEL" ? (
                  <Zap size={20} />
                ) : (
                  <AlertTriangle size={20} />
                )}
              </div>
              <div className="flex-1">
                <p
                  className={cn(
                    "font-semibold text-sm mb-1",
                    isDark ? "text-white" : "text-slate-800",
                  )}
                >
                  {driver.status === "DISPONIVEL"
                    ? "Pronto para receber chamados"
                    : "Você está indisponível"}
                </p>
                <p
                  className={cn(
                    "text-xs leading-relaxed",
                    isDark ? "text-gray-400" : "text-slate-600",
                  )}
                >
                  {driver.status === "DISPONIVEL"
                    ? "Você receberá notificações de novos chamados de apoio na sua região."
                    : "Você não receberá novos chamados enquanto estiver indisponível."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- LISTA DE CHAMADOS --- */}
      {driver.status === "DISPONIVEL" && (
        <div
          className={cn(
            "relative overflow-hidden rounded-[1.5rem] p-6 border tab-content-enter transition-all duration-300",
            isDark
              ? "bg-[#1c1410] border-orange-500/30 shadow-none" // CORRIGIDO: Fundo Marrom
              : "bg-white/80 border-orange-200/50",
          )}
        >
          <div className="flex justify-between items-center mb-4">
            <h3
              className={cn(
                "font-bold text-lg uppercase tracking-wide",
                isDark ? "text-white" : "text-slate-800",
              )}
            >
              Chamados na Região
            </h3>
            <div
              className={cn(
                "px-3 py-1 rounded-full text-xs font-semibold",
                isDark
                  ? "bg-[#2a1712] text-orange-400 border border-orange-500/30"
                  : "bg-orange-50 text-orange-600 border border-orange-100",
              )}
            >
              {filteredOpenCalls.length} ativos
            </div>
          </div>

          {/* Input de Busca */}
          <div className="relative mb-4">
            <Search
              className={cn(
                "absolute left-3 top-1/2 -translate-y-1/2",
                isDark ? "text-gray-400" : "text-slate-400",
              )}
              size={18}
            />
            <input
              type="text"
              placeholder="Filtrar rota..."
              value={routeIdSearch}
              onChange={(e) => onRouteIdSearchChange(e.target.value)}
              className={cn(
                "w-full pl-10 pr-4 py-3 rounded-lg text-sm border outline-none transition-all focus:ring-1 focus:ring-orange-500",
                isDark
                  ? "bg-[#2a1712] border-orange-500/20 text-white placeholder:text-white/40" // CORRIGIDO: Fundo avermelhado do input do Perfil
                  : "bg-white border-slate-200 text-slate-800 placeholder:text-slate-400",
              )}
            />
          </div>

          <div className="space-y-3">
            {filteredOpenCalls.length > 0 ? (
              filteredOpenCalls.map((call) => (
                <OpenCallCard
                  key={call.id}
                  call={call}
                  acceptingCallId={acceptingCallId}
                  onAccept={onAcceptCall}
                  theme={theme}
                />
              ))
            ) : (
              <div
                className={cn(
                  "text-center py-12 rounded-lg border border-dashed",
                  isDark
                    ? "bg-[#180e0b] border-orange-500/10"
                    : "bg-orange-50/50 border-orange-200/50",
                )}
              >
                <Ticket
                  size={32}
                  className={cn(
                    "mx-auto mb-2",
                    isDark ? "text-orange-500/40" : "text-orange-300",
                  )}
                />
                <p
                  className={cn(
                    "text-sm",
                    isDark ? "text-gray-400" : "text-slate-600",
                  )}
                >
                  Nenhum chamado disponível no momento.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
