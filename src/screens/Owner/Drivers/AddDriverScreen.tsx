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

export default function AddDriverScreen({
  navigation,
}: any) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");

  const [loading, setLoading] = useState(false);

  const handleAddDriver = async () => {
    if (!name.trim()) {
      Alert.alert("Required", "Enter the driver's name.");
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
      Alert.alert("Required", "Enter the driver's email.");
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

      await api.post(
        "/users/drivers",
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
        "Driver Added",
        "The driver has been added successfully.",
        [
          {
            text: "Done",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.log(
        "ADD DRIVER ERROR:",
        error.response?.data
      );

      Alert.alert(
        "Unable to add driver",
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
          showsVerticalScrollIndicator={false}
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
            Add Driver
          </Text>

          <Text style={styles.subtitle}>
            Enter the driver's details
          </Text>

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

            <View style={styles.infoBox}>
              <Ionicons
                name="information-circle-outline"
                size={20}
                color="#6C4AB6"
              />

              <Text style={styles.infoText}>
                The driver will be created with an
                initial password according to your
                backend configuration.
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.button,
                loading && styles.buttonDisabled,
              ]}
              onPress={handleAddDriver}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator
                  color="#FFFFFF"
                />
              ) : (
                <Text style={styles.buttonText}>
                  Add Driver
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
    marginBottom: 30,
  },

  form: {
    gap: 14,
  },

  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#EEE8F8",
    borderRadius: 13,
    padding: 14,
    marginTop: 2,
  },

  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: "#625575",
    marginLeft: 9,
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