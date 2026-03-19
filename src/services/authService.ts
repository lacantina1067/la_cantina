import { supabase } from '../lib/supabase';


export type AppRole = 'admin' | 'estudiante' | 'padre';

export const authService = {

    async signUp(email: string, password: string, nombre: string, rol: AppRole) {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    nombre: nombre,
                    rol: rol,
                },
            },
        });

        if (error) throw error;
        return data;
    },


    async signIn(email: string, password: string) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;
        return data;
    },


    async getCurrentProfile() {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return null;

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (error) throw error;
        return data;
    },


    async signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    }
};