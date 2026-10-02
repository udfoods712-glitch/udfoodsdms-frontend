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

import CustomInput from "../../components/Input/CustomInput";
import api from "../../services/api";
import { getToken } from "../../services/auth";
import { useAuth } from "../../context/AuthContext";

export default function ChangePasswordScreen() {
  const { user, setUser } = useAuth();

  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword.trim()) {
      Alert.alert(
        "Required",
        "Enter your current password."
      );
      return;
    }

    if (!newPassword.trim()) {
      Alert.alert(
        "Required",
        "Enter a new password."
      );
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert(
        "Invalid password",
        "Your new password must be at least 6 characters long."
      );
      return;
    }

    if (!confirmPassword.trim()) {
      Alert.alert(
        "Required",
        "Confirm your new password."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(
        "Passwords do not match",
        "The new password and confirmation password must be the same."
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

      if (user) {
        setUser({
          ...user,
          must_change_password: false,
        });
      }

      Alert.alert(
        "Password Changed",
        "Your password has been changed successfully."
      );
    } catch (error: any) {
      console.log(
        "FORCED PASSWORD CHANGE ERROR:",
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
            : "height"
        }
        keyboardVerticalOffset={
          Platform.OS === "ios" ? 0 : 20
        }
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets
        >
          <View style={styles.content}>

            <View style={styles.iconContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={30}
                color="#6C4AB6"
              />
            </View>

            <Text style={styles.title}>
              Change Your Password
            </Text>

            <Text style={styles.subtitle}>
              For security, you must change your
              temporary password before continuing.
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
                icon="lock-open-outline"
                placeholder="New Password"
                isPassword
                value={newPassword}
                onChangeText={setNewPassword}
              />

              <CustomInput
                icon="checkmark-circle-outline"
                placeholder="Confirm New Password"
                isPassword
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />

              <Text style={styles.hint}>
                Your new password must be at least
                6 characters long.
              </Text>

              <TouchableOpacity
                style={[
                  styles.button,
                  loading &&
                    styles.buttonDisabled,
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

  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },

  content: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },

  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#EEE8F8",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 20,
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#222222",
    textAlign: "center",
  },

  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: "#777777",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 30,
  },

  form: {
    gap: 14,
  },

  hint: {
    fontSize: 11,
    color: "#999999",
    marginTop: -5,
  },

  button: {
    height: 52,
    borderRadius: 14,
    backgroundColor: "#6C4AB6",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
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