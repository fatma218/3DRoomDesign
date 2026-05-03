import React, { useRef, useState, useEffect } from "react";
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
import { INSPIRATION_ROOMS, STYLE_FILTERS } from "../data/inspirationRooms";
import { getInspirationGridHTML } from "../utils/inspirationGridHTML";

const { width } = Dimensions.get("window");
const COLS = 2;
const CELL = width / COLS;

export default function InspirationScreen({ navigation }) {
  const [filter, setFilter] = useState("all");
  const [webviewReady, setWebviewReady] = useState(false);
  const [loadedCount, setLoadedCount] = useState(0);
  const webViewRef = useRef(null);

  const filteredRooms = INSPIRATION_ROOMS.filter(
    (r) => filter === "all" || r.style === filter,
  );
  const rows = Math.max(1, Math.ceil(filteredRooms.length / COLS));
  const webViewHeight = rows * CELL;

  // Charge / recharge les modèles dans la WebView quand le filtre change
  useEffect(() => {
    if (!webviewReady) return;
    let cancelled = false;

    const loadRooms = async () => {
      if (!webViewRef.current) return;
      webViewRef.current.injectJavaScript(`window.clearAllRooms(); true;`);
      setLoadedCount(0);

      const rooms = INSPIRATION_ROOMS.filter(
        (r) => filter === "all" || r.style === filter,
      );

      for (const room of rooms) {
        if (cancelled) return;
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
            room.likes +
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
  }, [filter, webviewReady]);

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "ready") {
        setWebviewReady(true);
      } else if (data.type === "roomThumbnailReady") {
        setLoadedCount((c) => c + 1);
      } else if (data.type === "roomTapped") {
        const room = INSPIRATION_ROOMS.find((r) => r.id === data.id);
        if (room) navigation.navigate("Room3DViewer", { room });
      } else if (data.type === "error") {
        console.error("WebView 3D error:", data.message);
      }
    } catch (e) {}
  };

  const isLoading = loadedCount < filteredRooms.length;

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
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ alignItems: "center" }}>
          <Text style={styles.title}>Inspiration</Text>
          <Text style={styles.subtitle}>
            {filteredRooms.length} chambre{filteredRooms.length > 1 ? "s" : ""}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Loading badge */}
      {isLoading && webviewReady && (
        <View style={styles.loadingBadge}>
          <ActivityIndicator size="small" color="#fff" />
          <Text style={styles.loadingText}>
            Chargement {loadedCount}/{filteredRooms.length}…
          </Text>
        </View>
      )}

      {/* Grid 3D — WebView dans ScrollView pour scroll vertical */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 30 }}
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

        {/* Hint en bas */}
        <View style={styles.hint}>
          <MaterialCommunityIcons
            name="hand-pointing-up"
            size={14}
            color="#606080"
          />
          <Text style={styles.hintText}>
            Tape une chambre pour la voir en grand
          </Text>
        </View>
      </ScrollView>
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
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  title: { color: "#fff", fontSize: 20, fontWeight: "700" },
  subtitle: { color: "#a0a0c0", fontSize: 11, marginTop: 2 },

  filtersRow: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  filterChipActive: { backgroundColor: "#e94560", borderColor: "#e94560" },
  filterText: { color: "#a0a0c0", fontSize: 12, fontWeight: "500" },
  filterTextActive: { color: "#fff", fontWeight: "700" },

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
  loadingText: { color: "#fff", fontSize: 12 },

  hint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 16,
  },
  hintText: { color: "#606080", fontSize: 11, letterSpacing: 0.5 },
});
