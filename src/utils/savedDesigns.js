// ────────────────────────────────────────────────────────────────────────────
// savedDesigns.js — gestion des designs sauvegardés (frontend only / mock DB)
//
// Persistance via AsyncStorage. Quand on aura un backend, il suffira de
// remplacer le contenu des fonctions par des fetch().
// ────────────────────────────────────────────────────────────────────────────

import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "@decora_saved_designs_v1";

/**
 * Liste tous les designs sauvegardés
 * @returns {Promise<Array>}
 */
export async function listSavedDesigns() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn("listSavedDesigns error:", e);
    return [];
  }
}

/**
 * Sauvegarde un nouveau design
 * @param {Object} design - { name, style, items, roomSize }
 * @returns {Promise<Object>} le design avec son id et timestamp
 */
export async function saveDesign(design) {
  try {
    const current = await listSavedDesigns();
    const newDesign = {
      id: "design_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
      name: design.name || "Sans nom",
      style: design.style || "modern",
      items: design.items || [],
      roomSize: design.roomSize || { width: 5, depth: 5 },
      likes: 0,
      createdAt: new Date().toISOString(),
    };
    const updated = [newDesign, ...current];
    await AsyncStorage.setItem(KEY, JSON.stringify(updated));
    return newDesign;
  } catch (e) {
    console.warn("saveDesign error:", e);
    throw e;
  }
}

/**
 * Récupère un design par son id
 */
export async function getDesignById(id) {
  const all = await listSavedDesigns();
  return all.find((d) => d.id === id) || null;
}

/**
 * Toggle like sur un design (incrémente / décrémente)
 */
export async function toggleLike(id) {
  try {
    const all = await listSavedDesigns();
    const idx = all.findIndex((d) => d.id === id);
    if (idx < 0) return false;
    all[idx].likes = (all[idx].likes || 0) + 1;
    await AsyncStorage.setItem(KEY, JSON.stringify(all));
    return true;
  } catch (e) {
    console.warn("toggleLike error:", e);
    return false;
  }
}

/**
 * Supprime un design
 */
export async function deleteDesign(id) {
  try {
    const all = await listSavedDesigns();
    const filtered = all.filter((d) => d.id !== id);
    await AsyncStorage.setItem(KEY, JSON.stringify(filtered));
    return true;
  } catch (e) {
    console.warn("deleteDesign error:", e);
    return false;
  }
}

/**
 * Vide tous les designs (debug)
 */
export async function clearAllDesigns() {
  await AsyncStorage.removeItem(KEY);
}
