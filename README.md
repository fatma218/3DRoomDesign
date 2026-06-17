# mobile-3D-RoomDesign

Application mobile de design d'intérieur permettant de créer et personnaliser une chambre en 3D.

## Captures d'écran

Galerie de l'application :

![Accueil](<capture d'interface/homepage.jpeg>)
![Catalogue](<capture d'interface/inspirationpage.jpeg>)
![Sélection de style](<capture d'interface/chosirestylegamerpourledesignroom.jpeg>)

![Interface de catégorie](<capture d'interface/categorieinterface.jpeg>)
![Modèle 3D](<capture d'interface/InterfaceexempleModel3Ddanscategorie.jpeg>)
![Vue éditeur 3D](<capture d'interface/editorscreen+affichagedemeublechoisie dans l'inventroy.jpeg>)
![Vue éditeur 3D](<capture d'interface/deplacerdesmeubledansleplan3D.jpeg>)
![Galerie de design sauvegardé](<capture d'interface/interfacedesavedesign.jpeg>)

![Retour accueil](<capture d'interface/encasderetourpagehomesansenregistrerledesign.jpeg>)

![Connexion / authentification](<capture d'interface/authentificationinterfaceencaspasencoreconecter.jpeg>)

## Description

Application React Native / Expo pour concevoir des intérieurs avec :

- Catalogue de meubles avec sélection de variantes et choix de couleurs
- Aperçu 3D des modèles dans un modal interactif
- Éditeur 3D principal via `WebView` avec rendu de modèles 3D
- Gestion des designs sauvegardés et système de favoris
- Authentification simulée avec protection d'actions utilisateur
- Synchronisation cloud pour exporter et partager les designs

## Technologies

- `React Native` + `Expo` (v54)
- `@react-navigation/native` + `@react-navigation/native-stack`
- `react-native-webview` pour rendu 3D via HTML/Model Viewer
- `expo-asset` + `expo-file-system` pour gestion des modèles 3D
- `@react-native-async-storage/async-storage` pour persistance locale
- `expo-linear-gradient` + `@expo/vector-icons` pour l'UI
- `React Hooks` + `Context API` pour l'état global

## Fonctionnalités

- Écran d'accueil animé avec navigation
- Catalogue de meubles avec sélection de variantes et couleurs
- Aperçu 3D des meubles avant ajout en chambre
- Éditeur 3D interactif avec positionnement et rotation des objets
- Sauvegarde locale des designs
- Système de favoris persistant (AsyncStorage)
- Export JSON et synchronisation cloud (JSONBin)
- Authentification mockée et gestion des permissions
- Gallery d'inspiration avec modèles 3D

## Installation et lancement

1. Cloner le projet :

   ```bash
   git clone https://github.com/[votre-username]/mobile-3D-RoomDesign.git
   cd mobile-3D-RoomDesign
   ```

2. Installer les dépendances :

   ```bash
   npm install
   ```

3. Vérifier que Expo CLI est installé globalement :

   ```bash
   npm install -g expo-cli
   ```

4. Démarrer le serveur Expo :

   ```bash
   npm start
   ```

5. Scanner le QR code ou appuyer sur `i` / `a` pour lancer sur un émulateur

### Scripts disponibles

```bash
npm start        # Démarrer le serveur Expo
npm run android  # Lancer sur un émulateur Android
npm run ios      # Lancer sur un simulateur iOS
npm run web      # Lancer sur le web
```

## Notes techniques

- L'authentification est actuellement mockée (`AuthContext.js`)
- Les designs sont sauvegardés localement via AsyncStorage
- Les modèles 3D sont chargés via WebView avec Google Model Viewer
- Le projet utilise des animations React Native pour l'UI
- Les favoris et designs sauvegardés sont persistants

## Prérequis

- Node.js >= 14
- npm ou yarn
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app sur votre téléphone (iOS App Store ou Google Play)
