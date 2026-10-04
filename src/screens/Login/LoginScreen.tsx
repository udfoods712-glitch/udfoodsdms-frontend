import React, { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import CustomButton from "../../components/Button/CustomButton";
import CustomInput from "../../components/Input/CustomInput";

import {
  login,
  getCurrentUser,
} from "../../services/auth";

import { useAuth } from "../../context/AuthContext";

import styles from "./styles";

export default function LoginScreen() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { setUser } = useAuth();

  const handleLogin = async () => {
    const phoneRegex = /^[0-9]{10}$/;

    if (!phoneRegex.test(phone.trim())) {
      alert(
        "Enter a valid 10-digit mobile number."
      );
      return;
    }

    if (password.trim() === "") {
      alert("Password cannot be empty.");
      return;
    }

    try {
      setLoading(true);

      // Login returns the token and
      // must_change_password flag
      const loginResult = await login(
        phone.trim(),
        password
      );

      // Get complete user profile
      const user = await getCurrentUser();

      // Keep the flag returned by login
      setUser({
        ...user,
        must_change_password:
          loginResult.must_change_password,
      });
    } catch (error: any) {
      console.log(
        "LOGIN ERROR:",
        error.response?.data
      );

      alert(
        error.response?.data?.detail ??
          "Login failed."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={
            Platform.OS === "ios"
              ? "padding"
              : undefined
          }
        >
          <View style={styles.logoSection}>
            <Image
              source={require(
                "../../../assets/splash-icon.png"
              )}
              style={styles.logo}
              resizeMode="contain"
            />

            <Text style={styles.title}>
              UD Foods
            </Text>

            <Text style={styles.subtitle}>
              Login to continue
            </Text>
          </View>

          <View style={styles.form}>
            <CustomInput
              icon="call-outline"
              placeholder="Mobile Number"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />

            <CustomInput
              icon="lock-closed-outline"
              placeholder="Password"
              isPassword
              value={password}
              onChangeText={setPassword}
            />

            <CustomButton
              title="Login"
              loading={loading}
              onPress={handleLogin}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}