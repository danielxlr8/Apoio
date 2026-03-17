import React, { useState, useEffect } from "react";
import {
  Cloud,
  CloudRain,
  Sun,
  CloudSun,
  CloudLightning,
  X,
  Info, // Adicionei ícone de info para o tooltip
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "../lib/utils";
import {
  WeatherBackground,
  getWeatherBackgroundColor,
} from "./WeatherBackground";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip"; // Importando Tooltip do Shadcn/UI se disponível, ou fallback nativo

// --- TIPOS ---
interface WeatherData {
  date: string;
  day: string;
  high: number;
  low: number;
  icon: "sun" | "cloud" | "cloud-sun" | "rain" | "thunderstorm";
  description: string;
  hourly?: HourlyWeather[];
}

interface HourlyWeather {
  time: string;
  temp: number;
  icon: "sun" | "cloud" | "cloud-sun" | "rain" | "thunderstorm";
  description: string;
}

interface WeatherForecastProps {
  city: string;
  hub?: string;
  theme?: "light" | "dark";
  showDetailed?: boolean;
  onDayClick?: (day: WeatherData) => void;
  selectedDay?: string | null;
}

// Tipo para o status do semáforo
type DataStatus = "loading" | "real" | "mock";

// --- UTILITÁRIOS ---
const mapWmoCode = (
  code: number,
): { icon: WeatherData["icon"]; description: string } => {
  if (code === 0) return { icon: "sun", description: "Céu limpo" };
  if (code >= 1 && code <= 3)
    return { icon: "cloud-sun", description: "Parcialmente nublado" };
  if (code === 45 || code === 48)
    return { icon: "cloud", description: "Nevoeiro" };
  if (code >= 51 && code <= 67) return { icon: "rain", description: "Chuva" };
  if (code >= 71 && code <= 77) return { icon: "cloud", description: "Neve" };
  if (code >= 80 && code <= 82)
    return { icon: "rain", description: "Pancadas de chuva" };
  if (code >= 85 && code <= 86) return { icon: "cloud", description: "Neve" };
  if (code >= 95) return { icon: "thunderstorm", description: "Tempestade" };
  return { icon: "cloud", description: "Nublado" };
};

const generateMockData = (): WeatherData[] => {
  const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const today = new Date();

  const generateHourly = (baseTemp: number): HourlyWeather[] => {
    const hours: HourlyWeather[] = [];
    for (let i = 0; i < 24; i++) {
      const hour = String(i).padStart(2, "0") + ":00";
      const temp = baseTemp + Math.floor(Math.random() * 5) - 2;
      hours.push({
        time: hour,
        temp,
        icon: i > 6 && i < 18 ? "sun" : "cloud",
        description: i > 6 && i < 18 ? "Ensolarado" : "Nublado",
      });
    }
    return hours;
  };

  return Array.from({ length: 8 }).map((_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);
    const high = 28 + Math.floor(Math.random() * 6);
    return {
      date: format(date, "yyyy-MM-dd"),
      day: days[date.getDay()],
      high,
      low: high - 10,
      icon: index === 0 ? "sun" : "cloud-sun",
      description: index === 0 ? "Ensolarado" : "Parcialmente nublado",
      hourly: generateHourly(high),
    };
  });
};

// --- FETCHING COM RETORNO DE STATUS ---
// Agora retorna também um booleano 'isMock'
const fetchWeatherData = async (
  city: string,
): Promise<{ data: WeatherData[]; isMock: boolean }> => {
  if (!city) return { data: generateMockData(), isMock: true };

  try {
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=pt&format=json`,
    );
    const geoData = await geoRes.json();

    if (!geoData.results || geoData.results.length === 0) {
      console.warn(
        `[Weather] Cidade não encontrada: ${city}. Usando fallback.`,
      );
      return { data: generateMockData(), isMock: true };
    }

    const { latitude, longitude } = geoData.results[0];

    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,weathercode&hourly=temperature_2m,weathercode&timezone=America/Sao_Paulo&forecast_days=8`,
    );
    const weatherData = await weatherRes.json();

    const daily = weatherData.daily;
    const hourly = weatherData.hourly;

    const mappedData = daily.time.map((time: string, index: number) => {
      const dateObj = new Date(time + "T00:00:00");
      const wmo = daily.weathercode[index];
      const { icon, description } = mapWmoCode(wmo);

      const startHour = index * 24;
      const endHour = startHour + 24;
      const dayHourly: HourlyWeather[] = [];

      for (let i = startHour; i < endHour; i++) {
        if (!hourly.time[i]) break;
        const hDate = new Date(hourly.time[i]);
        const hWmo = hourly.weathercode[i];
        const hInfo = mapWmoCode(hWmo);
        dayHourly.push({
          time: format(hDate, "HH:00"),
          temp: Math.round(hourly.temperature_2m[i]),
          icon: hInfo.icon,
          description: hInfo.description,
        });
      }

      const dayName = format(dateObj, "EEE", { locale: ptBR });
      const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);

      return {
        date: format(dateObj, "yyyy-MM-dd"),
        day: capitalizedDay,
        high: Math.round(daily.temperature_2m_max[index]),
        low: Math.round(daily.temperature_2m_min[index]),
        icon,
        description,
        hourly: dayHourly,
      };
    });

    return { data: mappedData, isMock: false };
  } catch (error) {
    console.error("[Weather] Erro na API:", error);
    return { data: generateMockData(), isMock: true };
  }
};

const getWeatherIcon = (icon: WeatherData["icon"], size: number = 24) => {
  switch (icon) {
    case "sun":
      return <Sun size={size} className="text-yellow-400" />;
    case "cloud":
      return <Cloud size={size} className="text-gray-400" />;
    case "cloud-sun":
      return <CloudSun size={size} className="text-yellow-400" />;
    case "rain":
      return <CloudRain size={size} className="text-blue-400" />;
    case "thunderstorm":
      return <CloudLightning size={size} className="text-purple-400" />;
    default:
      return <Cloud size={size} className="text-gray-400" />;
  }
};

export const WeatherForecast: React.FC<WeatherForecastProps> = ({
  city,
  hub: _hub,
  theme = "dark",
  showDetailed = false,
  onDayClick,
  selectedDay,
}) => {
  const [weatherData, setWeatherData] = useState<WeatherData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataStatus, setDataStatus] = useState<DataStatus>("loading"); // Estado do Semáforo
  const [detailedDay, setDetailedDay] = useState<WeatherData | null>(null);

  useEffect(() => {
    const loadWeather = async () => {
      setLoading(true);
      setDataStatus("loading"); // Amarelo (iniciando)

      try {
        const { data, isMock } = await fetchWeatherData(city);
        setWeatherData(data);
        setDataStatus(isMock ? "mock" : "real"); // Vermelho ou Verde
      } catch (error) {
        setWeatherData(generateMockData());
        setDataStatus("mock"); // Vermelho (erro grave)
      } finally {
        setLoading(false);
      }
    };
    loadWeather();
  }, [city]);

  const handleDayClick = (day: WeatherData) => {
    if (onDayClick) {
      onDayClick(day);
    } else {
      setDetailedDay(detailedDay?.date === day.date ? null : day);
    }
  };

  const displayDay = selectedDay
    ? weatherData.find((d) => d.date === selectedDay) || detailedDay
    : detailedDay;

  // Texto explicativo para o tooltip do semáforo
  const getStatusTooltip = () => {
    switch (dataStatus) {
      case "real":
        return "Dados em tempo real (Open-Meteo)";
      case "loading":
        return "Atualizando informações...";
      case "mock":
        return "Dados simulados (Cidade não encontrada ou API indisponível)";
      default:
        return "";
    }
  };

  if (loading) {
    return (
      <div
        className={cn(
          "p-4 rounded-lg",
          theme === "dark" ? "bg-slate-800/50" : "bg-white/50",
        )}
      >
        <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground text-sm">
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
          Atualizando clima...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full">
      {/* HEADER COM SEMÁFORO */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sun
            size={20}
            className={theme === "dark" ? "text-yellow-400" : "text-yellow-600"}
          />
          <h3
            className={cn(
              "font-semibold",
              theme === "dark" ? "text-white" : "text-slate-800",
            )}
          >
            Previsão do Tempo
          </h3>
        </div>

        {/* O SEMÁFORO (Bolinha) */}
        <div className="flex items-center gap-2" title={getStatusTooltip()}>
          <span
            className={cn(
              "text-[10px] font-medium uppercase tracking-wider",
              theme === "dark" ? "text-slate-400" : "text-slate-500",
            )}
          >
            {dataStatus === "real"
              ? "LIVE"
              : dataStatus === "loading"
                ? "SYNC"
                : "MOCK"}
          </span>
          <div className="relative flex h-3 w-3">
            {dataStatus === "loading" && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
            )}
            <span
              className={cn(
                "relative inline-flex rounded-full h-3 w-3 transition-colors duration-500",
                dataStatus === "real" &&
                  "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]",
                dataStatus === "loading" && "bg-yellow-500",
                dataStatus === "mock" &&
                  "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]",
              )}
            ></span>
          </div>
        </div>
      </div>

      <div className="w-full">
        <div className="flex gap-2 w-full overflow-x-auto scrollbar-hide pb-2 md:pb-0">
          {weatherData.map((day, index) => {
            const isSelected = displayDay?.date === day.date;
            return (
              <button
                key={day.date}
                id={index === 0 ? "weather-card-trigger" : undefined}
                onClick={() => handleDayClick(day)}
                className={cn(
                  "weather-day-btn flex flex-col items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all flex-1 min-w-[100px] md:min-w-0",
                  theme === "dark"
                    ? isSelected
                      ? "bg-orange-500/20 border-orange-500/50"
                      : "bg-slate-700/80 border-orange-500/30 hover:border-orange-500/50"
                    : isSelected
                      ? "bg-orange-100 border-orange-300"
                      : "bg-white border-slate-200 hover:border-orange-200",
                  showDetailed && "cursor-pointer",
                )}
              >
                <span
                  className={cn(
                    "text-base font-semibold",
                    theme === "dark" ? "text-gray-200" : "text-slate-700",
                  )}
                >
                  {day.day}
                </span>
                <div className="flex-shrink-0">
                  {getWeatherIcon(day.icon, 50)}
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span
                    className={cn(
                      "text-xl font-bold",
                      theme === "dark" ? "text-white" : "text-slate-900",
                    )}
                  >
                    {day.high}°
                  </span>
                  <span
                    className={cn(
                      "text-base",
                      theme === "dark" ? "text-gray-400" : "text-slate-600",
                    )}
                  >
                    {day.low}°
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {displayDay && displayDay.hourly && (
        <div
          className={cn(
            "p-4 rounded-lg border relative overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-top-2",
            getWeatherBackgroundColor(displayDay.icon)
              ? "border-orange-500/30"
              : theme === "dark"
                ? "bg-slate-800/90 border-orange-500/30"
                : "bg-white border-orange-200",
          )}
        >
          <WeatherBackground weatherMain={displayDay.icon} />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4
                  className={cn(
                    "font-bold text-lg",
                    theme === "dark" ? "text-white" : "text-slate-800",
                  )}
                >
                  {displayDay.day} -{" "}
                  {format(new Date(displayDay.date), "dd 'de' MMMM", {
                    locale: ptBR,
                  })}
                </h4>
                <p
                  className={cn(
                    "text-sm",
                    theme === "dark" ? "text-gray-300" : "text-slate-600",
                  )}
                >
                  {city}
                </p>
              </div>
              <button
                onClick={() => {
                  setDetailedDay(null);
                  if (onDayClick) onDayClick(displayDay);
                }}
                className={cn(
                  "p-1 rounded-full hover:bg-opacity-20",
                  theme === "dark"
                    ? "text-gray-400 hover:bg-white"
                    : "text-slate-400 hover:bg-slate-200",
                )}
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex items-center gap-4 mb-4 pb-4 border-b border-orange-500/20">
              {getWeatherIcon(displayDay.icon, 48)}
              <div>
                <div
                  className={cn(
                    "text-2xl font-bold",
                    theme === "dark" ? "text-white" : "text-slate-800",
                  )}
                >
                  {displayDay.high}°/{displayDay.low}°
                </div>
                <div
                  className={cn(
                    "text-sm",
                    theme === "dark" ? "text-gray-300" : "text-slate-600",
                  )}
                >
                  {displayDay.description}
                </div>
              </div>
            </div>
            <div>
              <h5
                className={cn(
                  "font-semibold mb-3",
                  theme === "dark" ? "text-white" : "text-slate-800",
                )}
              >
                Previsão Hora a Hora
              </h5>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                {displayDay.hourly.map((hour, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "flex flex-col items-center gap-1 p-2 rounded transition-colors",
                      theme === "dark"
                        ? "bg-slate-700/50 hover:bg-slate-700/80"
                        : "bg-slate-50 hover:bg-slate-100",
                    )}
                  >
                    <span
                      className={cn(
                        "text-xs",
                        theme === "dark" ? "text-gray-400" : "text-slate-600",
                      )}
                    >
                      {hour.time}
                    </span>
                    {getWeatherIcon(hour.icon, 20)}
                    <span
                      className={cn(
                        "text-sm font-medium",
                        theme === "dark" ? "text-white" : "text-slate-800",
                      )}
                    >
                      {hour.temp}°
                    </span>
                    <span
                      className={cn(
                        "text-[10px] text-center line-clamp-1",
                        theme === "dark" ? "text-gray-500" : "text-slate-500",
                      )}
                    >
                      {hour.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
