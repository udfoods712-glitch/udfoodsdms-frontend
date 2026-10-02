import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "../../../context/AuthContext";
import { logout } from "../../../services/auth";

export default function DriverProfileScreen({
  navigation,
}: any) {
  const { user, setUser } = useAuth();

  const [loggingOut, setLoggingOut] = useState(false);

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
          onPress: performLogout,
        },
      ]
    );
  };

  const performLogout = async () => {
    try {
      setLoggingOut(true);

      await logout();

      setUser(null);
    } catch (error) {
      Alert.alert(
        "Logout failed",
        "Please try again."
      );
    } finally {
      setLoggingOut(false);
    }
  };

  if (!user) {
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Profile</Text>

        <Text style={styles.subtitle}>
          Your account details
        </Text>

        {/* Profile Header */}

        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user.name.charAt(0).toUpperCase()}
            </Text>
          </View>

          <Text style={styles.name}>
            {user.name}
          </Text>

          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              DRIVER
            </Text>
          </View>
        </View>

        {/* Account Information */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Account Information
          </Text>

          <View style={styles.card}>
            <ProfileRow
              icon="person-outline"
              label="Name"
              value={user.name}
            />

            <ProfileRow
              icon="call-outline"
              label="Phone"
              value={user.phone}
            />

            <ProfileRow
              icon="mail-outline"
              label="Email"
              value={user.email ?? "Not provided"}
              isLast
            />
          </View>
        </View>

        {/* Driver Information */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Driver Information
          </Text>

          <View style={styles.card}>
            <ProfileRow
              icon="car-outline"
              label="Vehicle Number"
              value={
                user.vehicle_number ??
                "Not provided"
              }
            />

            <ProfileRow
              icon="checkmark-circle-outline"
              label="Account Status"
              value={
                user.is_active
                  ? "Active"
                  : "Inactive"
              }
              valueColor={
                user.is_active
                  ? "#2E9D5B"
                  : "#D64545"
              }
              isLast
            />
          </View>
        </View>

        {/* Security */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Security
          </Text>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() =>
  navigation.navigate("ChangePassword")
}
          >
            <View style={styles.actionIcon}>
              <Ionicons
                name="lock-closed-outline"
                size={21}
                color="#6C4AB6"
              />
            </View>

            <View style={styles.actionInfo}>
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
              color="#999999"
            />
          </TouchableOpacity>
        </View>

        {/* Logout */}

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={loggingOut}
        >
          {loggingOut ? (
            <ActivityIndicator
              color="#D64545"
              size="small"
            />
          ) : (
            <>
              <Ionicons
                name="log-out-outline"
                size={20}
                color="#D64545"
              />

              <Text style={styles.logoutText}>
                Logout
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function ProfileRow({
  icon,
  label,
  value,
  valueColor,
  isLast = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  valueColor?: string;
  isLast?: boolean;
}) {
  return (
    <View
      style={[
        styles.profileRow,
        !isLast && styles.rowBorder,
      ]}
    >
      <View style={styles.rowIcon}>
        <Ionicons
          name={icon}
          size={19}
          color="#6C4AB6"
        />
      </View>

      <View style={styles.rowContent}>
        <Text style={styles.rowLabel}>
          {label}
        </Text>

        <Text
          style={[
            styles.rowValue,
            valueColor
              ? { color: valueColor }
              : null,
          ]}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F7FA",
  },

  content: {
    padding: 20,
    paddingBottom: 35,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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

  profileHeader: {
    alignItems: "center",
    marginTop: 25,
    marginBottom: 28,
  },

  avatar: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: "#6C4AB6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  avatarText: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  name: {
    fontSize: 21,
    fontWeight: "700",
    color: "#222222",
  },

  roleBadge: {
    backgroundColor: "#EEE8F8",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 7,
  },

  roleText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6C4AB6",
  },

  section: {
    marginBottom: 22,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333333",
    marginBottom: 10,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 16,
  },

  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
  },

  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F0EFF2",
  },

  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: "#EEE8F8",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  rowContent: {
    flex: 1,
  },

  rowLabel: {
    fontSize: 11,
    color: "#999999",
    marginBottom: 3,
  },

  rowValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333333",
  },

  actionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
  },

  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#EEE8F8",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  actionInfo: {
    flex: 1,
  },

  actionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333333",
  },

  actionSubtitle: {
    fontSize: 12,
    color: "#888888",
    marginTop: 3,
  },

  logoutButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: "#FDEEEE",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 5,
  },

  logoutText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#D64545",
    marginLeft: 8,
  },
});