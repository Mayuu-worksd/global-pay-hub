import { supabase } from "@/integrations/supabase/client";

export interface UnitConfig {
  token: string;
  baseUrl: string;
}

export function readUnitConfig(): UnitConfig | null {
  const token = process.env["UNIT_API_TOKEN"] || process.env["UNIT_API_KEY"];
  const baseUrl = process.env["UNIT_API_BASE_URL"] || "https://api.s.unit.sh";
  if (!token) return null;
  return { token, baseUrl };
}

// REST wrapper for Unit JSON:API calls
async function unitRequest(path: string, options: RequestInit = {}) {
  const config = readUnitConfig();
  if (!config) return null;

  const url = `${config.baseUrl}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Authorization": `Bearer ${config.token}`,
      "Content-Type": "application/vnd.api+json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Unit API Error (${response.status}): ${errText}`);
  }

  return response.json();
}

export const unitService = {
  /**
   * Phase 2: Create KYC onboarding application on Unit
   */
  async createApplication(userId: string, data: {
    first_name: string;
    last_name: string;
    date_of_birth: string;
    nationality: string;
    phone: string;
    address_line1: string;
    city: string;
    state?: string;
    postal_code: string;
    country: string;
    email: string;
    id_document_type: string;
    id_document_number: string;
  }) {
    const config = readUnitConfig();
    if (!config) {
      throw new Error("Unit API credentials not configured.");
    }

    const payload = {
      data: {
        type: "individualApplication",
        attributes: {
          fullName: {
            first: data.first_name,
            last: data.last_name,
          },
          dateOfBirth: data.date_of_birth,
          address: {
            street: data.address_line1,
            city: data.city,
            state: data.state || "",
            postalCode: data.postal_code,
            country: data.country,
          },
          phone: {
            countryCode: "1",
            number: data.phone.replace(/\D/g, ""),
          },
          email: data.email,
          nationality: data.nationality,
          occupation: "ArchitectOrEngineer",
          // Unit does not accept a documents array in individualApplication.
          // Document verification is handled via Unit's hosted flow after application creation.
          ssn: data.id_document_number
            ? data.id_document_number.replace(/\D/g, "").padStart(9, "0").slice(0, 9)
            : undefined,
        }
      }
    };

    const res = await unitRequest("/applications", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return {
      id: res.data.id,
      status: res.data.attributes.status,
      customerId: res.data.relationships?.customer?.data?.id || null,
    };
  },

  /**
   * Phase 2: Retrieve KYC application status
   */
  async getApplicationStatus(applicationId: string) {
    const config = readUnitConfig();
    if (!config) {
      throw new Error("Unit API credentials not configured.");
    }

    const res = await unitRequest(`/applications/${applicationId}`);
    return res.data.attributes.status;
  },

  /**
   * Phase 2: Fetch Customer details
   */
  async getCustomer(customerId: string) {
    const config = readUnitConfig();
    if (!config) {
      throw new Error("Unit API credentials not configured.");
    }

    const res = await unitRequest(`/customers/${customerId}`);
    return {
      id: res.data.id,
      status: res.data.attributes.status,
    };
  },

  /**
   * Phase 2: Create a virtual deposit account on Unit
   */
  async createAccount(customerId: string, currency: string) {
    const config = readUnitConfig();
    if (!config) {
      throw new Error("Unit API credentials not configured.");
    }

    const payload = {
      data: {
        type: "depositAccount",
        attributes: {
          depositProduct: "checking",
        },
        relationships: {
          customer: {
            data: {
              type: "individualCustomer",
              id: customerId,
            }
          }
        }
      }
    };

    const res = await unitRequest("/accounts", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return {
      accountNumber: res.data.attributes.accountNumber,
      routingNumber: res.data.attributes.routingNumber,
      bankName: "Thread Bank",
      bankAddress: "Rogersville, TN",
    };
  },

  /**
   * Phase 2: Retrieve account transactions list
   */
  async getTransactions(accountId: string) {
    const config = readUnitConfig();
    if (!config) {
      throw new Error("Unit API credentials not configured.");
    }

    const res = await unitRequest(`/transactions?filter[accountId]=${accountId}`);
    return (res.data || []).map((t: any) => ({
      id: t.id,
      amount: t.attributes.amount / 100, // Unit ledger holds cents
      currency: t.attributes.currency,
      type: t.attributes.direction === "Debit" ? "withdrawal" : "deposit",
      description: t.attributes.description,
      status: t.attributes.status === "Pending" ? "pending" : "completed",
      created_at: t.attributes.created,
    }));
  },
};
