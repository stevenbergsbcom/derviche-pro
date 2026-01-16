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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: unknown
          new_values: Json | null
          old_values: Json | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
          user_role: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          city: string | null
          contact_email: string
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          logo_url: string | null
          name: string
          updated_at: string
          website: string | null
        }
        Insert: {
          city?: string | null
          contact_email: string
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          city?: string | null
          contact_email?: string
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          afc_number: string | null
          comments: string | null
          company_id: string | null
          created_at: string
          deleted_at: string | null
          disabled_at: string | null
          email: string
          email2: string | null
          first_name: string | null
          function: string | null
          gdpr_consent: boolean
          gdpr_consent_date: string | null
          gdpr_data_retention_accepted: boolean
          id: string
          last_login_at: string | null
          last_name: string | null
          must_change_password: boolean | null
          phone: string | null
          phone2: string | null
          structure: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          afc_number?: string | null
          comments?: string | null
          company_id?: string | null
          created_at?: string
          deleted_at?: string | null
          disabled_at?: string | null
          email: string
          email2?: string | null
          first_name?: string | null
          function?: string | null
          gdpr_consent?: boolean
          gdpr_consent_date?: string | null
          gdpr_data_retention_accepted?: boolean
          id: string
          last_login_at?: string | null
          last_name?: string | null
          must_change_password?: boolean | null
          phone?: string | null
          phone2?: string | null
          structure?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          afc_number?: string | null
          comments?: string | null
          company_id?: string | null
          created_at?: string
          deleted_at?: string | null
          disabled_at?: string | null
          email?: string
          email2?: string | null
          first_name?: string | null
          function?: string | null
          gdpr_consent?: boolean
          gdpr_consent_date?: string | null
          gdpr_data_retention_accepted?: boolean
          id?: string
          last_login_at?: string | null
          last_name?: string | null
          must_change_password?: boolean | null
          phone?: string | null
          phone2?: string | null
          structure?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          cancellation_reason: string | null
          cancelled_at: string | null
          checkin_at: string | null
          checkin_by: string | null
          checkin_comment: string | null
          checkin_internal_notes: string | null
          checkin_status: string | null
          checkin_venue_notes: string | null
          created_at: string
          google_calendar_event_id: string | null
          guest_address: string | null
          guest_afc_number: string | null
          guest_city: string | null
          guest_email: string | null
          guest_email_secondary: string | null
          guest_first_name: string | null
          guest_function: string | null
          guest_last_name: string | null
          guest_phone: string | null
          guest_phone_secondary: string | null
          guest_postal_code: string | null
          guest_structure: string | null
          id: string
          num_places: number
          slot_id: string
          special_requests: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          checkin_at?: string | null
          checkin_by?: string | null
          checkin_comment?: string | null
          checkin_internal_notes?: string | null
          checkin_status?: string | null
          checkin_venue_notes?: string | null
          created_at?: string
          google_calendar_event_id?: string | null
          guest_address?: string | null
          guest_afc_number?: string | null
          guest_city?: string | null
          guest_email?: string | null
          guest_email_secondary?: string | null
          guest_first_name?: string | null
          guest_function?: string | null
          guest_last_name?: string | null
          guest_phone?: string | null
          guest_phone_secondary?: string | null
          guest_postal_code?: string | null
          guest_structure?: string | null
          id?: string
          num_places: number
          slot_id: string
          special_requests?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          checkin_at?: string | null
          checkin_by?: string | null
          checkin_comment?: string | null
          checkin_internal_notes?: string | null
          checkin_status?: string | null
          checkin_venue_notes?: string | null
          created_at?: string
          google_calendar_event_id?: string | null
          guest_address?: string | null
          guest_afc_number?: string | null
          guest_city?: string | null
          guest_email?: string | null
          guest_email_secondary?: string | null
          guest_first_name?: string | null
          guest_function?: string | null
          guest_last_name?: string | null
          guest_phone?: string | null
          guest_phone_secondary?: string | null
          guest_postal_code?: string | null
          guest_structure?: string | null
          id?: string
          num_places?: number
          slot_id?: string
          special_requests?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reservations_checkin_by_fkey"
            columns: ["checkin_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rgpd_requests: {
        Row: {
          id: string
          notes: string | null
          processed_at: string | null
          processed_by: string | null
          rejection_reason: string | null
          request_type: string
          requested_at: string
          status: string
          user_email: string
          user_id: string | null
        }
        Insert: {
          id?: string
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          rejection_reason?: string | null
          request_type: string
          requested_at?: string
          status?: string
          user_email: string
          user_id?: string | null
        }
        Update: {
          id?: string
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          rejection_reason?: string | null
          request_type?: string
          requested_at?: string
          status?: string
          user_email?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rgpd_requests_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rgpd_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sent_notifications: {
        Row: {
          email_provider_id: string | null
          error: string | null
          id: string
          metadata: Json | null
          recipient_email: string
          recipient_name: string | null
          reservation_id: string | null
          sent_at: string
          status: string | null
          type: string
        }
        Insert: {
          email_provider_id?: string | null
          error?: string | null
          id?: string
          metadata?: Json | null
          recipient_email: string
          recipient_name?: string | null
          reservation_id?: string | null
          sent_at?: string
          status?: string | null
          type: string
        }
        Update: {
          email_provider_id?: string | null
          error?: string | null
          id?: string
          metadata?: Json | null
          recipient_email?: string
          recipient_name?: string | null
          reservation_id?: string | null
          sent_at?: string
          status?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "sent_notifications_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      show_categories: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          icon: string | null
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      show_category_mapping: {
        Row: {
          category_id: string
          show_id: string
        }
        Insert: {
          category_id: string
          show_id: string
        }
        Update: {
          category_id?: string
          show_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "show_category_mapping_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "show_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "show_category_mapping_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "shows"
            referencedColumns: ["id"]
          },
        ]
      }
      show_target_audience_mapping: {
        Row: {
          show_id: string
          target_audience_id: string
        }
        Insert: {
          show_id: string
          target_audience_id: string
        }
        Update: {
          show_id?: string
          target_audience_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "show_target_audience_mapping_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "shows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "show_target_audience_mapping_target_audience_id_fkey"
            columns: ["target_audience_id"]
            isOneToOne: false
            referencedRelation: "target_audiences"
            referencedColumns: ["id"]
          },
        ]
      }
      shows: {
        Row: {
          captation_available: boolean
          captation_url: string | null
          closure_dates: string | null
          company_id: string
          created_at: string
          deleted_at: string | null
          derviche_manager_id: string | null
          duration_minutes: number | null
          folder_url: string | null
          gallery_urls: string[] | null
          id: string
          image_url: string | null
          invitation_policy: string | null
          long_description: string | null
          max_reservations_per_booking: number
          period: string | null
          practical_info: string | null
          price_amount: number | null
          price_type: string
          short_description: string | null
          slug: string
          status: string
          teaser_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          captation_available?: boolean
          captation_url?: string | null
          closure_dates?: string | null
          company_id: string
          created_at?: string
          deleted_at?: string | null
          derviche_manager_id?: string | null
          duration_minutes?: number | null
          folder_url?: string | null
          gallery_urls?: string[] | null
          id?: string
          image_url?: string | null
          invitation_policy?: string | null
          long_description?: string | null
          max_reservations_per_booking?: number
          period?: string | null
          practical_info?: string | null
          price_amount?: number | null
          price_type?: string
          short_description?: string | null
          slug: string
          status?: string
          teaser_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          captation_available?: boolean
          captation_url?: string | null
          closure_dates?: string | null
          company_id?: string
          created_at?: string
          deleted_at?: string | null
          derviche_manager_id?: string | null
          duration_minutes?: number | null
          folder_url?: string | null
          gallery_urls?: string[] | null
          id?: string
          image_url?: string | null
          invitation_policy?: string | null
          long_description?: string | null
          max_reservations_per_booking?: number
          period?: string | null
          practical_info?: string | null
          price_amount?: number | null
          price_type?: string
          short_description?: string | null
          slug?: string
          status?: string
          teaser_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shows_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shows_derviche_manager_id_fkey"
            columns: ["derviche_manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      slots: {
        Row: {
          capacity: number
          created_at: string
          date: string
          hosted_by: string
          hosted_by_id: string | null
          id: string
          remaining_capacity: number
          show_id: string
          time: string
          updated_at: string
          venue_id: string
        }
        Insert: {
          capacity: number
          created_at?: string
          date: string
          hosted_by: string
          hosted_by_id?: string | null
          id?: string
          remaining_capacity: number
          show_id: string
          time: string
          updated_at?: string
          venue_id: string
        }
        Update: {
          capacity?: number
          created_at?: string
          date?: string
          hosted_by?: string
          hosted_by_id?: string | null
          id?: string
          remaining_capacity?: number
          show_id?: string
          time?: string
          updated_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "slots_hosted_by_id_fkey"
            columns: ["hosted_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slots_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "shows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slots_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      target_audiences: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_show_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          show_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          show_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          show_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_show_assignments_show"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "shows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_show_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_show_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      venues: {
        Row: {
          address: string | null
          capacity: number | null
          city: string
          contact_email: string | null
          contact_phone: string | null
          country: string
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          parking: boolean
          photo_url: string | null
          pmr_accessible: boolean
          postal_code: string | null
          transports: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          capacity?: number | null
          city: string
          contact_email?: string | null
          contact_phone?: string | null
          country?: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          parking?: boolean
          photo_url?: string | null
          pmr_accessible?: boolean
          postal_code?: string | null
          transports?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          capacity?: number | null
          city?: string
          contact_email?: string | null
          contact_phone?: string | null
          country?: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          parking?: boolean
          photo_url?: string | null
          pmr_accessible?: boolean
          postal_code?: string | null
          transports?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      externe_can_checkin: { Args: { p_slot_id: string }; Returns: boolean }
      externe_can_update_profile: {
        Args: { p_profile_id: string }
        Returns: boolean
      }
      externe_has_access_to_show: {
        Args: { p_show_id: string }
        Returns: boolean
      }
      generate_slug: { Args: { title: string }; Returns: string }
      has_role: { Args: { role_name: string }; Returns: boolean }
      is_admin_or_super: { Args: never; Returns: boolean }
      is_own_company_show: { Args: { p_show_id: string }; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      log_audit: {
        Args: {
          p_action: string
          p_details?: Json
          p_entity_id?: string
          p_entity_type: string
          p_new_values?: Json
          p_old_values?: Json
        }
        Returns: string
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
