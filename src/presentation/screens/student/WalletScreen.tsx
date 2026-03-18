import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useState, Component, ErrorInfo, ReactNode } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { TokenRepositoryImpl } from '../../../data/repositories/TokenRepositoryImpl';
import { TokenTransaction } from '../../../domain/entities/TokenTransaction';
import { GetTransactionsByUserUseCase } from '../../../domain/usecases/GetTransactionsByUserUseCase';
import { useAuthStore } from '../../state/authStore';
import { colors } from '../../theme/colors';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class WalletErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Wallet Error Boundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.centered}>
          <Ionicons name="alert-circle" size={48} color={colors.danger} />
          <Text style={styles.errorTitle}>Algo salió mal</Text>
          <Text style={styles.errorText}>No pudimos cargar tu billetera.</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => this.setState({ hasError: false, error: null })}
          >
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const WalletScreenContent = () => {
  const { user } = useAuthStore();
  const [transactions, setTransactions] = useState<TokenTransaction[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'recharge' | 'purchase'>('all');

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const tokenRepository = new TokenRepositoryImpl();
        const getTransactionsUseCase = new GetTransactionsByUserUseCase(tokenRepository);

        // Optimize: Fetch data in parallel
        const [transactionsResult, balanceResult] = await Promise.all([
          getTransactionsUseCase.execute(user.id),
          tokenRepository.getTokenBalance(user.id)
        ]);

        setTransactions(transactionsResult);
        setBalance(balanceResult);
      } catch (error: any) {
        console.error('Error in WalletScreen:', error);
        if (error?.message?.includes('relation "token_transactions" does not exist') ||
            error?.message?.includes('Could not find relation') || 
            error?.message?.includes('token_transactions')) {
          console.warn('token_transactions table not found, mocking empty state');
          setTransactions([]);
          setBalance(0);
        } else {
          // If real error, still don't crash, just show empty
          setTransactions([]);
          setBalance(0);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(item => {
      // Filter by type
      if (activeFilter !== 'all' && item.type !== activeFilter) return false;

      // Filter by search query (amount or date or type)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const dateStr = new Date(item.createdAt || Date.now()).toLocaleDateString('es-ES', {
          day: '2-digit', month: 'short', year: 'numeric'
        }).toLowerCase();
        const amountStr = (item.amount || 0).toString();
        const typeStr = (item.type === 'recharge' ? 'recarga' : item.type === 'purchase' ? 'compra' : item.type).toLowerCase();

        return dateStr.includes(query) || amountStr.includes(query) || typeStr.includes(query);
      }

      return true;
    });
  }, [transactions, activeFilter, searchQuery]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando billetera...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      bounces={true}
    >
      {/* Header con gradiente */}
      <LinearGradient
        colors={['#B8956A', '#A67C52', '#B8956A']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Iconos decorativos de fondo */}
        <View style={StyleSheet.absoluteFill}>
          <Ionicons name="wallet" size={80} color="rgba(255,255,255,0.1)" style={{ position: 'absolute', right: -20, top: -10 }} />
          <Ionicons name="cash" size={60} color="rgba(255,255,255,0.08)" style={{ position: 'absolute', left: -10, bottom: -10 }} />
          <Ionicons name="card" size={40} color="rgba(255,255,255,0.05)" style={{ position: 'absolute', left: '40%', top: 10 }} />
        </View>
        <Text style={styles.headerTitle}>Billetera</Text>
        <Text style={styles.headerSubtitle}>Gestiona tu saldo</Text>
      </LinearGradient>

      {/* Balance Card con gradiente premium */}
      <View style={styles.cardShadowContainer}>
        <LinearGradient
          colors={['#ED9B40', '#E8872E', '#ED9B40']}
          style={styles.cardInner}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <Ionicons name="wallet" size={28} color="#fff" />
            </View>
            <Text style={styles.cardLabel}>Saldo Disponible</Text>
            <TouchableOpacity style={styles.rechargeButton} activeOpacity={0.8}>
              <LinearGradient
                colors={['#61C9A8', '#4FB896']}
                style={styles.rechargeButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="flash" size={18} color="#fff" />
                <Text style={styles.rechargeText}>Recargar</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.balanceContainer}>
            <Text style={styles.balanceText}>Bs.S {(balance || 0).toFixed(2)}</Text>
            {(balance || 0) < 10 && (
              <View style={styles.lowBalanceTag}>
                <Ionicons name="alert-circle" size={14} color="#fff" />
                <Text style={styles.lowBalanceText}>Saldo Bajo</Text>
              </View>
            )}
          </View>

          {/* Progress bar mejorado */}
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>
                <Ionicons name="trending-up" size={14} color="rgba(255,255,255,0.8)" /> Nivel de saldo
              </Text>
              <Text style={styles.progressValue}>
                {Math.min(Math.max(((balance || 0) / 100) * 100, 0), 100).toFixed(0)}%
              </Text>
            </View>
            <View style={styles.progressBarBackground}>
              <LinearGradient
                colors={['#61C9A8', '#4FB896']}
                style={[styles.progressBarFill, { width: `${Math.min(Math.max(((balance || 0) / 100) * 100, 0), 100)}%` }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </View>
          </View>

          {/* Decorative elements */}
          <View style={styles.decorativeCircle1} />
          <View style={styles.decorativeCircle2} />
        </LinearGradient>
      </View>

      {/* Search and Filters */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar transacciones..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer} contentContainerStyle={styles.filtersContent}>
          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'all' && styles.filterChipActive]}
            onPress={() => setActiveFilter('all')}
          >
            <Text style={[styles.filterText, activeFilter === 'all' && styles.filterTextActive]}>Todas</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'purchase' && styles.filterChipActive]}
            onPress={() => setActiveFilter('purchase')}
          >
            <Text style={[styles.filterText, activeFilter === 'purchase' && styles.filterTextActive]}>Compras</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'recharge' && styles.filterChipActive]}
            onPress={() => setActiveFilter('recharge')}
          >
            <Text style={[styles.filterText, activeFilter === 'recharge' && styles.filterTextActive]}>Recargas</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Transaction History */}
      <View style={styles.historyHeader}>
        <Text style={styles.sectionTitle}>
          <Ionicons name="time-outline" size={22} color={colors.text} /> Historial
        </Text>
      </View>

      <View style={styles.listContainer}>
        {filteredTransactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="search-outline" size={60} color="#DFE6E9" />
            </View>
            <Text style={styles.emptyTitle}>No se encontraron resultados</Text>
            <Text style={styles.emptyText}>Intenta con otra búsqueda o filtro</Text>
          </View>
        ) : (
          filteredTransactions.map((item) => {
            const isPositive = (item.amount || 0) > 0;
            const transactionTypeText =
              item.type === 'recharge' ? 'Recarga' :
                item.type === 'purchase' ? 'Compra' :
                  item.type;

            return (
              <View key={item.id} style={styles.transactionContainer}>
                <LinearGradient
                  colors={isPositive ? ['#61C9A8', '#4FB896'] : ['#ED9B40', '#E8872E']}
                  style={styles.transactionIcon}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons
                    name={isPositive ? "arrow-down" : "arrow-up"}
                    size={22}
                    color="#fff"
                  />
                </LinearGradient>
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionType}>{transactionTypeText}</Text>
                  <View style={styles.transactionDateRow}>
                    <Ionicons name="calendar-outline" size={12} color={colors.textSecondary} />
                    <Text style={styles.transactionDate}>
                      {new Date(item.createdAt || Date.now()).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.transactionAmount, isPositive ? styles.amountPositive : styles.amountNegative]}>
                  {isPositive ? '+' : ''}{(item.amount || 0).toFixed(2)} Bs.S
                </Text>
              </View>
            );
          })
        )}
      </View>
    </ScrollView >
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    color: colors.textSecondary,
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
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
  cardShadowContainer: {
    marginHorizontal: 24,
    marginTop: -50, // Overlap header
    marginBottom: 24,
    shadowColor: '#ED9B40',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
    borderRadius: 24,
  },
  cardInner: {
    borderRadius: 24,
    padding: 24,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  cardLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    flex: 1,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  rechargeButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#61C9A8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  rechargeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    gap: 6,
  },
  rechargeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  balanceContainer: {
    marginBottom: 20,
  },
  balanceText: {
    color: colors.white,
    fontSize: 40,
    fontWeight: 'bold',
    marginBottom: 10,
    letterSpacing: 0.8,
  },
  lowBalanceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.danger,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
    gap: 6,
    shadowColor: colors.danger,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  lowBalanceText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  progressContainer: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    alignItems: 'center',
  },
  progressLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  progressValue: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  progressBarBackground: {
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  decorativeCircle1: {
    position: 'absolute',
    width: '40%',
    aspectRatio: 1,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 215, 100, 0.15)',
    top: '-15%',
    right: '-15%',
  },
  decorativeCircle2: {
    position: 'absolute',
    width: '30%',
    aspectRatio: 1,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 180, 80, 0.15)',
    bottom: '-10%',
    left: '-10%',
  },
  searchSection: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 50,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  filtersContainer: {
    flexDirection: 'row',
  },
  filtersContent: {
    paddingRight: 24,
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.white,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    letterSpacing: 0.3,
  },
  listContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  transactionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  transactionDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  transactionDate: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  transactionAmount: {
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  amountPositive: {
    color: colors.success,
  },
  amountNegative: {
    color: colors.secondary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F5F6FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 14,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default function WalletScreen() {
  return (
    <WalletErrorBoundary>
      <WalletScreenContent />
    </WalletErrorBoundary>
  );
}
