import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { supabase } from '../../../lib/supabase';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { colors } from '../../theme/colors';

const ResetPasswordScreen = ({ onComplete }: { onComplete: () => void }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleUpdatePassword = async () => {
        setError('');

        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres por seguridad.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden. Asegúrate de que ambas sean idénticas.');
            return;
        }

        setLoading(true);
        try {
            const { error: supabaseError } = await supabase.auth.updateUser({
                password: password
            });

            if (supabaseError) {
                if (supabaseError.message.includes('same as the old one')) {
                    setError('La nueva contraseña no puede ser igual a la anterior. Elige una diferente.');
                } else {
                    setError(supabaseError.message);
                }
                return;
            }

            setIsSuccess(true);
        } catch (err: any) {
            setError(err.message || 'Ocurrió un error inesperado al actualizar la contraseña.');
        } finally {
            setLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <View style={styles.container}>
                <View style={styles.card}>
                    <View style={styles.successView}>
                        <View style={styles.successIconWrapper}>
                            <View style={styles.successCheckContainer}>
                                <Ionicons name="checkmark" size={50} color="#fff" />
                            </View>
                        </View>
                        <Text style={styles.successTitle}>¡Contraseña Actualizada!</Text>
                        <Text style={styles.successSubtitle}>
                            Tu clave ha sido cambiada con éxito. Ya puedes volver a entrar a tu cuenta.
                        </Text>
                        <Button
                            title="Ir al inicio"
                            onPress={onComplete}
                            style={styles.successButton}
                        />
                    </View>
                </View>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.card}>
                <View style={styles.header}>
                    <View style={styles.headerIconContainer}>
                        <Ionicons name="lock-open-outline" size={40} color={colors.primary} />
                    </View>
                    <Text style={styles.title}>Nueva Contraseña</Text>
                    <Text style={styles.subtitle}>Ingresa tu nueva clave de acceso de forma segura</Text>
                </View>

                <Input
                    label="Nueva Contraseña"
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    secureTextEntry
                    icon="lock-closed-outline"
                />

                <Input
                    label="Confirmar Contraseña"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
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

                <Button
                    title="Actualizar Contraseña"
                    onPress={handleUpdatePassword}
                    loading={loading}
                    style={styles.button}
                />
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        justifyContent: 'center',
        padding: 24,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 30,
        padding: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    headerIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(184, 149, 106, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#2D3436',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
    },
    button: {
        marginTop: 8,
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
    successView: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    successIconWrapper: {
        marginBottom: 24,
    },
    successCheckContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2D3436',
        marginBottom: 12,
        textAlign: 'center',
    },
    successSubtitle: {
        fontSize: 16,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },
    successButton: {
        width: '100%',
    }
});

export default ResetPasswordScreen;
