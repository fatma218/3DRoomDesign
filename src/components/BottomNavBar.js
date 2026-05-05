// ────────────────────────────────────────────────────────────────────────────
// BottomNavBar — Barre de navigation 3 tabs (Home / Favorites / Profile)
//
// Utilisée dans : HomeScreen, FavoritesScreen, ProfileScreen
// Prop : active = "home" | "favorites" | "profile"
// ────────────────────────────────────────────────────────────────────────────

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const TABS = [
  { id: "home", label: "Home", icon: "home", iconActive: "home" },
  { id: "favorites", label: "Favorites", icon: "heart-outline", iconActive: "heart" },
  { id: "profile", label: "Profile", icon: "account-outline", iconActive: "account" },
];

const ROUTE_BY_TAB = {
  home: "Home",
  favorites: "Favorites",
  profile: "Profile",
};

export default function BottomNavBar({ active = "home" }) {
  const navigation = useNavigation();

  const handlePress = (tabId) => {
    if (tabId === active) return; // déjà sur ce tab
    const route = ROUTE_BY_TAB[tabId];
    if (route) {
      navigation.navigate(route);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.bar}>
        {TABS.map((tab) => {
          const isActive = active === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tab}
              onPress={() => handlePress(tab.id)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.iconWrap,
                  isActive && styles.iconWrapActive,
                ]}
              >
                <MaterialCommunityIcons
                  name={isActive ? tab.iconActive : tab.icon}
                  size={22}
                  color={isActive ? "#e94560" : "#8090a8"}
                />
              </View>
              <Text
                style={[styles.label, isActive && styles.labelActive]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingBottom: Platform.OS === "ios" ? 24 : 12,
    paddingTop: 8,
    paddingHorizontal: 16,
    backgroundColor: "rgba(15, 17, 35, 0.95)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    gap: 3,
  },
  iconWrap: {
    width: 44,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  iconWrapActive: {
    backgroundColor: "rgba(233, 69, 96, 0.18)",
  },
  label: {
    color: "#8090a8",
    fontSize: 10,
    fontWeight: "600",
  },
  labelActive: {
    color: "#e94560",
    fontWeight: "700",
  },
});
