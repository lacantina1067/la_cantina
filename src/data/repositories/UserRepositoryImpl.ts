import { User, UserRole } from '../../domain/entities/User';
import { UserRepository } from '../../domain/repositories/UserRepository';
import { supabase } from '../../lib/supabase';

const roleToApp: Record<string, UserRole> = {
  'estudiante': 'student',
  'padre': 'parent',
  'admin': 'cafeteria',
};

const roleToSupabase: Record<UserRole, string> = {
  'student': 'estudiante',
  'parent': 'padre',
  'cafeteria': 'admin',
};

export class UserRepositoryImpl implements UserRepository {
  async getUserById(id: string): Promise<User | null> {
    console.log('Getting user by id', id);

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      console.error('Error fetching user:', error);
      return null;
    }

    return {
      id: data.id,
      email: data.email || '',
      role: roleToApp[data.rol] || 'student',
      firstName: data.nombre.split(' ')[0] || '',
      lastName: data.nombre.split(' ').slice(1).join(' ') || '',
      parentId: data.parent_id,
      childId: data.child_id,
      grade: data.grado,
      section: data.seccion,
      gradeType: data.tipo_grado,
    };
  }

  async getUserByEmail(email: string): Promise<User | null> {
    console.log('Getting user by email', email);

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (error || !data) {
      console.error('Error fetching user by email:', error);
      return null;
    }

    return {
      id: data.id,
      email: data.email || '',
      role: roleToApp[data.rol] || 'student',
      firstName: data.nombre.split(' ')[0] || '',
      lastName: data.nombre.split(' ').slice(1).join(' ') || '',
      parentId: data.parent_id,
      childId: data.child_id,
      grade: data.grado,
      section: data.seccion,
      gradeType: data.tipo_grado,
    };
  }

  async updateUser(user: User): Promise<User> {
    console.log('Updating user profile', user.id);

    const { error } = await supabase
      .from('profiles')
      .update({
        nombre: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email,
        rol: roleToSupabase[user.role],
        grado: user.grade,
        seccion: user.section,
        tipo_grado: user.gradeType,
        parent_id: user.parentId,
        child_id: user.childId,
      })
      .eq('id', user.id);

    if (error) {
      console.error('Error updating user:', error);
      throw new Error(error.message);
    }

    return user;
  }
}
