import { Product } from '../../domain/entities/Product';
import { ProductRepository } from '../../domain/repositories/ProductRepository';
import { supabase } from '../../lib/supabase';

export class ProductRepositoryImpl implements ProductRepository {
  async getProducts(): Promise<Product[]> {
    console.log('Getting products from Supabase');

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('esta_activo', true)
      .order('nombre', { ascending: true });

    if (error) {
      console.error('Error fetching products:', error);
      throw new Error(error.message);
    }

    return (data || []).map(product => ({
      id: product.id,
      name: product.nombre,
      description: product.descripcion || '',
      price: product.precio,
      cost: 0, // No tenemos este campo en Supabase
      stock: product.stock || 0,
      imageUrl: product.imagen_url,
    }));
  }

  async getProductById(id: string): Promise<Product | null> {
    console.log('Getting product by id:', id);

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching product:', error);
      return null;
    }

    return {
      id: data.id,
      name: data.nombre,
      description: data.descripcion || '',
      price: data.precio,
      cost: 0,
      stock: data.stock || 0,
      imageUrl: data.imagen_url,
    };
  }

  async addProduct(product: Omit<Product, 'id'>): Promise<Product> {
    console.log('Adding product to Supabase:', product);

    const { data, error } = await supabase
      .from('products')
      .insert({
        nombre: product.name,
        descripcion: product.description,
        precio: product.price,
        stock: product.stock || 0,
        imagen_url: product.imageUrl,
        esta_activo: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding product:', error);
      throw new Error(error.message);
    }

    return {
      id: data.id,
      name: data.nombre,
      description: data.descripcion || '',
      price: data.precio,
      cost: 0,
      stock: data.stock || 0,
      imageUrl: data.imagen_url,
    };
  }

  async updateProduct(product: Product): Promise<Product> {
    console.log('Updating product in Supabase:', product);

    const { data, error } = await supabase
      .from('products')
      .update({
        nombre: product.name,
        descripcion: product.description,
        precio: product.price,
        stock: product.stock,
        imagen_url: product.imageUrl,
      })
      .eq('id', product.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating product:', error);
      throw new Error(error.message);
    }

    return {
      id: data.id,
      name: data.nombre,
      description: data.descripcion || '',
      price: data.precio,
      cost: 0,
      stock: data.stock || 0,
      imageUrl: data.imagen_url,
    };
  }

  async deleteProduct(id: string): Promise<void> {
    console.log('Deleting product from Supabase:', id);

    // Soft delete - solo desactivar el producto
    const { error } = await supabase
      .from('products')
      .update({ esta_activo: false })
      .eq('id', id);

    if (error) {
      console.error('Error deleting product:', error);
      throw new Error(error.message);
    }
  }
}
