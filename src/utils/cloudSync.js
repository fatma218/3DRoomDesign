import { CLOUD_CONFIG } from "../config/cloudConfig";

const JSONBIN_API = "https://api.jsonbin.io/v3/b";

export async function saveToCloud(roomJson) {
  if (
    !CLOUD_CONFIG.JSONBIN_API_KEY ||
    CLOUD_CONFIG.JSONBIN_API_KEY === "TA_CLE_API_ICI"
  ) {
    throw new Error(
      "Clé JSONBin non configurée. Édite src/config/cloudConfig.js",
    );
  }

  try {
    const response = await fetch(JSONBIN_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Master-Key": CLOUD_CONFIG.JSONBIN_API_KEY,
        "X-Bin-Private": "false",
        "X-Bin-Name": "Room Designer Design",
      },
      body: JSON.stringify(roomJson),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur cloud (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    if (!data.metadata?.id) {
      throw new Error("Réponse JSONBin invalide (pas d'ID)");
    }

    return data.metadata.id;
  } catch (err) {
    console.error("[cloudSync] saveToCloud error:", err);
    throw err;
  }
}
