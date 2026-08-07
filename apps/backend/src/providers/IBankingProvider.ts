export interface IBankingProvider {
  createCustomer(data: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    date_of_birth: string;
    address: {
      street: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
    };
  }): Promise<{ id: string; status: string }>;

  createAccount(customerId: string, currency: string): Promise<{
    accountNumber: string;
    routingNumber?: string;
    iban?: string;
    swift_bic?: string;
    bankName: string;
    bankAddress: string;
  }>;

  getBalance(accountId: string): Promise<{ balance: number; available: number }>;

  createBeneficiary(data: {
    name: string;
    currency: string;
    country: string;
    account_number?: string;
    routing_number?: string;
    iban?: string;
    swift_bic?: string;
  }): Promise<{ id: string }>;

  sendPayment(data: {
    accountId: string;
    beneficiaryId: string;
    amount: number;
    currency: string;
    reference: string;
  }): Promise<{ id: string; status: string }>;

  getTransactions(accountId: string): Promise<Array<{
    id: string;
    amount: number;
    currency: string;
    type: 'deposit' | 'withdrawal';
    description: string;
    status: 'pending' | 'completed' | 'failed';
    created_at: string;
  }>>;

  createVirtualAccount(customerId: string, currency: string): Promise<{
    accountNumber: string;
    routingNumber?: string;
    iban?: string;
    swift_bic?: string;
    bankName: string;
    bankAddress: string;
  }>;
}
