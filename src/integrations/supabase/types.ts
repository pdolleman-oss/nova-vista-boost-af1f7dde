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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      chat_history: {
        Row: {
          created_at: string
          id: string
          organization_id: string | null
          prompt: string
          result: string
          tool_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id?: string | null
          prompt: string
          result: string
          tool_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string | null
          prompt?: string
          result?: string
          tool_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      companies_master: {
        Row: {
          company_name: string
          company_size: string | null
          created_at: string
          created_by: string | null
          detected_problems: string[] | null
          id: string
          industry: string | null
          last_analysis_at: string | null
          marketing_opportunity_score: number | null
          next_scan_at: string | null
          opportunity_level: string | null
          recommended_services: string[] | null
          scan_count: number
          updated_at: string
          website_domain: string | null
          website_score: number | null
        }
        Insert: {
          company_name: string
          company_size?: string | null
          created_at?: string
          created_by?: string | null
          detected_problems?: string[] | null
          id?: string
          industry?: string | null
          last_analysis_at?: string | null
          marketing_opportunity_score?: number | null
          next_scan_at?: string | null
          opportunity_level?: string | null
          recommended_services?: string[] | null
          scan_count?: number
          updated_at?: string
          website_domain?: string | null
          website_score?: number | null
        }
        Update: {
          company_name?: string
          company_size?: string | null
          created_at?: string
          created_by?: string | null
          detected_problems?: string[] | null
          id?: string
          industry?: string | null
          last_analysis_at?: string | null
          marketing_opportunity_score?: number | null
          next_scan_at?: string | null
          opportunity_level?: string | null
          recommended_services?: string[] | null
          scan_count?: number
          updated_at?: string
          website_domain?: string | null
          website_score?: number | null
        }
        Relationships: []
      }
      companies_raw: {
        Row: {
          company_name: string
          company_size: string | null
          created_at: string
          id: string
          import_batch_id: string | null
          imported_by: string | null
          industry: string | null
          legal_status: string | null
          raw_data: Json | null
          source_identifier: string | null
          website_domain: string | null
        }
        Insert: {
          company_name: string
          company_size?: string | null
          created_at?: string
          id?: string
          import_batch_id?: string | null
          imported_by?: string | null
          industry?: string | null
          legal_status?: string | null
          raw_data?: Json | null
          source_identifier?: string | null
          website_domain?: string | null
        }
        Update: {
          company_name?: string
          company_size?: string | null
          created_at?: string
          id?: string
          import_batch_id?: string | null
          imported_by?: string | null
          industry?: string | null
          legal_status?: string | null
          raw_data?: Json | null
          source_identifier?: string | null
          website_domain?: string | null
        }
        Relationships: []
      }
      invitations: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string
          id: string
          max_uses: number | null
          organization_id: string
          token: string
          use_count: number
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at?: string
          id?: string
          max_uses?: number | null
          organization_id: string
          token?: string
          use_count?: number
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string
          id?: string
          max_uses?: number | null
          organization_id?: string
          token?: string
          use_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_activities: {
        Row: {
          activity_type: string
          created_at: string
          description: string
          id: string
          lead_pipeline_id: string
          user_id: string
        }
        Insert: {
          activity_type?: string
          created_at?: string
          description: string
          id?: string
          lead_pipeline_id: string
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          description?: string
          id?: string
          lead_pipeline_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_activities_lead_pipeline_id_fkey"
            columns: ["lead_pipeline_id"]
            isOneToOne: false
            referencedRelation: "lead_pipeline"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_pipeline: {
        Row: {
          company_id: string
          contact_email: string | null
          contact_person: string | null
          contact_phone: string | null
          created_at: string
          id: string
          lost_reason: string | null
          next_followup_at: string | null
          notes: string | null
          status: string
          updated_at: string
          user_id: string
          won_value: number | null
        }
        Insert: {
          company_id: string
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          lost_reason?: string | null
          next_followup_at?: string | null
          notes?: string | null
          status?: string
          updated_at?: string
          user_id: string
          won_value?: number | null
        }
        Update: {
          company_id?: string
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          lost_reason?: string | null
          next_followup_at?: string | null
          notes?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          won_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_pipeline_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_master"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          owner_id: string
          subscription_tier: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          owner_id: string
          subscription_tier?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          owner_id?: string
          subscription_tier?: string
          updated_at?: string
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
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      saved_leads: {
        Row: {
          company_id: string
          created_at: string
          id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          notes?: string | null
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_leads_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_master"
            referencedColumns: ["id"]
          },
        ]
      }
      site_content: {
        Row: {
          content_key: string
          content_text: string
          id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          content_key: string
          content_text: string
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          content_key?: string
          content_text?: string
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      website_audits: {
        Row: {
          audited_by: string | null
          company_id: string
          content_quality: string | null
          created_at: string
          design_assessment: string | null
          domain: string
          has_analytics: boolean | null
          has_blog: boolean | null
          has_contact_form: boolean | null
          has_cta: boolean | null
          has_heading_structure: boolean | null
          has_meta_tags: boolean | null
          has_sitemap: boolean | null
          has_social_links: boolean | null
          has_ssl: boolean | null
          id: string
          is_mobile_friendly: boolean | null
          page_speed_score: number | null
          raw_analysis: Json | null
          technology_stack: string[] | null
          website_score: number | null
        }
        Insert: {
          audited_by?: string | null
          company_id: string
          content_quality?: string | null
          created_at?: string
          design_assessment?: string | null
          domain: string
          has_analytics?: boolean | null
          has_blog?: boolean | null
          has_contact_form?: boolean | null
          has_cta?: boolean | null
          has_heading_structure?: boolean | null
          has_meta_tags?: boolean | null
          has_sitemap?: boolean | null
          has_social_links?: boolean | null
          has_ssl?: boolean | null
          id?: string
          is_mobile_friendly?: boolean | null
          page_speed_score?: number | null
          raw_analysis?: Json | null
          technology_stack?: string[] | null
          website_score?: number | null
        }
        Update: {
          audited_by?: string | null
          company_id?: string
          content_quality?: string | null
          created_at?: string
          design_assessment?: string | null
          domain?: string
          has_analytics?: boolean | null
          has_blog?: boolean | null
          has_contact_form?: boolean | null
          has_cta?: boolean | null
          has_heading_structure?: boolean | null
          has_meta_tags?: boolean | null
          has_sitemap?: boolean | null
          has_social_links?: boolean | null
          has_ssl?: boolean | null
          id?: string
          is_mobile_friendly?: boolean | null
          page_speed_score?: number | null
          raw_analysis?: Json | null
          technology_stack?: string[] | null
          website_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "website_audits_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies_master"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_get_stats: { Args: never; Returns: Json }
      get_invitation_by_token: { Args: { _token: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "client_owner" | "client_member"
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
      app_role: ["admin", "client_owner", "client_member"],
    },
  },
} as const
