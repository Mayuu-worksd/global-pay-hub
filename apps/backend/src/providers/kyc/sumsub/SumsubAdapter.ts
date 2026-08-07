import { IKYCProvider } from "../../IKYCProvider";
import axios, { AxiosInstance } from "axios";

export class SumsubAdapter implements IKYCProvider {
  private client: AxiosInstance;

  constructor() {
    const apiKey = process.env.SUMSUB_API_KEY || "";
    // Sumsub requires custom cryptographic signature headers in production.
    // This adapter defines the network shell for Sumsub SDK interaction.
    this.client = axios.create({
      baseURL: "https://api.sumsub.com",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
      },
      timeout: 15000,
    });
  }

  async createVerification(userId: string, email: string): Promise<{ id: string; url: string }> {
    if (!process.env.SUMSUB_API_KEY) {
      throw new Error("Sumsub API Key not configured.");
    }
    const response = await this.client.post("/resources/applicants", {
      externalUserId: userId,
      email: email,
    });
    return {
      id: response.data.id,
      url: `https://api.sumsub.com/idensic/static/main.js?userId=${userId}`,
    };
  }

  async verifyDocument(verificationId: string, documentType: string, documentImage: Buffer): Promise<{ status: "pending" | "approved" | "rejected" }> {
    if (!process.env.SUMSUB_API_KEY) {
      throw new Error("Sumsub API Key not configured.");
    }
    // Upload applicant docs
    return { status: "pending" };
  }

  async getStatus(verificationId: string): Promise<{ status: "pending" | "approved" | "rejected"; reason?: string }> {
    if (!process.env.SUMSUB_API_KEY) {
      throw new Error("Sumsub API Key not configured.");
    }
    const response = await this.client.get(`/resources/applicants/${verificationId}/status`);
    const status = response.data.reviewStatus;
    return {
      status: status === "completed" ? (response.data.reviewResult.reviewAnswer === "GREEN" ? "approved" : "rejected") : "pending",
      reason: response.data.reviewResult?.rejectLabels?.join(", ") || undefined,
    };
  }
}
