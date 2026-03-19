import { TokenTransaction } from '../../domain/entities/TokenTransaction';
import { TokenRepository } from '../../domain/repositories/TokenRepository';
import { supabase } from '../../lib/supabase';
import { TokenTransactionModel, toTokenTransaction } from '../models/TokenTransactionModel';
import { UserModel } from '../models/UserModel';

export class TokenRepositoryImpl implements TokenRepository {
  async getTokenBalance(userId: string): Promise<number> {
    console.log('Getting token balance for user', userId);
    
    const { data, error } = await supabase
      .from('wallets')
      .select('saldo')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching token balance:', error.message);
      return 0;
    }
    
    return data?.saldo || 0;
  }

  async rechargeTokens(userId: string, amount: number): Promise<TokenTransaction> {
    throw new Error('Method not implemented.');
  }

  async getTransactionsByUser(userId: string): Promise<TokenTransaction[]> {
    console.log('Getting transactions for user', userId);
    
    const { data, error } = await supabase
      .from('token_transactions')
      .select('*, profiles:user_id (*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist') || error.message?.includes('Could not find')) {
        return []; // Tabla aún no existe, no es error real
      }
      console.error('Error fetching transactions:', error.message);
      return [];
    }

    if (!data) return [];

    return data.map((t: any) => {
      const p = t.profiles || {};
      const userModel: UserModel = {
        id: p.id || userId,
        email: p.email || '',
        role: p.role || 'student',
        firstName: p.first_name || 'Unknown',
        lastName: p.last_name || 'User',
        parentId: p.parent_id,
      };

      const model: TokenTransactionModel = {
        id: t.id,
        user: userModel,
        type: t.type || 'purchase',
        amount: t.amount || 0,
        createdAt: new Date(t.created_at || Date.now()).getTime(),
      };
      
      return toTokenTransaction(model);
    });
  }
}
