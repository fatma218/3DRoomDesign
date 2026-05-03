import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  Modal,
  ScrollView,
  Share,
  ActivityIndicator,
  Animated,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useRoom } from "../context/RoomContext";
import { COLOR_OPTIONS } from "../data/furniture";
import { saveToCloud } from "../utils/cloudSync";
import DraggableFurniture from "../components/DraggableFurniture";

const ROOM_SIZE_METERS = 5;
const ROOM_SIZE_PX = 320;
const SCALE = ROOM_SIZE_PX / ROOM_SIZE_METERS;
const ROTATION_STEP = 45;

export default function RoomEditorScreen({ navigation }) {
  const { items, updateItem, removeItem, duplicateItem, clearRoom } = useRoom();
  const [selectedId, setSelectedId] = useState(null);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [showJsonRaw, setShowJsonRaw] = useState(false);

  const [cloudCode, setCloudCode] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  // Animation pour le floating action menu
  const actionMenuAnim = useRef(new Animated.Value(0)).current;

  const selectedItem = items.find((item) => item.id === selectedId);

  useEffect(() => {
    Animated.spring(actionMenuAnim, {
      toValue: selectedItem ? 1 : 0,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();
  }, [!!selectedItem]);

  const handleMove = (itemId, newPosition) => {
    updateItem(itemId, { position: newPosition });
  };

  const rotateItem = (delta) => {
    if (!selectedItem) return;
    const newRotation = (selectedItem.rotation + delta + 360) % 360;
    updateItem(selectedItem.id, { rotation: newRotation });
  };

  const changeColor = (color) => {
    if (!selectedItem) return;
    updateItem(selectedItem.id, { color });
  };

  const handleDelete = () => {
    if (!selectedItem) return;
    Alert.alert("Supprimer ce meuble?", `Retirer ${selectedItem.name}?`, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: () => {
          removeItem(selectedItem.id);
          setSelectedId(null);
        },
      },
    ]);
  };

  const handleDuplicate = () => {
    if (!selectedItem) return;
    duplicateItem(selectedItem.id);
  };

  const handleReset = () => {
    if (items.length === 0) return;
    Alert.alert("Vider la chambre?", "Tous les meubles seront supprimés.", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Vider",
        style: "destructive",
        onPress: () => {
          clearRoom();
          setSelectedId(null);
        },
      },
    ]);
  };

  const generateRoomJson = () => ({
    room: "bedroom",
    roomSize: {
      width: ROOM_SIZE_METERS,
      depth: ROOM_SIZE_METERS,
      unit: "meters",
    },
    items: items.map((item) => ({
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

  const roomJson = generateRoomJson();
  const jsonString = JSON.stringify(roomJson, null, 2);

  const handleFinalize = () => {
    if (items.length === 0) {
      Alert.alert("Vide!", "Ajoute au moins un meuble avant de finaliser.");
      return;
    }
    setCloudCode(null);
    setUploadError(null);
    setShowJsonRaw(false);
    setShowFinalizeModal(true);
  };

  const handleCloudSave = async () => {
    setIsUploading(true);
    setUploadError(null);
    try {
      const id = await saveToCloud(roomJson);
      setCloudCode(id);
    } catch (err) {
      setUploadError(err.message || "Erreur inconnue");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCopyCode = async () => {
    if (!cloudCode) return;
    await Clipboard.setStringAsync(cloudCode);
    Alert.alert("✅ Copié!", "Colle le code dans la page web.");
  };

  const handleCopyJson = async () => {
    await Clipboard.setStringAsync(jsonString);
    Alert.alert("✅ Copié!", "JSON copié.");
  };

  const handleShareJson = async () => {
    try {
      await Share.share({ message: jsonString, title: "Mon design" });
    } catch (err) {}
  };

  const closeModal = () => {
    setShowFinalizeModal(false);
    setCloudCode(null);
    setUploadError(null);
  };

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
        <Text style={styles.title}>Ma chambre</Text>
        <TouchableOpacity onPress={handleReset} style={styles.iconBtn}>
          <MaterialCommunityIcons name="refresh" size={24} color="#e94560" />
        </TouchableOpacity>
      </View>

      <Text style={styles.hint}>
        {selectedItem
          ? `${selectedItem.name} sélectionné · glisse pour déplacer`
          : "Tape un meuble · glisse-le pour le déplacer"}
      </Text>

      {/* Room view avec items DRAGGABLE */}
      <View style={styles.roomWrap}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setSelectedId(null)}
          style={styles.room}
        >
          {/* Grille */}
          {[...Array(ROOM_SIZE_METERS + 1)].map((_, i) => (
            <React.Fragment key={i}>
              <View
                style={[styles.gridLine, styles.gridLineH, { top: i * SCALE }]}
              />
              <View
                style={[styles.gridLine, styles.gridLineV, { left: i * SCALE }]}
              />
            </React.Fragment>
          ))}

          {/* Items DRAGGABLE */}
          {items.map((item) => (
            <DraggableFurniture
              key={item.id}
              item={item}
              scale={SCALE}
              roomSizeMeters={ROOM_SIZE_METERS}
              isSelected={item.id === selectedId}
              onSelect={setSelectedId}
              onMove={handleMove}
            />
          ))}
        </TouchableOpacity>
      </View>

      {/* Floating action menu (animé) */}
      <Animated.View
        style={[
          styles.actionMenu,
          {
            opacity: actionMenuAnim,
            transform: [
              {
                translateY: actionMenuAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [40, 0],
                }),
              },
              {
                scale: actionMenuAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                }),
              },
            ],
          },
        ]}
        pointerEvents={selectedItem ? "auto" : "none"}
      >
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => rotateItem(-ROTATION_STEP)}
        >
          <MaterialCommunityIcons name="rotate-left" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.actionDivider} />
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => rotateItem(ROTATION_STEP)}
        >
          <MaterialCommunityIcons name="rotate-right" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.actionDivider} />
        <TouchableOpacity style={styles.actionBtn} onPress={handleDuplicate}>
          <MaterialCommunityIcons name="content-copy" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.actionDivider} />
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnDanger]}
          onPress={handleDelete}
        >
          <MaterialCommunityIcons name="trash-can" size={20} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      {/* Color picker (toujours visible mais désactivé si rien sélectionné) */}
      <ScrollView
        style={styles.controlsScroll}
        contentContainerStyle={styles.controls}
      >
        {selectedItem ? (
          <>
            <Text style={styles.sectionLabel}>
              Couleur · rotation: {selectedItem.rotation}°
            </Text>
            <View style={styles.colorRow}>
              {COLOR_OPTIONS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: color },
                    selectedItem.color === color && styles.colorSelected,
                  ]}
                  onPress={() => changeColor(color)}
                />
              ))}
            </View>
          </>
        ) : (
          <View style={styles.emptyHint}>
            <MaterialCommunityIcons
              name="gesture-tap"
              size={28}
              color="#606080"
            />
            <Text style={styles.emptyHintText}>
              Glisse un meuble pour le déplacer
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Footer FINALIZE */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.finalizeBtn, items.length === 0 && styles.disabled]}
          onPress={handleFinalize}
        >
          <MaterialCommunityIcons name="check-circle" size={22} color="#fff" />
          <Text style={styles.finalizeText}>FINALISER ({items.length})</Text>
        </TouchableOpacity>
      </View>

      {/* Modal de finalisation (inchangé) */}
      <Modal
        visible={showFinalizeModal}
        animationType="slide"
        transparent={false}
        onRequestClose={closeModal}
      >
        <ScrollView style={styles.modalContainer}>
          <StatusBar barStyle="light-content" />

          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeModal} style={styles.iconBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Design finalisé</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <MaterialCommunityIcons name="sofa" size={20} color="#e94560" />
              <Text style={styles.summaryText}>{items.length} meuble(s)</Text>
            </View>
            <View style={styles.summaryRow}>
              <MaterialCommunityIcons
                name="floor-plan"
                size={20}
                color="#e94560"
              />
              <Text style={styles.summaryText}>
                Bedroom · {ROOM_SIZE_METERS}×{ROOM_SIZE_METERS} m
              </Text>
            </View>
          </View>

          <View style={styles.cloudSection}>
            <Text style={styles.sectionLabelBig}>
              ☁️ Sync Cloud (recommandé)
            </Text>
            <Text style={styles.sectionDesc}>
              Sauve ton design en ligne et reçois un code à coller dans la page
              web.
            </Text>

            {!cloudCode && !isUploading && (
              <TouchableOpacity
                style={styles.cloudUploadBtn}
                onPress={handleCloudSave}
              >
                <MaterialCommunityIcons
                  name="cloud-upload"
                  size={22}
                  color="#fff"
                />
                <Text style={styles.cloudUploadText}>Sauver dans le cloud</Text>
              </TouchableOpacity>
            )}

            {isUploading && (
              <View style={styles.cloudLoading}>
                <ActivityIndicator color="#e94560" size="small" />
                <Text style={styles.cloudLoadingText}>
                  Envoi vers le cloud...
                </Text>
              </View>
            )}

            {cloudCode && (
              <View style={styles.codeCard}>
                <Text style={styles.codeLabel}>✅ Code de ton design:</Text>
                <Text style={styles.codeValue} selectable>
                  {cloudCode}
                </Text>
                <TouchableOpacity
                  style={styles.copyCodeBtn}
                  onPress={handleCopyCode}
                >
                  <MaterialCommunityIcons
                    name="content-copy"
                    size={16}
                    color="#fff"
                  />
                  <Text style={styles.copyCodeBtnText}>Copier le code</Text>
                </TouchableOpacity>
              </View>
            )}

            {uploadError && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>❌ {uploadError}</Text>
                <TouchableOpacity
                  style={styles.retryBtn}
                  onPress={handleCloudSave}
                >
                  <Text style={styles.retryBtnText}>Réessayer</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.expandToggle}
            onPress={() => setShowJsonRaw(!showJsonRaw)}
          >
            <Text style={styles.expandLabel}>
              {showJsonRaw ? "▼" : "▶"} JSON brut (avancé)
            </Text>
          </TouchableOpacity>

          {showJsonRaw && (
            <>
              <View style={styles.jsonBox}>
                <Text style={styles.jsonText} selectable>
                  {jsonString}
                </Text>
              </View>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.copyBtn}
                  onPress={handleCopyJson}
                >
                  <MaterialCommunityIcons
                    name="content-copy"
                    size={18}
                    color="#fff"
                  />
                  <Text style={styles.copyBtnText}>Copier</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.shareBtn}
                  onPress={handleShareJson}
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
          <View style={{ height: 40 }} />
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a2e", paddingTop: 60 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  iconBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  backArrow: { color: "#e94560", fontSize: 30, fontWeight: "bold" },
  title: { color: "#ffffff", fontSize: 22, fontWeight: "bold" },
  hint: {
    color: "#a0a0c0",
    textAlign: "center",
    fontSize: 13,
    marginTop: 4,
    marginBottom: 12,
  },
  roomWrap: { alignItems: "center", marginBottom: 16 },
  room: {
    width: ROOM_SIZE_PX,
    height: ROOM_SIZE_PX,
    backgroundColor: "#f5e8d0",
    borderWidth: 4,
    borderColor: "#3d2818",
    borderRadius: 4,
    position: "relative",
  },
  gridLine: { position: "absolute", backgroundColor: "#d4c5a0" },
  gridLineH: { left: 0, right: 0, height: 1 },
  gridLineV: { top: 0, bottom: 0, width: 1 },

  // Floating action menu
  actionMenu: {
    flexDirection: "row",
    alignSelf: "center",
    backgroundColor: "#252544",
    borderRadius: 30,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#3d3d6e",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0f3460",
    margin: 3,
  },
  actionBtnDanger: {
    backgroundColor: "#e94560",
  },
  actionDivider: {
    width: 1,
    backgroundColor: "#3d3d6e",
    marginVertical: 8,
  },

  controlsScroll: { flex: 1 },
  controls: { paddingHorizontal: 20, alignItems: "center", paddingBottom: 12 },
  sectionLabel: {
    color: "#a0a0c0",
    fontSize: 12,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  colorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  colorSwatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorSelected: { borderColor: "#fff", transform: [{ scale: 1.15 }] },
  emptyHint: { alignItems: "center", marginTop: 20 },
  emptyHintText: { color: "#606080", fontSize: 13, marginTop: 8 },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: "#2a2a4a" },
  finalizeBtn: {
    flexDirection: "row",
    backgroundColor: "#e94560",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  finalizeText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    letterSpacing: 1,
  },
  disabled: { opacity: 0.4 },

  // Modal (inchangé)
  modalContainer: { flex: 1, backgroundColor: "#1a1a2e", paddingTop: 50 },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 12,
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
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 4,
  },
  summaryText: { color: "#fff", fontSize: 14 },
  cloudSection: {
    marginHorizontal: 20,
    backgroundColor: "#252544",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#3d3d6e",
  },
  sectionLabelBig: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  sectionDesc: {
    color: "#a0a0c0",
    fontSize: 12,
    marginBottom: 14,
    lineHeight: 17,
  },
  cloudUploadBtn: {
    flexDirection: "row",
    backgroundColor: "#e94560",
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  cloudUploadText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  cloudLoading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
  },
  cloudLoadingText: { color: "#a0a0c0", fontSize: 13 },
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
  errorBox: { padding: 12, alignItems: "center" },
  errorText: { color: "#e94560", fontSize: 13, marginBottom: 8 },
  retryBtn: {
    backgroundColor: "#0f3460",
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
  },
  retryBtnText: { color: "#fff", fontSize: 13, fontWeight: "bold" },
  expandToggle: { paddingHorizontal: 20, paddingVertical: 12 },
  expandLabel: { color: "#a0a0c0", fontSize: 13, fontWeight: "600" },
  jsonBox: {
    backgroundColor: "#0d0d1a",
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    maxHeight: 300,
  },
  jsonText: {
    color: "#a0e0a0",
    fontSize: 11,
    fontFamily: "monospace",
    lineHeight: 16,
  },
  modalActions: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
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
