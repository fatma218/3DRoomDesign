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
  TextInput,
} from "react-native";
import { WebView } from "react-native-webview";
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
import * as Clipboard from "expo-clipboard";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRoom } from "../context/RoomContext";
import { saveToCloud } from "../utils/cloudSync";
import { getEditorHTML } from "../utils/editorHTML";
import { saveDesign, updateDesign } from "../utils/savedDesigns";
import { useAuth } from "../context/AuthContext";

const ROOM_W = 5;
const ROOM_H = 5;

const STYLE_OPTIONS = [
  { id: "gamer", label: "Gamer", icon: "gamepad-variant", color: "#e94560" },
  { id: "classic", label: "Classique", icon: "sofa", color: "#c8a97e" },
  { id: "modern", label: "Moderne", icon: "cube-outline", color: "#4a90e2" },
];

export default function RoomEditor3DScreen({ navigation, route }) {
  const { items, addItemDirect, removeItem, updateItem, clearRoom } = useRoom();
  const { requireAuth } = useAuth();
  // console.log(
  //   "🟢 [Editor3D] MOUNT — params:",
  //   JSON.stringify({
  //     hasSelectedItems: (route.params?.selectedItems ?? []).length,
  //     hasAddedItems: (route.params?.addedItems ?? []).length,
  //     hasPresetItems: (route.params?.presetItems ?? []).length,
  //   }),
  // );
  // ── Items à charger : soit du catalogue (selectedItems), soit d'un design sauvé (presetItems) ──
  const selectedItems = route.params?.selectedItems ?? [];
  const presetItems = route.params?.presetItems ?? null;
  const presetRoomMeta = route.params?.presetRoomMeta ?? null; // { name, style, id } pour le titre

  // On utilise presetItems si fourni, sinon selectedItems
  const itemsToLoad =
    presetItems && presetItems.length > 0 ? presetItems : selectedItems;
  const isEditingSavedDesign = !!presetItems;

  const webViewRef = useRef(null);
  const itemsRef = useRef(items);
  const itemsToLoadRef = useRef(itemsToLoad);
  // Track item IDs already injected into WebView inventory (évite les doublons)
  const loadedItemIdsRef = useRef(new Set());
  // ── Surfaces (murs + sol) — état trackée pour le SAVE ──
  const surfacesRef = useRef({
    walls: { back: "#ece0ce", left: "#ece0ce", right: "#ece0ce" },
    floor: "#f2e4c8",
  });
  // ── État "design modifié depuis le dernier SAVE" ──
  const [hasChanges, setHasChanges] = useState(false);
  // Pour ignorer les events lors du chargement initial
  const initialLoadDoneRef = useRef(false);
  // Saved id (si on édite un design existant)
  const editingDesignIdRef = useRef(presetRoomMeta?.id || null);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const [webviewReady, setWebviewReady] = useState(false);
  const [loadedCount, setLoadedCount] = useState(0);

  // ── Modal finalisation cloud ──
  const [showModal, setShowModal] = useState(false);
  const [cloudCode, setCloudCode] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [showJson, setShowJson] = useState(false);

  // ── Modal ENREGISTRER (sauvegarde locale comme inspiration) ──
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saveStyle, setSaveStyle] = useState("gamer");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveSuccessId, setSaveSuccessId] = useState(null); // id du design fraichement sauvé

  // ── Modal QUIT confirm (avant de retourner home) ──
  const [showQuitModal, setShowQuitModal] = useState(false);

  const editorHTML = useMemo(() => getEditorHTML(ROOM_W, ROOM_H), []);

  // ── Charge les items dans l'inventaire WebView (avec preset position si saved design) ─────────
  const loadInventoryItems = useCallback(async () => {
    if (!webViewRef.current) return;

    setLoadedCount(0);
    loadedItemIdsRef.current.clear();

    if (itemsToLoad.length === 0) {
      webViewRef.current.injectJavaScript(`window.setExpectedCount(0); true;`);
      return;
    }

    webViewRef.current.injectJavaScript(
      `window.setExpectedCount(${itemsToLoad.length}); true;`,
    );

    // ⭐ Récupère les meubles DÉJÀ placés (préservés dans RoomContext)
    const placedItems = itemsRef.current; // les meubles avec leur position dans la chambre

    for (const item of itemsToLoad) {
      try {
        const asset = Asset.fromModule(item.variantModule);
        await asset.downloadAsync();
        const base64 = await FileSystem.readAsStringAsync(asset.localUri, {
          encoding: "base64",
        });

        // ⭐ Si on édite un saved design OU si l'item était déjà placé → auto-place
        const placed = placedItems.find((p) => p.id === item.id);
        const presetSavedDesign =
          isEditingSavedDesign && item.position && Array.isArray(item.position);

        const hasPos = placed || presetSavedDesign;
        const posX = placed
          ? placed.position[0]
          : presetSavedDesign
            ? item.position[0]
            : null;
        const posZ = placed
          ? placed.position[1]
          : presetSavedDesign
            ? item.position[1]
            : null;
        const posRot = placed
          ? ((placed.rotation || 0) * Math.PI) / 180
          : presetSavedDesign
            ? ((item.rotation || 0) * Math.PI) / 180
            : null;

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
          hasPos ? `,${posX},${posZ},${posRot}` : "",
          `); true;`,
        ].join("");
        webViewRef.current.injectJavaScript(code);
        loadedItemIdsRef.current.add(item.id);
      } catch (err) {
        console.error("loadInventoryItem error:", err);
      }
    }
  }, [itemsToLoad, isEditingSavedDesign]);

  // ── Ajoute des NOUVEAUX items à l'inventaire (préserve la chambre + items existants) ─────────
  const injectAdditionalItems = useCallback(async (newItems) => {
    if (!webViewRef.current || !newItems || newItems.length === 0) return;

    // Met à jour itemsToLoadRef pour que le handler "modelAdded" trouve les nouveaux items
    itemsToLoadRef.current = [...itemsToLoadRef.current, ...newItems];

    for (const item of newItems) {
      try {
        // Skip si déjà chargé (sécurité anti-doublon)
        if (loadedItemIdsRef.current.has(item.id)) continue;

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
        loadedItemIdsRef.current.add(item.id);
      } catch (err) {
        console.error("injectAdditionalItems error:", err);
      }
    }
  }, []);

  // ── Messages depuis le WebView ───────────────────────────────────────────
  const handleWebViewMessage = useCallback(
    (event) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        switch (data.type) {
          case "ready":
            setWebviewReady(true);
            loadInventoryItems();
            // ⭐ Restaurer les surfaces si on édite un saved design
            if (presetRoomMeta?.surfaces && webViewRef.current) {
              const surfStr = JSON.stringify(presetRoomMeta.surfaces);
              webViewRef.current.injectJavaScript(
                `window.setSurfacesState(${JSON.stringify(surfStr)}); true;`,
              );
              surfacesRef.current = presetRoomMeta.surfaces;
            }
            break;

          case "itemReady":
            setLoadedCount((c) => c + 1);
            break;

          case "allItemsReady":
            // Le chargement initial est terminé → on peut tracker les modifs
            initialLoadDoneRef.current = true;
            setHasChanges(false);
            break;

          case "modelAdded": {
            const sel = itemsToLoadRef.current.find((s) => s.id === data.id);
            if (sel && !itemsRef.current.find((i) => i.id === data.id)) {
              addItemDirect({
                ...sel,
                position: [ROOM_W / 2, ROOM_H / 2],
                rotation: 0,
              });
              // Marquer dirty seulement après load initial
              if (initialLoadDoneRef.current) setHasChanges(true);
            }
            break;
          }

          case "positionUpdate":
            updateItem(data.id, {
              position: [data.x, data.z],
              rotation: ((data.rotation * 180) / Math.PI + 360) % 360,
            });
            if (initialLoadDoneRef.current) setHasChanges(true);
            break;

          case "deleteItem":
            removeItem(data.id);
            if (initialLoadDoneRef.current) setHasChanges(true);
            break;

          case "wallColorChanged": {
            // Mettre à jour le ref local
            if (data.wallId) {
              surfacesRef.current = {
                ...surfacesRef.current,
                walls: {
                  ...surfacesRef.current.walls,
                  [data.wallId]: data.color,
                },
              };
            }
            if (initialLoadDoneRef.current) setHasChanges(true);
            break;
          }

          case "floorColorChanged":
            surfacesRef.current = {
              ...surfacesRef.current,
              floor: data.color,
            };
            if (initialLoadDoneRef.current) setHasChanges(true);
            break;

          case "openCatalogue":
            navigation.push("Catalog", {
              mode: "add",
              existingItems: itemsToLoadRef.current, // liste COMPLÈTE des items actuels
            });
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
    [loadInventoryItems, addItemDirect, updateItem, removeItem, navigation],
  );

  // ── Détecte les nouveaux items ajoutés depuis le Catalogue (bouton +) ─────────
  // Quand l'user revient du Catalogue avec route.params.addedItems, on les injecte
  // dans l'inventaire SANS toucher à la chambre ni aux items existants
  useFocusEffect(
    useCallback(() => {
      const addedItems = route.params?.addedItems;
      // console.log(
      //   "🟡 [Editor3D] FOCUS — addedItems:",
      //   addedItems?.length || 0,
      //   "webviewReady:",
      //   webviewReady,
      //   "loadedIds size:",
      //   loadedItemIdsRef.current.size,
      // );
      if (!addedItems || addedItems.length === 0) return;
      if (!webviewReady) return;

      // Filtre les items déjà présents
      const newItems = addedItems.filter(
        (item) => !loadedItemIdsRef.current.has(item.id),
      );

      if (newItems.length > 0) {
        injectAdditionalItems(newItems);
      }

      // Vide le param pour éviter ré-injection au prochain focus
      navigation.setParams({ addedItems: undefined });
    }, [
      route.params?.addedItems,
      webviewReady,
      injectAdditionalItems,
      navigation,
    ]),
  );

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

  // ── Génère le JSON pour le cloud ──
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

  // ── ENREGISTRER : sauvegarde locale dans AsyncStorage ─────────────────
  const handleOpenSaveModal = () => {
    if (itemsRef.current.length === 0) {
      Alert.alert(
        "Chambre vide !",
        "Ajoute au moins un meuble avant d'enregistrer.",
      );
      return;
    }
    setSaveName(presetRoomMeta?.name || "");
    setSaveStyle(presetRoomMeta?.style || "gamer");
    setSaveSuccess(false);
    setSaveSuccessId(null);
    setShowSaveModal(true);
  };

  // saveMode peut être "update" (écrase l'existant) ou "new" (nouvelle copie)
  const handleSaveDesign = async (saveMode = "new") => {
    if (!saveName.trim()) {
      Alert.alert("Nom manquant", "Donne un nom à ton design.");
      return;
    }
    setIsSaving(true);
    try {
      const designData = {
        name: saveName.trim(),
        style: saveStyle,
        items: itemsRef.current,
        roomSize: { width: ROOM_W, depth: ROOM_H },
        surfaces: surfacesRef.current, // ⭐ inclut murs + sol
      };

      let savedId;
      if (saveMode === "update" && editingDesignIdRef.current) {
        // Update : écrase le design existant
        const updated = await updateDesign(
          editingDesignIdRef.current,
          designData,
        );
        savedId = updated.id;
      } else {
        // New : nouvelle copie
        const newDesign = await saveDesign(designData);
        savedId = newDesign.id;
        // L'editor pointe maintenant sur ce nouveau design
        editingDesignIdRef.current = savedId;
      }

      setHasChanges(false); // reset dirty state
      setSaveSuccess(true);
      setSaveSuccessId(savedId);
    } catch (e) {
      Alert.alert("Erreur", "Impossible d'enregistrer : " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  // ── QUIT : retour Home avec confirm si modifs non sauvées ──
  const handleHomePress = () => {
    if (!hasChanges) {
      navigation.navigate("Home");
      return;
    }
    setShowQuitModal(true);
  };

  const handleQuitWithoutSave = () => {
    setShowQuitModal(false);
    navigation.navigate("Home");
  };

  const handleSaveThenQuit = () => {
    setShowQuitModal(false);
    handleOpenSaveModal();
  };

  // ── FINALIZE (cloud sync) ─────────────────────────────────────
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

  const isLoading = webviewReady && loadedCount < itemsToLoad.length;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleHomePress} style={styles.iconBtn}>
          <MaterialCommunityIcons
            name="home-outline"
            size={22}
            color="#e94560"
          />
        </TouchableOpacity>
        <View style={styles.titleWrap}>
          <Text style={styles.title} numberOfLines={1}>
            {presetRoomMeta?.name || "Ma Chambre 3D"}
          </Text>
          {hasChanges && <View style={styles.dirtyDot} />}
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={handleReset} style={styles.iconBtn}>
            <MaterialCommunityIcons name="refresh" size={20} color="#606080" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() =>
              requireAuth(
                handleOpenSaveModal,
                "Connecte-toi pour sauvegarder ton design",
              )
            }
            style={[styles.saveBtn, items.length === 0 && styles.disabled]}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons
              name="content-save-outline"
              size={14}
              color="#fff"
            />
            <Text style={styles.saveBtnText}>SAVE</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleFinalize}
            style={[styles.finalizeBtn, items.length === 0 && styles.disabled]}
          >
            <MaterialCommunityIcons
              name="check-circle-outline"
              size={14}
              color="#fff"
            />
            <Text style={styles.finalizeText}>FIN ({items.length})</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* WebView 3D */}
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
              Chargement {loadedCount}/{itemsToLoad.length}…
            </Text>
          </View>
        )}

        {isEditingSavedDesign && (
          <View style={styles.editBadge}>
            <MaterialCommunityIcons name="pencil" size={11} color="#fff" />
            <Text style={styles.editBadgeText}>MODE ÉDITION</Text>
          </View>
        )}
      </View>

      {/* ───── Modal ENREGISTRER (popup) ───── */}
      <Modal
        visible={showSaveModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowSaveModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.saveModalCard}>
            {saveSuccess ? (
              <View style={styles.successView}>
                <View style={styles.successIcon}>
                  <MaterialCommunityIcons
                    name="check-bold"
                    size={36}
                    color="#fff"
                  />
                </View>
                <Text style={styles.successTitle}>Design enregistré !</Text>
                <Text style={styles.successSubtitle}>
                  Retrouve-le dans Mes Designs
                </Text>
                <View style={styles.successActions}>
                  <TouchableOpacity
                    style={styles.successBtnSecondary}
                    onPress={() => {
                      setShowSaveModal(false);
                      setSaveSuccess(false);
                    }}
                  >
                    <Text style={styles.successBtnSecondaryText}>
                      Continuer
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.successBtnPrimary}
                    onPress={() => {
                      setShowSaveModal(false);
                      setSaveSuccess(false);
                      navigation.navigate("MyDesigns");
                    }}
                  >
                    <MaterialCommunityIcons
                      name="folder-multiple"
                      size={16}
                      color="#fff"
                    />
                    <Text style={styles.successBtnPrimaryText}>
                      Voir mes designs
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
                <View style={styles.saveModalHeader}>
                  <View>
                    <Text style={styles.saveModalTitle}>
                      💾 Enregistrer ce design
                    </Text>
                    <Text style={styles.saveModalSubtitle}>
                      {items.length} meuble{items.length > 1 ? "s" : ""} placé
                      {items.length > 1 ? "s" : ""}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setShowSaveModal(false)}
                    style={styles.closeBtnSmall}
                  >
                    <Text style={styles.closeBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.fieldLabel}>Nom du design</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Ma chambre gaming RGB"
                  placeholderTextColor="#606080"
                  value={saveName}
                  onChangeText={setSaveName}
                  maxLength={30}
                  autoFocus
                />

                <Text style={[styles.fieldLabel, { marginTop: 16 }]}>
                  Style
                </Text>
                <View style={styles.styleRow}>
                  {STYLE_OPTIONS.map((opt) => (
                    <TouchableOpacity
                      key={opt.id}
                      style={[
                        styles.styleChip,
                        saveStyle === opt.id && {
                          borderColor: opt.color,
                          backgroundColor: `${opt.color}22`,
                        },
                      ]}
                      onPress={() => setSaveStyle(opt.id)}
                    >
                      <MaterialCommunityIcons
                        name={opt.icon}
                        size={20}
                        color={saveStyle === opt.id ? opt.color : "#a0a0c0"}
                      />
                      <Text
                        style={[
                          styles.styleChipText,
                          saveStyle === opt.id && {
                            color: opt.color,
                            fontWeight: "700",
                          },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {editingDesignIdRef.current ? (
                  // ── Édition d'un design existant : 2 options ──
                  <View style={styles.saveActionsCol}>
                    <TouchableOpacity
                      style={styles.confirmBtn}
                      onPress={() => handleSaveDesign("update")}
                      disabled={isSaving}
                      activeOpacity={0.85}
                    >
                      {isSaving ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <>
                          <MaterialCommunityIcons
                            name="content-save"
                            size={18}
                            color="#fff"
                          />
                          <Text style={styles.confirmBtnText}>
                            Mettre à jour
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.confirmBtnSecondary}
                      onPress={() => handleSaveDesign("new")}
                      disabled={isSaving}
                      activeOpacity={0.85}
                    >
                      <MaterialCommunityIcons
                        name="content-duplicate"
                        size={18}
                        color="#e94560"
                      />
                      <Text style={styles.confirmBtnSecondaryText}>
                        Sauver comme nouveau
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.cancelBtnFull}
                      onPress={() => setShowSaveModal(false)}
                      disabled={isSaving}
                    >
                      <Text style={styles.cancelBtnText}>Annuler</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  // ── Nouveau design : juste "Enregistrer" ──
                  <View style={styles.saveActions}>
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => setShowSaveModal(false)}
                      disabled={isSaving}
                    >
                      <Text style={styles.cancelBtnText}>Annuler</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.confirmBtn}
                      onPress={() => handleSaveDesign("new")}
                      disabled={isSaving}
                      activeOpacity={0.85}
                    >
                      {isSaving ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <>
                          <MaterialCommunityIcons
                            name="check"
                            size={18}
                            color="#fff"
                          />
                          <Text style={styles.confirmBtnText}>Enregistrer</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ───── Modal QUIT confirm (avant retour Home) ───── */}
      <Modal
        visible={showQuitModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowQuitModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.quitModalCard}>
            <View style={styles.quitIcon}>
              <MaterialCommunityIcons
                name="alert-circle-outline"
                size={36}
                color="#f59e0b"
              />
            </View>
            <Text style={styles.quitTitle}>Quitter sans enregistrer ?</Text>
            <Text style={styles.quitSubtitle}>
              Tes modifications ne seront pas sauvées.
            </Text>

            <View style={styles.quitActions}>
              <TouchableOpacity
                style={styles.quitBtnSave}
                onPress={() =>
                  requireAuth(
                    handleSaveThenQuit,
                    "Connecte-toi pour sauvegarder avant de quitter",
                  )
                }
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons
                  name="content-save-outline"
                  size={18}
                  color="#fff"
                />
                <Text style={styles.quitBtnSaveText}>
                  Enregistrer puis quitter
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quitBtnDiscard}
                onPress={handleQuitWithoutSave}
                activeOpacity={0.85}
              >
                <Text style={styles.quitBtnDiscardText}>
                  Quitter sans sauver
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quitBtnCancel}
                onPress={() => setShowQuitModal(false)}
              >
                <Text style={styles.quitBtnCancelText}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ───── Modal Finalisation (cloud sync existant) ───── */}
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  iconBtn: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  backArrow: { color: "#e94560", fontSize: 26, fontWeight: "bold" },
  titleWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  title: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold",
    textAlign: "center",
    maxWidth: "85%",
  },
  dirtyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#f59e0b",
  },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 5 },

  saveBtn: {
    flexDirection: "row",
    backgroundColor: "#22c55e",
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 16,
    alignItems: "center",
    gap: 3,
  },
  saveBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 11,
    letterSpacing: 0.4,
  },

  finalizeBtn: {
    flexDirection: "row",
    backgroundColor: "#e94560",
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 16,
    alignItems: "center",
    gap: 3,
  },
  finalizeText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 11,
    letterSpacing: 0.4,
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

  editBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(34,197,94,0.92)",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
  },
  editBadgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.8,
  },

  // ── Modal ENREGISTRER ──
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  saveModalCard: {
    backgroundColor: "#252544",
    borderRadius: 22,
    padding: 22,
    width: "100%",
    maxWidth: 420,
    borderWidth: 1,
    borderColor: "#3d3d6e",
  },
  saveModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  saveModalTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  saveModalSubtitle: { color: "#a0a0c0", fontSize: 12, marginTop: 2 },
  closeBtnSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  fieldLabel: {
    color: "#a0a0c0",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: "#1a1a2e",
    borderWidth: 1.5,
    borderColor: "#3d3d6e",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: "#fff",
  },
  styleRow: { flexDirection: "row", gap: 8 },
  styleChip: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#1a1a2e",
    borderWidth: 1.5,
    borderColor: "#3d3d6e",
  },
  styleChipText: { fontSize: 11, fontWeight: "600", color: "#a0a0c0" },
  saveActions: { flexDirection: "row", gap: 10, marginTop: 22 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#1a1a2e",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#3d3d6e",
  },
  cancelBtnText: { color: "#a0a0c0", fontWeight: "bold", fontSize: 14 },
  confirmBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#e94560",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  confirmBtnText: { color: "#fff", fontWeight: "bold", fontSize: 14 },

  // Save actions colonne (mode édition existant)
  saveActionsCol: {
    flexDirection: "column",
    gap: 8,
    marginTop: 22,
  },
  confirmBtnSecondary: {
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#1a1a2e",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
    borderWidth: 1.5,
    borderColor: "#e94560",
  },
  confirmBtnSecondaryText: {
    color: "#e94560",
    fontWeight: "bold",
    fontSize: 14,
  },
  cancelBtnFull: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  // Success state
  successView: { alignItems: "center", paddingVertical: 14 },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#22c55e",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  successTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  successSubtitle: { color: "#a0a0c0", fontSize: 13, marginTop: 4 },
  successActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 22,
    width: "100%",
  },
  successBtnSecondary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#1a1a2e",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#3d3d6e",
  },
  successBtnSecondaryText: {
    color: "#a0a0c0",
    fontWeight: "bold",
    fontSize: 13,
  },
  successBtnPrimary: {
    flex: 1.4,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#e94560",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  successBtnPrimaryText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 13,
  },

  // ── Modal QUIT confirm ──
  quitModalCard: {
    backgroundColor: "#252544",
    borderRadius: 22,
    padding: 24,
    width: "100%",
    maxWidth: 380,
    borderWidth: 1,
    borderColor: "#3d3d6e",
    alignItems: "center",
  },
  quitIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    borderWidth: 1.5,
    borderColor: "rgba(245, 158, 11, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  quitTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "bold",
    textAlign: "center",
  },
  quitSubtitle: {
    color: "#a0a0c0",
    fontSize: 13,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 18,
  },
  quitActions: {
    flexDirection: "column",
    gap: 8,
    width: "100%",
  },
  quitBtnSave: {
    backgroundColor: "#22c55e",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  quitBtnSaveText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  quitBtnDiscard: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.4)",
  },
  quitBtnDiscardText: {
    color: "#ef4444",
    fontWeight: "bold",
    fontSize: 14,
  },
  quitBtnCancel: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  quitBtnCancelText: {
    color: "#a0a0c0",
    fontWeight: "600",
    fontSize: 13,
  },

  // ── Modal Finalisation (cloud) ──
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  closeBtnText: { color: "#fff", fontSize: 22, fontWeight: "bold" },
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
