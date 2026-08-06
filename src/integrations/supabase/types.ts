export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      beneficiaries: {
        Row: {
          account_number: string | null
          bank_name: string | null
          country: string | null
          created_at: string
          crypto_address: string | null
          crypto_asset: string | null
          crypto_network: string | null
          currency: string | null
          email: string | null
          iban: string | null
          id: string
          name: string
          routing_number: string | null
          swift_bic: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_number?: string | null
          bank_name?: string | null
          country?: string | null
          created_at?: string
          crypto_address?: string | null
          crypto_asset?: string | null
          crypto_network?: string | null
          currency?: string | null
          email?: string | null
          iban?: string | null
          id?: string
          name: string
          routing_number?: string | null
          swift_bic?: string | null
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_number?: string | null
          bank_name?: string | null
          country?: string | null
          created_at?: string
          crypto_address?: string | null
          crypto_asset?: string | null
          crypto_network?: string | null
          currency?: string | null
          email?: string | null
          iban?: string | null
          id?: string
          name?: string
          routing_number?: string | null
          swift_bic?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      crypto_wallets: {
        Row: {
          asset: string
          balance: number
          created_at: string
          deposit_address: string | null
          id: string
          is_active: boolean
          label: string | null
          network: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          asset: string
          balance?: number
          created_at?: string
          deposit_address?: string | null
          id?: string
          is_active?: boolean
          label?: string | null
          network?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          asset?: string
          balance?: number
          created_at?: string
          deposit_address?: string | null
          id?: string
          is_active?: boolean
          label?: string | null
          network?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      fiat_wallets: {
        Row: {
          available_balance: number
          balance: number
          created_at: string
          currency: string
          id: string
          is_active: boolean
          label: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          available_balance?: number
          balance?: number
          created_at?: string
          currency: string
          id?: string
          is_active?: boolean
          label?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          available_balance?: number
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          label?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      kyc: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          business_country: string | null
          business_name: string | null
          business_registration_number: string | null
          business_website: string | null
          city: string | null
          country: string | null
          created_at: string
          date_of_birth: string | null
          employment_status: string | null
          first_name: string | null
          id: string
          id_document_number: string | null
          id_document_type: string | null
          id_document_url: string | null
          is_business: boolean
          last_name: string | null
          nationality: string | null
          occupation: string | null
          phone: string | null
          postal_code: string | null
          source_of_funds: string | null
          state: string | null
          status: Database["public"]["Enums"]["kyc_status"]
          submitted_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          business_country?: string | null
          business_name?: string | null
          business_registration_number?: string | null
          business_website?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          employment_status?: string | null
          first_name?: string | null
          id?: string
          id_document_number?: string | null
          id_document_type?: string | null
          id_document_url?: string | null
          is_business?: boolean
          last_name?: string | null
          nationality?: string | null
          occupation?: string | null
          phone?: string | null
          postal_code?: string | null
          source_of_funds?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["kyc_status"]
          submitted_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          business_country?: string | null
          business_name?: string | null
          business_registration_number?: string | null
          business_website?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          employment_status?: string | null
          first_name?: string | null
          id?: string
          id_document_number?: string | null
          id_document_type?: string | null
          id_document_url?: string | null
          is_business?: boolean
          last_name?: string | null
          nationality?: string | null
          occupation?: string | null
          phone?: string | null
          postal_code?: string | null
          source_of_funds?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["kyc_status"]
          submitted_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          country: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          onboarding_completed: boolean
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          onboarding_completed?: boolean
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          onboarding_completed?: boolean
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          base_currency: string
          created_at: string
          email_notifications: boolean
          marketing_emails: boolean
          transaction_alerts: boolean
          two_factor_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          base_currency?: string
          created_at?: string
          email_notifications?: boolean
          marketing_emails?: boolean
          transaction_alerts?: boolean
          two_factor_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          base_currency?: string
          created_at?: string
          email_notifications?: boolean
          marketing_emails?: boolean
          transaction_alerts?: boolean
          two_factor_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          beneficiary_id: string | null
          counterparty: string | null
          created_at: string
          currency: string
          description: string | null
          fee: number
          id: string
          rate: number | null
          reference: string
          status: Database["public"]["Enums"]["transaction_status"]
          to_amount: number | null
          to_currency: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          beneficiary_id?: string | null
          counterparty?: string | null
          created_at?: string
          currency: string
          description?: string | null
          fee?: number
          id?: string
          rate?: number | null
          reference?: string
          status?: Database["public"]["Enums"]["transaction_status"]
          to_amount?: number | null
          to_currency?: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          beneficiary_id?: string | null
          counterparty?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          fee?: number
          id?: string
          rate?: number | null
          reference?: string
          status?: Database["public"]["Enums"]["transaction_status"]
          to_amount?: number | null
          to_currency?: string | null
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_beneficiary_fk"
            columns: ["beneficiary_id"]
            isOneToOne: false
            referencedRelation: "beneficiaries"
            referencedColumns: ["id"]
          },
        ]
      }
      virtual_accounts: {
        Row: {
          account_name: string | null
          account_number: string
          bank_address: string | null
          bank_name: string | null
          created_at: string
          currency: string
          iban: string | null
          id: string
          routing_number: string | null
          status: string
          swift_bic: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_name?: string | null
          account_number: string
          bank_address?: string | null
          bank_name?: string | null
          created_at?: string
          currency: string
          iban?: string | null
          id?: string
          routing_number?: string | null
          status?: string
          swift_bic?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_name?: string | null
          account_number?: string
          bank_address?: string | null
          bank_name?: string | null
          created_at?: string
          currency?: string
          iban?: string | null
          id?: string
          routing_number?: string | null
          status?: string
          swift_bic?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      kyc_status: "not_started" | "pending" | "approved" | "rejected"
      transaction_status: "pending" | "completed" | "failed" | "cancelled"
      transaction_type:
        | "deposit"
        | "withdrawal"
        | "exchange"
        | "send"
        | "receive"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      kyc_status: ["not_started", "pending", "approved", "rejected"],
      transaction_status: ["pending", "completed", "failed", "cancelled"],
      transaction_type: [
        "deposit",
        "withdrawal",
        "exchange",
        "send",
        "receive",
      ],
    },
  },
} as const
