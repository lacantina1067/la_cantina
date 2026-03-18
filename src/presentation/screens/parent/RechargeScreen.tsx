import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Alert, Keyboard, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { TokenRepositoryImpl } from '../../../data/repositories/TokenRepositoryImpl';
import { useAuthStore } from '../../state/authStore';
import { colors } from '../../theme/colors';

const RechargeScreen = () => {
  const { user } = useAuthStore();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);

  React.useEffect(() => {
    const fetchBalance = async () => {
      if (user?.childId) {
        try {
          const repo = new TokenRepositoryImpl();
          const currentBalance = await repo.getTokenBalance(user.childId);
          setBalance(currentBalance);
        } catch (error) {
          console.error("Error fetching balance:", error);
          setBalance(0);
        }
      } else {
        // En caso de que no tenga un hijo asignado o no cargue, no se queda en null
        setBalance(0);
      }
    };
    fetchBalance();
  }, [user]);

  const handleRecharge = async () => {
    Alert.alert('En desarrollo', 'La funcionalidad de recarga estará disponible próximamente.');
    // TODO: Implementar lógica real
  };

  const selectAmount = (value: string) => {
    setAmount(value);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#B8956A', '#A67C52', '#B8956A']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={StyleSheet.absoluteFill}>
          <Ionicons name="wallet" size={80} color="rgba(255,255,255,0.1)" style={{ position: 'absolute', right: -20, top: -10 }} />
          <Ionicons name="card" size={60} color="rgba(255,255,255,0.08)" style={{ position: 'absolute', left: -10, bottom: -10 }} />
        </View>
        <View style={styles.headerContent}>
          <View style={styles.iconHeader}>
            <Ionicons name="wallet-outline" size={32} color="#fff" />
          </View>
          <Text style={styles.headerTitle}>Billetera</Text>
          <Text style={styles.headerSubtitle}>Recarga saldo para tu hijo</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.content}>
            <View style={styles.card}>
              <View style={styles.balanceHeader}>
                <Ionicons name="wallet-outline" size={24} color={colors.textSecondary} />
                <Text style={styles.balanceLabel}>Saldo Actual Estimado</Text>
              </View>
              <Text style={styles.balanceAmount}>
                {balance !== null ? `Bs.S ${balance.toFixed(2)}` : 'Cargando...'}
              </Text>
              <Text style={styles.studentName}>Estudiante: {user?.firstName || 'Hijo'}</Text>
            </View>

            <Text style={styles.sectionTitle}>Selecciona un monto</Text>

            <View style={styles.presetsContainer}>
              {['50', '100', '200', '500'].map((val) => (
                <TouchableOpacity
                  key={val}
                  style={[styles.presetButton, amount === val && styles.presetButtonActive]}
                  onPress={() => selectAmount(val)}
                >
                  <Text style={[styles.presetText, amount === val && styles.presetTextActive]}>
                    {val}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionTitle}>O ingresa otro monto</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.currencySymbol}>Bs.S</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
                placeholderTextColor="#ccc"
              />
            </View>

            <TouchableOpacity
              style={styles.rechargeButton}
              onPress={handleRecharge}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={loading ? ['#BDC3C7', '#95A5A6'] : [colors.secondary, '#E67E22']}
                style={styles.rechargeGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {loading ? (
                  <Text style={styles.rechargeText}>Procesando...</Text>
                ) : (
                  <>
                    <Ionicons name="card-outline" size={24} color={colors.white} />
                    <Text style={styles.rechargeText}>Recargar Saldo</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.infoContainer}>
              <Ionicons name="lock-closed-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.infoText}>Pagos seguros y encriptados</Text>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  headerContent: {
    alignItems: 'center',
    zIndex: 1,
  },
  iconHeader: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  content: {
    padding: 20,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 24,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    alignItems: 'center',
    marginTop: -50, // Overlap header
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  studentName: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
    marginLeft: 4,
  },
  presetsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  presetButton: {
    width: 70,
    height: 50,
    borderRadius: 12,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  presetButtonActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  presetText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  presetTextActive: {
    color: colors.white,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingHorizontal: 20,
    height: 60,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  rechargeButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  rechargeGradient: {
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  rechargeText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    gap: 6,
  },
  infoText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
});

export default RechargeScreen;
