import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import DriverHomeScreen from "../screens/Driver/Home/DriverHomeScreen";
import DriverArchiveScreen from "../screens/Driver/Archive/DriverArchiveScreen";
import DriverProfileScreen from "../screens/Driver/Profile/DriverProfileScreen";
import ChangePasswordScreen from "../screens/Driver/ChangePassword/ChangePasswordScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function DriverTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,

        tabBarActiveTintColor: "#6C4AB6",
        tabBarInactiveTintColor: "#999999",

        tabBarStyle: {
          height: 65,
          paddingBottom: 8,
          paddingTop: 6,
        },

        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === "Home") {
            iconName = "home-outline";
          } else if (route.name === "Archive") {
            iconName = "archive-outline";
          } else {
            iconName = "person-outline";
          }

          return (
            <Ionicons
              name={iconName}
              size={size}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={DriverHomeScreen}
      />

      <Tab.Screen
        name="Archive"
        component={DriverArchiveScreen}
      />

      <Tab.Screen
        name="Profile"
        component={DriverProfileScreen}
      />
    </Tab.Navigator>
  );
}

export default function DriverNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="DriverTabs"
        component={DriverTabs}
      />

      <Stack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
      />
    </Stack.Navigator>
  );
}