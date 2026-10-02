import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

import api from "../../../services/api";
import { getToken } from "../../../services/auth";

interface Delivery {
  id: number;
  consignment_name: string;
  amount: number;
  delivery_address: string;
  status: string;
  scheduled_date: string;
  completed_at?: string | null;
  payment_id?: number | null;
  payment_location?: string | null;
  cash_submitted_to?: string | null;
}

export default function DriverArchiveScreen() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Cash Submit States
  const [submitCashLoading, setSubmitCashLoading] = useState(false);
  const [cashSubmittedToName, setCashSubmittedToName] = useState("");

  const fetchArchive = async () => {
    try {
      const token = await getToken();

      const response = await api.get("/deliveries/my/archive", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setDeliveries(response.data);
    } catch (error: any) {
      console.log("ARCHIVE ERROR:", error.response?.data);

      Alert.alert(
        "Unable to load archive",
        error.response?.data?.detail ??
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchArchive();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchArchive();
  };

  // Find the first delivery that needs a cash handoff name
  const pendingCashDelivery = deliveries.find(
    (d) => d.payment_location === "CASH" && !d.cash_submitted_to
  );

  const handleCashSubmit = async () => {
    if (!cashSubmittedToName.trim() || !pendingCashDelivery?.payment_id) return;

    try {
      setSubmitCashLoading(true);
      const token = await getToken();
      
      await api.patch(
        `/payments/${pendingCashDelivery.payment_id}/submit-cash`,
        { submitted_to: cashSubmittedToName.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setCashSubmittedToName("");
      await fetchArchive(); // Refresh list to dismiss popup or load next pending
    } catch (error) {
      Alert.alert("Error", "Could not submit cash details.");
    } finally {
      setSubmitCashLoading(false);
    }
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

  const renderDelivery = ({ item }: { item: Delivery }) => {
    return (
      <View style={styles.card}>
        <View style={styles.topRow}>
          <View style={styles.iconContainer}>
            <Ionicons
              name="checkmark-circle-outline"
              size={23}
              color="#2E9D5B"
            />
          </View>

          <View style={styles.info}>
            <Text style={styles.name}>{item.consignment_name}</Text>
            <Text style={styles.address}>{item.delivery_address}</Text>
          </View>

          <Text style={styles.amount}>
            ₹{item.amount.toLocaleString("en-IN")}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.bottomRow}>
          <View>
            <Text style={styles.label}>Completed</Text>

            {item.completed_at && (
              <Text style={styles.value}>
                {formatDate(item.completed_at)} ·{" "}
                {formatTime(item.completed_at)}
              </Text>
            )}
          </View>

          <View style={styles.completedBadge}>
            <Text style={styles.completedText}>Completed</Text>
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

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={deliveries}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderDelivery}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6C4AB6"
          />
        }
        contentContainerStyle={
          deliveries.length === 0 ? styles.emptyContent : styles.content
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Archive</Text>
            <Text style={styles.subtitle}>Your completed deliveries</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons name="archive-outline" size={38} color="#6C4AB6" />
            </View>

            <Text style={styles.emptyTitle}>No completed deliveries</Text>
            <Text style={styles.emptyText}>
              Your completed deliveries will appear here.
            </Text>
          </View>
        }
      />

      {/* PERSISTENT CASH HANDOFF MODAL */}
      <Modal visible={!!pendingCashDelivery} animationType="fade" transparent>
        <KeyboardAvoidingView 
            style={styles.modalOverlay} 
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.cashModalContainer}>
            <View style={styles.cashIconWrapper}>
                <Ionicons name="cash-outline" size={32} color="#D88924" />
            </View>
            <Text style={styles.cashModalTitle}>Cash Submission Required</Text>
            <Text style={styles.cashModalSubtitle}>
              You accepted <Text style={{fontWeight: "bold"}}>₹{pendingCashDelivery?.amount.toLocaleString("en-IN")}</Text> in cash for <Text style={{fontWeight: "bold"}}>{pendingCashDelivery?.consignment_name}</Text>. Who are you handing this cash to at the end of the day?
            </Text>

            <TextInput
              style={styles.cashInput}
              placeholder="Enter receiver's name"
              value={cashSubmittedToName}
              onChangeText={setCashSubmittedToName}
            />

            <TouchableOpacity
              style={[styles.submitCashBtn, !cashSubmittedToName.trim() && { opacity: 0.5 }]}
              disabled={!cashSubmittedToName.trim() || submitCashLoading}
              onPress={handleCashSubmit}
            >
              {submitCashLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitCashText}>Submit Cash Details</Text>
              )}
            </TouchableOpacity>
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
  emptyContent: {
    flexGrow: 1,
    padding: 20,
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
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    elevation: 2,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: "#EAF7EF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222222",
  },
  address: {
    fontSize: 13,
    color: "#777777",
    marginTop: 4,
    lineHeight: 18,
  },
  amount: {
    fontSize: 14,
    fontWeight: "700",
    color: "#222222",
  },
  divider: {
    height: 1,
    backgroundColor: "#F0EFF2",
    marginVertical: 14,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: 11,
    color: "#999999",
    marginBottom: 3,
  },
  value: {
    fontSize: 12,
    color: "#555555",
  },
  completedBadge: {
    backgroundColor: "#EAF7EF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  completedText: {
    color: "#2E9D5B",
    fontSize: 11,
    fontWeight: "700",
  },
  emptyCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 250,
  },
  emptyIcon: {
    width: 70,
    height: 70,
    borderRadius: 22,
    backgroundColor: "#EEE8F8",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
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
  
  // Cash Modal Styles
  modalOverlay: {
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
  submitCashBtn: {
    backgroundColor: "#D88924",
    width: "100%",
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