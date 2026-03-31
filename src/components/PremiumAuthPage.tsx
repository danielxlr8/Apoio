import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth, db } from "../firebase";
import {
  doc,
  getDoc,
  query,
  where,
  getDocs,
  collection,
  updateDoc,
  setDoc,
} from "firebase/firestore";
import { cn } from "../lib/utils";

// Icons
const TruckIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
  </svg>
);

const ShieldCheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
  </svg>
);

const ChartBarIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
  </svg>
);

const MapPinIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
  </svg>
);

const EyeIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
);

const EyeSlashIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
  </svg>
);

const MailIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
  </svg>
);

const LockIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
  </svg>
);

const UserIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
  </svg>
);

const HashIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5-3.9 19.5m-2.1-19.5-3.9 19.5" />
  </svg>
);

const PhoneIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
  </svg>
);

const CalendarIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
  </svg>
);

const XMarkIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
);

const ArrowLeftIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
  </svg>
);

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.519-3.487-11.187-8.264l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C42.022,35.244,44,30.036,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
  </svg>
);

// Animated Donut Chart Component
const AnimatedDonutChart = ({ percentage, label }: { percentage: number; label: string }) => {
  const [animatedPercentage, setAnimatedPercentage] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedPercentage(percentage);
    }, 500);
    return () => clearTimeout(timer);
  }, [percentage]);
  
  const radius = 40;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedPercentage / 100) * circumference;
  
  return (
    <div className="relative flex flex-col items-center">
      <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="url(#gradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F97316" />
            <stop offset="100%" stopColor="#FB923C" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-white">{animatedPercentage}%</span>
      </div>
      <span className="mt-2 text-xs text-zinc-400 font-medium">{label}</span>
    </div>
  );
};

// Metric Card Component
const MetricCard = ({ 
  icon: Icon, 
  value, 
  label, 
  trend 
}: { 
  icon: React.ComponentType<{ className?: string }>; 
  value: string; 
  label: string;
  trend?: "up" | "down";
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex items-center gap-3 p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10"
  >
    <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/20 to-amber-500/20">
      <Icon className="w-4 h-4 text-orange-400" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold text-white">{value}</span>
        {trend && (
          <span className={cn(
            "text-xs font-medium px-1.5 py-0.5 rounded",
            trend === "up" ? "text-emerald-400 bg-emerald-400/10" : "text-red-400 bg-red-400/10"
          )}>
            {trend === "up" ? "+12%" : "-3%"}
          </span>
        )}
      </div>
      <span className="text-xs text-zinc-500">{label}</span>
    </div>
  </motion.div>
);

// Status Indicator Component
const StatusIndicator = ({ status }: { status: "online" | "syncing" | "offline" }) => {
  const statusConfig = {
    online: { color: "bg-emerald-500", text: "Sistema Online", pulse: true },
    syncing: { color: "bg-amber-500", text: "Sincronizando...", pulse: true },
    offline: { color: "bg-red-500", text: "Offline", pulse: false },
  };
  
  const config = statusConfig[status];
  
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
      <span className="relative flex h-2 w-2">
        {config.pulse && (
          <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", config.color)} />
        )}
        <span className={cn("relative inline-flex rounded-full h-2 w-2", config.color)} />
      </span>
      <span className="text-xs font-medium text-zinc-400">{config.text}</span>
    </div>
  );
};

// Floating Input Component
const FloatingInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & {
    label: string;
    icon?: React.ReactNode;
    error?: string;
  }
>(({ label, icon, error, className, ...props }, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = props.value && String(props.value).length > 0;
  
  return (
    <div className="relative">
      <div className={cn(
        "relative rounded-xl border transition-all duration-200",
        isFocused 
          ? "border-orange-500/50 shadow-[0_0_20px_rgba(249,115,22,0.15)]" 
          : "border-white/10 hover:border-white/20",
        error && "border-red-500/50"
      )}>
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          {...props}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          className={cn(
            "w-full bg-white/5 backdrop-blur-sm rounded-xl py-4 px-4 text-white placeholder-transparent",
            "focus:outline-none transition-all duration-200",
            icon && "pl-12",
            className
          )}
          placeholder={label}
        />
        <label
          className={cn(
            "absolute left-4 transition-all duration-200 pointer-events-none",
            icon && "left-12",
            (isFocused || hasValue) 
              ? "top-1 text-[10px] text-orange-400 font-medium" 
              : "top-1/2 -translate-y-1/2 text-sm text-zinc-500"
          )}
        >
          {label}
        </label>
      </div>
      {error && (
        <motion.p 
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1 text-xs text-red-400 pl-1"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
});

FloatingInput.displayName = "FloatingInput";

// Main Component
export const PremiumAuthPage = () => {
  const [activeTab, setActiveTab] = useState<"driver" | "admin">("driver");
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState("");
  const [driverId, setDriverId] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showRecoverModal, setShowRecoverModal] = useState(false);
  const [recoverEmail, setRecoverEmail] = useState("");
  const [recoverLoading, setRecoverLoading] = useState(false);
  const [recoverError, setRecoverError] = useState("");
  const [recoverSuccess, setRecoverSuccess] = useState(false);
  const [isLinkingGoogleAccount, setIsLinkingGoogleAccount] = useState(false);
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [linkingError, setLinkingError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);

  // Simulated real-time metrics
  const [metrics, setMetrics] = useState({
    deliveries: 847,
    vehicles: 124,
    successRate: 97,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        deliveries: prev.deliveries + Math.floor(Math.random() * 3),
        vehicles: 120 + Math.floor(Math.random() * 10),
        successRate: 95 + Math.floor(Math.random() * 4),
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatAndLimitPhone = (value: string) => {
    let digits = value.replace(/\D/g, "");
    digits = digits.slice(0, 11);
    if (digits.length > 2) digits = `(${digits.substring(0, 2)}) ${digits.substring(2)}`;
    if (digits.length > 9) digits = `${digits.substring(0, 9)}-${digits.substring(9)}`;
    return digits;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMessage("");
    
    if (activeTab === "driver" && email.endsWith("@shopee.com")) {
      setError("Contas @shopee.com devem usar aba Administrador.");
      setLoading(false);
      return;
    }
    if (activeTab === "admin" && !email.endsWith("@shopee.com")) {
      setError("Admin requer e-mail @shopee.com.");
      setLoading(false);
      return;
    }
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (activeTab === "admin" && !userCredential.user.emailVerified) {
        setError("Verifique seu e-mail antes de continuar.");
        await signOut(auth);
        setLoading(false);
        return;
      }
    } catch (err: any) {
      if (["auth/user-not-found", "auth/wrong-password", "auth/invalid-credential"].includes(err.code)) {
        setError("E-mail ou senha incorretos.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Muitas tentativas. Aguarde alguns minutos.");
      } else {
        setError("Falha ao entrar. Tente novamente.");
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMessage("");
    
    if (activeTab === "driver" && email.endsWith("@shopee.com")) {
      setError("Contas @shopee.com devem ser Admin.");
      setLoading(false);
      return;
    }
    if (activeTab === "admin" && !email.endsWith("@shopee.com")) {
      setError("Admin requer e-mail @shopee.com.");
      setLoading(false);
      return;
    }
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      if (activeTab === "driver") {
        const driverDocRef = doc(db, "motoristas_pre_aprovados", driverId);
        const driverDoc = await getDoc(driverDocRef);
        if (!driverDoc.exists() || driverDoc.data().uid) {
          setError("ID inválido ou já cadastrado.");
          await user.delete();
          setLoading(false);
          return;
        }
        await updateDoc(driverDocRef, {
          name: `${name} ${lastName}`,
          phone: phone.replace(/\D/g, ""),
          birthDate,
          email: user.email,
          uid: user.uid,
        });
      } else {
        await sendEmailVerification(user);
        const adminDocRef = doc(db, "admins_pre_aprovados", user.uid);
        await setDoc(adminDocRef, {
          uid: user.uid,
          email: user.email,
          name: `${name} ${lastName}`,
          phone: phone.replace(/\D/g, ""),
          birthDate,
          role: "admin",
        });
        await signOut(auth);
        setSuccessMessage("Conta criada! Verifique seu e-mail para ativar.");
        setIsLoginView(true);
      }
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        setError("Este e-mail já está em uso.");
      } else if (err.code === "auth/weak-password") {
        setError("Senha muito fraca (mínimo 6 caracteres).");
      } else {
        setError("Falha ao criar conta.");
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async (role: "admin" | "driver") => {
    setLoading(true);
    setError("");
    const provider = new GoogleAuthProvider();
    
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      if (!user) {
        setError("Falha na autenticação Google.");
        setLoading(false);
        return;
      }
      
      if (role === "admin") {
        if (!user.email?.endsWith("@shopee.com")) {
          setError("Admin requer conta @shopee.com.");
          await signOut(auth);
        }
      } else {
        if (user.email?.endsWith("@shopee.com")) {
          setError("Conta @shopee.com deve usar aba Administrador.");
          await signOut(auth);
          setLoading(false);
          return;
        }
        
        const q = query(collection(db, "motoristas_pre_aprovados"), where("googleUid", "==", user.uid));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          setGoogleUser(user);
          setIsLinkingGoogleAccount(true);
        }
      }
    } catch (err: any) {
      if (err.code !== "auth/popup-closed-by-user") {
        setError("Falha ao entrar com Google.");
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLinkAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLinkingError("");
    
    if (!driverId.trim()) {
      setLinkingError("Insira seu ID de motorista.");
      setLoading(false);
      return;
    }
    
    try {
      const driverDocRef = doc(db, "motoristas_pre_aprovados", driverId.trim());
      const driverDoc = await getDoc(driverDocRef);
      
      if (!driverDoc.exists()) {
        setLinkingError("ID não encontrado no sistema.");
        setLoading(false);
        return;
      }
      
      const driverData = driverDoc.data();
      if (driverData.uid || driverData.googleUid) {
        setLinkingError("ID já vinculado a outra conta.");
        setLoading(false);
        return;
      }
      
      await updateDoc(driverDoc.ref, {
        googleUid: googleUser.uid,
        email: googleUser.email,
        name: driverData.name || googleUser.displayName || "N/A",
        avatar: driverData.avatar || googleUser.photoURL,
      });
      
      setIsLinkingGoogleAccount(false);
      setGoogleUser(null);
      setDriverId("");
    } catch (err) {
      setLinkingError("Erro ao vincular conta.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoverLoading(true);
    setRecoverError("");
    setRecoverSuccess(false);
    
    if (!recoverEmail) {
      setRecoverError("Insira seu e-mail.");
      setRecoverLoading(false);
      return;
    }
    
    try {
      await sendPasswordResetEmail(auth, recoverEmail);
      setRecoverSuccess(true);
      setTimeout(() => {
        setShowRecoverModal(false);
        setRecoverEmail("");
        setRecoverSuccess(false);
      }, 3000);
    } catch (err: any) {
      switch (err.code) {
        case "auth/user-not-found":
          setRecoverError("E-mail não encontrado.");
          break;
        case "auth/invalid-email":
          setRecoverError("E-mail inválido.");
          break;
        case "auth/too-many-requests":
          setRecoverError("Muitas tentativas. Aguarde.");
          break;
        default:
          setRecoverError("Erro ao enviar e-mail.");
          console.error(err);
      }
    } finally {
      setRecoverLoading(false);
    }
  };

  // Account Linking Screen
  if (isLinkingGoogleAccount) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-zinc-950">
        {/* Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-900/20 via-transparent to-transparent" />
        </div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 w-full max-w-md p-6"
        >
          <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 p-8 shadow-2xl">
            <button
              onClick={() => {
                setIsLinkingGoogleAccount(false);
                setGoogleUser(null);
                signOut(auth);
              }}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <XMarkIcon className="w-5 h-5 text-zinc-400" />
            </button>
            
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                <TruckIcon className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Vincular Conta</h2>
              <p className="text-zinc-400 text-sm">
                Olá, {googleUser?.displayName || "Motorista"}! Vincule seu ID para continuar.
              </p>
            </div>
            
            <form onSubmit={handleLinkAccount} className="space-y-6">
              <FloatingInput
                label="ID do Motorista"
                icon={<HashIcon className="w-5 h-5" />}
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
                error={linkingError}
              />
              
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "w-full py-4 rounded-xl font-semibold text-white transition-all duration-200",
                  "bg-gradient-to-r from-orange-500 to-amber-500",
                  "hover:shadow-[0_0_30px_rgba(249,115,22,0.4)]",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Vinculando...</span>
                  </div>
                ) : (
                  "Vincular e Entrar"
                )}
              </motion.button>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex relative overflow-hidden bg-zinc-950">
      {/* Background Video/Image Layer */}
      <div className="absolute inset-0 z-0">
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-30"
          poster="/city-skyline-background.jpg"
        >
          <source src="/pinterest-video (1).mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/95 to-zinc-950/80" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-zinc-950/50" />
        {/* Noise texture overlay */}
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Main Content Grid */}
      <div className="relative z-10 flex flex-col lg:flex-row w-full min-h-screen">
        
        {/* Left Side - Login Form */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            {/* Logo & Brand */}
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/25">
                  <TruckIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">ROUTEFLOW</h1>
                  <p className="text-xs text-zinc-500 font-medium tracking-widest uppercase">Logistics Platform</p>
                </div>
              </div>
              <div className="space-y-1">
                <h2 className="text-3xl font-bold text-white">
                  {isLoginView ? "Bem-vindo de volta" : "Criar conta"}
                </h2>
                <p className="text-zinc-400">
                  {isLoginView 
                    ? "Entre para acessar o painel de operacoes" 
                    : "Preencha seus dados para comecar"
                  }
                </p>
              </div>
            </div>

            {/* Profile Type Toggle */}
            <div className="mb-8">
              <div className="relative p-1 bg-white/5 rounded-xl border border-white/10">
                <motion.div
                  className="absolute inset-y-1 w-[calc(50%-4px)] rounded-lg bg-gradient-to-r from-orange-500 to-amber-500"
                  animate={{ x: activeTab === "driver" ? 4 : "calc(100% + 4px)" }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
                <div className="relative flex">
                  <button
                    type="button"
                    onClick={() => setActiveTab("driver")}
                    className={cn(
                      "flex-1 py-3 text-sm font-semibold rounded-lg transition-colors z-10",
                      activeTab === "driver" ? "text-white" : "text-zinc-400 hover:text-zinc-300"
                    )}
                  >
                    Motorista
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("admin")}
                    className={cn(
                      "flex-1 py-3 text-sm font-semibold rounded-lg transition-colors z-10",
                      activeTab === "admin" ? "text-white" : "text-zinc-400 hover:text-zinc-300"
                    )}
                  >
                    Administrador
                  </button>
                </div>
              </div>
            </div>

            {/* Error/Success Messages */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                >
                  {error}
                </motion.div>
              )}
              {successMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm"
                >
                  {successMessage}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Login Form */}
            <AnimatePresence mode="wait">
              {isLoginView ? (
                <motion.form
                  key="login"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={handleLogin}
                  className="space-y-5"
                >
                  <FloatingInput
                    label="E-mail"
                    type="email"
                    icon={<MailIcon className="w-5 h-5" />}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                  
                  <div className="relative">
                    <FloatingInput
                      label="Senha"
                      type={showPassword ? "text" : "password"}
                      icon={<LockIcon className="w-5 h-5" />}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="w-5 h-5" />
                      ) : (
                        <EyeIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setShowRecoverModal(true)}
                      className="text-sm text-zinc-400 hover:text-orange-400 transition-colors"
                    >
                      Esqueceu a senha?
                    </button>
                  </div>

                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "w-full py-4 rounded-xl font-semibold text-white transition-all duration-200",
                      "bg-gradient-to-r from-orange-500 to-amber-500",
                      "hover:shadow-[0_0_30px_rgba(249,115,22,0.4)]",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Entrando...</span>
                      </div>
                    ) : (
                      "Entrar"
                    )}
                  </motion.button>

                  {/* Divider */}
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="px-4 text-zinc-500 bg-zinc-950">ou continue com</span>
                    </div>
                  </div>

                  {/* Google Sign In */}
                  <motion.button
                    type="button"
                    onClick={() => handleGoogleSignIn(activeTab)}
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "w-full py-4 rounded-xl font-semibold transition-all duration-200",
                      "bg-white/5 border border-white/10 text-white",
                      "hover:bg-white/10 hover:border-white/20",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      "flex items-center justify-center gap-3"
                    )}
                  >
                    <GoogleIcon />
                    <span>Continuar com Google</span>
                  </motion.button>

                  <p className="text-center text-sm text-zinc-500 pt-4">
                    Nao tem uma conta?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setIsLoginView(false);
                        setError("");
                        setSuccessMessage("");
                      }}
                      className="text-orange-400 hover:text-orange-300 font-medium transition-colors"
                    >
                      Cadastre-se
                    </button>
                  </p>
                </motion.form>
              ) : (
                <motion.form
                  key="register"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleRegister}
                  className="space-y-4"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setIsLoginView(true);
                      setError("");
                    }}
                    className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-4"
                  >
                    <ArrowLeftIcon className="w-4 h-4" />
                    <span className="text-sm">Voltar ao login</span>
                  </button>

                  <div className="grid grid-cols-2 gap-4">
                    <FloatingInput
                      label="Nome"
                      icon={<UserIcon className="w-5 h-5" />}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                    <FloatingInput
                      label="Sobrenome"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>

                  {activeTab === "driver" && (
                    <FloatingInput
                      label="ID do Motorista"
                      icon={<HashIcon className="w-5 h-5" />}
                      value={driverId}
                      onChange={(e) => setDriverId(e.target.value)}
                    />
                  )}

                  <FloatingInput
                    label="E-mail"
                    type="email"
                    icon={<MailIcon className="w-5 h-5" />}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />

                  <FloatingInput
                    label="Telefone"
                    type="tel"
                    icon={<PhoneIcon className="w-5 h-5" />}
                    value={phone}
                    onChange={(e) => setPhone(formatAndLimitPhone(e.target.value))}
                  />

                  <FloatingInput
                    label="Data de Nascimento"
                    type="date"
                    icon={<CalendarIcon className="w-5 h-5" />}
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                  />

                  <div className="relative">
                    <FloatingInput
                      label="Senha"
                      type={showPassword ? "text" : "password"}
                      icon={<LockIcon className="w-5 h-5" />}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="w-5 h-5" />
                      ) : (
                        <EyeIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "w-full py-4 rounded-xl font-semibold text-white transition-all duration-200 mt-6",
                      "bg-gradient-to-r from-orange-500 to-amber-500",
                      "hover:shadow-[0_0_30px_rgba(249,115,22,0.4)]",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Criando conta...</span>
                      </div>
                    ) : (
                      "Criar Conta"
                    )}
                  </motion.button>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Right Side - Dashboard Preview (Hidden on mobile) */}
        <div className="hidden lg:flex flex-1 items-center justify-center p-12">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full max-w-lg"
          >
            {/* Dashboard Card */}
            <div className="backdrop-blur-xl bg-white/[0.03] rounded-3xl border border-white/10 p-8 shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-bold text-white">Painel de Operacoes</h3>
                  <p className="text-sm text-zinc-500">Monitoramento em tempo real</p>
                </div>
                <StatusIndicator status="online" />
              </div>

              {/* Donut Chart */}
              <div className="flex justify-center mb-8">
                <AnimatedDonutChart percentage={metrics.successRate} label="Taxa de Sucesso" />
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <MetricCard
                  icon={TruckIcon}
                  value={metrics.deliveries.toLocaleString()}
                  label="Entregas Ativas"
                  trend="up"
                />
                <MetricCard
                  icon={MapPinIcon}
                  value={metrics.vehicles.toString()}
                  label="Veiculos em Rota"
                />
              </div>

              {/* Live Activity */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Atividade Recente</span>
                  <span className="text-orange-400 text-xs font-medium">Ao vivo</span>
                </div>
                
                {[
                  { driver: "Carlos M.", action: "Entrega concluida", time: "agora" },
                  { driver: "Ana S.", action: "Em rota", time: "2 min" },
                  { driver: "Pedro L.", action: "Novo chamado", time: "5 min" },
                ].map((activity, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center">
                      <span className="text-xs font-bold text-orange-400">
                        {activity.driver.split(" ")[0][0]}{activity.driver.split(" ")[1]?.[0] || ""}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{activity.driver}</p>
                      <p className="text-xs text-zinc-500">{activity.action}</p>
                    </div>
                    <span className="text-xs text-zinc-600">{activity.time}</span>
                  </motion.div>
                ))}
              </div>

              {/* Footer Stats */}
              <div className="mt-6 pt-6 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheckIcon className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs text-zinc-400">Conexao segura</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ChartBarIcon className="w-4 h-4 text-orange-400" />
                    <span className="text-xs text-zinc-400">99.9% uptime</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Password Recovery Modal */}
      <AnimatePresence>
        {showRecoverModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowRecoverModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md backdrop-blur-xl bg-zinc-900/90 rounded-3xl border border-white/10 p-8 shadow-2xl"
            >
              <button
                onClick={() => setShowRecoverModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-zinc-400" />
              </button>

              <div className="text-center mb-6">
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center">
                  <LockIcon className="w-7 h-7 text-orange-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Recuperar Senha</h3>
                <p className="text-sm text-zinc-400 mt-1">
                  Enviaremos um link para redefinir sua senha
                </p>
              </div>

              {recoverSuccess ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-6"
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <ShieldCheckIcon className="w-8 h-8 text-emerald-400" />
                  </div>
                  <p className="text-emerald-400 font-medium">E-mail enviado com sucesso!</p>
                  <p className="text-sm text-zinc-400 mt-1">Verifique sua caixa de entrada</p>
                </motion.div>
              ) : (
                <form onSubmit={handlePasswordRecovery} className="space-y-5">
                  <FloatingInput
                    label="E-mail"
                    type="email"
                    icon={<MailIcon className="w-5 h-5" />}
                    value={recoverEmail}
                    onChange={(e) => setRecoverEmail(e.target.value)}
                    error={recoverError}
                  />

                  <motion.button
                    type="submit"
                    disabled={recoverLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "w-full py-4 rounded-xl font-semibold text-white transition-all duration-200",
                      "bg-gradient-to-r from-orange-500 to-amber-500",
                      "hover:shadow-[0_0_30px_rgba(249,115,22,0.4)]",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    {recoverLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Enviando...</span>
                      </div>
                    ) : (
                      "Enviar Link"
                    )}
                  </motion.button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PremiumAuthPage;
