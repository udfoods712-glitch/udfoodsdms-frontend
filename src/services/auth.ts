import * as SecureStore from "expo-secure-store";
import api from "./api";

export async function login(phone: string, password: string) {
  const response = await api.post("/auth/login", {
    phone,
    password,
  });

  await SecureStore.setItemAsync(
    "token",
    response.data.access_token
  );

  return response.data;
}

export async function getToken() {
  return await SecureStore.getItemAsync("token");
}

export async function logout() {
  await SecureStore.deleteItemAsync("token");
}

export async function getCurrentUser() {
  const token = await getToken();

  const response = await api.get("/users/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}