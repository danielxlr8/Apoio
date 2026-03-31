import { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import type { User as FirebaseUser } from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  setDoc,
  onSnapshot,
  orderBy,
  limit,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import axios from "axios";
import { PremiumAuthPage } from "./components/PremiumAuthPage";
import { AdminDashboard } from "./components/AdminDashboard";
import { DriverInterface } from "./components/DriverInterface";
import { VerifyEmailPage } from "./components/VerifyEmailPage";
import { LoadingScreen } from "./components/LoadingScreen";
import { Toaster } from "sonner";
import { toast as sonnerToast } from "sonner";
import type {
  SupportCall as OriginalSupportCall,
  Driver,
} from "./types/logistics";
import { usePresence } from "./hooks/usePresence";
import { checkAccessPermission } from "./services/gatekeeper";

// ✅ CONFIGURAÇÃO DA API E SUPERADMIN
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const GOD_UID = import.meta.env.VITE_SUPERADMIN_UID; // Adicione seu UID no .env

export type SupportCall = OriginalSupportCall & {
  deletedAt?: any;
  mongoId?: string;
};

const LogOutIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" x2="9" y1="12" y2="12" />
  </svg>
);

interface UserData {
  uid: string;
  name: string;
  email: string;
  role: "admin" | "driver";
}

function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdminUnverified, setIsAdminUnverified] = useState(false);
  const [calls, setCalls] = useState<SupportCall[]>([]);
  const [callsLoading, setCallsLoading] = useState(true);
  const [callsError, setCallsError] = useState<Error | null>(null);

  // ✅ CONSTANTE DEUS: Identifica se você é o SuperAdmin
  const isGod = user?.uid === GOD_UID;

  useEffect(() => {
    setCallsLoading(true);
    const q = query(
      collection(db, "supportCalls"),
      orderBy("timestamp", "desc"),
      limit(100),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const callsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as SupportCall[];
        setCalls(callsData);
        setCallsLoading(false);
        setCallsError(null);
      },
      (error) => {
        console.error("Erro ao carregar chamados:", error);
        setCallsError(error as Error);
        setCallsLoading(false);
      },
    );
    return () => unsubscribe();
  }, []);

  const refreshCalls = () => {
    console.log("Chamados já estão em tempo real");
  };

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [driversLoading, setDriversLoading] = useState(true);
  const [driversError, setDriversError] = useState<Error | null>(null);

  useEffect(() => {
    setDriversLoading(true);
    const q = query(
      collection(db, "motoristas_pre_aprovados"),
      orderBy("name", "asc"),
      limit(200),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const driversData = snapshot.docs.map((doc) => ({
          uid: doc.id,
          ...doc.data(),
        })) as Driver[];
        setDrivers(driversData);
        setDriversLoading(false);
        setDriversError(null);
      },
      (error) => {
        console.error("Erro ao carregar motoristas:", error);
        setDriversError(error as Error);
        setDriversLoading(false);
      },
    );
    return () => unsubscribe();
  }, []);

  const refreshDrivers = () => {
    console.log("Motoristas já estão em tempo real");
  };

  usePresence(
    user?.uid || null,
    userData?.role || "driver",
    userData ? { name: userData.name, email: userData.email } : null,
    !!user && !!userData,
  );

  useEffect(() => {
    const safetyTimeout = setTimeout(() => {
      if (loading) {
        setLoading(false);
        setUser(null);
        setUserData(null);
      }
    }, 15000);

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        setIsAdminUnverified(false);
        if (currentUser) {
          await currentUser.reload();
          const accessCheck = await Promise.race([
            checkAccessPermission(currentUser.email || undefined),
            new Promise<any>((resolve) =>
              setTimeout(() => resolve({ allowed: true }), 5000),
            ),
          ]);

          if (!accessCheck.allowed) {
            sonnerToast.error("Servidor Cheio", {
              description:
                accessCheck.reason || "Tente novamente em instantes.",
              duration: 5000,
            });
            await signOut(auth);
            setLoading(false);
            return;
          }

          let resolvedUserData: UserData | null = null;
          if (currentUser.email?.endsWith("@shopee.com")) {
            if (!currentUser.emailVerified) {
              setUser(currentUser);
              setIsAdminUnverified(true);
              setLoading(false);
              return;
            }
            const adminDocRef = doc(
              db,
              "admins_pre_aprovados",
              currentUser.uid,
            );
            const adminDocSnap = await getDoc(adminDocRef);
            if (adminDocSnap.exists()) {
              resolvedUserData = adminDocSnap.data() as UserData;
            } else {
              const newAdminData: UserData = {
                uid: currentUser.uid,
                email: currentUser.email!,
                name: currentUser.displayName || "Admin Shopee",
                role: "admin",
              };
              await setDoc(adminDocRef, newAdminData);
              resolvedUserData = newAdminData;
            }
          } else {
            const driversRef = collection(db, "motoristas_pre_aprovados");
            const qUid = query(driversRef, where("uid", "==", currentUser.uid));
            const qGoogleUid = query(
              driversRef,
              where("googleUid", "==", currentUser.uid),
            );
            const [uidSnapshot, googleUidSnapshot] = await Promise.all([
              getDocs(qUid),
              getDocs(qGoogleUid),
            ]);
            const driverDoc = uidSnapshot.docs[0] || googleUidSnapshot.docs[0];
            if (driverDoc && driverDoc.exists()) {
              const driverData = driverDoc.data() as Driver;
              resolvedUserData = {
                uid: currentUser.uid,
                email: currentUser.email!,
                name: driverData.name,
                role: "driver",
              };
            }
          }

          if (resolvedUserData) {
            setUserData(resolvedUserData);
            setUser(currentUser);
          } else if (!isAdminUnverified) {
            await signOut(auth);
          }
        } else {
          setUser(null);
          setUserData(null);
        }
      } catch (error) {
        setUser(null);
        setUserData(null);
      } finally {
        setLoading(false);
        clearTimeout(safetyTimeout);
      }
    });
    return () => {
      clearTimeout(safetyTimeout);
      unsubscribe();
    };
  }, [isAdminUnverified]);

  // ✅ NOTIFICAÇÕES HUD: De-duplicação e Bypass Deus
  const activeToasts = new Set<string>();
  const safeToast = {
    success: (msg: string, opts?: any) => {
      if (activeToasts.has(msg)) return;
      activeToasts.add(msg);
      sonnerToast.success(msg, {
        ...opts,
        onDismiss: () => activeToasts.delete(msg),
        onAutoClose: () => activeToasts.delete(msg),
      });
    },
    error: (msg: string, opts?: any) => {
      if (activeToasts.has(msg)) return;
      activeToasts.add(msg);
      sonnerToast.error(msg, {
        ...opts,
        onDismiss: () => activeToasts.delete(msg),
        onAutoClose: () => activeToasts.delete(msg),
      });
    },
    info: (msg: string, opts?: any) => {
      if (activeToasts.has(msg)) return;
      activeToasts.add(msg);
      sonnerToast.info(msg, {
        ...opts,
        onDismiss: () => activeToasts.delete(msg),
        onAutoClose: () => activeToasts.delete(msg),
      });
    },
    warning: (msg: string, opts?: any) => {
      if (activeToasts.has(msg)) return;
      activeToasts.add(msg);
      sonnerToast.warning(msg, {
        ...opts,
        onDismiss: () => activeToasts.delete(msg),
        onAutoClose: () => activeToasts.delete(msg),
      });
    },
  };

  // HELPERS PARA API
  const getAuthHeader = async () => {
    if (!auth.currentUser) return {};
    const token = await auth.currentUser.getIdToken(true);
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const findMongoId = (firestoreId: string): string => {
    const call = calls.find((c) => c.id === firestoreId);
    if (call?.mongoId) return call.mongoId;
    return firestoreId;
  };

  const handleUpdateCall = async (
    id: string,
    updates: Partial<Omit<SupportCall, "id">>,
  ) => {
    const mongoId = findMongoId(id);
    if (!mongoId) return;
    try {
      const config = await getAuthHeader();
      await axios.patch(`${API_URL}/tickets/${mongoId}`, updates, config);
      safeToast.success("Atualizado com sucesso");
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 404) {
        const callDocRef = doc(db, "supportCalls", id);
        await updateDoc(callDocRef, updates);
        // ✅ Notificação técnica visível apenas para a Conta Deus
        if (isGod) safeToast.info("Chamado legado sincronizado localmente.");
      } else {
        console.error("Error updating call via API:", error);
        safeToast.error("Falha ao atualizar chamado.");
      }
    }
  };

  const handleDeleteCall = async (id: string) => {
    await handleUpdateCall(id, { status: "EXCLUIDO" });
  };

  const handlePermanentDeleteCall = async (id: string) => {
    const mongoId = findMongoId(id);
    if (!mongoId) return;
    try {
      const config = await getAuthHeader();
      await axios.delete(`${API_URL}/tickets/${mongoId}`, config);
      safeToast.success("Excluído permanentemente.");
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 404) {
        const callDocRef = doc(db, "supportCalls", id);
        await deleteDoc(callDocRef);
        if (isGod) safeToast.success("Chamado órfão removido do Firebase.");
      } else {
        console.error("Error deleting call via API:", error);
        safeToast.error("Erro ao excluir chamado.");
      }
    }
  };

  const handleDeleteAllExcluded = async () => {
    try {
      const config = await getAuthHeader();
      await axios.delete(`${API_URL}/tickets/purge/excluded`, config);
      safeToast.success("Lixeira esvaziada.");
    } catch (error) {
      console.error("Error clearing excluded calls via API:", error);
      safeToast.error("Erro ao limpar lixeira.");
    }
  };

  const renderContent = () => {
    if (loading || callsLoading || driversLoading) return <LoadingScreen />;
    if (user && isAdminUnverified) return <VerifyEmailPage user={user} />;
    if (!user || !userData) return <PremiumAuthPage />;

    if (callsError || driversError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4">
          <div className="text-red-600 bg-red-50 p-4 rounded-lg border border-red-200">
            <p className="font-bold">Erro de conexão</p>
            <p>Verifique sua conexão com o servidor.</p>
          </div>
          <button
            onClick={() => {
              refreshCalls();
              refreshDrivers();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Tentar Novamente
          </button>
        </div>
      );
    }

    switch (userData.role) {
      case "admin":
        return (
          <AdminDashboard
            calls={calls}
            drivers={drivers}
            updateCall={handleUpdateCall}
            onDeleteCall={handleDeleteCall}
            onDeletePermanently={handlePermanentDeleteCall}
            onDeleteAllExcluded={handleDeleteAllExcluded}
            onRefresh={() => {
              refreshCalls();
              refreshDrivers();
            }}
            isGod={isGod} // Passando privilégio master
          />
        );
      case "driver":
        const currentUser = auth.currentUser;
        if (!currentUser) return <PremiumAuthPage />;
        const driverProfile = drivers.find(
          (d) => d.uid === currentUser.uid || d.googleUid === currentUser.uid,
        );
        if (driverProfile) return <DriverInterface driver={driverProfile} />;
        return (
          <div className="flex items-center justify-center h-screen">
            <p>Carregando perfil...</p>
          </div>
        );
      default:
        signOut(auth);
        return <PremiumAuthPage />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* ✅ TOASTER CORRIGIDA: Dark theme, botão de fechar e de-duplicação configurada no safeToast */}
      <Toaster
        position="top-right"
        richColors
        theme="dark"
        closeButton
        duration={4000}
      />
      {user && userData && !isAdminUnverified && (
        <header className="bg-white shadow-md p-4 flex justify-between items-center">
          <div className="text-lg font-semibold text-gray-700">
            Bem-vindo,{" "}
            <span className="font-bold text-orange-600">{userData.name}</span>
            {isGod && (
              <span className="ml-2 text-xs text-blue-500 font-mono">
                [GOD MODE]
              </span>
            )}
          </div>
          <button
            onClick={() => signOut(auth)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg"
          >
            <LogOutIcon className="h-5 w-5" />
            <span>Sair</span>
          </button>
        </header>
      )}
      <main>{renderContent()}</main>
    </div>
  );
}

export default App;
