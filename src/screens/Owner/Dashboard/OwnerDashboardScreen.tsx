import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
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
import { getToken } from "../../../services/auth";
import { useAuth } from "../../../context/AuthContext";

interface Delivery {
  id: number;
  consignment_name: string;
  delivery_address: string;
  amount: number;
  driver_id: number | null;
  status: "SCHEDULED" | "IN_TRANSIT" | "COMPLETED";
  scheduled_date: string;
}

interface Driver {
  id: number;
  name: string;
  phone: string;
  email: string;
  vehicle_number: string;
  is_active: boolean;
}

interface DashboardData {
  total_today: number;
  scheduled_today: number;
  in_transit_today: number;
  completed_today: number;
  deliveries: Delivery[];
}

export default function OwnerDashboardScreen({ navigation }: any) {
  const { user } = useAuth();

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Schedule Delivery
  const [scheduleVisible, setScheduleVisible] = useState(false);
  const [consignmentName, setConsignmentName] = useState("");
  const [amount, setAmount] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [driverId, setDriverId] = useState<number | null>(null);

  const getCurrentDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  const [scheduledDate, setScheduledDate] = useState(getCurrentDateTime());
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [scheduleLoading, setScheduleLoading] = useState(false);

  // Add Owner
  const [ownerVisible, setOwnerVisible] = useState(false);
  const [ownerName, setOwnerName] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerLoading, setOwnerLoading] = useState(false);

  // Assign Driver Later
  const [assignVisible, setAssignVisible] = useState(false);
  const [assignDeliveryId, setAssignDeliveryId] = useState<number | null>(null);
  const [assignDriverId, setAssignDriverId] = useState<number | null>(null);
  const [assignLoading, setAssignLoading] = useState(false);

  const fetchDashboard = async () => {
    try {
      const token = await getToken();
      const response = await api.get("/dashboard/owner", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDashboard(response.data);
    } catch (error: any) {
      Alert.alert(
        "Unable to load dashboard",
        error.response?.data?.detail ?? "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDashboard();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  const fetchDrivers = async () => {
    try {
      setLoadingDrivers(true);
      const token = await getToken();
      const response = await api.get("/users/drivers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDrivers(response.data.filter((driver: Driver) => driver.is_active));
    } catch (error: any) {
      Alert.alert("Unable to load drivers", "Something went wrong.");
    } finally {
      setLoadingDrivers(false);
    }
  };

  const openScheduleDelivery = async () => {
    setScheduledDate(getCurrentDateTime());
    setAddressSuggestions([]);
    setScheduleVisible(true);
    if (drivers.length === 0) await fetchDrivers();
  };

  const fetchAddressSuggestions = async (text: string) => {
    setDeliveryAddress(text);
    if (!text.trim()) {
      setAddressSuggestions([]);
      return;
    }
    try {
      setLoadingAddresses(true);
      const token = await getToken();
      const response = await api.get("/deliveries/addresses", {
        params: { query: text.trim() },
        headers: { Authorization: `Bearer ${token}` },
      });
      setAddressSuggestions(response.data);
    } catch (error: any) {
      setAddressSuggestions([]);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handleScheduleDelivery = async () => {
    if (!consignmentName.trim()) {
      Alert.alert("Required", "Enter the consignment name.");
      return;
    }
    if (!amount.trim() || isNaN(Number(amount))) {
      Alert.alert("Invalid amount", "Enter a valid delivery amount.");
      return;
    }
    if (!deliveryAddress.trim()) {
      Alert.alert("Required", "Enter the delivery address.");
      return;
    }
    if (!scheduledDate.trim()) {
      Alert.alert("Required", "Enter the scheduled date and time.");
      return;
    }

    const dateTimeMatch = scheduledDate
      .trim()
      .match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{1,2}):(\d{2})$/);
    let parsedDate: Date;

    if (dateTimeMatch) {
      const [, year, month, day, hours, minutes] = dateTimeMatch;
      parsedDate = new Date(Number(year), Number(month) - 1, Number(day), Number(hours), Number(minutes));
    } else {
      parsedDate = new Date(scheduledDate.trim());
    }

    if (isNaN(parsedDate.getTime()) || parsedDate.getFullYear() < 2000) {
      Alert.alert("Invalid date", "Use YYYY-MM-DD HH:MM or enter a valid date and time.");
      return;
    }

    try {
      setScheduleLoading(true);
      const token = await getToken();
      await api.post(
        "/deliveries",
        {
          consignment_name: consignmentName.trim(),
          amount: Number(amount),
          delivery_address: deliveryAddress.trim(),
          notes: notes.trim() || null,
          driver_id: driverId, // Works even if it is null now
          scheduled_date: parsedDate.toISOString(),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setConsignmentName("");
      setAmount("");
      setDeliveryAddress("");
      setAddressSuggestions([]);
      setNotes("");
      setDriverId(null);
      setScheduledDate(getCurrentDateTime());
      setScheduleVisible(false);
      await fetchDashboard();
      Alert.alert("Delivery Scheduled", "The delivery has been scheduled successfully.");
    } catch (error: any) {
      Alert.alert(
        "Unable to schedule delivery",
        error.response?.data?.detail ?? "Something went wrong. Please try again."
      );
    } finally {
      setScheduleLoading(false);
    }
  };

  const handleAddOwner = async () => {
    if (!ownerName.trim()) {
      Alert.alert("Required", "Enter the owner's name.");
      return;
    }
    if (!/^[0-9]{10}$/.test(ownerPhone.trim())) {
      Alert.alert("Invalid phone", "Enter a valid 10-digit mobile number.");
      return;
    }
    if (!ownerEmail.trim()) {
      Alert.alert("Required", "Enter the owner's email.");
      return;
    }

    try {
      setOwnerLoading(true);
      const token = await getToken();
      await api.post(
        "/users/owners",
        { name: ownerName.trim(), phone: ownerPhone.trim(), email: ownerEmail.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOwnerName("");
      setOwnerPhone("");
      setOwnerEmail("");
      setOwnerVisible(false);
      Alert.alert("Owner Added", "The owner has been added successfully.");
    } catch (error: any) {
      Alert.alert(
        "Unable to add owner",
        error.response?.data?.detail ?? "Something went wrong. Please try again."
      );
    } finally {
      setOwnerLoading(false);
    }
  };

  // Assign Driver Flow
  const openAssignModal = async (deliveryId: number) => {
    setAssignDeliveryId(deliveryId);
    setAssignDriverId(null);
    setAssignVisible(true);
    if (drivers.length === 0) {
      await fetchDrivers();
    }
  };

  const handleAssignSubmit = async () => {
    if (!assignDriverId || !assignDeliveryId) {
      Alert.alert("Required", "Select a driver first.");
      return;
    }
    try {
      setAssignLoading(true);
      const token = await getToken();
      await api.patch(
        `/deliveries/${assignDeliveryId}/assign-driver`,
        { driver_id: assignDriverId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAssignVisible(false);
      await fetchDashboard();
      Alert.alert("Driver Assigned", "The delivery has been assigned successfully.");
    } catch (error) {
      Alert.alert("Error", "Could not assign driver.");
    } finally {
      setAssignLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "IN_TRANSIT": return "#2E9D5B";
      case "COMPLETED": return "#6C4AB6";
      default: return "#D88924";
    }
  };

  const getStatusBackground = (status: string) => {
    switch (status) {
      case "IN_TRANSIT": return "#EAF7EF";
      case "COMPLETED": return "#EEE8F8";
      default: return "#FFF4E5";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "IN_TRANSIT": return "In Transit";
      case "COMPLETED": return "Completed";
      default: return "Scheduled";
    }
  };

  const renderDelivery = ({ item }: { item: Delivery }) => {
    const statusColor = getStatusColor(item.status);
    const statusBackground = getStatusBackground(item.status);

    return (
      <View style={styles.deliveryCard}>
        <View style={styles.deliveryRow}>
          <View style={styles.iconContainer}>
            <Ionicons name="cube-outline" size={22} color="#6C4AB6" />
          </View>
          <View style={styles.deliveryInfo}>
            <Text style={styles.deliveryName}>{item.consignment_name}</Text>
            <Text style={styles.deliveryAddress}>{item.delivery_address}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusBackground }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>{getStatusLabel(item.status)}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailsRow}>
          <View style={styles.detail}>
            <Text style={styles.detailLabel}>Amount</Text>
            <Text style={styles.detailValue}>₹{item.amount.toLocaleString("en-IN")}</Text>
          </View>
          <View style={styles.detail}>
            <Text style={styles.detailLabel}>Time</Text>
            <Text style={styles.detailValue}>{formatTime(item.scheduled_date)}</Text>
          </View>
          <View style={styles.detail}>
            <Text style={styles.detailLabel}>Driver</Text>
            {item.driver_id ? (
              <Text style={styles.detailValue}>#{item.driver_id}</Text>
            ) : (
              <TouchableOpacity onPress={() => openAssignModal(item.id)}>
                <Text style={{ color: "#D88924", fontWeight: "700", fontSize: 13 }}>+ Assign</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6C4AB6" />
        </View>
      </SafeAreaView>
    );
  }

  const data = dashboard ?? {
    total_today: 0,
    scheduled_today: 0,
    in_transit_today: 0,
    completed_today: 0,
    deliveries: [],
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={data.deliveries}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderDelivery}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6C4AB6" />}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View>
            {/* HEADER */}
            <View style={styles.header}>
              <View>
                <Text style={styles.greeting}>Hello, {user?.name}</Text>
                <Text style={styles.subtitle}>Here's what's happening today.</Text>
              </View>
              <View style={styles.profileIcon}>
                <Ionicons name="person-outline" size={22} color="#6C4AB6" />
              </View>
            </View>

            {/* MAIN SUMMARY */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryIcon}>
                <Ionicons name="cube-outline" size={26} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.summaryLabel}>Today's Deliveries</Text>
                <Text style={styles.summaryNumber}>{data.total_today}</Text>
              </View>
            </View>

            {/* STATS */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: "#FFF4E5" }]}>
                  <Ionicons name="time-outline" size={20} color="#D88924" />
                </View>
                <Text style={styles.statNumber}>{data.scheduled_today}</Text>
                <Text style={styles.statLabel}>Scheduled</Text>
              </View>
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: "#EAF7EF" }]}>
                  <Ionicons name="navigate-outline" size={20} color="#2E9D5B" />
                </View>
                <Text style={styles.statNumber}>{data.in_transit_today}</Text>
                <Text style={styles.statLabel}>In Transit</Text>
              </View>
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: "#EEE8F8" }]}>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#6C4AB6" />
                </View>
                <Text style={styles.statNumber}>{data.completed_today}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
            </View>

            {/* QUICK ACTIONS */}
            <View style={styles.actionsSection}>
              <Text style={styles.actionsTitle}>Quick Actions</Text>

              <TouchableOpacity style={styles.scheduleButton} onPress={openScheduleDelivery}>
                <View style={styles.actionIconPurple}>
                  <Ionicons name="calendar-outline" size={22} color="#6C4AB6" />
                </View>
                <View style={styles.actionTextContainer}>
                  <Text style={styles.scheduleTitle}>Schedule Delivery</Text>
                  <Text style={styles.actionSubtitle}>Assign a delivery to a driver</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999999" />
              </TouchableOpacity>

              <View style={styles.smallActionsRow}>
                <TouchableOpacity style={styles.smallAction} onPress={() => navigation.navigate("AddDriver")}>
                  <View style={styles.actionIconPurple}>
                    <Ionicons name="person-add-outline" size={21} color="#6C4AB6" />
                  </View>
                  <Text style={styles.smallActionText}>Add Driver</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.smallAction} onPress={() => setOwnerVisible(true)}>
                  <View style={styles.actionIconPurple}>
                    <Ionicons name="people-outline" size={21} color="#6C4AB6" />
                  </View>
                  <Text style={styles.smallActionText}>Add Owner</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* TODAY'S DELIVERIES */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Today's Deliveries</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{data.total_today}</Text>
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons name="checkmark-circle-outline" size={40} color="#6C4AB6" />
            </View>
            <Text style={styles.emptyTitle}>No deliveries today</Text>
            <Text style={styles.emptyText}>There are no deliveries scheduled for today.</Text>
          </View>
        }
      />

      {/* ================================= */}
      {/* SCHEDULE DELIVERY MODAL           */}
      {/* ================================= */}
      <Modal visible={scheduleVisible} animationType="slide" transparent onRequestClose={() => setScheduleVisible(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={styles.modalContainer}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Schedule Delivery</Text>
                  <Text style={styles.modalSubtitle}>Assign a new delivery</Text>
                </View>
                <TouchableOpacity style={styles.closeButton} onPress={() => setScheduleVisible(false)}>
                  <Ionicons name="close" size={22} color="#333333" />
                </TouchableOpacity>
              </View>

              <CustomInput icon="cube-outline" placeholder="Consignment Name" value={consignmentName} onChangeText={setConsignmentName} />
              <CustomInput icon="cash-outline" placeholder="Amount" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} />
              
              <View style={styles.addressContainer}>
                <CustomInput icon="location-outline" placeholder="Delivery Address" value={deliveryAddress} onChangeText={fetchAddressSuggestions} />
                {addressSuggestions.length > 0 && (
                  <View style={styles.addressSuggestionsContainer}>
                    <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator style={styles.addressSuggestionsScroll}>
                      {addressSuggestions.map((address, index) => (
                        <TouchableOpacity
                          key={`${address}-${index}`}
                          style={styles.addressSuggestion}
                          onPress={() => {
                            setDeliveryAddress(address);
                            setAddressSuggestions([]);
                          }}
                        >
                          <Ionicons name="location-outline" size={18} color="#6C4AB6" />
                          <Text style={styles.addressSuggestionText}>{address}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              <Text style={styles.fieldLabel}>Select Driver (Optional)</Text>
              {loadingDrivers ? (
                <View style={styles.driverLoading}>
                  <ActivityIndicator color="#6C4AB6" />
                  <Text style={styles.driverLoadingText}>Loading drivers...</Text>
                </View>
              ) : drivers.length === 0 ? (
                <View style={styles.noDrivers}>
                  <Text style={styles.noDriversText}>No active drivers available.</Text>
                </View>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.driverScroll} contentContainerStyle={styles.driverScrollContent}>
                  {drivers.map((driver) => {
                    const selected = driverId === driver.id;
                    return (
                      <TouchableOpacity key={driver.id} style={[styles.driverOption, selected && styles.driverOptionSelected]} onPress={() => setDriverId(driver.id)}>
                        <View style={[styles.driverAvatar, selected && styles.driverAvatarSelected]}>
                          <Text style={[styles.driverAvatarText, selected && styles.driverAvatarTextSelected]}>{driver.name.charAt(0).toUpperCase()}</Text>
                        </View>
                        <Text style={[styles.driverOptionName, selected && styles.driverOptionNameSelected]} numberOfLines={1}>{driver.name}</Text>
                        <Text style={[styles.driverVehicle, selected && styles.driverVehicleSelected]}>{driver.vehicle_number}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}

              <CustomInput icon="calendar-outline" placeholder="Date & Time" value={scheduledDate} onChangeText={setScheduledDate} />
              <Text style={styles.dateHint}>Defaults to the current date and time. You can change it if needed using YYYY-MM-DD HH:MM.</Text>
              <CustomInput icon="document-text-outline" placeholder="Notes (optional)" value={notes} onChangeText={setNotes} />

              <TouchableOpacity style={[styles.modalPrimaryButton, scheduleLoading && styles.buttonDisabled]} onPress={handleScheduleDelivery} disabled={scheduleLoading}>
                {scheduleLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.modalPrimaryText}>Schedule Delivery</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ================================= */}
      {/* ASSIGN DRIVER LATER MODAL         */}
      {/* ================================= */}
      <Modal visible={assignVisible} animationType="slide" transparent onRequestClose={() => setAssignVisible(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={styles.modalContainer}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Assign Driver</Text>
                  <Text style={styles.modalSubtitle}>Select a driver for this delivery</Text>
                </View>
                <TouchableOpacity style={styles.closeButton} onPress={() => setAssignVisible(false)}>
                  <Ionicons name="close" size={22} color="#333333" />
                </TouchableOpacity>
              </View>

              <Text style={styles.fieldLabel}>Select Driver</Text>
              {loadingDrivers ? (
                <View style={styles.driverLoading}>
                  <ActivityIndicator color="#6C4AB6" />
                  <Text style={styles.driverLoadingText}>Loading drivers...</Text>
                </View>
              ) : drivers.length === 0 ? (
                <View style={styles.noDrivers}>
                  <Text style={styles.noDriversText}>No active drivers available.</Text>
                </View>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.driverScroll} contentContainerStyle={styles.driverScrollContent}>
                  {drivers.map((driver) => {
                    const selected = assignDriverId === driver.id;
                    return (
                      <TouchableOpacity key={driver.id} style={[styles.driverOption, selected && styles.driverOptionSelected]} onPress={() => setAssignDriverId(driver.id)}>
                        <View style={[styles.driverAvatar, selected && styles.driverAvatarSelected]}>
                          <Text style={[styles.driverAvatarText, selected && styles.driverAvatarTextSelected]}>{driver.name.charAt(0).toUpperCase()}</Text>
                        </View>
                        <Text style={[styles.driverOptionName, selected && styles.driverOptionNameSelected]} numberOfLines={1}>{driver.name}</Text>
                        <Text style={[styles.driverVehicle, selected && styles.driverVehicleSelected]}>{driver.vehicle_number}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}

              <TouchableOpacity style={[styles.modalPrimaryButton, assignLoading && styles.buttonDisabled]} onPress={handleAssignSubmit} disabled={assignLoading}>
                {assignLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.modalPrimaryText}>Confirm Assignment</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ================================= */}
      {/* ADD OWNER MODAL                   */}
      {/* ================================= */}
      <Modal visible={ownerVisible} animationType="slide" transparent onRequestClose={() => setOwnerVisible(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={styles.modalContainer}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Add Owner</Text>
                  <Text style={styles.modalSubtitle}>Create another owner account</Text>
                </View>
                <TouchableOpacity style={styles.closeButton} onPress={() => setOwnerVisible(false)}>
                  <Ionicons name="close" size={22} color="#333333" />
                </TouchableOpacity>
              </View>

              <CustomInput icon="person-outline" placeholder="Full Name" value={ownerName} onChangeText={setOwnerName} />
              <CustomInput icon="call-outline" placeholder="Mobile Number" keyboardType="phone-pad" value={ownerPhone} onChangeText={setOwnerPhone} />
              <CustomInput icon="mail-outline" placeholder="Email Address" keyboardType="email-address" autoCapitalize="none" value={ownerEmail} onChangeText={setOwnerEmail} />

              <TouchableOpacity style={[styles.modalPrimaryButton, ownerLoading && styles.buttonDisabled]} onPress={handleAddOwner} disabled={ownerLoading}>
                {ownerLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.modalPrimaryText}>Add Owner</Text>}
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
    paddingBottom: 30,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "700",
    color: "#222222",
  },
  subtitle: {
    fontSize: 14,
    color: "#777777",
    marginTop: 5,
  },
  profileIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#EEE8F8",
    justifyContent: "center",
    alignItems: "center",
  },
  summaryCard: {
    backgroundColor: "#6C4AB6",
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  summaryIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  summaryLabel: {
    color: "#E8E0F2",
    fontSize: 13,
  },
  summaryNumber: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "700",
    marginTop: 2,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 25,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 12,
    alignItems: "center",
  },
  statIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 7,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222222",
  },
  statLabel: {
    fontSize: 10,
    color: "#888888",
    marginTop: 2,
  },
  actionsSection: {
    marginBottom: 25,
  },
  actionsTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 12,
  },
  scheduleButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  actionIconPurple: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: "#EEE8F8",
    justifyContent: "center",
    alignItems: "center",
  },
  actionTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  scheduleTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#222222",
  },
  actionSubtitle: {
    fontSize: 11,
    color: "#888888",
    marginTop: 3,
  },
  smallActionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  smallAction: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  smallActionText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: "#333333",
    marginLeft: 9,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222222",
  },
  countBadge: {
    marginLeft: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#EEE8F8",
    justifyContent: "center",
    alignItems: "center",
  },
  countText: {
    color: "#6C4AB6",
    fontSize: 12,
    fontWeight: "700",
  },
  deliveryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  deliveryRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: "#EEE8F8",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  deliveryInfo: {
    flex: 1,
  },
  deliveryName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222222",
  },
  deliveryAddress: {
    fontSize: 13,
    color: "#777777",
    marginTop: 4,
    lineHeight: 18,
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
    fontSize: 10,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#F0EFF2",
    marginVertical: 14,
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detail: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: "#999999",
    marginBottom: 3,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333333",
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 30,
    alignItems: "center",
    marginTop: 5,
  },
  emptyIcon: {
    width: 70,
    height: 70,
    borderRadius: 22,
    backgroundColor: "#EEE8F8",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#333333",
  },
  emptyText: {
    fontSize: 13,
    color: "#888888",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 19,
  },
  addressContainer: {
    position: "relative",
    zIndex: 20,
  },
  addressSuggestionsContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    marginTop: -6,
    marginBottom: 2,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#EEEEEE",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  addressSuggestionsScroll: {
    maxHeight: 180,
  },
  addressSuggestion: {
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F0F2",
  },
  addressSuggestionText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    color: "#444444",
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  modalContainer: {
    backgroundColor: "#F8F7FA",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    maxHeight: "92%",
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
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#555555",
    marginTop: 2,
  },
  driverLoading: {
    height: 60,
    backgroundColor: "#FFFFFF",
    borderRadius: 13,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  driverLoadingText: {
    fontSize: 12,
    color: "#888888",
    marginLeft: 8,
  },
  noDrivers: {
    backgroundColor: "#FDEEEE",
    borderRadius: 13,
    padding: 14,
  },
  noDriversText: {
    fontSize: 12,
    color: "#D64545",
    textAlign: "center",
  },
  driverScroll: {
    marginHorizontal: -20,
  },
  driverScrollContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  driverOption: {
    width: 115,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 11,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },
  driverOptionSelected: {
    backgroundColor: "#EEE8F8",
    borderColor: "#6C4AB6",
  },
  driverAvatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#F0EFF2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  driverAvatarSelected: {
    backgroundColor: "#6C4AB6",
  },
  driverAvatarText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#666666",
  },
  driverAvatarTextSelected: {
    color: "#FFFFFF",
  },
  driverOptionName: {
    fontSize: 11,
    fontWeight: "700",
    color: "#333333",
  },
  driverOptionNameSelected: {
    color: "#6C4AB6",
  },
  driverVehicle: {
    fontSize: 9,
    color: "#999999",
    marginTop: 3,
  },
  driverVehicleSelected: {
    color: "#6C4AB6",
  },
  dateHint: {
    fontSize: 10,
    color: "#999999",
    marginTop: -7,
  },
  modalPrimaryButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: "#6C4AB6",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },
  modalPrimaryText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});