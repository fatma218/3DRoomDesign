// ────────────────────────────────────────────────────────────────────────────
// ProfileScreen — Profil utilisateur (avatar + stats + logout)
// Si pas connecté → invite à se connecter
// ────────────────────────────────────────────────────────────────────────────

import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { listSavedDesigns } from "../utils/savedDesigns";
import { listLikedRoomIds } from "../utils/likedRooms";
import BottomNavBar from "../components/BottomNavBar";

export default function ProfileScreen({ navigation }) {
  const { user, isAuthenticated, signOut, requireAuth } = useAuth();
  const [stats, setStats] = useState({ designs: 0, likes: 0 });

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      (async () => {
        const designs = await listSavedDesigns();
        const likes = await listLikedRoomIds();
        if (mounted) {
          setStats({ designs: designs.length, likes: likes.length });
        }
      })();
      return () => {
        mounted = false;
      };
    }, []),
  );

  const handleLogout = () => {
    Alert.alert("Se déconnecter ?", "Tu retourneras en mode invité.", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Se déconnecter",
        style: "destructive",
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  };

  const handleSignIn = () => {
    requireAuth(() => {}, "Connecte-toi pour accéder à ton profil");
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={["#1a1a2e", "#16213e", "#0f3460"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header */}
      <View style={styles.header}>
        <View style={{ width: 40 }} />
        <Text style={styles.title}>Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Contenu */}
      {isAuthenticated ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar + name */}
          <View style={styles.profileCard}>
            <View style={styles.avatarBig}>
              <Text style={styles.avatarLetter}>
                {(user.name || "U").charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            <View style={styles.providerBadge}>
              <MaterialCommunityIcons name="google" size={12} color="#a0a0c0" />
              <Text style={styles.providerText}>Connecté avec Google</Text>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <TouchableOpacity
              style={styles.statCard}
              onPress={() => navigation.navigate("MyDesigns")}
            >
              <MaterialCommunityIcons
                name="folder-multiple"
                size={26}
                color="#e94560"
              />
              <Text style={styles.statNumber}>{stats.designs}</Text>
              <Text style={styles.statLabel}>Designs créés</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.statCard}
              onPress={() => navigation.navigate("Favorites")}
            >
              <MaterialCommunityIcons name="heart" size={26} color="#e94560" />
              <Text style={styles.statNumber}>{stats.likes}</Text>
              <Text style={styles.statLabel}>Chambres likées</Text>
            </TouchableOpacity>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => navigation.navigate("MyDesigns")}
            >
              <MaterialCommunityIcons
                name="folder-multiple-outline"
                size={22}
                color="#a0a0c0"
              />
              <Text style={styles.actionText}>Mes designs</Text>
              <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color="#a0a0c0"
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => navigation.navigate("Favorites")}
            >
              <MaterialCommunityIcons
                name="heart-outline"
                size={22}
                color="#a0a0c0"
              />
              <Text style={styles.actionText}>Mes favoris</Text>
              <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color="#a0a0c0"
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionRow}>
              <MaterialCommunityIcons
                name="cog-outline"
                size={22}
                color="#a0a0c0"
              />
              <Text style={styles.actionText}>Paramètres</Text>
              <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color="#a0a0c0"
              />
            </TouchableOpacity>
          </View>

          {/* Logout */}
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="logout" size={20} color="#ef4444" />
            <Text style={styles.logoutText}>Se déconnecter</Text>
          </TouchableOpacity>

          <View style={{ height: 100 }} />
        </ScrollView>
      ) : (
        // Mode invité
        <View style={styles.guestView}>
          <View style={styles.guestIcon}>
            <MaterialCommunityIcons
              name="account-question"
              size={64}
              color="#a0a0c0"
            />
          </View>
          <Text style={styles.guestTitle}>Pas connecté</Text>
          <Text style={styles.guestSubtitle}>
            Connecte-toi pour accéder à ton profil, sauvegarder tes designs et
            liker des chambres ❤️
          </Text>
          <TouchableOpacity
            style={styles.signInBtn}
            onPress={handleSignIn}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="login" size={20} color="#fff" />
            <Text style={styles.signInBtnText}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      )}

      <BottomNavBar active="profile" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  title: { color: "#fff", fontSize: 20, fontWeight: "700" },

  scrollContent: { paddingHorizontal: 20, paddingTop: 12 },

  // Profile card
  profileCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginBottom: 16,
  },
  avatarBig: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "rgba(233, 69, 96, 0.18)",
    borderWidth: 2,
    borderColor: "rgba(233, 69, 96, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarLetter: {
    color: "#e94560",
    fontSize: 36,
    fontWeight: "700",
  },
  userName: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 2,
  },
  userEmail: {
    color: "#a0a0c0",
    fontSize: 13,
    marginBottom: 12,
  },
  providerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  providerText: {
    color: "#a0a0c0",
    fontSize: 11,
    fontWeight: "500",
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  statNumber: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
    marginTop: 2,
  },
  statLabel: {
    color: "#a0a0c0",
    fontSize: 11,
    fontWeight: "500",
  },

  // Actions
  actions: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  actionText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },

  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.4)",
    paddingVertical: 14,
    borderRadius: 16,
  },
  logoutText: {
    color: "#ef4444",
    fontSize: 14,
    fontWeight: "700",
  },

  // Guest view
  guestView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingBottom: 80,
    gap: 8,
  },
  guestIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  guestTitle: {
    color: "#fff",
    fontSize: 19,
    fontWeight: "700",
    marginBottom: 4,
  },
  guestSubtitle: {
    color: "#a0a0c0",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 24,
  },
  signInBtn: {
    flexDirection: "row",
    backgroundColor: "#e94560",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: "center",
    gap: 8,
  },
  signInBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
