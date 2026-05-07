import * as Linking from "expo-linking";
import { User, UserRole } from "../../domain/entities/User";
import { AuthRepository } from "../../domain/repositories/AuthRepository";
import { supabase } from "../../lib/supabase";

export class AuthRepositoryImpl implements AuthRepository {
  async login(email: string, password: string): Promise<User> {
    const normalizedEmail = email.trim().toLowerCase();
    console.log("Logging in with Supabase:", normalizedEmail);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) {
      console.error("Login error:", error);
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error("No user data returned");
    }

    // Obtener el perfil del usuario desde la tabla profiles
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single();

    if (profileError) {
      console.error("Profile error:", profileError);
      throw new Error(
        "No se pudo cargar el perfil del usuario. Verifica el trigger on_auth_user_created en Supabase.",
      );
    }

    // Mapear el rol de Supabase al rol de la app
    const roleMap: Record<string, UserRole> = {
      estudiante: "student",
      padre: "parent",
      admin: "cafeteria",
    };

    return {
      id: data.user.id,
      email: data.user.email || "",
      role: roleMap[profile.rol] || "student",
      firstName: profile.nombre.split(" ")[0] || "",
      lastName: profile.nombre.split(" ").slice(1).join(" ") || "",
      parentId: profile.parent_id,
      childId: profile.child_id,
      grade: profile.grado,
      section: profile.seccion,
      gradeType: profile.tipo_grado,
    };
  }

  async register(
    userData: Omit<User, "id"> & { password: string },
  ): Promise<User> {
    const normalizedEmail = userData.email.trim().toLowerCase();
    console.log("Registering user with Supabase:", normalizedEmail);

    const { password, role, firstName, lastName } = userData;

    // Mapear el rol de la app al rol de Supabase
    const roleMap: Record<UserRole, string> = {
      student: "estudiante",
      parent: "padre",
      cafeteria: "admin",
    };

    const supabaseRole = roleMap[role];
    const nombre = `${firstName} ${lastName}`.trim();

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          nombre,
          rol: supabaseRole,
          parent_id: userData.parentId,
          child_id: userData.childId,
        },
      },
    });

    if (error) {
      console.error("Registration error:", error);
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error("No user data returned");
    }

    return {
      id: data.user.id,
      email: data.user.email || normalizedEmail,
      role,
      firstName,
      lastName,
    };
  }

  async logout(): Promise<void> {
    console.log("Logging out from Supabase");
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Logout error:", error);
      throw new Error(error.message);
    }
  }

  async getCurrentUser(): Promise<User | null> {
    console.log("Getting current user from Supabase");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    // Obtener el perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Profile error:", profileError);
      return null;
    }

    // Mapear el rol de Supabase al rol de la app
    const roleMap: Record<string, UserRole> = {
      estudiante: "student",
      padre: "parent",
      admin: "cafeteria",
    };

    return {
      id: user.id,
      email: user.email || "",
      role: roleMap[profile.rol] || "student",
      firstName: profile.nombre.split(" ")[0] || "",
      lastName: profile.nombre.split(" ").slice(1).join(" ") || "",
      parentId: profile.parent_id,
      childId: profile.child_id,
      grade: profile.grado,
      section: profile.seccion,
      gradeType: profile.tipo_grado,
    };
  }

  async resetPassword(email: string): Promise<void> {
    const redirectUrl = Linking.createURL("/");
    console.log(
      "Requesting password reset for:",
      email,
      "redirecting to:",
      redirectUrl,
    );

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      console.error("Reset password error:", error);
      throw new Error(error.message);
    }
  }
}
