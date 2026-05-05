// ────────────────────────────────────────────────────────────────────────────
// likedRooms.js — Gestion des chambres "likées" (frontend, AsyncStorage)
//
// Utilisé par :
//  - Room3DViewerScreen (toggle like)
//  - FavoritesScreen    (afficher la liste)
//
// Plus tard : backend → remplacer par fetch()
// ────────────────────────────────────────────────────────────────────────────

import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "@decora_liked_rooms_v1";

/**
 * Liste tous les room IDs likés
 * @returns {Promise<string[]>}
 */
export async function listLikedRoomIds() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn("listLikedRoomIds error:", e);
    return [];
  }
}

/**
 * Vérifie si une room est likée
 */
export async function isRoomLiked(roomId) {
  const ids = await listLikedRoomIds();
  return ids.includes(roomId);
}

/**
 * Toggle like : ajoute si pas liké, retire si liké
 * @returns {Promise<boolean>} true si maintenant liké, false sinon
 */
export async function toggleRoomLike(roomId) {
  try {
    const ids = await listLikedRoomIds();
    let next;
    let liked;
    if (ids.includes(roomId)) {
      next = ids.filter((id) => id !== roomId);
      liked = false;
    } else {
      next = [...ids, roomId];
      liked = true;
    }
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
    return liked;
  } catch (e) {
    console.warn("toggleRoomLike error:", e);
    return false;
  }
}

/**
 * Vide tous les likes (debug / reset)
 */
export async function clearAllLikes() {
  await AsyncStorage.removeItem(KEY);
}
