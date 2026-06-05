import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert } from 'react-native';
import { useAttendance } from '../hooks/useAttendance';
import FAB from '../components/FAB';

interface Props {
  studentCode: string;
}

export default function AttendanceScreen({ studentCode }: Props) {
  const [sessionCode, setSessionCode] = useState('');
  const { registrarAsistencia, loading, error, success } = useAttendance();

  const handleRegistrar = () => {
    if (!sessionCode) {
      Alert.alert('Error', 'Por favor ingresa el código de sesión');
      return;
    }
    Alert.alert(
      '¿Confirmar asistencia?',
      `¿Deseas registrar tu asistencia con el código ${sessionCode}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: () => registrarAsistencia(sessionCode, studentCode),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📋 Registrar Asistencia</Text>
      <Text style={styles.subtitle}>Ingresa el código de sesión</Text>

      <TextInput
        style={styles.input}
        placeholder="Código de 6 caracteres"
        value={sessionCode}
        onChangeText={setSessionCode}
        autoCapitalize="characters"
        maxLength={6}
      />

      {error && <Text style={styles.error}>{error}</Text>}
      {success && <Text style={styles.success}>{success}</Text>}

      <FAB
        label="Registrar Asistencia"
        onPress={handleRegistrar}
        loading={loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    marginBottom: 32,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    fontSize: 24,
    textAlign: 'center',
    letterSpacing: 8,
  },
  error: {
    color: 'red',
    marginBottom: 8,
  },
  success: {
    color: '#2E7D32',
    fontWeight: 'bold',
    marginBottom: 8,
    fontSize: 16,
  },
});