import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';
import React, { useEffect, useState } from 'react';
import { AuthRepositoryImpl } from '../../data/repositories/AuthRepositoryImpl';
import { GetCurrentUserUseCase } from '../../domain/usecases/GetCurrentUserUseCase';
import { supabase } from '../../lib/supabase';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';
import SplashScreen from '../screens/SplashScreen';
import { useAuthStore } from '../state/authStore';
import MainNavigator from './MainNavigator';

const Stack = createNativeStackNavigator();

const Root = () => {
  const { isAuthenticated, setUser } = useAuthStore();
  const [isAppReady, setIsAppReady] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  useEffect(() => {
    const initApp = async () => {
      // Mínimo tiempo de splash screen para que se aprecie la animación
      const minSplashTime = new Promise(resolve => setTimeout(resolve, 2000));

      const checkUser = async () => {
        try {
          const authRepository = new AuthRepositoryImpl();
          const getCurrentUserUseCase = new GetCurrentUserUseCase(authRepository);
          const user = await getCurrentUserUseCase.execute();
          setUser(user);
        } catch (error) {
          console.log('No user session found');
        }
      };

      await Promise.all([minSplashTime, checkUser()]);
      setIsAppReady(true);
    };

    initApp();

    // Manejar Deep Links para recuperación de contraseña
    const handleDeepLink = async (url: string | null) => {
      if (!url) return;
      console.log('Deep link recibido:', url);

      // Supabase envía el token en el fragmento (#) de la URL
      if (url.includes('#access_token') || url.includes('access_token=')) {
        // Extraer tokens del fragmento
        const fragment = url.includes('#') ? url.split('#')[1] : url.split('?')[1];
        const params = new URLSearchParams(fragment);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (accessToken && refreshToken) {
          console.log('Tokens extraídos, estableciendo sesión...');
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (!error) {
            setIsResettingPassword(true);
          } else {
            console.error('Error estableciendo sesión de recuperación:', error.message);
          }
        }
      } else if (url.includes('reset-password')) {
        setIsResettingPassword(true);
      }
    };

    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    // Check if app was opened from a link
    Linking.getInitialURL().then((url) => {
      handleDeepLink(url);
    });

    return () => {
      subscription.remove();
    };
  }, [setUser]);

  if (!isAppReady) {
    return <SplashScreen />;
  }

  if (isResettingPassword) {
    return <ResetPasswordScreen onComplete={() => setIsResettingPassword(false)} />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="Main" component={MainNavigator} />
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default Root;
