import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { OrderRepositoryImpl } from '../../../data/repositories/OrderRepositoryImpl';
import { Order } from '../../../domain/entities/Order';
import { GetOrdersByStudentUseCase } from '../../../domain/usecases/GetOrdersByStudentUseCase';
import { useAuthStore } from '../../state/authStore';
import { colors } from '../../theme/colors';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
    pending_approval:        { label: 'Pendiente',  color: '#F39C12', icon: 'time-outline' },
    approved:                { label: 'Aprobado',   color: '#2ECC71', icon: 'checkmark-circle-outline' },
    rejected_by_parent:      { label: 'Rechazado',  color: '#E74C3C', icon: 'close-circle-outline' },
    completed:               { label: 'Entregado',  color: '#3498DB', icon: 'bag-check-outline' },
    cancelled_by_cafeteria:  { label: 'Cancelado',  color: '#95A5A6', icon: 'ban-outline' },
};

const getStatus = (status: string) =>
    STATUS_CONFIG[status] ?? { label: 'Pendiente', color: '#F39C12', icon: 'time-outline' };

const FILTERS = [
    { key: 'all',                   label: 'Todos',      icon: 'apps' },
    { key: 'pending_approval',      label: 'Pendientes', icon: 'time' },
    { key: 'approved',              label: 'Aprobados',  icon: 'checkmark-circle' },
    { key: 'completed',             label: 'Entregados', icon: 'bag-check' },
    { key: 'rejected_by_parent',    label: 'Rechazados', icon: 'close-circle' },
];

const OrdersScreen = () => {
    const { user } = useAuthStore();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState<string>('all');

    const fetchOrders = useCallback(async () => {
        if (!user) { setLoading(false); return; }
        try {
            const repo = new OrderRepositoryImpl();
            const useCase = new GetOrdersByStudentUseCase(repo);
            const result = await useCase.execute(user.id);
            setOrders(result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user]);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    const onRefresh = () => { setRefreshing(true); fetchOrders(); };

    const filteredOrders = selectedFilter === 'all'
        ? orders
        : orders.filter(o => o.status === selectedFilter);

    const renderOrderItem = ({ item }: { item: Order }) => {
        const s = getStatus(item.status);
        return (
            <View style={styles.orderCard}>
                <View style={styles.orderHeader}>
                    <View>
                        <Text style={styles.orderDate}>
                            {item.createdAt.toLocaleDateString('es-VE')} {item.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                        <Text style={styles.orderId}>Pedido #{item.id.slice(-6).toUpperCase()}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: s.color + '20', borderColor: s.color }]}>
                        <Ionicons name={s.icon as any} size={13} color={s.color} />
                        <Text style={[styles.statusText, { color: s.color }]}>{s.label}</Text>
                    </View>
                </View>

                <View style={styles.orderItems}>
                    {item.items.map((orderItem, index) => (
                        <View key={index} style={styles.productRow}>
                            <Text style={styles.productName}>{orderItem.product.name}</Text>
                            <Text style={styles.productQuantity}>x{orderItem.quantity}</Text>
                            <Text style={styles.productPrice}>Bs.S {(orderItem.product.price * orderItem.quantity).toFixed(2)}</Text>
                        </View>
                    ))}
                </View>

                {item.status === 'rejected_by_parent' && (item as any).rejectionNote && (
                    <View style={styles.rejectionNoteContainer}>
                        <View style={styles.rejectionHeader}>
                            <Ionicons name="alert-circle" size={18} color="#E74C3C" />
                            <Text style={styles.rejectionTitle}>Motivo del rechazo:</Text>
                        </View>
                        <Text style={styles.rejectionNote}>{(item as any).rejectionNote}</Text>
                    </View>
                )}

                <View style={styles.orderFooter}>
                    <Text style={styles.totalLabel}>Total:</Text>
                    <Text style={styles.totalAmount}>Bs.S {item.total.toFixed(2)}</Text>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#B8956A', '#A67C52', '#B8956A']}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={StyleSheet.absoluteFill}>
                    <Ionicons name="receipt" size={80} color="rgba(255,255,255,0.1)" style={{ position: 'absolute', right: -20, top: -10 }} />
                </View>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>Mis Pedidos</Text>
                    <Text style={styles.headerSubtitle}>Historial de compras</Text>
                </View>
            </LinearGradient>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer} contentContainerStyle={{ paddingHorizontal: 20 }}>
                {FILTERS.map(f => (
                    <TouchableOpacity
                        key={f.key}
                        style={[styles.filterChip, selectedFilter === f.key && styles.filterChipActive]}
                        onPress={() => setSelectedFilter(f.key)}
                    >
                        <Ionicons name={f.icon as any} size={16} color={selectedFilter === f.key ? '#fff' : colors.textSecondary} />
                        <Text style={[styles.filterChipText, selectedFilter === f.key && styles.filterChipTextActive]}>{f.label}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {loading ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Cargando pedidos...</Text>
                </View>
            ) : filteredOrders.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="receipt-outline" size={80} color="#DFE6E9" />
                    <Text style={styles.emptyTitle}>
                        {selectedFilter === 'all' ? 'No tienes pedidos aún' : 'No hay pedidos en esta categoría'}
                    </Text>
                    <Text style={styles.emptyText}>
                        {selectedFilter === 'all'
                            ? 'Tus pedidos aparecerán aquí cuando realices una compra'
                            : 'Cambia el filtro para ver otros pedidos'}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filteredOrders}
                    renderItem={renderOrderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: {
        paddingTop: 50,
        paddingBottom: 24,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        overflow: 'hidden',
    },
    headerContent: { zIndex: 1 },
    headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 6 },
    headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.9)' },
    filtersContainer: { marginTop: 12, marginBottom: 4 },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 20,
        backgroundColor: '#fff',
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#E8E8E8',
        gap: 6,
    },
    filterChipActive: { backgroundColor: colors.secondary, borderColor: colors.secondary },
    filterChipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
    filterChipTextActive: { color: '#fff', fontWeight: 'bold' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
    emptyTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginTop: 20, marginBottom: 8 },
    emptyText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
    listContainer: { padding: 20 },
    orderCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    orderDate: { fontSize: 12, color: colors.textSecondary, marginBottom: 4 },
    orderId: { fontSize: 16, fontWeight: 'bold', color: colors.text },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        borderWidth: 1,
    },
    statusText: { fontSize: 12, fontWeight: 'bold' },
    orderItems: { marginBottom: 12 },
    productRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 6,
    },
    productName: { flex: 1, fontSize: 14, color: colors.text },
    productQuantity: { fontSize: 14, color: colors.textSecondary, marginHorizontal: 12 },
    productPrice: { fontSize: 14, fontWeight: '600', color: colors.text },
    rejectionNoteContainer: {
        backgroundColor: '#FFEBEE',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#E74C3C',
    },
    rejectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    rejectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#E74C3C' },
    rejectionNote: { fontSize: 14, color: '#C62828', lineHeight: 20 },
    orderFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    totalLabel: { fontSize: 16, fontWeight: 'bold', color: colors.text },
    totalAmount: { fontSize: 18, fontWeight: 'bold', color: colors.secondary },
});

export default OrdersScreen;
