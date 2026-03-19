import { Order, OrderStatus } from '../../domain/entities/Order';
import { Product } from '../../domain/entities/Product';
import { User, UserRole } from '../../domain/entities/User';
import { OrderRepository } from '../../domain/repositories/OrderRepository';
import { supabase } from '../../lib/supabase';

// Mapeo de estados entre la app y Supabase
const statusToSupabase: Record<OrderStatus, string> = {
  'pending_approval': 'pendiente',
  'pending_payment': 'pendiente',
  'approved': 'aprobado_por_padre',
  'rejected_by_parent': 'rechazado_por_padre',
  'preparing': 'pendiente',
  'ready_for_pickup': 'pendiente',
  'completed': 'completado',
  'cancelled_by_cafeteria': 'cancelado',
};

const statusFromSupabase: Record<string, OrderStatus> = {
  'pendiente': 'pending_approval',
  'aprobado_por_padre': 'approved',
  'rechazado_por_padre': 'rejected_by_parent',
  'completado': 'completed',
  'cancelado': 'cancelled_by_cafeteria',
};

const roleFromSupabase: Record<string, UserRole> = {
  'estudiante': 'student',
  'padre': 'parent',
  'admin': 'cafeteria',
};

export class OrderRepositoryImpl implements OrderRepository {
  async getOrdersByStudent(studentId: string): Promise<Order[]> {
    console.log('Getting orders for student:', studentId);

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        profiles:student_id (id, nombre, email, rol),
        order_items (
          id,
          cantidad,
          precio_unitario_congelado,
          products:product_id (id, nombre, descripcion, precio, imagen_url, esta_activo)
        )
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
      throw new Error(error.message);
    }

    return (data || []).map(this.mapOrderFromSupabase);
  }

  async getOrdersByCafeteria(): Promise<Order[]> {
    console.log('Getting all orders for cafeteria');

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        profiles:student_id (id, nombre, email, rol),
        order_items (
          id,
          cantidad,
          precio_unitario_congelado,
          products:product_id (id, nombre, descripcion, precio, imagen_url, esta_activo)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
      throw new Error(error.message);
    }

    return (data || []).map(this.mapOrderFromSupabase);
  }

  async getOrderById(id: string): Promise<Order | null> {
    console.log('Getting order by id:', id);

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        profiles:student_id (id, nombre, email, rol),
        order_items (
          id,
          cantidad,
          precio_unitario_congelado,
          products:product_id (id, nombre, descripcion, precio, imagen_url, esta_activo)
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching order:', error);
      return null;
    }

    return this.mapOrderFromSupabase(data);
  }

  async createOrder(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order> {
    console.log('Creating order:', order);

    // 1. Crear la orden principal
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        student_id: order.student.id,
        monto_total: order.total,
        estado: statusToSupabase[order.status],
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      throw new Error(orderError.message);
    }

    // 2. Crear los items de la orden
    const orderItems = order.items.map(item => ({
      order_id: orderData.id,
      product_id: item.product.id,
      cantidad: item.quantity,
      precio_unitario_congelado: item.product.price,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Error creating order items:', itemsError);
      // Intentar eliminar la orden si falla la creación de items
      await supabase.from('orders').delete().eq('id', orderData.id);
      throw new Error(itemsError.message);
    }

    // 3. Obtener la orden completa con sus items
    const createdOrder = await this.getOrderById(orderData.id);
    if (!createdOrder) {
      throw new Error('Failed to retrieve created order');
    }

    return createdOrder;
  }

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
    console.log('Updating order status:', orderId, status);

    const { error } = await supabase
      .from('orders')
      .update({
        estado: statusToSupabase[status],
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (error) {
      console.error('Error updating order status:', error);
      throw new Error(error.message);
    }

    const updatedOrder = await this.getOrderById(orderId);
    if (!updatedOrder) {
      throw new Error('Order not found after update');
    }

    return updatedOrder;
  }

  async updateOrderWithRejection(orderId: string, rejectionNote: string): Promise<Order> {
    console.log('Updating order with rejection:', orderId, rejectionNote);

    const { error } = await supabase
      .from('orders')
      .update({
        estado: 'rechazado_por_padre',
        rejection_note: rejectionNote,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (error) {
      console.error('Error updating order with rejection:', error);
      throw new Error(error.message);
    }

    const updatedOrder = await this.getOrderById(orderId);
    if (!updatedOrder) {
      throw new Error('Order not found after update');
    }

    return updatedOrder;
  }

  // Helper para mapear datos de Supabase a la entidad Order
  private mapOrderFromSupabase(data: any): Order {
    const profile = data.profiles;
    const nameParts = profile.nombre.split(' ');

    const student: User = {
      id: profile.id,
      email: profile.email || '',
      role: roleFromSupabase[profile.rol] || 'student',
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
    };

    const items = (data.order_items || []).map((item: any) => {
      const product: Product = {
        id: item.products.id,
        name: item.products.nombre,
        description: item.products.descripcion || '',
        price: item.precio_unitario_congelado,
        cost: 0, // No tenemos este dato en Supabase
        stock: 0, // No lo necesitamos aquí
      };

      return {
        product,
        quantity: item.cantidad,
      };
    });

    return {
      id: data.id,
      student,
      items,
      total: data.monto_total,
      status: statusFromSupabase[data.estado] || 'pending_approval',
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      rejectionNote: data.rejection_note,
    };
  }
}
