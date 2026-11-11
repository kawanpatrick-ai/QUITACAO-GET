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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      crm_activities: {
        Row: {
          actor_id: string | null
          body: string
          client_id: string
          created_at: string
          details: Json
          id: string
          kind: string
        }
        Insert: {
          actor_id?: string | null
          body: string
          client_id: string
          created_at?: string
          details?: Json
          id?: string
          kind?: string
        }
        Update: {
          actor_id?: string | null
          body?: string
          client_id?: string
          created_at?: string
          details?: Json
          id?: string
          kind?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_activities_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "crm_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_clients: {
        Row: {
          assigned_to: string | null
          closure_source: string | null
          consultant: string | null
          contacted_party: string | null
          created_at: string
          current_amount: number | null
          debtor_balance: number | null
          doc_digits: string | null
          due_override: string | null
          estimated_amount: number | null
          evidence_status: string
          evidence_url: string | null
          finish_reason: string | null
          finished_at: string | null
          id: string
          institution: string | null
          last_attendance_at: string | null
          last_attended_by: string | null
          last_contact: string | null
          last_negotiation: string | null
          name: string
          next_return: string | null
          notes: string | null
          phone: string | null
          priority_level: string
          sale_amount: number | null
          sale_date: string | null
          source_conflict: boolean
          source_key: string
          source_row_count: number
          source_seen_at: string | null
          source_spreadsheet: string | null
          source_status: string
          source_tab: string | null
          source_tabs: string[]
          stage: string
          updated_at: string
          verified_at: string | null
          verified_by: string | null
          workflow_override: string | null
          workflow_status: string
        }
        Insert: {
          assigned_to?: string | null
          closure_source?: string | null
          consultant?: string | null
          contacted_party?: string | null
          created_at?: string
          current_amount?: number | null
          debtor_balance?: number | null
          doc_digits?: string | null
          due_override?: string | null
          estimated_amount?: number | null
          evidence_status?: string
          evidence_url?: string | null
          finish_reason?: string | null
          finished_at?: string | null
          id?: string
          institution?: string | null
          last_attendance_at?: string | null
          last_attended_by?: string | null
          last_contact?: string | null
          last_negotiation?: string | null
          name: string
          next_return?: string | null
          notes?: string | null
          phone?: string | null
          priority_level?: string
          sale_amount?: number | null
          sale_date?: string | null
          source_conflict?: boolean
          source_key: string
          source_row_count?: number
          source_seen_at?: string | null
          source_spreadsheet?: string | null
          source_status?: string
          source_tab?: string | null
          source_tabs?: string[]
          stage?: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
          workflow_override?: string | null
          workflow_status?: string
        }
        Update: {
          assigned_to?: string | null
          closure_source?: string | null
          consultant?: string | null
          contacted_party?: string | null
          created_at?: string
          current_amount?: number | null
          debtor_balance?: number | null
          doc_digits?: string | null
          due_override?: string | null
          estimated_amount?: number | null
          evidence_status?: string
          evidence_url?: string | null
          finish_reason?: string | null
          finished_at?: string | null
          id?: string
          institution?: string | null
          last_attendance_at?: string | null
          last_attended_by?: string | null
          last_contact?: string | null
          last_negotiation?: string | null
          name?: string
          next_return?: string | null
          notes?: string | null
          phone?: string | null
          priority_level?: string
          sale_amount?: number | null
          sale_date?: string | null
          source_conflict?: boolean
          source_key?: string
          source_row_count?: number
          source_seen_at?: string | null
          source_spreadsheet?: string | null
          source_status?: string
          source_tab?: string | null
          source_tabs?: string[]
          stage?: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
          workflow_override?: string | null
          workflow_status?: string
        }
        Relationships: []
      }
      crm_completed_activities: {
        Row: {
          actor_id: string
          category: string
          client_id: string | null
          contact_confirmed: boolean
          created_at: string
          deleted_at: string | null
          description: string
          duration_seconds: number
          id: string
          origin: string
          performed_on: string
          process_number: string | null
          process_type: string | null
          title: string
          updated_at: string
        }
        Insert: {
          actor_id?: string
          category: string
          client_id?: string | null
          contact_confirmed?: boolean
          created_at?: string
          deleted_at?: string | null
          description?: string
          duration_seconds?: number
          id?: string
          origin?: string
          performed_on: string
          process_number?: string | null
          process_type?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          actor_id?: string
          category?: string
          client_id?: string | null
          contact_confirmed?: boolean
          created_at?: string
          deleted_at?: string | null
          description?: string
          duration_seconds?: number
          id?: string
          origin?: string
          performed_on?: string
          process_number?: string | null
          process_type?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_completed_activities_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "crm_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_import_runs: {
        Row: {
          clients_merged: number
          error: string | null
          finished_at: string | null
          id: string
          rows_read: number
          source_file: string
          started_at: string
          status: string
        }
        Insert: {
          clients_merged?: number
          error?: string | null
          finished_at?: string | null
          id?: string
          rows_read?: number
          source_file: string
          started_at?: string
          status?: string
        }
        Update: {
          clients_merged?: number
          error?: string | null
          finished_at?: string | null
          id?: string
          rows_read?: number
          source_file?: string
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      crm_memberships: {
        Row: {
          created_at: string
          enabled: boolean
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      crm_parties: {
        Row: {
          contact: string | null
          id: string
          kind: string
          logo_path: string | null
          name: string
          updated_at: string
        }
        Insert: {
          contact?: string | null
          id?: string
          kind: string
          logo_path?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          contact?: string | null
          id?: string
          kind?: string
          logo_path?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      crm_processes: {
        Row: {
          actor_id: string
          client_id: string | null
          created_at: string
          id: string
          process_number: string
          process_type: string
          updated_at: string
        }
        Insert: {
          actor_id?: string
          client_id?: string | null
          created_at?: string
          id?: string
          process_number: string
          process_type: string
          updated_at?: string
        }
        Update: {
          actor_id?: string
          client_id?: string | null
          created_at?: string
          id?: string
          process_number?: string
          process_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_processes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "crm_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_source_rows: {
        Row: {
          client_id: string | null
          seen_at: string
          snapshot: Json
          source_ref: string
          source_row: number
          source_spreadsheet: string
          source_tab: string
        }
        Insert: {
          client_id?: string | null
          seen_at?: string
          snapshot: Json
          source_ref: string
          source_row: number
          source_spreadsheet: string
          source_tab: string
        }
        Update: {
          client_id?: string | null
          seen_at?: string
          snapshot?: Json
          source_ref?: string
          source_row?: number
          source_spreadsheet?: string
          source_tab?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_source_rows_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "crm_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_unmatched_sources: {
        Row: {
          client_name: string
          created_at: string
          reason: string
          reviewed_at: string | null
          reviewed_by: string | null
          snapshot: Json
          source_file: string
          source_ref: string
          source_row: number
          source_tab: string
        }
        Insert: {
          client_name: string
          created_at?: string
          reason: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          snapshot?: Json
          source_file: string
          source_ref: string
          source_row?: number
          source_tab: string
        }
        Update: {
          client_name?: string
          created_at?: string
          reason?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          snapshot?: Json
          source_file?: string
          source_ref?: string
          source_row?: number
          source_tab?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      crm_add_client_note: {
        Args: { p_body: string; p_client_id: string }
        Returns: Json
      }
      crm_create_client: {
        Args: { p_document: string; p_institution?: string; p_name: string }
        Returns: string
      }
      crm_import_excel: { Args: { p_rows: Json }; Returns: Json }
      crm_register_attendance: {
        Args: {
          p_body: string
          p_channel: string
          p_client_id: string
          p_next_due?: string
          p_outcome: string
          p_responsible?: string
        }
        Returns: Json
      }
      crm_register_attendance_with_criticidade: {
        Args: {
          p_body: string
          p_channel: string
          p_client_id: string
          p_next_due?: string
          p_note?: string
          p_outcome: string
          p_priority_level?: string
          p_responsible?: string
        }
        Returns: Json
      }
      crm_update_client: {
        Args: { p_client_id: string; p_patch: Json; p_reason?: string }
        Returns: Json
      }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
