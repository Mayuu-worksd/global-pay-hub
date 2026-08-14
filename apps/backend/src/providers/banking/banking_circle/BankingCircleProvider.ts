import { IBankingProvider } from "../../IBankingProvider";
import axios, { AxiosInstance } from "axios";
import * as fs from "fs";
import * as https from "https";
import { logger } from "../../../utils/logger";

export class BankingCircleProvider implements IBankingProvider {
  private client: AxiosInstance;
  private authClient: AxiosInstance;
  private token: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    const baseUrl = process.env.BANKING_CIRCLE_BASE_URL || "https://sandbox.bankingcircleconnect.com";
    const authUrl = process.env.BANKING_CIRCLE_AUTH_URL || "https://authorizationsandbox.bankingcircleconnect.com";
    const certificatePath = process.env.BANKING_CIRCLE_CERTIFICATE_PATH;
    const certificatePassword = process.env.BANKING_CIRCLE_CERTIFICATE_PASSWORD;

    // Configure mTLS agent if certificate path is provided and exists
    let httpsAgent: https.Agent | undefined;
    if (certificatePath) {
      try {
        if (fs.existsSync(certificatePath)) {
          const pfxBuffer = fs.readFileSync(certificatePath);
          httpsAgent = new https.Agent({
            pfx: pfxBuffer,
            passphrase: certificatePassword,
            rejectUnauthorized: false, // Standard for sandboxes, but can be configured
          });
          logger.info(`[BankingCircleProvider] Successfully loaded client certificate from ${certificatePath}`);
        } else {
          logger.warn(`[BankingCircleProvider] Certificate path provided (${certificatePath}) but file does not exist.`);
        }
      } catch (err: any) {
        logger.error(`[BankingCircleProvider] Failed to load certificate: ${err.message}`);
      }
    }

    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 15000,
      httpsAgent,
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
    });

    this.authClient = axios.create({
      baseURL: authUrl,
      timeout: 15000,
      httpsAgent,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
      },
    });
  }

  /**
   * Performs OAuth2 token exchange and caches the access token.
   */
  private async authenticate(): Promise<void> {
    const now = Date.now();
    // Re-use cached token if it has at least 30 seconds left
    if (this.token && this.tokenExpiry > now + 30000) {
      return;
    }

    const username = process.env.BANKING_CIRCLE_USERNAME || "";
    const password = process.env.BANKING_CIRCLE_PASSWORD || "";

    if (!username || !password) {
      throw new Error("Banking Circle configuration credentials missing in .env");
    }

    try {
      logger.info("[BankingCircleProvider] Fetching OAuth2 access token...");

      const params = new URLSearchParams();
      params.append("grant_type", "client_credentials");

      // Pass credentials in Basic Authorization header as standard, and/or body
      const authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
      
      const response = await this.authClient.post("", params.toString(), {
        headers: {
          "Authorization": authHeader,
        },
      });

      if (response.data && response.data.access_token) {
        this.token = response.data.access_token;
        const expiresIn = response.data.expires_in || 3600;
        this.tokenExpiry = now + expiresIn * 1000;
        this.client.defaults.headers.common["Authorization"] = `Bearer ${this.token}`;
        logger.info("[BankingCircleProvider] Successfully authenticated.");
      } else {
        throw new Error("Invalid response payload from token endpoint.");
      }
    } catch (err: any) {
      const errorMsg = err.response?.data ? JSON.stringify(err.response.data) : err.message;
      logger.error(`[BankingCircleProvider] Authentication failed: ${errorMsg}`);
      throw new Error(`Banking Circle auth failure: ${errorMsg}`);
    }
  }

  async createCustomer(data: {
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
  }): Promise<{ id: string; status: string }> {
    await this.authenticate();

    // Map address country to 2-letter ISO code as standard for banking
    const countryCode = data.address.country.length === 2 ? data.address.country.toUpperCase() : "US";

    try {
      const payload = {
        name: `${data.first_name} ${data.last_name}`,
        email: data.email,
        phone: data.phone,
        dateOfBirth: data.date_of_birth,
        address: {
          streetName: data.address.street,
          cityName: data.address.city,
          country: countryCode,
          postalCode: data.address.postal_code,
        },
        clientType: "Individual",
      };

      const response = await this.client.post("/api/v1/customers", payload);
      return {
        id: response.data.customerId || response.data.id,
        status: response.data.status || "Active",
      };
    } catch (err: any) {
      this.handleError("createCustomer", err);
    }
  }

  async createAccount(customerId: string, currency: string): Promise<{
    accountNumber: string;
    routingNumber?: string;
    iban?: string;
    swift_bic?: string;
    bankName: string;
    bankAddress: string;
  }> {
    await this.authenticate();

    try {
      const payload = {
        customerId,
        currency: currency.toUpperCase(),
        accountType: "Virtual",
      };

      const response = await this.client.post("/api/v1/accounts", payload);
      return {
        accountNumber: response.data.accountNumber,
        routingNumber: response.data.routingCode || response.data.routingNumber,
        iban: response.data.iban,
        swift_bic: response.data.bic || response.data.swift_bic,
        bankName: response.data.bankName || "Banking Circle",
        bankAddress: response.data.bankAddress || "Copenhagen, Denmark",
      };
    } catch (err: any) {
      this.handleError("createAccount", err);
    }
  }

  async getBalance(accountId: string): Promise<{ balance: number; available: number }> {
    await this.authenticate();

    try {
      const response = await this.client.get(`/api/v1/accounts/${accountId}`);
      const balance = response.data.balance || 0;
      const available = response.data.availableBalance || balance;
      return { balance, available };
    } catch (err: any) {
      this.handleError("getBalance", err);
    }
  }

  async createBeneficiary(data: {
    name: string;
    currency: string;
    country: string;
    account_number?: string;
    routing_number?: string;
    iban?: string;
    swift_bic?: string;
  }): Promise<{ id: string }> {
    await this.authenticate();

    try {
      const payload = {
        name: data.name,
        currency: data.currency.toUpperCase(),
        country: data.country.toUpperCase(),
        accountNumber: data.account_number,
        routingCode: data.routing_number,
        iban: data.iban,
        bic: data.swift_bic,
      };

      const response = await this.client.post("/api/v1/beneficiaries", payload);
      return { id: response.data.beneficiaryId || response.data.id };
    } catch (err: any) {
      this.handleError("createBeneficiary", err);
    }
  }

  async sendPayment(data: {
    accountId: string;
    beneficiaryId: string;
    amount: number;
    currency: string;
    reference: string;
  }): Promise<{ id: string; status: string }> {
    await this.authenticate();

    try {
      const payload = {
        debtorAccountId: data.accountId,
        creditorId: data.beneficiaryId,
        amount: data.amount,
        currency: data.currency.toUpperCase(),
        requestedExecutionDate: new Date().toISOString().split("T")[0],
        paymentReference: data.reference,
      };

      const response = await this.client.post("/api/v1/payment-orders", payload);
      return {
        id: response.data.paymentId || response.data.id,
        status: response.data.status || "Pending",
      };
    } catch (err: any) {
      this.handleError("sendPayment", err);
    }
  }

  async getTransactions(accountId: string): Promise<Array<{
    id: string;
    amount: number;
    currency: string;
    type: "deposit" | "withdrawal";
    description: string;
    status: "pending" | "completed" | "failed";
    created_at: string;
  }>> {
    await this.authenticate();

    try {
      const response = await this.client.get(`/api/v1/accounts/${accountId}/bookings`);
      return (response.data.bookings || response.data.transactions || []).map((t: any) => ({
        id: t.bookingId || t.id,
        amount: Math.abs(t.amount),
        currency: t.currency || "USD",
        type: t.amount < 0 ? "withdrawal" : "deposit",
        description: t.description || t.narrative || "Banking Circle Transfer",
        status: t.status === "Settled" || t.status === "Completed" ? "completed" : "pending",
        created_at: t.bookingDate || t.valueDate || new Date().toISOString(),
      }));
    } catch (err: any) {
      this.handleError("getTransactions", err);
    }
  }

  async createVirtualAccount(customerId: string, currency: string): Promise<{
    accountNumber: string;
    routingNumber?: string;
    iban?: string;
    swift_bic?: string;
    bankName: string;
    bankAddress: string;
  }> {
    return this.createAccount(customerId, currency);
  }

  // --- Simulation Methods ---

  /**
   * Simulates an incoming payment to a virtual IBAN / account.
   */
  async simulateIncomingPayment(data: {
    accountNumber: string;
    amount: number;
    currency: string;
    reference: string;
    debtorName: string;
  }): Promise<{ transactionId: string; status: string }> {
    await this.authenticate();

    try {
      const payload = {
        creditorAccountNumber: data.accountNumber,
        amount: data.amount,
        currency: data.currency.toUpperCase(),
        paymentReference: data.reference,
        debtorName: data.debtorName,
      };

      const response = await this.client.post("/api/v1/simulations/incoming-payments", payload);
      return {
        transactionId: response.data.transactionId || response.data.id,
        status: response.data.status || "Settled",
      };
    } catch (err: any) {
      this.handleError("simulateIncomingPayment", err);
    }
  }

  /**
   * Simulates an update to a payment's status in Sandbox.
   */
  async simulatePaymentStatus(paymentId: string, status: "Settled" | "Failed" | "Cancelled"): Promise<{ paymentId: string; status: string }> {
    await this.authenticate();

    try {
      const payload = { status };
      const response = await this.client.post(`/api/v1/simulations/payments/${paymentId}/status`, payload);
      return {
        paymentId: response.data.paymentId || paymentId,
        status: response.data.status || status,
      };
    } catch (err: any) {
      this.handleError("simulatePaymentStatus", err);
    }
  }

  /**
   * Handles errors from axios requests. Always logs and throws a proper provider error.
   */
  private handleError(action: string, error: any): never {
    const errorDetails = error.response?.data
      ? JSON.stringify(error.response.data)
      : error.message;

    logger.error(`[BankingCircleProvider] ${action} failed: ${errorDetails}`);
    throw new Error(`Banking Circle ${action} error: ${errorDetails}`);
  }
}
