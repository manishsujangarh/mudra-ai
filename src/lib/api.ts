// src/lib/api.ts
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Token get karo
  const token = await SecureStore.getItemAsync('userToken');

  // Headers setup
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...options.headers,
  };

  // Agar token hai, toh header me Authorization add karo
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Fetch call
  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Axios apne aap error throw karta hai HTTP errors (400/500) pe, but fetch nahi karta. 
  // Isliye hume manually error handle karna padega:
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw { status: response.status, data: errorData };
  }

  return response.json();
};