import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, Text, View } from 'react-native';

const { width } = Dimensions.get('window');
const APP_NAME = "La Cantina";
const ICONS: Array<keyof typeof Ionicons.glyphMap> = ['fast-food', 'pizza', 'nutrition', 'cafe', 'ice-cream'];

const SplashScreen = () => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const logoBounceAnim = useRef(new Animated.Value(0)).current;

    const [currentIconIndex, setCurrentIconIndex] = useState(0);

    // Crear valores animados para cada letra
    const letterAnims = useRef(
        APP_NAME.split('').map(() => new Animated.Value(0))
    ).current;

    useEffect(() => {
        // 1. Animación de entrada general
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start();

        // 2. Animación de rebote sutil para el logo
        Animated.loop(
            Animated.sequence([
                Animated.timing(logoBounceAnim, {
                    toValue: -10,
                    duration: 1500,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(logoBounceAnim, {
                    toValue: 0,
                    duration: 1500,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // 3. Animación de letras (Ola suave)
        const animateLetters = () => {
            const animations = letterAnims.map((anim) => {
                return Animated.sequence([
                    Animated.timing(anim, {
                        toValue: -10,
                        duration: 400,
                        useNativeDriver: true,
                        easing: Easing.out(Easing.quad),
                    }),
                    Animated.timing(anim, {
                        toValue: 0,
                        duration: 400,
                        useNativeDriver: true,
                        easing: Easing.in(Easing.quad),
                    }),
                    Animated.delay(2000),
                ]);
            });

            Animated.loop(
                Animated.stagger(150, animations)
            ).start();
        };

        setTimeout(animateLetters, 800);
    }, []);

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#B8956A', '#A67C52', '#8C6239']}
                style={styles.background}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            <Animated.View
                style={[
                    styles.content,
                    {
                        opacity: fadeAnim,
                        transform: [
                            { scale: scaleAnim },
                            { translateY: logoBounceAnim }
                        ],
                    },
                ]}
            >
                {/* Logo Principal */}
                <View style={styles.logoWrapper}>
                    <LinearGradient
                        colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.05)']}
                        style={styles.logoCircle}
                    >
                        <Ionicons name="restaurant" size={80} color="#fff" />
                    </LinearGradient>
                </View>

                {/* Título de la App */}
                <View style={styles.titleContainer}>
                    {APP_NAME.split('').map((letter, index) => (
                        <Animated.Text
                            key={index}
                            style={[
                                styles.letter,
                                {
                                    transform: [{ translateY: letterAnims[index] }],
                                },
                            ]}
                        >
                            {letter}
                        </Animated.Text>
                    ))}
                </View>

                <View style={styles.divider} />
                <Text style={styles.subtitle}>Sabor que conecta</Text>
            </Animated.View>

            <View style={styles.footer}>
                <Text style={styles.footerText}>Disfruta la experiencia</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    background: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoWrapper: {
        marginBottom: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 8,
    },
    logoCircle: {
        width: 150,
        height: 150,
        borderRadius: 75,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    titleContainer: {
        flexDirection: 'row',
        height: 60,
        alignItems: 'baseline',
    },
    letter: {
        fontSize: 48,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: 2,
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 6,
    },
    divider: {
        width: 40,
        height: 3,
        backgroundColor: '#fff',
        marginVertical: 15,
        borderRadius: 2,
        opacity: 0.8,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.85)',
        letterSpacing: 5,
        fontWeight: '400',
        textTransform: 'uppercase',
    },
    footer: {
        position: 'absolute',
        bottom: 50,
    },
    footerText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 12,
        letterSpacing: 2,
        textTransform: 'uppercase',
    }
});

export default SplashScreen;
