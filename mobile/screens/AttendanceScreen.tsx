import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, Alert,
  ScrollView, RefreshControl, ActivityIndicator,
} from 'react-native';
import { useAttendance, AsistenciaItem } from '../hooks/useAttendance';
import FAB from '../components/FAB';

interface Props {
  studentCode: string;
  userName?: string;
  fullName?: string;
}

function PorcentajeCirculo({ porcentaje }: { porcentaje: number | undefined }) {
  const pct = porcentaje ?? 0;
  const color = pct >= 80 ? '#2E7D32' : pct >= 60 ? '#F9A825' : '#C62828';
  return (
    <View style={styles.circulo}>
      <Text style={[styles.circPorcentaje, { color }]}>{pct.toFixed(0)}%</Text>
      <Text style={styles.circLabel}>asistencia</Text>
      <View style={[styles.circBarra, { width: `${Math.min(pct, 100)}%` as any, backgroundColor: color }]} />
    </View>
  );
}

function FilaAsistencia({ item }: { item: AsistenciaItem }) {
  const fecha = new Date(item.date);
  const fechaStr = fecha.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  const esPresente = item.status === 'presente';
  return (
    <View style={styles.fila}>
      <View style={[styles.badge, { backgroundColor: esPresente ? '#E8F5E9' : '#FFEBEE' }]}>
        <Text style={{ fontSize: 16 }}>{esPresente ? '✅' : '❌'}</Text>
      </View>
      <View style={styles.filaTextos}>
        <Text style={styles.filaFecha}>{fechaStr}</Text>
        <Text style={styles.filaCodigo}>Sesión #{item.session_id}</Text>
      </View>
      <Text style={[styles.filaEstado, { color: esPresente ? '#2E7D32' : '#C62828' }]}>
        {esPresente ? 'Presente' : 'Ausente'}
      </Text>
    </View>
  );
}

export default function AttendanceScreen({ studentCode, userName, fullName }: Props) {
  const [sessionCode, setSessionCode] = useState('');
  const { registrarAsistencia, cargarHistorial, loading, loadingHistorial, error, success, historial } = useAttendance();

  useEffect(() => { cargarHistorial(); }, []);

  const handleRegistrar = () => {
    if (!sessionCode || sessionCode.length < 6) {
      Alert.alert('Error', 'El código de sesión debe tener 6 caracteres');
      return;
    }
    Alert.alert(
      '¿Confirmar asistencia?',
      `¿Registrar asistencia con código ${sessionCode}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', onPress: () => { registrarAsistencia(sessionCode, studentCode); setSessionCode(''); } },
      ]
    );
  };

  const displayName = fullName || userName || studentCode;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={loadingHistorial} onRefresh={cargarHistorial} colors={['#2E7D32']} tintColor="#2E7D32" />}
    >
      <View style={styles.header}>
        <Text style={styles.saludo}>Hola, 👋</Text>
        <Text style={styles.nombre} numberOfLines={1}>{displayName}</Text>
        <Text style={styles.codigo}>Código: {studentCode}</Text>
        <Text style={styles.asignatura}>Electiva V — Unimayor</Text>
      </View>

      {loadingHistorial && !historial ? (
        <ActivityIndicator size="large" color="#2E7D32" style={{ marginVertical: 24 }} />
      ) : historial ? (
        <View style={styles.statsCard}>
          <PorcentajeCirculo porcentaje={historial.porcentaje} />
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{historial.total_asistidas ?? 0}</Text>
              <Text style={styles.statLabel}>Asistidas</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{historial.total_clases ?? 0}</Text>
              <Text style={styles.statLabel}>Total clases</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{historial.total_ausentes ?? 0}</Text>
              <Text style={styles.statLabel}>Faltadas</Text>
            </View>
          </View>
          {(historial.porcentaje ?? 0) < 80 && (
            <View style={styles.alertaMinima}>
              <Text style={styles.alertaMinimaText}>⚠️ Estás por debajo del 80% requerido</Text>
            </View>
          )}
        </View>
      ) : null}

      <View style={styles.registroCard}>
        <Text style={styles.sectionTitle}>📋 Registrar Asistencia</Text>
        <Text style={styles.subtitle}>Ingresa el código de la sesión de hoy</Text>
        <TextInput
          style={styles.input}
          placeholder="ej. TCJ9SA"
          placeholderTextColor="#aaa"
          value={sessionCode}
          onChangeText={(t) => setSessionCode(t.toUpperCase())}
          autoCapitalize="characters"
          maxLength={6}
          returnKeyType="done"
          onSubmitEditing={handleRegistrar}
        />
        {error ? <Text style={styles.error}>⚠️ {error}</Text> : null}
        {success ? <Text style={styles.successMsg}>✅ {success}</Text> : null}
        <FAB label="Registrar Asistencia" onPress={handleRegistrar} loading={loading} />
      </View>

      {historial && historial.asistencias?.length > 0 && (
        <View style={styles.historialCard}>
          <Text style={styles.sectionTitle}>📅 Historial de clases</Text>
          {historial.asistencias.slice().reverse().map((item) => (
            <FilaAsistencia key={item.session_id} item={item} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const VERDE = '#2E7D32';
const VERDE_CLARO = '#E8F5E9';

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#F4F6F8' },
  container: { padding: 20, paddingBottom: 40 },
  header: { backgroundColor: VERDE, borderRadius: 18, padding: 20, marginBottom: 16 },
  saludo: { color: '#A5D6A7', fontSize: 14 },
  nombre: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginTop: 2 },
  codigo: { color: '#C8E6C9', fontSize: 13, marginTop: 4 },
  asignatura: { color: '#A5D6A7', fontSize: 13, marginTop: 2 },
  statsCard: { backgroundColor: '#fff', borderRadius: 18, padding: 20, marginBottom: 16, elevation: 3 },
  circulo: { alignItems: 'center', marginBottom: 16 },
  circPorcentaje: { fontSize: 48, fontWeight: 'bold' },
  circLabel: { color: '#777', fontSize: 14, marginTop: -4 },
  circBarra: { height: 8, borderRadius: 4, marginTop: 10, alignSelf: 'flex-start', maxWidth: '100%' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginTop: 4 },
  statItem: { alignItems: 'center' },
  statNum: { fontSize: 24, fontWeight: 'bold', color: '#212121' },
  statLabel: { fontSize: 12, color: '#777', marginTop: 2 },
  statDivider: { width: 1, height: 36, backgroundColor: '#E0E0E0' },
  alertaMinima: { backgroundColor: '#FFF3E0', borderRadius: 10, padding: 10, marginTop: 14, alignItems: 'center' },
  alertaMinimaText: { color: '#E65100', fontSize: 13, fontWeight: '600' },
  registroCard: { backgroundColor: '#fff', borderRadius: 18, padding: 20, marginBottom: 16, elevation: 3 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#212121', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 16 },
  input: { borderWidth: 2, borderColor: VERDE, borderRadius: 12, padding: 14, fontSize: 28, textAlign: 'center', letterSpacing: 10, color: '#212121', backgroundColor: VERDE_CLARO, fontWeight: 'bold' },
  error: { color: '#C62828', marginTop: 10, fontSize: 14 },
  successMsg: { color: VERDE, fontWeight: 'bold', marginTop: 10, fontSize: 14 },
  historialCard: { backgroundColor: '#fff', borderRadius: 18, padding: 20, elevation: 3 },
  fila: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  badge: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  filaTextos: { flex: 1 },
  filaFecha: { fontSize: 14, fontWeight: '600', color: '#212121' },
  filaCodigo: { fontSize: 12, color: '#888', marginTop: 2 },
  filaEstado: { fontSize: 13, fontWeight: 'bold' },
});