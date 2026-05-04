// Mock data Inspiration — pointe sur les .glb dans assets/room/
export const INSPIRATION_ROOMS = [
  {
    id: "room1",
    name: "Chambre 1",
    style: "gamer",
    styleEmoji: "🎮",
    likes: 234,
    description: "Setup gaming RGB",
    color: "#e94560",
    gradient: ["#e94560", "#c8395a"],
    modelModule: require("../../assets/room/room1.glb"),
  },
  {
    id: "room2",
    name: "Chambre 2",
    style: "modern",
    styleEmoji: "✨",
    likes: 312,
    description: "Loft minimaliste",
    color: "#4a90e2",
    gradient: ["#4a90e2", "#2c5f9e"],
    modelModule: require("../../assets/room/room2.glb"),
  },
  {
    id: "room3",
    name: "Chambre 3",
    style: "classic",
    styleEmoji: "🪑",
    likes: 156,
    description: "Style classique chaleureux",
    color: "#c8a97e",
    gradient: ["#c8a97e", "#8b6f47"],
    modelModule: require("../../assets/room/room3.glb"),
  },
  {
    id: "room4",
    name: "Chambre 4",
    style: "gamer",
    styleEmoji: "🎮",
    likes: 421,
    description: "Pro gamer den",
    color: "#9b59b6",
    gradient: ["#9b59b6", "#8e44ad"],
    modelModule: require("../../assets/room/room4.glb"),
  },
];

export const STYLE_FILTERS = [
  { id: "all", label: "Tout", icon: "view-grid" },
  { id: "gamer", label: "Gamer", icon: "gamepad-variant" },
  { id: "classic", label: "Classique", icon: "sofa" },
  { id: "modern", label: "Moderne", icon: "cube-outline" },
];
