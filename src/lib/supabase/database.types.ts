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
      clients: {
        Row: {
          company_name: string
          contact_email: string
          contact_name: string
          contact_phone: string
          created_at: string
          created_by: string | null
          id: string
          notes: string
          source: string
          source_detail: string
          updated_at: string
        }
        Insert: {
          company_name: string
          contact_email?: string
          contact_name?: string
          contact_phone?: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string
          source?: string
          source_detail?: string
          updated_at?: string
        }
        Update: {
          company_name?: string
          contact_email?: string
          contact_name?: string
          contact_phone?: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string
          source?: string
          source_detail?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          company_name: string
          contact_name: string
          converted_at: string | null
          converted_client_id: string | null
          converted_project_id: string | null
          created_at: string
          created_by: string | null
          email: string
          follow_up_date: string | null
          id: string
          interest: Database["public"]["Enums"]["lead_interest"]
          notes: string
          owner_id: string | null
          phone: string
          product_id: string | null
          requirement: string
          source: string
          source_detail: string
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
        }
        Insert: {
          company_name?: string
          contact_name: string
          converted_at?: string | null
          converted_client_id?: string | null
          converted_project_id?: string | null
          created_at?: string
          created_by?: string | null
          email?: string
          follow_up_date?: string | null
          id?: string
          interest?: Database["public"]["Enums"]["lead_interest"]
          notes?: string
          owner_id?: string | null
          phone?: string
          product_id?: string | null
          requirement?: string
          source?: string
          source_detail?: string
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Update: {
          company_name?: string
          contact_name?: string
          converted_at?: string | null
          converted_client_id?: string | null
          converted_project_id?: string | null
          created_at?: string
          created_by?: string | null
          email?: string
          follow_up_date?: string | null
          id?: string
          interest?: Database["public"]["Enums"]["lead_interest"]
          notes?: string
          owner_id?: string | null
          phone?: string
          product_id?: string | null
          requirement?: string
          source?: string
          source_detail?: string
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_converted_client_id_fkey"
            columns: ["converted_client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_converted_project_id_fkey"
            columns: ["converted_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      product_customers: {
        Row: {
          client_id: string
          created_at: string
          created_by: string | null
          id: string
          notes: string
          plan: string
          product_id: string
          renewal_date: string | null
          source_lead_id: string | null
          started_on: string | null
          status: Database["public"]["Enums"]["customer_status"]
          updated_at: string
          value: number | null
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string
          plan?: string
          product_id: string
          renewal_date?: string | null
          source_lead_id?: string | null
          started_on?: string | null
          status?: Database["public"]["Enums"]["customer_status"]
          updated_at?: string
          value?: number | null
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string
          plan?: string
          product_id?: string
          renewal_date?: string | null
          source_lead_id?: string | null
          started_on?: string | null
          status?: Database["public"]["Enums"]["customer_status"]
          updated_at?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_customers_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_customers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_customers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_customers_source_lead_id_fkey"
            columns: ["source_lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string
          id: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      project_links: {
        Row: {
          created_at: string
          id: string
          label: string
          project_id: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          project_id: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          project_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_links_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          assigned_team_id: string | null
          assigned_to: string | null
          budget: number | null
          client_id: string | null
          created_at: string
          created_by: string | null
          deadline: string | null
          description: string
          id: string
          name: string
          priority: Database["public"]["Enums"]["priority_level"]
          project_type: Database["public"]["Enums"]["project_type"]
          stage: Database["public"]["Enums"]["project_stage"]
          start_date: string | null
          updated_at: string
        }
        Insert: {
          assigned_team_id?: string | null
          assigned_to?: string | null
          budget?: number | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          description?: string
          id?: string
          name: string
          priority?: Database["public"]["Enums"]["priority_level"]
          project_type?: Database["public"]["Enums"]["project_type"]
          stage?: Database["public"]["Enums"]["project_stage"]
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          assigned_team_id?: string | null
          assigned_to?: string | null
          budget?: number | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          description?: string
          id?: string
          name?: string
          priority?: Database["public"]["Enums"]["priority_level"]
          project_type?: Database["public"]["Enums"]["project_type"]
          stage?: Database["public"]["Enums"]["project_stage"]
          start_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_assigned_team_id_fkey"
            columns: ["assigned_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_items: {
        Row: {
          created_at: string
          created_by: string | null
          developer_id: string
          end_time: string | null
          id: string
          item_date: string
          item_type: Database["public"]["Enums"]["schedule_item_type"]
          notes: string
          project_id: string | null
          start_time: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          developer_id: string
          end_time?: string | null
          id?: string
          item_date: string
          item_type?: Database["public"]["Enums"]["schedule_item_type"]
          notes?: string
          project_id?: string | null
          start_time: string
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          developer_id?: string
          end_time?: string | null
          id?: string
          item_date?: string
          item_type?: Database["public"]["Enums"]["schedule_item_type"]
          notes?: string
          project_id?: string | null
          start_time?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_items_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          created_at: string
          created_by: string | null
          description: string
          due_date: string | null
          id: string
          priority: Database["public"]["Enums"]["priority_level"]
          project_id: string | null
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["priority_level"]
          project_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["priority_level"]
          project_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          profile_id: string
          team_id: string
        }
        Insert: {
          profile_id: string
          team_id: string
        }
        Update: {
          profile_id?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      customer_status: "trial" | "active" | "paused" | "cancelled"
      lead_interest: "product" | "custom_project"
      lead_status: "new" | "contacted" | "qualified" | "won" | "lost"
      priority_level: "low" | "medium" | "high" | "urgent"
      project_stage:
        | "incoming"
        | "requirements"
        | "in_progress"
        | "review_testing"
        | "client_review"
        | "completed"
        | "on_hold_cancelled"
      project_type: "client" | "internal"
      schedule_item_type: "meeting" | "call" | "other"
      task_status: "todo" | "in_progress" | "done" | "blocked"
      user_role: "admin" | "developer"
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
      customer_status: ["trial", "active", "paused", "cancelled"],
      lead_interest: ["product", "custom_project"],
      lead_status: ["new", "contacted", "qualified", "won", "lost"],
      priority_level: ["low", "medium", "high", "urgent"],
      project_stage: [
        "incoming",
        "requirements",
        "in_progress",
        "review_testing",
        "client_review",
        "completed",
        "on_hold_cancelled",
      ],
      project_type: ["client", "internal"],
      schedule_item_type: ["meeting", "call", "other"],
      task_status: ["todo", "in_progress", "done", "blocked"],
      user_role: ["admin", "developer"],
    },
  },
} as const
