import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system';
import { Product } from '../../domain/entities/Product';
import { ProductRepository } from '../../domain/repositories/ProductRepository';
import { supabase } from '../../lib/supabase';

export class ProductRepositoryImpl implements ProductRepository {
  private async uploadImage(fileUri: string): Promise<string> {
    const base64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    const ext = fileUri.split('.').pop()?.toLowerCase();
    const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';
    const filename = `${new Date().getTime()}.${ext || 'jpg'}`;
    
    const { error, data } = await supabase.storage
      .from('imagenes_productos')
      .upload(filename, decode(base64), { contentType });
      
    if (error) {
      console.error('Error uploading image', error);
      throw new Error(error.message);
    }
    
    return data.path;
  }

  private getImageUrl(path: string | null): string {
    if (!path) return 'https://via.placeholder.com/150';
    if (path.startsWith('http')) return path;
    const { data } = supabase.storage.from('imagenes_productos').getPublicUrl(path);
    return data.publicUrl;
  }

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
      imageUrl: this.getImageUrl(product.imagen_url),
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
      imageUrl: this.getImageUrl(data.imagen_url),
    };
  }

  async addProduct(product: Omit<Product, 'id'>): Promise<Product> {
    console.log('Adding product to Supabase:', product);

    let imageUrl = product.imageUrl;
    if (imageUrl && imageUrl.startsWith('file://')) {
      imageUrl = await this.uploadImage(imageUrl);
    }

    const { data, error } = await supabase
      .from('products')
      .insert({
        nombre: product.name,
        descripcion: product.description,
        precio: product.price,
        stock: product.stock || 0,
        imagen_url: imageUrl,
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
      imageUrl: this.getImageUrl(data.imagen_url),
    };
  }

  async updateProduct(product: Product): Promise<Product> {
    console.log('Updating product in Supabase:', product);

    let imageUrl = product.imageUrl;
    if (imageUrl && imageUrl.startsWith('file://')) {
      imageUrl = await this.uploadImage(imageUrl);
    }

    const { data, error } = await supabase
      .from('products')
      .update({
        nombre: product.name,
        descripcion: product.description,
        precio: product.price,
        stock: product.stock,
        imagen_url: imageUrl,
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
      imageUrl: this.getImageUrl(data.imagen_url),
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
