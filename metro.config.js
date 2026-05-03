const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Permet à Metro de bundler les fichiers 3D et les scripts Three.js (.txt)
config.resolver.assetExts.push("glb", "gltf", "obj", "mtl", "fbx", "txt");

module.exports = config;
