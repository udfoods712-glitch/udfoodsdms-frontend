import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

import CustomInput from "../../../components/Input/CustomInput";
import api from "../../../services/api";
import { getToken, logout } from "../../../services/auth";
import { useAuth } from "../../../context/AuthContext";

interface UserProfile {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  vehicle_number: string | null;
  role: "OWNER" | "DRIVER";
  is_active: boolean;
}

export default function OwnerProfileScreen() {
  const { user, setUser } = useAuth();

  const [profile, setProfile] =
    useState<UserProfile | null>(null);

  const [loading, setLoading] = useState(true);

  // ==============================
  // CHANGE PASSWORD
  // ==============================

  const [passwordVisible, setPasswordVisible] =
    useState(false);

  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [passwordLoading, setPasswordLoading] =
    useState(false);

  // ==============================
  // RESET PASSWORD
  // ==============================

  const [resetVisible, setResetVisible] =
    useState(false);

  const [resetPhone, setResetPhone] =
    useState("");

  const [resetLoading, setResetLoading] =
    useState(false);

  // ==============================
  // FETCH PROFILE
  // ==============================

  const fetchProfile = async () => {
    try {
      const token = await getToken();

      const response = await api.get(
        "/users/me",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setProfile(response.data);

      // Keep AuthContext in sync
      setUser({
        id: response.data.id,
        name: response.data.name,
        phone: response.data.phone,
        email: response.data.email,
        vehicle_number:
          response.data.vehicle_number,
        role: response.data.role,
        is_active: response.data.is_active,
        must_change_password:
          user?.must_change_password ?? false,
      });
    } catch (error: any) {
      console.log(
        "PROFILE ERROR:",
        error.response?.data
      );

      Alert.alert(
        "Unable to load profile",
        error.response?.data?.detail ??
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [])
  );

  // ==============================
  // CHANGE PASSWORD
  // ==============================

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
      setPasswordLoading(true);

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

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setPasswordVisible(false);

      // Update local auth state
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
        "CHANGE PASSWORD ERROR:",
        error.response?.data
      );

      Alert.alert(
        "Unable to change password",
        error.response?.data?.detail ??
          "Something went wrong. Please try again."
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  // ==============================
  // RESET PASSWORD
  // ==============================

  const handleResetPassword = async () => {
    const phone = resetPhone.trim();

    if (!/^[0-9]{10}$/.test(phone)) {
      Alert.alert(
        "Invalid phone number",
        "Enter a valid 10-digit mobile number."
      );
      return;
    }

    try {
      setResetLoading(true);

      const token = await getToken();

      await api.patch(
        "/auth/reset-password",
        {
          phone,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setResetPhone("");
      setResetVisible(false);

      Alert.alert(
        "Password Reset",
        "The user's password has been reset successfully."
      );
    } catch (error: any) {
      console.log(
        "RESET PASSWORD ERROR:",
        error.response?.data
      );

      Alert.alert(
        "Unable to reset password",
        error.response?.data?.detail ??
          "Something went wrong. Please try again."
      );
    } finally {
      setResetLoading(false);
    }
  };

  // ==============================
  // LOGOUT
  // ==============================

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            await logout();
            setUser(null);
          },
        },
      ]
    );
  };

  // ==============================
  // CLOSE PASSWORD MODAL
  // ==============================

  const closePasswordModal = () => {
    if (passwordLoading) {
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordVisible(false);
  };

  // ==============================
  // CLOSE RESET MODAL
  // ==============================

  const closeResetModal = () => {
    if (resetLoading) {
      return;
    }

    setResetPhone("");
    setResetVisible(false);
  };

  // ==============================
  // LOADING
  // ==============================

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator
            size="large"
            color="#6C4AB6"
          />
        </View>
      </SafeAreaView>
    );
  }

  // ==============================
  // SCREEN
  // ==============================

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}

        <View style={styles.header}>
          <Text style={styles.title}>
            Profile
          </Text>

          <Text style={styles.subtitle}>
            Your account information
          </Text>
        </View>

        {/* PROFILE CARD */}

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profile?.name
                ?.charAt(0)
                .toUpperCase() ?? "O"}
            </Text>
          </View>

          <View style={styles.profileMain}>
            <Text style={styles.name}>
              {profile?.name ?? "Owner"}
            </Text>

            <View style={styles.roleBadge}>
              <Ionicons
                name="shield-checkmark-outline"
                size={13}
                color="#6C4AB6"
              />

              <Text style={styles.roleText}>
                Owner
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  profile?.is_active
                    ? "#EAF7EF"
                    : "#FDEEEE",
              },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor:
                    profile?.is_active
                      ? "#2E9D5B"
                      : "#D64545",
                },
              ]}
            />

            <Text
              style={[
                styles.statusText,
                {
                  color:
                    profile?.is_active
                      ? "#2E9D5B"
                      : "#D64545",
                },
              ]}
            >
              {profile?.is_active
                ? "Active"
                : "Inactive"}
            </Text>
          </View>
        </View>

        {/* ACCOUNT INFORMATION */}

        <Text style={styles.sectionTitle}>
          Account Information
        </Text>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons
                name="person-outline"
                size={19}
                color="#6C4AB6"
              />
            </View>

            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>
                Full Name
              </Text>

              <Text style={styles.infoValue}>
                {profile?.name ?? "-"}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons
                name="call-outline"
                size={19}
                color="#6C4AB6"
              />
            </View>

            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>
                Mobile Number
              </Text>

              <Text style={styles.infoValue}>
                {profile?.phone ?? "-"}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons
                name="mail-outline"
                size={19}
                color="#6C4AB6"
              />
            </View>

            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>
                Email Address
              </Text>

              <Text style={styles.infoValue}>
                {profile?.email ?? "-"}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons
                name="shield-outline"
                size={19}
                color="#6C4AB6"
              />
            </View>

            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>
                Account Role
              </Text>

              <Text style={styles.infoValue}>
                {profile?.role ?? "OWNER"}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons
                name="finger-print-outline"
                size={19}
                color="#6C4AB6"
              />
            </View>

            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>
                User ID
              </Text>

              <Text style={styles.infoValue}>
                #{profile?.id ?? "-"}
              </Text>
            </View>
          </View>
        </View>

        {/* ACCOUNT ACTIONS */}

        <Text style={styles.sectionTitle}>
          Account
        </Text>

        <View style={styles.actionsCard}>
          {/* CHANGE PASSWORD */}

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() =>
              setPasswordVisible(true)
            }
          >
            <View style={styles.actionIcon}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#6C4AB6"
              />
            </View>

            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>
                Change Password
              </Text>

              <Text style={styles.actionSubtitle}>
                Update your account password
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={20}
              color="#AAAAAA"
            />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* RESET PASSWORD */}

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() =>
              setResetVisible(true)
            }
          >
            <View style={styles.actionIcon}>
              <Ionicons
                name="key-outline"
                size={20}
                color="#6C4AB6"
              />
            </View>

            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>
                Reset Password
              </Text>

              <Text style={styles.actionSubtitle}>
                Reset a user's password
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={20}
              color="#AAAAAA"
            />
          </TouchableOpacity>
        </View>

        {/* LOGOUT */}

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons
            name="log-out-outline"
            size={20}
            color="#D64545"
          />

          <Text style={styles.logoutText}>
            Logout
          </Text>
        </TouchableOpacity>

        <Text style={styles.version}>
          Delivery Management App
        </Text>
      </ScrollView>

      {/* ================================= */}
      {/* CHANGE PASSWORD MODAL */}
      {/* ================================= */}

      <Modal
        visible={passwordVisible}
        animationType="slide"
        transparent
        onRequestClose={closePasswordModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={
            Platform.OS === "ios"
              ? "padding"
              : undefined
          }
        >
          <View style={styles.modalContainer}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={
                styles.modalContent
              }
            >
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>
                    Change Password
                  </Text>

                  <Text style={styles.modalSubtitle}>
                    Update your account password
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={closePasswordModal}
                  disabled={passwordLoading}
                >
                  <Ionicons
                    name="close"
                    size={22}
                    color="#333333"
                  />
                </TouchableOpacity>
              </View>

              <CustomInput
                icon="lock-closed-outline"
                placeholder="Current Password"
                isPassword
                value={currentPassword}
                onChangeText={
                  setCurrentPassword
                }
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
                onChangeText={
                  setConfirmPassword
                }
              />

              <Text style={styles.passwordHint}>
                Password must be at least 6 characters.
              </Text>

              <TouchableOpacity
                style={[
                  styles.changePasswordButton,
                  passwordLoading &&
                    styles.buttonDisabled,
                ]}
                onPress={handleChangePassword}
                disabled={passwordLoading}
              >
                {passwordLoading ? (
                  <ActivityIndicator
                    color="#FFFFFF"
                  />
                ) : (
                  <Text
                    style={
                      styles.changePasswordText
                    }
                  >
                    Change Password
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ================================= */}
      {/* RESET PASSWORD MODAL */}
      {/* ================================= */}

      <Modal
        visible={resetVisible}
        animationType="slide"
        transparent
        onRequestClose={closeResetModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={
            Platform.OS === "ios"
              ? "padding"
              : undefined
          }
        >
          <View style={styles.modalContainer}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={
                styles.modalContent
              }
            >
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>
                    Reset Password
                  </Text>

                  <Text style={styles.modalSubtitle}>
                    Reset a user's password
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={closeResetModal}
                  disabled={resetLoading}
                >
                  <Ionicons
                    name="close"
                    size={22}
                    color="#333333"
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.resetWarning}>
                <Ionicons
                  name="information-circle-outline"
                  size={20}
                  color="#D88924"
                />

                <Text style={styles.resetWarningText}>
                  The user's password will be reset
                  to the default password:
                  {"\n"}
                  <Text
                    style={
                      styles.defaultPassword
                    }
                  >
                    Driver@123
                  </Text>
                </Text>
              </View>

              <CustomInput
                icon="call-outline"
                placeholder="User Mobile Number"
                keyboardType="phone-pad"
                value={resetPhone}
                onChangeText={setResetPhone}
              />

              <TouchableOpacity
                style={[
                  styles.changePasswordButton,
                  resetLoading &&
                    styles.buttonDisabled,
                ]}
                onPress={handleResetPassword}
                disabled={resetLoading}
              >
                {resetLoading ? (
                  <ActivityIndicator
                    color="#FFFFFF"
                  />
                ) : (
                  <Text
                    style={
                      styles.changePasswordText
                    }
                  >
                    Reset Password
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F7FA",
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  header: {
    marginBottom: 22,
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#222222",
  },

  subtitle: {
    fontSize: 14,
    color: "#777777",
    marginTop: 5,
  },

  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
  },

  avatar: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: "#EEE8F8",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 13,
  },

  avatarText: {
    fontSize: 23,
    fontWeight: "700",
    color: "#6C4AB6",
  },

  profileMain: {
    flex: 1,
  },

  name: {
    fontSize: 17,
    fontWeight: "700",
    color: "#222222",
  },

  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#EEE8F8",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 5,
  },

  roleText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#6C4AB6",
    marginLeft: 4,
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 20,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },

  statusText: {
    fontSize: 9,
    fontWeight: "600",
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 11,
  },

  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 15,
    marginBottom: 25,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },

  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: "#EEE8F8",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  infoContent: {
    flex: 1,
  },

  infoLabel: {
    fontSize: 11,
    color: "#999999",
    marginBottom: 3,
  },

  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333333",
  },

  divider: {
    height: 1,
    backgroundColor: "#F0EFF2",
  },

  actionsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 15,
    marginBottom: 18,
  },

  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
  },

  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#EEE8F8",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  actionContent: {
    flex: 1,
  },

  actionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333333",
  },

  actionSubtitle: {
    fontSize: 11,
    color: "#999999",
    marginTop: 3,
  },

  logoutButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: "#FDEEEE",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  logoutText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#D64545",
    marginLeft: 8,
  },

  version: {
    textAlign: "center",
    fontSize: 10,
    color: "#AAAAAA",
    marginTop: 18,
  },

  // ==============================
  // MODALS
  // ==============================

  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.35)",
  },

  modalContainer: {
    backgroundColor: "#F8F7FA",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    maxHeight: "85%",
  },

  modalContent: {
    padding: 20,
    paddingBottom: 35,
    gap: 14,
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },

  modalTitle: {
    fontSize: 23,
    fontWeight: "700",
    color: "#222222",
  },

  modalSubtitle: {
    fontSize: 13,
    color: "#888888",
    marginTop: 4,
  },

  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },

  passwordHint: {
    fontSize: 11,
    color: "#999999",
    marginTop: -7,
  },

  changePasswordButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: "#6C4AB6",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },

  changePasswordText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  // ==============================
  // RESET PASSWORD
  // ==============================

  resetWarning: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFF4E5",
    borderRadius: 12,
    padding: 12,
    marginBottom: 4,
  },

  resetWarningText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: "#8A5A18",
    marginLeft: 8,
  },

  defaultPassword: {
    fontWeight: "700",
    color: "#6C4AB6",
  },
});