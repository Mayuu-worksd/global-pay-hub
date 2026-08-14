export interface IStablecoinProvider {
  /**
   * Tests connection to the provider sandbox.
   * Should return true if connection succeeds, or false/throw error if it fails.
   */
  testConnection(): Promise<boolean>;

  /**
   * Creates a new customer/account profile with the stablecoin provider.
   */
  createCustomer(data: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    date_of_birth?: string;
    address?: {
      street: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
    };
    [key: string]: any;
  }): Promise<{ id: string; status: string; raw: any }>;

  /**
   * Retrieves a customer profile from the provider.
   */
  getCustomer(customerId: string): Promise<{ id: string; status: string; raw: any }>;

  /**
   * Simulates the KYC approval flow for the customer in the sandbox environment.
   */
  simulateKYCApproval(customerId: string): Promise<{ status: string; raw: any }>;

  /**
   * Requests/provisions a virtual fiat deposit account for a customer.
   */
  createVirtualAccount(
    customerId: string,
    currency: string,
    options?: any
  ): Promise<{
    id: string;
    accountNumber: string;
    routingNumber?: string;
    bankName?: string;
    bankAddress?: string;
    raw: any;
  }>;

  /**
   * Lists the virtual accounts provisioned for a customer.
   */
  getVirtualAccounts(customerId: string): Promise<Array<{
    id: string;
    accountNumber: string;
    routingNumber?: string;
    status: string;
  }>>;

  /**
   * Creates a payment intent or executes a transfer.
   */
  createTransferOrPaymentIntent(data: {
    customerId: string;
    amount: number;
    currency: string;
    destination?: string; // Target wallet address or payout target
    [key: string]: any;
  }): Promise<{ id: string; status: string; raw: any }>;

  /**
   * Retrieves the account balances.
   */
  getBalance?(accountId: string): Promise<{ balance: number; available: number }>;

  /**
   * Parses webhook payloads received from the provider.
   */
  parseWebhook(
    headers: any,
    body: any
  ): Promise<{
    eventId: string;
    eventType: string;
    customerId?: string;
    status?: string;
    raw: any;
  }>;
}
