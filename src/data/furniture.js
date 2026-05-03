// Catalogue des meubles disponibles pour la chambre
//
// STRUCTURE:
// - "model" (singulier): modèle par défaut (rétrocompat, gardé pour pas casser)
// - "models" (pluriel): array des variantes disponibles. Si > 1, le sélecteur s'affiche.
//
// Pour ajouter une variante: télécharge un GLB et ajoute un objet { id, name, model } dans "models".

export const FURNITURE_CATALOG = [
  {
    id: "bed",
    name: "Lit",
    icon: "bed",

    models: [
      {
        id: "bed-1",
        name: "Style 1",
        model: require("../../assets/models/bed1.glb"),
      },
      {
        id: "bed-2",
        name: "Style 2",
        model: require("../../assets/models/bed2.glb"),
      },

      {
        id: "bed-3",
        name: "Style 3",
        model: require("../../assets/models/bed3.glb"),
      },
    ],
    defaultColor: "#8B4513",
    width: 2,
    depth: 2,
  },
  {
    id: "chair",
    name: "Chaise",
    icon: "chair-rolling",

    models: [
      {
        id: "chair-0",
        name: "Style 1",
        model: require("../../assets/models/chair.glb"),
      },
      {
        id: "chair-1",
        name: "Style 2",
        model: require("../../assets/models/chair1.glb"),
      },
      {
        id: "chair-4",
        name: "Style 4",
        model: require("../../assets/models/chair4.glb"),
      },

      // Ajoute d'autres styles ici en téléchargeant plus de GLBs
    ],
    defaultColor: "#5C3317",
    width: 1,
    depth: 1,
  },
  {
    id: "table",
    name: "Table",
    icon: "table-furniture",

    models: [
      {
        id: "table-1",
        name: "Style 1",
        model: require("../../assets/models/table1.glb"),
      },
      {
        id: "table-2",
        name: "Style 2",
        model: require("../../assets/models/table2.glb"),
      },
    ],
    defaultColor: "#A0522D",
    width: 1.5,
    depth: 1.5,
  },
  {
    id: "lamp",
    name: "Lampe",
    icon: "floor-lamp",

    models: [
      {
        id: "lamp-1",
        name: "Style 1",
        model: require("../../assets/models/lampe.glb"),
      },
      {
        id: "lamp-2",
        name: "Style 2",
        model: require("../../assets/models/lamp1.glb"),
      },
    ],
    defaultColor: "#FFD700",
    width: 0.5,
    depth: 0.5,
  },
  {
    id: "wardrobe",
    name: "Armoire",
    icon: "wardrobe",

    models: [
      {
        id: "wardrobe-0",
        name: "Style 1",
        model: require("../../assets/models/wardrobe.glb"),
      },
      {
        id: "wardrobe-1",
        name: "Style 2",
        model: require("../../assets/models/wardrobe1.glb"),
      },
    ],
    defaultColor: "#654321",
    width: 2,
    depth: 1,
  },
  {
    id: "plant",
    name: "Plante",
    icon: "flower",

    models: [
      {
        id: "plant-1",
        name: "Style 1",
        model: require("../../assets/models/plant1.glb"),
      },
      {
        id: "plant-2",
        name: "Style 2",
        model: require("../../assets/models/plant2.glb"),
      },
    ],
    defaultColor: "#228B22",
    width: 0.5,
    depth: 0.5,
  },
];

// Couleurs disponibles dans le color picker
export const COLOR_OPTIONS = [
  "#8B4513", // marron
  "#e94560", // rose
  "#0f3460", // bleu foncé
  "#FFD700", // or
  "#4a90e2", // bleu clair
  "#50c878", // vert émeraude
  "#ffffff", // blanc
  "#2c2c2c", // noir
];
