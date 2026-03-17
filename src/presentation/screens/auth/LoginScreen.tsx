import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Dimensions, Easing, KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AuthRepositoryImpl } from '../../../data/repositories/AuthRepositoryImpl';
import { LoginUseCase } from '../../../domain/usecases/LoginUseCase';
import { ResetPasswordUseCase } from '../../../domain/usecases/ResetPasswordUseCase';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { useAuthStore } from '../../state/authStore';
import { colors } from '../../theme/colors';

const { width, height } = Dimensions.get('window');

// Iconos de fondo para la animación (Menos cantidad, mejor distribuidos)
// Usamos nombres de MaterialCommunityIcons para mayor variedad (empanadas/arepas)
const BACKGROUND_ICONS = [
    { name: 'pizza', size: 45, left: '8%', top: '12%' },           // Arriba Izquierda
    { name: 'coffee', size: 35, left: '85%', top: '15%' },         // Arriba Derecha
    { name: 'taco', size: 40, left: '5%', top: '45%' },            // Medio Izquierda (Empanada)
    { name: 'circle-slice-8', size: 38, left: '90%', top: '50%' }, // Medio Derecha (Arepa)
    { name: 'hamburger', size: 42, left: '15%', top: '85%' },      // Abajo Izquierda
    { name: 'ice-cream', size: 35, left: '80%', top: '88%' },      // Abajo Derecha
    { name: 'cup-water', size: 28, left: '45%', top: '5%' },       // Arriba Centro
    { name: 'fruit-watermelon', size: 30, left: '50%', top: '95%' } // Abajo Centro
];

const LoginScreen = () => {
    const navigation = useNavigation();
    const { login } = useAuthStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetLoading, setResetLoading] = useState(false);
    const [isResetEmailSent, setIsResetEmailSent] = useState(false);

    // Animaciones
    // Inicializamos en 1 y 0 para que NO haya animación de entrada y se vea instantáneo
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const slideAnim = useRef(new Animated.Value(0)).current;

    // Animación flotante para los iconos de fondo
    const floatAnims = useRef(BACKGROUND_ICONS.map(() => new Animated.Value(0))).current;

    useEffect(() => {
        // Animación continua de los iconos de fondo
        const animations = floatAnims.map((anim, index) => {
            return Animated.loop(
                Animated.sequence([
                    Animated.timing(anim, {
                        toValue: 1,
                        duration: 4000 + (index * 500), // Más lento y suave
                        easing: Easing.inOut(Easing.sin),
                        useNativeDriver: true,
                    }),
                    Animated.timing(anim, {
                        toValue: 0,
                        duration: 4000 + (index * 500),
                        easing: Easing.inOut(Easing.sin),
                        useNativeDriver: true,
                    }),
                ])
            );
        });

        Animated.parallel(animations).start();
    }, []);

    const validateEmail = (email: string) => {
        const re = /\S+@\S+\.\S+/;
        return re.test(email);
    };

    const handleLogin = async () => {
        setLoading(true);
        setError('');
        try {
            const authRepository = new AuthRepositoryImpl();
            const loginUseCase = new LoginUseCase(authRepository);
            const user = await loginUseCase.execute(email, password);
            login(user);
        } catch (e) {
            setError('Error al iniciar sesión. Por favor verifica tus credenciales.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!resetEmail) {
            setError('Por favor ingresa tu email');
            return;
        }

        if (!validateEmail(resetEmail)) {
            setError('Por favor ingresa un formato de email válido');
            return;
        }

        setResetLoading(true);
        setError('');
        try {
            const authRepository = new AuthRepositoryImpl();
            const resetUseCase = new ResetPasswordUseCase(authRepository);
            await resetUseCase.execute(resetEmail);
            setIsResetEmailSent(true);
        } catch (e: any) {
            Alert.alert('Error', e.message || 'No se pudo enviar el correo de recuperación');
        } finally {
            setResetLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <LinearGradient
                colors={['#B8956A', '#A67C52', '#8C6239']}
                style={styles.background}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            {/* Iconos de fondo animados */}
            <View style={StyleSheet.absoluteFill}>
                {BACKGROUND_ICONS.map((icon, index) => (
                    <Animated.View
                        key={index}
                        style={[
                            styles.floatingIcon,
                            {
                                left: icon.left as any,
                                top: icon.top as any,
                                transform: [
                                    {
                                        translateY: floatAnims[index].interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0, -25], // Flotar un poco más
                                        }),
                                    },
                                ],
                            },
                        ]}
                    >
                        <MaterialCommunityIcons name={icon.name as any} size={icon.size} color="rgba(255,255,255,0.15)" />
                    </Animated.View>
                ))}
            </View>

            <Animated.View
                style={[
                    styles.contentContainer,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }],
                    }
                ]}
            >
                <View style={styles.card}>
                    <View style={styles.headerContainer}>
                        <View style={styles.logoContainer}>
                            <LinearGradient
                                colors={['#ED9B40', '#E8872E']}
                                style={styles.logoGradient}
                            >
                                <Ionicons name="restaurant" size={32} color="#fff" />
                            </LinearGradient>
                        </View>
                        <Text style={styles.title}>¡Bienvenido!</Text>
                        <Text style={styles.subtitle}>Tu comida favorita te espera</Text>
                    </View>

                    <View style={styles.formContainer}>
                        <Input
                            label="Email"
                            value={email}
                            onChangeText={setEmail}
                            placeholder="Email"
                            autoCapitalize="none"
                            keyboardType="email-address"
                            icon="person-outline"
                        />
                        <Input
                            label="Contraseña"
                            value={password}
                            onChangeText={setPassword}
                            placeholder="••••••••"
                            secureTextEntry
                            icon="lock-closed-outline"
                        />

                        {error ? (
                            <View style={styles.errorContainer}>
                                <Ionicons name="alert-circle" size={20} color={colors.danger} />
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        ) : null}

                        <TouchableOpacity
                            style={styles.forgotPasswordContainer}
                            onPress={() => setShowResetModal(true)}
                        >
                            <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
                        </TouchableOpacity>

                        <View style={styles.buttonContainer}>
                            <Button title="Iniciar sesión" onPress={handleLogin} loading={loading} />
                        </View>

                        <TouchableOpacity
                            style={styles.linkContainer}
                            onPress={() => (navigation as any).navigate('Register')}
                        >
                            <Text style={styles.linkText}>
                                ¿No tienes una cuenta? <Text style={styles.linkHighlight}>Regístrate</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Animated.View>

            {/* Modal de Restablecer Contraseña */}
            <Modal
                visible={showResetModal}
                transparent
                animationType="slide"
                onRequestClose={() => {
                    setShowResetModal(false);
                    setTimeout(() => {
                        setIsResetEmailSent(false);
                        setError('');
                    }, 300);
                }}
            >
                <View style={styles.modalOverlay}>
                    <LinearGradient
                        colors={['#B8956A', '#A67C52', '#8C6239']}
                        style={styles.modalContent}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: '#fff' }]}>Recuperar Contraseña</Text>
                            <TouchableOpacity onPress={() => {
                                setShowResetModal(false);
                                setTimeout(() => {
                                    setIsResetEmailSent(false);
                                    setError('');
                                }, 300);
                            }}>
                                <Ionicons name="close" size={28} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        {isResetEmailSent ? (
                            <View style={styles.successContainer}>
                                <View style={styles.successIconContainer}>
                                    <View style={[styles.successGradient, { backgroundColor: '#fff' }]}>
                                        <Ionicons name="checkmark" size={45} color="#4CAF50" />
                                    </View>
                                </View>
                                <Text style={[styles.successTitle, { color: '#fff' }]}>¡Correo enviado!</Text>
                                <Text style={[styles.successDescription, { color: 'rgba(255,255,255,0.9)' }]}>
                                    Hemos enviado un enlace de recuperación a <Text style={styles.boldWhite}>{resetEmail}</Text>. Revisa tu bandeja de entrada.
                                </Text>
                                <TouchableOpacity
                                    style={styles.whiteButton}
                                    onPress={() => {
                                        setShowResetModal(false);
                                        setTimeout(() => {
                                            setIsResetEmailSent(false);
                                            setError('');
                                        }, 300);
                                    }}
                                >
                                    <Text style={styles.whiteButtonText}>Entendido</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <>
                                <Text style={[styles.modalDescription, { color: 'rgba(255,255,255,0.8)' }]}>
                                    Ingresa tu email y te enviaremos las instrucciones para restablecer tu contraseña.
                                </Text>

                                <Input
                                    label="Email"
                                    value={resetEmail}
                                    onChangeText={setResetEmail}
                                    placeholder="Email"
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    icon="mail-outline"
                                />

                                {error ? (
                                    <View style={[styles.errorContainer, { backgroundColor: 'rgba(255, 255, 255, 0.2)', marginBottom: 20 }]}>
                                        <Ionicons name="alert-circle" size={20} color="#fff" />
                                        <Text style={[styles.errorText, { color: '#fff' }]}>{error}</Text>
                                    </View>
                                ) : null}

                                <TouchableOpacity
                                    style={styles.whiteButton}
                                    onPress={handleResetPassword}
                                    disabled={resetLoading}
                                >
                                    <Text style={styles.whiteButtonText}>
                                        {resetLoading ? 'Enviando...' : 'Enviar instrucciones'}
                                    </Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </LinearGradient>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    background: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },
    floatingIcon: {
        position: 'absolute',
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 30,
        padding: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logoContainer: {
        marginBottom: 16,
        shadowColor: '#ED9B40',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    logoGradient: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#2D3436',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: colors.textSecondary,
        textAlign: 'center',
    },
    formContainer: {
        width: '100%',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFE5E5',
        padding: 12,
        borderRadius: 12,
        marginBottom: 16,
    },
    errorText: {
        color: colors.danger,
        marginLeft: 8,
        flex: 1,
        fontSize: 14,
    },
    buttonContainer: {
        marginTop: 16,
        marginBottom: 24,
    },
    forgotPasswordContainer: {
        alignItems: 'flex-end',
        marginBottom: 20,
        marginTop: -8,
    },
    forgotPasswordText: {
        color: colors.primary,
        fontSize: 14,
        fontWeight: '600',
    },
    linkContainer: {
        alignItems: 'center',
    },
    linkText: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    linkHighlight: {
        color: colors.primary,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 24,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2D3436',
    },
    modalDescription: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: 24,
        lineHeight: 20,
    },
    successContainer: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    successIconContainer: {
        marginBottom: 20,
    },
    successGradient: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    successTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#2D3436',
        marginBottom: 12,
    },
    successDescription: {
        fontSize: 15,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    boldWhite: {
        fontWeight: 'bold',
        color: '#fff',
    },
    whiteButton: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 15,
        alignItems: 'center',
        marginTop: 10,
    },
    whiteButtonText: {
        color: '#8C6239',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default LoginScreen;
