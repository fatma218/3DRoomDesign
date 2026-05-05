import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { RoomProvider } from "./src/context/RoomContext";
import HomeScreen from "./src/Screens/HomeScreen";
import CatalogScreen from "./src/Screens/CatalogScreen";
import RoomEditorScreen from "./src/Screens/RoomEditorScreen";
import RoomEditor3DScreen from "./src/Screens/RoomEditor3DScreen";
import StyleSelectionScreen from "./src/Screens/StyleSelectionScreen";
import InspirationScreen from "./src/Screens/InspirationScreen";
import Room3DViewerScreen from "./src/Screens/Room3DViewerScreen";
import MyDesignsScreen from "./src/Screens/MyDesignsScreen";
import FavoritesScreen from "./src/Screens/FavoritesScreen";
import ProfileScreen from "./src/Screens/ProfileScreen";
import { AuthProvider } from "./src/context/AuthContext";
import LoginModal from "./src/components/LoginModal";
const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <AuthProvider>
      <RoomProvider>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Home"
            screenOptions={{ headerShown: false }}
          >
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Catalog" component={CatalogScreen} />
            <Stack.Screen name="Editor" component={RoomEditorScreen} />
            <Stack.Screen name="Editor3D" component={RoomEditor3DScreen} />
            <Stack.Screen
              name="StyleSelection"
              component={StyleSelectionScreen}
            />
            <Stack.Screen name="Inspiration" component={InspirationScreen} />
            <Stack.Screen name="Room3DViewer" component={Room3DViewerScreen} />
            <Stack.Screen name="MyDesigns" component={MyDesignsScreen} />
            <Stack.Screen name="Favorites" component={FavoritesScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
          </Stack.Navigator>
        </NavigationContainer>
        {/* Modal global accessible partout dans l'app */}
        <LoginModal />
      </RoomProvider>
    </AuthProvider>
  );
}
