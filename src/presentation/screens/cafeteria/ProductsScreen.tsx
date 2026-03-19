import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { ProductRepositoryImpl } from '../../../data/repositories/ProductRepositoryImpl';
import { Product } from '../../../domain/entities/Product';
import { AddProductUseCase } from '../../../domain/usecases/AddProductUseCase';
import { DeleteProductUseCase } from '../../../domain/usecases/DeleteProductUseCase';
import { GetProductsUseCase } from '../../../domain/usecases/GetProductsUseCase';
import { UpdateProductUseCase } from '../../../domain/usecases/UpdateProductUseCase';
import { hasBadWords } from '../../../utils/validation';
import Input from '../../components/Input';
import { colors } from '../../theme/colors';

const ProductsScreen = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Search and Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'low-stock' | 'out-of-stock'>('all');
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const renderToast = () => {
    if (!toast) return null;
    return (
      <View style={[styles.toastContainer, toast.type === 'error' ? styles.toastError : styles.toastSuccess]}>
        <Ionicons
          name={toast.type === 'success' ? 'checkmark-circle' : 'alert-circle'}
          size={24}
          color={colors.white}
        />
        <Text style={styles.toastText}>{toast.message}</Text>
      </View>
    );
  };

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const productRepository = new ProductRepositoryImpl();

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const getProductsUseCase = new GetProductsUseCase(productRepository);
      const result = await getProductsUseCase.execute();
      setProducts(result);
    } catch (error) {
      console.error(error);
      showToast('No se pudieron cargar los productos', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const resetForm = () => {
    setName('');
    setDescription('');
    setPrice('');
    setStock('');
    setImageUrl('');
    setEditingProduct(null);
  };

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setName(product.name);
      setDescription(product.description);
      setPrice(product.price.toString());
      setStock(product.stock.toString());
      setImageUrl(product.imageUrl || '');
    } else {
      resetForm();
    }
    setModalVisible(true);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });

    if (!result.canceled) {
      setImageUrl(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!name || !price || !stock) {
      showToast('Por favor completa los campos obligatorios (*)', 'error');
      return;
    }

    if (name.length < 3) {
      showToast('El nombre del producto debe tener al menos 3 caracteres', 'error');
      return;
    }

    if (name.length > 50) {
      showToast('El nombre del producto no puede exceder 50 caracteres', 'error');
      return;
    }

    if (hasBadWords(name)) {
      showToast('El nombre contiene palabras no permitidas', 'error');
      return;
    }

    if (description && description.length > 200) {
      showToast('La descripción es muy larga (máx. 200 caracteres)', 'error');
      return;
    }

    if (description && hasBadWords(description)) {
      showToast('La descripción contiene palabras no permitidas', 'error');
      return;
    }

    const priceNum = parseFloat(price);
    const stockNum = parseInt(stock);

    if (isNaN(priceNum) || priceNum <= 0) {
      showToast('El precio debe ser mayor a 0', 'error');
      return;
    }

    if (isNaN(stockNum) || stockNum < 0) {
      showToast('El stock no puede ser negativo', 'error');
      return;
    }

    try {
      if (editingProduct) {
        const updateProductUseCase = new UpdateProductUseCase(productRepository);
        await updateProductUseCase.execute({
          ...editingProduct,
          name,
          description,
          price: parseFloat(price),
          stock: parseInt(stock),
          imageUrl,
        });
        showToast('Producto actualizado correctamente');
      } else {
        const addProductUseCase = new AddProductUseCase(productRepository);
        await addProductUseCase.execute({
          name,
          description,
          price: parseFloat(price),
          stock: parseInt(stock),
          imageUrl,
          cost: 0, // Default cost
        });
        showToast('¡Producto creado exitosamente!');
      }
      setModalVisible(false);
      fetchProducts();
    } catch (error) {
      console.error(error);
      showToast('No se pudo guardar el producto', 'error');
    }
  };

  const handleDelete = async () => {
    if (!showDeleteConfirm) return;

    try {
      const deleteProductUseCase = new DeleteProductUseCase(productRepository);
      await deleteProductUseCase.execute(showDeleteConfirm);
      setShowDeleteConfirm(null);
      showToast('Producto eliminado correctamente');
      fetchProducts();
    } catch (error) {
      console.error(error);
      showToast('No se pudo eliminar el producto', 'error');
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      selectedFilter === 'all' ? true :
        selectedFilter === 'low-stock' ? product.stock > 0 && product.stock <= 5 :
          selectedFilter === 'out-of-stock' ? product.stock === 0 : true;

    return matchesSearch && matchesFilter;
  });

  const renderItem = ({ item }: { item: Product }) => (
    <View style={styles.productCard}>
      <Image
        source={{ uri: item.imageUrl || 'https://via.placeholder.com/150' }}
        style={styles.productImage}
      />
      <View style={styles.productContent}>
        <View style={styles.productHeader}>
          <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.productPrice}>Bs.S {item.price.toFixed(2)}</Text>
        </View>
        <Text style={styles.productDescription} numberOfLines={2}>
          {item.description || 'Sin descripción'}
        </Text>
        <View style={styles.productFooter}>
          <View style={styles.stockBadge}>
            <Ionicons name="cube-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.stockText}>{item.stock} disponibles</Text>
          </View>
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={() => openModal(item)}
            >
              <Ionicons name="create-outline" size={20} color={colors.white} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => setShowDeleteConfirm(item.id)}
            >
              <Ionicons name="trash-outline" size={20} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>
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

        <Text style={styles.headerTitle}>Gestión de Productos</Text>
        <Text style={styles.headerSubtitle}>Administra el menú de la cantina</Text>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar producto..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.textSecondary}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
          <TouchableOpacity
            style={[styles.filterChip, selectedFilter === 'all' && styles.filterChipActive]}
            onPress={() => setSelectedFilter('all')}
          >
            <Text style={[styles.filterText, selectedFilter === 'all' && styles.filterTextActive]}>Todos</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, selectedFilter === 'low-stock' && styles.filterChipActive]}
            onPress={() => setSelectedFilter('low-stock')}
          >
            <Text style={[styles.filterText, selectedFilter === 'low-stock' && styles.filterTextActive]}>Bajo Stock</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, selectedFilter === 'out-of-stock' && styles.filterChipActive]}
            onPress={() => setSelectedFilter('out-of-stock')}
          >
            <Text style={[styles.filterText, selectedFilter === 'out-of-stock' && styles.filterTextActive]}>Agotados</Text>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>

      {loading ? (
        <View style={styles.centered}>
          <Text>Cargando productos...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="fast-food-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>No se encontraron productos</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => openModal()}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[colors.secondary, '#E67E22']}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={30} color={colors.white} />
        </LinearGradient>
      </TouchableOpacity>

      {renderToast()}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formContainer}>
              <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                {imageUrl ? (
                  <Image source={{ uri: imageUrl }} style={styles.previewImage} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="camera-outline" size={40} color={colors.textSecondary} />
                    <Text style={styles.imagePlaceholderText}>Toca para agregar imagen</Text>
                  </View>
                )}
              </TouchableOpacity>

              <Input
                label="Nombre del Producto *"
                value={name}
                onChangeText={setName}
                placeholder="Ej. Empanada de Queso"
                icon="fast-food-outline"
              />

              <Input
                label="Descripción"
                value={description}
                onChangeText={setDescription}
                placeholder="Descripción detallada..."
                multiline
                numberOfLines={3}
                icon="document-text-outline"
                containerStyle={{ height: 120 }}
              />

              <View style={styles.row}>
                <View style={styles.halfColumn}>
                  <Input
                    label="Precio (Bs.S) *"
                    value={price}
                    onChangeText={setPrice}
                    placeholder="0.00"
                    keyboardType="numeric"
                    icon="cash-outline"
                  />
                </View>
                <View style={styles.halfColumn}>
                  <Input
                    label="Stock Inicial *"
                    value={stock}
                    onChangeText={setStock}
                    placeholder="0"
                    keyboardType="numeric"
                    icon="cube-outline"
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSave}
              >
                <Text style={styles.saveButtonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
          {renderToast()}
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent={true}
        visible={!!showDeleteConfirm}
        onRequestClose={() => setShowDeleteConfirm(null)}
      >
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmCard}>
            <View style={styles.confirmIconContainer}>
              <Ionicons name="trash" size={32} color="#E74C3C" />
            </View>
            <Text style={styles.confirmTitle}>¿Eliminar Producto?</Text>
            <Text style={styles.confirmSubtitle}>
              Esta acción no se puede deshacer. El producto se borrará permanentemente de tu menú.
            </Text>
            <View style={styles.confirmFooter}>
              <TouchableOpacity
                style={[styles.confirmButton, styles.confirmCancelBtn]}
                onPress={() => setShowDeleteConfirm(null)}
              >
                <Text style={styles.confirmCancelText}>No, mantener</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, styles.confirmDeleteBtn]}
                onPress={handleDelete}
              >
                <Text style={styles.confirmDeleteText}>Sí, eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
          {renderToast()}
        </View>
      </Modal>
    </View >
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
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  filtersContainer: {
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  filterChipActive: {
    backgroundColor: colors.white,
    borderColor: colors.white,
  },
  filterText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 13,
  },
  filterTextActive: {
    color: colors.primary,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  productCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    marginBottom: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    height: 120,
  },
  productImage: {
    width: 120,
    height: '100%',
    backgroundColor: '#f0f0f0',
  },
  productContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.secondary,
  },
  productDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    gap: 12,
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f6fa',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  stockText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#3498DB',
  },
  deleteButton: {
    backgroundColor: '#E74C3C',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    height: '85%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  formContainer: {
    flex: 1,
  },
  imagePicker: {
    width: '100%',
    height: 200,
    backgroundColor: '#f5f6fa',
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    marginTop: 8,
    color: colors.textSecondary,
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  halfColumn: {
    flex: 1,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 20,
    marginBottom: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f6fa',
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  saveButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  toastContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: '#2ECC71',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 9999,
  },
  toastSuccess: {
    backgroundColor: '#2ECC71',
  },
  toastError: {
    backgroundColor: '#E74C3C',
  },
  toastText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  confirmCard: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  confirmIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FDEDEC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  confirmSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  confirmFooter: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmCancelBtn: {
    backgroundColor: '#F5F6FA',
  },
  confirmDeleteBtn: {
    backgroundColor: '#E74C3C',
  },
  confirmCancelText: {
    color: colors.textSecondary,
    fontWeight: 'bold',
  },
  confirmDeleteText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default ProductsScreen;
