// ────────────────────────────────────────────────────────────────────────────
// AuthContext — Gestion globale de l'auth (mocked pour MVP)
//
// Plus tard, quand on branchera le back :
//  - signInWithGoogle() → vraie OAuth via expo-auth-session
//  - Le reste du code reste identique
// ────────────────────────────────────────────────────────────────────────────

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AUTH_KEY = "@decora_user_v1";

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modal state — contrôlé par requireAuth()
  const [modalVisible, setModalVisible] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [pendingMessage, setPendingMessage] = useState(null);

  // ── Au mount : restaurer la session depuis AsyncStorage ─────────
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(AUTH_KEY);
        if (raw) setUser(JSON.parse(raw));
      } catch (e) {
        console.warn("Auth restore error:", e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // ── MOCK : Sign in with Google ──────────────────────────────────
  // Plus tard : remplacer par vraie OAuth via expo-auth-session
  const signInWithGoogle = useCallback(async () => {
    setIsLoading(true);
    try {
      // Simule le délai OAuth
      await new Promise((r) => setTimeout(r, 1500));

      const fakeUser = {
        id: "g_" + Date.now(),
        name: "Marie Dupont",
        email: "marie.dupont@gmail.com",
        photoUrl: null, // plus tard on aura une vraie photo Google
        provider: "google",
        createdAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(fakeUser));
      setUser(fakeUser);
      return fakeUser;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Sign out ─────────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    await AsyncStorage.removeItem(AUTH_KEY);
    setUser(null);
  }, []);

  // ── Helper : exécute une action SI connecté, sinon ouvre le modal
  const requireAuth = useCallback(
    (action, message) => {
      if (user) {
        // Déjà connecté → action directe
        action();
      } else {
        // Pas connecté → modal popup
        setPendingAction(() => action);
        setPendingMessage(message || null);
        setModalVisible(true);
      }
    },
    [user],
  );

  // Appelé par LoginModal après un sign-in réussi
  const finishLogin = useCallback(() => {
    if (pendingAction) {
      const fn = pendingAction;
      setPendingAction(null);
      setModalVisible(false);
      setPendingMessage(null);
      // Petite tempo pour laisser le modal se fermer avant l'action
      setTimeout(() => fn(), 150);
    } else {
      setModalVisible(false);
      setPendingMessage(null);
    }
  }, [pendingAction]);

  // Appelé si l'user ferme le modal sans se connecter
  const cancelLogin = useCallback(() => {
    setModalVisible(false);
    setPendingAction(null);
    setPendingMessage(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        // State
        user,
        isAuthenticated: !!user,
        isLoading,
        // Actions
        signInWithGoogle,
        signOut,
        requireAuth,
        // Modal (utilisé par LoginModal)
        modalVisible,
        pendingMessage,
        finishLogin,
        cancelLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
