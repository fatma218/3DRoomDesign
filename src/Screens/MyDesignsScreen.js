import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Dimensions,
  Alert,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import {
  listSavedDesigns,
  deleteDesign,
} from "../utils/savedDesigns";

const { width } = Dimensions.get("window");
const COLS = 2;
const CARD_W = (width - 36 - 10) / 2; // padding 18 × 2 + gap 10

// ── Couleurs pastel par style — plus douces, plus cute ──
const STYLE_META = {
  gamer: {
    icon: "gamepad-variant",
    label: "Gamer",
    gradient: ["#fce4ec", "#f8bbd0"],   // rose poudré pastel
    iconColor: "#c2185b",
    badgeBg: "#ec407a",
  },
  classic: {
    icon: "sofa",
    label: "Classique",
    gradient: ["#fff3e0", "#ffe0b2"],   // pêche / crème pastel
    iconColor: "#e65100",
    badgeBg: "#ff9800",
  },
  modern: {
    icon: "cube-outline",
    label: "Moderne",
    gradient: ["#e3f2fd", "#bbdefb"],   // bleu ciel pastel
    iconColor: "#1565c0",
    badgeBg: "#42a5f5",
  },
};

function formatDate(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    return `${day}/${month}`;
  } catch (_) {
    return "";
  }
}

export default function MyDesignsScreen({ navigation }) {
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      (async () => {
        setLoading(true);
        const list = await listSavedDesigns();
        if (mounted) {
          setDesigns(list);
          setLoading(false);
        }
      })();
      return () => {
        mounted = false;
      };
    }, []),
  );

  const handleOpenDesign = (design) => {
    navigation.navigate("Editor3D", {
      presetItems: design.items || [],
      presetRoomMeta: {
        name: design.name,
        style: design.style,
        id: design.id,
        surfaces: design.surfaces || null,
      },
    });
  };

  const handleDelete = (design) => {
    Alert.alert(
      "Supprimer ce design ?",
      `"${design.name}" sera définitivement supprimé.`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            await deleteDesign(design.id);
            setDesigns((prev) => prev.filter((d) => d.id !== design.id));
          },
        },
      ],
    );
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
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ alignItems: "center" }}>
          <Text style={styles.title}>Mes Designs</Text>
          <Text style={styles.subtitle}>
            {designs.length} design{designs.length > 1 ? "s" : ""} sauvegardé
            {designs.length > 1 ? "s" : ""}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => navigation.navigate("Home")}
        >
          <MaterialCommunityIcons
            name="home-outline"
            size={22}
            color="#e94560"
          />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#e94560" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      ) : designs.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <MaterialCommunityIcons
              name="folder-outline"
              size={56}
              color="#404060"
            />
          </View>
          <Text style={styles.emptyTitle}>Aucun design sauvegardé</Text>
          <Text style={styles.emptySubtitle}>
            Crée ta première chambre depuis l'accueil et sauvegarde-la pour la
            retrouver ici.
          </Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            onPress={() => navigation.navigate("StyleSelection")}
          >
            <MaterialCommunityIcons name="plus" size={18} color="#fff" />
            <Text style={styles.emptyBtnText}>Créer un design</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.grid}>
            {designs.map((d) => {
              const meta = STYLE_META[d.style] || STYLE_META.modern;
              return (
                <TouchableOpacity
                  key={d.id}
                  style={styles.card}
                  onPress={() => handleOpenDesign(d)}
                  activeOpacity={0.85}
                >
                  {/* ── Image area : pastel + icon ── */}
                  <LinearGradient
                    colors={meta.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.cardImage}
                  >
                    {/* Style badge (top-left) */}
                    <View
                      style={[
                        styles.styleBadge,
                        { backgroundColor: meta.badgeBg },
                      ]}
                    >
                      <Text style={styles.styleBadgeText}>
                        {meta.label.toUpperCase()}
                      </Text>
                    </View>

                    {/* Trash button (top-right) */}
                    <TouchableOpacity
                      style={styles.trashBtn}
                      onPress={() => handleDelete(d)}
                      hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                    >
                      <MaterialCommunityIcons
                        name="trash-can-outline"
                        size={14}
                        color="#fff"
                      />
                    </TouchableOpacity>

                    {/* Big icon centered */}
                    <MaterialCommunityIcons
                      name={meta.icon}
                      size={42}
                      color={meta.iconColor}
                      style={{ opacity: 0.9 }}
                    />

                    {/* Item count pill (bottom) */}
                    <View style={styles.itemCountWrap}>
                      <Text style={styles.itemCountText}>
                        {d.items?.length || 0} meuble
                        {(d.items?.length || 0) > 1 ? "s" : ""}
                      </Text>
                    </View>
                  </LinearGradient>

                  {/* ── Info area (compact) ── */}
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardName} numberOfLines={1}>
                      {d.name}
                    </Text>
                    <View style={styles.metaRow}>
                      <MaterialCommunityIcons
                        name="clock-outline"
                        size={10}
                        color="#8090a8"
                      />
                      <Text style={styles.cardDate}>
                        {d.updatedAt
                          ? "Modifié " + formatDate(d.updatedAt)
                          : "Créé " + formatDate(d.createdAt)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={{ height: 30 }} />
        </ScrollView>
      )}
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
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  title: { color: "#fff", fontSize: 20, fontWeight: "700" },
  subtitle: { color: "#a0a0c0", fontSize: 11, marginTop: 2 },

  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: { color: "#a0a0c0", fontSize: 13 },

  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    gap: 8,
  },
  emptyIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
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
    gap: 6,
  },
  emptyBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  // ───── GRILLE ─────
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 14,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },

  // ───── CARD CUTE ─────
  card: {
    width: CARD_W,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  // Image area : pastel gradient
  cardImage: {
    width: "100%",
    aspectRatio: 1.4, // ⭐ moins haute (était 1, square)
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    paddingTop: 12,
    paddingBottom: 30,
  },

  // Badge style (top-left, plus petit)
  styleBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  styleBadgeText: {
    color: "#fff",
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 0.6,
  },

  // Trash button (top-right, discret)
  trashBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Item count (bottom du gradient)
  itemCountWrap: {
    position: "absolute",
    bottom: 8,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 8,
  },
  itemCountText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },

  // Info area
  cardInfo: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  cardName: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 3,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  cardDate: {
    color: "#8090a8",
    fontSize: 9,
    fontWeight: "500",
  },
});
