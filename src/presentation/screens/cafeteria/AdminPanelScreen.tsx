import { colors } from '@/src/presentation/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Modal, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { OrderRepositoryImpl } from '../../../data/repositories/OrderRepositoryImpl';
import { Order, OrderStatus } from '../../../domain/entities/Order';
import { GetOrdersByCafeteriaUseCase } from '../../../domain/usecases/GetOrdersByCafeteriaUseCase';
import { UpdateOrderStatusUseCase } from '../../../domain/usecases/UpdateOrderStatusUseCase';
import { supabase } from '../../../lib/supabase';

type TabType = 'pending' | 'approved' | 'history' | 'recargas';

interface RechargeRequest {
  id: string;
  student_nombre: string;
  monto: number;
  referencia: string;
  telefono_origen: string;
  cedula_tipo: string;
  cedula_numero: string;
  estado: string;
  created_at: string;
}

const AdminPanelScreen = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('approved');
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [rechargeRequests, setRechargeRequests] = useState<RechargeRequest[]>([]);
  const [rechargeLoading, setRechargeLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const orderRepository = new OrderRepositoryImpl();
      const getOrdersUseCase = new GetOrdersByCafeteriaUseCase(orderRepository);
      const result = await getOrdersUseCase.execute();
      setOrders(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchRechargeRequests = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('recharge_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) setRechargeRequests(data as RechargeRequest[]);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchRechargeRequests();
  }, [fetchOrders, fetchRechargeRequests]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
    fetchRechargeRequests();
  };

  const handleApproveRecharge = async (id: string) => {
    setRechargeLoading(true);
    try {
      const { error } = await supabase.rpc('approve_recharge', { request_id: id });
      if (error) throw error;
      Alert.alert('¡Aprobado!', 'La recarga fue aprobada y el saldo acreditado.');
      fetchRechargeRequests();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo aprobar la recarga.');
    } finally {
      setRechargeLoading(false);
    }
  };

  const handleRejectRecharge = async (id: string) => {
    setRechargeLoading(true);
    try {
      const { error } = await supabase
        .from('recharge_requests')
        .update({ estado: 'rechazado' })
        .eq('id', id);
      if (error) throw error;
      Alert.alert('Rechazado', 'La solicitud fue rechazada.');
      fetchRechargeRequests();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo rechazar la solicitud.');
    } finally {
      setRechargeLoading(false);
    }
  };

  const handleAction = async (orderId: string, action: 'deliver' | 'cancel') => {
    const newStatus: OrderStatus = action === 'deliver' ? 'completed' : 'cancelled_by_cafeteria';

    try {
      setLoading(true);
      const orderRepository = new OrderRepositoryImpl();
      const updateStatusUseCase = new UpdateOrderStatusUseCase(orderRepository);
      await updateStatusUseCase.execute(orderId, newStatus);

      Alert.alert('Éxito', `Orden ${action === 'deliver' ? 'entregada' : 'cancelada'} correctamente`);
      fetchOrders();
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el pedido');
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async () => {
    if (permission?.granted) {
      setScanning(true);
    } else {
      setShowPermissionModal(true);
    }
  };

  const handleRequestPermission = async () => {
    if (permission?.status === 'denied' && !permission.canAskAgain) {
      Alert.alert(
        'Permiso Requerido',
        'Por favor habilita el permiso de cámara en la configuración de tu dispositivo para escanear QRs.',
        [{ text: 'OK', onPress: () => setShowPermissionModal(false) }]
      );
      return;
    }

    const { granted } = await requestPermission();
    if (granted) {
      setShowPermissionModal(false);
      setScanning(true);
    }
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    setScanning(false);
    // Aquí se podría buscar el pedido del estudiante escaneado
    Alert.alert('Código Escaneado', `ID del estudiante: ${data}`, [
      { text: 'OK', onPress: () => console.log('Scanned:', data) }
    ]);
  };

  const filteredOrders = orders.filter(order => {
    if (activeTab === 'pending') return order.status === 'pending_approval';
    if (activeTab === 'approved') return order.status === 'approved';
    if (activeTab === 'history') return ['completed', 'cancelled_by_cafeteria', 'rejected_by_parent'].includes(order.status);
    return false;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#2ECC71';
      case 'pending_approval': return '#F1C40F';
      case 'rejected_by_parent': return '#E74C3C';
      case 'completed': return '#3498DB';
      default: return '#95A5A6';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending_approval': return 'Pendiente de Aprobación';
      case 'pending_payment': return 'Pendiente de Pago';
      case 'approved': return 'Aprobado';
      case 'rejected_by_parent': return 'Rechazado';
      case 'preparing': return 'Preparando';
      case 'ready_for_pickup': return 'Listo para Retirar';
      case 'completed': return 'Completado';
      case 'cancelled_by_cafeteria': return 'Cancelado';
      default: return status;
    }
  };

  const renderItem = ({ item }: { item: Order }) => (
    <View style={styles.orderCard}>
      <View style={styles.cardHeader}>
        <View style={styles.studentInfo}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={20} color={colors.white} />
          </View>
          <View>
            <Text style={styles.studentName}>{item.student.firstName}</Text>
            <Text style={styles.orderDate}>
              {item.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusLabel(item.status)}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.itemsList}>
        {item.items.map(orderItem => (
          <View key={orderItem.product.id} style={styles.orderItem}>
            <View style={styles.itemQuantity}>
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
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>Bs.S {item.total.toFixed(2)}</Text>
        </View>

        {item.status === 'approved' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.rejectBtn]}
              onPress={() => handleAction(item.id, 'cancel')}
            >
              <Ionicons name="close" size={20} color="#E74C3C" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.acceptBtn]}
              onPress={() => handleAction(item.id, 'deliver')}
            >
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={styles.acceptBtnText}>Entregar</Text>
            </TouchableOpacity>
          </View>
        )}
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
          <Ionicons name="pizza" size={80} color="rgba(255,255,255,0.1)" style={{ position: 'absolute', right: -20, top: -10 }} />
          <Ionicons name="fast-food" size={60} color="rgba(255,255,255,0.08)" style={{ position: 'absolute', left: -10, bottom: -10 }} />
          <Ionicons name="cafe" size={40} color="rgba(255,255,255,0.05)" style={{ position: 'absolute', left: '40%', top: 10 }} />
        </View>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Gestión</Text>
            <Text style={styles.headerSubtitle}>Control de pedidos</Text>
          </View>
          <TouchableOpacity style={styles.scanButton} onPress={handleScan} activeOpacity={0.8}>
            <LinearGradient
              colors={[colors.secondary, '#E67E22']}
              style={styles.scanGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="qr-code" size={24} color={colors.white} />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'pending' && styles.activeTabItem]}
            onPress={() => setActiveTab('pending')}
          >
            <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>Nuevos</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'approved' && styles.activeTabItem]}
            onPress={() => setActiveTab('approved')}
          >
            <Text style={[styles.tabText, activeTab === 'approved' && styles.activeTabText]}>Aprobados</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'history' && styles.activeTabItem]}
            onPress={() => setActiveTab('history')}
          >
            <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>Lista</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'recargas' && styles.activeTabItem]}
            onPress={() => setActiveTab('recargas')}
          >
            <View>
              <Text style={[styles.tabText, activeTab === 'recargas' && styles.activeTabText]}>Recargas</Text>
              {rechargeRequests.filter(r => r.estado === 'pendiente').length > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>
                    {rechargeRequests.filter(r => r.estado === 'pendiente').length}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {loading && !refreshing ? (
        <View style={styles.centered}>
          <Text>Cargando pedidos...</Text>
        </View>
      ) : activeTab === 'recargas' ? (
        <FlatList
          data={rechargeRequests}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
          renderItem={({ item }) => {
            const isPending = item.estado === 'pendiente';
            const badgeColor = item.estado === 'aprobado' ? '#2ECC71' : item.estado === 'rechazado' ? '#E74C3C' : '#F39C12';
            return (
              <View style={styles.rechargeCard}>
                <View style={styles.rechargeCardHeader}>
                  <Text style={styles.rechargeStudentName}>{item.student_nombre}</Text>
                  <Text style={styles.rechargeMonto}>Bs.S {item.monto.toFixed(2)}</Text>
                </View>
                <Text style={styles.rechargeDetail}>Ref: {item.referencia}</Text>
                <Text style={styles.rechargeDetail}>Telf: {item.telefono_origen}</Text>
                <Text style={styles.rechargeDetail}>Cédula: {item.cedula_tipo}-{item.cedula_numero}</Text>
                {!isPending && (
                  <View style={[styles.rechargeStateBadge, { backgroundColor: badgeColor + '20', marginTop: 8 }]}>
                    <Text style={[styles.rechargeStateBadgeText, { color: badgeColor }]}>
                      {item.estado.charAt(0).toUpperCase() + item.estado.slice(1)}
                    </Text>
                  </View>
                )}
                {isPending && (
                  <View style={styles.rechargeActions}>
                    <TouchableOpacity
                      style={styles.rechargeRejectBtn}
                      onPress={() => handleRejectRecharge(item.id)}
                      disabled={rechargeLoading}
                    >
                      <Text style={styles.rechargeRejectText}>Rechazar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.rechargeApproveBtn}
                      onPress={() => handleApproveRecharge(item.id)}
                      disabled={rechargeLoading}
                    >
                      <Text style={styles.rechargeApproveText}>Aprobar</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="wallet-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>No hay solicitudes de recarga</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={filteredOrders}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name={activeTab === 'approved' ? 'checkmark-circle-outline' : 'receipt-outline'}
                size={60}
                color="#ccc"
              />
              <Text style={styles.emptyText}>
                {activeTab === 'pending' && 'No hay nuevos pedidos'}
                {activeTab === 'approved' && 'No hay pedidos por entregar'}
                {activeTab === 'history' && 'El historial está vacío'}
              </Text>
            </View>
          }
        />
      )}

      <Modal
        visible={showPermissionModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPermissionModal(false)}
      >
        <View style={styles.permissionOverlay}>
          <View style={styles.permissionCard}>
            <View style={styles.permissionIconContainer}>
              <Ionicons name="camera" size={40} color={colors.primary} />
            </View>
            <Text style={styles.permissionTitle}>Acceso a Cámara</Text>
            <Text style={styles.permissionText}>
              Para validar la entrega de pedidos mediante código QR, CantiApp necesita acceso a tu cámara.
            </Text>

            <TouchableOpacity
              style={styles.allowButton}
              onPress={handleRequestPermission}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[colors.secondary, '#E67E22']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                <Text style={styles.allowButtonText}>Permitir Acceso</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelPermissionButton}
              onPress={() => setShowPermissionModal(false)}
            >
              <Text style={styles.cancelPermissionText}>Ahora no</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={scanning} animationType="slide" transparent={false}>
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            onBarcodeScanned={handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ["qr"],
            }}
          >
            <View style={styles.cameraOverlay}>
              <TouchableOpacity style={styles.closeButton} onPress={() => setScanning(false)}>
                <View style={styles.closeButtonCircle}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </View>
              </TouchableOpacity>
              <View style={styles.scanFrameContainer}>
                <View style={styles.scanFrame} />
                <Text style={styles.scanText}>Escanea el código QR del estudiante</Text>
              </View>
            </View>
          </CameraView>
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
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 15,
    padding: 4,
    marginTop: 20,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  activeTabItem: {
    backgroundColor: '#fff',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  activeTabText: {
    color: '#B8956A',
  },
  scanButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  scanGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  orderCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  orderDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 12,
  },
  itemsList: {
    gap: 8,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemQuantity: {
    backgroundColor: '#f5f6fa',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 8,
  },
  quantityText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.text,
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  rejectBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E74C3C',
    width: 40,
    paddingHorizontal: 0,
  },
  acceptBtn: {
    backgroundColor: '#2ECC71',
    gap: 6,
  },
  acceptBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
  },
  emptyText: {
    marginTop: 10,
    color: colors.textSecondary,
    fontSize: 16,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  closeButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrameContainer: {
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: colors.secondary,
    backgroundColor: 'transparent',
    marginBottom: 20,
    borderRadius: 20,
  },
  scanText: {
    color: colors.white,
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  // Permission Modal Styles
  permissionOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  permissionCard: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 32,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  permissionIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FDF2E9', // Light orange/brown background
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  allowButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  gradientButton: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allowButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelPermissionButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  cancelPermissionText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 16,
  },
  tabBadge: {
    position: 'absolute',
    top: -6,
    right: -10,
    backgroundColor: '#E74C3C',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  rechargeCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    marginBottom: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  rechargeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  rechargeStudentName: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  rechargeMonto: { fontSize: 18, fontWeight: 'bold', color: colors.primary },
  rechargeDetail: { fontSize: 13, color: colors.textSecondary, marginBottom: 2 },
  rechargeActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  rechargeRejectBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E74C3C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rechargeRejectText: { color: '#E74C3C', fontWeight: 'bold' },
  rechargeApproveBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#2ECC71',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rechargeApproveText: { color: '#fff', fontWeight: 'bold' },
  rechargeStateBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  rechargeStateBadgeText: { fontSize: 12, fontWeight: 'bold' },
});

export default AdminPanelScreen;
