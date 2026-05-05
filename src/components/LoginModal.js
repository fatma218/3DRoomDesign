// ────────────────────────────────────────────────────────────────────────────
// LoginModal — Popup de connexion (Google + Continuer comme invité)
//
// Affiché AUTOMATIQUEMENT quand un user "guest" tape une action protégée
// via requireAuth() de AuthContext.
// ────────────────────────────────────────────────────────────────────────────

import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";

export default function LoginModal() {
  const {
    modalVisible,
    pendingMessage,
    signInWithGoogle,
    finishLogin,
    cancelLogin,
  } = useAuth();
  const [signingIn, setSigningIn] = useState(false);

  const handleGoogle = async () => {
    if (signingIn) return;
    setSigningIn(true);
    try {
      await signInWithGoogle();
      finishLogin();
    } catch (e) {
      console.error("Google sign-in error:", e);
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <Modal
      visible={modalVisible}
      animationType="fade"
      transparent={true}
      onRequestClose={cancelLogin}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Bouton fermer en haut */}
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={cancelLogin}
            disabled={signingIn}
          >
            <MaterialCommunityIcons name="close" size={20} color="#a0a0c0" />
          </TouchableOpacity>

          {/* Icône cadenas */}
          <View style={styles.iconWrap}>
            <Text style={styles.icon}>🔒</Text>
          </View>

          {/* Titre */}
          <Text style={styles.title}>Connexion requise</Text>
          <Text style={styles.subtitle}>
            {pendingMessage ||
              "Pour continuer, connecte-toi avec ton compte Google"}
          </Text>

          {/* Bouton Google */}
          <TouchableOpacity
            style={styles.googleBtn}
            onPress={handleGoogle}
            disabled={signingIn}
            activeOpacity={0.85}
          >
            {signingIn ? (
              <ActivityIndicator color="#1a1a2e" size="small" />
            ) : (
              <>
                <MaterialCommunityIcons
                  name="google"
                  size={22}
                  color="#1a1a2e"
                />
                <Text style={styles.googleBtnText}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Séparateur */}
          <View style={styles.separator}>
            <View style={styles.line} />
            <Text style={styles.separatorText}>ou</Text>
            <View style={styles.line} />
          </View>

          {/* Bouton Guest (annule l'action et ferme) */}
          <TouchableOpacity
            style={styles.guestBtn}
            onPress={cancelLogin}
            disabled={signingIn}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons
              name="account-outline"
              size={20}
              color="#a0a0c0"
            />
            <Text style={styles.guestBtnText}>Continuer comme invité</Text>
          </TouchableOpacity>

          <Text style={styles.hint}>
            En tant qu'invité, tu ne peux pas sauvegarder ni liker
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: "#252544",
    borderRadius: 24,
    padding: 28,
    width: "100%",
    maxWidth: 400,
    borderWidth: 1,
    borderColor: "#3d3d6e",
    alignItems: "center",
  },
  closeBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(239, 137, 154, 0.15)",
    borderWidth: 1.5,
    borderColor: "rgba(239, 137, 154, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    marginTop: 8,
  },
  icon: { fontSize: 36 },
  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 6,
    textAlign: "center",
  },
  subtitle: {
    color: "#a0a0c0",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 24,
    paddingHorizontal: 6,
  },
  googleBtn: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    width: "100%",
    minHeight: 50,
  },
  googleBtnText: {
    color: "#1a1a2e",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  separator: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginVertical: 14,
    gap: 10,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  separatorText: {
    color: "#a0a0c0",
    fontSize: 11,
    fontWeight: "600",
  },
  guestBtn: {
    flexDirection: "row",
    backgroundColor: "transparent",
    borderWidth: 1.2,
    borderColor: "rgba(255,255,255,0.2)",
    paddingVertical: 13,
    paddingHorizontal: 22,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
  },
  guestBtnText: {
    color: "#a0a0c0",
    fontSize: 13,
    fontWeight: "600",
  },
  hint: {
    color: "#606080",
    fontSize: 11,
    textAlign: "center",
    marginTop: 14,
    fontStyle: "italic",
  },
});
