import React, { useState, useEffect, useMemo, useRef } from "react";
import Joyride, {
  Step,
  CallBackProps,
  STATUS,
  EVENTS,
  ACTIONS,
} from "react-joyride";
import Confetti from "react-confetti";
import type { Driver, SupportCall, UrgencyLevel } from "../types/logistics";

// --- IMPORT LOTTIE ---
import Lottie from "lottie-react";

import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

import {
  Clock,
  AlertTriangle,
  X,
  User,
  LogOut,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Calendar as CalendarIcon,
  Lock,
  History as HistoryIcon,
  Sun,
  Moon,
  MinusCircle,
  PlusCircle,
  ArrowRightLeft,
  BookOpen,
  Zap,
  CheckCircle,
  XCircle,
  HelpCircle,
  Truck,
  Phone,
  Package,
  MapPin,
  ExternalLink,
  CalendarClock,
  Image as ImageIcon,
  Download,
  Map as MapIcon,
  Trophy,
  Star,
  Mic,
  Smartphone,
} from "lucide-react";
import { auth, db, storage } from "../firebase";
import {
  doc,
  onSnapshot,
  updateDoc,
  collection,
  serverTimestamp,
  query,
  where,
  or,
  and,
  Timestamp,
  deleteField,
  getDocs,
  orderBy,
  addDoc,
  GeoPoint,
  runTransaction,
} from "firebase/firestore";
import {
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { increment } from "firebase/firestore";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Chatbot } from "./Chatbot";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { ProfileHeaderCard, StatusSection } from "./driver";
import { UrgencyBadge } from "./driver/components/UrgencyBadge";
import { CustomTooltip } from "./driver/CustomTooltip";
import { HUBS } from "../constants/hubs";
import { VEHICLE_TYPES } from "../constants/vehicleTypes";
import { SUPPORT_REASONS } from "../constants/supportReasons";
import {
  TUTORIALS_SOLICITANTE,
  TUTORIALS_PRESTADOR,
} from "../constants/tutorials";
import { formatTimestamp, formatPhoneNumber } from "../utils/formatting";
import { showNotification } from "../utils/notifications";
import { toast as sonnerToast } from "sonner";
import { Loading, LoadingOverlay } from "./ui/loading";
import { usePresence } from "../hooks/usePresence";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { Alert, AlertDescription } from "./ui/alert";

// Correção Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface DriverInterfaceProps {
  driver: Driver;
}

const sessionNotifiedCallIds = new Set<string>();

const getGenderAvatar = (name: string, gender?: string) => {
  const seed = name || "User";
  if (gender === "Mulher") {
    return `https://avatar.iran.liara.run/public/girl?username=${seed}`;
  }
  return `https://avatar.iran.liara.run/public/boy?username=${seed}`;
};

const getMockCoordinates = (id: string) => {
  const baseLat = -25.4284;
  const baseLng = -49.2733;
  const pseudoRandom = id
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const offsetLat = (pseudoRandom % 100) / 2000;
  const offsetLng = (pseudoRandom % 100) / 2000;
  return [baseLat + offsetLat, baseLng + offsetLng] as [number, number];
};

const generateSecurityCode = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

const StarRating = ({
  rating,
  onRate,
  readOnly = false,
}: {
  rating: number;
  onRate?: (r: number) => void;
  readOnly?: boolean;
}) => {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={16}
          className={cn(
            "transition-colors",
            readOnly ? "cursor-default" : "cursor-pointer",
            (hover || rating) >= star
              ? "fill-yellow-400 text-yellow-400"
              : "text-gray-300",
          )}
          onMouseEnter={() => !readOnly && setHover(star)}
          onMouseLeave={() => !readOnly && setHover(0)}
          onClick={() => !readOnly && onRate && onRate(star)}
        />
      ))}
    </div>
  );
};

const DriverCallHistoryCard = ({
  call,
  userId,
  allDrivers,
  driver,
  onRequestApproval,
  onCancelSupport,
  onDeleteSupportRequest,
  onRateDriver,
}: any) => {
  const isRequester = call.solicitante.id === userId;
  const otherPartyId = isRequester ? call.assignedTo : call.solicitante.id;
  const otherParty = allDrivers.find((d: Driver) => d.uid === otherPartyId);
  const solicitante = call.solicitante;
  const prestador = call.prestador || null;

  const [pin, setPin] = useState("");
  const [showPinInput, setShowPinInput] = useState(false);

  const handleWhatsAppClick = () => {
    if (!otherParty?.phone)
      return showNotification("error", "Erro", "Telefone indisponível.");
    const msg = encodeURIComponent(
      `Olá, sou ${driver.name} referente ao apoio logístico.`,
    );
    window.open(`https://wa.me/55${otherParty.phone}?text=${msg}`, "_blank");
  };

  const handleVerifyAndFinish = () => {
    if (pin === call.securityCode) {
      onRequestApproval(call.id);
    } else {
      showNotification(
        "error",
        "PIN Incorreto",
        "O código digitado não confere com o do solicitante.",
      );
    }
  };

  const isDark = document.documentElement.classList.contains("dark");

  return (
    <Card
      className={cn(
        "border border-border shadow-xl hover:shadow-2xl transition-all backdrop-blur-xl rounded-2xl overflow-hidden",
        isDark
          ? "bg-slate-800/90 border-slate-600/50 shadow-black/20 hover:shadow-black/30"
          : "bg-white/80 border-orange-200/50 shadow-black/5 hover:shadow-black/10",
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between p-4 border-b",
          isDark ? "border-slate-600/50" : "border-orange-200/50",
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "p-2 rounded-xl backdrop-blur-sm shadow-lg shadow-black/10",
              isRequester
                ? "bg-orange-500/20 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 border border-orange-400/30"
                : "bg-orange-500/20 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 border border-orange-400/30",
            )}
          >
            {isRequester ? <Package size={18} /> : <Truck size={18} />}
          </div>
          <div>
            <h3
              className={cn(
                "text-sm font-bold",
                isDark ? "text-white" : "text-slate-800",
              )}
            >
              {isRequester
                ? "Minha Solicitação"
                : `Apoio para ${call.solicitante.name}`}
            </h3>
            <p
              className={cn(
                "text-xs flex items-center gap-1",
                isDark ? "text-white/60" : "text-slate-600",
              )}
            >
              <CalendarClock size={12} /> {formatTimestamp(call.timestamp)}
            </p>
          </div>
        </div>
        <div className="text-right">
          <UrgencyBadge urgency={call.urgency} />
          <p
            className={cn(
              "text-[10px] font-medium mt-1 uppercase tracking-wide",
              isDark ? "text-white/50" : "text-slate-600",
            )}
          >
            {call.status.replace("_", " ")}
          </p>
        </div>
      </div>

      <div className="p-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <span
            className={cn(
              "text-[10px] uppercase font-bold block mb-0.5",
              isDark ? "text-white/50" : "text-slate-600",
            )}
          >
            Rota ID
          </span>
          <span
            className={cn(
              "font-mono font-medium backdrop-blur-xl px-1.5 py-0.5 rounded-xl text-xs border",
              isDark
                ? "text-white bg-orange-500/20 border-orange-500/30"
                : "text-slate-800 bg-orange-50/80 border-orange-200/50",
            )}
          >
            {call.routeId || "N/A"}
          </span>
        </div>
        <div>
          <span
            className={cn(
              "text-[10px] uppercase font-bold block mb-0.5",
              isDark ? "text-white/50" : "text-slate-600",
            )}
          >
            Pacotes
          </span>
          <span
            className={cn(
              "font-medium",
              isDark ? "text-white" : "text-slate-800",
            )}
          >
            {call.packageCount || 0} un.
          </span>
        </div>
        <div className="col-span-2">
          <span
            className={cn(
              "text-[10px] uppercase font-bold block mb-1",
              isDark ? "text-white/50" : "text-slate-600",
            )}
          >
            Solicitante
          </span>
          <div className="flex items-center gap-2 p-2 rounded-xl bg-blue-500/10 border border-blue-500/30">
            <User size={14} className="text-blue-600 dark:text-blue-400" />
            <div className="flex-1">
              <p
                className={cn(
                  "text-xs font-semibold",
                  isDark ? "text-white" : "text-slate-800",
                )}
              >
                {solicitante.name}
              </p>
              <p
                className={cn(
                  "text-[10px]",
                  isDark ? "text-white/60" : "text-slate-600",
                )}
              >
                {formatPhoneNumber(solicitante.phone)}
              </p>
            </div>
          </div>
        </div>
        {prestador && (
          <div className="col-span-2">
            <span
              className={cn(
                "text-[10px] uppercase font-bold block mb-1",
                isDark ? "text-white/50" : "text-slate-600",
              )}
            >
              Prestador (Quem Aceitou)
            </span>
            <div className="flex items-center gap-2 p-2 rounded-xl bg-green-500/10 border border-green-500/30">
              <Truck size={14} className="text-green-600 dark:text-green-400" />
              <div className="flex-1">
                <p
                  className={cn(
                    "text-xs font-semibold",
                    isDark ? "text-white" : "text-slate-800",
                  )}
                >
                  {prestador.name}
                </p>
                <p
                  className={cn(
                    "text-[10px]",
                    isDark ? "text-white/60" : "text-slate-600",
                  )}
                >
                  {formatPhoneNumber(prestador.phone)}
                </p>
              </div>
            </div>
          </div>
        )}
        <div className="col-span-2">
          <span
            className={cn(
              "text-[10px] uppercase font-bold block mb-0.5",
              isDark ? "text-white/50" : "text-slate-600",
            )}
          >
            Localização
          </span>
          <a
            href={call.location}
            target="_blank"
            rel="noreferrer"
            className={cn(
              "flex items-center gap-1 hover:underline text-xs font-medium truncate transition-colors",
              isDark
                ? "text-orange-300 hover:text-orange-200"
                : "text-orange-600 hover:text-orange-500",
            )}
          >
            <MapPin size={12} /> {call.location} <ExternalLink size={10} />
          </a>
        </div>
        {call.status === "CONCLUIDO" && isRequester && (
          <div className="col-span-2 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 mt-2">
            <div className="flex justify-between items-center">
              <span
                className={cn(
                  "text-xs font-bold",
                  isDark ? "text-yellow-200" : "text-yellow-800",
                )}
              >
                {call.rating ? "Sua Avaliação:" : "Avalie o apoio:"}
              </span>
              <StarRating
                rating={call.rating || 0}
                readOnly={!!call.rating}
                onRate={(r) => onRateDriver(call.id, call.assignedTo, r)}
              />
            </div>
          </div>
        )}
        {call.securityCode && call.status !== "CONCLUIDO" && isRequester && (
          <div className="col-span-2 p-2 rounded-xl border border-dashed border-primary/50 bg-primary/5 flex items-center justify-between">
            <span className="text-xs font-bold text-primary flex items-center gap-2">
              <Lock size={12} /> PIN DE SEGURANÇA:
            </span>
            <span className="text-sm font-mono font-bold text-primary tracking-widest bg-white/50 dark:bg-black/20 px-2 rounded">
              {call.securityCode}
            </span>
          </div>
        )}
        {call.cargoPhotoUrl && (
          <div className="col-span-2 p-2 rounded-xl bg-orange-500/10 dark:bg-orange-500/10 border border-orange-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon
                  size={14}
                  className="text-orange-600 dark:text-orange-400"
                />
                <span className="text-xs font-semibold text-foreground dark:text-white">
                  Foto da Carga Disponível
                </span>
              </div>
              <a
                href={call.cargoPhotoUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 transition-all shadow-md"
              >
                <Download size={12} /> <span>Baixar</span>
              </a>
            </div>
          </div>
        )}
      </div>

      {["EM ANDAMENTO", "ABERTO", "AGUARDANDO_APROVACAO"].includes(
        call.status,
      ) && (
        <div
          className={cn(
            "p-3 backdrop-blur-xl border-t flex justify-end gap-2 flex-wrap",
            isDark
              ? "bg-slate-800/90 border-slate-600/50"
              : "bg-orange-50/60 border-orange-200/50",
          )}
        >
          {otherParty && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleWhatsAppClick}
              className="h-8 text-xs gap-1.5 border-green-400/30 text-green-300 hover:bg-green-500/20 hover:text-green-200 backdrop-blur-xl rounded-xl"
            >
              <Phone size={14} /> Contatar
            </Button>
          )}
          {!isRequester && call.status === "EM ANDAMENTO" && (
            <>
              {showPinInput ? (
                <div className="flex gap-2 w-full animate-in fade-in slide-in-from-bottom-2">
                  <input
                    type="text"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="PIN"
                    className="h-8 w-20 text-center rounded-xl border border-slate-300 text-xs text-slate-800"
                  />
                  <Button
                    size="sm"
                    onClick={handleVerifyAndFinish}
                    className="h-8 text-xs bg-green-600 hover:bg-green-700 text-white rounded-xl flex-1"
                  >
                    Confirmar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowPinInput(false)}
                    className="h-8 text-xs rounded-xl"
                  >
                    X
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setShowPinInput(true)}
                  className="h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg shadow-primary/30"
                >
                  <CheckCircle size={14} className="mr-1" /> Encaminhar para
                  Aprovação
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCancelSupport(call.id)}
                className="h-8 text-xs text-red-300 hover:bg-red-500/20 rounded-xl"
              >
                Cancelar
              </Button>
            </>
          )}
          {isRequester && call.status !== "CONCLUIDO" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDeleteSupportRequest(call.id)}
              className="h-8 text-xs text-red-300 hover:bg-red-500/20 rounded-xl"
            >
              <XCircle size={14} className="mr-1" /> Cancelar Pedido
            </Button>
          )}
        </div>
      )}
    </Card>
  );
};

export const DriverInterface: React.FC<DriverInterfaceProps> = ({ driver }) => {
  const [allMyCalls, setAllMyCalls] = useState<SupportCall[]>([]);
  const [openSupportCalls, setOpenSupportCalls] = useState<SupportCall[]>([]);
  const [allDrivers, setAllDrivers] = useState<Driver[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [initialTabSet, setInitialTabSet] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [localDriverStatus, setLocalDriverStatus] = useState<string>(
    driver?.status || "INDISPONIVEL",
  );

  const [location, setLocation] = useState("");
  const [coordinates, setCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");
  const [packageCount, setPackageCount] = useState("");
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [deliveryRegions, setDeliveryRegions] = useState([""]);
  const [neededVehicles, setNeededVehicles] = useState([""]);
  const [hub, setHub] = useState("");
  const [isBulky, setIsBulky] = useState(false);
  const [cargoPhoto, setCargoPhoto] = useState<File | null>(null);
  const [cargoPhotoPreview, setCargoPhotoPreview] = useState<string | null>(
    null,
  );
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [gender, setGender] = useState<string>("");
  const [hubSearch, setHubSearch] = useState("");
  const [isHubDropdownOpen, setIsHubDropdownOpen] = useState(false);
  const [shopeeId, setShopeeId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isReauthModalOpen, setIsReauthModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [reauthError, setReauthError] = useState("");
  const [isReauthenticating, setIsReauthenticating] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date());

  // --- STATE DO LOTTIE ---
  const [bgAnimation, setBgAnimation] = useState<any>(null);

  const [installPrompt, setInstallPrompt] = useState<any>(null);

  const [historyFilter, setHistoryFilter] = useState<
    "all" | "requester" | "provider" | "inProgress"
  >("all");
  const [startDate, setStartDate] = useState<Date | undefined>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d;
  });
  const [endDate, setEndDate] = useState<Date | undefined>(() => new Date());

  const [routeIdSearch, setRouteIdSearch] = useState("");
  const globalHubFilter = "Todos os Hubs";
  const [isMuted, setIsMuted] = useState(false);
  const [isProfileWarningVisible, setIsProfileWarningVisible] = useState(true);
  const [acceptingCallId, setAcceptingCallId] = useState<string | null>(null);

  const [runTour, setRunTour] = useState(false);
  const [tourStepIndex, setTourStepIndex] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const userId = auth.currentUser?.uid;
  const isInitialOpenCallsLoad = useRef(true);

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  const isProfileEditingLocked = useMemo(() => {
    return localDriverStatus !== "INDISPONIVEL";
  }, [localDriverStatus]);

  // ==========================================
  // CONFIGURAÇÃO DO TOUR (CORRIGIDA - REMOVIDO ARRAYS DE IMAGENS)
  // ==========================================
  // ==========================================
  // CONFIGURAÇÃO DO TOUR (CORRIGIDA - PASSO FINAL)
  // ==========================================
  const tourSteps: Step[] = [
    {
      target: "body",
      content:
        "Olá parceiro! Sou o Shopito. Bem vindo a plataforma de apoio! 🚀",
      title: "Bem-vindo!",
      placement: "center",
      disableBeacon: true,
      data: { mood: "welcome" },
    },
    {
      target: ".tour-availability-switch",
      content:
        "Fique ONLINE aqui para começar a receber rotas. Quando estiver disponível, vamos te conectar com entregas! 💰",
      title: "Controle de Status",
      placement: "auto",
      data: { mood: "point-right" },
    },
    {
      target: "#weather-card-container",
      content:
        "Aqui você vê a previsão semanal. Se quiser detalhes, basta clicar no card para expandir.",
      title: "Previsão do Tempo",
      placement: "auto",
      data: { mood: "weather" },
      spotlightPadding: 10,
    },
    {
      target: ".tour-support-button",
      content:
        "⚠️ ATENÇÃO! Use isso APENAS em emergências reais com a carga. Não abuse, pois precisamos garantir que todos sejam atendidos!",
      title: "Socorro de Emergência",
      placement: "auto",
      data: { mood: "angry" },
    },
    {
      target: ".tour-history-section",
      content:
        "Aqui você acompanha seu sucesso e suas entregas finalizadas. Quanto mais você trabalha, mais você ganha! 📊",
      title: "Seu Histórico",
      placement: "auto",
      data: { mood: "ok" },
    },
    // ✅ NOVO: ABA MAPA
    {
      target: ".tour-map-section",
      content:
        "Este é seu QG Estratégico! 🗺️ No Mapa de Calor, as áreas em laranja mostram onde a demanda está alta. Use essa visão para se posicionar melhor e pegar mais rotas!",
      title: "Visão Estratégica",
      placement: "auto",
      data: {
        mood: "map",
      },
    },
    // ✅ NOVO: ABA RANKING
    {
      target: ".tour-ranking-section",
      content:
        "Quem são os lendas da estrada? 🏆 Aqui no Ranking, a gente celebra quem mais apoiou os colegas. Cada ajuda conta pontos. Bora buscar esse topo?",
      title: "Galeria de Campeões",
      placement: "auto",
      data: {
        mood: "ranking",
      },
    },
    {
      target: ".tour-profile-section",
      content:
        "Mantenha seus dados atualizados e sua senha segura aqui nesta aba.",
      title: "Seu Perfil",
      placement: "auto",
      data: { mood: "profile" },
    },
    {
      target: "#chatbot-tour-target",
      content:
        "Suporte 24hrs qualquer duvida é só falar comigo estou aqui para te auxiliar.",
      title: "Suporte 24H",
      placement: isMobile ? "top" : "left",
      data: { mood: "chicken" },
      spotlightPadding: 5,
      styles: {
        overlay: { backgroundColor: "transparent", mixBlendMode: "normal" },
        spotlight: { backgroundColor: "transparent" },
      },
    },

    {
      target: "body",
      content:
        "Tudo pronto! Agradecimentos especiais a Bruno Aschwanden pela criação dos mascotes! 🎉",
      title: "Vamos Começar!",
      placement: "center",
      data: {
        mood: "finale", // <--- Comemoracao
      },
    },
  ];

  usePresence(
    userId || null,
    "driver",
    driver
      ? {
          name: driver.name || "Motorista",
          email: auth.currentUser?.email || "",
        }
      : null,
    true,
  );

  const TABS = useMemo(
    () => [
      { id: "availability", label: "Status", icon: <Zap size={20} /> },
      { id: "support", label: "Apoio", icon: <AlertTriangle size={20} /> },
      { id: "activeCalls", label: "Chamados", icon: <Clock size={20} /> },
      { id: "map", label: "Mapa", icon: <MapIcon size={20} /> },
      { id: "ranking", label: "Ranking", icon: <Trophy size={20} /> },
      { id: "tutorial", label: "Ajuda", icon: <BookOpen size={20} /> },
      { id: "profile", label: "Perfil", icon: <User size={20} /> },
    ],
    [],
  );

  type TabId =
    | "availability"
    | "support"
    | "activeCalls"
    | "tutorial"
    | "profile"
    | "map"
    | "ranking";
  const [activeTab, setActiveTab] = useState<TabId>("profile");

  const isProfileComplete = useMemo(() => {
    if (!driver) return false;
    return !!(
      driver.hub &&
      driver.vehicleType &&
      driver.phone &&
      driver.name &&
      shopeeId &&
      !shopeeId.includes("Erro")
    );
  }, [driver, shopeeId]);

  const activeCallForDriver = useMemo(() => {
    return (
      allMyCalls.find(
        (call) =>
          call.solicitante.id === userId &&
          ["ABERTO", "EM ANDAMENTO", "AGUARDANDO_APROVACAO"].includes(
            call.status,
          ),
      ) || null
    );
  }, [allMyCalls, userId]);

  const activeProviderCall = useMemo(() => {
    return allMyCalls.find(
      (c) => c.assignedTo === userId && ["EM ANDAMENTO"].includes(c.status),
    );
  }, [allMyCalls, userId]);

  const driverWithLocalStatus = useMemo(() => {
    return {
      ...driver,
      status: localDriverStatus as
        | "DISPONIVEL"
        | "INDISPONIVEL"
        | "EM_ROTA"
        | "OFFLINE",
    };
  }, [driver, localDriverStatus]);

  const filteredHubs = useMemo(() => {
    if (!hubSearch) return HUBS;
    return HUBS.filter((h) =>
      h.toLowerCase().includes(hubSearch.toLowerCase()),
    );
  }, [hubSearch]);

  const filteredCalls = useMemo(() => {
    const active = allMyCalls.filter(
      (c) =>
        (globalHubFilter === "Todos os Hubs" || c.hub === globalHubFilter) &&
        c.status !== "EXCLUIDO",
    );
    if (historyFilter === "requester")
      return active.filter((c) => c.solicitante.id === userId);
    if (historyFilter === "provider")
      return active.filter((c) => c.assignedTo === userId);
    if (historyFilter === "inProgress")
      return active.filter((c) =>
        ["EM ANDAMENTO", "AGUARDANDO_APROVACAO"].includes(c.status),
      );
    return active;
  }, [allMyCalls, historyFilter, userId, globalHubFilter]);

  // src/components/DriverInterface.tsx

  const filteredOpenCalls = useMemo(
    () =>
      openSupportCalls.filter(
        (c) =>
          c.solicitante.id !== userId && // <--- CORREÇÃO: Filtro explícito de segurança
          (globalHubFilter === "Todos os Hubs" || c.hub === globalHubFilter) &&
          (!routeIdSearch ||
            c.routeId?.toLowerCase().includes(routeIdSearch.toLowerCase())),
      ),
    [openSupportCalls, routeIdSearch, globalHubFilter, userId], // <--- Adicionado userId nas dependências
  );
  const rankedDrivers = useMemo(() => {
    return [...allDrivers]
      .filter((d) => (d as any).completedSupports > 0)
      .sort((a, b) => {
        const supportsA = (a as any).completedSupports || 0;
        const supportsB = (b as any).completedSupports || 0;
        if (supportsA !== supportsB) return supportsB - supportsA;
        const ratingA = (a as any).ratingAverage || 0;
        const ratingB = (b as any).ratingAverage || 0;
        return ratingB - ratingA;
      })
      .slice(0, 10);
  }, [allDrivers]);

  // --- EFEITO PARA CARREGAR O JSON DE ANIMAÇÃO ---
  useEffect(() => {
    if (activeTab === "ranking" && !bgAnimation) {
      fetch("/SynthRunner.json")
        .then((response) => {
          if (!response.ok) throw new Error("Erro ao carregar JSON");
          return response.json();
        })
        .then((data) => setBgAnimation(data))
        .catch((err) =>
          console.error("Falha ao carregar animação Lottie:", err),
        );
    }
  }, [activeTab, bgAnimation]);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () =>
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
  }, []);

  const handleInstallPWA = () => {
    if (installPrompt) {
      installPrompt.prompt();
      installPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === "accepted") setInstallPrompt(null);
      });
    }
  };

  useEffect(() => {
    const updateDateTime = () => {
      const brazilTime = new Date(
        new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }),
      );
      setCurrentDateTime(brazilTime);
    };
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleTheme = () => {
    const root = window.document.documentElement;
    const newTheme = theme === "light" ? "dark" : "light";
    root.classList.remove("light", "dark");
    root.classList.add(newTheme);
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  useEffect(() => {
    if (isProfileComplete && !initialTabSet) {
      setActiveTab("availability");
      setInitialTabSet(true);
    } else if (!isProfileComplete && !initialTabSet) {
      setActiveTab("profile");
      setInitialTabSet(true);
    }
  }, [isProfileComplete, initialTabSet]);

  useEffect(() => {
    if (!isProfileComplete && !runTour && activeTab !== "profile") {
      setActiveTab("profile");
      showNotification(
        "error",
        "Perfil Incompleto",
        "Por favor, preencha seus dados.",
      );
    }
  }, [isProfileComplete, runTour, activeTab]);

  useEffect(() => {
    if (driver) {
      setName(driver.name || "");
      setPhone(driver.phone || "");
      setHub(driver.hub || "");
      setVehicleType(driver.vehicleType || "");
      setGender((driver as any).gender || "Homem");
      setHubSearch(driver.hub || "");
      setLocalDriverStatus(driver.status || "INDISPONIVEL");
    }
  }, [driver]);

  useEffect(() => {
    const tourKey = `driver-tour-seen-v35-${userId}`;
    const hasSeenTour = localStorage.getItem(tourKey);
    if (!hasSeenTour) {
      setTimeout(() => setRunTour(true), 2000);
    }
  }, [driver, userId]);

  // ==========================================
  // CALLBACK DE NAVEGAÇÃO DO JOYRIDE (ATUALIZADO)
  // ==========================================
  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type, index, action } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (type === EVENTS.STEP_AFTER) {
      // Avançar (Next)
      if (action === ACTIONS.NEXT) {
        const nextIndex = index + 1;
        if (nextIndex === 1) setActiveTab("availability");
        if (nextIndex === 2) setActiveTab("availability");
        if (nextIndex === 3) setActiveTab("support");
        if (nextIndex === 4) setActiveTab("activeCalls");
        if (nextIndex === 5) setActiveTab("map"); // Abre a aba Mapa
        if (nextIndex === 6) setActiveTab("ranking"); // Abre a aba Ranking
        if (nextIndex === 7) setActiveTab("profile"); // Abre a aba Perfil
        setTimeout(() => {
          setTourStepIndex(nextIndex);
        }, 400);
      }
      // Voltar (Prev)
      if (action === ACTIONS.PREV) {
        const prevIndex = index - 1;
        if (prevIndex === 1) setActiveTab("availability");
        if (prevIndex === 2) setActiveTab("availability");
        if (prevIndex === 3) setActiveTab("support");
        if (prevIndex === 4) setActiveTab("activeCalls");
        if (prevIndex === 5) setActiveTab("map");
        if (prevIndex === 6) setActiveTab("ranking");
        if (prevIndex === 7) setActiveTab("profile");
        setTimeout(() => setTourStepIndex(prevIndex), 400);
      }
    }

    if (finishedStatuses.includes(status)) {
      setRunTour(false);
      if (userId) {
        localStorage.setItem(`driver-tour-seen-v35-${userId}`, "true");
      }
      if (status === STATUS.FINISHED) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 8000);
      }
    }
  };

  useEffect(() => {
    const fetchShopeeId = async () => {
      if (driver?.uid) {
        setShopeeId("Carregando...");
        const driversRef = collection(db, "motoristas_pre_aprovados");
        const q = query(
          driversRef,
          or(
            where("uid", "==", driver.uid),
            where("googleUid", "==", driver.uid),
          ),
        );
        try {
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) setShopeeId(querySnapshot.docs[0].id);
          else setShopeeId("Não encontrado");
        } catch (error) {
          setShopeeId("Erro ao buscar");
        }
      }
    };
    fetchShopeeId();
  }, [driver?.uid]);

  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    localStorage.setItem("notificationsMuted", String(newMutedState));
    if (!newMutedState) {
      const audio = new Audio("/shopee-ringtone.mp3");
      audio.volume = 0.3;
      audio.play().catch(() => {});
    }
    sonnerToast.custom((t) => (
      <div className="flex w-full max-w-sm items-center gap-4 rounded-xl bg-slate-800/95 backdrop-blur-xl p-4 shadow-xl border border-orange-500/30 ring-1 ring-black/5">
        <div
          className={cn(
            "p-2 rounded-full",
            newMutedState
              ? "bg-red-500/20 text-red-300 border border-red-400/30"
              : "bg-green-500/20 text-green-300 border border-green-400/30",
          )}
        >
          {newMutedState ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm text-white">
            {newMutedState ? "Silenciado" : "Som Ativado"}
          </p>
        </div>
        <button
          onClick={() => sonnerToast.dismiss(t)}
          className="text-white/50 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>
      </div>
    ));
  };

  const triggerNotificationRef = useRef((_newCall: SupportCall) => {});
  useEffect(() => {
    triggerNotificationRef.current = (newCall: SupportCall) => {
      if (
        localDriverStatus !== "DISPONIVEL" ||
        sessionNotifiedCallIds.has(newCall.id)
      )
        return;
      if (!isMuted) {
        const audio = new Audio("/shopee-ringtone.mp3");
        audio.play().catch(() => {});
      }
      sonnerToast.custom((t) => (
        <div className="flex w-full bg-slate-800/95 backdrop-blur-xl border-l-4 border-primary p-4 rounded-xl shadow-xl shadow-black/30 border border-orange-500/30">
          <div className="flex-1">
            <p className="font-bold text-white">Novo Apoio Solicitado</p>
            <p className="text-sm text-white/70">
              {newCall.solicitante.name} precisa de ajuda.
            </p>
          </div>
          <button
            onClick={() => sonnerToast.dismiss(t)}
            className="text-white/50 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
      ));
      sessionNotifiedCallIds.add(newCall.id);
    };
  }, [localDriverStatus, isMuted]);

  useEffect(() => {
    if (!userId) return;
    const allDriversQuery = query(collection(db, "motoristas_pre_aprovados"));
    const unsubscribeAllDrivers = onSnapshot(allDriversQuery, (snapshot) => {
      const driversData = snapshot.docs.map(
        (doc) => ({ ...doc.data(), uid: doc.id }) as Driver,
      );
      setAllDrivers(driversData);
    });

    const start = startDate ? new Date(startDate) : new Date(0);
    start.setHours(0, 0, 0, 0);
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    const myCallsQuery = query(
      collection(db, "supportCalls"),
      and(
        or(
          where("solicitante.id", "==", userId),
          where("assignedTo", "==", userId),
        ),
        where("timestamp", ">=", Timestamp.fromDate(start)),
        where("timestamp", "<=", Timestamp.fromDate(end)),
      ),
      orderBy("timestamp", "desc"),
    );
    const unsubscribeMyCalls = onSnapshot(myCallsQuery, (snapshot) => {
      const callsData = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as SupportCall,
      );
      setAllMyCalls(callsData);
    });

    const openCallsQuery = query(
      collection(db, "supportCalls"),
      where("status", "==", "ABERTO"),
    );
    const unsubscribeOpenCalls = onSnapshot(openCallsQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const callData = {
          id: change.doc.id,
          ...change.doc.data(),
        } as SupportCall;
        if (callData.solicitante.id !== userId) {
          if (change.type === "added" && !isInitialOpenCallsLoad.current)
            triggerNotificationRef.current(callData);
          if (change.type === "removed")
            sessionNotifiedCallIds.delete(callData.id);
        }
      });
      isInitialOpenCallsLoad.current = false;
      const openCallsData = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as SupportCall,
      );
      setOpenSupportCalls(
        openCallsData.filter((call) => call.solicitante.id !== userId),
      );
    });

    return () => {
      unsubscribeMyCalls();
      unsubscribeOpenCalls();
      unsubscribeAllDrivers();
    };
  }, [userId, startDate, endDate]);

  const updateDriver = async (
    driverId: string,
    updates: Partial<Omit<Driver, "uid">>,
  ) => {
    if (!driverId) return;
    await updateDoc(doc(db, "motoristas_pre_aprovados", driverId), updates);
  };

  const updateCall = async (
    id: string,
    updates: Partial<Omit<SupportCall, "id">>,
  ) => {
    await updateDoc(doc(db, "supportCalls", id), updates as any);
  };

  const addNewCall = async (newCall: any) => {
    await addDoc(collection(db, "supportCalls"), {
      ...newCall,
      timestamp: serverTimestamp(),
    });
  };

  const handleAddField = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
  ) => setter((prev) => [...prev, ""]);
  const handleRemoveField = (
    index: number,
    setter: React.Dispatch<React.SetStateAction<string[]>>,
  ) => setter((prev) => prev.filter((_, i) => i !== index));
  const handleFieldChange = (
    index: number,
    value: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>,
  ) =>
    setter((prev) => {
      const newValues = [...prev];
      newValues[index] = value;
      return newValues;
    });

  const handleAvailabilityChange = async (isAvailable: boolean) => {
    if (!isProfileComplete || !shopeeId)
      return showNotification(
        "error",
        "Perfil Incompleto",
        "Verifique seus dados.",
      );
    if (isAvailable && (activeCallForDriver || activeProviderCall))
      return showNotification(
        "error",
        "Ocupado",
        "Você tem chamados ativos. Finalize-os antes.",
      );
    const newStatus = isAvailable ? "DISPONIVEL" : "INDISPONIVEL";
    setLocalDriverStatus(newStatus);
    try {
      await updateDriver(shopeeId, { status: newStatus });
    } catch (error) {
      setLocalDriverStatus(driver.status || "INDISPONIVEL");
      showNotification("error", "Erro", "Falha ao atualizar status.");
    }
  };

  const handleAcceptCall = async (callId: string) => {
    if (!isProfileComplete || !userId || !shopeeId)
      return showNotification("error", "Erro", "Perfil incompleto.");
    if (localDriverStatus === "EM_ROTA")
      return showNotification("error", "Ocupado", "Você já está em rota.");
    setAcceptingCallId(callId);
    setLocalDriverStatus("EM_ROTA");
    try {
      await updateCall(callId, {
        assignedTo: userId,
        status: "EM ANDAMENTO",
        prestador: {
          id: driver.uid,
          name: driver.name,
          avatar: driver.avatar || null,
          initials:
            driver.initials || driver.name?.charAt(0).toUpperCase() || "M",
          phone: driver.phone,
        },
      } as any);
      // REGRA 3B: Marca motorista prestador como INDISPONIVEL ao aceitar chamado
      await updateDriver(shopeeId, { status: "INDISPONIVEL" });
      await updateDriver(shopeeId, { status: "EM_ROTA" });
    } catch {
      setLocalDriverStatus(driver.status || "INDISPONIVEL");
      showNotification("error", "Erro", "Falha ao aceitar.");
    } finally {
      setAcceptingCallId(null);
    }
  };

  const handleRequestApproval = async (id: string) => {
    await updateCall(id, {
      status: "CONCLUIDO",
      securityCode: deleteField(),
    } as any);
    if (shopeeId) {
      const driverRef = doc(db, "motoristas_pre_aprovados", shopeeId);
      await updateDoc(driverRef, { completedSupports: increment(1) });
    }
    showNotification(
      "success",
      "Sucesso",
      "Chamado concluído e contabilizado!",
    );
  };

  const handleCancelSupport = async (id: string) => {
    if (!userId || !shopeeId) return;
    setLocalDriverStatus("DISPONIVEL");
    try {
      await updateCall(id, {
        assignedTo: deleteField(),
        status: "ABERTO",
      } as any);
      await updateDriver(shopeeId, { status: "DISPONIVEL" });
      showNotification("success", "Cancelado", "Apoio cancelado.");
    } catch {
      setLocalDriverStatus(driver.status || "INDISPONIVEL");
      showNotification("error", "Erro", "Falha ao cancelar.");
    }
  };

  const onDeleteSupportRequest = async (id: string) => {
    await updateCall(id, {
      status: "EXCLUIDO",
      deletedAt: serverTimestamp(),
    } as any);
    showNotification("success", "Excluído", "Solicitação removida.");
  };

  const handleRateDriver = async (
    callId: string,
    driverUid: string,
    ratingValue: number,
  ) => {
    if (!driverUid)
      return showNotification("error", "Erro", "Motorista não encontrado.");
    try {
      const q = query(
        collection(db, "motoristas_pre_aprovados"),
        where("uid", "==", driverUid),
      );
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty)
        throw new Error("Perfil do motorista não encontrado para avaliação.");
      const driverDocRef = querySnapshot.docs[0].ref;
      const callDocRef = doc(db, "supportCalls", callId);
      await runTransaction(db, async (transaction) => {
        const driverDoc = await transaction.get(driverDocRef);
        if (!driverDoc.exists()) throw new Error("Motorista não existe!");
        const data = driverDoc.data();
        const currentAvg = data.ratingAverage || 5.0;
        const currentCount = data.ratingCount || 0;
        const newCount = currentCount + 1;
        const newAvg = (currentAvg * currentCount + ratingValue) / newCount;
        transaction.update(driverDocRef, {
          ratingAverage: newAvg,
          ratingCount: newCount,
        });
        transaction.update(callDocRef, { rating: ratingValue });
      });
      showNotification(
        "success",
        "Avaliado!",
        `Você deu ${ratingValue} estrelas.`,
      );
    } catch (error: any) {
      showNotification(
        "error",
        "Erro",
        "Falha ao enviar avaliação: " + error.message,
      );
    }
  };

  const handleUpdateProfile = async () => {
    if (!shopeeId) return;
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length !== 11)
      return showNotification("error", "Telefone", "Use DDD + 9 dígitos.");
    if (!HUBS.includes(hub as any))
      return showNotification("error", "Hub", "Selecione um Hub válido.");
    await updateDriver(shopeeId, {
      name,
      phone: cleanPhone,
      hub,
      vehicleType,
      gender,
    } as any);
    showNotification("success", "Salvo", "Perfil atualizado.");
    setIsProfileWarningVisible(false);
  };

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      showNotification("error", "Erro", "Senhas não conferem.");
      return;
    }
    if (newPassword.length < 6) {
      showNotification("error", "Erro", "Senha muito curta.");
      return;
    }
    setIsReauthModalOpen(true);
  };

  const handleReauthenticateAndChange = async () => {
    const user = auth.currentUser;
    if (!user || !user.email) return;
    setIsReauthenticating(true);
    try {
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword,
      );
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      showNotification("success", "Sucesso", "Senha alterada.");
      setIsReauthModalOpen(false);
      setNewPassword("");
      setConfirmPassword("");
      setCurrentPassword("");
    } catch {
      setReauthError("Senha incorreta.");
    } finally {
      setIsReauthenticating(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !shopeeId) return;
    setIsUploading(true);
    if (driver.avatar) {
      try {
        await deleteObject(ref(storage, driver.avatar));
      } catch {}
    }
    const storageRef = ref(storage, `avatars/${shopeeId}/avatar.jpg`);
    const uploadTask = uploadBytesResumable(storageRef, file);
    uploadTask.on(
      "state_changed",
      null,
      (err) => {
        setIsUploading(false);
        showNotification("error", "Erro", err.message);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((url) => {
          updateDriver(shopeeId, { avatar: url });
          setIsUploading(false);
          showNotification("success", "Foto", "Atualizada com sucesso.");
        });
      },
    );
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setModalError("Geolocalização não suportada.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoordinates({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setLocation(
          `http://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`,
        );
        setIsLocating(false);
      },
      () => {
        setModalError("Erro ao obter localização.");
        setIsLocating(false);
      },
    );
  };

  const handleCargoPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setModalError("A imagem deve ter no máximo 5MB.");
        return;
      }
      setCargoPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCargoPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVoiceInput = (
    field: "reason" | "description",
    setter: React.Dispatch<React.SetStateAction<string>>,
  ) => {
    if (!("webkitSpeechRecognition" in window))
      return showNotification(
        "error",
        "Não Suportado",
        "Seu navegador não suporta voz.",
      );
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = "pt-BR";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => {
      setIsListening(true);
      showNotification("info", "Ouvindo...", "Pode falar agora.");
    };
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setter((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };
    recognition.start();
  };

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setModalError("");
    const user = auth.currentUser;
    if (!user || !driver) {
      setIsSubmitting(false);
      return;
    }
    if (activeCallForDriver) {
      setModalError("Você já tem uma solicitação de apoio em aberto.");
      setIsSubmitting(false);
      return;
    }
    const pkg = Number(packageCount);
    const regions = deliveryRegions.filter(Boolean);
    const vehicles = neededVehicles.filter(Boolean);
    if (pkg < 20) {
      setModalError("Mínimo 20 pacotes.");
      setIsSubmitting(false);
      return;
    }
    if (
      !location ||
      !hub ||
      !reason ||
      !description ||
      regions.length === 0 ||
      vehicles.length === 0
    ) {
      setModalError("Preencha todos os campos.");
      setIsSubmitting(false);
      return;
    }
    let cargoPhotoUrl = null;
    if (cargoPhoto) {
      try {
        setIsUploadingPhoto(true);
        const photoRef = ref(
          storage,
          `cargo-photos/${user.uid}/${Date.now()}_${cargoPhoto.name}`,
        );
        await uploadBytesResumable(photoRef, cargoPhoto);
        cargoPhotoUrl = await getDownloadURL(photoRef);
      } catch (err: any) {
        setModalError("Erro ao fazer upload da foto: " + err.message);
        setIsSubmitting(false);
        setIsUploadingPhoto(false);
        return;
      } finally {
        setIsUploadingPhoto(false);
      }
    }
    const informalDesc = `MOTIVO: ${reason}. DETALHES: ${description}. Hub: ${hub}. Loc: ${location}. Qtd: ${pkg}. Regiões: ${regions.join(", ")}. Veículos: ${vehicles.join(", ")}. ${isBulky ? "VOLUMOSO" : ""}`;
    try {
      let urgency: UrgencyLevel = "BAIXA";
      if (pkg >= 100) urgency = "URGENTE";
      else if (pkg >= 90) urgency = "ALTA";
      else if (pkg >= 60) urgency = "MEDIA";
      const newCall = {
        routeId: `SPX-${Date.now().toString().slice(-6)}`,
        description: informalDesc,
        urgency,
        location,
        collectionLocation: location, // [CORREÇÃO] Campo reintegrado para satisfazer a validação
        status: "ABERTO",
        securityCode: generateSecurityCode(),
        vehicleType: vehicles.join(", "),
        isBulky,
        hub,
        packageCount: pkg,
        deliveryRegions: regions,
        cargoPhotoUrl,
        coordinates: coordinates
          ? new GeoPoint(coordinates.lat, coordinates.lng)
          : null,
        solicitante: {
          id: driver.uid,
          name: driver.name,
          avatar: driver.avatar || null,
          initials:
            driver.initials || driver.name?.charAt(0).toUpperCase() || "M",
          phone: driver.phone,
        },
      };
      await addNewCall(newCall);
      // REGRA 3A: Marca motorista como INDISPONIVEL ao enviar solicitação
      if (shopeeId) {
        await updateDriver(shopeeId, { status: "INDISPONIVEL" });
        setLocalDriverStatus("INDISPONIVEL");
      }
      setIsSupportModalOpen(false);
      setShowSuccessModal(true);
      setDeliveryRegions([""]);
      setNeededVehicles([""]);
      setReason("");
      setDescription("");
      setPackageCount("");
      setCargoPhoto(null);
      setCargoPhotoPreview(null);
      setCoordinates(null);
    } catch (err: any) {
      setModalError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <LoadingOverlay
        isLoading={isSubmitting || isReauthenticating}
        text="Processando..."
      />
      <Joyride
        steps={tourSteps}
        run={runTour}
        stepIndex={tourStepIndex}
        continuous
        showProgress
        showSkipButton
        disableOverlayClose={true}
        tooltipComponent={CustomTooltip}
        callback={handleJoyrideCallback}
        scrollOffset={isMobile ? 120 : 130}
        disableScrollParentFix={false}
        spotlightClicks={true}
        floaterProps={{ disableAnimation: true, offset: 24 }}
        spotlightPadding={10}
        disableOverlay={!runTour}
        styles={{ options: { zIndex: 10000, primaryColor: "#EE4D2D" } }}
      />
      {showConfetti && <Confetti numberOfPieces={500} recycle={false} />}
      <div
        className="min-h-dvh font-sans pb-24 transition-colors duration-300"
        style={{
          background:
            theme === "dark"
              ? "linear-gradient(180deg, #1a0a05 0%, #2d0f08 30%, #1a0a05 60%, #0f0503 100%)"
              : "linear-gradient(180deg, #FFF5F0 0%, #FFE8E0 30%, #FFDBD0 60%, #FFCCC0 100%)",
          backgroundAttachment: "fixed",
        }}
      >
        <header
          className={cn(
            "sticky top-0 z-30 px-4 sm:px-6 py-4 flex justify-between items-center backdrop-blur-xl border-b transition-all",
            theme === "dark"
              ? "border-orange-500/30 bg-slate-900/85"
              : "border-orange-400/30 bg-white/85",
          )}
          style={{ backdropFilter: "blur(12px)" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-primary-foreground bg-primary shadow-lg">
              <ArrowRightLeft size={20} strokeWidth={2.5} />
            </div>
            <h1 className="font-bold text-base tracking-tight text-slate-900">
              Sistema Logístico
            </h1>
          </div>
          <div className="flex gap-2">
            {installPrompt && (
              <button
                onClick={handleInstallPWA}
                className="w-10 h-10 rounded-xl flex items-center justify-center bg-accent animate-pulse"
                title="Instalar App"
              >
                <Smartphone size={20} className="text-primary" />
              </button>
            )}
            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
              aria-label="Alternar tema"
            >
              {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <button
              onClick={() => auth.signOut()}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
              aria-label="Sair"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        {!isProfileComplete && isProfileWarningVisible && (
          <div className="mx-4 mt-4 p-4 rounded-2xl flex justify-between items-center bg-orange-500/10 dark:bg-orange-500/10 border border-orange-500/30 dark:border-orange-500/30 shadow-lg">
            <div className="flex items-center gap-3">
              <AlertTriangle
                size={20}
                className="text-orange-500 dark:text-orange-400"
              />
              <div>
                <p className="font-bold text-orange-600 dark:text-orange-400 text-sm">
                  Atenção
                </p>
                <p className="text-xs text-muted-foreground">
                  Complete seu perfil para operar.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsProfileWarningVisible(false)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <main className="p-4 sm:p-6 max-w-lg lg:max-w-4xl xl:max-w-6xl mx-auto space-y-6">
          {isUploading && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
              <Loading size="lg" variant="spinner" text="Enviando imagem..." />
            </div>
          )}
          <div id="weather-card-container">
            <ProfileHeaderCard
              driver={driverWithLocalStatus}
              isUploading={isUploading}
              onEditClick={() => fileInputRef.current?.click()}
              activeCall={activeCallForDriver}
              theme={theme}
              currentDateTime={currentDateTime}
            />
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarUpload}
            className="hidden"
            accept="image/*"
          />

          <div
            className={cn(
              "p-1.5 rounded-2xl flex justify-between overflow-x-auto scrollbar-hide border shadow-lg transition-all duration-300",
              theme === "light"
                ? "bg-white/80 backdrop-blur-xl border-orange-200/50"
                : "bg-slate-900/40 backdrop-blur-xl border-orange-500/30",
            )}
          >
            <TooltipProvider delayDuration={100}>
              {TABS.map((tab) => {
                const isDisabled = !isProfileComplete && tab.id !== "profile";
                return (
                  <Tooltip key={tab.id}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={(e) => {
                          if (isDisabled) {
                            e.preventDefault();
                            return;
                          }
                          setActiveTab(tab.id as TabId);
                        }}
                        className={cn(
                          "flex-1 flex flex-col items-center py-3 px-2 rounded-xl text-[10px] sm:text-xs uppercase font-bold tracking-wide min-w-[60px] sm:min-w-[80px] transition-all duration-300 ease-in-out",
                          activeTab === tab.id
                            ? "text-white bg-primary shadow-lg scale-105"
                            : theme === "light"
                              ? "text-slate-700 hover:text-slate-900 hover:bg-orange-50/80"
                              : "text-slate-300 hover:text-white hover:bg-orange-500/20",
                          isDisabled &&
                            "opacity-40 grayscale cursor-not-allowed",
                        )}
                      >
                        <div className="transition-transform duration-300">
                          {isDisabled ? (
                            <Lock size={20} className="text-slate-400 mb-1" />
                          ) : (
                            React.cloneElement(tab.icon, {
                              size: 20,
                              className: cn(
                                "mb-1 transition-all duration-300",
                                activeTab === tab.id && "scale-110",
                              ),
                            })
                          )}
                        </div>
                        <span className="hidden sm:inline">{tab.label}</span>
                        <span className="sm:hidden">
                          {tab.label.split(" ")[0]}
                        </span>
                      </button>
                    </TooltipTrigger>
                    {isDisabled && (
                      <TooltipContent
                        side="top"
                        className="max-w-xs text-center z-[10000] bg-slate-800 text-white border border-orange-500/50 shadow-xl"
                      >
                        <p className="font-bold text-[#EE4D2D] mb-1">
                          ACESSO RESTRITO 🔒
                        </p>
                        <p className="text-xs">
                          Preencha Nome, Telefone, Hub e Veículo na aba Perfil
                          para liberar o acesso ao sistema.
                        </p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                );
              })}
            </TooltipProvider>
          </div>

          <div className="min-h-[400px]">
            {activeTab === "availability" && (
              <div className="tab-content-enter tour-availability-switch">
                <StatusSection
                  driver={driverWithLocalStatus}
                  onAvailabilityChange={handleAvailabilityChange}
                  filteredOpenCalls={filteredOpenCalls}
                  routeIdSearch={routeIdSearch}
                  onRouteIdSearchChange={setRouteIdSearch}
                  acceptingCallId={acceptingCallId}
                  onAcceptCall={handleAcceptCall}
                  theme={theme}
                />
              </div>
            )}
            {activeTab === "map" && (
              <div className="tour-map-section h-[60vh] rounded-2xl overflow-hidden border border-orange-200/50 shadow-xl relative z-0">
                <MapContainer
                  center={[-25.4284, -49.2733]}
                  zoom={12}
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  />
                  {filteredOpenCalls.map((call) => {
                    const coords = (call as any).coordinates
                      ? [
                          (call as any).coordinates.latitude,
                          (call as any).coordinates.longitude,
                        ]
                      : getMockCoordinates(call.id);
                    return (
                      <React.Fragment key={call.id}>
                        <Circle
                          center={coords as any}
                          pathOptions={{
                            fillColor: "#f97316",
                            fillOpacity: 0.3,
                            color: "transparent",
                          }}
                          radius={800}
                        />
                        <Marker position={coords as any}>
                          <Popup>
                            <div className="text-center">
                              <p className="font-bold text-slate-800">
                                {call.packageCount} Pacotes
                              </p>
                              <p className="text-xs text-slate-500">
                                {call.routeId}
                              </p>
                              <Button
                                size="sm"
                                className="mt-2 w-full h-7 text-xs"
                                onClick={() => handleAcceptCall(call.id)}
                              >
                                Aceitar
                              </Button>
                            </div>
                          </Popup>
                        </Marker>
                      </React.Fragment>
                    );
                  })}
                </MapContainer>
                <div className="absolute top-2 right-2 bg-white/90 p-2 rounded-lg text-xs z-[1000] shadow-md border">
                  <p className="font-bold text-slate-700">Legenda</p>
                  <div className="flex items-center gap-1 mt-1">
                    <div className="w-3 h-3 rounded-full bg-orange-500/50"></div>
                    <span>Alta demanda</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "ranking" && (
              <div className="tour-ranking-section space-y-6 pb-20">
                <div className="flex justify-center items-end gap-4 pb-8 pt-4">
                  {rankedDrivers[1] && (
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-full border-4 border-slate-300 overflow-hidden shadow-lg mb-2 relative bg-slate-200">
                        <img
                          src={
                            rankedDrivers[1].avatar ||
                            `https://avatar.iran.liara.run/public/boy?username=${rankedDrivers[1].name}`
                          }
                          onError={(e) => {
                            e.currentTarget.src = `https://avatar.iran.liara.run/public/boy?username=${rankedDrivers[1].name}`;
                          }}
                          className="w-full h-full object-cover"
                          alt="2º Lugar"
                        />
                      </div>
                      <div className="h-24 w-20 bg-slate-300/90 backdrop-blur-sm rounded-t-xl flex items-end justify-center pb-2 shadow-inner border-t border-white/30">
                        <span className="text-3xl font-black text-white drop-shadow-md">
                          2
                        </span>
                      </div>
                      <p className="font-bold text-sm mt-1 text-slate-700 dark:text-slate-200 text-center truncate w-20">
                        {rankedDrivers[1].name.split(" ")[0]}
                      </p>
                      <div className="flex items-center gap-1 bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full text-[10px] font-bold mt-1">
                        <Star size={10} fill="currentColor" />{" "}
                        {(rankedDrivers[1] as any).ratingAverage?.toFixed(1) ||
                          "5.0"}
                      </div>
                    </div>
                  )}

                  {rankedDrivers[0] && (
                    <div className="flex flex-col items-center z-10 -mb-2">
                      <div className="relative">
                        <Trophy
                          className="absolute -top-8 left-1/2 -translate-x-1/2 text-yellow-400 drop-shadow-xl animate-bounce"
                          size={40}
                          fill="currentColor"
                        />
                        <div className="w-24 h-24 rounded-full border-4 border-yellow-400 overflow-hidden shadow-2xl mb-2 bg-slate-200 relative">
                          <img
                            src={
                              rankedDrivers[0].avatar ||
                              `https://avatar.iran.liara.run/public/boy?username=${rankedDrivers[0].name}`
                            }
                            onError={(e) => {
                              e.currentTarget.src = `https://avatar.iran.liara.run/public/boy?username=${rankedDrivers[0].name}`;
                            }}
                            className="w-full h-full object-cover"
                            alt="1º Lugar"
                          />
                        </div>
                      </div>
                      <div className="h-36 w-28 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-t-xl flex items-end justify-center pb-4 shadow-xl border-t border-yellow-300 relative overflow-hidden">
                        <div className="absolute inset-0 bg-white/20 animate-pulse" />
                        <span className="text-6xl font-black text-white drop-shadow-lg z-10">
                          1
                        </span>
                      </div>
                      <p className="font-bold text-lg mt-1 text-slate-800 dark:text-white text-center truncate w-28">
                        {rankedDrivers[0].name.split(" ")[0]}
                      </p>
                      <div className="flex items-center gap-1 bg-yellow-100 text-yellow-800 px-3 py-0.5 rounded-full text-xs font-bold mt-1 border border-yellow-200">
                        <Star size={12} fill="currentColor" />{" "}
                        {(rankedDrivers[0] as any).ratingAverage?.toFixed(1) ||
                          "5.0"}
                      </div>
                    </div>
                  )}

                  {rankedDrivers[2] && (
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-full border-4 border-orange-400 overflow-hidden shadow-lg mb-2 relative bg-slate-200">
                        <img
                          src={
                            rankedDrivers[2].avatar ||
                            `https://avatar.iran.liara.run/public/boy?username=${rankedDrivers[2].name}`
                          }
                          onError={(e) => {
                            e.currentTarget.src = `https://avatar.iran.liara.run/public/boy?username=${rankedDrivers[2].name}`;
                          }}
                          className="w-full h-full object-cover"
                          alt="3º Lugar"
                        />
                      </div>
                      <div className="h-20 w-20 bg-orange-400/90 backdrop-blur-sm rounded-t-xl flex items-end justify-center pb-2 shadow-inner border-t border-white/30">
                        <span className="text-3xl font-black text-white drop-shadow-md">
                          3
                        </span>
                      </div>
                      <p className="font-bold text-sm mt-1 text-slate-700 dark:text-slate-200 text-center truncate w-20">
                        {rankedDrivers[2].name.split(" ")[0]}
                      </p>
                      <div className="flex items-center gap-1 bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full text-[10px] font-bold mt-1">
                        <Star size={10} fill="currentColor" />{" "}
                        {(rankedDrivers[2] as any).ratingAverage?.toFixed(1) ||
                          "5.0"}
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative w-full h-80 rounded-3xl border border-orange-500/30 shadow-2xl overflow-hidden group transition-all hover:scale-[1.01]">
                  {/* LOTTIE ANIMATION BACKGROUND */}
                  {bgAnimation && (
                    <div
                      className={cn(
                        "absolute inset-0 w-full h-full z-0 pointer-events-none",
                        theme === "dark" ? "opacity-30" : "opacity-40",
                      )}
                    >
                      <Lottie
                        animationData={bgAnimation}
                        loop={true}
                        // A chave para o efeito "cover" é esta prop rendererSettings:
                        rendererSettings={{
                          preserveAspectRatio: "xMidYMid slice",
                        }}
                        className="w-full h-full"
                        style={{ width: "100%", height: "100%" }}
                      />
                    </div>
                  )}

                  <div
                    className={cn(
                      "absolute inset-0 z-0 backdrop-blur-[2px]",
                      theme === "dark"
                        ? "bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent"
                        : "bg-gradient-to-t from-white via-white/80 to-transparent",
                    )}
                  />
                  <div className="relative z-10 p-6 h-full flex flex-col">
                    <h3 className="text-lg font-black uppercase mb-4 flex items-center gap-2 tracking-wider">
                      <Trophy
                        size={20}
                        className="text-yellow-500 drop-shadow-md"
                        fill="currentColor"
                      />
                      <span
                        className={
                          theme === "dark" ? "text-white" : "text-slate-800"
                        }
                      >
                        Ranking Geral
                      </span>
                    </h3>
                    <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                      {rankedDrivers.slice(3).map((d, idx) => (
                        <div
                          key={d.uid}
                          className="flex items-center gap-4 p-3 bg-white/10 dark:bg-black/20 backdrop-blur-md rounded-2xl border border-white/10 hover:bg-white/20 transition-all"
                        >
                          <span className="w-8 text-center font-black text-xl text-slate-400/80">
                            {idx + 4}
                          </span>
                          <div className="w-12 h-12 rounded-full bg-slate-200 border-2 border-white/20 overflow-hidden">
                            <img
                              src={
                                d.avatar ||
                                `https://avatar.iran.liara.run/public/boy?username=${d.name}`
                              }
                              onError={(e) => {
                                e.currentTarget.src = `https://avatar.iran.liara.run/public/boy?username=${d.name}`;
                              }}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <p
                              className={cn(
                                "font-bold text-sm",
                                theme === "dark"
                                  ? "text-white"
                                  : "text-slate-900",
                              )}
                            >
                              {d.name}
                            </p>
                            <p className="text-xs text-slate-500 capitalize font-medium">
                              {d.vehicleType || "Carro"}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-yellow-500 font-bold text-sm justify-end drop-shadow-sm">
                              <Star size={12} fill="currentColor" />{" "}
                              {((d as any).ratingAverage || 5).toFixed(1)}
                            </div>
                            <p className="text-[10px] opacity-70 font-mono">
                              {(d as any).completedSupports || 0} apoios
                            </p>
                          </div>
                        </div>
                      ))}
                      {rankedDrivers.length <= 3 && (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                          <Trophy size={40} className="mb-2 text-slate-400" />
                          <p className="text-sm">
                            Ainda não há outros motoristas no ranking.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "support" && (
              <div className="tab-content-enter flex flex-col items-center justify-center py-8 space-y-6">
                <div className="w-20 h-20 bg-primary/20 dark:bg-primary/20 backdrop-blur-xl rounded-full flex items-center justify-center text-primary mb-2 border border-border dark:border-orange-500/30 shadow-xl shadow-black/5 dark:shadow-black/20">
                  <AlertTriangle size={40} />
                </div>
                <div className="text-center space-y-2 max-w-xs">
                  <h2 className="text-2xl font-bold text-foreground dark:text-white">
                    Precisa de Apoio?
                  </h2>
                  <p className="text-sm text-muted-foreground dark:text-white/70">
                    Solicite ajuda para transferir pacotes em caso de
                    imprevistos. Mínimo de 20 pacotes.
                  </p>
                </div>
                <Button
                  onClick={() => {
                    if (activeCallForDriver) {
                      showNotification(
                        "error",
                        "Atenção",
                        "Você já possui um chamado ativo.",
                      );
                      return;
                    }
                    setModalError("");
                    setIsSupportModalOpen(true);
                  }}
                  className="w-full max-w-sm h-14 text-lg bg-primary hover:bg-primary/90 font-bold shadow-xl shadow-primary/30 rounded-xl text-primary-foreground tour-support-button"
                >
                  SOLICITAR SOCORRO
                </Button>
              </div>
            )}

            {activeTab === "activeCalls" && (
              <div className="tab-content-enter space-y-4 tour-history-section">
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {["all", "inProgress", "requester", "provider"].map((f) => (
                    <button
                      key={f}
                      onClick={() => setHistoryFilter(f as any)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-xs font-bold border whitespace-nowrap backdrop-blur-xl shadow-lg transition-all duration-300 ease-in-out",
                        historyFilter === f
                          ? theme === "dark"
                            ? "bg-orange-500/20 text-white border-orange-500/40 shadow-xl transform scale-105"
                            : "bg-orange-50 text-slate-900 border-orange-300 shadow-xl transform scale-105"
                          : theme === "dark"
                            ? "bg-slate-900/60 text-slate-300 border-orange-500/20 hover:bg-orange-500/10 hover:text-white hover:scale-102"
                            : "bg-white/60 text-slate-700 border-orange-200/40 hover:bg-orange-50 hover:text-slate-900 hover:scale-102",
                      )}
                    >
                      {f === "all"
                        ? "Todos"
                        : f === "inProgress"
                          ? "Em Andamento"
                          : f === "requester"
                            ? "Meus Pedidos"
                            : "Meus Apoios"}
                    </button>
                  ))}
                </div>
                {/* CALENDARIOS (MANTIDOS ORIGINAIS) */}
                <div className="flex gap-2 mb-2 flex-wrap items-center">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "h-8 text-xs font-normal justify-start text-left w-[130px] bg-white/80 dark:bg-orange-500/20 border-border dark:border-orange-500/30 text-foreground dark:text-white hover:bg-white dark:hover:bg-orange-500/30 backdrop-blur-xl rounded-xl shadow-lg shadow-black/5 dark:shadow-black/10 transition-all duration-300 ease-in-out hover:scale-105",
                          !startDate &&
                            "text-muted-foreground dark:text-white/50",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-3 w-3 transition-transform duration-300 group-hover:rotate-12" />
                        {startDate ? (
                          format(startDate, "dd/MM/yy", { locale: ptBR })
                        ) : (
                          <span>Início</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0 bg-white dark:bg-slate-800/95 backdrop-blur-xl border-border dark:border-slate-600/50 rounded-2xl shadow-xl shadow-black/10 dark:shadow-black/30"
                      align="start"
                    >
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "h-8 text-xs font-normal justify-start text-left w-[130px] bg-white/80 dark:bg-orange-500/20 border-border dark:border-orange-500/30 text-foreground dark:text-white hover:bg-white dark:hover:bg-orange-500/30 backdrop-blur-xl rounded-xl shadow-lg shadow-black/5 dark:shadow-black/10 transition-all duration-300 ease-in-out hover:scale-105",
                          !endDate &&
                            "text-muted-foreground dark:text-white/50",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-3 w-3 transition-transform duration-300 group-hover:rotate-12" />
                        {endDate ? (
                          format(endDate, "dd/MM/yy", { locale: ptBR })
                        ) : (
                          <span>Fim</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0 bg-white dark:bg-slate-800/95 backdrop-blur-xl border-border dark:border-slate-600/50 rounded-2xl shadow-xl shadow-black/10 dark:shadow-black/30"
                      align="start"
                    >
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-3">
                  {filteredCalls.length > 0 ? (
                    filteredCalls.map((call) => (
                      <DriverCallHistoryCard
                        key={call.id}
                        call={call}
                        userId={userId}
                        allDrivers={allDrivers}
                        driver={driver}
                        onRequestApproval={handleRequestApproval}
                        onCancelSupport={handleCancelSupport}
                        onDeleteSupportRequest={onDeleteSupportRequest}
                        onRateDriver={handleRateDriver}
                      />
                    ))
                  ) : (
                    <div className="text-center py-12 opacity-50 bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-dashed border-orange-200/50 dark:border-orange-500/30 shadow-xl shadow-black/5 dark:shadow-black/20">
                      <HistoryIcon
                        size={48}
                        className="mx-auto text-muted-foreground dark:text-white/30 mb-2"
                      />
                      <p className="text-sm text-muted-foreground dark:text-white/60">
                        Sem histórico.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "tutorial" && (
              <div className="tab-content-enter space-y-6 pb-10">
                <Tabs defaultValue="solicitante" className="w-full">
                  <TabsList
                    className={cn(
                      "grid w-full grid-cols-2 backdrop-blur-xl p-1 rounded-xl h-10 mb-4 border shadow-xl",
                      theme === "dark"
                        ? "bg-slate-900/60 border-orange-500/30"
                        : "bg-white/80 border-orange-200/50",
                    )}
                  >
                    <TabsTrigger
                      value="solicitante"
                      className={cn(
                        "text-xs data-[state=active]:shadow rounded-lg transition-all",
                        theme === "dark"
                          ? "text-slate-300 data-[state=active]:text-white data-[state=active]:bg-orange-500/20"
                          : "text-slate-600 data-[state=active]:text-slate-900 data-[state=active]:bg-orange-50",
                      )}
                    >
                      Solicitante
                    </TabsTrigger>
                    <TabsTrigger
                      value="prestador"
                      className={cn(
                        "text-xs data-[state=active]:shadow rounded-lg transition-all",
                        theme === "dark"
                          ? "text-slate-300 data-[state=active]:text-white data-[state=active]:bg-orange-500/20"
                          : "text-slate-600 data-[state=active]:text-slate-900 data-[state=active]:bg-orange-50",
                      )}
                    >
                      Prestador
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="solicitante" className="space-y-3">
                    {TUTORIALS_SOLICITANTE.map((t) => (
                      <div
                        key={t.id}
                        className={cn(
                          "backdrop-blur-xl rounded-2xl p-4 border shadow-xl",
                          theme === "dark"
                            ? "bg-slate-900/60 border-orange-500/30"
                            : "bg-white/80 border-orange-200/50",
                        )}
                      >
                        <h4 className="font-bold text-sm mb-2 flex gap-2 items-center text-foreground dark:text-white">
                          <HelpCircle size={16} className="text-primary" />{" "}
                          {t.question}
                        </h4>
                        <p className="text-xs text-muted-foreground dark:text-white/70">
                          {t.answer}
                        </p>
                      </div>
                    ))}
                  </TabsContent>
                  <TabsContent value="prestador" className="space-y-3">
                    {TUTORIALS_PRESTADOR.map((t) => (
                      <div
                        key={t.id}
                        className={cn(
                          "backdrop-blur-xl rounded-2xl p-4 border shadow-xl",
                          theme === "dark"
                            ? "bg-slate-900/60 border-orange-500/30"
                            : "bg-white/80 border-orange-200/50",
                        )}
                      >
                        <h4 className="font-bold text-sm mb-2 flex gap-2 items-center text-foreground dark:text-white">
                          <HelpCircle size={16} className="text-primary" />{" "}
                          {t.question}
                        </h4>
                        <p className="text-xs text-muted-foreground dark:text-white/70">
                          {t.answer}
                        </p>
                      </div>
                    ))}
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {activeTab === "profile" && (
              <div className="tab-content-enter space-y-6 pb-10 tour-profile-section">
                {isProfileEditingLocked && (
                  <Alert className="bg-orange-500/10 border-[#EE4D2D]/30 shadow-md flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-[#EE4D2D] shrink-0" />
                    <AlertDescription className="text-sm font-medium text-foreground dark:text-white leading-relaxed">
                      <span className="text-[#EE4D2D] font-bold block sm:inline">
                        Edição Travada:{" "}
                      </span>
                      Fique INDISPONÍVEL na aba Status para conseguir alterar
                      seus dados.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Configurações */}
                <section
                  className={cn(
                    "rounded-[1.5rem] p-5 border",
                    theme === "dark"
                      ? "bg-slate-900/40 border-orange-500/30 backdrop-blur-sm"
                      : "bg-white/80 border-orange-200/50",
                  )}
                  style={
                    theme === "dark"
                      ? {
                          boxShadow:
                            "0 25px 50px -12px rgba(254, 95, 47, 0.3), inset 0 1px 0 0 rgba(254, 95, 47, 0.1)",
                        }
                      : {
                          boxShadow:
                            "0 25px 50px -12px rgba(254, 95, 47, 0.15)",
                        }
                  }
                >
                  <h4
                    className={cn(
                      "text-xs font-bold uppercase mb-4 tracking-wide",
                      theme === "dark" ? "text-orange-300" : "text-slate-600",
                    )}
                  >
                    Configurações
                  </h4>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "p-3 rounded-xl",
                          isMuted
                            ? theme === "dark"
                              ? "text-slate-400 bg-slate-800/80 border border-slate-600/30"
                              : "text-slate-50 bg-slate-100 border border-slate-300"
                            : theme === "dark"
                              ? "text-emerald-300 bg-emerald-500/20 border border-emerald-400/30"
                              : "text-emerald-600 bg-emerald-50 border border-emerald-300",
                        )}
                      >
                        {isMuted ? (
                          <VolumeX size={22} />
                        ) : (
                          <Volume2 size={22} />
                        )}
                      </div>
                      <div>
                        <p
                          className={cn(
                            "font-bold text-sm",
                            theme === "dark" ? "text-white" : "text-slate-800",
                          )}
                        >
                          Sons de Alerta
                        </p>
                        <p
                          className={cn(
                            "text-xs",
                            theme === "dark"
                              ? "text-slate-300"
                              : "text-slate-600",
                          )}
                        >
                          {isMuted ? "Silenciado" : "Ativado"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={toggleMute}
                      className="px-4 py-2 rounded-xl text-sm font-medium text-orange-400 hover:bg-orange-500/10 transition-all"
                    >
                      Alterar
                    </button>
                  </div>
                </section>

                {/* Meus Dados */}
                <section
                  className={cn(
                    "rounded-[1.5rem] p-5 space-y-4 border transition-all",
                    theme === "dark"
                      ? "bg-slate-900/40 border-orange-500/30 backdrop-blur-sm"
                      : "bg-white/80 border-orange-200/50",
                    isProfileEditingLocked && "opacity-60 pointer-events-none",
                  )}
                  style={
                    theme === "dark"
                      ? {
                          boxShadow:
                            "0 25px 50px -12px rgba(254, 95, 47, 0.3), inset 0 1px 0 0 rgba(254, 95, 47, 0.1)",
                        }
                      : {
                          boxShadow:
                            "0 25px 50px -12px rgba(254, 95, 47, 0.15)",
                        }
                  }
                >
                  <h4
                    className={cn(
                      "text-xs font-bold uppercase mb-2 tracking-wide",
                      theme === "dark" ? "text-slate-300" : "text-slate-600",
                    )}
                  >
                    Meus Dados
                  </h4>
                  <div className="space-y-1">
                    <label
                      className={cn(
                        "text-xs font-bold",
                        theme === "dark" ? "text-orange-300" : "text-slate-600",
                      )}
                    >
                      ID Motorista
                    </label>
                    <div
                      className={cn(
                        "p-4 rounded-xl text-sm font-mono flex justify-between items-center",
                        theme === "dark" ? "text-orange-200" : "text-slate-700",
                      )}
                      style={{
                        background:
                          theme === "dark"
                            ? "rgba(254, 95, 47, 0.15)"
                            : "rgba(255, 168, 50, 0.15)",
                        border:
                          theme === "dark"
                            ? "1px solid rgba(254, 95, 47, 0.3)"
                            : "1px solid rgba(255, 168, 50, 0.3)",
                      }}
                    >
                      {shopeeId}{" "}
                      <Lock
                        size={14}
                        className={
                          theme === "dark"
                            ? "text-orange-400"
                            : "text-orange-500"
                        }
                      />
                    </div>
                  </div>

                  {/* CAMPO DE HUB */}
                  <div className="space-y-1">
                    <label
                      className={cn(
                        "text-xs font-bold",
                        theme === "dark" ? "text-orange-300" : "text-slate-600",
                      )}
                    >
                      Hub
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        disabled={isProfileEditingLocked}
                        value={hubSearch}
                        onChange={(e) => {
                          setHubSearch(e.target.value);
                          setIsHubDropdownOpen(true);
                        }}
                        onFocus={() => setIsHubDropdownOpen(true)}
                        className={cn(
                          "w-full p-4 rounded-xl text-sm font-medium border focus:ring-2 focus:ring-orange-500/50 outline-none transition-all disabled:opacity-50",
                          theme === "dark"
                            ? "bg-orange-500/20 border-orange-500/30 text-white placeholder:text-slate-400"
                            : "bg-orange-50/80 border-orange-200/50 text-slate-800 placeholder:text-slate-500",
                        )}
                        placeholder="Pesquisar Hub..."
                      />
                      {isHubDropdownOpen && filteredHubs.length > 0 && (
                        <div
                          className={cn(
                            "absolute z-10 w-full mt-2 rounded-xl max-h-48 overflow-y-auto border",
                            theme === "dark"
                              ? "bg-slate-900/98 border-orange-500/40 backdrop-blur-xl"
                              : "bg-white border-orange-200/50",
                          )}
                          style={{
                            boxShadow:
                              theme === "dark"
                                ? "0 20px 40px -10px rgba(254, 95, 47, 0.4)"
                                : "0 20px 40px -10px rgba(254, 95, 47, 0.2)",
                          }}
                        >
                          {filteredHubs.map((h) => (
                            <div
                              key={h}
                              className={cn(
                                "p-3 cursor-pointer text-sm transition-colors first:rounded-t-xl last:rounded-b-xl",
                                theme === "dark"
                                  ? "text-slate-300 hover:text-white hover:bg-orange-500/20"
                                  : "text-slate-700 hover:text-slate-900 hover:bg-orange-50",
                              )}
                              onClick={() => {
                                setHub(h);
                                setHubSearch(h);
                                setIsHubDropdownOpen(false);
                              }}
                            >
                              {h}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* CAMPO DE SEXO (NOVO) */}
                  <div className="space-y-1">
                    <label
                      className={cn(
                        "text-xs font-bold",
                        theme === "dark" ? "text-orange-300" : "text-slate-600",
                      )}
                    >
                      Sexo
                    </label>
                    <select
                      value={gender}
                      disabled={isProfileEditingLocked}
                      onChange={(e) => setGender(e.target.value)}
                      className={cn(
                        "w-full p-4 rounded-xl text-sm font-medium capitalize focus:ring-2 focus:ring-orange-500/50 outline-none transition-all appearance-none cursor-pointer disabled:opacity-50",
                        theme === "dark" ? "text-white" : "text-slate-800",
                      )}
                      style={{
                        background:
                          theme === "dark"
                            ? "rgba(254, 95, 47, 0.15)"
                            : "rgba(255, 168, 50, 0.15)",
                        border:
                          theme === "dark"
                            ? "1px solid rgba(254, 95, 47, 0.3)"
                            : "1px solid rgba(255, 168, 50, 0.3)",
                      }}
                    >
                      <option
                        value="Homem"
                        className={
                          theme === "dark" ? "bg-slate-900" : "bg-white"
                        }
                      >
                        Homem
                      </option>
                      <option
                        value="Mulher"
                        className={
                          theme === "dark" ? "bg-slate-900" : "bg-white"
                        }
                      >
                        Mulher
                      </option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label
                      className={cn(
                        "text-xs font-bold",
                        theme === "dark" ? "text-orange-300" : "text-slate-600",
                      )}
                    >
                      Veículo
                    </label>
                    <select
                      value={vehicleType}
                      disabled={isProfileEditingLocked}
                      onChange={(e) => setVehicleType(e.target.value)}
                      className={cn(
                        "w-full p-4 rounded-xl text-sm font-medium capitalize focus:ring-2 focus:ring-orange-500/50 outline-none transition-all appearance-none cursor-pointer disabled:opacity-50",
                        theme === "dark" ? "text-white" : "text-slate-800",
                      )}
                      style={{
                        background:
                          theme === "dark"
                            ? "rgba(254, 95, 47, 0.15)"
                            : "rgba(255, 168, 50, 0.15)",
                        border:
                          theme === "dark"
                            ? "1px solid rgba(254, 95, 47, 0.3)"
                            : "1px solid rgba(255, 168, 50, 0.3)",
                      }}
                    >
                      {VEHICLE_TYPES.map((v) => (
                        <option
                          key={v}
                          value={v}
                          className={
                            theme === "dark" ? "bg-slate-900" : "bg-white"
                          }
                        >
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label
                      className={cn(
                        "text-xs font-bold",
                        theme === "dark" ? "text-orange-300" : "text-slate-600",
                      )}
                    >
                      Nome
                    </label>
                    <input
                      value={name}
                      disabled={isProfileEditingLocked}
                      onChange={(e) => setName(e.target.value)}
                      className={cn(
                        "w-full p-4 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/50 outline-none transition-all disabled:opacity-50",
                        theme === "dark"
                          ? "text-white placeholder:text-slate-400"
                          : "text-slate-800 placeholder:text-slate-500",
                      )}
                      style={{
                        background:
                          theme === "dark"
                            ? "rgba(254, 95, 47, 0.15)"
                            : "rgba(255, 168, 50, 0.15)",
                        border:
                          theme === "dark"
                            ? "1px solid rgba(254, 95, 47, 0.3)"
                            : "1px solid rgba(255, 168, 50, 0.3)",
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <label
                      className={cn(
                        "text-xs font-bold",
                        theme === "dark" ? "text-orange-300" : "text-slate-600",
                      )}
                    >
                      Telefone
                    </label>
                    <input
                      value={formatPhoneNumber(phone)}
                      disabled={isProfileEditingLocked}
                      onChange={(e) => setPhone(e.target.value)}
                      className={cn(
                        "w-full p-4 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/50 outline-none transition-all disabled:opacity-50",
                        theme === "dark"
                          ? "text-white placeholder:text-slate-400"
                          : "text-slate-800 placeholder:text-slate-500",
                      )}
                      style={{
                        background:
                          theme === "dark"
                            ? "rgba(254, 95, 47, 0.15)"
                            : "rgba(255, 168, 50, 0.15)",
                        border:
                          theme === "dark"
                            ? "1px solid rgba(254, 95, 47, 0.3)"
                            : "1px solid rgba(255, 168, 50, 0.3)",
                      }}
                    />
                  </div>
                  <button
                    onClick={handleUpdateProfile}
                    disabled={isProfileEditingLocked}
                    className={cn(
                      "w-full py-4 mt-2 rounded-xl font-bold text-sm transition-all hover:opacity-90 disabled:opacity-50",
                      theme === "dark" ? "text-white" : "text-white",
                    )}
                    style={{
                      background:
                        "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                      boxShadow: "0 4px 20px -5px rgba(249, 115, 22, 0.5)",
                    }}
                  >
                    Salvar Alterações
                  </button>
                </section>

                {/* Segurança */}
                <section
                  className={cn(
                    "rounded-[1.5rem] p-5 space-y-4 border transition-all",
                    theme === "dark"
                      ? "bg-slate-900/40 border-orange-500/30 backdrop-blur-sm"
                      : "bg-white/80 border-orange-200/50",
                    isProfileEditingLocked && "opacity-60 pointer-events-none",
                  )}
                  style={
                    theme === "dark"
                      ? {
                          boxShadow:
                            "0 25px 50px -12px rgba(254, 95, 47, 0.3), inset 0 1px 0 0 rgba(254, 95, 47, 0.1)",
                        }
                      : {
                          boxShadow:
                            "0 25px 50px -12px rgba(254, 95, 47, 0.15)",
                        }
                  }
                >
                  <h4
                    className={cn(
                      "text-xs font-bold uppercase mb-2 tracking-wide",
                      theme === "dark" ? "text-orange-300" : "text-slate-600",
                    )}
                  >
                    Segurança
                  </h4>
                  <div className="space-y-3">
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        disabled={isProfileEditingLocked}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Nova Senha"
                        className={cn(
                          "w-full p-4 rounded-xl text-sm border pr-12 disabled:opacity-50",
                          theme === "dark"
                            ? "bg-slate-700 border-slate-600 text-white placeholder:text-white/50"
                            : "bg-white border-slate-300 text-slate-900",
                        )}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className={cn(
                          "absolute right-4 top-4 transition-colors",
                          theme === "dark"
                            ? "text-slate-400 hover:text-white"
                            : "text-slate-500 hover:text-slate-700",
                        )}
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      disabled={isProfileEditingLocked}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirmar Nova Senha"
                      className={cn(
                        "w-full p-4 rounded-xl text-sm border disabled:opacity-50",
                        theme === "dark"
                          ? "bg-slate-700 border-slate-600 text-white placeholder:text-white/50"
                          : "bg-white border-slate-300 text-slate-900",
                      )}
                    />
                    <button
                      onClick={handleChangePassword}
                      disabled={
                        !newPassword ||
                        !confirmPassword ||
                        isProfileEditingLocked
                      }
                      className={cn(
                        "w-full py-4 rounded-xl text-sm font-medium border transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                        theme === "dark"
                          ? "border-slate-600 text-white bg-slate-700 hover:bg-slate-600"
                          : "border-slate-300 text-slate-700 bg-white hover:bg-slate-50",
                      )}
                    >
                      Atualizar Senha
                    </button>
                  </div>
                </section>
              </div>
            )}
          </div>
          {/* ... MODAIS ... */}
          {isSupportModalOpen && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
              <div
                className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
                onClick={() => setIsSupportModalOpen(false)}
              />
              <div className="relative w-full max-w-lg bg-slate-800/95 backdrop-blur-2xl h-[90vh] sm:h-auto rounded-t-3xl sm:rounded-3xl shadow-2xl shadow-black/40 border border-orange-500/30 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10">
                <div className="p-4 border-b border-orange-500/30 flex justify-between items-center bg-slate-800/90 backdrop-blur-xl">
                  <h2 className="font-bold text-white">Nova Solicitação</h2>
                  <button
                    onClick={() => setIsSupportModalOpen(false)}
                    className="p-2 bg-slate-700/90 hover:bg-slate-600/90 rounded-full transition-colors"
                  >
                    <X size={18} className="text-white" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  <form
                    id="supportForm"
                    onSubmit={handleSupportSubmit}
                    className="space-y-4"
                  >
                    <div>
                      <label className="text-xs font-bold text-white/70 uppercase mb-1 block">
                        Hub
                      </label>
                      <select
                        value={hub}
                        onChange={(e) => setHub(e.target.value)}
                        className="w-full p-3 bg-slate-700/90 backdrop-blur-xl border border-slate-600/50 rounded-xl text-sm text-white focus:ring-2 focus:ring-primary outline-none shadow-lg shadow-black/10"
                        required
                      >
                        <option value="" className="bg-slate-800">
                          Selecione...
                        </option>
                        {HUBS.map((h) => (
                          <option key={h} value={h} className="bg-slate-800">
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-white/70 uppercase mb-1 flex items-center justify-between">
                        Localização
                        <button
                          type="button"
                          onClick={handleGetLocation}
                          className="text-primary hover:text-primary/80 transition-colors flex items-center justify-center p-1 rounded-lg hover:bg-white/5"
                          title="Usar localização atual"
                        >
                          <MapPin size={20} />
                        </button>
                      </label>
                      <input
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full p-3 bg-slate-700/90 backdrop-blur-xl border border-slate-600/50 rounded-xl text-sm text-white placeholder:text-white/50 focus:ring-2 focus:ring-primary outline-none shadow-lg shadow-black/10"
                        placeholder="Digite o endereço ou use o botão de GPS"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-white/70 uppercase mb-1 flex items-center justify-between">
                        Motivo{" "}
                        <button
                          type="button"
                          onClick={() => handleVoiceInput("reason", setReason)}
                          className={cn(
                            "p-1 rounded-full transition-colors",
                            isListening
                              ? "bg-red-500 text-white animate-pulse"
                              : "text-primary hover:bg-primary/20",
                          )}
                        >
                          <Mic size={14} />
                        </button>
                      </label>
                      <select
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="w-full p-3 bg-slate-700/90 backdrop-blur-xl border border-slate-600/50 rounded-xl text-sm text-white focus:ring-2 focus:ring-primary outline-none shadow-lg shadow-black/10"
                        required
                      >
                        <option value="" className="bg-slate-800">
                          Selecione...
                        </option>
                        {SUPPORT_REASONS.map((r) => (
                          <option key={r} value={r} className="bg-slate-800">
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-white/70 uppercase mb-1 flex items-center justify-between">
                        Detalhes{" "}
                        <button
                          type="button"
                          onClick={() =>
                            handleVoiceInput("description", setDescription)
                          }
                          className={cn(
                            "p-1 rounded-full transition-colors",
                            isListening
                              ? "bg-red-500 text-white animate-pulse"
                              : "text-primary hover:bg-primary/20",
                          )}
                        >
                          <Mic size={14} />
                        </button>
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        maxLength={100}
                        className="w-full p-3 bg-slate-700/90 backdrop-blur-xl border border-slate-600/50 rounded-xl text-sm h-24 resize-none text-white placeholder:text-white/50 focus:ring-2 focus:ring-primary outline-none shadow-lg shadow-black/10"
                        placeholder="Descreva brevemente..."
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-white/70 uppercase mb-1 block">
                          Pacotes
                        </label>
                        <input
                          type="number"
                          min="20"
                          value={packageCount}
                          onChange={(e) => setPackageCount(e.target.value)}
                          className="w-full p-3 bg-slate-700/90 backdrop-blur-xl border border-slate-600/50 rounded-xl text-sm font-bold text-white placeholder:text-white/50 focus:ring-2 focus:ring-[#FA4F26] outline-none shadow-lg shadow-black/10"
                          placeholder="Mín 20"
                          required
                        />
                      </div>
                      <div className="flex items-center justify-center bg-slate-700/90 backdrop-blur-xl border border-slate-600/50 rounded-xl shadow-lg shadow-black/10">
                        <label className="flex items-center gap-2 cursor-pointer p-3 w-full justify-center">
                          <span className="text-sm font-bold text-white/80">
                            Volumoso?
                          </span>
                          <input
                            type="checkbox"
                            checked={isBulky}
                            onChange={(e) => setIsBulky(e.target.checked)}
                            className="accent-[#FA4F26] w-5 h-5"
                          />
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-white/70 uppercase mb-1 flex justify-between">
                        Regiões{" "}
                        <button
                          type="button"
                          onClick={() => handleAddField(setDeliveryRegions)}
                          className="text-primary hover:text-primary/80 transition-colors"
                        >
                          <PlusCircle size={14} />
                        </button>
                      </label>
                      {deliveryRegions.map((reg, idx) => (
                        <div key={idx} className="flex gap-2 mb-2">
                          <input
                            value={reg}
                            onChange={(e) =>
                              handleFieldChange(
                                idx,
                                e.target.value,
                                setDeliveryRegions,
                              )
                            }
                            className="flex-1 p-2 bg-slate-700/90 backdrop-blur-xl border border-slate-600/50 rounded-xl text-sm text-white placeholder:text-white/50 focus:ring-2 focus:ring-[#FA4F26] outline-none shadow-lg shadow-black/10"
                            placeholder="Ex: Zona Norte"
                          />
                          {idx > 0 && (
                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveField(idx, setDeliveryRegions)
                              }
                              className="text-red-300 hover:text-red-200 transition-colors"
                            >
                              <MinusCircle size={18} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <div>
                      <label className="text-xs font-bold text-white/70 uppercase mb-1 flex justify-between">
                        Veículos Necessários{" "}
                        <button
                          type="button"
                          onClick={() => handleAddField(setNeededVehicles)}
                          className="text-primary hover:text-primary/80 transition-colors"
                        >
                          <PlusCircle size={14} />
                        </button>
                      </label>
                      {neededVehicles.map((veh, idx) => (
                        <div key={idx} className="flex gap-2 mb-2">
                          <select
                            value={veh}
                            onChange={(e) =>
                              handleFieldChange(
                                idx,
                                e.target.value,
                                setNeededVehicles,
                              )
                            }
                            className="flex-1 p-2 bg-orange-500/20 backdrop-blur-xl border border-orange-500/30 rounded-xl text-sm capitalize text-white focus:ring-2 focus:ring-[#FA4F26] outline-none shadow-lg shadow-black/10"
                          >
                            <option value="" className="bg-slate-800">
                              Selecione...
                            </option>
                            {VEHICLE_TYPES.map((v) => (
                              <option
                                key={v}
                                value={v}
                                className="bg-slate-800"
                              >
                                {v}
                              </option>
                            ))}
                          </select>
                          {idx > 0 && (
                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveField(idx, setNeededVehicles)
                              }
                              className="text-red-300 hover:text-red-200 transition-colors"
                            >
                              <MinusCircle size={18} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    {modalError && (
                      <p className="text-red-300 text-xs font-bold text-center bg-red-500/20 backdrop-blur-xl p-2 rounded-xl border border-red-400/30">
                        {modalError}
                      </p>
                    )}
                  </form>
                </div>
                <div className="p-4 border-t border-slate-600/50 bg-slate-800/90 backdrop-blur-xl">
                  <Button
                    form="supportForm"
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg shadow-xl shadow-primary/30 rounded-xl"
                  >
                    {isSubmitting ? (
                      <Loading size="sm" variant="spinner" />
                    ) : (
                      "ENVIAR SOLICITAÇÃO"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {showSuccessModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-sm animate-in fade-in">
              <div className="bg-slate-800/95 backdrop-blur-2xl rounded-3xl p-8 text-center max-w-sm w-full shadow-2xl shadow-black/40 border border-orange-500/30">
                <div className="w-20 h-20 bg-green-500/20 text-green-300 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-400/30 shadow-xl shadow-black/20">
                  <CheckCircle size={40} />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Recebido!
                </h2>
                <Button
                  onClick={() => setShowSuccessModal(false)}
                  className="w-full mt-4"
                >
                  Entendido
                </Button>
              </div>
            </div>
          )}
        </main>
        <div
          id="chatbot-tour-target"
          className="fixed bottom-0 right-0 w-20 h-20 pointer-events-none z-0"
        />
        <Chatbot />
      </div>
    </>
  );
};
