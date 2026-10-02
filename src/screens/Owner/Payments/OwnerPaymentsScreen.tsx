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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

import api from "../../../services/api";
import { getToken } from "../../../services/auth";

interface Payment {
  id: number;
  consignment_name: string;
  driver_name: string;
  amount: number;
  payment_location: "BANK_SBI" | "BANK_JNK" | "SHOP_ZIRAKPUR" | "CASH";
  submitted_at: string;
  cash_submitted_to?: string | null; // <-- Added to interface
}

export default function OwnerPaymentsScreen() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPayments = async () => {
    try {
      const token = await getToken();
      const response = await api.get("/payments/history", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setPayments(response.data);
    } catch (error: any) {
      Alert.alert(
        "Unable to load payments",
        error.response?.data?.detail ?? "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPayments();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchPayments();
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

  const getLocationLabel = (location: Payment["payment_location"]) => {
    switch (location) {
      case "SHOP_ZIRAKPUR": return "Zirakpur Shop";
      case "BANK_SBI": return "SBI Bank";
      case "BANK_JNK": return "J&K Bank";
      case "CASH": return "Cash";
      default: return location;
    }
  };

  const getLocationColor = (location: Payment["payment_location"]) => {
    switch (location) {
      case "SHOP_ZIRAKPUR": return "#6C4AB6";
      case "CASH": return "#2E9D5B";
      case "BANK_SBI": 
      case "BANK_JNK": return "#D88924";
      default: return "#777777";
    }
  };

  const getLocationBackground = (location: Payment["payment_location"]) => {
    switch (location) {
      case "SHOP_ZIRAKPUR": return "#EEE8F8";
      case "CASH": return "#EAF7EF";
      case "BANK_SBI": 
      case "BANK_JNK": return "#FFF4E5";
      default: return "#F0EFF2";
    }
  };

  const renderPayment = ({ item }: { item: Payment }) => {
    const locationColor = getLocationColor(item.payment_location);
    const locationBackground = getLocationBackground(item.payment_location);

    return (
      <View style={styles.paymentCard}>
        <View style={styles.topRow}>
          <View style={styles.paymentIcon}>
            <Ionicons name="cash-outline" size={22} color="#6C4AB6" />
          </View>

          <View style={styles.mainInfo}>
            <Text style={styles.consignmentName}>{item.consignment_name}</Text>
            <Text style={styles.driverName}>Driver: {item.driver_name}</Text>
          </View>

          <Text style={styles.amount}>
            ₹{item.amount.toLocaleString("en-IN")}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.bottomRow}>
          <View style={styles.dateContainer}>
            <Ionicons name="calendar-outline" size={15} color="#888888" />
            <View style={styles.dateInfo}>
              <Text style={styles.dateText}>{formatDate(item.submitted_at)}</Text>
              <Text style={styles.timeText}>{formatTime(item.submitted_at)}</Text>
            </View>
          </View>

          <View style={[styles.locationBadge, { backgroundColor: locationBackground }]}>
            <Ionicons name="location-outline" size={14} color={locationColor} />
            <Text style={[styles.locationText, { color: locationColor }]}>
              {getLocationLabel(item.payment_location)}
            </Text>
          </View>
        </View>

        {/* CASH HANDOFF INDICATOR */}
        {item.payment_location === "CASH" && (
          <View style={[styles.cashHandoffContainer, !item.cash_submitted_to && styles.cashHandoffPending]}>
            <Ionicons 
              name={item.cash_submitted_to ? "person-outline" : "time-outline"} 
              size={15} 
              color={item.cash_submitted_to ? "#8A5A18" : "#D64545"} 
            />
            <Text style={[styles.cashHandoffText, !item.cash_submitted_to && styles.cashHandoffTextPending]}>
              {item.cash_submitted_to 
                ? `Submitted to: ${item.cash_submitted_to}` 
                : "Awaiting driver cash submission..."}
            </Text>
          </View>
        )}
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
        data={payments}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderPayment}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6C4AB6" />
        }
        contentContainerStyle={payments.length === 0 ? styles.emptyContent : styles.content}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Payments</Text>
            <Text style={styles.subtitle}>Payment history</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons name="wallet-outline" size={38} color="#6C4AB6" />
            </View>
            <Text style={styles.emptyTitle}>No payments yet</Text>
            <Text style={styles.emptyText}>
              Completed delivery payments will appear here.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F7FA" },
  content: { padding: 20, paddingBottom: 30 },
  emptyContent: { flexGrow: 1, padding: 20 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { marginBottom: 20 },
  title: { fontSize: 26, fontWeight: "700", color: "#222222" },
  subtitle: { fontSize: 14, color: "#777777", marginTop: 5 },
  paymentCard: {
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
  topRow: { flexDirection: "row", alignItems: "center" },
  paymentIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: "#EEE8F8",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  mainInfo: { flex: 1 },
  consignmentName: { fontSize: 16, fontWeight: "700", color: "#222222" },
  driverName: { fontSize: 12, color: "#777777", marginTop: 4 },
  amount: { fontSize: 16, fontWeight: "700", color: "#222222", marginLeft: 8 },
  divider: { height: 1, backgroundColor: "#F0EFF2", marginVertical: 14 },
  bottomRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  dateContainer: { flexDirection: "row", alignItems: "center" },
  dateInfo: { marginLeft: 7 },
  dateText: { fontSize: 11, color: "#666666" },
  timeText: { fontSize: 10, color: "#999999", marginTop: 2 },
  locationBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  locationText: { fontSize: 11, fontWeight: "600", marginLeft: 5 },
  cashHandoffContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF4E5",
    padding: 10,
    borderRadius: 10,
    marginTop: 14,
  },
  cashHandoffPending: {
    backgroundColor: "#FDEEEE",
  },
  cashHandoffText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#8A5A18",
    marginLeft: 6,
  },
  cashHandoffTextPending: {
    color: "#D64545",
  },
  emptyCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 300,
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
  emptyTitle: { fontSize: 17, fontWeight: "700", color: "#333333" },
  emptyText: {
    fontSize: 13,
    color: "#888888",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 19,
  },
});