import { getTotalOnlineUsers } from "../hooks/usePresence";

const MAX_CONCURRENT_USERS = Number(
  import.meta.env.VITE_MAX_CONCURRENT_USERS || 50
);

export const canAcceptNewUser = async (): Promise<{
  allowed: boolean;
  currentCount: number;
  maxCount: number;
  message?: string;
}> => {
  try {
    const currentCount = await getTotalOnlineUsers();

    if (currentCount < MAX_CONCURRENT_USERS) {
      return {
        allowed: true,
        currentCount,
        maxCount: MAX_CONCURRENT_USERS,
      };
    }

    return {
      allowed: false,
      currentCount,
      maxCount: MAX_CONCURRENT_USERS,
      message: `Servidor cheio. ${currentCount}/${MAX_CONCURRENT_USERS} usuários online.`,
    };
  } catch (error) {
    console.error("Error checking user limit:", error);

    return {
      allowed: true,
      currentCount: 0,
      maxCount: MAX_CONCURRENT_USERS,
      message: "Could not verify user limit. Access granted.",
    };
  }
};

export const canBypassLimit = (userEmail: string): boolean => {
  const adminEmails: string[] = [];
  return adminEmails.includes(userEmail);
};

export const checkAccessPermission = async (
  userEmail?: string
): Promise<{
  allowed: boolean;
  reason?: string;
  currentCount?: number;
  maxCount?: number;
}> => {
  if (userEmail && canBypassLimit(userEmail)) {
    return {
      allowed: true,
      reason: "Admin bypass",
    };
  }

  const result = await canAcceptNewUser();

  if (!result.allowed) {
    return {
      allowed: false,
      reason: result.message,
      currentCount: result.currentCount,
      maxCount: result.maxCount,
    };
  }

  return {
    allowed: true,
    currentCount: result.currentCount,
    maxCount: result.maxCount,
  };
};

export const getServerStats = async () => {
  const currentCount = await getTotalOnlineUsers();

  return {
    currentUsers: currentCount,
    maxUsers: MAX_CONCURRENT_USERS,
    availableSlots: Math.max(0, MAX_CONCURRENT_USERS - currentCount),
    utilizationPercent: Math.round(
      (currentCount / MAX_CONCURRENT_USERS) * 100
    ),
    isFull: currentCount >= MAX_CONCURRENT_USERS,
  };
};
