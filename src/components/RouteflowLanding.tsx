import React, { useState, useEffect, useRef } from "react";
import { 
  motion, 
  AnimatePresence, 
  useScroll, 
  useTransform, 
  useMotionValueEvent,
  useSpring
} from "framer-motion";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
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
  serverTimestamp,
} from "firebase/firestore";
import {
  Lock,
  Mail,
  User,
  LogIn,
  Briefcase,
  UserPlus,
  Phone,
  Hash,
  Calendar,
  Eye,
  EyeOff,
  Clock,
  MapPin,
  AlertTriangle,
  KeyRound,
  X,
  ChevronDown
} from "lucide-react";
import { cn } from "../lib/utils";
import { Loading } from "./ui/loading";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Capacitor } from "@capacitor/core";
import { GoogleAuth } from "@codetrix-studio/capacitor-google-auth";

const GoogleIcon = () => (
  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.519-3.487-11.187-8.264l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C42.022,35.244,44,30.036,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
  </svg>
);

const IDS_AUTORIZADOS = [
  "3310689", "233415", "199297", "1711883", "1326455", "181650", "3002590",
  "2090554", "121791", "2174736", "332194", "918480", "90310", "2215574",
  "33333", "222222", "2172201"
];

const springConfig = { type: "spring", stiffness: 300, damping: 20 };

// ==========================================
// 1) O AUTH MODAL (Contém 100% da lógica)
// ==========================================
const AuthModal = ({ isDayTime, formOpacity, formY, formPointerEvents }: any) => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [activeTab, setActiveTab] = useState<"admin" | "driver">("driver");
  const [previousTab, setPreviousTab] = useState<"admin" | "driver">("driver");
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState("");
  const [driverId, setDriverId] = useState("");
  
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [isLinkingGoogleAccount, setIsLinkingGoogleAccount] = useState(false);
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [linkingError, setLinkingError] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showRecoverModal, setShowRecoverModal] = useState(false);
  const [recoverEmail, setRecoverEmail] = useState("");
  const [recoverLoading, setRecoverLoading] = useState(false);
  const [recoverError, setRecoverError] = useState("");
  const [recoverSuccess, setRecoverSuccess] = useState(false);

  const [adminProfile, setAdminProfile] = useState<{ name: string; city: string; avatar: string; initials: string; } | null>(null);
  const [driverProfile, setDriverProfile] = useState<{ name: string; city: string; avatar: string; initials: string; } | null>(null);
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date());

  const getGreeting = () => {
    const hour = currentDateTime.getHours();
    if (hour >= 5 && hour < 12) return "Bom dia";
    if (hour >= 12 && hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  useEffect(() => {
    const updateDateTime = () => {
      setCurrentDateTime(new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })));
    };
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeTab === "admin") {
      const currentUser = auth.currentUser;
      if (currentUser && currentUser.email?.endsWith("@shopee.com")) {
        const fetchAdminProfile = async () => {
          try {
            const adminDocRef = doc(db, "admins_pre_aprovados", currentUser.uid);
            const adminDoc = await getDoc(adminDocRef);
            if (adminDoc.exists()) {
              const data = adminDoc.data();
              const nameData = data.name || currentUser.displayName || currentUser.email?.split("@")[0] || "Admin";
              const initials = nameData.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
              setAdminProfile({
                name: nameData, city: data.city || "Não informado", avatar: data.avatar || currentUser.photoURL || "", initials: initials,
              });
            } else {
              const nameData = currentUser.displayName || currentUser.email?.split("@")[0] || "Admin";
              const initials = nameData.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
              setAdminProfile({
                name: nameData, city: "Não informado", avatar: currentUser.photoURL || "", initials: initials,
              });
            }
          } catch (error) {
            setAdminProfile({ name: "Admin Shopee", city: "Brasil", avatar: "", initials: "AS" });
          }
        };
        fetchAdminProfile();
      } else {
        setAdminProfile({ name: "Admin Shopee", city: "Brasil", avatar: "", initials: "AS" });
      }
    } else {
      setAdminProfile(null);
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "driver") {
      const currentUser = auth.currentUser;
      if (currentUser && !currentUser.email?.endsWith("@shopee.com")) {
        const fetchDriverProfile = async () => {
          try {
            const driversRef = collection(db, "motoristas_pre_aprovados");
            const q = query(driversRef, where("uid", "==", currentUser.uid));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
              const driverData = querySnapshot.docs[0].data();
              const nameData = driverData.name || currentUser.displayName || currentUser.email?.split("@")[0] || "Motorista";
              const initials = nameData.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
              const hub = driverData.hub || "";
              const city = hub.split("_")[2] || driverData.city || "Não informado";
              setDriverProfile({
                name: nameData, city: city, avatar: driverData.avatar || currentUser.photoURL || "", initials: initials,
              });
            } else {
              const q2 = query(driversRef, where("googleUid", "==", currentUser.uid));
              const querySnapshot2 = await getDocs(q2);
              if (!querySnapshot2.empty) {
                const driverData = querySnapshot2.docs[0].data();
                const nameData = driverData.name || currentUser.displayName || currentUser.email?.split("@")[0] || "Motorista";
                const initials = nameData.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
                const hub = driverData.hub || "";
                const city = hub.split("_")[2] || driverData.city || "Não informado";
                setDriverProfile({
                  name: nameData, city: city, avatar: driverData.avatar || currentUser.photoURL || "", initials: initials,
                });
              } else {
                const nameData = currentUser.displayName || currentUser.email?.split("@")[0] || "Motorista";
                const initials = nameData.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
                setDriverProfile({
                  name: nameData, city: "Não informado", avatar: currentUser.photoURL || "", initials: initials,
                });
              }
            }
          } catch (error) {
            setDriverProfile({ name: "Motorista", city: "Brasil", avatar: "", initials: "M" });
          }
        };
        fetchDriverProfile();
      } else {
        setDriverProfile({ name: "Motorista", city: "Brasil", avatar: "", initials: "M" });
      }
    } else {
      setDriverProfile(null);
    }
  }, [activeTab]);

  const formatAndLimitPhone = (value: string) => {
    let digits = value.replace(/\D/g, "");
    digits = digits.slice(0, 11);
    if (digits.length > 2) digits = `(${digits.substring(0, 2)}) ${digits.substring(2)}`;
    if (digits.length > 9) digits = `${digits.substring(0, 9)}-${digits.substring(9)}`;
    return digits;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(""); setSuccessMessage("");
    if (activeTab === "driver" && email.endsWith("@shopee.com")) {
      setError("Contas @shopee.com devem usar aba Admin."); setLoading(false); return;
    }
    if (activeTab === "admin" && !email.endsWith("@shopee.com")) {
      setError("Admin só com @shopee.com."); setLoading(false); return;
    }
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (activeTab === "admin" && !userCredential.user.emailVerified) {
        setError("Verifique seu e-mail."); await signOut(auth); setLoading(false); return;
      }
    } catch (err: any) {
      if (["auth/user-not-found", "auth/wrong-password", "auth/invalid-credential"].includes(err.code)) {
        setError("E-mail ou senha inválidos.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Muitas tentativas. Tente mais tarde.");
      } else {
        setError("Falha ao entrar.");
      }
    } finally { setLoading(false); }
  };

  const handlePasswordRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoverLoading(true); setRecoverError(""); setRecoverSuccess(false);
    if (!recoverEmail) {
      setRecoverError("Por favor, insira seu e-mail."); setRecoverLoading(false); return;
    }
    try {
      await sendPasswordResetEmail(auth, recoverEmail);
      setRecoverSuccess(true); setRecoverError("");
      setTimeout(() => {
        setShowRecoverModal(false); setRecoverEmail(""); setRecoverSuccess(false);
      }, 3000);
    } catch (err: any) {
      switch (err.code) {
        case "auth/user-not-found": setRecoverError("E-mail não encontrado no sistema."); break;
        case "auth/invalid-email": setRecoverError("E-mail inválido."); break;
        case "auth/too-many-requests": setRecoverError("Muitas tentativas. Tente novamente mais tarde."); break;
        default: setRecoverError("Erro ao enviar e-mail de recuperação.");
      }
    } finally { setRecoverLoading(false); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(""); setSuccessMessage("");
    if (activeTab === "driver" && email.endsWith("@shopee.com")) {
      setError("Contas @shopee.com devem ser Admin."); setLoading(false); return;
    }
    if (activeTab === "admin" && !email.endsWith("@shopee.com")) {
      setError("Admin só com e-mail @shopee.com."); setLoading(false); return;
    }

    try {
      if (activeTab === "driver") {
        const idDigitado = driverId.trim();
        const isInjetado = IDS_AUTORIZADOS.map((id) => id.trim()).includes(idDigitado);
        const driverDocRef = doc(db, "motoristas_pre_aprovados", idDigitado);
        const driverDoc = await getDoc(driverDocRef);

        if (!isInjetado && !driverDoc.exists()) {
          setError("ID inválido ou não autorizado."); setLoading(false); return;
        }
        if (driverDoc.exists() && (driverDoc.data().uid || driverDoc.data().googleUid)) {
          setError("Este ID já está vinculado a outra conta."); setLoading(false); return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const driverDataToSave = {
          name: `${name} ${lastName}`, phone: phone.replace(/\D/g, ""), birthDate, email: user.email,
          uid: user.uid, shopeeId: idDigitado, document_id: idDigitado, status: "INDISPONIVEL", createdAt: serverTimestamp(),
        };

        if (driverDoc.exists()) await updateDoc(driverDocRef, driverDataToSave);
        else await setDoc(driverDocRef, driverDataToSave);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await sendEmailVerification(user);
        const adminDocRef = doc(db, "admins_pre_aprovados", user.uid);
        await setDoc(adminDocRef, {
          uid: user.uid, email: user.email, name: `${name} ${lastName}`, phone: phone.replace(/\D/g, ""), birthDate, role: "admin",
        });
        await signOut(auth);
        setSuccessMessage("Conta criada! Verifique seu e-mail.");
        setIsLoginView(true);
      }
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") setError("E-mail já em uso.");
      else if (err.code === "auth/weak-password") setError("Senha fraca (mínimo 6 caracteres).");
      else setError("Falha ao criar conta.");
    } finally { setLoading(false); }
  };

  const handleGoogleSignIn = async (role: "admin" | "driver") => {
    setLoading(true); setError("");
    try {
      let user;
      if (Capacitor.isNativePlatform()) {
        GoogleAuth.initialize({
          clientId: "COLE_AQUI_O_SEU_ID_DO_CLIENTE_DA_WEB.apps.googleusercontent.com",
          scopes: ["profile", "email"], grantOfflineAccess: true,
        });
        try { await GoogleAuth.signOut(); } catch (clearError) {}
        const googleUser = await GoogleAuth.signIn();
        const credential = GoogleAuthProvider.credential(googleUser.authentication.idToken);
        const result = await signInWithCredential(auth, credential);
        user = result.user;
      } else {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        user = result.user;
      }

      if (!user) { setError("Falha no Google."); setLoading(false); return; }

      if (role === "admin") {
        if (!user.email?.endsWith("@shopee.com")) {
          setError("Admin só com @shopee.com."); await signOut(auth);
        }
      } else {
        if (user.email?.endsWith("@shopee.com")) {
          setError("Conta @shopee.com deve usar aba Admin."); await signOut(auth); setLoading(false); return;
        }
        const q = query(collection(db, "motoristas_pre_aprovados"), where("googleUid", "==", user.uid));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
          setGoogleUser(user); setIsLinkingGoogleAccount(true);
        }
      }
    } catch (err: any) {
      if (err.code !== "auth/popup-closed-by-user") setError("Falha ao entrar com Google.");
    } finally { setLoading(false); }
  };

  const handleLinkAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setLinkingError("");
    const idDigitado = driverId.trim();
    if (!idDigitado) { setLinkingError("Insira seu ID."); setLoading(false); return; }

    try {
      const isInjetado = IDS_AUTORIZADOS.map((id) => id.trim()).includes(idDigitado);
      const driverDocRef = doc(db, "motoristas_pre_aprovados", idDigitado);
      const driverDoc = await getDoc(driverDocRef);

      if (!isInjetado && !driverDoc.exists()) {
        setLinkingError("ID inválido ou não autorizado."); setLoading(false); return;
      }
      if (driverDoc.exists() && (driverDoc.data().uid || driverDoc.data().googleUid)) {
        setLinkingError("ID já vinculado a outro motorista."); setLoading(false); return;
      }

      const driverDataToSave = {
        googleUid: googleUser.uid, uid: googleUser.uid, email: googleUser.email, shopeeId: idDigitado, document_id: idDigitado,
        name: (driverDoc.exists() ? driverDoc.data().name : "") || googleUser.displayName || "Motorista",
        avatar: (driverDoc.exists() ? driverDoc.data().avatar : "") || googleUser.photoURL || "",
        status: "INDISPONIVEL", createdAt: serverTimestamp(),
      };

      if (driverDoc.exists()) await updateDoc(driverDocRef, driverDataToSave);
      else await setDoc(driverDocRef, driverDataToSave);

      setIsLinkingGoogleAccount(false); setGoogleUser(null); setDriverId("");
    } catch (err) {
      setLinkingError("Erro ao vincular.");
    } finally { setLoading(false); }
  };

  const UITheme = {
    modalBg: isDayTime ? "bg-white/10" : "bg-black/40",
    modalBorder: isDayTime ? "border-white/60" : "border-white/10",
    modalShadow: isDayTime ? "shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)]" : "shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)]",
    inputBg: isDayTime ? "bg-white/50 border-white/80 text-slate-900 placeholder:text-slate-500" : "bg-black/20 border-white/10 text-white placeholder:text-white/40",
    textMain: isDayTime ? "text-slate-900" : "text-white",
    textSecondary: isDayTime ? "text-slate-600" : "text-slate-400",
    tabBg: isDayTime ? "bg-white/40 border-white/60" : "bg-black/40 border-white/10",
    tabItemTextIdd: isDayTime ? "text-slate-400 hover:text-slate-700" : "text-white/50 hover:text-white/90"
  };

  return (
    <>
      {/* 1.A VIEW: VÍNCULO DE CONTA GOOGLE */}
      <AnimatePresence>
        {isLinkingGoogleAccount && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={springConfig}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} transition={springConfig} className={cn("w-full max-w-lg rounded-[2.5rem] p-8 md:p-10 backdrop-blur-2xl border-2 shadow-2xl", UITheme.modalBg, UITheme.modalBorder)}>
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg bg-orange-500 border-b-8 border-orange-700 active:border-b-0 active:translate-y-2">
                  <Hash size={40} className="text-white" />
                </div>
              </div>
              <h2 className={cn("text-3xl md:text-4xl font-extrabold text-center mb-2", UITheme.textMain)}>Validação de Acesso</h2>
              <p className={cn("text-center mb-8", UITheme.textSecondary)}>Digite seu ID de motorista para prosseguir</p>
              
              <form onSubmit={handleLinkAccount} className="space-y-6">
                <label className="block text-sm font-bold uppercase tracking-wide mb-2 text-orange-500">ID do Motorista</label>
                <div className="relative">
                  <input type="text" value={driverId} onChange={(e) => setDriverId(e.target.value)} className={cn("w-full p-4 pl-12 rounded-2xl text-lg font-medium border-2 transition-all outline-none", UITheme.inputBg, linkingError ? "border-red-500/50 focus:ring-red-500/30" : "focus:ring-orange-500/30 focus:border-orange-500/50")} placeholder="ID..." required />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500"><Hash size={20} /></div>
                </div>
                {linkingError && <p className="text-sm text-red-500 font-medium flex gap-2"><AlertTriangle size={16}/>{linkingError}</p>}
                
                {/* 3D PIXEL BUTTON */}
                <button type="submit" disabled={loading || !driverId.trim()} className="w-full py-4 rounded-2xl font-bold text-lg text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:active:border-b-8 disabled:active:translate-y-0 bg-orange-500 border-b-[8px] border-orange-700 active:border-b-0 active:translate-y-[8px] flex items-center justify-center gap-2">
                  {loading ? <Loading size="sm" variant="spinner" /> : <><LogIn size={20} /><span>Validar e Entrar</span></>}
                </button>
                <button type="button" onClick={async () => { if (auth.currentUser) await signOut(auth); setIsLinkingGoogleAccount(false); setGoogleUser(null); setLinkingError(""); setDriverId(""); }} className={cn("w-full text-center text-sm font-bold py-2 hover:opacity-75 transition-opacity", UITheme.textSecondary)}>Cancelar</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1.B VIEW: RECOVER PASSWORD */}
      <AnimatePresence>
        {showRecoverModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={() => setShowRecoverModal(false)}>
             <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }} transition={springConfig} onClick={(e) => e.stopPropagation()} className={cn("w-full max-w-sm rounded-[2rem] border-2 shadow-2xl p-6", UITheme.modalBg, UITheme.modalBorder)}>
                <div className="flex justify-between items-center mb-6 pt-2">
                  <h3 className={cn("text-2xl font-black", UITheme.textMain)}>Recuperar Senha</h3>
                  <button onClick={() => setShowRecoverModal(false)} className={cn("opacity-50 hover:opacity-100 hover:text-orange-500 p-2 rounded-full", UITheme.textMain)}><X size={20} /></button>
                </div>
                <form onSubmit={handlePasswordRecovery} className="space-y-4 pt-4">
                  <input type="email" placeholder="Seu e-mail cadastrado" value={recoverEmail} onChange={(e) => setRecoverEmail(e.target.value)} className={cn("w-full px-4 py-4 rounded-xl border-2 outline-none font-medium", UITheme.inputBg)} required disabled={recoverLoading || recoverSuccess} />
                  {recoverError && <p className="text-red-500 font-semibold text-sm bg-red-100/50 p-3 rounded-lg border border-red-500/30">{recoverError}</p>}
                  {recoverSuccess && <p className="text-green-500 font-semibold text-sm bg-green-100/50 p-3 rounded-lg border border-green-500/30">Link enviado!</p>}
                  <button type="submit" disabled={recoverLoading || recoverSuccess} className="w-full py-4 rounded-xl font-extrabold text-white mt-4 bg-orange-500 border-b-[6px] border-orange-700 active:translate-y-[6px] active:border-b-0 transition-all disabled:opacity-50 disabled:active:border-b-[6px] disabled:active:translate-y-0">
                    {recoverLoading ? "Enviando..." : "Enviar Link"}
                  </button>
                </form>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL PRINCIPAL ROOT (GLASSMORPHISM INTERATIVO GAME UI) */}
      <motion.div 
        style={{ opacity: formOpacity, y: formY, pointerEvents: formPointerEvents }}
        className={cn(
          "absolute z-20 w-full max-w-xl mx-auto p-4 md:p-8 rounded-[2.5rem] shadow-2xl backdrop-blur-2xl border flex flex-col items-center", 
          UITheme.modalBg, UITheme.modalBorder, UITheme.modalShadow
        )}
      >
        {/* TABS DE ADMIN VS MOTORISTA */}
        <div className={cn("relative flex p-1.5 rounded-2xl w-full mb-8 backdrop-blur-md border shadow-inner", UITheme.tabBg)}>
          <motion.div
            className="absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] rounded-xl bg-orange-500 border-b-4 border-orange-700 shadow-md"
            initial={false}
            animate={{ x: activeTab === "driver" ? "0%" : "100%" }}
            transition={springConfig}
          />
          <button onClick={() => { setPreviousTab(activeTab); setActiveTab("driver"); }} className={cn("relative z-10 flex-1 py-3 text-base font-bold flex items-center justify-center gap-2 transition-colors", activeTab === "driver" ? "text-white" : UITheme.tabItemTextIdd)}>
             <User size={18} /> Motorista
          </button>
          <button onClick={() => { setPreviousTab(activeTab); setActiveTab("admin"); }} className={cn("relative z-10 flex-1 py-3 text-base font-bold flex items-center justify-center gap-2 transition-colors", activeTab === "admin" ? "text-white" : UITheme.tabItemTextIdd)}>
             <Briefcase size={18} /> Admin
          </button>
        </div>

        <h2 className={cn("text-3xl font-extrabold text-center mb-6 tracking-tight", UITheme.textMain)}>
          {isLoginView ? "Acessar Conta" : "Criar Conta"}
        </h2>

        {error && <p className="w-full text-center text-sm text-red-500 bg-red-100/50 border border-red-500/20 rounded-xl p-3 mb-4 font-semibold">{error}</p>}
        {successMessage && <p className="w-full text-center text-sm text-green-500 bg-green-100/50 border border-green-500/20 rounded-xl p-3 mb-4 font-semibold">{successMessage}</p>}

        {/* FORMS NATIVOS 3D CARTOON */}
        <div className="w-full">
          <AnimatePresence mode="wait">
            {isLoginView ? (
              <motion.form key="login" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }} transition={springConfig} onSubmit={handleLogin} className="space-y-4">
                <div className="relative">
                  <Mail className={cn("absolute left-4 top-1/2 -translate-y-1/2", UITheme.textSecondary)} size={20} />
                  <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} className={cn("w-full pl-12 pr-4 py-4 rounded-xl border-2 transition-all outline-none font-medium focus:border-orange-500", UITheme.inputBg)} required />
                </div>
                <div className="relative">
                  <Lock className={cn("absolute left-4 top-1/2 -translate-y-1/2", UITheme.textSecondary)} size={20} />
                  <input type={showPassword ? "text" : "password"} placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} className={cn("w-full pl-12 pr-12 py-4 rounded-xl border-2 transition-all outline-none font-medium focus:border-orange-500", UITheme.inputBg)} required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className={cn("absolute right-4 top-1/2 -translate-y-1/2 hover:text-orange-500 transition-colors", UITheme.textSecondary)}>
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <div className="flex justify-end pt-1">
                  <button type="button" onClick={() => setShowRecoverModal(true)} className="text-sm text-orange-500 hover:text-orange-600 font-bold transition-colors flex gap-1">
                    <KeyRound size={14} /> Esqueci minha senha
                  </button>
                </div>
                {/* 3D ACTION BTN */}
                <button type="submit" disabled={loading} className="w-full mt-2 py-4 rounded-2xl flex items-center justify-center gap-2 text-white font-extrabold text-lg bg-orange-500 border-b-[6px] border-orange-700 active:border-b-0 active:translate-y-[6px] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? <Loading size="sm" variant="spinner" /> : <><LogIn size={20} /> Entrar</>}
                </button>
              </motion.form>
            ) : (
              <motion.form key="register" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} transition={springConfig} onSubmit={handleRegister} className="space-y-4">
                 <div className="grid grid-cols-2 gap-3">
                   <div className="relative">
                     <User className={cn("absolute left-3 top-1/2 -translate-y-1/2", UITheme.textSecondary)} size={18} />
                     <input type="text" placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} className={cn("w-full pl-10 pr-3 py-3.5 rounded-xl border-2 outline-none font-medium text-sm focus:border-orange-500", UITheme.inputBg)} required />
                   </div>
                   <div className="relative">
                     <User className={cn("absolute left-3 top-1/2 -translate-y-1/2", UITheme.textSecondary)} size={18} />
                     <input type="text" placeholder="Sobrenome" value={lastName} onChange={(e) => setLastName(e.target.value)} className={cn("w-full pl-10 pr-3 py-3.5 rounded-xl border-2 outline-none font-medium text-sm focus:border-orange-500", UITheme.inputBg)} required />
                   </div>
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                   <div className="relative">
                     <Calendar className={cn("absolute left-3 top-1/2 -translate-y-1/2", UITheme.textSecondary)} size={18} />
                     <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className={cn("w-full pl-10 pr-3 py-3.5 rounded-xl border-2 outline-none font-medium text-sm focus:border-orange-500", UITheme.inputBg)} required />
                   </div>
                   <div className="relative">
                     <Phone className={cn("absolute left-3 top-1/2 -translate-y-1/2", UITheme.textSecondary)} size={18} />
                     <input type="tel" placeholder="Telefone" value={phone} onChange={(e) => setPhone(formatAndLimitPhone(e.target.value))} className={cn("w-full pl-10 pr-3 py-3.5 rounded-xl border-2 outline-none font-medium text-sm focus:border-orange-500", UITheme.inputBg)} required />
                   </div>
                 </div>
                 {activeTab === "driver" && (
                   <div className="relative">
                     <Hash className={cn("absolute left-4 top-1/2 -translate-y-1/2", UITheme.textSecondary)} size={20} />
                     <input type="text" placeholder="ID Motorista" value={driverId} onChange={(e) => setDriverId(e.target.value)} className={cn("w-full pl-12 pr-4 py-4 rounded-xl border-2 outline-none font-medium text-sm focus:border-orange-500", UITheme.inputBg)} required />
                   </div>
                 )}
                 <div className="relative">
                   <Mail className={cn("absolute left-4 top-1/2 -translate-y-1/2", UITheme.textSecondary)} size={20} />
                   <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} className={cn("w-full pl-12 pr-4 py-4 rounded-xl border-2 outline-none font-medium text-sm focus:border-orange-500", UITheme.inputBg)} required />
                 </div>
                 <div className="relative">
                   <Lock className={cn("absolute left-4 top-1/2 -translate-y-1/2", UITheme.textSecondary)} size={20} />
                   <input type={showPassword ? "text" : "password"} placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} className={cn("w-full pl-12 pr-12 py-4 rounded-xl border-2 outline-none font-medium text-sm focus:border-orange-500", UITheme.inputBg)} required />
                   <button type="button" onClick={() => setShowPassword(!showPassword)} className={cn("absolute right-4 top-1/2 -translate-y-1/2 hover:text-orange-500 transition-colors", UITheme.textSecondary)}>
                     {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                   </button>
                 </div>
                 {/* 3D ACTION BTN */}
                 <button type="submit" disabled={loading} className="w-full mt-4 py-4 rounded-2xl flex items-center justify-center gap-2 text-white font-extrabold text-lg bg-orange-500 border-b-[6px] border-orange-700 active:border-b-0 active:translate-y-[6px] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                   {loading ? <Loading size="sm" variant="spinner" /> : <><UserPlus size={20} /> Criar Conta</>}
                 </button>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="mt-8 text-center pt-6 border-t border-white/10">
             <button onClick={() => { setPreviousTab(activeTab); setIsLoginView(!isLoginView); setError(""); setSuccessMessage(""); }} className="font-bold text-orange-500 hover:text-orange-600 transition-colors">
               {isLoginView ? "Criar uma conta nova" : "Já possuo uma conta"}
             </button>
          </div>

          {/* GOOGLE BTN */}
          <button onClick={() => handleGoogleSignIn(activeTab)} disabled={loading} className={cn("w-full mt-4 flex justify-center items-center gap-3 py-4 rounded-xl border-2 bg-white text-slate-800 border-b-[6px] border-gray-300 active:border-b-2 active:translate-y-[4px] font-bold text-lg transition-all", isDayTime ? "border-gray-300" : "bg-zinc-800 border-zinc-950 text-white")}>
             <GoogleIcon /> Continuar com Google
          </button>
        </div>
      </motion.div>
    </>
  );
};

// ==========================================
// 2) COMPONENTE PRINCIPAL SCROLLYTELLING
// ==========================================
export const RouteflowLanding = () => {
  const [isDayTime, setIsDayTime] = useState(true);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const checkTime = () => {
      const h = new Date().getHours();
      setIsDayTime(h >= 6 && h < 18);
    };
    checkTime();
    const intv = setInterval(checkTime, 60000);
    return () => clearInterval(intv);
  }, []);

  // SCROLL MAPPING DO FRAMER MOTION
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] });
  const springProgress = useSpring(scrollYProgress, { stiffness: 300, damping: 20 });
  
  const rafId = useRef<number | null>(null);

  // IMPORTANTE: Rode ffmpeg -i input.mp4 -g 1 -c:v libx264 output.mp4 para os vídeos
  // A van surgirá e desaparecerá frame a frame acompanhando o scroll exatamente.
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (videoRef.current && videoRef.current.duration) {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.currentTime = latest * videoRef.current.duration;
        }
      });
    }
  });

  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, -200]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  
  // Aqui acionamos o Bounce da Mola no modal usando o `springProgress`
  const formOpacity = useTransform(springProgress, [0.15, 0.3], [0, 1]);
  const formY = useTransform(springProgress, [0.15, 0.3], [100, 0]);
  const formPointerEvents = useTransform(scrollYProgress, [0.2, 0.3], ["none", "auto"]) as any;

  return (
    <section ref={containerRef} className={cn("relative h-[300vh] w-full font-sans selection:bg-orange-500 selection:text-white", isDayTime ? "bg-slate-50" : "bg-zinc-950")}>
      <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col items-center justify-center">
        
        {/* PARALLAX VIDEO COM SCROLL */}
        <video
          ref={videoRef}
          src={isDayTime ? "/Dia.mp4" : "/Noite.mp4"}
          className="absolute inset-0 w-full h-full object-cover"
          muted
          playsInline
          preload="auto"
        />

        <motion.div 
          className={cn("absolute inset-0 transition-opacity", isDayTime ? "bg-white/20" : "bg-black/40")}
          style={{ opacity: formOpacity }}
        />

        {/* HERO TEXT Animado ao descer a página */}
        <motion.div 
          className="absolute z-10 p-4 text-center pointer-events-none flex flex-col items-center"
          style={{ opacity: heroOpacity, y: heroY }}
        >
          <h1 className={cn("text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-4", isDayTime ? "text-slate-800" : "text-white")}>
            Cada rota conta. <br />
            <span className="text-orange-500">Cada motorista importa.</span>
          </h1>
          <motion.div 
            animate={{ y: [0, 10, 0] }} 
            transition={{ repeat: Infinity, duration: 2 }}
            className={cn("mt-12 opacity-50 flex flex-col items-center gap-2", isDayTime ? "text-slate-800" : "text-white")}
          >
            <span className="text-sm uppercase tracking-widest font-bold">Role para acessar</span>
            <ChevronDown size={32} />
          </motion.div>
        </motion.div>

        {/* INVOCAÇÃO DO AuthModal ENCAPSULANDO O FIREBASE */}
        <AuthModal 
          isDayTime={isDayTime} 
          formOpacity={formOpacity} 
          formY={formY} 
          formPointerEvents={formPointerEvents} 
        />
      </div>
    </section>
  );
};
