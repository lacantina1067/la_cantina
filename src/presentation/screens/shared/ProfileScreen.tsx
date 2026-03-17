import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { UserRepositoryImpl } from '../../../data/repositories/UserRepositoryImpl';
import { User } from '../../../domain/entities/User';
import { useAuthStore } from '../../state/authStore';
import { colors } from '../../theme/colors';

const ProfileScreen = () => {
    const { user, logout } = useAuthStore();
    const [child, setChild] = useState<User | null>(null);
    const navigation = useNavigation();

    useEffect(() => {
        const fetchChildData = async () => {
            if (user?.role === 'parent' && user.childId) {
                const userRepository = new UserRepositoryImpl();
                const childData = await userRepository.getUserById(user.childId);
                setChild(childData);
            }
        };
        fetchChildData();
    }, [user]);

    const handleLogout = async () => {
        await logout();
    };

    const copyToClipboard = async (text: string, label: string) => {
        await Clipboard.setStringAsync(text);
        Alert.alert('¡Copiado!', `El ${label} ha sido copiado al portapapeles.`);
    };

    const InfoRow = ({ icon, label, value, onCopy }: { icon: string, label: string, value: string | undefined, onCopy?: boolean }) => (
        <TouchableOpacity
            style={styles.infoRow}
            activeOpacity={onCopy ? 0.7 : 1}
            onPress={onCopy && value ? () => copyToClipboard(value, label) : undefined}
        >
            <View style={styles.iconContainer}>
                <Ionicons name={icon as any} size={20} color={colors.primary} />
            </View>
            <View style={styles.infoContent}>
                <View style={styles.labelRow}>
                    <Text style={styles.infoLabel}>{label}</Text>
                    {onCopy && <Ionicons name="copy-outline" size={12} color={colors.primary} style={{ marginLeft: 4 }} />}
                </View>
                <Text style={styles.infoValue} numberOfLines={1}>{value || 'N/A'}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            <LinearGradient
                colors={['#B8956A', '#A67C52', '#B8956A']}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                {/* Iconos decorativos de fondo */}
                <View style={StyleSheet.absoluteFill}>
                    {user?.role === 'cafeteria' ? (
                        <>
                            <Ionicons name="pizza" size={80} color="rgba(255,255,255,0.1)" style={{ position: 'absolute', right: -20, top: -10 }} />
                            <Ionicons name="fast-food" size={60} color="rgba(255,255,255,0.08)" style={{ position: 'absolute', left: -10, bottom: -10 }} />
                            <Ionicons name="cafe" size={40} color="rgba(255,255,255,0.05)" style={{ position: 'absolute', left: '40%', top: 10 }} />
                        </>
                    ) : (
                        <>
                            <Ionicons name="person" size={80} color="rgba(255,255,255,0.1)" style={{ position: 'absolute', right: -20, top: -10 }} />
                            <Ionicons name="school" size={60} color="rgba(255,255,255,0.08)" style={{ position: 'absolute', left: -10, bottom: -10 }} />
                            <Ionicons name="settings" size={40} color="rgba(255,255,255,0.05)" style={{ position: 'absolute', left: '40%', top: 10 }} />
                        </>
                    )}
                </View>

                <View style={styles.avatarContainer}>
                    <Ionicons
                        name={user?.role === 'student' ? 'school' : user?.role === 'cafeteria' ? 'restaurant' : 'person'}
                        size={60}
                        color={colors.white}
                    />
                </View>
                <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
                <View style={styles.roleContainer}>
                    <Ionicons
                        name={user?.role === 'student' ? 'school' : user?.role === 'cafeteria' ? 'restaurant' : 'people'}
                        size={18}
                        color="rgba(255,255,255,0.9)"
                    />
                    <Text style={styles.role}>
                        {user?.role === 'student' ? 'Estudiante' : user?.role === 'parent' ? 'Representante' : 'Cantina'}
                    </Text>
                </View>
            </LinearGradient>

            {user?.role === 'student' && (
                <View style={styles.qrSection}>
                    <Text style={styles.qrTitle}>Mi Código QR</Text>
                    <View style={styles.qrContainer}>
                        <QRCode
                            value={user.id}
                            size={150}
                            color={colors.primary}
                            backgroundColor="white"
                        />
                    </View>
                    <Text style={styles.qrDescription}>Muestra este código para realizar pagos o identificarte</Text>
                </View>
            )}

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Información Personal</Text>
                <View style={styles.card}>
                    <InfoRow icon="mail" label="Correo Electrónico" value={user?.email} />
                    <InfoRow icon="card" label="ID de Usuario" value={user?.id} onCopy />
                    {user?.role === 'student' && (
                        <>
                            <InfoRow icon="school" label={user.gradeType || 'Año'} value={user.grade || 'Pendiente'} />
                            <InfoRow icon="people" label="Sección" value={user.section || 'Pendiente'} />
                        </>
                    )}
                </View>
            </View>

            {user?.role === 'parent' && child && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Información del Estudiante</Text>
                    <View style={styles.card}>
                        <InfoRow icon="person" label="Nombre" value={`${child.firstName} ${child.lastName}`} />
                        <InfoRow icon="mail" label="Correo" value={child.email} />
                        <InfoRow icon="school" label={child.gradeType || 'Año'} value={child.grade || 'Pendiente'} />
                        <InfoRow icon="people" label="Sección" value={child.section || 'Pendiente'} />
                    </View>
                </View>
            )}

            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={styles.smallButtonOutline}
                    onPress={() => (navigation as any).navigate('Settings')}
                    activeOpacity={0.7}
                >
                    <Ionicons name="settings-outline" size={18} color={colors.primary} />
                    <Text style={styles.smallButtonTextOutline}>Editar Perfil</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.smallButtonDestructive}
                    onPress={handleLogout}
                    activeOpacity={0.7}
                >
                    <Ionicons name="log-out-outline" size={18} color={colors.white} />
                    <Text style={styles.smallButtonTextDestructive}>Cerrar Sesión</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    contentContainer: {
        paddingBottom: 40,
    },
    header: {
        backgroundColor: colors.primary,
        alignItems: 'center',
        paddingVertical: 40,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        marginBottom: 20,
        overflow: 'hidden',
    },
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 2,
        borderColor: colors.white,
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.white,
        marginBottom: 8,
    },
    roleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    role: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
        textTransform: 'capitalize',
        fontWeight: '600',
    },
    qrSection: {
        alignItems: 'center',
        marginBottom: 24,
        paddingHorizontal: 20,
    },
    qrTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 12,
    },
    qrContainer: {
        padding: 20,
        backgroundColor: colors.white,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        marginBottom: 12,
    },
    qrDescription: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center',
    },
    section: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 12,
        marginLeft: 4,
    },
    card: {
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        color: colors.textSecondary,
        marginBottom: 2,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoValue: {
        fontSize: 16,
        color: colors.text,
        fontWeight: '500',
    },
    buttonContainer: {
        paddingHorizontal: 20,
        flexDirection: 'row',
        gap: 12,
        marginTop: 10,
    },
    smallButtonOutline: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: colors.primary,
        backgroundColor: colors.white,
        gap: 8,
    },
    smallButtonTextOutline: {
        color: colors.primary,
        fontWeight: '600',
        fontSize: 14,
    },
    smallButtonDestructive: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: '#FF6B6B',
        gap: 8,
        shadowColor: '#FF6B6B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    smallButtonTextDestructive: {
        color: colors.white,
        fontWeight: '600',
        fontSize: 14,
    },
});

export default ProfileScreen;
