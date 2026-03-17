import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useCartStore } from '../../state/cartStore';
import { useFavoritesStore } from '../../state/favoritesStore';
import { colors } from '../../theme/colors';

const FavoritesScreen = () => {
    const { favorites, toggleFavorite } = useFavoritesStore();
    const { addItem } = useCartStore();

    const renderFavoriteItem = ({ item }: { item: any }) => {
        return (
            <View style={styles.favoriteCard}>
                <Image
                    source={{ uri: item.imageUrl || 'https://via.placeholder.com/150' }}
                    style={styles.productImage}
                    resizeMode="cover"
                />

                <View style={styles.productInfo}>
                    <View>
                        <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                        <Text style={styles.productDescription} numberOfLines={2}>
                            {item.description || 'Delicioso producto de la cantina'}
                        </Text>
                        <View style={styles.stockBadge}>
                            <Ionicons name="cube-outline" size={12} color={colors.textSecondary} />
                            <Text style={styles.stockText}>{item.stock} disponibles</Text>
                        </View>
                    </View>
                    <Text style={styles.productPrice}>Bs.S {item.price.toFixed(2)}</Text>
                </View>

                <View style={styles.actions}>
                    <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => toggleFavorite(item)}
                    >
                        <Ionicons name="heart-dislike" size={20} color="#E74C3C" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.addButton, item.stock === 0 && styles.addButtonDisabled]}
                        onPress={() => addItem(item)}
                        disabled={item.stock === 0}
                    >
                        <LinearGradient
                            colors={item.stock === 0 ? ['#B2BEC3', '#636E72'] : ['#ED9B40', '#E8872E']}
                            style={styles.addButtonGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Ionicons name="add" size={20} color="#fff" />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#FF4757', '#FF6B81', '#FF4757']}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={StyleSheet.absoluteFill}>
                    <Ionicons name="heart" size={80} color="rgba(255,255,255,0.1)" style={{ position: 'absolute', right: -20, top: -10 }} />
                    <Ionicons name="heart-circle" size={60} color="rgba(255,255,255,0.08)" style={{ position: 'absolute', left: -10, bottom: -10 }} />
                </View>

                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>Mis Favoritos</Text>
                    <Text style={styles.headerSubtitle}>
                        {favorites.length} {favorites.length === 1 ? 'producto' : 'productos'}
                    </Text>
                </View>
            </LinearGradient>

            {favorites.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="heart-outline" size={80} color="#DFE6E9" />
                    <Text style={styles.emptyTitle}>No tienes favoritos aún</Text>
                    <Text style={styles.emptyText}>
                        Toca el corazón en cualquier producto para agregarlo a tus favoritos
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={favorites}
                    renderItem={renderFavoriteItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        paddingTop: 50,
        paddingBottom: 24,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerContent: {
        zIndex: 1,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 6,
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text,
        marginTop: 20,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center',
    },
    listContainer: {
        padding: 20,
    },
    favoriteCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 16,
        flexDirection: 'row',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    productImage: {
        width: 100,
        height: '100%',
        backgroundColor: '#F0F0F0',
    },
    productInfo: {
        flex: 1,
        padding: 12,
        justifyContent: 'space-between',
    },
    productName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 4,
    },
    productDescription: {
        fontSize: 12,
        color: colors.textSecondary,
        marginBottom: 6,
    },
    productPrice: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.secondary,
        marginTop: 4,
    },
    stockBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F6FA',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
        alignSelf: 'flex-start',
    },
    stockText: {
        fontSize: 10,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    actions: {
        width: 64,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
        paddingRight: 12,
        paddingVertical: 12,
    },
    removeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFE5E5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButton: {
        borderRadius: 18,
        overflow: 'hidden',
    },
    addButtonDisabled: {
        opacity: 0.5,
    },
    addButtonGradient: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default FavoritesScreen;
