export interface IKYCProvider {
  createVerification(userId: string, email: string, details?: any): Promise<{ id: string; url: string }>;
  verifyDocument(applicantId: string, documentType: string, documentImage: Buffer, mimeType: string, filename: string): Promise<{ status: 'pending' | 'approved' | 'rejected' }>;
  getStatus(verificationId: string): Promise<{ status: 'pending' | 'approved' | 'rejected'; reason?: string }>;
}

