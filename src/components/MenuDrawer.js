// ────────────────────────────────────────────────────────────────────────────
// MenuDrawer — Drawer latéral (slide-in depuis la gauche)
//
// Contenu : Settings / About / Help / Logout (si connecté)
// Utilisé par : HomeScreen (et tout écran qui veut un menu)
// ────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Modal,
  Dimensions,
  Alert,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";

const { width } = Dimensions.get("window");
const DRAWER_WIDTH = Math.min(width * 0.78, 320);

const MENU_ITEMS = [
  { id: "settings", label: "Settings", icon: "cog-outline" },
  { id: "about", label: "About", icon: "information-outline" },
  { id: "help", label: "Help", icon: "help-circle-outline" },
];

export default function MenuDrawer({ visible, onClose }) {
  const { user, signOut, isAuthenticated } = useAuth();
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -DRAWER_WIDTH,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleMenuItem = (id) => {
    onClose();
    setTimeout(() => {
      if (id === "settings") {
        Alert.alert("⚙️ Settings", "À implémenter plus tard");
      } else if (id === "about") {
        Alert.alert(
          "🏡 À propos",
          "Decora v1.0 MVP\nDesign in 3D · Live in style",
        );
      } else if (id === "help") {
        Alert.alert("❓ Aide", "Pour toute question, contacte-nous !");
      }
    }, 250);
  };

  const handleLogout = () => {
    Alert.alert("Se déconnecter ?", "Tu retourneras en mode invité.", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Se déconnecter",
        style: "destructive",
        onPress: async () => {
          await signOut();
          onClose();
        },
      },
    ]);
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        {/* Backdrop click hors du drawer = ferme */}
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <TouchableOpacity
            activeOpacity={1}
            style={StyleSheet.absoluteFillObject}
            onPress={onClose}
          />
        </Animated.View>

        {/* Drawer */}
        <Animated.View
          style={[
            styles.drawer,
            { transform: [{ translateX: slideAnim }] },
          ]}
        >
          {/* ── Header user ── */}
          <View style={styles.userHeader}>
            <View style={styles.avatarWrap}>
              {isAuthenticated ? (
                <Text style={styles.avatarLetter}>
                  {(user.name || "U").charAt(0).toUpperCase()}
                </Text>
              ) : (
                <MaterialCommunityIcons
                  name="account"
                  size={28}
                  color="#a0a0c0"
                />
              )}
            </View>
            <Text style={styles.userName}>
              {isAuthenticated ? user.name : "Invité"}
            </Text>
            <Text style={styles.userEmail}>
              {isAuthenticated ? user.email : "Pas connecté"}
            </Text>
          </View>

          <View style={styles.divider} />

          {/* ── Items menu ── */}
          <View style={styles.menuList}>
            {MENU_ITEMS.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={() => handleMenuItem(item.id)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name={item.icon}
                  size={22}
                  color="#a0a0c0"
                />
                <Text style={styles.menuItemText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Logout (uniquement si connecté) ── */}
          {isAuthenticated && (
            <>
              <View style={styles.divider} />
              <TouchableOpacity
                style={styles.menuItemLogout}
                onPress={handleLogout}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="logout"
                  size={22}
                  color="#ef4444"
                />
                <Text style={styles.menuItemLogoutText}>Se déconnecter</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── Footer ── */}
          <View style={styles.drawerFooter}>
            <Text style={styles.drawerFooterText}>Decora v1.0 · MVP</Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
  },
  drawer: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: "#1a1a2e",
    paddingTop: 50,
    borderRightWidth: 1,
    borderRightColor: "rgba(255,255,255,0.08)",
  },
  userHeader: {
    paddingHorizontal: 22,
    paddingVertical: 16,
    alignItems: "flex-start",
  },
  avatarWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(233, 69, 96, 0.15)",
    borderWidth: 1.5,
    borderColor: "rgba(233, 69, 96, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarLetter: {
    color: "#e94560",
    fontSize: 22,
    fontWeight: "700",
  },
  userName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  userEmail: {
    color: "#a0a0c0",
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginVertical: 6,
  },
  menuList: {
    paddingTop: 6,
    paddingBottom: 6,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 22,
    paddingVertical: 14,
  },
  menuItemText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  menuItemLogout: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 22,
    paddingVertical: 14,
  },
  menuItemLogoutText: {
    color: "#ef4444",
    fontSize: 14,
    fontWeight: "600",
  },
  drawerFooter: {
    position: "absolute",
    bottom: 24,
    left: 22,
  },
  drawerFooterText: {
    color: "#404060",
    fontSize: 11,
    letterSpacing: 0.8,
  },
});
