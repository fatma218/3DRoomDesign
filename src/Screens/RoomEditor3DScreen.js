import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  StatusBar,
  Share,
} from "react-native";
import { WebView } from "react-native-webview";
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
import * as Clipboard from "expo-clipboard";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRoom } from "../context/RoomContext";
import { saveToCloud } from "../utils/cloudSync";
import { getEditorHTML } from "../utils/editorHTML";

const ROOM_W = 5;
const ROOM_H = 5;

export default function RoomEditor3DScreen({ navigation, route }) {
  const { items, addItemDirect, removeItem, updateItem, clearRoom } = useRoom();
  const selectedItems = route.params?.selectedItems ?? [];

  const webViewRef = useRef(null);
  const itemsRef = useRef(items);
  const selectedItemsRef = useRef(selectedItems);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const [webviewReady, setWebviewReady] = useState(false);
  const [loadedCount, setLoadedCount] = useState(0);

  // Modal finalisation
  const [showModal, setShowModal] = useState(false);
  const [cloudCode, setCloudCode] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [showJson, setShowJson] = useState(false);

  const editorHTML = useMemo(() => getEditorHTML(ROOM_W, ROOM_H), []);

  // ── Charge tous les items sélectionnés dans l'inventaire WebView ─────────
  const loadInventoryItems = useCallback(async () => {
    if (!webViewRef.current) return;

    clearRoom();
    setLoadedCount(0);

    if (selectedItems.length === 0) {
      webViewRef.current.injectJavaScript(`window.setExpectedCount(0); true;`);
      return;
    }

    webViewRef.current.injectJavaScript(
      `window.setExpectedCount(${selectedItems.length}); true;`,
    );

    for (const item of selectedItems) {
      try {
        const asset = Asset.fromModule(item.variantModule);
        await asset.downloadAsync();
        const base64 = await FileSystem.readAsStringAsync(asset.localUri, {
          encoding: "base64",
        });
        const code = [
          `window.addInventoryItem(`,
          JSON.stringify(item.id),
          ",",
          JSON.stringify(item.name),
          ",",
          JSON.stringify(base64),
          ",",
          item.width || 1,
          ",",
          item.depth || 1,
          `); true;`,
        ].join("");
        webViewRef.current.injectJavaScript(code);
      } catch (err) {
        console.error("loadInventoryItem error:", err);
      }
    }
  }, [selectedItems, clearRoom]);

  // ── Messages depuis le WebView ───────────────────────────────────────────
  const handleWebViewMessage = useCallback(
    (event) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        switch (data.type) {
          case "ready":
            setWebviewReady(true);
            loadInventoryItems();
            break;

          case "itemReady":
            setLoadedCount((c) => c + 1);
            break;

          case "allItemsReady":
            break;

          case "modelAdded": {
            const sel = selectedItemsRef.current.find((s) => s.id === data.id);
            if (sel && !itemsRef.current.find((i) => i.id === data.id)) {
              addItemDirect({
                ...sel,
                position: [ROOM_W / 2, ROOM_H / 2],
                rotation: 0,
              });
            }
            break;
          }

          case "positionUpdate":
            updateItem(data.id, {
              position: [data.x, data.z],
              rotation: ((data.rotation * 180) / Math.PI + 360) % 360,
            });
            break;

          case "deleteItem":
            removeItem(data.id);
            break;

          case "error":
            console.error("WebView 3D error:", data.message);
            break;

          default:
            break;
        }
      } catch (e) {
        console.error("handleWebViewMessage:", e);
      }
    },
    [loadInventoryItems, addItemDirect, updateItem, removeItem],
  );

  // ── Reset chambre ────────────────────────────────────────────────────────
  const handleReset = () => {
    if (itemsRef.current.length === 0) return;
    Alert.alert(
      "Vider la chambre ?",
      "Tous les meubles placés seront supprimés.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Vider",
          style: "destructive",
          onPress: () => {
            clearRoom();
            webViewRef.current?.injectJavaScript("window.clearAll(); true;");
          },
        },
      ],
    );
  };

  // ── Finalisation ─────────────────────────────────────────────────────────
  const generateRoomJson = () => ({
    room: "bedroom",
    roomSize: { width: ROOM_W, depth: ROOM_H, unit: "meters" },
    items: itemsRef.current.map((item) => ({
      type: item.type,
      variantId: item.variantId,
      position: item.position,
      rotation: item.rotation,
      color: item.color,
      width: item.width,
      depth: item.depth,
    })),
    exportedAt: new Date().toISOString(),
  });

  const handleFinalize = () => {
    if (itemsRef.current.length === 0) {
      Alert.alert(
        "Chambre vide !",
        "Place au moins un meuble avant de finaliser.",
      );
      return;
    }
    setCloudCode(null);
    setUploadError(null);
    setShowJson(false);
    setShowModal(true);
  };

  const handleCloudSave = async () => {
    setIsUploading(true);
    setUploadError(null);
    try {
      const id = await saveToCloud(generateRoomJson());
      setCloudCode(id);
    } catch (err) {
      setUploadError(err.message || "Erreur inconnue");
    } finally {
      setIsUploading(false);
    }
  };

  const isLoading = webviewReady && loadedCount < selectedItems.length;

  // ── Rendu ─────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.iconBtn}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Ma Chambre 3D</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={handleReset} style={styles.iconBtn}>
            <MaterialCommunityIcons name="refresh" size={22} color="#606080" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleFinalize}
            style={[styles.finalizeBtn, items.length === 0 && styles.disabled]}
          >
            <MaterialCommunityIcons
              name="check-circle-outline"
              size={16}
              color="#fff"
            />
            <Text style={styles.finalizeText}>FINALISER ({items.length})</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* WebView plein écran — inventaire 3D intégré en bas */}
      <View style={styles.webviewWrap}>
        <WebView
          ref={webViewRef}
          source={{ html: editorHTML }}
          style={styles.webview}
          onMessage={handleWebViewMessage}
          javaScriptEnabled
          domStorageEnabled
          allowFileAccess
          originWhitelist={["*"]}
          mixedContentMode="always"
          scrollEnabled={false}
        />

        {!webviewReady && (
          <View style={styles.sceneOverlay}>
            <ActivityIndicator size="large" color="#e94560" />
            <Text style={styles.sceneOverlayText}>
              Chargement de la scène 3D…
            </Text>
          </View>
        )}

        {isLoading && (
          <View style={styles.loadingBadge}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.loadingBadgeText}>
              Chargement {loadedCount}/{selectedItems.length}…
            </Text>
          </View>
        )}
      </View>

      {/* Modal Finalisation */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: "#1a1a2e", paddingTop: 50 }}>
          <StatusBar barStyle="light-content" />
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowModal(false)}
              style={styles.iconBtn}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Design finalisé</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.sumRow}>
              <MaterialCommunityIcons name="sofa" size={20} color="#e94560" />
              <Text style={styles.sumText}>
                {items.length} meuble(s) placé(s)
              </Text>
            </View>
            <View style={styles.sumRow}>
              <MaterialCommunityIcons
                name="floor-plan"
                size={20}
                color="#e94560"
              />
              <Text style={styles.sumText}>
                Bedroom · {ROOM_W} × {ROOM_H} m
              </Text>
            </View>
          </View>

          <View style={styles.cloudSection}>
            <Text style={styles.cloudTitle}>☁️ Sync Cloud</Text>
            <Text style={styles.cloudDesc}>
              Sauve en ligne et utilise le code dans la page web 3D.
            </Text>
            {!cloudCode && !isUploading && (
              <TouchableOpacity
                style={styles.cloudBtn}
                onPress={handleCloudSave}
              >
                <MaterialCommunityIcons
                  name="cloud-upload"
                  size={20}
                  color="#fff"
                />
                <Text style={styles.cloudBtnText}>Sauver dans le cloud</Text>
              </TouchableOpacity>
            )}
            {isUploading && (
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "center",
                  padding: 14,
                  gap: 10,
                }}
              >
                <ActivityIndicator color="#e94560" />
                <Text style={{ color: "#a0a0c0", fontSize: 13 }}>Envoi…</Text>
              </View>
            )}
            {cloudCode && (
              <View style={styles.codeCard}>
                <Text style={styles.codeLabel}>✅ Code :</Text>
                <Text style={styles.codeValue} selectable>
                  {cloudCode}
                </Text>
                <TouchableOpacity
                  style={styles.copyCodeBtn}
                  onPress={async () => {
                    await Clipboard.setStringAsync(cloudCode);
                    Alert.alert(
                      "✅ Copié !",
                      "Colle ce code dans la page web.",
                    );
                  }}
                >
                  <MaterialCommunityIcons
                    name="content-copy"
                    size={16}
                    color="#fff"
                  />
                  <Text style={styles.copyCodeBtnText}>Copier</Text>
                </TouchableOpacity>
              </View>
            )}
            {uploadError && (
              <View style={{ padding: 12, alignItems: "center" }}>
                <Text style={{ color: "#e94560", fontSize: 13 }}>
                  ❌ {uploadError}
                </Text>
                <TouchableOpacity
                  style={styles.retryBtn}
                  onPress={handleCloudSave}
                >
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>
                    Réessayer
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={{ paddingHorizontal: 20, paddingVertical: 12 }}
            onPress={() => setShowJson(!showJson)}
          >
            <Text style={{ color: "#a0a0c0", fontSize: 13 }}>
              {showJson ? "▼" : "▶"} JSON brut (avancé)
            </Text>
          </TouchableOpacity>
          {showJson && (
            <>
              <View style={styles.jsonBox}>
                <Text style={styles.jsonText} selectable>
                  {JSON.stringify(generateRoomJson(), null, 2)}
                </Text>
              </View>
              <View style={styles.jsonActions}>
                <TouchableOpacity
                  style={styles.copyBtn}
                  onPress={async () => {
                    await Clipboard.setStringAsync(
                      JSON.stringify(generateRoomJson(), null, 2),
                    );
                    Alert.alert("✅ Copié !");
                  }}
                >
                  <MaterialCommunityIcons
                    name="content-copy"
                    size={18}
                    color="#fff"
                  />
                  <Text style={styles.copyBtnText}>Copier JSON</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.shareBtn}
                  onPress={async () => {
                    try {
                      await Share.share({
                        message: JSON.stringify(generateRoomJson(), null, 2),
                      });
                    } catch (_) {}
                  }}
                >
                  <MaterialCommunityIcons
                    name="share-variant"
                    size={18}
                    color="#fff"
                  />
                  <Text style={styles.shareBtnText}>Partager</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
          <View style={{ height: 50 }} />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a2e", paddingTop: 50 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  iconBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  backArrow: { color: "#e94560", fontSize: 28, fontWeight: "bold" },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 4 },
  finalizeBtn: {
    flexDirection: "row",
    backgroundColor: "#e94560",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 18,
    alignItems: "center",
    gap: 5,
  },
  finalizeText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
    letterSpacing: 0.5,
  },
  disabled: { opacity: 0.35 },

  webviewWrap: { flex: 1, position: "relative" },
  webview: { flex: 1 },
  sceneOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#1a1a2e",
    justifyContent: "center",
    alignItems: "center",
    gap: 14,
  },
  sceneOverlayText: { color: "#a0a0c0", fontSize: 14 },
  loadingBadge: {
    position: "absolute",
    top: 12,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(0,0,0,0.75)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  loadingBadgeText: { color: "#fff", fontSize: 12 },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  closeBtnText: { color: "#fff", fontSize: 24, fontWeight: "bold" },
  modalTitle: { color: "#fff", fontSize: 22, fontWeight: "bold" },
  summaryCard: {
    backgroundColor: "#252544",
    marginHorizontal: 20,
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  sumRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 4,
  },
  sumText: { color: "#fff", fontSize: 14 },
  cloudSection: {
    marginHorizontal: 20,
    backgroundColor: "#252544",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#3d3d6e",
  },
  cloudTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  cloudDesc: {
    color: "#a0a0c0",
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 14,
  },
  cloudBtn: {
    flexDirection: "row",
    backgroundColor: "#e94560",
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  cloudBtnText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  codeCard: {
    backgroundColor: "#0d0d1a",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
  },
  codeLabel: { color: "#a0e0a0", fontSize: 12, marginBottom: 6 },
  codeValue: {
    color: "#fff",
    fontFamily: "monospace",
    fontSize: 13,
    backgroundColor: "#1a1a2e",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    width: "100%",
    textAlign: "center",
  },
  copyCodeBtn: {
    flexDirection: "row",
    backgroundColor: "#0f3460",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: "center",
    gap: 6,
  },
  copyCodeBtnText: { color: "#fff", fontWeight: "bold", fontSize: 13 },
  retryBtn: {
    backgroundColor: "#0f3460",
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    marginTop: 8,
  },
  jsonBox: {
    backgroundColor: "#0d0d1a",
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 12,
    maxHeight: 280,
  },
  jsonText: {
    color: "#a0e0a0",
    fontSize: 11,
    fontFamily: "monospace",
    lineHeight: 16,
  },
  jsonActions: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 10,
    gap: 12,
    marginTop: 10,
  },
  copyBtn: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#0f3460",
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  copyBtnText: { color: "#fff", fontWeight: "bold" },
  shareBtn: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#e94560",
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  shareBtnText: { color: "#fff", fontWeight: "bold" },
});
