import { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import type { User as FirebaseUser } from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  writeBatch,
  serverTimestamp,
  setDoc,
  onSnapshot,
  orderBy,
  limit,
} from "firebase/firestore";
import { AuthPage } from "./components/AuthPage";
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

export type SupportCall = OriginalSupportCall & {
  deletedAt?: any;
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

  // TEMPO REAL: Usar onSnapshot para receber atualizações instantâneas
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
    // Com onSnapshot, não precisa refresh manual, mas mantemos a função para compatibilidade
    console.log("Chamados já estão em tempo real");
  };

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [driversLoading, setDriversLoading] = useState(true);
  const [driversError, setDriversError] = useState<Error | null>(null);

  // TEMPO REAL: Usar onSnapshot para receber atualizações instantâneas dos motoristas
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
    // Com onSnapshot, não precisa refresh manual, mas mantemos a função para compatibilidade
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
        console.error("Authentication timeout reached");
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
              setTimeout(() => {
                console.warn("Gatekeeper timeout, allowing access");
                resolve({ allowed: true });
              }, 5000),
            ),
          ]);

          if (!accessCheck.allowed) {
            sonnerToast.error("Servidor Cheio", {
              description:
                accessCheck.reason || "Tente novamente em instantes.",
              duration: 5000,
            });

            console.warn("Access denied - Server full", {
              currentCount: accessCheck.currentCount,
              maxCount: accessCheck.maxCount,
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
          } else {
            console.error("User not found or unauthorized");
            if (!isAdminUnverified) {
              await signOut(auth);
            }
          }
        } else {
          setUser(null);
          setUserData(null);
        }
      } catch (error) {
        console.error("Authentication error:", error);
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

  const handleUpdateCall = async (
    id: string,
    updates: Partial<Omit<SupportCall, "id">>,
  ) => {
    const callDocRef = doc(db, "supportCalls", id);
    try {
      await updateDoc(callDocRef, updates);
      // onSnapshot vai atualizar automaticamente em tempo real
    } catch (error) {
      console.error("Error updating call:", error);
    }
  };

  const handleDeleteCall = async (id: string) => {
    await handleUpdateCall(id, {
      status: "EXCLUIDO",
      deletedAt: serverTimestamp(),
    });
  };

  const handlePermanentDeleteCall = async (id: string) => {
    const callDocRef = doc(db, "supportCalls", id);
    try {
      await deleteDoc(callDocRef);
      // onSnapshot vai atualizar automaticamente em tempo real
    } catch (error) {
      console.error("Error permanently deleting call:", error);
    }
  };

  const handleDeleteAllExcluded = async () => {
    const q = query(
      collection(db, "supportCalls"),
      where("status", "==", "EXCLUIDO"),
    );
    const querySnapshot = await getDocs(q);
    const batch = writeBatch(db);
    querySnapshot.forEach((doc) => batch.delete(doc.ref));
    try {
      await batch.commit();
      // onSnapshot vai atualizar automaticamente em tempo real
    } catch (error) {
      console.error("Error clearing excluded calls:", error);
    }
  };

  const renderContent = () => {
    if (loading || callsLoading || driversLoading) {
      return <LoadingScreen />;
    }

    if (user && isAdminUnverified) {
      return <VerifyEmailPage user={user} />;
    }

    if (!user || !userData) {
      return <AuthPage />;
    }

    if (callsError || driversError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4">
          {callsError && (
            <div className="text-red-600 bg-red-50 p-4 rounded-lg border border-red-200">
              <p className="font-bold">Erro ao carregar chamados:</p>
              {/* CORREÇÃO: Adicionado .message */}
              <p>{callsError.message}</p>
            </div>
          )}
          {driversError && (
            <div className="text-red-600 bg-red-50 p-4 rounded-lg border border-red-200">
              <p className="font-bold">Erro ao carregar motoristas:</p>
              {/* CORREÇÃO: Adicionado .message */}
              <p>{driversError.message}</p>
            </div>
          )}
          <button
            onClick={() => {
              refreshCalls();
              refreshDrivers();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
          />
        );
      case "driver":
        const currentUser = auth.currentUser;
        if (!currentUser) return <AuthPage />;

        const driverProfile = drivers.find(
          (d) => d.uid === currentUser.uid || d.googleUid === currentUser.uid,
        );

        if (driverProfile) {
          return <DriverInterface driver={driverProfile} />;
        }

        return (
          <div className="flex items-center justify-center h-screen">
            <p>Carregando perfil do motorista...</p>
          </div>
        );
      default:
        signOut(auth);
        return <AuthPage />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster position="top-right" richColors />
      {user && userData && !isAdminUnverified && (
        <header className="bg-white shadow-md p-4 flex justify-between items-center">
          <div className="text-lg font-semibold text-gray-700">
            Bem-vindo,{" "}
            <span className="font-bold text-orange-600">{userData.name}</span>
          </div>
          <button
            onClick={() => signOut(auth)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
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
