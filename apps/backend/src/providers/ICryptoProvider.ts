export interface ICryptoProvider {
  createWallet(asset: string, name: string): Promise<{ id: string; status: string }>;
  generateAddress(walletId: string, asset: string): Promise<{ address: string; destinationTag?: string }>;
  getBalance(walletId: string, asset: string): Promise<{ balance: number; available: number }>;
  sendTransaction(data: {
    walletId: string;
    asset: string;
    toAddress: string;
    amount: number;
    destinationTag?: string;
  }): Promise<{ txHash: string; status: 'pending' | 'completed' | 'failed' }>;
  getTransactions(walletId: string, asset: string): Promise<Array<{
    id: string;
    txHash: string;
    amount: number;
    fee: number;
    type: 'receive' | 'send';
    status: 'pending' | 'completed' | 'failed';
    created_at: string;
  }>>;
}
