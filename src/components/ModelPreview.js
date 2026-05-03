import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function ModelPreview({
  modelModule,
  fallbackIcon,
  backgroundColor = "#252544",
}) {
  const [dataUri, setDataUri] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!modelModule) {
      setError(true);
      return;
    }
    (async () => {
      try {
        const asset = Asset.fromModule(modelModule);
        await asset.downloadAsync();
        if (!asset.localUri) throw new Error("localUri null");
        const base64 = await FileSystem.readAsStringAsync(asset.localUri, {
          encoding: "base64",
        });
        setDataUri(`data:model/gltf-binary;base64,${base64}`);
      } catch (err) {
        console.error("[ModelPreview]", err);
        setError(true);
      }
    })();
  }, [modelModule]);

  // Fallback si pas de modèle 3D disponible
  if (error) {
    return (
      <View style={[styles.center, { backgroundColor }]}>
        {fallbackIcon && (
          <MaterialCommunityIcons
            name={fallbackIcon}
            size={80}
            color="#606080"
          />
        )}
        <Text style={styles.fallbackText}>Aperçu 3D bientôt disponible</Text>
      </View>
    );
  }

  if (!dataUri) {
    return (
      <View style={[styles.center, { backgroundColor }]}>
        <ActivityIndicator color="#e94560" size="large" />
      </View>
    );
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <script type="module" src="https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js"></script>
  <style>
    body, html { margin: 0; padding: 0; height: 100%; background: ${backgroundColor}; overflow: hidden; }
    model-viewer {
      width: 100vw;
      height: 100vh;
      --progress-bar-color: #e94560;
    }
  </style>
</head>
<body>
  <model-viewer
    src="${dataUri}"
    auto-rotate
    auto-rotate-delay="500"
    camera-controls
    touch-action="pan-y"
    shadow-intensity="1"
    exposure="1"
    interaction-prompt="none"
    background-color="${backgroundColor}">
  </model-viewer>
</body>
</html>
  `;

  return (
    <WebView
      originWhitelist={["*"]}
      source={{ html, baseUrl: "https://localhost" }}
      style={[styles.webview, { backgroundColor }]}
      javaScriptEnabled
      domStorageEnabled
    />
  );
}

const styles = StyleSheet.create({
  webview: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  fallbackText: {
    color: "#a0a0c0",
    fontSize: 13,
    marginTop: 12,
    textAlign: "center",
  },
});
