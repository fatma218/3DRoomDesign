import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  StatusBar,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import BottomNavBar from "../components/BottomNavBar";
import MenuDrawer from "../components/MenuDrawer";

const APP_NAME = "DECORA";

export default function HomeScreen({ navigation }) {
  const { requireAuth, user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  // ── Refs d'animation ────────────────────────────────────────────────────
  const sparkleScale = useRef(new Animated.Value(0)).current;
  const sparkleRotate = useRef(new Animated.Value(0)).current;
  const sparkleOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineTranslate = useRef(new Animated.Value(15)).current;
  const buttonsOpacity = useRef(new Animated.Value(0)).current;
  const buttonsTranslate = useRef(new Animated.Value(30)).current;

  // Une animation par lettre (DECORA = 6 lettres)
  const letterAnims = useRef(
    APP_NAME.split("").map(() => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(15),
    })),
  ).current;

  useEffect(() => {
    // 1. Étincelle apparaît (fade + scale spring)
    Animated.parallel([
      Animated.timing(sparkleOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(sparkleScale, {
        toValue: 1,
        friction: 4,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // 2. Lettres se révèlent une par une (stagger 80ms)
      const letterAnimations = letterAnims.map((a, i) =>
        Animated.parallel([
          Animated.timing(a.opacity, {
            toValue: 1,
            duration: 300,
            delay: i * 80,
            useNativeDriver: true,
          }),
          Animated.timing(a.translateY, {
            toValue: 0,
            duration: 300,
            delay: i * 80,
            useNativeDriver: true,
          }),
        ]),
      );
      Animated.parallel(letterAnimations).start(() => {
        // 3. Tagline apparaît
        Animated.parallel([
          Animated.timing(taglineOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(taglineTranslate, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // 4. Boutons remontent
          Animated.parallel([
            Animated.timing(buttonsOpacity, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(buttonsTranslate, {
              toValue: 0,
              duration: 600,
              useNativeDriver: true,
            }),
          ]).start();
        });
      });
    });

    // 5. Rotation lente continue de l'étincelle (boucle infinie)
    Animated.loop(
      Animated.timing(sparkleRotate, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, []);

  const handleInspiration = () => {
    navigation.navigate("Inspiration");
  };

  const handleDesign = () => {
    navigation.navigate("StyleSelection");
  };

  const handleMyDesigns = () => {
    requireAuth(
      () => navigation.navigate("MyDesigns"),
      "Connecte-toi pour voir tes designs sauvegardés",
    );
  };
  const rotation = sparkleRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Fond gradient Tech Dark */}
      <LinearGradient
        colors={["#1a1a2e", "#16213e", "#0f3460"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Halo décoratif en haut (subtil) */}
      <View style={styles.haloTop} />
      <View style={styles.haloBottom} />

      {/* ───── Top Header (Menu ☰) ───── */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => setMenuOpen(true)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="menu" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerLabel}>Menu</Text>
      </View>

      {/* ───── Logo + Titre + Tagline ───── */}
      <View style={styles.logoSection}>
        <Animated.View
          style={[
            styles.sparkleWrap,
            {
              opacity: sparkleOpacity,
              transform: [{ scale: sparkleScale }, { rotate: rotation }],
            },
          ]}
        >
          <Text style={styles.sparkle}>✨</Text>
        </Animated.View>

        <View style={styles.lettersRow}>
          {APP_NAME.split("").map((letter, i) => (
            <Animated.Text
              key={i}
              style={[
                styles.letter,
                {
                  opacity: letterAnims[i].opacity,
                  transform: [{ translateY: letterAnims[i].translateY }],
                },
              ]}
            >
              {letter}
            </Animated.Text>
          ))}
        </View>

        <Animated.Text
          style={[
            styles.tagline,
            {
              opacity: taglineOpacity,
              transform: [{ translateY: taglineTranslate }],
            },
          ]}
        >
          Design in 3D · Live in style
        </Animated.Text>
      </View>

      {/* ───── Boutons ───── */}
      <Animated.View
        style={[
          styles.buttonsSection,
          {
            opacity: buttonsOpacity,
            transform: [{ translateY: buttonsTranslate }],
          },
        ]}
      >
        {/* Bouton 1 — Inspiration (outline) */}
        <TouchableOpacity
          style={styles.btnSecondary}
          onPress={handleInspiration}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="lightbulb-on-outline"
            size={22}
            color="#f57f93"
          />
          <Text style={styles.btnSecondaryText}>INSPIRATION</Text>
          <MaterialCommunityIcons
            name="arrow-right"
            size={20}
            color="#c37380"
          />
        </TouchableOpacity>

        {/* Bouton 2 — Design My Room (primary, gradient) */}
        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={handleDesign}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={["#ef899a", "#df7a92"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.btnPrimaryGradient}
          >
            <MaterialCommunityIcons name="floor-plan" size={22} color="#fff" />
            <Text style={styles.btnPrimaryText}>DESIGN MY ROOM</Text>
            <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Bouton 3 — Mes Designs (outline tertiary) */}
        <TouchableOpacity
          style={styles.btnTertiary}
          onPress={handleMyDesigns}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="folder-multiple-outline"
            size={20}
            color="#a0a0c0"
          />
          <Text style={styles.btnTertiaryText}>MES DESIGNS</Text>
          <MaterialCommunityIcons
            name="arrow-right"
            size={18}
            color="#a0a0c0"
          />
        </TouchableOpacity>
      </Animated.View>

      {/* ───── BottomNavBar (3 tabs : Home / Favorites / Profile) ───── */}
      <BottomNavBar active="home" />

      {/* ───── Drawer latéral (Settings / About / Help / Logout) ───── */}
      <MenuDrawer visible={menuOpen} onClose={() => setMenuOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 110,
    paddingBottom: 100, // ⭐ espace pour la BottomNavBar
    paddingHorizontal: 24,
  },

  // Halos décoratifs
  haloTop: {
    position: "absolute",
    top: -150,
    left: -100,
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: "rgba(233, 69, 96, 0.12)",
    opacity: 0.6,
  },
  haloBottom: {
    position: "absolute",
    bottom: -200,
    right: -100,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: "rgba(15, 52, 96, 0.5)",
  },

  // Logo
  logoSection: {
    alignItems: "center",
    marginTop: 40,
  },
  sparkleWrap: {
    marginBottom: 28,
    width: 90,
    height: 90,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 22,
    backgroundColor: "rgba(233, 69, 96, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(233, 69, 96, 0.35)",
    shadowColor: "#e94560",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 6,
  },
  sparkle: { fontSize: 44 },

  lettersRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  letter: {
    fontSize: 46,
    fontWeight: "200",
    color: "#fff",
    letterSpacing: 6,
  },
  tagline: {
    color: "#a0a0c0",
    fontSize: 13,
    letterSpacing: 1.5,
    fontWeight: "300",
  },

  // Boutons
  buttonsSection: {
    width: "100%",
    gap: 14,
    marginBottom: 30,
  },
  btnSecondary: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 22,
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(233, 69, 96, 0.45)",
    backgroundColor: "rgba(233, 69, 96, 0.07)",
  },
  btnSecondaryText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 2,
    flex: 1,
    marginLeft: 14,
  },
  btnPrimary: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#e94560",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  btnPrimaryGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 22,
    paddingVertical: 18,
  },
  btnPrimaryText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 2,
    flex: 1,
    marginLeft: 14,
  },

  // Bouton 3 — outline gris (Mes Designs)
  btnTertiary: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: "rgba(160, 160, 192, 0.4)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  btnTertiaryText: {
    color: "#a0a0c0",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 1.8,
    flex: 1,
    marginLeft: 12,
  },

  // Top header (Menu)
  topHeader: {
    position: "absolute",
    top: 50,
    left: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    zIndex: 5,
  },
  menuBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerLabel: {
    color: "#a0a0c0",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1,
  },
});
