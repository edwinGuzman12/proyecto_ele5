import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login, getProfile } from '../service/api';

export const useLogin = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const iniciarSesion = async (username: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await login(username, password);
      await AsyncStorage.setItem('access_token', data.access_token);
      const profile = await getProfile(data.access_token);
      await AsyncStorage.setItem('user', JSON.stringify(profile));
      return profile;
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Error al iniciar sesión');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { iniciarSesion, loading, error };
};