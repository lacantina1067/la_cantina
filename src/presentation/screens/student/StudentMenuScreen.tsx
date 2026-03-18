import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, FlatList, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ProductRepositoryImpl } from '../../../data/repositories/ProductRepositoryImpl';
import { TokenRepositoryImpl } from '../../../data/repositories/TokenRepositoryImpl';
import { Product } from '../../../domain/entities/Product';
import { GetProductsUseCase } from '../../../domain/usecases/GetProductsUseCase';
import { useAuthStore } from '../../state/authStore';
import { useCartStore } from '../../state/cartStore';
import { useFavoritesStore } from '../../state/favoritesStore';
import { colors } from '../../theme/colors';

const { width } = Dimensions.get('window');

const ProductCard = ({ item, onAdd, onToggleFavorite, isFavorite, isAdded }: { item: Product, onAdd: (p: Product) => void, onToggleFavorite: (p: Product) => void, isFavorite: boolean, isAdded: boolean }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const isLowStock = item.stock < 20;

    const playSound = async () => {
        try {
            const { sound } = await Audio.Sound.createAsync(
                { uri: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3' }
            );
            await sound.playAsync();
            setTimeout(() => {
                sound.unloadAsync();
            }, 1000);
        } catch (error) {
            console.log('Error playing sound', error);
        }
    };

    const handleFavoritePress = async () => {
        await playSound();
        Animated.sequence([
            Animated.spring(scaleAnim, {
                toValue: 1.2,
                friction: 3,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 3,
                useNativeDriver: true,
            }),
        ]).start();
        onToggleFavorite(item);
    };

    return (
        <View style={styles.cardContainer}>
            <View style={styles.cardImageContainer}>
                <Image 
                    source={{ uri: item.imageUrl || 'https://via.placeholder.com/150' }} 
                    style={styles.cardImage} 
                    onError={(e) => console.log('Image load error:', e.nativeEvent.error)}
                />
                {item.stock === 0 && (
                    <View style={styles.outOfStockOverlay}>
                        <Text style={styles.outOfStockText}>Agotado</Text>
                    </View>
                )}
                <TouchableOpacity style={styles.favoriteButton} onPress={handleFavoritePress} activeOpacity={0.7}>
                    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                        <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={18} color={isFavorite ? '#FF4757' : colors.textSecondary} />
                    </Animated.View>
                </TouchableOpacity>
            </View>

            <View style={styles.cardContent}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.cardPrice}>Bs.S {item.price.toFixed(2)}</Text>

                <View style={styles.cardFooter}>
                    <View style={[styles.stockBadge, isLowStock && styles.stockBadgeLow]}>
                        <Text style={[styles.stockText, isLowStock && styles.stockTextLow]}>
                            {item.stock === 0 ? 'Sin stock' : `Quedan ${item.stock}`}
                        </Text>
                    </View>
                    <TouchableOpacity style={[styles.addButton, isAdded && styles.addButtonSuccess]} onPress={() => onAdd(item)} disabled={item.stock === 0}>
                        <Ionicons name={isAdded ? 'checkmark' : 'add'} size={20} color={colors.white} />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const StudentMenuScreen = () => {
    const navigation = useNavigation();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const { addItem, getItemCount } = useCartStore();
    const { toggleFavorite, isFavorite } = useFavoritesStore();
    const { user } = useAuthStore();
    const cartItemCount = getItemCount();
    const [addedProductId, setAddedProductId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<'all' | 'desayunos' | 'almuerzos' | 'bebidas' | 'dulces'>('all');
    const [balance, setBalance] = useState(0);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const productRepository = new ProductRepositoryImpl();
                const getProductsUseCase = new GetProductsUseCase(productRepository);
                const result = await getProductsUseCase.execute();
                setProducts(result);

                if (user) {
                    const tokenRepository = new TokenRepositoryImpl();
                    const balanceResult = await tokenRepository.getTokenBalance(user.id);
                    setBalance(balanceResult);
                }

                Animated.parallel([
                    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
                    Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }),
                ]).start();
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleAddToCart = (product: Product) => {
        addItem(product);
        setAddedProductId(product.id);
        setTimeout(() => setAddedProductId(null), 1000);
    };

    const getCategorizedProducts = () => {
        const categorized = {
            desayunos: [] as Product[],
            almuerzos: [] as Product[],
            bebidas: [] as Product[],
            dulces: [] as Product[]
        };

        products.forEach(product => {
            const name = product.name.toLowerCase();
            if (name.includes('empanada') || name.includes('arepa') || name.includes('tequeño') || name.includes('pastel') || name.includes('desayuno') || name.includes('cachito')) {
                categorized.desayunos.push(product);
            } else if (name.includes('jugo') || name.includes('refresco') || name.includes('agua') || name.includes('cafe') || name.includes('té') || name.includes('bebida') || name.includes('malta')) {
                categorized.bebidas.push(product);
            } else if (name.includes('torta') || name.includes('dulce') || name.includes('chocolate') || name.includes('helado') || name.includes('galleta') || name.includes('postre') || name.includes('dona') || name.includes('pringles')) {
                categorized.dulces.push(product);
            } else {
                categorized.almuerzos.push(product);
            }
        });

        return categorized;
    };

    const categories = getCategorizedProducts();

    const CategorySection = ({ title, data, icon, color }: { title: string, data: Product[], icon: any, color: string }) => {
        const filteredData = searchQuery ? data.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())) : data;

        if (data.length === 0) {
            return (
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeader}>
                        <View style={[styles.sectionIconContainer, { backgroundColor: color }]}>
                            <Ionicons name={icon} size={18} color="#fff" />
                        </View>
                        <Text style={styles.sectionTitle}>{title}</Text>
                    </View>
                    <View style={styles.emptyCategoryContainer}>
                        <Ionicons name="fast-food-outline" size={40} color="#DFE6E9" />
                        <Text style={styles.emptyCategoryText}>No hay productos en {title.toLowerCase()}</Text>
                    </View>
                </View>
            );
        }

        if (filteredData.length === 0) return null;

        return (
            <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                    <View style={[styles.sectionIconContainer, { backgroundColor: color }]}>
                        <Ionicons name={icon} size={18} color="#fff" />
                    </View>
                    <Text style={styles.sectionTitle}>{title}</Text>
                    <TouchableOpacity onPress={() => {
                        if (title === 'Desayunos') setSelectedCategory('desayunos');
                        else if (title === 'Almuerzos') setSelectedCategory('almuerzos');
                        else if (title === 'Bebidas') setSelectedCategory('bebidas');
                        else if (title.includes('Dulces')) setSelectedCategory('dulces');
                    }}>
                        <Text style={styles.seeAllText}>Ver todo</Text>
                    </TouchableOpacity>
                </View>
                <FlatList
                    data={filteredData}
                    renderItem={({ item }) => (
                        <ProductCard
                            item={item}
                            onAdd={handleAddToCart}
                            onToggleFavorite={toggleFavorite}
                            isFavorite={isFavorite(item.id)}
                            isAdded={addedProductId === item.id}
                        />
                    )}
                    keyExtractor={(item) => item.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalListContent}
                />
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <Ionicons name="restaurant" size={60} color={colors.primary} />
                <Text style={styles.loadingText}>Cargando menú...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#B8956A', '#A67C52', '#B8956A']} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <View style={StyleSheet.absoluteFill}>
                    <Ionicons name="pizza" size={80} color="rgba(255,255,255,0.1)" style={{ position: 'absolute', right: -20, top: -10 }} />
                    <Ionicons name="fast-food" size={60} color="rgba(255,255,255,0.08)" style={{ position: 'absolute', left: -10, bottom: -10 }} />
                </View>

                <View style={styles.headerContent}>
                    <View style={styles.headerLeft}>
                        <Text style={styles.headerTitle}>Menú del Día</Text>
                        <View style={styles.balanceContainer}>
                            <View style={styles.balanceIconBadge}>
                                <Ionicons name="wallet" size={14} color="#B8956A" />
                            </View>
                            <View>
                                <Text style={styles.balanceLabel}>Disponible</Text>
                                <Text style={styles.balanceValue}>Bs.S {balance.toFixed(2)}</Text>
                            </View>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.headerCartButton} onPress={() => (navigation as any).navigate('Cart')}>
                        <Ionicons name="cart" size={24} color="#fff" />
                        {cartItemCount > 0 && (
                            <View style={styles.headerCartBadge}>
                                <Text style={styles.headerCartBadgeText}>{cartItemCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <Animated.ScrollView style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
                    <TextInput style={styles.searchInput} placeholder="Buscar comida..." placeholderTextColor={colors.textSecondary} value={searchQuery} onChangeText={setSearchQuery} />
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
                    <TouchableOpacity style={[styles.filterChip, selectedCategory === 'all' && styles.filterChipActive]} onPress={() => setSelectedCategory('all')}>
                        <Ionicons name="apps" size={16} color={selectedCategory === 'all' ? '#fff' : colors.textSecondary} />
                        <Text style={[styles.filterChipText, selectedCategory === 'all' && styles.filterChipTextActive]}>Todos</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.filterChip, selectedCategory === 'desayunos' && styles.filterChipActive]} onPress={() => setSelectedCategory('desayunos')}>
                        <Ionicons name="sunny" size={16} color={selectedCategory === 'desayunos' ? '#fff' : colors.textSecondary} />
                        <Text style={[styles.filterChipText, selectedCategory === 'desayunos' && styles.filterChipTextActive]}>Desayunos</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.filterChip, selectedCategory === 'almuerzos' && styles.filterChipActive]} onPress={() => setSelectedCategory('almuerzos')}>
                        <Ionicons name="restaurant" size={16} color={selectedCategory === 'almuerzos' ? '#fff' : colors.textSecondary} />
                        <Text style={[styles.filterChipText, selectedCategory === 'almuerzos' && styles.filterChipTextActive]}>Almuerzos</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.filterChip, selectedCategory === 'bebidas' && styles.filterChipActive]} onPress={() => setSelectedCategory('bebidas')}>
                        <Ionicons name="water" size={16} color={selectedCategory === 'bebidas' ? '#fff' : colors.textSecondary} />
                        <Text style={[styles.filterChipText, selectedCategory === 'bebidas' && styles.filterChipTextActive]}>Bebidas</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.filterChip, selectedCategory === 'dulces' && styles.filterChipActive]} onPress={() => setSelectedCategory('dulces')}>
                        <Ionicons name="ice-cream" size={16} color={selectedCategory === 'dulces' ? '#fff' : colors.textSecondary} />
                        <Text style={[styles.filterChipText, selectedCategory === 'dulces' && styles.filterChipTextActive]}>Dulces</Text>
                    </TouchableOpacity>
                </ScrollView>

                {(selectedCategory === 'all' || selectedCategory === 'desayunos') && <CategorySection title="Desayunos" data={categories.desayunos} icon="sunny" color="#F1C40F" />}
                {(selectedCategory === 'all' || selectedCategory === 'almuerzos') && <CategorySection title="Almuerzos" data={categories.almuerzos} icon="restaurant" color="#E67E22" />}
                {(selectedCategory === 'all' || selectedCategory === 'bebidas') && <CategorySection title="Bebidas" data={categories.bebidas} icon="water" color="#3498DB" />}
                {(selectedCategory === 'all' || selectedCategory === 'dulces') && <CategorySection title="Dulces y Postres" data={categories.dulces} icon="ice-cream" color="#E91E63" />}

                {(!categories.desayunos.length && !categories.almuerzos.length && !categories.bebidas.length && !categories.dulces.length) && (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="fast-food-outline" size={60} color="#ccc" />
                        <Text style={styles.emptyText}>No hay productos disponibles</Text>
                    </View>
                )}
            </Animated.ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 10, color: colors.textSecondary },
    header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    headerLeft: { flex: 1 },
    headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 8, letterSpacing: 0.5 },
    balanceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 12,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)'
    },
    balanceIconBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8
    },
    balanceLabel: { fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
    balanceValue: { fontSize: 16, color: '#fff', fontWeight: 'bold', letterSpacing: 0.5 },
    headerCartButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)'
    },
    headerCartBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: '#FF4757', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
    headerCartBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 20, marginTop: 15, borderRadius: 16, paddingHorizontal: 16, height: 56, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8, marginBottom: 16, borderWidth: 1, borderColor: '#E8E8E8' },
    searchIcon: { marginRight: 10 },
    searchInput: { flex: 1, fontSize: 15, color: colors.text },
    filtersContainer: { paddingHorizontal: 20, marginBottom: 10 },
    filterChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#fff', marginRight: 10, borderWidth: 1, borderColor: '#E8E8E8', gap: 6 },
    filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    filterChipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
    filterChipTextActive: { color: '#fff', fontWeight: 'bold' },
    sectionContainer: { marginTop: 20 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 15 },
    sectionIconContainer: { width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2D3436', flex: 1 },
    seeAllText: { fontSize: 13, color: colors.primary, fontWeight: '600' },
    emptyCategoryContainer: { alignItems: 'center', paddingVertical: 30, paddingHorizontal: 20 },
    emptyCategoryText: { fontSize: 14, color: colors.textSecondary, marginTop: 10 },
    horizontalListContent: { paddingHorizontal: 20, paddingBottom: 10 },
    cardContainer: { width: width * 0.42, backgroundColor: '#fff', borderRadius: 16, marginRight: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3, overflow: 'hidden' },
    cardImageContainer: { height: 120, width: '100%', position: 'relative', backgroundColor: '#f0f0f0' },
    cardImage: { ...StyleSheet.absoluteFillObject, width: undefined, height: undefined, resizeMode: 'cover' },
    outOfStockOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    outOfStockText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
    favoriteButton: { position: 'absolute', top: 8, right: 8, backgroundColor: '#fff', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
    cardContent: { padding: 10 },
    cardTitle: { fontSize: 14, fontWeight: 'bold', color: '#2D3436', marginBottom: 4 },
    cardPrice: { fontSize: 14, fontWeight: 'bold', color: colors.secondary, marginBottom: 8 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    stockBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F3F4',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4
    },
    stockBadgeLow: {
        backgroundColor: '#FDEDEC',
    },
    stockText: {
        fontSize: 10,
        color: '#636E72',
        fontWeight: '600',
        letterSpacing: 0.3
    },
    stockTextLow: {
        color: '#E74C3C',
    },
    addButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', shadowColor: colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 },
    addButtonSuccess: { backgroundColor: '#2ECC71' },
    emptyContainer: { alignItems: 'center', marginTop: 50 },
    emptyText: { marginTop: 10, color: colors.textSecondary }
});

export default StudentMenuScreen;
