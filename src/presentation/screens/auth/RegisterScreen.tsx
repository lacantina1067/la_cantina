import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AuthRepositoryImpl } from '../../../data/repositories/AuthRepositoryImpl';
import { UserRepositoryImpl } from '../../../data/repositories/UserRepositoryImpl';
import { UserRole } from '../../../domain/entities/User';
import { RegisterUseCase } from '../../../domain/usecases/RegisterUseCase';
import { hasBadWords, isValidEmail, isValidName, isValidPassword } from '../../../utils/validation';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { useAuthStore } from '../../state/authStore';
import { colors } from '../../theme/colors';

const RegisterScreen = () => {
  const navigation = useNavigation();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [childEmail, setChildEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    setLoading(true);
    setError('');

    // Validations
    if (!isValidName(firstName)) {
      setError('El nombre ingresado no es válido. Debe tener entre 2 y 50 caracteres alfabéticos.');
      setLoading(false);
      return;
    }
    if (hasBadWords(firstName)) {
      setError('El nombre contiene palabras no permitidas.');
      setLoading(false);
      return;
    }

    if (!isValidName(lastName)) {
      setError('El apellido ingresado no es válido. Debe tener entre 2 y 50 caracteres alfabéticos.');
      setLoading(false);
      return;
    }
    if (hasBadWords(lastName)) {
      setError('El apellido contiene palabras no permitidas.');
      setLoading(false);
      return;
    }

    if (!isValidEmail(email)) {
      setError('El correo electrónico no es válido.');
      setLoading(false);
      return;
    }

    if (!isValidPassword(password)) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      setLoading(false);
      return;
    }

    if (role === 'parent') {
      if (!childEmail.trim()) {
        setError('El email del estudiante es obligatorio para representantes.');
        setLoading(false);
        return;
      }
      if (!isValidEmail(childEmail)) {
        setError('El email del estudiante no tiene un formato válido.');
        setLoading(false);
        return;
      }
    }

    try {
      const authRepository = new AuthRepositoryImpl();
      const registerUseCase = new RegisterUseCase(authRepository);
      const user = await registerUseCase.execute({
        email,
        password,
        firstName,
        lastName,
        role,
      });

      // Si es representante y proporcionó un correo de hijo, intentar vincular
      if (role === 'parent' && childEmail.trim()) {
        try {
          const userRepository = new UserRepositoryImpl();
          const student = await userRepository.getUserByEmail(childEmail.trim());

          if (student && student.role === 'student') {
            // 1. Vincular en el perfil del padre (el usuario que se acaba de registrar)
            const updatedParent = { ...user, childId: student.id };
            await userRepository.updateUser(updatedParent);

            // 2. Vincular en el perfil del estudiante
            const updatedStudent = { ...student, parentId: user.id };
            await userRepository.updateUser(updatedStudent);

            // Usar el usuario actualizado para el login local
            login(updatedParent);
            return;
          }
        } catch (linkError) {
          console.error('Error linking child during registration:', linkError);
          // No bloqueamos el flujo principal si falla el vínculo, el usuario ya se creó
        }
      }

      login(user);
    } catch (e) {
      setError('Error al registrarse. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const RoleOption = ({ value, label, icon }: { value: UserRole; label: string; icon: string }) => {
    const isSelected = role === value;
    return (
      <TouchableOpacity
        style={[styles.roleOption, isSelected && styles.roleOptionSelected]}
        onPress={() => setRole(value)}
        activeOpacity={0.8}
      >
        <View style={[styles.iconContainer, isSelected && styles.iconContainerSelected]}>
          <Ionicons
            name={icon as any}
            size={24}
            color={isSelected ? colors.white : colors.textSecondary}
          />
        </View>
        <Text style={[styles.roleLabel, isSelected && styles.roleLabelSelected]}>{label}</Text>
        {isSelected && (
          <View style={styles.checkIcon}>
            <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Crear Cuenta</Text>
          <Text style={styles.subtitle}>Únete a CantiApp hoy</Text>
        </View>

        <View style={styles.formContainer}>
          <Input
            label="Nombre"
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Ingresa tu nombre"
            icon="person-outline"
          />
          <Input
            label="Apellido"
            value={lastName}
            onChangeText={setLastName}
            placeholder="Ingresa tu apellido"
            icon="person-outline"
          />
          <Input
            label="Correo Electrónico"
            value={email}
            onChangeText={setEmail}
            placeholder="Ingresa tu correo"
            autoCapitalize="none"
            keyboardType="email-address"
            icon="mail-outline"
          />
          <Input
            label="Contraseña"
            value={password}
            onChangeText={setPassword}
            placeholder="Ingresa tu contraseña"
            secureTextEntry
            icon="lock-closed-outline"
          />

          {role === 'parent' && (
            <Input
              label="Email del Estudiante (Obligatorio)"
              value={childEmail}
              onChangeText={setChildEmail}
              placeholder="Email del hijo para vincular"
              autoCapitalize="none"
              keyboardType="email-address"
              icon="mail-outline"
            />
          )}

          <View style={styles.roleContainer}>
            <Text style={styles.label}>Selecciona tu Rol</Text>
            <View style={styles.rolesGrid}>
              <RoleOption value="student" label="Estudiante" icon="school-outline" />
              <RoleOption value="parent" label="Representante" icon="people-outline" />
              <RoleOption value="cafeteria" label="Cantina" icon="restaurant-outline" />
            </View>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.buttonContainer}>
            <Button title="Registrarse" onPress={handleRegister} loading={loading} />
          </View>

          <View style={styles.loginLinkContainer}>
            <Text style={styles.loginLinkText}>¿Ya tienes una cuenta?</Text>
            <TouchableOpacity
              style={styles.loginButtonOutline}
              onPress={() => (navigation as any).navigate('Login')}
              activeOpacity={0.7}
            >
              <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    paddingTop: 60,
  },
  headerContainer: {
    marginBottom: 32,
    alignItems: 'center',
    width: '100%',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 4,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F2F5',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  formContainer: {
    width: '100%',
  },
  roleContainer: {
    marginBottom: 24,
    marginTop: 8,
  },
  label: {
    fontSize: 14,
    marginBottom: 12,
    color: colors.textSecondary,
    fontWeight: '500',
    marginLeft: 4,
  },
  rolesGrid: {
    gap: 12,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    height: 72,
  },
  roleOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: '#FFF8F0', // Light orange tint
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F2F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconContainerSelected: {
    backgroundColor: colors.primary,
  },
  roleLabel: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
    flex: 1,
  },
  roleLabelSelected: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  checkIcon: {
    marginLeft: 8,
  },
  buttonContainer: {
    marginTop: 10,
  },
  errorText: {
    color: colors.danger,
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 14,
  },
  loginLinkContainer: {
    marginTop: 24,
    width: '100%',
    alignItems: 'center',
    gap: 16,
    paddingBottom: 20,
  },
  loginLinkText: {
    color: colors.textSecondary,
    fontSize: 15,
  },
  loginButtonOutline: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default RegisterScreen;
