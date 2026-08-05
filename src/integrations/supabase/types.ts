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
      appointments: {
        Row: {
          clinic_id: string
          created_at: string
          customer_id: string | null
          duration_minutes: number
          id: string
          notes: string | null
          pet_id: string | null
          reason: string | null
          service_id: string | null
          starts_at: string
          status: Database["public"]["Enums"]["appointment_status"]
          updated_at: string
          vet_id: string | null
        }
        Insert: {
          clinic_id: string
          created_at?: string
          customer_id?: string | null
          duration_minutes?: number
          id?: string
          notes?: string | null
          pet_id?: string | null
          reason?: string | null
          service_id?: string | null
          starts_at: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
          vet_id?: string | null
        }
        Update: {
          clinic_id?: string
          created_at?: string
          customer_id?: string | null
          duration_minutes?: number
          id?: string
          notes?: string | null
          pet_id?: string | null
          reason?: string | null
          service_id?: string | null
          starts_at?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
          vet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_members: {
        Row: {
          clinic_id: string
          created_at: string
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["clinic_role"]
          user_id: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["clinic_role"]
          user_id: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["clinic_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_members_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_subscriptions: {
        Row: {
          amount: number
          clinic_id: string
          created_at: string
          current_period_end: string
          current_period_start: string
          id: string
          interval: string
          plan_id: string
          status: Database["public"]["Enums"]["subscription_status"]
        }
        Insert: {
          amount?: number
          clinic_id: string
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          interval?: string
          plan_id: string
          status?: Database["public"]["Enums"]["subscription_status"]
        }
        Update: {
          amount?: number
          clinic_id?: string
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          interval?: string
          plan_id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
        }
        Relationships: [
          {
            foreignKeyName: "clinic_subscriptions_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_websites: {
        Row: {
          about: string | null
          clinic_id: string
          contact_email: string | null
          contact_phone: string | null
          headline: string | null
          hero_image_url: string | null
          id: string
          is_published: boolean
          primary_color: string | null
          social_links: Json
          tagline: string | null
          updated_at: string
        }
        Insert: {
          about?: string | null
          clinic_id: string
          contact_email?: string | null
          contact_phone?: string | null
          headline?: string | null
          hero_image_url?: string | null
          id?: string
          is_published?: boolean
          primary_color?: string | null
          social_links?: Json
          tagline?: string | null
          updated_at?: string
        }
        Update: {
          about?: string | null
          clinic_id?: string
          contact_email?: string | null
          contact_phone?: string | null
          headline?: string | null
          hero_image_url?: string | null
          id?: string
          is_published?: boolean
          primary_color?: string | null
          social_links?: Json
          tagline?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_websites_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: true
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinics: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string
          currency: string
          email: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          opening_hours: Json
          owner_id: string
          phone: string | null
          plan_id: string | null
          slug: string
          subscription_status: Database["public"]["Enums"]["subscription_status"]
          timezone: string
          trial_ends_at: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          currency?: string
          email?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          opening_hours?: Json
          owner_id: string
          phone?: string | null
          plan_id?: string | null
          slug: string
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          timezone?: string
          trial_ends_at?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          currency?: string
          email?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          opening_hours?: Json
          owner_id?: string
          phone?: string | null
          plan_id?: string | null
          slug?: string
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          timezone?: string
          trial_ends_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinics_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          clinic_id: string
          created_at: string
          email: string | null
          full_name: string
          id: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          clinic_id: string
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          clinic_id?: string
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      examinations: {
        Row: {
          appointment_id: string | null
          clinic_id: string
          complaint: string | null
          created_at: string
          diagnosis: string | null
          heart_rate: number | null
          id: string
          notes: string | null
          pet_id: string
          prescription: string | null
          temperature_c: number | null
          treatment: string | null
          vet_id: string | null
          visited_at: string
          weight_kg: number | null
        }
        Insert: {
          appointment_id?: string | null
          clinic_id: string
          complaint?: string | null
          created_at?: string
          diagnosis?: string | null
          heart_rate?: number | null
          id?: string
          notes?: string | null
          pet_id: string
          prescription?: string | null
          temperature_c?: number | null
          treatment?: string | null
          vet_id?: string | null
          visited_at?: string
          weight_kg?: number | null
        }
        Update: {
          appointment_id?: string | null
          clinic_id?: string
          complaint?: string | null
          created_at?: string
          diagnosis?: string | null
          heart_rate?: number | null
          id?: string
          notes?: string | null
          pet_id?: string
          prescription?: string | null
          temperature_c?: number | null
          treatment?: string | null
          vet_id?: string | null
          visited_at?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "examinations_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "examinations_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "examinations_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          category: string | null
          clinic_id: string
          cost_price: number
          created_at: string
          expires_at: string | null
          id: string
          name: string
          quantity: number
          reorder_level: number
          sale_price: number
          sku: string | null
          supplier: string | null
          unit: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          clinic_id: string
          cost_price?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          name: string
          quantity?: number
          reorder_level?: number
          sale_price?: number
          sku?: string | null
          supplier?: string | null
          unit?: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          clinic_id?: string
          cost_price?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          name?: string
          quantity?: number
          reorder_level?: number
          sale_price?: number
          sku?: string | null
          supplier?: string | null
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          clinic_id: string
          description: string
          id: string
          invoice_id: string
          quantity: number
          total: number
          unit_price: number
        }
        Insert: {
          clinic_id: string
          description: string
          id?: string
          invoice_id: string
          quantity?: number
          total?: number
          unit_price?: number
        }
        Update: {
          clinic_id?: string
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          clinic_id: string
          created_at: string
          customer_id: string | null
          due_at: string | null
          id: string
          issued_at: string
          notes: string | null
          number: string
          pet_id: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          subtotal: number
          tax_rate: number
          total: number
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          customer_id?: string | null
          due_at?: string | null
          id?: string
          issued_at?: string
          notes?: string | null
          number: string
          pet_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          tax_rate?: number
          total?: number
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          customer_id?: string | null
          due_at?: string | null
          id?: string
          issued_at?: string
          notes?: string | null
          number?: string
          pet_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          tax_rate?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      pets: {
        Row: {
          birth_date: string | null
          breed: string | null
          clinic_id: string
          color: string | null
          created_at: string
          customer_id: string | null
          id: string
          microchip: string | null
          name: string
          notes: string | null
          photo_url: string | null
          sex: Database["public"]["Enums"]["pet_sex"]
          species: string
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          birth_date?: string | null
          breed?: string | null
          clinic_id: string
          color?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          microchip?: string | null
          name: string
          notes?: string | null
          photo_url?: string | null
          sex?: Database["public"]["Enums"]["pet_sex"]
          species?: string
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          birth_date?: string | null
          breed?: string | null
          clinic_id?: string
          color?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          microchip?: string | null
          name?: string
          notes?: string | null
          photo_url?: string | null
          sex?: Database["public"]["Enums"]["pet_sex"]
          species?: string
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pets_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string
          features: Json
          id: string
          is_active: boolean
          max_pets: number
          max_staff: number
          name: string
          price_monthly: number
          price_yearly: number
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          features?: Json
          id?: string
          is_active?: boolean
          max_pets?: number
          max_staff?: number
          name: string
          price_monthly?: number
          price_yearly?: number
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          features?: Json
          id?: string
          is_active?: boolean
          max_pets?: number
          max_staff?: number
          name?: string
          price_monthly?: number
          price_yearly?: number
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      platform_admins: {
        Row: {
          created_at: string
          role: Database["public"]["Enums"]["platform_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          role?: Database["public"]["Enums"]["platform_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          role?: Database["public"]["Enums"]["platform_role"]
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          category: string | null
          clinic_id: string
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          is_active: boolean
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          category?: string | null
          clinic_id: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean
          name: string
          price?: number
          updated_at?: string
        }
        Update: {
          category?: string | null
          clinic_id?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      vaccinations: {
        Row: {
          batch_number: string | null
          clinic_id: string
          created_at: string
          dose: string | null
          given_at: string | null
          id: string
          next_due_at: string | null
          notes: string | null
          pet_id: string
          vaccine_name: string
          vet_id: string | null
        }
        Insert: {
          batch_number?: string | null
          clinic_id: string
          created_at?: string
          dose?: string | null
          given_at?: string | null
          id?: string
          next_due_at?: string | null
          notes?: string | null
          pet_id: string
          vaccine_name: string
          vet_id?: string | null
        }
        Update: {
          batch_number?: string | null
          clinic_id?: string
          created_at?: string
          dose?: string | null
          given_at?: string | null
          id?: string
          next_due_at?: string | null
          notes?: string | null
          pet_id?: string
          vaccine_name?: string
          vet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vaccinations_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vaccinations_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_clinic_admin: {
        Args: { _clinic_id: string; _user_id: string }
        Returns: boolean
      }
      is_clinic_member: {
        Args: { _clinic_id: string; _user_id: string }
        Returns: boolean
      }
      is_platform_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      appointment_status:
        | "scheduled"
        | "confirmed"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "no_show"
      clinic_role: "owner" | "admin" | "veterinarian" | "staff"
      invoice_status: "draft" | "sent" | "paid" | "overdue" | "void"
      pet_sex: "male" | "female" | "unknown"
      platform_role: "platform_admin"
      subscription_status: "trialing" | "active" | "past_due" | "canceled"
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
      appointment_status: [
        "scheduled",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
        "no_show",
      ],
      clinic_role: ["owner", "admin", "veterinarian", "staff"],
      invoice_status: ["draft", "sent", "paid", "overdue", "void"],
      pet_sex: ["male", "female", "unknown"],
      platform_role: ["platform_admin"],
      subscription_status: ["trialing", "active", "past_due", "canceled"],
    },
  },
} as const
