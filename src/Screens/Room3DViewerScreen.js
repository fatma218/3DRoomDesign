import React, { useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Alert,
} from "react-native";
import { WebView } from "react-native-webview";
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getRoomViewerHTML } from "../utils/roomViewerHTML";

export default function Room3DViewerScreen({ navigation, route }) {
  const room = route.params?.room;
  const webViewRef = useRef(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [liked, setLiked] = useState(false);

  const loadModel = useCallback(async () => {
    if (!webViewRef.current || !room) return;
    try {
      const asset = Asset.fromModule(room.modelModule);
      await asset.downloadAsync();
      const base64 = await FileSystem.readAsStringAsync(asset.localUri, {
        encoding: "base64",
      });
      const code = `window.loadRoom(${JSON.stringify(base64)}); true;`;
      webViewRef.current.injectJavaScript(code);
    } catch (err) {
      console.error("loadModel error:", err);
      Alert.alert("Erreur", "Impossible de charger le modèle 3D");
    }
  }, [room]);

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "ready") {
        loadModel();
      } else if (data.type === "roomLoaded") {
        setModelLoaded(true);
      } else if (data.type === "error") {
        Alert.alert("Erreur 3D", data.message);
      }
    } catch (e) {}
  };

  if (!room) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={{ color: "#fff" }}>Aucune chambre sélectionnée</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <WebView
        ref={webViewRef}
        source={{ html: getRoomViewerHTML() }}
        style={styles.webview}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        allowFileAccess
        originWhitelist={["*"]}
        mixedContentMode="always"
        scrollEnabled={false}
      />

      {/* Header floating avec gradient */}
      <LinearGradient
        colors={["rgba(26,26,46,0.95)", "rgba(26,26,46,0)"]}
        style={styles.headerGradient}
        pointerEvents="box-none"
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={styles.title} numberOfLines={1}>
              {room.name}
            </Text>
            <Text style={styles.subtitle}>{room.style.toUpperCase()}</Text>
          </View>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setLiked(!liked)}
          >
            <MaterialCommunityIcons
              name={liked ? "heart" : "heart-outline"}
              size={20}
              color={liked ? "#e94560" : "#fff"}
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Loading overlay */}
      {!modelLoaded && (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#e94560" />
          <Text style={styles.loadingText}>Chargement du modèle...</Text>
          <Text style={styles.loadingHint}>
            Ça peut prendre quelques secondes selon la taille
          </Text>
        </View>
      )}

      {/* Bottom action — TÉLÉCHARGER (à protéger par login plus tard) */}
      <LinearGradient
        colors={["rgba(26,26,46,0)", "rgba(26,26,46,0.95)"]}
        style={styles.bottomGradient}
        pointerEvents="box-none"
      >
        <TouchableOpacity
          style={styles.downloadBtn}
          onPress={() =>
            Alert.alert(
              "📥 Télécharger",
              "Le téléchargement nécessitera une connexion (à venir).",
            )
          }
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="download" size={20} color="#fff" />
          <Text style={styles.downloadText}>TÉLÉCHARGER</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a2e" },
  center: { justifyContent: "center", alignItems: "center" },
  webview: { flex: 1 },

  headerGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 40,
    paddingBottom: 30,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 10,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  title: { color: "#fff", fontSize: 16, fontWeight: "700" },
  subtitle: {
    color: "#a0a0c0",
    fontSize: 10,
    letterSpacing: 1.5,
    marginTop: 2,
  },

  loading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#1a1a2e",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  loadingText: { color: "#a0a0c0", fontSize: 14, marginTop: 4 },
  loadingHint: { color: "#606080", fontSize: 11, marginTop: 4 },

  bottomGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 30,
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  downloadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e94560",
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    shadowColor: "#e94560",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  downloadText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
});
