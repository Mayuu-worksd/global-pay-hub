import axios from "axios";
import { BridgeAdapter } from "./providers/stablecoin/bridge/BridgeAdapter";
import { GridAdapter } from "./providers/stablecoin/grid/GridAdapter";
import assert from "assert";

// Intercept axios client setup dynamically for unit/mock testing
const originalCreate = axios.create;
const mockRequests: Array<{ method: string; url: string; data?: any; headers?: any }> = [];

let mockResponseData: any = {};
let mockResponseStatus = 200;

axios.create = function(config?: any) {
  const instance = originalCreate.call(axios, config);
  
  instance.get = async function(url: string, cfg?: any): Promise<any> {
    mockRequests.push({ method: "GET", url, headers: { ...config?.headers, ...cfg?.headers } });
    return { data: mockResponseData, status: mockResponseStatus };
  } as any;
  
  instance.post = async function(url: string, data?: any, cfg?: any): Promise<any> {
    mockRequests.push({ method: "POST", url, data, headers: { ...config?.headers, ...cfg?.headers } });
    return { data: mockResponseData, status: mockResponseStatus };
  } as any;
  
  return instance;
};

// Set mock API keys for testing
process.env.BRIDGE_API_KEY = "mock-bridge-key";
process.env.GRID_API_KEY = "mock-grid-key";

async function runMockTests() {
  console.log("🧪 Starting Stablecoin Adapters Mock Unit Tests...\n");

  // 1. Test BridgeAdapter Create Customer
  console.log("👉 Testing BridgeAdapter.createCustomer...");
  const bridge = new BridgeAdapter();
  mockResponseData = {
    id: "cust_bridge123",
    kyc_status: "created",
    first_name: "John",
    last_name: "Doe"
  };
  mockRequests.length = 0;
  
  const custRes = await bridge.createCustomer({
    first_name: "John",
    last_name: "Doe",
    email: "john@example.com",
    phone: "+1234567890",
    address: {
      street: "123 Main St",
      city: "New York",
      state: "NY",
      postal_code: "10001",
      country: "US"
    }
  });

  assert.strictEqual(custRes.id, "cust_bridge123");
  assert.strictEqual(custRes.status, "created");
  assert.strictEqual(mockRequests.length, 1);
  assert.strictEqual(mockRequests[0].method, "POST");
  assert.strictEqual(mockRequests[0].url, "/v0/customers");
  assert.strictEqual(mockRequests[0].data.first_name, "John");
  assert.strictEqual(mockRequests[0].data.phone, "+1234567890");
  assert.strictEqual(mockRequests[0].data.address.street, "123 Main St");
  assert.strictEqual(mockRequests[0].headers["Api-Key"], "mock-bridge-key");
  console.log("✅ BridgeAdapter.createCustomer - SUCCESS");

  // 2. Test BridgeAdapter simulate KYC
  console.log("👉 Testing BridgeAdapter.simulateKYCApproval...");
  mockResponseData = { kyc_status: "approved" };
  mockRequests.length = 0;
  const kycRes = await bridge.simulateKYCApproval("cust_bridge123");
  assert.strictEqual(kycRes.status, "approved");
  assert.strictEqual(mockRequests.length, 1);
  assert.strictEqual(mockRequests[0].url, "/v0/customers/cust_bridge123/simulate_kyc_approval");
  console.log("✅ BridgeAdapter.simulateKYCApproval - SUCCESS");

  // 3. Test BridgeAdapter Create Virtual Account
  console.log("👉 Testing BridgeAdapter.createVirtualAccount...");
  mockResponseData = {
    id: "va_bridge123",
    bank_routing_details: {
      account_number: "987654321",
      routing_number: "123456789",
      bank_name: "Bridge Sandbox Bank",
      bank_address: "100 Bridge Rd, San Francisco, CA"
    }
  };
  mockRequests.length = 0;
  const vaRes = await bridge.createVirtualAccount("cust_bridge123", "usd");
  assert.strictEqual(vaRes.id, "va_bridge123");
  assert.strictEqual(vaRes.accountNumber, "987654321");
  assert.strictEqual(vaRes.routingNumber, "123456789");
  assert.strictEqual(vaRes.bankName, "Bridge Sandbox Bank");
  assert.strictEqual(vaRes.bankAddress, "100 Bridge Rd, San Francisco, CA");
  assert.strictEqual(mockRequests.length, 1);
  assert.strictEqual(mockRequests[0].url, "/v0/customers/cust_bridge123/virtual_accounts");
  assert.strictEqual(mockRequests[0].data.currency, "usd");
  console.log("✅ BridgeAdapter.createVirtualAccount - SUCCESS");

  // 4. Test BridgeAdapter Create Transfer
  console.log("👉 Testing BridgeAdapter.createTransferOrPaymentIntent...");
  mockResponseData = {
    id: "tx_bridge123",
    status: "pending"
  };
  mockRequests.length = 0;
  const txRes = await bridge.createTransferOrPaymentIntent({
    customerId: "cust_bridge123",
    amount: 100,
    currency: "usd",
    toAddress: "0xMockAddress"
  });
  assert.strictEqual(txRes.id, "tx_bridge123");
  assert.strictEqual(txRes.status, "pending");
  assert.strictEqual(mockRequests.length, 1);
  assert.strictEqual(mockRequests[0].url, "/v0/transfers");
  assert.strictEqual(mockRequests[0].data.on_behalf_of, "cust_bridge123");
  assert.strictEqual(mockRequests[0].data.amount, 100);
  assert.strictEqual(mockRequests[0].data.destination.to_address, "0xMockAddress");
  console.log("✅ BridgeAdapter.createTransferOrPaymentIntent - SUCCESS");

  // 5. Test GridAdapter Create Customer
  console.log("👉 Testing GridAdapter.createCustomer...");
  const grid = new GridAdapter();
  mockResponseData = {
    id: "acc_grid123",
    status: "active"
  };
  mockRequests.length = 0;
  const gridCust = await grid.createCustomer({
    first_name: "Alice",
    last_name: "Smith",
    email: "alice@example.com"
  });
  assert.strictEqual(gridCust.id, "acc_grid123");
  assert.strictEqual(mockRequests.length, 1);
  assert.strictEqual(mockRequests[0].url, "/grid/v1/accounts");
  assert.strictEqual(mockRequests[0].data.email, "alice@example.com");
  assert.strictEqual(mockRequests[0].headers["Authorization"], "Bearer mock-grid-key");
  console.log("✅ GridAdapter.createCustomer - SUCCESS");

  // 6. Test GridAdapter Create Virtual Account
  console.log("👉 Testing GridAdapter.createVirtualAccount...");
  mockResponseData = {
    id: "va_grid123",
    accountNumber: "55555",
    routingNumber: "66666",
    bankName: "Grid Bank",
    bankAddress: "Grid Headquarters"
  };
  mockRequests.length = 0;
  const gridVa = await grid.createVirtualAccount("acc_grid123", "USD");
  assert.strictEqual(gridVa.id, "va_grid123");
  assert.strictEqual(gridVa.accountNumber, "55555");
  assert.strictEqual(gridVa.routingNumber, "66666");
  assert.strictEqual(gridVa.bankName, "Grid Bank");
  assert.strictEqual(gridVa.bankAddress, "Grid Headquarters");
  assert.strictEqual(mockRequests.length, 1);
  assert.strictEqual(mockRequests[0].url, "/grid/v1/virtual-accounts");
  assert.strictEqual(mockRequests[0].data.currency, "USD");
  console.log("✅ GridAdapter.createVirtualAccount - SUCCESS");

  // 7. Test GridAdapter Create Payment Intent
  console.log("👉 Testing GridAdapter.createTransferOrPaymentIntent...");
  mockResponseData = {
    paymentIntentId: "pi_grid123",
    status: "pending"
  };
  mockRequests.length = 0;
  const gridTx = await grid.createTransferOrPaymentIntent({
    customerId: "acc_grid123",
    amount: 250,
    currency: "USD",
    toAddress: "0xGridRecipient"
  });
  assert.strictEqual(gridTx.id, "pi_grid123");
  assert.strictEqual(gridTx.status, "pending");
  assert.strictEqual(mockRequests.length, 1);
  assert.strictEqual(mockRequests[0].url, "/grid/v1/payment-intents");
  assert.strictEqual(mockRequests[0].data.accountId, "acc_grid123");
  assert.strictEqual(mockRequests[0].data.amount, 250);
  assert.strictEqual(mockRequests[0].data.destination, "0xGridRecipient");
  console.log("✅ GridAdapter.createTransferOrPaymentIntent - SUCCESS");

  console.log("\n🏁 All Mock Unit Tests Passed successfully!");
  process.exit(0);
}

runMockTests().catch(err => {
  console.error("❌ Mock Tests Failed:", err);
  process.exit(1);
});
