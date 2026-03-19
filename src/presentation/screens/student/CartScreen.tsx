import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { FlatList, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuthStore } from '../../state/authStore';
import { CartItem, useCartStore } from '../../state/cartStore';
import { useOrdersStore } from '../../state/ordersStore';
import { colors } from '../../theme/colors';

const CartScreen = () => {
    const navigation = useNavigation();
    const { user } = useAuthStore();
    const { items, removeItem, updateQuantity, clearCart, getTotal } = useCartStore();
    const { addOrder } = useOrdersStore();
    const [loading, setLoading] = useState(false);

    // Modal states
    const [modalVisible, setModalVisible] = useState(false);
    const [modalType, setModalType] = useState<'success' | 'error'>('success');
    const [modalMessage, setModalMessage] = useState({ title: '', body: '' });

    // Clear Cart Confirmation Modal state
    const [confirmModalVisible, setConfirmModalVisible] = useState(false);

    const showModal = (type: 'success' | 'error', title: string, body: string) => {
        setModalType(type);
        setModalMessage({ title, body });
        setModalVisible(true);
    };

    const handleCheckout = async () => {
        if (items.length === 0) {
            showModal('error', 'Carrito Vacío', 'Agrega productos antes de realizar el pedido.');
            return;
        }

        if (!user) {
            showModal('error', 'Error', 'Debes iniciar sesión para realizar un pedido.');
            return;
        }

        setLoading(true);

        try {
            // Importar el repositorio dinámicamente
            const { OrderRepositoryImpl } = await import('../../../data/repositories/OrderRepositoryImpl');
            const orderRepository = new OrderRepositoryImpl();

            // Crear la orden en Supabase
            const orderItems = items.map(item => ({
                product: {
                    id: item.product.id,
                    name: item.product.name,
                    description: item.product.description || '',
                    price: item.product.price,
                    cost: item.product.cost || 0,
                    stock: item.product.stock || 0,
                },
                quantity: item.quantity
            }));

            const newOrder = await orderRepository.createOrder({
                student: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    firstName: user.firstName,
                    lastName: user.lastName,
                },
                items: orderItems,
                total: getTotal(),
                status: 'pending_approval',
            });

            console.log('Order created successfully:', newOrder);

            // También guardar en el store local para actualizar la UI
            addOrder(orderItems, getTotal());

            setLoading(false);
            showModal(
                'success',
                '¡Pedido Realizado!',
                'Tu pedido ha sido enviado y está esperando aprobación del representante.'
            );
        } catch (error: any) {
            console.error('Error creating order:', error);
            setLoading(false);
            showModal(
                'error',
                'Error al Crear Pedido',
                error.message || 'No se pudo procesar tu pedido. Por favor intenta de nuevo.'
            );
        }
    };

    const handleModalClose = () => {
        setModalVisible(false);
        if (modalType === 'success') {
            clearCart();
            (navigation as any).goBack();
        }
    };

    const handleClearCart = () => {
        clearCart();
        setConfirmModalVisible(false);
    };

    const renderCartItem = ({ item }: { item: CartItem }) => (
        <View style={styles.cartItem}>
            <Image
                source={{ uri: item.product.imageUrl || 'https://via.placeholder.com/80' }}
                style={styles.itemImage}
            />
            <View style={styles.itemDetails}>
                <Text style={styles.itemName} numberOfLines={1}>
                    {item.product.name}
                </Text>
                <Text style={styles.itemPrice}>Bs.S {item.product.price.toFixed(2)}</Text>
                <Text style={styles.itemSubtotal}>
                    Subtotal: Bs.S {(item.product.price * item.quantity).toFixed(2)}
                </Text>
            </View>
            <View style={styles.quantityControls}>
                <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => updateQuantity(item.product.id, item.quantity - 1)}
                    activeOpacity={0.7}
                >
                    <Ionicons name="remove" size={18} color="#ED9B40" />
                </TouchableOpacity>
                <Text style={styles.quantityText}>{item.quantity}</Text>
                <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => updateQuantity(item.product.id, item.quantity + 1)}
                    activeOpacity={0.7}
                >
                    <Ionicons name="add" size={18} color="#ED9B40" />
                </TouchableOpacity>
            </View>
            <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => removeItem(item.product.id)}
                activeOpacity={0.7}
            >
                <Ionicons name="trash-outline" size={20} color="#FF4757" />
            </TouchableOpacity>
        </View>
    );

    const renderEmptyCart = () => (
        <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
                <Ionicons name="cart-outline" size={80} color="#DFE6E9" />
            </View>
            <Text style={styles.emptyTitle}>Tu carrito está vacío</Text>
            <Text style={styles.emptySubtitle}>
                Explora el menú y agrega tus productos favoritos
            </Text>
            <TouchableOpacity
                style={styles.browseButton}
                onPress={() => (navigation as any).goBack()}
                activeOpacity={0.8}
            >
                <LinearGradient
                    colors={['#ED9B40', '#E8872E']}
                    style={styles.browseButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <Ionicons name="restaurant" size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.browseButtonText}>Ver Menú</Text>
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <LinearGradient
                colors={['#B8956A', '#A67C52', '#B8956A']}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => (navigation as any).goBack()}
                    activeOpacity={0.7}
                >
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.headerTitle}>Mi Carrito</Text>
                    <Text style={styles.headerSubtitle}>
                        {items.length} {items.length === 1 ? 'producto' : 'productos'}
                    </Text>
                </View>
                {items.length > 0 && (
                    <TouchableOpacity
                        style={styles.clearButton}
                        onPress={() => setConfirmModalVisible(true)}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="trash-outline" size={22} color="#fff" />
                    </TouchableOpacity>
                )}
            </LinearGradient>

            {items.length === 0 ? (
                renderEmptyCart()
            ) : (
                <>
                    {/* Cart Items */}
                    <FlatList
                        data={items}
                        renderItem={renderCartItem}
                        keyExtractor={(item) => item.product.id}
                        contentContainerStyle={styles.listContainer}
                        showsVerticalScrollIndicator={false}
                    />

                    {/* Summary Card */}
                    <View style={styles.summaryCard}>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Subtotal</Text>
                            <Text style={styles.summaryValue}>Bs.S {getTotal().toFixed(2)}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Servicio</Text>
                            <Text style={styles.summaryValue}>Bs.S 0.00</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.summaryRow}>
                            <Text style={styles.totalLabel}>Total</Text>
                            <Text style={styles.totalValue}>Bs.S {getTotal().toFixed(2)}</Text>
                        </View>

                        {/* Checkout Button */}
                        <TouchableOpacity
                            style={styles.checkoutButtonContainer}
                            onPress={handleCheckout}
                            disabled={loading}
                            activeOpacity={0.85}
                        >
                            <LinearGradient
                                colors={loading ? ['#B2BEC3', '#636E72'] : ['#61C9A8', '#4FB896']}
                                style={styles.checkoutButton}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                {loading ? (
                                    <>
                                        <Ionicons name="hourglass-outline" size={22} color="#fff" style={{ marginRight: 8 }} />
                                        <Text style={styles.checkoutButtonText}>Procesando...</Text>
                                    </>
                                ) : (
                                    <>
                                        <Ionicons name="checkmark-circle" size={22} color="#fff" style={{ marginRight: 8 }} />
                                        <Text style={styles.checkoutButtonText}>Realizar Pedido</Text>
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Info Footer */}
                        <View style={styles.infoFooter}>
                            <Ionicons name="information-circle-outline" size={16} color="#636E72" />
                            <Text style={styles.infoText}>
                                {user?.role === 'student' && 'Tu pedido requiere aprobación del representante'}
                            </Text>
                        </View>
                    </View>
                </>
            )}

            {/* Success/Error Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={handleModalClose}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={[
                            styles.modalIconContainer,
                            { backgroundColor: modalType === 'success' ? '#E8F8F5' : '#FDEDEC' }
                        ]}>
                            <Ionicons
                                name={modalType === 'success' ? 'checkmark-circle' : 'alert-circle'}
                                size={60}
                                color={modalType === 'success' ? '#2ECC71' : '#E74C3C'}
                            />
                        </View>
                        <Text style={styles.modalTitle}>{modalMessage.title}</Text>
                        <Text style={styles.modalBody}>{modalMessage.body}</Text>

                        <TouchableOpacity
                            style={[
                                styles.modalButton,
                                { backgroundColor: modalType === 'success' ? '#2ECC71' : '#E74C3C' }
                            ]}
                            onPress={handleModalClose}
                        >
                            <Text style={styles.modalButtonText}>
                                {modalType === 'success' ? 'Entendido' : 'Cerrar'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Clear Cart Confirmation Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={confirmModalVisible}
                onRequestClose={() => setConfirmModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={[styles.modalIconContainer, { backgroundColor: '#FFF0F3' }]}>
                            <Ionicons name="trash-outline" size={50} color="#FF4757" />
                        </View>
                        <Text style={styles.modalTitle}>¿Vaciar carrito?</Text>
                        <Text style={styles.modalBody}>
                            Se eliminarán todos los productos seleccionados. ¿Estás seguro?
                        </Text>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalActionButton, styles.modalCancelButton]}
                                onPress={() => setConfirmModalVisible(false)}
                            >
                                <Text style={styles.modalCancelButtonText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalActionButton, styles.modalConfirmButton]}
                                onPress={handleClearCart}
                            >
                                <Text style={styles.modalConfirmButtonText}>Sí, vaciar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    headerTextContainer: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
        letterSpacing: 0.3,
    },
    clearButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    listContainer: {
        padding: 20,
        paddingBottom: 10,
    },
    cartItem: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
        alignItems: 'center',
    },
    itemImage: {
        width: 80,
        height: 80,
        borderRadius: 14,
        backgroundColor: colors.background,
    },
    itemDetails: {
        flex: 1,
        marginLeft: 16,
    },
    itemName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 4,
    },
    itemPrice: {
        fontSize: 14,
        color: '#ED9B40',
        fontWeight: '600',
        marginBottom: 2,
    },
    itemSubtotal: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    quantityControls: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        borderRadius: 12,
        padding: 4,
        marginRight: 8,
    },
    quantityButton: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    quantityText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.text,
        marginHorizontal: 12,
        minWidth: 20,
        textAlign: 'center',
    },
    deleteButton: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#FFF0F3',
        justifyContent: 'center',
        alignItems: 'center',
    },
    summaryCard: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 10,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    summaryLabel: {
        fontSize: 15,
        color: colors.textSecondary,
        fontWeight: '500',
    },
    summaryValue: {
        fontSize: 15,
        color: colors.text,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: 12,
    },
    totalLabel: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text,
    },
    totalValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ED9B40',
    },
    checkoutButtonContainer: {
        marginTop: 16,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#61C9A8',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    checkoutButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 16,
        borderRadius: 16,
    },
    checkoutButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    infoFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        gap: 8,
    },
    infoText: {
        fontSize: 12,
        color: colors.textSecondary,
        flex: 1,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyIconContainer: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: '#F5F6FA',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 15,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 22,
    },
    browseButton: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#ED9B40',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    browseButtonGradient: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 16,
    },
    browseButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        width: '100%',
        maxWidth: 340,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10,
    },
    modalIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 12,
        textAlign: 'center',
    },
    modalBody: {
        fontSize: 16,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
    },
    modalButton: {
        width: '100%',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    modalButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    modalActionButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalCancelButton: {
        backgroundColor: '#F5F6FA',
    },
    modalConfirmButton: {
        backgroundColor: '#FF4757',
    },
    modalCancelButtonText: {
        color: colors.textSecondary,
        fontWeight: '600',
        fontSize: 15,
    },
    modalConfirmButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 15,
    },
});

export default CartScreen;
