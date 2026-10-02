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

export default function EditDriverScreen({
  navigation,
  route,
}: any) {
  const { driver } = route.params;

  const [name, setName] = useState(driver.name);
  const [phone, setPhone] = useState(driver.phone);
  const [email, setEmail] = useState(driver.email);
  const [vehicleNumber, setVehicleNumber] = useState(
    driver.vehicle_number
  );

  const [loading, setLoading] = useState(false);

  const handleUpdateDriver = async () => {
    if (!name.trim()) {
      Alert.alert(
        "Required",
        "Enter the driver's name."
      );
      return;
    }

    if (!/^[0-9]{10}$/.test(phone.trim())) {
      Alert.alert(
        "Invalid phone",
        "Enter a valid 10-digit mobile number."
      );
      return;
    }

    if (!email.trim()) {
      Alert.alert(
        "Required",
        "Enter the driver's email."
      );
      return;
    }

    if (!vehicleNumber.trim()) {
      Alert.alert(
        "Required",
        "Enter the vehicle number."
      );
      return;
    }

    try {
      setLoading(true);

      const token = await getToken();

      await api.put(
        `/users/drivers/${driver.id}`,
        {
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          vehicle_number: vehicleNumber.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      Alert.alert(
        "Driver Updated",
        "The driver's details have been updated successfully.",
        [
          {
            text: "Done",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.log(
        "UPDATE DRIVER ERROR:",
        error.response?.data
      );

      Alert.alert(
        "Unable to update driver",
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
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
          keyboardDismissMode="on-drag"
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

          <Text style={styles.title}>
            Edit Driver
          </Text>

          <Text style={styles.subtitle}>
            Update the driver's details
          </Text>

          <View style={styles.driverBadge}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {driver.name
                  .charAt(0)
                  .toUpperCase()}
              </Text>
            </View>

            <View>
              <Text style={styles.driverName}>
                {driver.name}
              </Text>

              <Text style={styles.driverId}>
                Driver #{driver.id}
              </Text>
            </View>
          </View>

          <View style={styles.form}>
            <CustomInput
              icon="person-outline"
              placeholder="Full Name"
              value={name}
              onChangeText={setName}
            />

            <CustomInput
              icon="call-outline"
              placeholder="Mobile Number"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />

            <CustomInput
              icon="mail-outline"
              placeholder="Email Address"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            <CustomInput
              icon="car-outline"
              placeholder="Vehicle Number"
              autoCapitalize="characters"
              value={vehicleNumber}
              onChangeText={setVehicleNumber}
            />

            <TouchableOpacity
              style={[
                styles.button,
                loading && styles.buttonDisabled,
              ]}
              onPress={handleUpdateDriver}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator
                  color="#FFFFFF"
                />
              ) : (
                <Text style={styles.buttonText}>
                  Save Changes
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
    paddingBottom: 120,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 28,
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
    marginBottom: 22,
  },

  driverBadge: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },

  avatar: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#EEE8F8",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  avatarText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#6C4AB6",
  },

  driverName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#333333",
  },

  driverId: {
    fontSize: 12,
    color: "#999999",
    marginTop: 3,
  },

  form: {
    gap: 14,
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