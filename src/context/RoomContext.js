import React, { createContext, useState, useContext } from "react";

const RoomContext = createContext();

export function RoomProvider({ children }) {
  const [items, setItems] = useState([]);

  // Utilisé par CatalogScreen (génère l'id en interne)
  const addItem = (furnitureType) => {
    const newItem = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
      type: furnitureType.id,
      name: furnitureType.name,
      icon: furnitureType.icon,
      color: furnitureType.defaultColor,
      position: [0, 0],
      rotation: 0,
      width: furnitureType.width,
      depth: furnitureType.depth,
      variantId: furnitureType.variantId || null,
    };
    setItems((prev) => [...prev, newItem]);
  };

  // Utilisé par RoomEditor3DScreen (l'id est déjà fixé côté écran)
  const addItemDirect = (item) => {
    setItems((prev) => {
      if (prev.find((i) => i.id === item.id)) return prev; // éviter les doublons
      return [...prev, item];
    });
  };

  const removeItem = (itemId) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const updateItem = (itemId, updates) => {
    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, ...updates } : item)),
    );
  };

  const duplicateItem = (itemId) => {
    setItems((prev) => {
      const item = prev.find((i) => i.id === itemId);
      if (!item) return prev;
      const clone = {
        ...item,
        id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
        position: [item.position[0] + 0.3, item.position[1] + 0.3],
      };
      return [...prev, clone];
    });
  };

  const clearRoom = () => setItems([]);

  return (
    <RoomContext.Provider
      value={{
        items,
        addItem,
        addItemDirect,
        removeItem,
        updateItem,
        duplicateItem,
        clearRoom,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
}

export const useRoom = () => useContext(RoomContext);
