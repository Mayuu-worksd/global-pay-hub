export interface IKYCProvider {
  createVerification(userId: string, email: string): Promise<{ id: string; url: string }>;
  verifyDocument(verificationId: string, documentType: string, documentImage: Buffer): Promise<{ status: 'pending' | 'approved' | 'rejected' }>;
  getStatus(verificationId: string): Promise<{ status: 'pending' | 'approved' | 'rejected'; reason?: string }>;
}
