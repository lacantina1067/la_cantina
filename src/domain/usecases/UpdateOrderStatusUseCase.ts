import { Order, OrderStatus } from '../entities/Order';
import { OrderRepository } from '../repositories/OrderRepository';

export class UpdateOrderStatusUseCase {
    constructor(private orderRepository: OrderRepository) { }

    execute(orderId: string, status: OrderStatus): Promise<Order> {
        return this.orderRepository.updateOrderStatus(orderId, status);
    }
}
