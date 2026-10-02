import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TextInput
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

import api from "../../../services/api";
import { getToken } from "../../../services/auth";
import { useAuth } from "../../../context/AuthContext";

type DeliveryStatus = "SCHEDULED" | "IN_TRANSIT" | "COMPLETED";

type TabType = "DELIVERIES" | "PENDING_CASH";

interface Delivery {
  id: number;
  consignment_name: string;
  amount: number;
  delivery_address: string;
  notes?: string | null;
  driver_id: number;
  created_by: number;
  status: DeliveryStatus;
  scheduled_date: string;
  started_at?: string | null;
  completed_at?: string | null;
  payment_id?: number | null;
  payment_location?: string | null;
  cash_submitted_to?: string | null;
}

export default function DriverHomeScreen() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>("DELIVERIES");

  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [archiveDeliveries, setArchiveDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const [paymentLocation, setPaymentLocation] = useState<
    "BANK_SBI" | "BANK_JNK" | "SHOP_ZIRAKPUR" | "CASH" | null
  >(null);

  const [showCompleteModal, setShowCompleteModal] = useState(false);

  // Dedicated Cash Submission states
  const [showCashModal, setShowCashModal] = useState(false);
  const [cashDeliveryPrompt, setCashDeliveryPrompt] = useState<Delivery | null>(null);
  const [submitCashLoading, setSubmitCashLoading] = useState(false);
  const [cashSubmittedToName, setCashSubmittedToName] = useState("");

  const isToday = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  const isPreviousDay = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    date.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return date.getTime() < today.getTime();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const fetchDeliveries = async () => {
    try {
      const token = await getToken();
      
      // We must fetch the archive too, because COMPLETED deliveries immediately leave the /my endpoint
      const [myRes, archiveRes] = await Promise.all([
        api.get("/deliveries/my", { headers: { Authorization: `Bearer ${token}` } }),
        api.get("/deliveries/my/archive", { headers: { Authorization: `Bearer ${token}` } })
      ]);

      setDeliveries(myRes.data);
      setArchiveDeliveries(archiveRes.data);
    } catch (error: any) {
      Alert.alert(
        "Unable to load deliveries",
        error.response?.data?.detail ?? "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDeliveries();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchDeliveries();
  };

  const currentDelivery = deliveries.find(
    (delivery) => delivery.status === "IN_TRANSIT"
  );

  const scheduledDeliveries = deliveries.filter(
    (delivery) =>
      delivery.status === "SCHEDULED" && isToday(delivery.scheduled_date)
  );

  // ALL completed deliveries pending cash logging (checked against archive)
  const pendingCashDeliveries = archiveDeliveries.filter(
    (d) => d.payment_location === "CASH" && !d.cash_submitted_to
  );

  const handleCashSubmit = async () => {
    if (!cashSubmittedToName.trim() || !cashDeliveryPrompt?.payment_id) return;
    try {
      setSubmitCashLoading(true);
      const token = await getToken();
      
      await api.patch(
        `/payments/${cashDeliveryPrompt.payment_id}/submit-cash`,
        { submitted_to: cashSubmittedToName.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setCashSubmittedToName("");
      setShowCashModal(false);
      setCashDeliveryPrompt(null);
      
      // Update background data to remove it from the list
      await fetchDeliveries(); 
    } catch (error) {
      Alert.alert("Error", "Could not submit cash details.");
    } finally {
      setSubmitCashLoading(false);
    }
  };

  const startDelivery = async (deliveryId: number) => {
    try {
      setActionLoading(deliveryId);
      const token = await getToken();
      await api.patch(
        `/deliveries/${deliveryId}/start`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchDeliveries();
    } catch (error: any) {
      Alert.alert(
        "Unable to start delivery",
        error.response?.data?.detail ?? "Something went wrong. Please try again."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const completeDelivery = async () => {
    if (!currentDelivery || !paymentLocation) return;

    // Save locally before resetting state
    const completedPaymentMode = paymentLocation; 

    try {
      setActionLoading(currentDelivery.id);
      const token = await getToken();
      
      const response = await api.patch(
        `/deliveries/${currentDelivery.id}/complete`,
        { payment_location: paymentLocation },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedDelivery = response.data;

      setShowCompleteModal(false);
      setPaymentLocation(null);
      fetchDeliveries(); // Run background refresh

      // Delay to ensure iOS/Android fully closes the first modal before opening the second
      setTimeout(() => {
        if (completedPaymentMode === "CASH") {
          setCashDeliveryPrompt(updatedDelivery);
          setShowCashModal(true);
        } else {
          Alert.alert("Delivery Completed", "The delivery and payment have been recorded.");
        }
      }, 700);

    } catch (error: any) {
      Alert.alert(
        "Unable to complete delivery",
        error.response?.data?.detail ?? "Something went wrong. Please try again."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const confirmStartDelivery = (delivery: Delivery) => {
    // Constraint: Block starting if there is pending cash from a previous day
    const hasPreviousDayCash = pendingCashDeliveries.some((d) => {
      const referenceDate = d.completed_at || d.scheduled_date;
      return isPreviousDay(referenceDate);
    });

    if (hasPreviousDayCash) {
      Alert.alert(
        "Action Blocked",
        "You have pending cash submissions from previous days. Please switch to the 'Pending Cash' tab to resolve them before starting new deliveries."
      );
      setActiveTab("PENDING_CASH");
      return;
    }

    Alert.alert(
      "Start Delivery",
      `Start delivery for "${delivery.consignment_name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Start", onPress: () => startDelivery(delivery.id) },
      ]
    );
  };

  const renderDeliveryCard = ({ item }: { item: Delivery }) => {
    const isStarting = actionLoading === item.id;

    return (
      <View style={styles.deliveryCard}>
        <View style={styles.deliveryTopRow}>
          <View style={styles.deliveryIcon}>
            <Ionicons name="cube-outline" size={22} color="#6C4AB6" />
          </View>
          <View style={styles.deliveryInfo}>
            <Text style={styles.deliveryName}>{item.consignment_name}</Text>
            <Text style={styles.deliveryAddress}>{item.delivery_address}</Text>
          </View>
          <Text style={styles.deliveryAmount}>
            ₹{item.amount.toLocaleString("en-IN")}
          </Text>
        </View>

        <View style={styles.deliveryBottomRow}>
          <View style={styles.timeContainer}>
            <Ionicons name="time-outline" size={16} color="#777" />
            <Text style={styles.timeText}>{formatTime(item.scheduled_date)}</Text>
          </View>

          <TouchableOpacity
            style={styles.startButton}
            onPress={() => confirmStartDelivery(item)}
            disabled={isStarting}
          >
            {isStarting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.startButtonText}>Start</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderPendingCashCard = ({ item }: { item: Delivery }) => (
    <View style={styles.pendingCashCard}>
      <View style={styles.pendingCashInfo}>
        <Text style={styles.pendingCashName}>{item.consignment_name}</Text>
        <Text style={styles.pendingCashAmount}>
          ₹{item.amount.toLocaleString("en-IN")}
        </Text>
        <Text style={styles.pendingCashDate}>
          Completed: {formatDate(item.completed_at || item.scheduled_date)}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.pendingCashButton}
        onPress={() => {
          setCashDeliveryPrompt(item);
          setShowCashModal(true);
        }}
      >
        <Text style={styles.pendingCashButtonText}>Submit Cash</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6C4AB6" />
        </View>
      </SafeAreaView>
    );
  }

  const isDeliveriesTab = activeTab === "DELIVERIES";

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={isDeliveriesTab ? scheduledDeliveries : pendingCashDeliveries}
        keyExtractor={(item) => item.id.toString()}
        renderItem={isDeliveriesTab ? renderDeliveryCard : renderPendingCashCard}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6C4AB6" />
        }
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <View>
                <Text style={styles.greeting}>Hello, {user?.name}</Text>
                <Text style={styles.subtitle}>Here is your dashboard.</Text>
              </View>
              <View style={styles.profileIcon}>
                <Ionicons name="person-outline" size={22} color="#6C4AB6" />
              </View>
            </View>

            {/* TAB SWITCHER */}
            <View style={styles.tabWrapper}>
              <TouchableOpacity
                style={[styles.tabButton, activeTab === "DELIVERIES" && styles.tabButtonActive]}
                onPress={() => setActiveTab("DELIVERIES")}
              >
                <Text style={[styles.tabText, activeTab === "DELIVERIES" && styles.tabTextActive]}>
                  Today's Deliveries
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabButton, activeTab === "PENDING_CASH" && styles.tabButtonActive]}
                onPress={() => setActiveTab("PENDING_CASH")}
              >
                <Text style={[styles.tabText, activeTab === "PENDING_CASH" && styles.tabTextActive]}>
                  Pending Cash {pendingCashDeliveries.length > 0 ? `(${pendingCashDeliveries.length})` : ''}
                </Text>
                {pendingCashDeliveries.length > 0 && activeTab !== "PENDING_CASH" && (
                  <View style={styles.badgeDot} />
                )}
              </TouchableOpacity>
            </View>

            {/* CONTENT HEADERS */}
            {isDeliveriesTab ? (
              <>
                {currentDelivery && (
                  <View style={styles.currentSection}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>Current Delivery</Text>
                      <View style={styles.activeBadge}>
                        <View style={styles.activeDot} />
                        <Text style={styles.activeText}>In Transit</Text>
                      </View>
                    </View>

                    <View style={styles.currentCard}>
                      <View style={styles.currentIcon}>
                        <Ionicons name="navigate-outline" size={28} color="#FFFFFF" />
                      </View>
                      <Text style={styles.currentName}>{currentDelivery.consignment_name}</Text>
                      <Text style={styles.currentAddress}>{currentDelivery.delivery_address}</Text>
                      <View style={styles.currentDetails}>
                        <View>
                          <Text style={styles.detailLabel}>Amount</Text>
                          <Text style={styles.detailValue}>₹{currentDelivery.amount.toLocaleString("en-IN")}</Text>
                        </View>
                        <View>
                          <Text style={styles.detailLabel}>Started</Text>
                          <Text style={styles.detailValue}>
                            {currentDelivery.started_at ? formatTime(currentDelivery.started_at) : "--"}
                          </Text>
                        </View>
                      </View>

                      <TouchableOpacity style={styles.completeButton} onPress={() => setShowCompleteModal(true)}>
                        <Ionicons name="checkmark-circle-outline" size={19} color="#FFFFFF" />
                        <Text style={styles.completeButtonText}>Complete Delivery</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                <View style={styles.listHeader}>
                  <Text style={styles.sectionTitle}>Scheduled Deliveries</Text>
                  <Text style={styles.deliveryCount}>{scheduledDeliveries.length}</Text>
                </View>
              </>
            ) : (
              <View style={styles.listHeader}>
                <Text style={styles.sectionTitle}>Action Required</Text>
                <Text style={styles.deliveryCount}>{pendingCashDeliveries.length}</Text>
              </View>
            )}
          </>
        }
        ListEmptyComponent={
          isDeliveriesTab ? (
            !currentDelivery ? (
              <View style={styles.emptyCard}>
                <Ionicons name="checkmark-circle-outline" size={42} color="#6C4AB6" />
                <Text style={styles.emptyTitle}>No deliveries scheduled</Text>
                <Text style={styles.emptyText}>You're all caught up for now.</Text>
              </View>
            ) : null
          ) : (
            <View style={styles.emptyCard}>
              <Ionicons name="checkmark-done-circle-outline" size={42} color="#2E9D5B" />
              <Text style={styles.emptyTitle}>All caught up!</Text>
              <Text style={styles.emptyText}>You have no pending cash submissions.</Text>
            </View>
          )
        }
        ListFooterComponent={
          (isDeliveriesTab && scheduledDeliveries.length > 0) || (!isDeliveriesTab && pendingCashDeliveries.length > 0) 
            ? <View style={styles.footerSpace} /> 
            : null
        }
      />

      {/* COMPLETE DELIVERY PAYMENT MODAL */}
      {showCompleteModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Complete Delivery</Text>
            <Text style={styles.modalSubtitle}>Where was the payment received?</Text>

            <View style={styles.paymentOptions}>
              <TouchableOpacity
                style={[styles.paymentOption, paymentLocation === "SHOP_ZIRAKPUR" && styles.paymentOptionSelected]}
                onPress={() => setPaymentLocation("SHOP_ZIRAKPUR")}
              >
                <Ionicons name="business-outline" size={22} color={paymentLocation === "SHOP_ZIRAKPUR" ? "#6C4AB6" : "#777777"} />
                <Text style={[styles.paymentOptionText, paymentLocation === "SHOP_ZIRAKPUR" && styles.paymentOptionTextSelected]}>
                  Zirakpur Shop
                </Text>
                {paymentLocation === "SHOP_ZIRAKPUR" && <Ionicons name="checkmark-circle" size={21} color="#6C4AB6" />}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.paymentOption, paymentLocation === "CASH" && styles.paymentOptionSelected]}
                onPress={() => setPaymentLocation("CASH")}
              >
                <Ionicons name="cash-outline" size={22} color={paymentLocation === "CASH" ? "#6C4AB6" : "#777777"} />
                <Text style={[styles.paymentOptionText, paymentLocation === "CASH" && styles.paymentOptionTextSelected]}>
                  Cash in Hand
                </Text>
                {paymentLocation === "CASH" && <Ionicons name="checkmark-circle" size={21} color="#6C4AB6" />}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.paymentOption, paymentLocation === "BANK_SBI" && styles.paymentOptionSelected]}
                onPress={() => setPaymentLocation("BANK_SBI")}
              >
                <Ionicons name="card-outline" size={22} color={paymentLocation === "BANK_SBI" ? "#6C4AB6" : "#777777"} />
                <Text style={[styles.paymentOptionText, paymentLocation === "BANK_SBI" && styles.paymentOptionTextSelected]}>
                  SBI Bank
                </Text>
                {paymentLocation === "BANK_SBI" && <Ionicons name="checkmark-circle" size={21} color="#6C4AB6" />}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.paymentOption, paymentLocation === "BANK_JNK" && styles.paymentOptionSelected]}
                onPress={() => setPaymentLocation("BANK_JNK")}
              >
                <Ionicons name="card-outline" size={22} color={paymentLocation === "BANK_JNK" ? "#6C4AB6" : "#777777"} />
                <Text style={[styles.paymentOptionText, paymentLocation === "BANK_JNK" && styles.paymentOptionTextSelected]}>
                  J&K Bank
                </Text>
                {paymentLocation === "BANK_JNK" && <Ionicons name="checkmark-circle" size={21} color="#6C4AB6" />}
              </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowCompleteModal(false);
                  setPaymentLocation(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmButton, !paymentLocation && styles.confirmButtonDisabled]}
                disabled={!paymentLocation || actionLoading !== null}
                onPress={completeDelivery}
              >
                {actionLoading === currentDelivery?.id ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.confirmButtonText}>Confirm</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* SEQUENTIAL CASH SUBMISSION POPUP */}
      <Modal visible={showCashModal && cashDeliveryPrompt !== null} animationType="fade" transparent>
        <KeyboardAvoidingView 
            style={styles.cashModalOverlay} 
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.cashModalContainer}>
            <View style={styles.cashIconWrapper}>
                <Ionicons name="cash-outline" size={32} color="#D88924" />
            </View>
            <Text style={styles.cashModalTitle}>Cash Submission</Text>
            <Text style={styles.cashModalSubtitle}>
              You accepted <Text style={{fontWeight: "bold"}}>₹{cashDeliveryPrompt?.amount?.toLocaleString("en-IN")}</Text> in cash for <Text style={{fontWeight: "bold"}}>{cashDeliveryPrompt?.consignment_name}</Text>. Who are you handing this cash to?
            </Text>

            <TextInput
              style={styles.cashInput}
              placeholder="Enter receiver's name"
              value={cashSubmittedToName}
              onChangeText={setCashSubmittedToName}
            />

            <View style={styles.cashModalActions}>
              <TouchableOpacity 
                style={styles.laterCashBtn} 
                onPress={() => {
                  setShowCashModal(false);
                  setCashDeliveryPrompt(null);
                  setCashSubmittedToName("");
                }}
                disabled={submitCashLoading}
              >
                <Text style={styles.laterCashText}>I'll do this later</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitCashBtn, !cashSubmittedToName.trim() && { opacity: 0.5 }]}
                disabled={!cashSubmittedToName.trim() || submitCashLoading}
                onPress={handleCashSubmit}
              >
                {submitCashLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.submitCashText}>Submit</Text>
                )}
              </TouchableOpacity>
            </View>
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
    marginBottom: 20,
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

  // TABS
  tabWrapper: {
    flexDirection: "row",
    backgroundColor: "#EEE8F8",
    borderRadius: 12,
    padding: 4,
    marginBottom: 25,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row"
  },
  tabButtonActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6C4AB6",
    opacity: 0.6
  },
  tabTextActive: {
    opacity: 1,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#D64545",
    marginLeft: 6,
    marginTop: -8,
  },

  // CASH CARDS
  pendingCashCard: {
    backgroundColor: "#FFF4E5",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F2DAB5",
    flexDirection: "row",
    alignItems: "center",
  },
  pendingCashInfo: {
    flex: 1,
  },
  pendingCashName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#8A5A18",
  },
  pendingCashAmount: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8A5A18",
    marginTop: 3,
  },
  pendingCashDate: {
    fontSize: 11,
    color: "#A67B38",
    marginTop: 5,
  },
  pendingCashButton: {
    backgroundColor: "#D88924",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginLeft: 12,
  },
  pendingCashButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },

  currentSection: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222222",
  },
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E9F7EF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#2E9D5B",
    marginRight: 6,
  },
  activeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2E9D5B",
  },
  currentCard: {
    backgroundColor: "#6C4AB6",
    borderRadius: 20,
    padding: 20,
  },
  currentIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  currentName: {
    fontSize: 21,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  currentAddress: {
    fontSize: 14,
    color: "#E9E2F5",
    marginTop: 6,
    lineHeight: 20,
  },
  currentDetails: {
    flexDirection: "row",
    gap: 45,
    marginTop: 22,
    marginBottom: 18,
  },
  detailLabel: {
    fontSize: 12,
    color: "#D8CDEB",
    marginBottom: 3,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  deliveryCount: {
    marginLeft: 8,
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#EEE8F8",
    color: "#6C4AB6",
    textAlign: "center",
    lineHeight: 24,
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
  deliveryTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  deliveryIcon: {
    width: 42,
    height: 42,
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
  deliveryAmount: {
    fontSize: 14,
    fontWeight: "700",
    color: "#222222",
  },
  deliveryBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#F0EFF2",
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeText: {
    fontSize: 13,
    color: "#777777",
    marginLeft: 6,
  },
  startButton: {
    backgroundColor: "#6C4AB6",
    paddingHorizontal: 20,
    height: 38,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 76,
  },
  startButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 30,
    alignItems: "center",
    marginTop: 5,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333333",
    marginTop: 12,
  },
  emptyText: {
    fontSize: 13,
    color: "#888888",
    marginTop: 5,
  },
  footerSpace: {
    height: 20,
  },
  completeButton: {
    height: 46,
    borderRadius: 12,
    backgroundColor: "#2E9D5B",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  completeButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 8,
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 30,
  },
  modalTitle: {
    fontSize: 21,
    fontWeight: "700",
    color: "#222222",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#777777",
    marginTop: 5,
    marginBottom: 20,
  },
  paymentOptions: {
    gap: 10,
  },
  paymentOption: {
    height: 58,
    borderWidth: 1,
    borderColor: "#E5E3E8",
    borderRadius: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  paymentOptionSelected: {
    borderColor: "#6C4AB6",
    backgroundColor: "#F5F1FA",
  },
  paymentOptionText: {
    flex: 1,
    fontSize: 15,
    color: "#555555",
    marginLeft: 12,
  },
  paymentOptionTextSelected: {
    color: "#6C4AB6",
    fontWeight: "600",
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 22,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#F1F0F3",
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#555555",
    fontSize: 14,
    fontWeight: "600",
  },
  confirmButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#6C4AB6",
    justifyContent: "center",
    alignItems: "center",
  },
  confirmButtonDisabled: {
    backgroundColor: "#BEB7C9",
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  cashModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  cashModalContainer: {
    backgroundColor: "#FFFFFF",
    width: "100%",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  cashIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FFF4E5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  cashModalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222",
    marginBottom: 8,
  },
  cashModalSubtitle: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  cashInput: {
    width: "100%",
    height: 52,
    borderWidth: 1,
    borderColor: "#E5E3E8",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    backgroundColor: "#F8F7FA",
    marginBottom: 20,
  },
  cashModalActions: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  laterCashBtn: {
    flex: 1,
    backgroundColor: "#F1F0F3",
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  laterCashText: {
    color: "#555555",
    fontSize: 15,
    fontWeight: "600",
  },
  submitCashBtn: {
    flex: 1,
    backgroundColor: "#D88924",
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  submitCashText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});