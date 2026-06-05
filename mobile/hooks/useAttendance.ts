import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { marcarAsistencia } from '../service/api';

export const useAttendance = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const registrarAsistencia = async (session_code: string, student_code: string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const token = await AsyncStorage.getItem('access_token') || '';
      const response = await marcarAsistencia(session_code, student_code, token);
      setSuccess(response.message);
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Error al registrar asistencia');
    } finally {
      setLoading(false);
    }
  };

  return { registrarAsistencia, loading, error, success };
};