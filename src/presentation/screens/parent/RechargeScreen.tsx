import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../../lib/supabase';
import { TokenRepositoryImpl } from '../../../data/repositories/TokenRepositoryImpl';
import { useAuthStore } from '../../state/authStore';
import { colors } from '../../theme/colors';

type Step = 'amount' | 'payment' | 'report' | 'success';
type CedulaTipo = 'V' | 'E' | 'J';

const PRESET_AMOUNTS = ['50', '100', '200', '500'];

const PAGO_MOVIL = {
  banco: 'Banesco (0134)',
  rif: 'V-30679063',
  telefono: '04126031026',
};

const RechargeScreen = () => {
  const { user } = useAuthStore();
  const [step, setStep] = useState<Step>('amount');
  const [amount, setAmount] = useState('');
  const [referencia, setReferencia] = useState('');
  const [telefonoOrigen, setTelefonoOrigen] = useState('');
  const [cedulaTipo, setCedulaTipo] = useState<CedulaTipo>('V');
  const [cedulaNumero, setCedulaNumero] = useState('');
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);

  React.useEffect(() => {
    const fetchBalance = async () => {
      if (user?.childId) {
        try {
          const repo = new TokenRepositoryImpl();
          setBalance(await repo.getTokenBalance(user.childId));
        } catch {
          setBalance(0);
        }
      } else {
        setBalance(0);
      }
    };
    fetchBalance();
  }, [user]);

  const handleCopy = async (text: string, label: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copiado', `${label} copiado al portapapeles`);
  };

  const handleNextFromAmount = () => {
    const num = parseFloat(amount);
    if (!amount || isNaN(num) || num <= 0) {
      Alert.alert('Monto inválido', 'Ingresa un monto mayor a 0.');
      return;
    }
    setStep('payment');
  };

  const handleNextFromPayment = () => {
    setStep('report');
  };

  const handleSubmit = async () => {
    if (!referencia.trim()) {
      Alert.alert('Campo requerido', 'Ingresa el número de referencia.');
      return;
    }
    if (!telefonoOrigen.trim() || telefonoOrigen.length < 10) {
      Alert.alert('Campo requerido', 'Ingresa tu número de teléfono (ej: 04121234567).');
      return;
    }
    if (!cedulaNumero.trim()) {
      Alert.alert('Campo requerido', 'Ingresa tu número de cédula.');
      return;
    }
    if (!user?.childId) {
      Alert.alert('Error', 'No hay estudiante asociado a esta cuenta.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('recharge_requests').insert({
        parent_id: user.id,
        student_id: user.childId,
        student_nombre: user.firstName || 'Estudiante',
        monto: parseFloat(amount),
        referencia: referencia.trim(),
        telefono_origen: telefonoOrigen.trim(),
        cedula_tipo: cedulaTipo,
        cedula_numero: cedulaNumero.trim(),
        estado: 'pendiente',
      });
      if (error) throw error;
      setStep('success');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo enviar la solicitud. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep('amount');
    setAmount('');
    setReferencia('');
    setTelefonoOrigen('');
    setCedulaTipo('V');
    setCedulaNumero('');
  };

  // ─── Step: amount ────────────────────────────────────────────────────────────
  if (step === 'amount') {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#B8956A', '#A67C52', '#B8956A']}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerContent}>
            <View style={styles.iconHeader}>
              <Ionicons name="wallet-outline" size={32} color="#fff" />
            </View>
            <Text style={styles.headerTitle}>Recargar Saldo</Text>
            <Text style={styles.headerSubtitle}>Paso 1 de 3 — Selecciona el monto</Text>
          </View>
        </LinearGradient>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.balanceCard}>
            <Ionicons name="wallet-outline" size={22} color={colors.textSecondary} />
            <Text style={styles.balanceLabel}>Saldo actual</Text>
            <Text style={styles.balanceAmount}>
              {balance !== null ? `Bs.S ${balance.toFixed(2)}` : 'Cargando...'}
            </Text>
            <Text style={styles.studentName}>{user?.firstName || 'Estudiante'}</Text>
          </View>

          <Text style={styles.sectionTitle}>Montos rápidos (Bs.S)</Text>
          <View style={styles.presetsContainer}>
            {PRESET_AMOUNTS.map(val => (
              <TouchableOpacity
                key={val}
                style={[styles.presetButton, amount === val && styles.presetButtonActive]}
                onPress={() => setAmount(val)}
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

          <TouchableOpacity style={styles.primaryButton} onPress={handleNextFromAmount} activeOpacity={0.8}>
            <LinearGradient
              colors={[colors.secondary, '#E67E22']}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.buttonText}>Continuar</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ─── Step: payment ───────────────────────────────────────────────────────────
  if (step === 'payment') {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#B8956A', '#A67C52', '#B8956A']}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <TouchableOpacity style={styles.backButton} onPress={() => setStep('amount')}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <View style={styles.iconHeader}>
              <Ionicons name="card-outline" size={32} color="#fff" />
            </View>
            <Text style={styles.headerTitle}>Datos de Pago</Text>
            <Text style={styles.headerSubtitle}>Paso 2 de 3 — Haz tu Pago Móvil</Text>
          </View>
        </LinearGradient>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.amountBanner}>
            <Text style={styles.amountBannerLabel}>Monto a transferir</Text>
            <Text style={styles.amountBannerValue}>Bs.S {parseFloat(amount).toFixed(2)}</Text>
          </View>

          <Text style={styles.sectionTitle}>Datos para Pago Móvil</Text>
          <View style={styles.pagoMovilCard}>
            {[
              { label: 'Banco', value: PAGO_MOVIL.banco },
              { label: 'RIF / Cédula', value: PAGO_MOVIL.rif },
              { label: 'Teléfono', value: PAGO_MOVIL.telefono },
            ].map(row => (
              <View key={row.label} style={styles.pagoMovilRow}>
                <View style={styles.pagoMovilInfo}>
                  <Text style={styles.pagoMovilLabel}>{row.label}</Text>
                  <Text style={styles.pagoMovilValue}>{row.value}</Text>
                </View>
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={() => handleCopy(row.value, row.label)}
                >
                  <Ionicons name="copy-outline" size={18} color={colors.primary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={20} color="#2874A6" />
            <Text style={styles.infoText}>
              Realiza la transferencia desde cualquier banco venezolano. Luego en el siguiente paso
              ingresa el comprobante para que el administrador apruebe tu recarga.
            </Text>
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={handleNextFromPayment} activeOpacity={0.8}>
            <LinearGradient
              colors={['#2ECC71', '#27AE60']}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.buttonText}>Ya pagué, continuar</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ─── Step: report ────────────────────────────────────────────────────────────
  if (step === 'report') {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#B8956A', '#A67C52', '#B8956A']}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <TouchableOpacity style={styles.backButton} onPress={() => setStep('payment')}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <View style={styles.iconHeader}>
              <Ionicons name="document-text-outline" size={32} color="#fff" />
            </View>
            <Text style={styles.headerTitle}>Comprobante</Text>
            <Text style={styles.headerSubtitle}>Paso 3 de 3 — Ingresa el comprobante</Text>
          </View>
        </LinearGradient>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.amountBanner}>
            <Text style={styles.amountBannerLabel}>Monto enviado</Text>
            <Text style={styles.amountBannerValue}>Bs.S {parseFloat(amount).toFixed(2)}</Text>
          </View>

          <Text style={styles.sectionTitle}>Número de referencia</Text>
          <View style={styles.fieldContainer}>
            <Ionicons name="barcode-outline" size={20} color={colors.textSecondary} />
            <TextInput
              style={styles.fieldInput}
              placeholder="Ej: 000123456789"
              keyboardType="numeric"
              value={referencia}
              onChangeText={setReferencia}
              placeholderTextColor="#ccc"
            />
          </View>

          <Text style={styles.sectionTitle}>Tu teléfono de origen</Text>
          <View style={styles.fieldContainer}>
            <Ionicons name="phone-portrait-outline" size={20} color={colors.textSecondary} />
            <TextInput
              style={styles.fieldInput}
              placeholder="Ej: 04121234567"
              keyboardType="phone-pad"
              value={telefonoOrigen}
              onChangeText={setTelefonoOrigen}
              placeholderTextColor="#ccc"
            />
          </View>

          <Text style={styles.sectionTitle}>Tu cédula</Text>
          <View style={styles.cedulaContainer}>
            <View style={styles.cedulaTipoGroup}>
              {(['V', 'E', 'J'] as CedulaTipo[]).map(tipo => (
                <TouchableOpacity
                  key={tipo}
                  style={[styles.cedulaTipoButton, cedulaTipo === tipo && styles.cedulaTipoActive]}
                  onPress={() => setCedulaTipo(tipo)}
                >
                  <Text style={[styles.cedulaTipoText, cedulaTipo === tipo && styles.cedulaTipoTextActive]}>
                    {tipo}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={[styles.fieldContainer, { flex: 1, marginTop: 0 }]}>
              <TextInput
                style={styles.fieldInput}
                placeholder="12345678"
                keyboardType="numeric"
                value={cedulaNumero}
                onChangeText={setCedulaNumero}
                placeholderTextColor="#ccc"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, loading && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[colors.secondary, '#E67E22']}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.buttonText}>{loading ? 'Enviando...' : 'Enviar Solicitud'}</Text>
              {!loading && <Ionicons name="send" size={20} color="#fff" />}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ─── Step: success ───────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <View style={styles.successContainer}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark-circle" size={80} color="#2ECC71" />
        </View>
        <Text style={styles.successTitle}>¡Solicitud enviada!</Text>
        <Text style={styles.successText}>
          Tu solicitud de recarga de{' '}
          <Text style={{ fontWeight: 'bold' }}>Bs.S {parseFloat(amount).toFixed(2)}</Text>{' '}
          fue enviada. El administrador la revisará y aprobará en breve.
        </Text>
        <View style={styles.successInfoBox}>
          <Ionicons name="time-outline" size={20} color="#F39C12" />
          <Text style={styles.successInfoText}>
            Una vez aprobada, el saldo se acreditará automáticamente en la billetera del estudiante.
          </Text>
        </View>
        <TouchableOpacity style={styles.primaryButton} onPress={handleReset} activeOpacity={0.8}>
          <LinearGradient
            colors={[colors.secondary, '#E67E22']}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="refresh" size={20} color="#fff" />
            <Text style={styles.buttonText}>Nueva Recarga</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  backButton: {
    position: 'absolute',
    top: 55,
    left: 16,
    zIndex: 10,
    padding: 8,
  },
  headerContent: { alignItems: 'center', zIndex: 1 },
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
  headerTitle: { fontSize: 26, fontWeight: 'bold', color: colors.white },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  balanceCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    marginTop: -20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    gap: 4,
  },
  balanceLabel: { fontSize: 13, color: colors.textSecondary, marginTop: 6 },
  balanceAmount: { fontSize: 30, fontWeight: 'bold', color: colors.primary },
  studentName: { fontSize: 13, color: colors.textSecondary },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 10, marginLeft: 2 },
  presetsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  presetButton: {
    flex: 1,
    marginHorizontal: 4,
    height: 50,
    borderRadius: 12,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  presetButtonActive: { backgroundColor: colors.secondary, borderColor: colors.secondary },
  presetText: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  presetTextActive: { color: colors.white },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  currencySymbol: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginRight: 10 },
  input: { flex: 1, fontSize: 22, fontWeight: 'bold', color: colors.text },
  primaryButton: { borderRadius: 14, overflow: 'hidden', marginTop: 4 },
  buttonGradient: {
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  amountBanner: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
    marginTop: -20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  amountBannerLabel: { fontSize: 12, color: colors.textSecondary },
  amountBannerValue: { fontSize: 28, fontWeight: 'bold', color: colors.primary },
  pagoMovilCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    gap: 2,
  },
  pagoMovilRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  pagoMovilInfo: { flex: 1 },
  pagoMovilLabel: { fontSize: 12, color: colors.textSecondary },
  pagoMovilValue: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginTop: 2 },
  copyButton: {
    padding: 8,
    backgroundColor: '#F5F6FA',
    borderRadius: 8,
    marginLeft: 8,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#EBF5FB',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#D6EAF8',
    marginBottom: 24,
  },
  infoText: { flex: 1, fontSize: 13, color: '#2874A6', lineHeight: 18 },
  fieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: 8,
  },
  fieldInput: { flex: 1, fontSize: 16, color: colors.text },
  cedulaContainer: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginBottom: 20 },
  cedulaTipoGroup: { flexDirection: 'row', gap: 6, paddingTop: 0 },
  cedulaTipoButton: {
    width: 40,
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cedulaTipoActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  cedulaTipoText: { fontSize: 15, fontWeight: 'bold', color: colors.text },
  cedulaTipoTextActive: { color: colors.white },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E8F8F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: { fontSize: 26, fontWeight: 'bold', color: colors.text, marginBottom: 12 },
  successText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  successInfoBox: {
    flexDirection: 'row',
    backgroundColor: '#FEF9E7',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#FDEBD0',
    marginBottom: 28,
    width: '100%',
  },
  successInfoText: { flex: 1, fontSize: 13, color: '#784212', lineHeight: 18 },
});

export default RechargeScreen;
