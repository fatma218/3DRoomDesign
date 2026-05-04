import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
  Modal,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { FURNITURE_CATALOG, COLOR_OPTIONS } from "../data/furniture";
import ModelPreview from "../components/ModelPreview";

export default function CatalogScreen({ navigation, route }) {
  // ── Mode AJOUT (depuis le bouton + de l'éditeur) ──
  // - mode === "add"  : ajoute des NOUVEAUX meubles à la chambre existante
  // - sinon            : nouveau design (flux normal Catalog → Editor3D)
  const isAddMode = route?.params?.mode === "add";
  const existingItems = route?.params?.existingItems || [];
  const existingItemIds = existingItems.map((i) => i.id);

  // En mode AJOUT, on commence avec une sélection VIDE
  // (l'utilisateur ne sélectionne QUE les nouveaux meubles à ajouter)
  const [selectedItems, setSelectedItems] = useState([]);
  const [previewItem, setPreviewItem] = useState(null);
  const [previewColor, setPreviewColor] = useState(null);
  const [selectedVariantId, setSelectedVariantId] = useState(null);

  const openPreview = (item) => {
    setPreviewItem(item);
    setPreviewColor(item.defaultColor);
    const firstVariant = item.models?.[0];
    setSelectedVariantId(firstVariant?.id || null);
  };

  const closePreview = () => {
    setPreviewItem(null);
    setPreviewColor(null);
    setSelectedVariantId(null);
  };

  const getCurrentModel = () => {
    if (!previewItem) return null;
    if (previewItem.models && selectedVariantId) {
      const variant = previewItem.models.find(
        (v) => v.id === selectedVariantId,
      );
      if (variant) return variant.model;
    }
    return previewItem.model;
  };

  // Est-ce que cette variante précise est déjà sélectionnée ?
  const isVariantSelected = (typeId, variantId) =>
    selectedItems.some((s) => s.type === typeId && s.variantId === variantId);

  // Combien de variantes de ce type sont sélectionnées ?
  const getTypeCount = (typeId) =>
    selectedItems.filter((s) => s.type === typeId).length;

  const handleToggleVariant = () => {
    if (!previewItem) return;

    const alreadySelected = isVariantSelected(
      previewItem.id,
      selectedVariantId,
    );

    if (alreadySelected) {
      // Retirer
      setSelectedItems((prev) =>
        prev.filter(
          (s) =>
            !(s.type === previewItem.id && s.variantId === selectedVariantId),
        ),
      );
    } else {
      // Ajouter
      const variant = previewItem.models?.find(
        (v) => v.id === selectedVariantId,
      );
      const newItem = {
        id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
        type: previewItem.id,
        name: previewItem.name,
        icon: previewItem.icon,
        color: previewColor,
        position: [0, 0],
        rotation: 0,
        width: previewItem.width,
        depth: previewItem.depth,
        variantId: selectedVariantId,
        variantModule: variant ? variant.model : previewItem.model,
      };
      setSelectedItems((prev) => [...prev, newItem]);
    }
    closePreview();
  };

  const handleContinue = () => {
    if (selectedItems.length === 0) {
      Alert.alert(
        "Aucun meuble sélectionné",
        isAddMode
          ? "Sélectionne au moins un meuble à ajouter."
          : "Sélectionne au moins un meuble avant de continuer.",
      );
      return;
    }
    if (isAddMode) {
      // Mode AJOUT : on passe la LISTE COMPLÈTE (existing + new)
      // → Editor3D recevra tout, et auto-placera les meubles déjà dans la chambre
      const existingItems = route?.params?.existingItems || [];
      const fullList = [...existingItems, ...selectedItems];
      navigation.navigate("Editor3D", {
        selectedItems: fullList,
        _refreshKey: Date.now(), // force le re-render
      });
    } else {
      navigation.navigate("Editor3D", { selectedItems });
    }
  };

  const showVariantSelector =
    previewItem?.models && previewItem.models.length > 1;
  const currentVariantChosen =
    previewItem && isVariantSelected(previewItem.id, selectedVariantId);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{isAddMode ? "Ajouter" : "Catalogue"}</Text>
        <View style={styles.counter}>
          <Text style={styles.counterText}>{selectedItems.length}</Text>
        </View>
      </View>

      {isAddMode ? (
        <View style={styles.addModeBanner}>
          <MaterialCommunityIcons
            name="plus-circle"
            size={14}
            color="#22c55e"
          />
          <Text style={styles.addModeBannerText}>
            Mode AJOUT · {existingItemIds.length} meuble
            {existingItemIds.length > 1 ? "s" : ""} déjà dans ta chambre
          </Text>
        </View>
      ) : (
        <Text style={styles.subtitle}>
          Sélectionne les meubles pour ta chambre
        </Text>
      )}

      <ScrollView style={styles.scroll} contentContainerStyle={styles.grid}>
        {FURNITURE_CATALOG.map((item) => {
          const count = getTypeCount(item.id);
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.card, count > 0 && styles.cardSelected]}
              activeOpacity={0.7}
              onPress={() => openPreview(item)}
            >
              <View
                style={[
                  styles.iconWrap,
                  { backgroundColor: item.defaultColor + "33" },
                ]}
              >
                <MaterialCommunityIcons
                  name={item.icon}
                  size={48}
                  color={item.defaultColor}
                />
                {count > 0 && (
                  <View style={styles.badgeCheck}>
                    <Text style={styles.badgeCheckText}>✓ {count}</Text>
                  </View>
                )}
                {item.models && item.models.length > 1 && (
                  <View style={styles.badgeStyles}>
                    <Text style={styles.badgeStylesText}>
                      {item.models.length} styles
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.tapHint}>Tape pour preview</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            selectedItems.length === 0 && styles.disabled,
          ]}
          onPress={handleContinue}
        >
          <MaterialCommunityIcons
            name={isAddMode ? "plus-circle" : "arrow-right"}
            size={22}
            color="#fff"
          />
          <Text style={styles.continueText}>
            {isAddMode
              ? `AJOUTER À MA CHAMBRE (${selectedItems.length})`
              : `DESIGNER MA CHAMBRE (${selectedItems.length})`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Modal preview 3D ── */}
      <Modal
        visible={!!previewItem}
        animationType="slide"
        transparent={false}
        onRequestClose={closePreview}
      >
        {previewItem && (
          <View style={styles.modalContainer}>
            <StatusBar barStyle="light-content" />

            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={closePreview} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{previewItem.name}</Text>
              <View style={{ width: 40 }} />
            </View>

            {showVariantSelector && (
              <View style={styles.variantSection}>
                <Text style={styles.sectionLabel}>Style</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.variantRow}
                >
                  {previewItem.models.map((variant) => {
                    const chosen = isVariantSelected(
                      previewItem.id,
                      variant.id,
                    );
                    return (
                      <TouchableOpacity
                        key={variant.id}
                        style={[
                          styles.variantBtn,
                          selectedVariantId === variant.id &&
                            styles.variantBtnSelected,
                          chosen && styles.variantBtnChosen,
                        ]}
                        onPress={() => setSelectedVariantId(variant.id)}
                      >
                        <Text
                          style={[
                            styles.variantBtnText,
                            (selectedVariantId === variant.id || chosen) &&
                              styles.variantBtnTextSelected,
                          ]}
                        >
                          {chosen ? "✓ " : ""}
                          {variant.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            <View style={styles.previewArea}>
              <ModelPreview
                key={selectedVariantId || "default"}
                modelModule={getCurrentModel()}
                fallbackIcon={previewItem.icon}
                backgroundColor="#252544"
              />
            </View>

            <View style={styles.colorSection}>
              <Text style={styles.sectionLabel}>Couleur</Text>
              <View style={styles.colorRow}>
                {COLOR_OPTIONS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: color },
                      previewColor === color && styles.colorSwatchSelected,
                    ]}
                    onPress={() => setPreviewColor(color)}
                  />
                ))}
              </View>
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={closePreview}>
                <Text style={styles.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.addBtn,
                  currentVariantChosen && styles.removeBtn,
                ]}
                onPress={handleToggleVariant}
              >
                <MaterialCommunityIcons
                  name={currentVariantChosen ? "minus" : "plus"}
                  size={20}
                  color="#fff"
                />
                <Text style={styles.addBtnText}>
                  {currentVariantChosen ? "Retirer" : "Sélectionner"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
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
    marginBottom: 8,
  },
  backBtn: { width: 40 },
  backArrow: { color: "#e94560", fontSize: 30, fontWeight: "bold" },
  title: { color: "#ffffff", fontSize: 24, fontWeight: "bold" },
  counter: {
    backgroundColor: "#e94560",
    minWidth: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  counterText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  subtitle: {
    color: "#a0a0c0",
    paddingHorizontal: 20,
    marginBottom: 20,
    fontSize: 14,
  },
  addModeBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginHorizontal: 20,
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "rgba(34,197,94,0.12)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.4)",
    borderRadius: 12,
  },
  addModeBannerText: {
    color: "#22c55e",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  scroll: { flex: 1 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  card: {
    width: "48%",
    backgroundColor: "#252544",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  cardSelected: {
    borderColor: "#4caf50",
    backgroundColor: "#1e3a1e",
  },
  iconWrap: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    position: "relative",
  },
  badgeCheck: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#4caf50",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeCheckText: { color: "#fff", fontSize: 10, fontWeight: "bold" },
  badgeStyles: {
    position: "absolute",
    bottom: -4,
    right: -4,
    backgroundColor: "#0f3460",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeStylesText: { color: "#fff", fontSize: 9, fontWeight: "bold" },
  itemName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  tapHint: { color: "#606080", fontSize: 11 },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#2a2a4a",
  },
  continueButton: {
    flexDirection: "row",
    backgroundColor: "#e94560",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  continueText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    letterSpacing: 1,
  },
  disabled: { opacity: 0.4 },

  // Modal
  modalContainer: { flex: 1, backgroundColor: "#1a1a2e", paddingTop: 50 },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  closeBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtnText: { color: "#fff", fontSize: 24, fontWeight: "bold" },
  modalTitle: { color: "#fff", fontSize: 22, fontWeight: "bold" },

  variantSection: { paddingHorizontal: 20, marginVertical: 12 },
  variantRow: { gap: 8, paddingRight: 20 },
  variantBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#252544",
    backgroundColor: "#252544",
    flexDirection: "row",
  },
  variantBtnSelected: {
    backgroundColor: "#e94560",
    borderColor: "#e94560",
  },
  variantBtnChosen: {
    backgroundColor: "#1e3a1e",
    borderColor: "#4caf50",
  },
  variantBtnText: { color: "#a0a0c0", fontSize: 13, fontWeight: "500" },
  variantBtnTextSelected: { color: "#fff", fontWeight: "bold" },

  previewArea: {
    flex: 1,
    margin: 16,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#252544",
  },
  colorSection: { paddingHorizontal: 20, marginBottom: 16 },
  sectionLabel: {
    color: "#a0a0c0",
    fontSize: 13,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  colorRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  colorSwatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorSwatchSelected: {
    borderColor: "#fff",
    transform: [{ scale: 1.15 }],
  },
  actionsRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 30,
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#252544",
    alignItems: "center",
  },
  cancelBtnText: { color: "#a0a0c0", fontWeight: "bold" },
  addBtn: {
    flex: 2,
    flexDirection: "row",
    backgroundColor: "#e94560",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  removeBtn: {
    backgroundColor: "#555",
  },
  addBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
