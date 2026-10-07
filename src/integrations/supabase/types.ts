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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
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
  public: {
    Tables: {
      activity_modules: {
        Row: {
          code: string
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          label: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          label: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          label?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          entity: string
          entity_id: string | null
          id: string
          metadata: Json | null
          shop_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          entity: string
          entity_id?: string | null
          id?: string
          metadata?: Json | null
          shop_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          entity?: string
          entity_id?: string | null
          id?: string
          metadata?: Json | null
          shop_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          notes: string | null
          shop_id: string | null
          total_repairs: number | null
          updated_at: string | null
          whatsapp: string
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          full_name: string
          id?: string
          notes?: string | null
          shop_id?: string | null
          total_repairs?: number | null
          updated_at?: string | null
          whatsapp: string
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          shop_id?: string | null
          total_repairs?: number | null
          updated_at?: string | null
          whatsapp?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_sessions: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          ip_address: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          ip_address: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: string
          user_id?: string | null
        }
        Relationships: []
      }
      device_catalog: {
        Row: {
          brand: string
          category: string
          created_at: string | null
          id: string
          image_url: string | null
          model: string
          os: string | null
          popularity_ci: number | null
          release_year: number | null
          specs: Json | null
        }
        Insert: {
          brand: string
          category?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          model: string
          os?: string | null
          popularity_ci?: number | null
          release_year?: number | null
          specs?: Json | null
        }
        Update: {
          brand?: string
          category?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          model?: string
          os?: string | null
          popularity_ci?: number | null
          release_year?: number | null
          specs?: Json | null
        }
        Relationships: []
      }
      domain_pricing: {
        Row: {
          annual_price_fcfa: number
          code: string
          created_at: string | null
          description: string | null
          extension: string
          id: string
          is_active: boolean | null
          label: string
          updated_at: string | null
        }
        Insert: {
          annual_price_fcfa: number
          code: string
          created_at?: string | null
          description?: string | null
          extension: string
          id?: string
          is_active?: boolean | null
          label: string
          updated_at?: string | null
        }
        Update: {
          annual_price_fcfa?: number
          code?: string
          created_at?: string | null
          description?: string | null
          extension?: string
          id?: string
          is_active?: boolean | null
          label?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      license_pricing: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          label: string
          max_modules: number
          min_modules: number
          price_fcfa: number
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          label: string
          max_modules: number
          min_modules: number
          price_fcfa: number
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          label?: string
          max_modules?: number
          min_modules?: number
          price_fcfa?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      module_pricing: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          label: string
          monthly_price_fcfa: number
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          label: string
          monthly_price_fcfa: number
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          label?: string
          monthly_price_fcfa?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          lien: string | null
          lu: boolean | null
          message: string | null
          titre: string
          type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          lien?: string | null
          lu?: boolean | null
          message?: string | null
          titre: string
          type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          lien?: string | null
          lu?: boolean | null
          message?: string | null
          titre?: string
          type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string | null
          product_image_url: string | null
          product_name: string
          quantity: number
          total: number
          unit_price: number
        }
        Insert: {
          id?: string
          order_id: string
          product_id?: string | null
          product_image_url?: string | null
          product_name: string
          quantity?: number
          total: number
          unit_price: number
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string | null
          product_image_url?: string | null
          product_name?: string
          quantity?: number
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          client_address: string | null
          client_id: string | null
          client_name: string
          client_notes: string | null
          client_whatsapp: string
          created_at: string
          delivery_fee: number
          delivery_status: string
          id: string
          internal_notes: string | null
          order_number: string
          payment_method: string
          payment_status: string
          shop_id: string
          subtotal: number
          total: number
          tracking_token: string
          updated_at: string
        }
        Insert: {
          client_address?: string | null
          client_id?: string | null
          client_name: string
          client_notes?: string | null
          client_whatsapp: string
          created_at?: string
          delivery_fee?: number
          delivery_status?: string
          id?: string
          internal_notes?: string | null
          order_number: string
          payment_method: string
          payment_status?: string
          shop_id: string
          subtotal: number
          total: number
          tracking_token?: string
          updated_at?: string
        }
        Update: {
          client_address?: string | null
          client_id?: string | null
          client_name?: string
          client_notes?: string | null
          client_whatsapp?: string
          created_at?: string
          delivery_fee?: number
          delivery_status?: string
          id?: string
          internal_notes?: string | null
          order_number?: string
          payment_method?: string
          payment_status?: string
          shop_id?: string
          subtotal?: number
          total?: number
          tracking_token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          domain_included: boolean | null
          domain_name: string | null
          id: string
          plan: string
          provider: string | null
          status: string | null
          transaction_id: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          domain_included?: boolean | null
          domain_name?: string | null
          id?: string
          plan: string
          provider?: string | null
          status?: string | null
          transaction_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          domain_included?: boolean | null
          domain_name?: string | null
          id?: string
          plan?: string
          provider?: string | null
          status?: string | null
          transaction_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      platform_notifications: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          message: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          message: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          message?: string
        }
        Relationships: []
      }
      platform_support_tickets: {
        Row: {
          created_at: string
          id: string
          message: string
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string
          characteristics: Json
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          image_urls: string[]
          is_available: boolean
          is_featured: boolean
          name: string
          price: number
          shop_id: string
          stock: number
          updated_at: string
        }
        Insert: {
          category?: string
          characteristics?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_urls?: string[]
          is_available?: boolean
          is_featured?: boolean
          name: string
          price: number
          shop_id: string
          stock?: number
          updated_at?: string
        }
        Update: {
          category?: string
          characteristics?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_urls?: string[]
          is_available?: boolean
          is_featured?: boolean
          name?: string
          price?: number
          shop_id?: string
          stock?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          demo_expires_at: string | null
          demo_ip: string | null
          device_build: string | null
          device_imei: string | null
          device_mac: string | null
          device_os: string | null
          email: string | null
          first_trial_used_at: string | null
          id: string
          is_demo: boolean | null
          is_super_admin: boolean | null
          nom: string | null
          phone: string | null
          phone_country_code: string | null
          preferences: Json | null
          pseudo: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          demo_expires_at?: string | null
          demo_ip?: string | null
          device_build?: string | null
          device_imei?: string | null
          device_mac?: string | null
          device_os?: string | null
          email?: string | null
          first_trial_used_at?: string | null
          id: string
          is_demo?: boolean | null
          is_super_admin?: boolean | null
          nom?: string | null
          phone?: string | null
          phone_country_code?: string | null
          preferences?: Json | null
          pseudo?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          demo_expires_at?: string | null
          demo_ip?: string | null
          device_build?: string | null
          device_imei?: string | null
          device_mac?: string | null
          device_os?: string | null
          email?: string | null
          first_trial_used_at?: string | null
          id?: string
          is_demo?: boolean | null
          is_super_admin?: boolean | null
          nom?: string | null
          phone?: string | null
          phone_country_code?: string | null
          preferences?: Json | null
          pseudo?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sales: {
        Row: {
          activity_type: string
          characteristics: Json | null
          client_id: string | null
          client_name: string | null
          client_whatsapp: string | null
          created_at: string | null
          created_by: string | null
          delivery_status: string | null
          id: string
          notes: string | null
          payment_method: string | null
          payment_status: string | null
          product_description: string | null
          product_name: string
          product_photo_url: string | null
          quantity: number | null
          shop_id: string | null
          total_price: number
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          activity_type: string
          characteristics?: Json | null
          client_id?: string | null
          client_name?: string | null
          client_whatsapp?: string | null
          created_at?: string | null
          created_by?: string | null
          delivery_status?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          product_description?: string | null
          product_name: string
          product_photo_url?: string | null
          quantity?: number | null
          shop_id?: string | null
          total_price: number
          unit_price: number
          updated_at?: string | null
        }
        Update: {
          activity_type?: string
          characteristics?: Json | null
          client_id?: string | null
          client_name?: string | null
          client_whatsapp?: string | null
          created_at?: string | null
          created_by?: string | null
          delivery_status?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          product_description?: string | null
          product_name?: string
          product_photo_url?: string | null
          quantity?: number | null
          shop_id?: string | null
          total_price?: number
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_members: {
        Row: {
          created_at: string | null
          id: string
          role: string | null
          shop_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: string | null
          shop_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string | null
          shop_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shop_members_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_modules: {
        Row: {
          enabled_at: string
          id: string
          module_code: string
          shop_id: string
        }
        Insert: {
          enabled_at?: string
          id?: string
          module_code: string
          shop_id: string
        }
        Update: {
          enabled_at?: string
          id?: string
          module_code?: string
          shop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_modules_module_code_fkey"
            columns: ["module_code"]
            isOneToOne: false
            referencedRelation: "activity_modules"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "shop_modules_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shops: {
        Row: {
          accepts_cash_on_delivery: boolean
          accepts_cash_on_pickup: boolean
          accepts_moov: boolean
          accepts_mtn: boolean
          accepts_orange_money: boolean
          accepts_wave: boolean
          address: string | null
          created_at: string | null
          delivery_available: boolean
          delivery_fee: number
          id: string
          is_demo: boolean | null
          is_online_shop: boolean
          name: string
          owner_id: string | null
          phone: string | null
          shop_address: string | null
          shop_banner_url: string | null
          shop_description: string | null
          shop_logo_url: string | null
          shop_phone: string | null
          shop_slug: string | null
          shop_whatsapp: string | null
        }
        Insert: {
          accepts_cash_on_delivery?: boolean
          accepts_cash_on_pickup?: boolean
          accepts_moov?: boolean
          accepts_mtn?: boolean
          accepts_orange_money?: boolean
          accepts_wave?: boolean
          address?: string | null
          created_at?: string | null
          delivery_available?: boolean
          delivery_fee?: number
          id?: string
          is_demo?: boolean | null
          is_online_shop?: boolean
          name: string
          owner_id?: string | null
          phone?: string | null
          shop_address?: string | null
          shop_banner_url?: string | null
          shop_description?: string | null
          shop_logo_url?: string | null
          shop_phone?: string | null
          shop_slug?: string | null
          shop_whatsapp?: string | null
        }
        Update: {
          accepts_cash_on_delivery?: boolean
          accepts_cash_on_pickup?: boolean
          accepts_moov?: boolean
          accepts_mtn?: boolean
          accepts_orange_money?: boolean
          accepts_wave?: boolean
          address?: string | null
          created_at?: string | null
          delivery_available?: boolean
          delivery_fee?: number
          id?: string
          is_demo?: boolean | null
          is_online_shop?: boolean
          name?: string
          owner_id?: string | null
          phone?: string | null
          shop_address?: string | null
          shop_banner_url?: string | null
          shop_description?: string | null
          shop_logo_url?: string | null
          shop_phone?: string | null
          shop_slug?: string | null
          shop_whatsapp?: string | null
        }
        Relationships: []
      }
      storage_locations: {
        Row: {
          created_at: string | null
          current_ticket_id: string | null
          description: string | null
          id: string
          location_type: string | null
          name: string
          shop_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_ticket_id?: string | null
          description?: string | null
          id?: string
          location_type?: string | null
          name: string
          shop_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_ticket_id?: string | null
          description?: string | null
          id?: string
          location_type?: string | null
          name?: string
          shop_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "storage_locations_current_ticket_id_fkey"
            columns: ["current_ticket_id"]
            isOneToOne: false
            referencedRelation: "workshop_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "storage_locations_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_pricing: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          duration_months: number
          id: string
          is_active: boolean | null
          label: string
          price_fcfa: number
          type: string
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          duration_months: number
          id?: string
          is_active?: boolean | null
          label: string
          price_fcfa: number
          type: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          duration_months?: number
          id?: string
          is_active?: boolean | null
          label?: string
          price_fcfa?: number
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string | null
          domain_included: boolean
          domain_purchased_at: string | null
          domain_requested: string | null
          domain_status: string | null
          duration_months: number | null
          expires_at: string | null
          id: string
          is_demo: boolean | null
          license_fee_fcfa: number | null
          modules_snapshot: Json | null
          period_end: string | null
          period_start: string | null
          plan: string | null
          price_fcfa: number
          selected_modules: string[]
          started_at: string | null
          status: string | null
          storefront_modules: string[]
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          domain_included?: boolean
          domain_purchased_at?: string | null
          domain_requested?: string | null
          domain_status?: string | null
          duration_months?: number | null
          expires_at?: string | null
          id?: string
          is_demo?: boolean | null
          license_fee_fcfa?: number | null
          modules_snapshot?: Json | null
          period_end?: string | null
          period_start?: string | null
          plan?: string | null
          price_fcfa?: number
          selected_modules?: string[]
          started_at?: string | null
          status?: string | null
          storefront_modules?: string[]
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          domain_included?: boolean
          domain_purchased_at?: string | null
          domain_requested?: string | null
          domain_status?: string | null
          duration_months?: number | null
          expires_at?: string | null
          id?: string
          is_demo?: boolean | null
          license_fee_fcfa?: number | null
          modules_snapshot?: Json | null
          period_end?: string | null
          period_start?: string | null
          plan?: string | null
          price_fcfa?: number
          selected_modules?: string[]
          started_at?: string | null
          status?: string | null
          storefront_modules?: string[]
          user_id?: string | null
        }
        Relationships: []
      }
      tool_comments: {
        Row: {
          contenu: string
          created_at: string | null
          id: string
          tool_id: string | null
          user_id: string | null
        }
        Insert: {
          contenu: string
          created_at?: string | null
          id?: string
          tool_id?: string | null
          user_id?: string | null
        }
        Update: {
          contenu?: string
          created_at?: string | null
          id?: string
          tool_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tool_comments_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "tools"
            referencedColumns: ["id"]
          },
        ]
      }
      tool_launches: {
        Row: {
          action: string
          id: string
          launched_at: string | null
          tool_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          id?: string
          launched_at?: string | null
          tool_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          id?: string
          launched_at?: string | null
          tool_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tool_launches_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "tools"
            referencedColumns: ["id"]
          },
        ]
      }
      tool_logs: {
        Row: {
          action: string
          changes: Json | null
          id: string
          logged_at: string | null
          tool_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          changes?: Json | null
          id?: string
          logged_at?: string | null
          tool_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          changes?: Json | null
          id?: string
          logged_at?: string | null
          tool_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tool_logs_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "tools"
            referencedColumns: ["id"]
          },
        ]
      }
      tools: {
        Row: {
          activity_type: string | null
          arguments: string | null
          categorie: string
          chemin: string
          created_at: string | null
          created_by: string | null
          description: string | null
          favori: boolean | null
          icone: string | null
          id: string
          lancer_en_admin: boolean | null
          licence_cle: string | null
          licence_expiration: string | null
          nom: string
          sous_categorie: string | null
          statut: string | null
          tags: string[] | null
          type: string
          updated_at: string | null
          version: string | null
        }
        Insert: {
          activity_type?: string | null
          arguments?: string | null
          categorie: string
          chemin: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          favori?: boolean | null
          icone?: string | null
          id?: string
          lancer_en_admin?: boolean | null
          licence_cle?: string | null
          licence_expiration?: string | null
          nom: string
          sous_categorie?: string | null
          statut?: string | null
          tags?: string[] | null
          type: string
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          activity_type?: string | null
          arguments?: string | null
          categorie?: string
          chemin?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          favori?: boolean | null
          icone?: string | null
          id?: string
          lancer_en_admin?: boolean | null
          licence_cle?: string | null
          licence_expiration?: string | null
          nom?: string
          sous_categorie?: string | null
          statut?: string | null
          tags?: string[] | null
          type?: string
          updated_at?: string | null
          version?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string | null
        }
        Relationships: []
      }
      whatsapp_templates: {
        Row: {
          created_at: string | null
          id: string
          message: string
          name: string
          shop_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          name: string
          shop_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          name?: string
          shop_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_templates_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      workshop_events: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          event_type: string
          id: string
          ticket_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_type: string
          id?: string
          ticket_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_type?: string
          id?: string
          ticket_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workshop_events_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "workshop_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      workshop_tickets: {
        Row: {
          activity_type: string | null
          category: string | null
          client_id: string | null
          client_name: string
          client_whatsapp: string
          created_at: string | null
          created_by: string | null
          device_imei: string | null
          device_model: string
          device_os_version: string | null
          device_processor: string | null
          device_sn: string | null
          diagnosis: Json | null
          diagnostic_notes: string | null
          entry_fee: number | null
          entry_fee_paid: boolean | null
          id: string
          issues: string[]
          notes: string | null
          notified_at: string | null
          price_estimate: number | null
          price_final: number | null
          shop_id: string | null
          status: string | null
          storage_location_id: string | null
          updated_at: string | null
        }
        Insert: {
          activity_type?: string | null
          category?: string | null
          client_id?: string | null
          client_name: string
          client_whatsapp: string
          created_at?: string | null
          created_by?: string | null
          device_imei?: string | null
          device_model: string
          device_os_version?: string | null
          device_processor?: string | null
          device_sn?: string | null
          diagnosis?: Json | null
          diagnostic_notes?: string | null
          entry_fee?: number | null
          entry_fee_paid?: boolean | null
          id?: string
          issues?: string[]
          notes?: string | null
          notified_at?: string | null
          price_estimate?: number | null
          price_final?: number | null
          shop_id?: string | null
          status?: string | null
          storage_location_id?: string | null
          updated_at?: string | null
        }
        Update: {
          activity_type?: string | null
          category?: string | null
          client_id?: string | null
          client_name?: string
          client_whatsapp?: string
          created_at?: string | null
          created_by?: string | null
          device_imei?: string | null
          device_model?: string
          device_os_version?: string | null
          device_processor?: string | null
          device_sn?: string | null
          diagnosis?: Json | null
          diagnostic_notes?: string | null
          entry_fee?: number | null
          entry_fee_paid?: boolean | null
          id?: string
          issues?: string[]
          notes?: string | null
          notified_at?: string | null
          price_estimate?: number | null
          price_final?: number | null
          shop_id?: string | null
          status?: string | null
          storage_location_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workshop_tickets_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workshop_tickets_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workshop_tickets_storage_location_id_fkey"
            columns: ["storage_location_id"]
            isOneToOne: false
            referencedRelation: "storage_locations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_pseudo_exists: { Args: { pseudo_input: string }; Returns: boolean }
      create_public_order: {
        Args: {
          p_client_address: string
          p_client_name: string
          p_client_notes: string
          p_client_whatsapp: string
          p_delivery: boolean
          p_items: Json
          p_payment_method: string
          p_shop_id: string
        }
        Returns: Json
      }
      get_email_by_identifier: { Args: { identifier: string }; Returns: string }
      get_public_order: {
        Args: { p_order_id: string; p_tracking_token: string }
        Returns: Json
      }
      get_public_shop_by_slug: {
        Args: { p_slug: string }
        Returns: {
          accepts_cash_on_delivery: boolean
          accepts_cash_on_pickup: boolean
          accepts_moov: boolean
          accepts_mtn: boolean
          accepts_orange_money: boolean
          accepts_wave: boolean
          delivery_available: boolean
          delivery_fee: number
          id: string
          name: string
          shop_address: string
          shop_banner_url: string
          shop_description: string
          shop_logo_url: string
          shop_phone: string
          shop_slug: string
          shop_whatsapp: string
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      is_shop_member: { Args: { shop_uuid: string }; Returns: boolean }
      is_shop_owner: { Args: { shop_uuid: string }; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      update_shop_order: {
        Args: {
          p_delivery_status: string
          p_order_id: string
          p_payment_status: string
        }
        Returns: undefined
      }
      user_has_role: { Args: { role_name: string }; Returns: boolean }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
