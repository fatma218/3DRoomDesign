// ────────────────────────────────────────────────────────────────────────────
// FavoritesScreen — Liste des chambres likées avec rendu 3D RÉEL
// Réutilise la WebView grid d'Inspiration filtrée sur les rooms likées
// ────────────────────────────────────────────────────────────────────────────

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { WebView } from "react-native-webview";
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { listLikedRoomIds } from "../utils/likedRooms";
import { INSPIRATION_ROOMS } from "../data/inspirationRooms";
import { getInspirationGridHTML } from "../utils/inspirationGridHTML";
import BottomNavBar from "../components/BottomNavBar";

const { width } = Dimensions.get("window");
const COLS = 2;
const CELL = width / COLS;

export default function FavoritesScreen({ navigation }) {
  const [likedRooms, setLikedRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [webviewReady, setWebviewReady] = useState(false);
  const [loadedCount, setLoadedCount] = useState(0);
  const webViewRef = useRef(null);

  // Recharge les likes à chaque entrée dans l'écran
  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      (async () => {
        setLoading(true);
        const ids = await listLikedRoomIds();
        const rooms = INSPIRATION_ROOMS.filter((r) => ids.includes(r.id));
        if (mounted) {
          setLikedRooms(rooms);
          setLoading(false);
        }
      })();
      return () => {
        mounted = false;
      };
    }, []),
  );

  // ── Charge les modèles 3D dans la WebView ──
  useEffect(() => {
    if (!webviewReady || likedRooms.length === 0) return;
    let cancelled = false;

    const loadRooms = async () => {
      if (!webViewRef.current) return;
      webViewRef.current.injectJavaScript(`window.clearAllRooms(); true;`);
      setLoadedCount(0);

      for (const room of likedRooms) {
        if (cancelled) return;
        if (!room.modelModule) continue;
        try {
          const asset = Asset.fromModule(room.modelModule);
          await asset.downloadAsync();
          const base64 = await FileSystem.readAsStringAsync(asset.localUri, {
            encoding: "base64",
          });
          const code =
            `window.addRoomThumbnail(` +
            JSON.stringify(room.id) +
            "," +
            JSON.stringify(base64) +
            "," +
            JSON.stringify(room.name) +
            "," +
            (room.likes || 0) +
            "," +
            JSON.stringify(room.style) +
            `); true;`;
          webViewRef.current?.injectJavaScript(code);
        } catch (err) {
          console.error("loadRoom error:", err);
        }
      }
    };

    loadRooms();
    return () => {
      cancelled = true;
    };
  }, [webviewReady, likedRooms]);

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "ready") {
        setWebviewReady(true);
      } else if (data.type === "roomThumbnailReady") {
        setLoadedCount((c) => c + 1);
      } else if (data.type === "roomTapped") {
        const room = likedRooms.find((r) => r.id === data.id);
        if (room) navigation.navigate("Room3DViewer", { room });
      }
    } catch (e) {}
  };

  const rows = Math.max(1, Math.ceil(likedRooms.length / COLS));
  const webViewHeight = rows * CELL;
  const isLoading3D =
    likedRooms.length > 0 && loadedCount < likedRooms.length;

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
        <View style={{ alignItems: "center" }}>
          <Text style={styles.title}>Favorites</Text>
          <Text style={styles.subtitle}>
            {likedRooms.length} chambre{likedRooms.length > 1 ? "s" : ""} likée
            {likedRooms.length > 1 ? "s" : ""}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Loading badge */}
      {isLoading3D && webviewReady && (
        <View style={styles.loadingBadge}>
          <ActivityIndicator size="small" color="#fff" />
          <Text style={styles.loadingBadgeText}>
            Chargement {loadedCount}/{likedRooms.length}…
          </Text>
        </View>
      )}

      {/* Contenu */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#e94560" size="large" />
        </View>
      ) : likedRooms.length === 0 ? (
        // ── État vide ──
        <View style={styles.center}>
          <View style={styles.emptyIcon}>
            <MaterialCommunityIcons
              name="heart-outline"
              size={64}
              color="#404060"
            />
          </View>
          <Text style={styles.emptyTitle}>Aucune chambre likée</Text>
          <Text style={styles.emptySubtitle}>
            Like des chambres dans Inspiration pour les retrouver ici ❤️
          </Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            onPress={() => navigation.navigate("Inspiration")}
          >
            <MaterialCommunityIcons
              name="lightbulb-on-outline"
              size={18}
              color="#fff"
            />
            <Text style={styles.emptyBtnText}>Découvrir des chambres</Text>
          </TouchableOpacity>
        </View>
      ) : (
        // ── Grille 3D ──
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          <WebView
            ref={webViewRef}
            source={{ html: getInspirationGridHTML(COLS) }}
            style={{ width, height: webViewHeight }}
            onMessage={handleMessage}
            javaScriptEnabled
            domStorageEnabled
            allowFileAccess
            originWhitelist={["*"]}
            mixedContentMode="always"
            scrollEnabled={false}
          />

          {/* Hint */}
          <View style={styles.hint}>
            <MaterialCommunityIcons
              name="hand-pointing-up"
              size={14}
              color="#606080"
            />
            <Text style={styles.hintText}>
              Tape une chambre pour l'ouvrir
            </Text>
          </View>
        </ScrollView>
      )}

      <BottomNavBar active="favorites" />
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
  subtitle: { color: "#a0a0c0", fontSize: 11, marginTop: 2 },

  loadingBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 8,
    backgroundColor: "rgba(0,0,0,0.45)",
    marginHorizontal: 50,
    borderRadius: 14,
    marginBottom: 6,
  },
  loadingBadgeText: { color: "#fff", fontSize: 12 },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingBottom: 80,
    gap: 8,
  },
  emptyIcon: {
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
  emptyTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 4,
  },
  emptySubtitle: {
    color: "#a0a0c0",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 24,
  },
  emptyBtn: {
    flexDirection: "row",
    backgroundColor: "#e94560",
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: "center",
    gap: 8,
  },
  emptyBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  hint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 16,
  },
  hintText: { color: "#606080", fontSize: 11, letterSpacing: 0.5 },
});
