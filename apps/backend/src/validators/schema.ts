import { z } from "zod";

export const kycSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  date_of_birth: z.string().min(1),
  address: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    postal_code: z.string().min(1),
    country: z.string().min(1),
  }),
});

export const createWalletSchema = z.object({
  asset: z.string().min(2).max(10),
  name: z.string().min(1),
});

export const exchangeSchema = z.object({
  from: z.string().min(2).max(10),
  to: z.string().min(2).max(10),
  amount: z.number().positive(),
});

export const beneficiarySchema = z.object({
  name: z.string().min(1),
  currency: z.string().min(3).max(3),
  country: z.string().min(2).max(2),
  account_number: z.string().optional(),
  routing_number: z.string().optional(),
  iban: z.string().optional(),
  swift_bic: z.string().optional(),
});

export const withdrawSchema = z.object({
  accountId: z.string().min(1),
  beneficiaryId: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().min(3).max(3),
  reference: z.string().min(1),
});

export const cryptoSendSchema = z.object({
  walletId: z.string().min(1),
  asset: z.string().min(2).max(10),
  toAddress: z.string().min(1),
  amount: z.number().positive(),
  destinationTag: z.string().optional(),
});

export const notificationSchema = z.object({
  type: z.enum(["email", "sms", "push"]),
  to: z.string().min(1),
  title: z.string().optional(),
  body: z.string().min(1),
});
