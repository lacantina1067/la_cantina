export type UserRole = 'student' | 'parent' | 'cafeteria';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  // For students
  parentId?: string;
  grade?: string;
  section?: string;
  gradeType?: 'Grado' | 'Año';
  // For parents
  childId?: string;
}
