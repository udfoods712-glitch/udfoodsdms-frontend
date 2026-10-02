import {
  createBottomTabNavigator,
} from "@react-navigation/bottom-tabs";
import {
  createNativeStackNavigator,
} from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import OwnerDashboardScreen from "../screens/Owner/Dashboard/OwnerDashboardScreen";
import DriversScreen from "../screens/Owner/Drivers/DriversScreen";
import AddDriverScreen from "../screens/Owner/Drivers/AddDriverScreen";
import EditDriverScreen from "../screens/Owner/Drivers/EditDriverScreen";
import OwnerDeliveriesScreen from "../screens/Owner/Deliveries/OwnerDeliveriesScreen";
import OwnerPaymentsScreen from "../screens/Owner/Payments/OwnerPaymentsScreen";
import OwnerProfileScreen from "../screens/Owner/Profile/OwnerProfileScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function OwnerTabs() {
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

          switch (route.name) {
            case "Home":
              iconName = "grid-outline";
              break;

            case "Drivers":
              iconName = "people-outline";
              break;

            case "Deliveries":
              iconName = "cube-outline";
              break;

            case "Payments":
              iconName = "wallet-outline";
              break;

            default:
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
        component={OwnerDashboardScreen}
      />

      <Tab.Screen
        name="Drivers"
        component={DriversScreen}
      />

      <Tab.Screen
        name="Deliveries"
        component={OwnerDeliveriesScreen}
      />

      <Tab.Screen
        name="Payments"
        component={OwnerPaymentsScreen}
      />

      <Tab.Screen
        name="Profile"
        component={OwnerProfileScreen}
      />
    </Tab.Navigator>
  );
}

export default function OwnerNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="OwnerTabs"
        component={OwnerTabs}
      />

      <Stack.Screen
        name="AddDriver"
        component={AddDriverScreen}
      />

      <Stack.Screen
        name="EditDriver"
        component={EditDriverScreen}
      />
    </Stack.Navigator>
  );
}