import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  StatusBar,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const STYLES = [
  {
    id: "classic",
    name: "CLASSIQUE",
    icon: "armchair",
    description: "Élégance intemporelle, bois & textiles chauds",
    accent: "#c8a97e",
    available: false,
  },
  {
    id: "gamer",
    name: "GAMER",
    icon: "gamepad-variant",
    description: "Setup RGB, high-tech & néons",
    accent: "#e94560",
    available: true,
  },
  {
    id: "modern",
    name: "MODERNE",
    icon: "cube-outline",
    description: "Minimalisme, lignes pures & design épuré",
    accent: "#4a90e2",
    available: false,
  },
];

export default function StyleSelectionScreen({ navigation }) {
  const cardAnims = useRef(
    STYLES.map(() => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(30),
    })),
  ).current;

  useEffect(() => {
    const animations = cardAnims.map((a, i) =>
      Animated.parallel([
        Animated.timing(a.opacity, {
          toValue: 1,
          duration: 500,
          delay: 100 + i * 120,
          useNativeDriver: true,
        }),
        Animated.timing(a.translateY, {
          toValue: 0,
          duration: 500,
          delay: 100 + i * 120,
          useNativeDriver: true,
        }),
      ]),
    );
    Animated.parallel(animations).start();
  }, []);

  const handleStyle = (style) => {
    if (!style.available) {
      Alert.alert(
        "🔒 Bientôt disponible",
        `Le style ${style.name.toLowerCase()} arrive très bientôt !`,
      );
      return;
    }
    if (style.id === "gamer") {
      navigation.navigate("Catalog");
    }
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

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Choisis ton style</Text>
        <View style={{ width: 40 }} />
      </View>

      <Text style={styles.subtitle}>Quel univers veux-tu créer ?</Text>

      <View style={styles.cardsContainer}>
        {STYLES.map((style, i) => (
          <Animated.View
            key={style.id}
            style={{
              opacity: cardAnims[i].opacity,
              transform: [{ translateY: cardAnims[i].translateY }],
            }}
          >
            <TouchableOpacity
              style={[
                styles.card,
                !style.available && styles.cardLocked,
                style.available && {
                  borderColor: style.accent,
                  borderWidth: 1.5,
                },
              ]}
              onPress={() => handleStyle(style)}
              activeOpacity={0.85}
            >
              <View
                style={[
                  styles.cardIcon,
                  { backgroundColor: `${style.accent}22` },
                ]}
              >
                <MaterialCommunityIcons
                  name={style.icon}
                  size={32}
                  color={style.accent}
                />
              </View>
              <View style={styles.cardContent}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.cardName}>{style.name}</Text>
                  {!style.available && (
                    <View style={styles.lockBadge}>
                      <MaterialCommunityIcons
                        name="lock"
                        size={11}
                        color="#a0a0c0"
                      />
                      <Text style={styles.lockText}>Bientôt</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.cardDesc}>{style.description}</Text>
              </View>
              {style.available && (
                <MaterialCommunityIcons
                  name="arrow-right"
                  size={22}
                  color={style.accent}
                />
              )}
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          D'autres styles arrivent bientôt 🎨
        </Text>
      </View>
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
  title: { color: "#fff", fontSize: 18, fontWeight: "600", letterSpacing: 1 },
  subtitle: {
    color: "#a0a0c0",
    fontSize: 13,
    textAlign: "center",
    marginTop: 14,
    marginBottom: 30,
    letterSpacing: 1,
  },
  cardsContainer: { paddingHorizontal: 20, gap: 16 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 18,
    padding: 18,
    gap: 16,
  },
  cardLocked: {
    opacity: 0.55,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  cardIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  cardContent: { flex: 1 },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  cardName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  lockBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  lockText: { color: "#a0a0c0", fontSize: 10, fontWeight: "500" },
  cardDesc: { color: "#a0a0c0", fontSize: 12, lineHeight: 17 },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  footerText: { color: "#404060", fontSize: 11, letterSpacing: 1 },
});
