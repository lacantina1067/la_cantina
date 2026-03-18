import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { OrderRepositoryImpl } from '../../../data/repositories/OrderRepositoryImpl';
import { Order } from '../../../domain/entities/Order';
import { GetOrdersByStudentUseCase } from '../../../domain/usecases/GetOrdersByStudentUseCase';
import { useAuthStore } from '../../state/authStore';
import { colors } from '../../theme/colors';

const ChildOrdersScreen = () => {
  const { user } = useAuthStore();
  const navigation = useNavigation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [rejectionNote, setRejectionNote] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');

  const fetchOrders = async () => {
    if (!user || !user.childId) {
      setLoading(false);
      return;
    }
    try {
      const orderRepository = new OrderRepositoryImpl();
      const getOrdersUseCase = new GetOrdersByStudentUseCase(orderRepository);
      const result = await getOrdersUseCase.execute(user.childId);
      setOrders(result.filter(o => o.status === 'pending_approval'));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const handleApproval = async (orderId: string, approve: boolean) => {
    if (approve) {
      try {
        const orderRepository = new OrderRepositoryImpl();
        await orderRepository.updateOrderStatus(orderId, 'pending_payment');
        const order = orders.find(o => o.id === orderId);
        setOrders(prev => prev.filter(o => o.id !== orderId));
        setSelectedOrder(order || null);
        setPaymentAmount(order?.total.toFixed(2) || '');
        setShowPaymentModal(true);
      } catch (error) {
        console.error('Error approving order:', error);
        Alert.alert('Error', 'No se pudo aprobar la orden. Intenta nuevamente.');
      }
    } else {
      const order = orders.find(o => o.id === orderId);
      setSelectedOrder(order || null);
      setShowRejectModal(true);
    }
  };

  const confirmRejection = async () => {
    if (!selectedOrder) return;

    if (!rejectionNote.trim()) {
      Alert.alert('Nota requerida', 'Por favor escribe una razón para el rechazo.');
      return;
    }

    try {
      const orderRepository = new OrderRepositoryImpl();
      await orderRepository.updateOrderWithRejection(selectedOrder.id, rejectionNote.trim());

      const notePreview = rejectionNote.trim();
      setOrders(prev => prev.filter(o => o.id !== selectedOrder.id));
      setShowRejectModal(false);
      setRejectionNote('');
      setSelectedOrder(null);

      Alert.alert(
        '❌ Pedido Rechazado',
        `La orden ha sido rechazada.\n\nMotivo: "${notePreview}"\n\nEl estudiante recibirá esta notificación.`,
        [{ text: 'Entendido', style: 'default' }]
      );
    } catch (error) {
      console.error('Error rejecting order:', error);
      Alert.alert('Error', 'No se pudo rechazar la orden. Intenta nuevamente.');
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.student.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items.some(item => item.product.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const renderItem = ({ item }: { item: Order }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.studentInfo}>
          <View style={styles.avatarContainer}>
            <Ionicons name="school" size={20} color={colors.white} />
          </View>
          <View>
            <Text style={styles.studentName}>{item.student.firstName}</Text>
            <Text style={styles.orderTime}>
              {item.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>
        <View style={styles.pendingBadge}>
          <Text style={styles.pendingText}>Pendiente</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.itemsList}>
        {item.items.map(orderItem => (
          <View key={orderItem.product.id} style={styles.itemRow}>
            <View style={styles.quantityBadge}>
              <Text style={styles.quantityText}>{orderItem.quantity}x</Text>
            </View>
            <Text style={styles.itemName}>{orderItem.product.name}</Text>
            <Text style={styles.itemPrice}>Bs.S {(orderItem.product.price * orderItem.quantity).toFixed(2)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.divider} />

      <View style={styles.cardFooter}>
        <View>
          <Text style={styles.totalLabel}>Total a Pagar</Text>
          <Text style={styles.totalAmount}>Bs.S {item.total.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => handleApproval(item.id, false)}
          activeOpacity={0.8}
        >
          <Ionicons name="close-circle-outline" size={20} color="#E74C3C" />
          <Text style={styles.rejectText}>Rechazar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.approveButton]}
          onPress={() => handleApproval(item.id, true)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#2ECC71', '#27AE60']}
            style={styles.approveGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color={colors.white} />
            <Text style={styles.approveText}>Aprobar</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

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
          <Ionicons name="checkmark-circle" size={60} color="rgba(255,255,255,0.08)" style={{ position: 'absolute', left: -10, bottom: -10 }} />
        </View>
        <View style={styles.headerContent}>
          <View style={styles.iconHeader}>
            <Ionicons name="clipboard-outline" size={32} color="#fff" />
          </View>
          <Text style={styles.headerTitle}>Solicitudes</Text>
          <Text style={styles.headerSubtitle}>Pedidos pendientes de aprobación</Text>
        </View>
      </LinearGradient>

      {!loading && (
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por estudiante o producto..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      )}

      {loading ? (
        <View style={styles.centered}>
          <Text>Cargando solicitudes...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="checkmark-done-circle-outline" size={80} color="#ccc" />
              <Text style={styles.emptyText}>¡Todo al día!</Text>
              <Text style={styles.emptySubtext}>No hay solicitudes pendientes</Text>
            </View>
          }
        />
      )}

      <Modal
        visible={showRejectModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRejectModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconContainer}>
                <Ionicons name="close-circle" size={56} color="#E74C3C" />
              </View>
              <Text style={styles.modalTitle}>Rechazar Pedido</Text>
              <Text style={styles.modalSubtitle}>¿Por qué rechazas este pedido?</Text>
            </View>

            {selectedOrder && (
              <View style={styles.orderPreview}>
                <View style={styles.orderPreviewHeader}>
                  <Ionicons name="receipt-outline" size={20} color={colors.textSecondary} />
                  <Text style={styles.orderPreviewTitle}>Resumen del pedido</Text>
                </View>
                <View style={styles.orderPreviewContent}>
                  <Text style={styles.orderPreviewStudent}>{selectedOrder.student.firstName}</Text>
                  <Text style={styles.orderPreviewTotal}>Bs.S {selectedOrder.total.toFixed(2)}</Text>
                </View>
                <Text style={styles.orderPreviewItems} numberOfLines={2}>
                  {selectedOrder.items.map(i => `${i.quantity}x ${i.product.name}`).join(', ')}
                </Text>
              </View>
            )}

            <View style={styles.noteInputContainer}>
              <View style={styles.noteInputHeader}>
                <Ionicons name="create-outline" size={18} color={colors.textSecondary} />
                <Text style={styles.noteInputLabel}>Motivo del rechazo</Text>
              </View>
              <TextInput
                style={styles.noteInput}
                placeholder="Ejemplo: No hay suficiente saldo, producto no disponible, etc."
                placeholderTextColor={colors.textSecondary}
                value={rejectionNote}
                onChangeText={setRejectionNote}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              <Text style={styles.noteInputHint}>
                El estudiante recibirá esta nota junto con la notificación de rechazo
              </Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowRejectModal(false);
                  setRejectionNote('');
                  setSelectedOrder(null);
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back-outline" size={20} color={colors.text} />
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={confirmRejection}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#E74C3C', '#C0392B']}
                  style={styles.modalConfirmGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="close-circle-outline" size={20} color="#fff" />
                  <Text style={styles.modalConfirmText}>Rechazar Pedido</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showPaymentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.paymentModalContent}>
            <View style={styles.paymentHeader}>
              <View style={styles.paymentIconContainer}>
                <Ionicons name="checkmark-circle" size={56} color="#2ECC71" />
              </View>
              <Text style={styles.paymentTitle}>¡Pedido Aprobado!</Text>
              <Text style={styles.paymentSubtitle}>Procede con el pago para completar la orden</Text>
            </View>

            {selectedOrder && (
              <View style={styles.paymentOrderPreview}>
                <View style={styles.paymentOrderHeader}>
                  <Ionicons name="receipt-outline" size={20} color={colors.textSecondary} />
                  <Text style={styles.paymentOrderTitle}>Detalles del pedido</Text>
                </View>
                <View style={styles.paymentOrderContent}>
                  <Text style={styles.paymentOrderStudent}>{selectedOrder.student.firstName}</Text>
                  <Text style={styles.paymentOrderTotal}>Bs.S {selectedOrder.total.toFixed(2)}</Text>
                </View>
                <View style={styles.paymentItemsList}>
                  {selectedOrder.items.map((item, index) => (
                    <View key={index} style={styles.paymentItemRow}>
                      <Text style={styles.paymentItemQuantity}>{item.quantity}x</Text>
                      <Text style={styles.paymentItemName}>{item.product.name}</Text>
                      <Text style={styles.paymentItemPrice}>Bs.S {(item.product.price * item.quantity).toFixed(2)}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.paymentInfoBox}>
              <Ionicons name="information-circle-outline" size={20} color="#3498DB" />
              <Text style={styles.paymentInfoText}>
                El estudiante necesita tener saldo suficiente para completar el pago
              </Text>
            </View>

            <View style={styles.paymentActions}>
              <TouchableOpacity
                style={styles.paymentLaterButton}
                onPress={() => {
                  setShowPaymentModal(false);
                  setSelectedOrder(null);
                  setPaymentAmount('');
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.paymentLaterText}>Pagar Después</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.paymentNowButton}
                onPress={() => {
                  setShowPaymentModal(false);
                  setSelectedOrder(null);
                  setPaymentAmount('');
                  Alert.alert('En desarrollo', 'El sistema de pagos estará disponible próximamente');
                  navigation.navigate('Recharge' as never);
                }}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#2ECC71', '#27AE60']}
                  style={styles.paymentNowGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="wallet-outline" size={20} color="#fff" />
                  <Text style={styles.paymentNowText}>Ir a Recargar</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  headerContent: { alignItems: 'center', zIndex: 1 },
  iconHeader: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: colors.white },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 15,
    marginBottom: 10,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 44,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: colors.text },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContainer: { padding: 20, paddingBottom: 40 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    marginBottom: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  studentInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentName: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  orderTime: { fontSize: 12, color: colors.textSecondary },
  pendingBadge: {
    backgroundColor: '#FEF9E7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F1C40F',
  },
  pendingText: { fontSize: 12, color: '#F39C12', fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 16 },
  itemsList: { gap: 12 },
  itemRow: { flexDirection: 'row', alignItems: 'center' },
  quantityBadge: {
    backgroundColor: '#f5f6fa',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 10,
  },
  quantityText: { fontSize: 12, fontWeight: 'bold', color: colors.text },
  itemName: { flex: 1, fontSize: 15, color: colors.text },
  itemPrice: { fontSize: 15, fontWeight: '600', color: colors.text },
  cardFooter: { marginTop: 4, marginBottom: 16 },
  totalLabel: { fontSize: 12, color: colors.textSecondary },
  totalAmount: { fontSize: 24, fontWeight: 'bold', color: colors.primary },
  actionsContainer: { flexDirection: 'row', gap: 12 },
  actionButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  rejectButton: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E74C3C' },
  rejectText: { color: '#E74C3C', fontWeight: 'bold', fontSize: 15 },
  approveButton: { overflow: 'hidden' },
  approveGradient: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  approveText: { color: colors.white, fontWeight: 'bold', fontSize: 15 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyText: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginTop: 16 },
  emptySubtext: { fontSize: 14, color: colors.textSecondary, marginTop: 8 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  modalHeader: { alignItems: 'center', marginBottom: 20 },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 12,
    marginBottom: 4,
  },
  modalSubtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderPreview: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#E74C3C',
  },
  orderPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  orderPreviewTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  orderPreviewContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  orderPreviewStudent: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  orderPreviewTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E74C3C',
  },
  orderPreviewItems: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  noteInputContainer: {
    marginBottom: 20,
  },
  noteInputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  noteInputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  noteInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: colors.text,
    minHeight: 100,
    maxHeight: 140,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
  },
  noteInputHint: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#DDD',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  modalCancelText: { color: colors.text, fontWeight: '600', fontSize: 15 },
  modalConfirmButton: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  modalConfirmGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  modalConfirmText: { color: colors.white, fontWeight: 'bold', fontSize: 15 },
  // Payment Modal Styles
  paymentModalContent: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  paymentHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  paymentIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F8F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  paymentTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 6,
  },
  paymentSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  paymentOrderPreview: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#2ECC71',
  },
  paymentOrderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  paymentOrderTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  paymentOrderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentOrderStudent: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  paymentOrderTotal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2ECC71',
  },
  paymentItemsList: {
    gap: 8,
  },
  paymentItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paymentItemQuantity: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.textSecondary,
    width: 30,
  },
  paymentItemName: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  paymentItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  paymentInfoBox: {
    flexDirection: 'row',
    backgroundColor: '#EBF5FB',
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
    gap: 10,
    borderWidth: 1,
    borderColor: '#D6EAF8',
  },
  paymentInfoText: {
    flex: 1,
    fontSize: 13,
    color: '#2874A6',
    lineHeight: 18,
  },
  paymentActions: {
    flexDirection: 'row',
    gap: 12,
  },
  paymentLaterButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#DDD',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  paymentLaterText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 15,
  },
  paymentNowButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  paymentNowGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  paymentNowText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 15,
  },
});

export default ChildOrdersScreen;
