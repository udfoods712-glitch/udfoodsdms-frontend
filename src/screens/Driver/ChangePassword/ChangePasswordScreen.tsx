import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import CustomInput from "../../../components/Input/CustomInput";
import api from "../../../services/api";
import { getToken } from "../../../services/auth";

export default function ChangePasswordScreen({
  navigation,
}: any) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword.trim()) {
      Alert.alert(
        "Invalid password",
        "Enter your current password."
      );
      return;
    }

    if (!newPassword.trim()) {
      Alert.alert(
        "Invalid password",
        "Enter a new password."
      );
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert(
        "Invalid password",
        "New password must be at least 8 characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(
        "Passwords don't match",
        "Please make sure both new passwords are the same."
      );
      return;
    }

    if (currentPassword === newPassword) {
      Alert.alert(
        "Invalid password",
        "Your new password must be different from your current password."
      );
      return;
    }

    try {
      setLoading(true);

      const token = await getToken();

      await api.patch(
        "/auth/change-password",
        {
          current_password: currentPassword,
          new_password: newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      Alert.alert(
        "Password Changed",
        "Your password has been changed successfully.",
        [
          {
            text: "Done",
            onPress: () => navigation.goBack(),
          },
        ]
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.log(
        "CHANGE PASSWORD ERROR:",
        error.response?.data
      );

      Alert.alert(
        "Unable to change password",
        error.response?.data?.detail ??
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color="#222222"
            />
          </TouchableOpacity>

          <View style={styles.iconContainer}>
            <Ionicons
              name="lock-closed-outline"
              size={32}
              color="#6C4AB6"
            />
          </View>

          <Text style={styles.title}>
            Change Password
          </Text>

          <Text style={styles.subtitle}>
            Create a new password for your account.
          </Text>

          <View style={styles.form}>
            <CustomInput
              icon="lock-closed-outline"
              placeholder="Current Password"
              isPassword
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />

            <CustomInput
              icon="lock-closed-outline"
              placeholder="New Password"
              isPassword
              value={newPassword}
              onChangeText={setNewPassword}
            />

            <CustomInput
              icon="lock-closed-outline"
              placeholder="Confirm New Password"
              isPassword
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <Text style={styles.requirement}>
              Password must contain at least 8 characters.
            </Text>

            <TouchableOpacity
              style={[
                styles.button,
                loading && styles.buttonDisabled,
              ]}
              onPress={handleChangePassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator
                  color="#FFFFFF"
                />
              ) : (
                <Text style={styles.buttonText}>
                  Change Password
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F7FA",
  },

  flex: {
    flex: 1,
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
  },

  iconContainer: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: "#EEE8F8",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 18,
  },

  title: {
    fontSize: 25,
    fontWeight: "700",
    color: "#222222",
    textAlign: "center",
  },

  subtitle: {
    fontSize: 14,
    color: "#777777",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 30,
  },

  form: {
    gap: 14,
  },

  requirement: {
    fontSize: 12,
    color: "#888888",
    marginTop: -4,
    marginLeft: 4,
  },

  button: {
    height: 52,
    borderRadius: 14,
    backgroundColor: "#6C4AB6",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});