export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      addresses: {
        Row: {
          city: string | null;
          country: string | null;
          created_at: string;
          id: string;
          latitude: string | null;
          longitude: string | null;
          postal_code: string | null;
          province: string | null;
          street: string | null;
        };
        Insert: {
          city?: string | null;
          country?: string | null;
          created_at?: string;
          id?: string;
          latitude?: string | null;
          longitude?: string | null;
          postal_code?: string | null;
          province?: string | null;
          street?: string | null;
        };
        Update: {
          city?: string | null;
          country?: string | null;
          created_at?: string;
          id?: string;
          latitude?: string | null;
          longitude?: string | null;
          postal_code?: string | null;
          province?: string | null;
          street?: string | null;
        };
        Relationships: [];
      };
      assignments: {
        Row: {
          created_at: string;
          employee_id: string | null;
          end_date: string | null;
          event_id: string | null;
          id: number;
          is_completed: boolean | null;
          start_date: string | null;
          status: string | null;
        };
        Insert: {
          created_at?: string;
          employee_id?: string | null;
          end_date?: string | null;
          event_id?: string | null;
          id?: number;
          is_completed?: boolean | null;
          start_date?: string | null;
          status?: string | null;
        };
        Update: {
          created_at?: string;
          employee_id?: string | null;
          end_date?: string | null;
          event_id?: string | null;
          id?: number;
          is_completed?: boolean | null;
          start_date?: string | null;
          status?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "assignments_employee_id_fkey";
            columns: ["employee_id"];
            isOneToOne: false;
            referencedRelation: "employees";
            referencedColumns: ["employee_id"];
          },
          {
            foreignKeyName: "assignments_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      employees: {
        Row: {
          address_id: string | null;
          availability: Json | null;
          created_at: string;
          employee_id: string;
          employee_type: string | null;
          first_name: string | null;
          is_available: boolean | null;
          last_name: string | null;
          user_id: string | null;
        };
        Insert: {
          address_id?: string | null;
          availability?: Json | null;
          created_at?: string;
          employee_id?: string;
          employee_type?: string | null;
          first_name?: string | null;
          is_available?: boolean | null;
          last_name?: string | null;
          user_id?: string | null;
        };
        Update: {
          address_id?: string | null;
          availability?: Json | null;
          created_at?: string;
          employee_id?: string;
          employee_type?: string | null;
          first_name?: string | null;
          is_available?: boolean | null;
          last_name?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "employees_address_id_fkey";
            columns: ["address_id"];
            isOneToOne: false;
            referencedRelation: "addresses";
            referencedColumns: ["id"];
          },
        ];
      };
      events: {
        Row: {
          address_id: string | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          end_date: string;
          expected_budget: number | null;
          id: string;
          number_of_driver_needed: number | null;
          number_of_servers_needed: number | null;
          start_date: string;
          title: string | null;
        };
        Insert: {
          address_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          end_date: string;
          expected_budget?: number | null;
          id?: string;
          number_of_driver_needed?: number | null;
          number_of_servers_needed?: number | null;
          start_date: string;
          title?: string | null;
        };
        Update: {
          address_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          end_date?: string;
          expected_budget?: number | null;
          id?: string;
          number_of_driver_needed?: number | null;
          number_of_servers_needed?: number | null;
          start_date?: string;
          title?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "events_address_id_fkey";
            columns: ["address_id"];
            isOneToOne: false;
            referencedRelation: "addresses";
            referencedColumns: ["id"];
          },
        ];
      };
      wage: {
        Row: {
          created_at: string;
          employee_id: string | null;
          end_date: string | null;
          hourly_wage: number | null;
          id: number;
          start_date: string | null;
        };
        Insert: {
          created_at?: string;
          employee_id?: string | null;
          end_date?: string | null;
          hourly_wage?: number | null;
          id?: number;
          start_date?: string | null;
        };
        Update: {
          created_at?: string;
          employee_id?: string | null;
          end_date?: string | null;
          hourly_wage?: number | null;
          id?: number;
          start_date?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "wage_employee_id_fkey";
            columns: ["employee_id"];
            isOneToOne: false;
            referencedRelation: "employees";
            referencedColumns: ["employee_id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DefaultSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
