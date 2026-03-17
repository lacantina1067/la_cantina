import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { OrderRepositoryImpl } from '../../../data/repositories/OrderRepositoryImpl';
import { Order } from '../../../domain/entities/Order';
import { GetOrdersByStudentUseCase } from '../../../domain/usecases/GetOrdersByStudentUseCase';
import Button from '../../components/Button';
import { useAuthStore } from '../../state/authStore';
import { colors } from '../../theme/colors';

const ParentApprovalScreen = () => {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    fetchOrders();
  }, [user]);

  const handleApproval = (orderId: string, approve: boolean) => {
    console.log(`Order ${orderId} ${approve ? 'approved' : 'rejected'}`);
  };

  const renderItem = ({ item }: { item: Order }) => (
    <View style={styles.orderContainer}>
      <Text style={styles.orderTitle}>Order from {item.student.firstName}</Text>
      {item.items.map(orderItem => (
        <View key={orderItem.product.id} style={styles.itemContainer}>
          <Text>{orderItem.product.name} x {orderItem.quantity}</Text>
          <Text>${(orderItem.product.price * orderItem.quantity).toFixed(2)}</Text>
        </View>
      ))}
      <Text style={styles.total}>Total: ${item.total.toFixed(2)}</Text>
      <View style={styles.buttonContainer}>
        <Button title="Approve" onPress={() => handleApproval(item.id, true)} />
        <Button title="Reject" onPress={() => handleApproval(item.id, false)} />
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={orders}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.container}
      ListEmptyComponent={<Text>No pending approvals.</Text>}
    />
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    padding: 10,
  },
  orderContainer: {
    backgroundColor: colors.white,
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  orderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  total: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'right',
    marginTop: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
  },
});

export default ParentApprovalScreen;
