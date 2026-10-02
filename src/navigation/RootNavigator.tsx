import { NavigationContainer } from "@react-navigation/native";

import { useAuth } from "../context/AuthContext";

import LoginScreen from "../screens/Login/LoginScreen";
import ChangePasswordScreen from "../screens/Auth/ChangePasswordScreen";

import DriverNavigator from "./DriverNavigator";
import OwnerNavigator from "./OwnerNavigator";


export default function RootNavigator() {

  const { user } = useAuth();


  return (

    <NavigationContainer>

      {!user ? (

        <LoginScreen />

      ) : user.must_change_password ? (

        <ChangePasswordScreen />

      ) : user.role === "OWNER" ? (

        <OwnerNavigator />

      ) : (

        <DriverNavigator />

      )}

    </NavigationContainer>

  );

}