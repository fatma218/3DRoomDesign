import React, { useRef, useEffect } from "react";
import { Animated, PanResponder, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const SNAP_GRID = 0.25; // mètres

/**
 * Meuble draggable avec snap-to-grid, clamp aux bords, et animations.
 *
 * Props:
 *  - item: objet meuble (avec position, width, depth, color, icon, rotation)
 *  - scale: pixels par mètre
 *  - roomSizeMeters: taille de la chambre en mètres
 *  - isSelected: boolean
 *  - onSelect: callback(itemId) appelé quand on touche le meuble
 *  - onMove: callback(itemId, [x, y]) appelé quand le drag se termine
 */
export default function DraggableFurniture({
  item,
  scale,
  roomSizeMeters,
  isSelected,
  onSelect,
  onMove,
}) {
  // Position animée (en pixels)
  const pan = useRef(
    new Animated.ValueXY({
      x: item.position[0] * scale,
      y: item.position[1] * scale,
    }),
  ).current;

  // Animations visuelles
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shadowAnim = useRef(new Animated.Value(0.3)).current;

  // Track si on est en train de drag pour ne pas overwrite la pan en useEffect
  const isDragging = useRef(false);

  // Sync external position changes (reset, duplicate, etc.)
  useEffect(() => {
    if (!isDragging.current) {
      pan.setValue({
        x: item.position[0] * scale,
        y: item.position[1] * scale,
      });
    }
  }, [item.position[0], item.position[1], scale]);

  const itemWidthPx = item.width * scale;
  const itemDepthPx = item.depth * scale;
  const maxX = (roomSizeMeters - item.width) * scale;
  const maxY = (roomSizeMeters - item.depth) * scale;

  const panResponder = useRef(
    PanResponder.create({
      // Capter le touch dès le start
      onStartShouldSetPanResponder: () => true,
      // Confirmer pour les mouvements
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: () => {
        isDragging.current = true;
        onSelect(item.id);

        // Sauvegarde la position actuelle comme offset
        pan.setOffset({
          x: pan.x._value,
          y: pan.y._value,
        });
        pan.setValue({ x: 0, y: 0 });

        // Visual feedback: scale up + shadow plus profonde
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1.08,
            useNativeDriver: false,
            tension: 200,
            friction: 12,
          }),
          Animated.timing(shadowAnim, {
            toValue: 0.6,
            duration: 150,
            useNativeDriver: false,
          }),
        ]).start();
      },

      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),

      onPanResponderRelease: () => {
        pan.flattenOffset();

        const currentX = pan.x._value;
        const currentY = pan.y._value;

        // Snap à la grille (0.25m)
        const snapPx = SNAP_GRID * scale;
        let finalX = Math.round(currentX / snapPx) * snapPx;
        let finalY = Math.round(currentY / snapPx) * snapPx;

        // Clamp aux bords de la chambre
        finalX = Math.max(0, Math.min(maxX, finalX));
        finalY = Math.max(0, Math.min(maxY, finalY));

        // Animate to snapped position + reset visuals
        Animated.parallel([
          Animated.spring(pan, {
            toValue: { x: finalX, y: finalY },
            useNativeDriver: false,
            tension: 180,
            friction: 14,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: false,
          }),
          Animated.timing(shadowAnim, {
            toValue: 0.3,
            duration: 150,
            useNativeDriver: false,
          }),
        ]).start(() => {
          isDragging.current = false;
        });

        // Notify parent (en mètres)
        onMove(item.id, [finalX / scale, finalY / scale]);
      },

      onPanResponderTerminate: () => {
        // Si la gesture est interrompue
        pan.flattenOffset();
        isDragging.current = false;
        Animated.parallel([
          Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: false }),
          Animated.timing(shadowAnim, {
            toValue: 0.3,
            duration: 150,
            useNativeDriver: false,
          }),
        ]).start();
      },
    }),
  ).current;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.furniture,
        {
          width: itemWidthPx,
          height: itemDepthPx,
          backgroundColor: item.color,
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
            { scale: scaleAnim },
            { rotate: `${item.rotation}deg` },
          ],
          shadowOpacity: shadowAnim,
        },
        isSelected && styles.selected,
      ]}
    >
      <MaterialCommunityIcons
        name={item.icon}
        size={Math.min(itemWidthPx, itemDepthPx) * 0.55}
        color="#fff"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  furniture: {
    position: "absolute",
    left: 0,
    top: 0,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  selected: {
    borderColor: "#e94560",
    shadowColor: "#e94560",
    elevation: 12,
  },
});
