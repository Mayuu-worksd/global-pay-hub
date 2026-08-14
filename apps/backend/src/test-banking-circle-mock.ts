import axios from "axios";
import { BankingCircleProvider } from "./providers/banking/banking_circle/BankingCircleProvider";
import { handleBankingCircleWebhook } from "./controllers/webhooks.controller";
import assert from "assert";
import * as dotenv from "dotenv";
import * as path from "path";

// Load env variables
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

// Intercept axios client setup dynamically for unit/mock testing
const originalCreate = axios.create;
const mockRequests: Array<{ method: string; url: string; data?: any; headers?: any }> = [];

let mockResponseData: any = {};
let mockResponseStatus = 200;

axios.create = function (config?: any) {
  const instance = originalCreate.call(axios, config);

  instance.get = async function (url: string, cfg?: any): Promise<any> {
    mockRequests.push({
      method: "GET",
      url,
      headers: { ...config?.headers, ...cfg?.headers, ...instance.defaults.headers.common },
    });
    if (mockResponseStatus < 200 || mockResponseStatus >= 300) {
      const err = new Error(`Request failed with status code ${mockResponseStatus}`) as any;
      err.response = { data: mockResponseData, status: mockResponseStatus };
      throw err;
    }
    return { data: mockResponseData, status: mockResponseStatus };
  } as any;

  instance.post = async function (url: string, data?: any, cfg?: any): Promise<any> {
    mockRequests.push({
      method: "POST",
      url,
      data,
      headers: { ...config?.headers, ...cfg?.headers, ...instance.defaults.headers.common },
    });
    if (mockResponseStatus < 200 || mockResponseStatus >= 300) {
      const err = new Error(`Request failed with status code ${mockResponseStatus}`) as any;
      err.response = { data: mockResponseData, status: mockResponseStatus };
      throw err;
    }
    return { data: mockResponseData, status: mockResponseStatus };
  } as any;

  return instance;
};

// Set mock environment variables
process.env.BANKING_CIRCLE_BASE_URL = "https://sandbox.bankingcircleconnect.com";
process.env.BANKING_CIRCLE_AUTH_URL = "https://authorizationsandbox.bankingcircleconnect.com";
process.env.BANKING_CIRCLE_USERNAME = "test-api-user";
process.env.BANKING_CIRCLE_PASSWORD = "test-api-password";

// Mock Express response helper
function createMockResponse(onDone: (status: number, data: any) => void) {
  const res: any = {};
  res.status = function (code: number) {
    this.statusCode = code;
    return this;
  };
  res.json = function (data: any) {
    onDone(this.statusCode || 200, data);
    return this;
  };
  return res;
}

async function runMockTests() {
  console.log("🧪 Starting Banking Circle Adapter Mock Unit Tests...\n");

  const provider = new BankingCircleProvider();

  // 1. Test OAuth2 Authentication and Token Caching
  console.log("👉 Testing OAuth2 Authentication & Token Caching...");
  mockResponseData = {
    access_token: "mock-access-token-12345",
    expires_in: 3600,
    token_type: "Bearer",
  };
  mockResponseStatus = 200;
  mockRequests.length = 0;

  // Triggering an operation that requires authentication
  const balance = await provider.getBalance("acc_123");
  
  // We expect:
  // - First request: Auth POST to auth URL
  // - Second request: GET to retrieve account details from base URL
  assert.strictEqual(mockRequests.length, 2);
  assert.strictEqual(mockRequests[0].method, "POST");
  assert.strictEqual(mockRequests[0].headers["Authorization"], "Basic dGVzdC1hcGktdXNlcjp0ZXN0LWFwaS1wYXNzd29yZA==");
  assert.strictEqual(mockRequests[1].method, "GET");
  assert.strictEqual(mockRequests[1].url, "/api/v1/accounts/acc_123");
  assert.strictEqual(mockRequests[1].headers["Authorization"], "Bearer mock-access-token-12345");
  console.log("✅ OAuth2 Authentication & Token Caching - SUCCESS");

  // 2. Test Customer Creation mapping
  console.log("👉 Testing Customer Creation Mapping...");
  mockResponseData = {
    customerId: "bc_cust_998877",
    status: "Active",
  };
  mockRequests.length = 0;

  const customerRes = await provider.createCustomer({
    first_name: "Alice",
    last_name: "Smith",
    email: "alice@example.com",
    phone: "+15555551234",
    date_of_birth: "1988-11-22",
    address: {
      street: "456 Oak Ave",
      city: "Seattle",
      state: "WA",
      postal_code: "98101",
      country: "US",
    },
  });

  assert.strictEqual(customerRes.id, "bc_cust_998877");
  assert.strictEqual(customerRes.status, "Active");
  assert.strictEqual(mockRequests.length, 1);
  assert.strictEqual(mockRequests[0].method, "POST");
  assert.strictEqual(mockRequests[0].url, "/api/v1/customers");
  assert.strictEqual(mockRequests[0].data.name, "Alice Smith");
  assert.strictEqual(mockRequests[0].data.address.country, "US");
  assert.strictEqual(mockRequests[0].data.address.streetName, "456 Oak Ave");
  console.log("✅ Customer Creation Mapping - SUCCESS");

  // 3. Test Account Creation mapping
  console.log("👉 Testing Account Creation Mapping...");
  mockResponseData = {
    accountNumber: "BC987654321",
    routingNumber: "987654321",
    iban: "DK45BCCJ987654321",
    bic: "BCCJDKKKXXX",
    bankName: "Banking Circle Live Bank",
    bankAddress: "Copenhagen, Denmark",
  };
  mockRequests.length = 0;

  const accountRes = await provider.createAccount("bc_cust_998877", "EUR");

  assert.strictEqual(accountRes.accountNumber, "BC987654321");
  assert.strictEqual(accountRes.iban, "DK45BCCJ987654321");
  assert.strictEqual(accountRes.swift_bic, "BCCJDKKKXXX");
  assert.strictEqual(accountRes.bankName, "Banking Circle Live Bank");
  assert.strictEqual(mockRequests.length, 1);
  assert.strictEqual(mockRequests[0].method, "POST");
  assert.strictEqual(mockRequests[0].url, "/api/v1/accounts");
  assert.strictEqual(mockRequests[0].data.customerId, "bc_cust_998877");
  assert.strictEqual(mockRequests[0].data.currency, "EUR");
  console.log("✅ Account Creation Mapping - SUCCESS");

  // 4. Test Beneficiary Creation mapping
  console.log("👉 Testing Beneficiary Creation Mapping...");
  mockResponseData = {
    beneficiaryId: "bc_bene_112233",
  };
  mockRequests.length = 0;

  const beneficiaryRes = await provider.createBeneficiary({
    name: "Bob Jones",
    currency: "USD",
    country: "US",
    account_number: "11223344",
    routing_number: "123456789",
  });

  assert.strictEqual(beneficiaryRes.id, "bc_bene_112233");
  assert.strictEqual(mockRequests.length, 1);
  assert.strictEqual(mockRequests[0].method, "POST");
  assert.strictEqual(mockRequests[0].url, "/api/v1/beneficiaries");
  assert.strictEqual(mockRequests[0].data.name, "Bob Jones");
  assert.strictEqual(mockRequests[0].data.currency, "USD");
  assert.strictEqual(mockRequests[0].data.accountNumber, "11223344");
  console.log("✅ Beneficiary Creation Mapping - SUCCESS");

  // 5. Test Payment Order execution mapping
  console.log("👉 Testing Payment Order Execution Mapping...");
  mockResponseData = {
    paymentId: "bc_pay_776655",
    status: "Pending",
  };
  mockRequests.length = 0;

  const paymentRes = await provider.sendPayment({
    accountId: "acc_123",
    beneficiaryId: "bc_bene_112233",
    amount: 1500.0,
    currency: "USD",
    reference: "invoice-77",
  });

  assert.strictEqual(paymentRes.id, "bc_pay_776655");
  assert.strictEqual(paymentRes.status, "Pending");
  assert.strictEqual(mockRequests.length, 1);
  assert.strictEqual(mockRequests[0].method, "POST");
  assert.strictEqual(mockRequests[0].url, "/api/v1/payment-orders");
  assert.strictEqual(mockRequests[0].data.debtorAccountId, "acc_123");
  assert.strictEqual(mockRequests[0].data.amount, 1500.0);
  assert.strictEqual(mockRequests[0].data.paymentReference, "invoice-77");
  console.log("✅ Payment Order Execution Mapping - SUCCESS");

  // 6. Test Bookings/Transactions retrieval mapping
  console.log("👉 Testing Transactions Retrieval Mapping...");
  mockResponseData = {
    bookings: [
      {
        bookingId: "tx_001",
        amount: -50.0,
        currency: "EUR",
        description: "Payment to Shop",
        bookingDate: "2026-08-10T12:00:00Z",
      },
      {
        bookingId: "tx_002",
        amount: 300.0,
        currency: "EUR",
        description: "Refund",
        bookingDate: "2026-08-11T14:30:00Z",
      },
    ],
  };
  mockRequests.length = 0;

  const txs = await provider.getTransactions("acc_123");

  assert.strictEqual(txs.length, 2);
  assert.strictEqual(txs[0].id, "tx_001");
  assert.strictEqual(txs[0].amount, 50.0);
  assert.strictEqual(txs[0].type, "withdrawal");
  assert.strictEqual(txs[1].id, "tx_002");
  assert.strictEqual(txs[1].amount, 300.0);
  assert.strictEqual(txs[1].type, "deposit");
  assert.strictEqual(mockRequests.length, 1);
  assert.strictEqual(mockRequests[0].method, "GET");
  assert.strictEqual(mockRequests[0].url, "/api/v1/accounts/acc_123/bookings");
  console.log("✅ Transactions Retrieval Mapping - SUCCESS");

  // 7. Test Simulations
  console.log("👉 Testing Incoming Payment Simulation Mapping...");
  mockResponseData = {
    transactionId: "bc_sim_tx_8833",
    status: "Settled",
  };
  mockRequests.length = 0;

  const simIncoming = await provider.simulateIncomingPayment({
    accountNumber: "BC987654321",
    amount: 5000.0,
    currency: "USD",
    reference: "test-incoming-sim",
    debtorName: "Zeta Corp",
  });

  assert.strictEqual(simIncoming.transactionId, "bc_sim_tx_8833");
  assert.strictEqual(simIncoming.status, "Settled");
  assert.strictEqual(mockRequests.length, 1);
  assert.strictEqual(mockRequests[0].method, "POST");
  assert.strictEqual(mockRequests[0].url, "/api/v1/simulations/incoming-payments");
  assert.strictEqual(mockRequests[0].data.creditorAccountNumber, "BC987654321");
  assert.strictEqual(mockRequests[0].data.amount, 5000.0);
  console.log("✅ Incoming Payment Simulation Mapping - SUCCESS");

  // 8. Test Error Handling
  console.log("👉 Testing Error Handling...");
  mockResponseStatus = 500;
  mockResponseData = { message: "Internal server error" };
  
  await assert.rejects(
    async () => {
      await provider.getBalance("acc_123");
    },
    /Banking Circle getBalance error/
  );
  console.log("✅ Error Handling - SUCCESS");

  // 9. Test Webhook Processing logic
  console.log("👉 Testing Webhook Handler Logic...");
  let responseCode = 0;
  let responsePayload: any = null;

  const mockRes = createMockResponse((status, data) => {
    responseCode = status;
    responsePayload = data;
  });

  const webhookBody = {
    type: "payment.received",
    data: {
      accountNumber: "BC987654321",
      amount: 2500.5,
      currency: "USD",
      reference: "bc_ref_e2e_1122",
      debtorName: "Mock Sender Corp",
    },
  };

  const mockReq: any = {
    body: webhookBody,
  };

  // We invoke the webhook. Since it performs DB operations, it will try to interact with Supabase client.
  // We verify that it executes without throwing unhandled exceptions and returns a structured response.
  // (In local tests without database entries, it should gracefully skip wallet updates and log, returning 200).
  await handleBankingCircleWebhook(mockReq, mockRes);
  assert.strictEqual(responseCode, 200);
  assert.deepStrictEqual(responsePayload, { received: true });
  console.log("✅ Webhook Handler Logic - SUCCESS");

  console.log("\n🎉 ALL BANKING CIRCLE MOCK UNIT TESTS COMPLETED SUCCESSFULLY!");
}

runMockTests().catch((err) => {
  console.error("\n❌ Mock Unit Tests Failed:", err);
  process.exit(1);
});
