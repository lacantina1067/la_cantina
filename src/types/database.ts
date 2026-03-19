export type AppRole = 'admin' | 'estudiante' | 'padre';

export interface Profile {
    id: string;
    nombre: string;
    email: string | null;
    rol: AppRole;
    created_at: string;
}

export interface Product {
    id: string;
    nombre: string;
    descripcion: string | null;
    precio: number;
    imagen_url: string | null;
    esta_activo: boolean;
    created_at: string;
}

export interface Wallet {
    id: string;
    user_id: string;
    saldo: number;
    updated_at: string;
}

export type OrderStatus = 'pendiente' | 'aprobado_por_padre' | 'rechazado_por_padre' | 'completado' | 'cancelado';

export interface Order {
    id: string;
    student_id: string;
    monto_total: number;
    estado: OrderStatus;
    created_at: string;
    updated_at: string;
}

export interface OrderItem {
    id: string;
    order_id: string;
    product_id: string;
    cantidad: number;
    precio_unitario_congelado: number;
}