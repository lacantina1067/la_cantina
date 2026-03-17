import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { UserRepositoryImpl } from '../../../data/repositories/UserRepositoryImpl';
import Input from '../../components/Input';
import { useAuthStore } from '../../state/authStore';
import { colors } from '../../theme/colors';

const SettingsScreen = () => {
  const { user, setUser } = useAuthStore();
  const navigation = useNavigation();
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [grade, setGrade] = useState(user?.grade || '');
  const [section, setSection] = useState(user?.section || '');
  const [gradeType, setGradeType] = useState<'Grado' | 'Año'>(user?.gradeType || 'Año');
  const [avatar, setAvatar] = useState('https://ui-avatars.com/api/?name=' + (user?.firstName || '') + '+' + (user?.lastName || ''));
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [childEmail, setChildEmail] = useState('');
  const [linking, setLinking] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      const userRepository = new UserRepositoryImpl();
      const updatedUser = {
        ...user,
        firstName,
        lastName,
        email,
        grade,
        section,
        gradeType
      };
      await userRepository.updateUser(updatedUser);
      setUser(updatedUser);
      setSuccess(true);
    } catch (e) {
      console.error('Error saving profile:', e);
      setError('Error al guardar los cambios. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkStudent = async () => {
    if (!user || user.role !== 'parent' || !childEmail.trim()) return;
    setLinking(true);
    setError('');
    setSuccess(false);
    try {
      const userRepository = new UserRepositoryImpl();
      const student = await userRepository.getUserByEmail(childEmail.trim());

      if (!student) {
        setError('No se encontró ningún estudiante con ese correo.');
        return;
      }

      if (student.role !== 'student') {
        setError('El correo ingresado no pertenece a un estudiante.');
        return;
      }

      // 1. Vincular en el perfil del padre
      const updatedParent = { ...user, childId: student.id };
      await userRepository.updateUser(updatedParent);

      // 2. Vincular en el perfil del estudiante
      const updatedStudent = { ...student, parentId: user.id };
      await userRepository.updateUser(updatedStudent);

      // 3. Actualizar estado local
      setUser(updatedParent);
      setSuccess(true);
      setChildEmail('');
      Alert.alert('¡Éxito!', `Has vinculado correctamente a ${student.firstName}.`);
    } catch (e) {
      console.error('Error linking student:', e);
      setError('Error al vincular el estudiante.');
    } finally {
      setLinking(false);
    }
  };

  const handleGoBack = () => {
    if ((navigation as any).goBack) (navigation as any).goBack();
  };

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('¡Copiado!', 'El ID de usuario ha sido copiado al portapapeles.');
  };

  const handleChangePhoto = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permiso requerido', 'Se necesita permiso para acceder a la galería.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setAvatar(result.assets[0].uri);
      setSuccess(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient
        colors={['#B8956A', '#A67C52', '#B8956A']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleGoBack} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Configuración</Text>
              <Text style={styles.headerSubtitle}>Actualiza tu perfil y vincula cuentas</Text>
            </View>
          </View>

          <View style={styles.mainCard}>
            <View style={styles.avatarSection}>
              <LinearGradient
                colors={['#ED9B40', '#E8872E']}
                style={styles.avatarGradientBorder}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.avatarInnerBorder}>
                  <Image source={{ uri: avatar }} style={styles.avatar} />
                </View>
              </LinearGradient>
              <TouchableOpacity
                style={styles.editPhotoButton}
                onPress={handleChangePhoto}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#61C9A8', '#4FB896']}
                  style={styles.editPhotoGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="camera" size={20} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <Text style={styles.userName}>{user?.firstName} {user?.lastName}</Text>
            <View style={styles.roleBadge}>
              <Ionicons
                name={user?.role === 'student' ? 'school' : user?.role === 'cafeteria' ? 'restaurant' : 'people'}
                size={14}
                color="#ED9B40"
              />
              <Text style={styles.roleText}>
                {user?.role === 'student' ? 'Estudiante' : user?.role === 'parent' ? 'Representante' : 'Cantina'}
              </Text>
            </View>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Ionicons name="person-circle-outline" size={20} color="#61C9A8" />
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>
                <Ionicons name="information-circle" size={18} color="#B8956A" /> Información Personal
              </Text>

              <Input
                label="Nombre"
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Ingresa tu nombre"
                icon="person"
              />

              <Input
                label="Apellido"
                value={lastName}
                onChangeText={setLastName}
                placeholder="Ingresa tu apellido"
                icon="person-outline"
              />

              <Input
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                autoCapitalize="none"
                keyboardType="email-address"
                icon="mail"
              />

              {user?.role === 'student' && (
                <>
                  <View style={styles.typeSelector}>
                    <TouchableOpacity
                      style={[styles.typeOption, gradeType === 'Grado' && styles.typeOptionActive]}
                      onPress={() => setGradeType('Grado')}
                    >
                      <Text style={[styles.typeText, gradeType === 'Grado' && styles.typeTextActive]}>Grado</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.typeOption, gradeType === 'Año' && styles.typeOptionActive]}
                      onPress={() => setGradeType('Año')}
                    >
                      <Text style={[styles.typeText, gradeType === 'Año' && styles.typeTextActive]}>Año</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.studentFieldsRow}>
                    <View style={{ flex: 1 }}>
                      <Input
                        label={gradeType}
                        value={grade}
                        onChangeText={setGrade}
                        placeholder={`Ej. 5to ${gradeType}`}
                        icon="school"
                      />
                    </View>
                    <View style={{ width: 120 }}>
                      <Input
                        label="Sección"
                        value={section}
                        onChangeText={setSection}
                        placeholder="Ej. A"
                        icon="people"
                      />
                    </View>
                  </View>
                </>
              )}

              {user?.role === 'parent' && (
                <View style={styles.linkSection}>
                  <Text style={styles.sectionTitle}>
                    <Ionicons name="link" size={18} color="#A67C52" /> Vincular Estudiante
                  </Text>
                  <Text style={styles.linkDescription}>
                    Ingresa el correo del estudiante para vincular su cuenta y aprobar sus pedidos.
                  </Text>
                  <View style={styles.linkRow}>
                    <View style={{ flex: 1 }}>
                      <Input
                        label="Email del Estudiante"
                        value={childEmail}
                        onChangeText={setChildEmail}
                        placeholder="Email"
                        autoCapitalize="none"
                        keyboardType="email-address"
                        icon="mail-outline"
                      />
                    </View>
                    <TouchableOpacity
                      style={[styles.linkButton, linking && styles.linkButtonDisabled]}
                      onPress={handleLinkStudent}
                      disabled={linking}
                    >
                      <LinearGradient
                        colors={linking ? ['#B2BEC3', '#636E72'] : ['#ED9B40', '#E8872E']}
                        style={styles.linkButtonGradient}
                      >
                        <Ionicons name="person-add" size={20} color="#fff" />
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <View style={styles.idContainer}>
                <Text style={styles.idLabel}>Mi ID de Usuario</Text>
                <TouchableOpacity
                  style={styles.idWrapper}
                  onPress={() => copyToClipboard(user?.id || '')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.idText} numberOfLines={1}>{user?.id}</Text>
                  <Ionicons name="copy-outline" size={18} color={colors.primary} />
                </TouchableOpacity>
              </View>

              {error ? (
                <View style={styles.messageContainer}>
                  <Ionicons name="alert-circle" size={18} color={colors.danger} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {success ? (
                <View style={styles.messageContainer}>
                  <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                  <Text style={styles.successText}>¡Operación exitosa!</Text>
                </View>
              ) : null}

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleSave}
                disabled={loading}
                style={styles.saveButtonContainer}
              >
                <LinearGradient
                  colors={loading ? ['#B2BEC3', '#636E72'] : ['#61C9A8', '#4FB896']}
                  style={styles.saveButton}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {loading ? (
                    <>
                      <Ionicons name="hourglass-outline" size={20} color="#fff" style={styles.buttonIcon} />
                      <Text style={styles.saveButtonText}>Guardando...</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="save" size={20} color="#fff" style={styles.buttonIcon} />
                      <Text style={styles.saveButtonText}>Guardar Perfil</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.infoFooter}>
            <Ionicons name="shield-checkmark" size={16} color="rgba(255,255,255,0.6)" />
            <Text style={styles.infoFooterText}>Tu información está segura y encriptada</Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#B8956A',
  },
  gradient: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.3,
  },
  mainCard: {
    backgroundColor: '#fff',
    borderRadius: 30,
    marginHorizontal: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  avatarGradientBorder: {
    width: 130,
    height: 130,
    borderRadius: 65,
    padding: 4,
    shadowColor: '#ED9B40',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarInnerBorder: {
    width: '100%',
    height: '100%',
    borderRadius: 61,
    backgroundColor: '#fff',
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  editPhotoButton: {
    position: 'absolute',
    bottom: 0,
    right: '32%',
    borderRadius: 20,
    shadowColor: '#61C9A8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  editPhotoGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#B8956A',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5E6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'center',
    gap: 6,
  },
  roleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ED9B40',
    letterSpacing: 0.5,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E6EAFC',
  },
  formSection: {
    width: '100%',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#B8956A',
    marginBottom: 20,
    letterSpacing: 0.3,
  },
  studentFieldsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  idContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#EEF0F2',
  },
  idLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#636E72',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  idWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  idText: {
    fontSize: 14,
    color: '#2D3436',
    fontWeight: '500',
    flex: 1,
    marginRight: 10,
  },
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: '#F5F6FA',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  typeOption: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  typeOptionActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  typeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#636E72',
  },
  typeTextActive: {
    color: colors.primary,
  },
  linkSection: {
    marginTop: 10,
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EEF0F2',
  },
  linkDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 18,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  linkButton: {
    height: 56,
    width: 56,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  linkButtonDisabled: {
    opacity: 0.7,
  },
  linkButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  successText: {
    color: colors.success,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  saveButtonContainer: {
    marginTop: 8,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#61C9A8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  saveButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 16,
  },
  buttonIcon: {
    marginRight: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  infoFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    gap: 8,
    paddingHorizontal: 20,
  },
  infoFooterText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.3,
  },
});

export default SettingsScreen;
