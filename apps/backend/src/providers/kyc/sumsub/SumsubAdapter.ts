import { IKYCProvider } from "../../IKYCProvider";
import axios from "axios";
import crypto from "crypto";

export class SumsubAdapter implements IKYCProvider {
  private apiKey: string;
  private secretKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.SUMSUB_API_KEY || "";
    this.secretKey = process.env.SUMSUB_SECRET_KEY || "";
    this.baseUrl = "https://api.sumsub.com";
  }

  private getHeaders(method: string, path: string, body: any, isMultipart = false) {
    const ts = Math.floor(Date.now() / 1000);
    
    // For multipart, do not sign the body, only sign ts + method + path
    const requestBody = isMultipart 
      ? "" 
      : (typeof body === "string" ? body : (body ? JSON.stringify(body) : ""));
    
    const signature = crypto
      .createHmac("sha256", this.secretKey)
      .update(ts + method.toUpperCase() + path + requestBody)
      .digest("hex");

    return {
      "X-App-Token": this.apiKey,
      "X-App-Access-Ts": String(ts),
      "X-App-Access-Sig": signature,
    };
  }

  async createVerification(userId: string, email: string, details?: any): Promise<{ id: string; url: string }> {
    if (!this.apiKey || !this.secretKey) {
      throw new Error("Sumsub API credentials not configured.");
    }

    const levelName = process.env.SUMSUB_LEVEL_NAME || "id-only";
    const path = `/resources/applicants?levelName=${levelName}`;
    const body = {
      externalUserId: userId,
      email: email,
      info: details ? {
        firstName: details.first_name,
        lastName: details.last_name,
        dob: details.date_of_birth,
        phone: details.phone,
        country: details.country,
        addresses: [
          {
            street: details.address_line1,
            subStreet: details.address_line2 || "",
            city: details.city,
            state: details.state || "",
            postalCode: details.postal_code,
            country: details.country,
          }
        ]
      } : undefined
    };

    const headers = this.getHeaders("POST", path, body);
    const response = await axios.post(`${this.baseUrl}${path}`, body, { headers });

    return {
      id: response.data.id,
      url: `https://api.sumsub.com/idensic/static/main.js?userId=${userId}`,
    };
  }

  async verifyDocument(applicantId: string, documentType: string, documentImage: Buffer, mimeType: string, filename: string): Promise<{ status: "pending" | "approved" | "rejected" }> {
    if (!this.apiKey || !this.secretKey) {
      throw new Error("Sumsub API credentials not configured.");
    }

    const path = `/resources/applicants/${applicantId}/info/idDoc`;
    const ts = Math.floor(Date.now() / 1000).toString();
    
    // Construct manual multipart payload with fixed boundary to enable exact body signature hashing
    const boundary = "----CustomBoundary" + crypto.randomBytes(8).toString("hex");
    const metadataStr = JSON.stringify({ idDocType: documentType.toUpperCase(), country: "USA" });

    const header1 = `--${boundary}\r\nContent-Disposition: form-data; name="metadata"\r\nContent-Type: application/json\r\n\r\n${metadataStr}\r\n`;
    const header2 = `--${boundary}\r\nContent-Disposition: form-data; name="content"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`;
    const footer = `\r\n--${boundary}--\r\n`;

    const bodyBuffer = Buffer.concat([
      Buffer.from(header1, "utf-8"),
      Buffer.from(header2, "utf-8"),
      documentImage,
      Buffer.from(footer, "utf-8")
    ]);

    // Sign: ts + POST + path + bodyBuffer
    const signature = crypto
      .createHmac("sha256", this.secretKey)
      .update(ts + "POST" + path)
      .update(bodyBuffer)
      .digest("hex");

    const headers: Record<string, string> = {
      "X-App-Token": this.apiKey,
      "X-App-Access-Ts": ts,
      "X-App-Access-Sig": signature,
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
    };

    const res = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers,
      body: bodyBuffer,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Sumsub Document Upload Error (${res.status}): ${text}`);
    }

    return { status: "pending" };
  }

  async getStatus(verificationId: string): Promise<{ status: "pending" | "approved" | "rejected"; reason?: string }> {
    if (!this.apiKey || !this.secretKey) {
      throw new Error("Sumsub API credentials not configured.");
    }

    const path = `/resources/applicants/${verificationId}/status`;
    const headers = this.getHeaders("GET", path, null);
    const response = await axios.get(`${this.baseUrl}${path}`, { headers });
    
    const status = response.data.reviewStatus;
    const reviewResult = response.data.reviewResult;
    
    return {
      status: status === "completed" ? (reviewResult?.reviewAnswer === "GREEN" ? "approved" : "rejected") : "pending",
      reason: reviewResult?.rejectLabels?.join(", ") || undefined,
    };
  }
}
