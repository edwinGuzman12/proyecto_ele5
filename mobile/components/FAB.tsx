import { Pressable, StyleSheet, Text } from 'react-native';

interface Props {
  label: string;
  onPress?: () => void;
  onLongPress?: () => void;
  loading?: boolean;
}

export default function FAB({ label, onPress, onLongPress, loading }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        pressed && { opacity: 0.7 },
        loading && { opacity: 0.5 },
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={loading}
    >
      <Text style={styles.text}>{loading ? 'Registrando...' : label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#2E7D32',
    borderRadius: 15,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  text: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});