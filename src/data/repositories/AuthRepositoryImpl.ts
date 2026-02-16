import { User, UserRole } from '../../domain/entities/User';
import { AuthRepository } from '../../domain/repositories/AuthRepository';
import { supabase } from '../../lib/supabase';

export class AuthRepositoryImpl implements AuthRepository {
  async login(email: string, password: string): Promise<User> {
    console.log('Logging in with Supabase:', email);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Login error:', error);
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('No user data returned');
    }

    // Obtener el perfil del usuario desde la tabla profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      console.error('Profile error:', profileError);
      throw new Error('Error al obtener perfil de usuario');
    }

    // Mapear el rol de Supabase al rol de la app
    const roleMap: Record<string, UserRole> = {
      'estudiante': 'student',
      'padre': 'parent',
      'admin': 'cafeteria',
    };

    return {
      id: data.user.id,
      email: data.user.email || '',
      role: roleMap[profile.rol] || 'student',
      firstName: profile.nombre.split(' ')[0] || '',
      lastName: profile.nombre.split(' ').slice(1).join(' ') || '',
    };
  }

  async register(userData: Omit<User, 'id'> & { password: string }): Promise<User> {
    console.log('Registering user with Supabase:', userData.email);

    const { password, role, firstName, lastName, ...rest } = userData;

    // Mapear el rol de la app al rol de Supabase
    const roleMap: Record<UserRole, string> = {
      'student': 'estudiante',
      'parent': 'padre',
      'cafeteria': 'admin',
    };

    const supabaseRole = roleMap[role];
    const nombre = `${firstName} ${lastName}`.trim();

    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password,
      options: {
        data: {
          nombre,
          rol: supabaseRole,
        },
      },
    });

    if (error) {
      console.error('Registration error:', error);
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('No user data returned');
    }

    return {
      id: data.user.id,
      email: data.user.email || '',
      role,
      firstName,
      lastName,
    };
  }

  async logout(): Promise<void> {
    console.log('Logging out from Supabase');
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout error:', error);
      throw new Error(error.message);
    }
  }

  async getCurrentUser(): Promise<User | null> {
    console.log('Getting current user from Supabase');

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    // Obtener el perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile error:', profileError);
      return null;
    }

    // Mapear el rol de Supabase al rol de la app
    const roleMap: Record<string, UserRole> = {
      'estudiante': 'student',
      'padre': 'parent',
      'admin': 'cafeteria',
    };

    return {
      id: user.id,
      email: user.email || '',
      role: roleMap[profile.rol] || 'student',
      firstName: profile.nombre.split(' ')[0] || '',
      lastName: profile.nombre.split(' ').slice(1).join(' ') || '',
    };
  }
}
