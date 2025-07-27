export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)";
  };
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
          end_date: string;
          event_id: string | null;
          id: string;
          is_completed: boolean | null;
          start_date: string;
          status: string | null;
        };
        Insert: {
          created_at?: string;
          employee_id?: string | null;
          end_date: string;
          event_id?: string | null;
          id?: string;
          is_completed?: boolean | null;
          start_date: string;
          status?: string | null;
        };
        Update: {
          created_at?: string;
          employee_id?: string | null;
          end_date?: string;
          event_id?: string | null;
          id?: string;
          is_completed?: boolean | null;
          start_date?: string;
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
            foreignKeyName: "assignments_employee_id_fkey";
            columns: ["employee_id"];
            isOneToOne: false;
            referencedRelation: "employees_limited_view";
            referencedColumns: ["employee_id"];
          },
          {
            foreignKeyName: "assignments_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "event_basic_info_view";
            referencedColumns: ["id"];
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
      employee_availability: {
        Row: {
          created_at: string;
          day_of_week: string;
          employee_id: string;
          end_time: string;
          id: string;
          start_time: string;
        };
        Insert: {
          created_at?: string;
          day_of_week: string;
          employee_id: string;
          end_time: string;
          id?: string;
          start_time: string;
        };
        Update: {
          created_at?: string;
          day_of_week?: string;
          employee_id?: string;
          end_time?: string;
          id?: string;
          start_time?: string;
        };
        Relationships: [
          {
            foreignKeyName: "employee_availability_employee_id_fkey";
            columns: ["employee_id"];
            isOneToOne: false;
            referencedRelation: "employees";
            referencedColumns: ["employee_id"];
          },
          {
            foreignKeyName: "employee_availability_employee_id_fkey";
            columns: ["employee_id"];
            isOneToOne: false;
            referencedRelation: "employees_limited_view";
            referencedColumns: ["employee_id"];
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
          is_available: boolean;
          is_pending: boolean;
          last_name: string | null;
          user_email: string | null;
          user_id: string | null;
          user_phone: string | null;
        };
        Insert: {
          address_id?: string | null;
          availability?: Json | null;
          created_at?: string;
          employee_id?: string;
          employee_type?: string | null;
          first_name?: string | null;
          is_available?: boolean;
          is_pending?: boolean;
          last_name?: string | null;
          user_email?: string | null;
          user_id?: string | null;
          user_phone?: string | null;
        };
        Update: {
          address_id?: string | null;
          availability?: Json | null;
          created_at?: string;
          employee_id?: string;
          employee_type?: string | null;
          first_name?: string | null;
          is_available?: boolean;
          is_pending?: boolean;
          last_name?: string | null;
          user_email?: string | null;
          user_id?: string | null;
          user_phone?: string | null;
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
          contact_email: string | null;
          contact_name: string | null;
          contact_phone: string | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          end_date: string;
          expected_budget: number | null;
          id: string;
          is_prepaid: boolean;
          note: string | null;
          number_of_driver_needed: number | null;
          number_of_servers_needed: number | null;
          start_date: string;
          status: string | null;
          title: string | null;
        };
        Insert: {
          address_id?: string | null;
          contact_email?: string | null;
          contact_name?: string | null;
          contact_phone?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          end_date: string;
          expected_budget?: number | null;
          id?: string;
          is_prepaid?: boolean;
          note?: string | null;
          number_of_driver_needed?: number | null;
          number_of_servers_needed?: number | null;
          start_date: string;
          status?: string | null;
          title?: string | null;
        };
        Update: {
          address_id?: string | null;
          contact_email?: string | null;
          contact_name?: string | null;
          contact_phone?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          end_date?: string;
          expected_budget?: number | null;
          id?: string;
          is_prepaid?: boolean;
          note?: string | null;
          number_of_driver_needed?: number | null;
          number_of_servers_needed?: number | null;
          start_date?: string;
          status?: string | null;
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
      server_assignment_clockin: {
        Row: {
          assignment_id: string | null;
          clock_in_at: string | null;
          clock_out_at: string | null;
          created_at: string;
          id: string;
        };
        Insert: {
          assignment_id?: string | null;
          clock_in_at?: string | null;
          clock_out_at?: string | null;
          created_at?: string;
          id?: string;
        };
        Update: {
          assignment_id?: string | null;
          clock_in_at?: string | null;
          clock_out_at?: string | null;
          created_at?: string;
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "server_assignment_clockin_assignment_id_fkey";
            columns: ["assignment_id"];
            isOneToOne: false;
            referencedRelation: "assignments";
            referencedColumns: ["id"];
          },
        ];
      };
      time_off_request: {
        Row: {
          created_at: string;
          employee_id: string | null;
          end_datetime: string;
          id: string;
          reason: string | null;
          start_datetime: string;
          status: string;
          type: string | null;
        };
        Insert: {
          created_at?: string;
          employee_id?: string | null;
          end_datetime: string;
          id?: string;
          reason?: string | null;
          start_datetime: string;
          status?: string;
          type?: string | null;
        };
        Update: {
          created_at?: string;
          employee_id?: string | null;
          end_datetime?: string;
          id?: string;
          reason?: string | null;
          start_datetime?: string;
          status?: string;
          type?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "time_off_request_employee_id_fkey";
            columns: ["employee_id"];
            isOneToOne: false;
            referencedRelation: "employees";
            referencedColumns: ["employee_id"];
          },
          {
            foreignKeyName: "time_off_request_employee_id_fkey";
            columns: ["employee_id"];
            isOneToOne: false;
            referencedRelation: "employees_limited_view";
            referencedColumns: ["employee_id"];
          },
        ];
      };
      truck_assignment: {
        Row: {
          created_at: string;
          driver_id: string | null;
          end_time: string;
          event_id: string | null;
          id: string;
          start_time: string;
          truck_id: string | null;
        };
        Insert: {
          created_at?: string;
          driver_id?: string | null;
          end_time: string;
          event_id?: string | null;
          id?: string;
          start_time: string;
          truck_id?: string | null;
        };
        Update: {
          created_at?: string;
          driver_id?: string | null;
          end_time?: string;
          event_id?: string | null;
          id?: string;
          start_time?: string;
          truck_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "truck_assignment_driver_id_fkey";
            columns: ["driver_id"];
            isOneToOne: false;
            referencedRelation: "employees";
            referencedColumns: ["employee_id"];
          },
          {
            foreignKeyName: "truck_assignment_driver_id_fkey";
            columns: ["driver_id"];
            isOneToOne: false;
            referencedRelation: "employees_limited_view";
            referencedColumns: ["employee_id"];
          },
          {
            foreignKeyName: "truck_assignment_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "event_basic_info_view";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "truck_assignment_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "truck_assignment_truck_id_fkey";
            columns: ["truck_id"];
            isOneToOne: false;
            referencedRelation: "trucks";
            referencedColumns: ["id"];
          },
        ];
      };
      truck_assignment_checkin: {
        Row: {
          assignment_id: string | null;
          clock_in_at: string | null;
          clock_out_at: string | null;
          created_at: string;
          id: string;
        };
        Insert: {
          assignment_id?: string | null;
          clock_in_at?: string | null;
          clock_out_at?: string | null;
          created_at?: string;
          id?: string;
        };
        Update: {
          assignment_id?: string | null;
          clock_in_at?: string | null;
          clock_out_at?: string | null;
          created_at?: string;
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "truck_assignment_checkin_assignment_id_fkey";
            columns: ["assignment_id"];
            isOneToOne: false;
            referencedRelation: "truck_assignment";
            referencedColumns: ["id"];
          },
        ];
      };
      trucks: {
        Row: {
          address_id: string | null;
          capacity: string;
          created_at: string;
          id: string;
          is_available: boolean;
          name: string;
          packing_list: string[] | null;
          type: string;
        };
        Insert: {
          address_id?: string | null;
          capacity: string;
          created_at?: string;
          id?: string;
          is_available?: boolean;
          name: string;
          packing_list?: string[] | null;
          type: string;
        };
        Update: {
          address_id?: string | null;
          capacity?: string;
          created_at?: string;
          id?: string;
          is_available?: boolean;
          name?: string;
          packing_list?: string[] | null;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "trucks_address_id_fkey";
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
          hourly_wage: number;
          id: string;
          start_date: string;
        };
        Insert: {
          created_at?: string;
          employee_id?: string | null;
          end_date?: string | null;
          hourly_wage?: number;
          id?: string;
          start_date: string;
        };
        Update: {
          created_at?: string;
          employee_id?: string | null;
          end_date?: string | null;
          hourly_wage?: number;
          id?: string;
          start_date?: string;
        };
        Relationships: [
          {
            foreignKeyName: "wage_employee_id_fkey";
            columns: ["employee_id"];
            isOneToOne: false;
            referencedRelation: "employees";
            referencedColumns: ["employee_id"];
          },
          {
            foreignKeyName: "wage_employee_id_fkey";
            columns: ["employee_id"];
            isOneToOne: false;
            referencedRelation: "employees_limited_view";
            referencedColumns: ["employee_id"];
          },
        ];
      };
    };
    Views: {
      employees_limited_view: {
        Row: {
          employee_id: string | null;
          employee_type: string | null;
          first_name: string | null;
          last_name: string | null;
          user_phone: string | null;
        };
        Insert: {
          employee_id?: string | null;
          employee_type?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          user_phone?: string | null;
        };
        Update: {
          employee_id?: string | null;
          employee_type?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          user_phone?: string | null;
        };
        Relationships: [];
      };
      event_basic_info_view: {
        Row: {
          address_id: string | null;
          created_at: string | null;
          description: string | null;
          end_date: string | null;
          id: string | null;
          start_date: string | null;
          status: string | null;
          title: string | null;
        };
        Insert: {
          address_id?: string | null;
          created_at?: string | null;
          description?: string | null;
          end_date?: string | null;
          id?: string | null;
          start_date?: string | null;
          status?: string | null;
          title?: string | null;
        };
        Update: {
          address_id?: string | null;
          created_at?: string | null;
          description?: string | null;
          end_date?: string | null;
          id?: string | null;
          start_date?: string | null;
          status?: string | null;
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
