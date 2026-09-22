export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string;
          created_at: string;
          entity: string;
          entity_id: string | null;
          id: string;
          metadata: Json | null;
          shop_id: string | null;
          user_id: string | null;
        };
        Insert: {
          action: string;
          created_at?: string;
          entity: string;
          entity_id?: string | null;
          id?: string;
          metadata?: Json | null;
          shop_id?: string | null;
          user_id?: string | null;
        };
        Update: {
          action?: string;
          created_at?: string;
          entity?: string;
          entity_id?: string | null;
          id?: string;
          metadata?: Json | null;
          shop_id?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "audit_logs_shop_id_fkey";
            columns: ["shop_id"];
            isOneToOne: false;
            referencedRelation: "shops";
            referencedColumns: ["id"];
          },
        ];
      };
      clients: {
        Row: {
          address: string | null;
          created_at: string;
          email: string | null;
          full_name: string;
          id: string;
          notes: string | null;
          shop_id: string;
          total_repairs: number;
          updated_at: string;
          whatsapp: string;
        };
        Insert: {
          address?: string | null;
          created_at?: string;
          email?: string | null;
          full_name: string;
          id?: string;
          notes?: string | null;
          shop_id: string;
          total_repairs?: number;
          updated_at?: string;
          whatsapp: string;
        };
        Update: {
          address?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string;
          id?: string;
          notes?: string | null;
          shop_id?: string;
          total_repairs?: number;
          updated_at?: string;
          whatsapp?: string;
        };
        Relationships: [
          {
            foreignKeyName: "clients_shop_id_fkey";
            columns: ["shop_id"];
            isOneToOne: false;
            referencedRelation: "shops";
            referencedColumns: ["id"];
          },
        ];
      };
      payments: {
        Row: {
          amount: number;
          created_at: string;
          id: string;
          method: string;
          plan: string | null;
          reference: string | null;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          amount: number;
          created_at?: string;
          id?: string;
          method: string;
          plan?: string | null;
          reference?: string | null;
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          id?: string;
          method?: string;
          plan?: string | null;
          reference?: string | null;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string | null;
          favorite_categories: string[];
          nom: string | null;
          id: string;
          theme: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          favorite_categories?: string[];
          nom?: string | null;
          id: string;
          theme?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          favorite_categories?: string[];
          nom?: string | null;
          id?: string;
          theme?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      shop_members: {
        Row: {
          created_at: string;
          id: string;
          role: string;
          shop_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role?: string;
          shop_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: string;
          shop_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "shop_members_shop_id_fkey";
            columns: ["shop_id"];
            isOneToOne: false;
            referencedRelation: "shops";
            referencedColumns: ["id"];
          },
        ];
      };
      shops: {
        Row: {
          address: string | null;
          created_at: string;
          id: string;
          name: string;
          owner_id: string;
          phone: string | null;
          updated_at: string;
        };
        Insert: {
          address?: string | null;
          created_at?: string;
          id?: string;
          name: string;
          owner_id: string;
          phone?: string | null;
          updated_at?: string;
        };
        Update: {
          address?: string | null;
          created_at?: string;
          id?: string;
          name?: string;
          owner_id?: string;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          created_at: string;
          expires_at: string;
          id: string;
          plan: string;
          started_at: string;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          expires_at?: string;
          id?: string;
          plan?: string;
          started_at?: string;
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          expires_at?: string;
          id?: string;
          plan?: string;
          started_at?: string;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      tool_launches: {
        Row: {
          action: string;
          id: string;
          launched_at: string;
          tool_id: string | null;
          user_id: string | null;
        };
        Insert: {
          action: string;
          id?: string;
          launched_at?: string;
          tool_id?: string | null;
          user_id?: string | null;
        };
        Update: {
          action?: string;
          id?: string;
          launched_at?: string;
          tool_id?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "tool_launches_tool_id_fkey";
            columns: ["tool_id"];
            isOneToOne: false;
            referencedRelation: "tools";
            referencedColumns: ["id"];
          },
        ];
      };
      tool_logs: {
        Row: {
          action: string;
          changes: Json | null;
          id: string;
          logged_at: string;
          tool_id: string | null;
          user_id: string | null;
        };
        Insert: {
          action: string;
          changes?: Json | null;
          id?: string;
          logged_at?: string;
          tool_id?: string | null;
          user_id?: string | null;
        };
        Update: {
          action?: string;
          changes?: Json | null;
          id?: string;
          logged_at?: string;
          tool_id?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "tool_logs_tool_id_fkey";
            columns: ["tool_id"];
            isOneToOne: false;
            referencedRelation: "tools";
            referencedColumns: ["id"];
          },
        ];
      };
      tools: {
        Row: {
          categorie: string;
          chemin: string;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          description: string | null;
          favori: boolean;
          icone: string | null;
          id: string;
          last_used_at: string | null;
          launch_count: number;
          nom: string;
          shop_id: string | null;
          sous_categorie: string | null;
          tags: string[];
          type: string;
          updated_at: string;
          version: string | null;
        };
        Insert: {
          categorie: string;
          chemin: string;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          description?: string | null;
          favori?: boolean;
          icone?: string | null;
          id?: string;
          last_used_at?: string | null;
          launch_count?: number;
          nom: string;
          shop_id?: string | null;
          sous_categorie?: string | null;
          tags?: string[];
          type: string;
          updated_at?: string;
          version?: string | null;
        };
        Update: {
          categorie?: string;
          chemin?: string;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          description?: string | null;
          favori?: boolean;
          icone?: string | null;
          id?: string;
          last_used_at?: string | null;
          launch_count?: number;
          nom?: string;
          shop_id?: string | null;
          sous_categorie?: string | null;
          tags?: string[];
          type?: string;
          updated_at?: string;
          version?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "tools_shop_id_fkey";
            columns: ["shop_id"];
            isOneToOne: false;
            referencedRelation: "shops";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
      whatsapp_templates: {
        Row: {
          created_at: string;
          id: string;
          message: string;
          name: string;
          shop_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          message: string;
          name: string;
          shop_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          message?: string;
          name?: string;
          shop_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "whatsapp_templates_shop_id_fkey";
            columns: ["shop_id"];
            isOneToOne: false;
            referencedRelation: "shops";
            referencedColumns: ["id"];
          },
        ];
      };
      workshop_tickets: {
        Row: {
          client_id: string | null;
          client_name: string;
          client_whatsapp: string;
          created_at: string;
          created_by: string | null;
          device_imei: string | null;
          device_model: string;
          device_os_version: string | null;
          device_processor: string | null;
          device_sn: string | null;
          diagnosis: Json | null;
          id: string;
          issues: string[];
          notes: string | null;
          notified_at: string | null;
          price_estimate: number | null;
          price_final: number | null;
          shop_id: string | null;
          status: string | null;
          updated_at: string;
        };
        Insert: {
          client_id?: string | null;
          client_name: string;
          client_whatsapp: string;
          created_at?: string;
          created_by?: string | null;
          device_imei?: string | null;
          device_model: string;
          device_os_version?: string | null;
          device_processor?: string | null;
          device_sn?: string | null;
          diagnosis?: Json | null;
          id?: string;
          issues?: string[];
          notes?: string | null;
          notified_at?: string | null;
          price_estimate?: number | null;
          price_final?: number | null;
          shop_id?: string | null;
          status?: string | null;
          updated_at?: string;
        };
        Update: {
          client_id?: string | null;
          client_name?: string;
          client_whatsapp?: string;
          created_at?: string;
          created_by?: string | null;
          device_imei?: string | null;
          device_model?: string;
          device_os_version?: string | null;
          device_processor?: string | null;
          device_sn?: string | null;
          diagnosis?: Json | null;
          id?: string;
          issues?: string[];
          notes?: string | null;
          notified_at?: string | null;
          price_estimate?: number | null;
          price_final?: number | null;
          shop_id?: string | null;
          status?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workshop_tickets_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workshop_tickets_shop_id_fkey";
            columns: ["shop_id"];
            isOneToOne: false;
            referencedRelation: "shops";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      is_shop_member: { Args: { _shop_id: string }; Returns: boolean };
      is_shop_owner: { Args: { _shop_id: string }; Returns: boolean };
      register_launch: {
        Args: { _action: string; _tool_id: string };
        Returns: undefined;
      };
    };
    Enums: {
      app_role: "admin" | "technicien" | "lecteur";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "technicien", "lecteur"],
    },
  },
} as const;
