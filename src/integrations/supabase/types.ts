// Generated from Supabase project schema (MCP). Regenerate after migration changes.

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
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string | null
          created_at: string
          id: string
          new_value: Json | null
          old_value: Json | null
          record_id: string | null
          table_name: string | null
          user_id: string | null
        }
        Insert: {
          action?: string | null
          created_at?: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      barcode_print_log: {
        Row: {
          batch_id: string | null
          id: string
          paper_size: string | null
          printed_at: string
          printed_by: string | null
          printer_name: string | null
          product_id: string
          quantity_printed: number
        }
        Insert: {
          batch_id?: string | null
          id?: string
          paper_size?: string | null
          printed_at?: string
          printed_by?: string | null
          printer_name?: string | null
          product_id: string
          quantity_printed: number
        }
        Update: {
          batch_id?: string | null
          id?: string
          paper_size?: string | null
          printed_at?: string
          printed_by?: string | null
          printer_name?: string | null
          product_id?: string
          quantity_printed?: number
        }
        Relationships: [
          {
            foreignKeyName: "barcode_print_log_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "medicine_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "barcode_print_log_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "v_expiring_medicines"
            referencedColumns: ["batch_id"]
          },
          {
            foreignKeyName: "barcode_print_log_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "barcode_print_log_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_expiring_medicines"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "barcode_print_log_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_low_stock_medicines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "barcode_print_log_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_medicines_with_stock"
            referencedColumns: ["id"]
          },
        ]
      }
      batch_stock_transactions: {
        Row: {
          batch_id: string
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          quantity: number
          reference_id: string | null
          reference_type: string | null
          transaction_type: string
        }
        Insert: {
          batch_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          quantity: number
          reference_id?: string | null
          reference_type?: string | null
          transaction_type: string
        }
        Update: {
          batch_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          quantity?: number
          reference_id?: string | null
          reference_type?: string | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "batch_stock_transactions_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "medicine_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batch_stock_transactions_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "v_expiring_medicines"
            referencedColumns: ["batch_id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      countries: {
        Row: {
          code: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          allergies: string | null
          blood_group: string | null
          company: string | null
          created_at: string
          credit_limit: number | null
          current_balance: number | null
          customer_code: string | null
          customer_type: string | null
          date_of_birth: string | null
          discount_percentage: number | null
          email: string | null
          gender: string | null
          id: string
          is_active: boolean | null
          loyalty_points: number | null
          name: string
          notes: string | null
          opening_balance: number | null
          payment_terms: string | null
          phone: string | null
          phone2: string | null
          tax_number: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          allergies?: string | null
          blood_group?: string | null
          company?: string | null
          created_at?: string
          credit_limit?: number | null
          current_balance?: number | null
          customer_code?: string | null
          customer_type?: string | null
          date_of_birth?: string | null
          discount_percentage?: number | null
          email?: string | null
          gender?: string | null
          id?: string
          is_active?: boolean | null
          loyalty_points?: number | null
          name: string
          notes?: string | null
          opening_balance?: number | null
          payment_terms?: string | null
          phone?: string | null
          phone2?: string | null
          tax_number?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          allergies?: string | null
          blood_group?: string | null
          company?: string | null
          created_at?: string
          credit_limit?: number | null
          current_balance?: number | null
          customer_code?: string | null
          customer_type?: string | null
          date_of_birth?: string | null
          discount_percentage?: number | null
          email?: string | null
          gender?: string | null
          id?: string
          is_active?: boolean | null
          loyalty_points?: number | null
          name?: string
          notes?: string | null
          opening_balance?: number | null
          payment_terms?: string | null
          phone?: string | null
          phone2?: string | null
          tax_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      discount_configs: {
        Row: {
          category_id: string | null
          created_at: string
          customer_type: string | null
          description: string | null
          discount_amount: number | null
          discount_percentage: number | null
          discount_type: string
          id: string
          is_active: boolean | null
          max_quantity: number | null
          medicine_category_id: string | null
          min_quantity: number | null
          name: string
          priority: number | null
          product_id: string | null
          updated_at: string
          valid_from: string | null
          valid_to: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          customer_type?: string | null
          description?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          discount_type: string
          id?: string
          is_active?: boolean | null
          max_quantity?: number | null
          medicine_category_id?: string | null
          min_quantity?: number | null
          name: string
          priority?: number | null
          product_id?: string | null
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string
          customer_type?: string | null
          description?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          discount_type?: string
          id?: string
          is_active?: boolean | null
          max_quantity?: number | null
          medicine_category_id?: string | null
          min_quantity?: number | null
          name?: string
          priority?: number | null
          product_id?: string | null
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discount_configs_medicine_category_id_fkey"
            columns: ["medicine_category_id"]
            isOneToOne: false
            referencedRelation: "medicine_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_configs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_configs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_expiring_medicines"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "discount_configs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_low_stock_medicines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_configs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_medicines_with_stock"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: string | null
          date: string
          description: string | null
          id: string
          receipt_url: string | null
        }
        Insert: {
          amount: number
          category?: string | null
          date?: string
          description?: string | null
          id?: string
          receipt_url?: string | null
        }
        Update: {
          amount?: number
          category?: string | null
          date?: string
          description?: string | null
          id?: string
          receipt_url?: string | null
        }
        Relationships: []
      }
      expired_medicines: {
        Row: {
          batch_id: string
          batch_number: string
          created_at: string
          disposal_date: string | null
          disposal_method: string | null
          disposal_notes: string | null
          expiry_date: string
          handled_by: string | null
          id: string
          product_id: string
          purchase_value: number | null
          quantity: number
        }
        Insert: {
          batch_id: string
          batch_number: string
          created_at?: string
          disposal_date?: string | null
          disposal_method?: string | null
          disposal_notes?: string | null
          expiry_date: string
          handled_by?: string | null
          id?: string
          product_id: string
          purchase_value?: number | null
          quantity: number
        }
        Update: {
          batch_id?: string
          batch_number?: string
          created_at?: string
          disposal_date?: string | null
          disposal_method?: string | null
          disposal_notes?: string | null
          expiry_date?: string
          handled_by?: string | null
          id?: string
          product_id?: string
          purchase_value?: number | null
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "expired_medicines_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "medicine_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expired_medicines_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "v_expiring_medicines"
            referencedColumns: ["batch_id"]
          },
          {
            foreignKeyName: "expired_medicines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expired_medicines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_expiring_medicines"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "expired_medicines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_low_stock_medicines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expired_medicines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_medicines_with_stock"
            referencedColumns: ["id"]
          },
        ]
      }
      expiry_alert_settings: {
        Row: {
          alert_days_before: number
          alert_level: string
          created_at: string
          id: string
          is_active: boolean | null
          notification_method: string[] | null
          updated_at: string
        }
        Insert: {
          alert_days_before?: number
          alert_level: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          notification_method?: string[] | null
          updated_at?: string
        }
        Update: {
          alert_days_before?: number
          alert_level?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          notification_method?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      grns: {
        Row: {
          created_by: string | null
          date: string
          id: string
          purchase_id: string
        }
        Insert: {
          created_by?: string | null
          date?: string
          id?: string
          purchase_id: string
        }
        Update: {
          created_by?: string | null
          date?: string
          id?: string
          purchase_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "grns_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      manufacturers: {
        Row: {
          address: string | null
          city: string | null
          code: string | null
          contact_person: string | null
          country: string | null
          created_at: string
          credit_limit: number | null
          current_balance: number | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          opening_balance: number | null
          payment_terms: string | null
          phone: string | null
          postal_code: string | null
          state: string | null
          tax_number: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          code?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string
          credit_limit?: number | null
          current_balance?: number | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          opening_balance?: number | null
          payment_terms?: string | null
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          tax_number?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          code?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string
          credit_limit?: number | null
          current_balance?: number | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          opening_balance?: number | null
          payment_terms?: string | null
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          tax_number?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      medicine_batches: {
        Row: {
          batch_number: string
          created_at: string
          discount_percentage: number | null
          expiry_date: string
          id: string
          is_active: boolean | null
          is_expired: boolean | null
          manufacture_date: string | null
          manufacturer_id: string | null
          mrp: number | null
          notes: string | null
          product_id: string
          purchase_id: string | null
          purchase_price: number
          quantity_damaged: number | null
          quantity_received: number
          quantity_remaining: number
          quantity_returned: number | null
          quantity_sold: number | null
          rack_number: string | null
          selling_price: number | null
          store_id: string | null
          updated_at: string
        }
        Insert: {
          batch_number: string
          created_at?: string
          discount_percentage?: number | null
          expiry_date: string
          id?: string
          is_active?: boolean | null
          is_expired?: boolean | null
          manufacture_date?: string | null
          manufacturer_id?: string | null
          mrp?: number | null
          notes?: string | null
          product_id: string
          purchase_id?: string | null
          purchase_price: number
          quantity_damaged?: number | null
          quantity_received?: number
          quantity_remaining?: number
          quantity_returned?: number | null
          quantity_sold?: number | null
          rack_number?: string | null
          selling_price?: number | null
          store_id?: string | null
          updated_at?: string
        }
        Update: {
          batch_number?: string
          created_at?: string
          discount_percentage?: number | null
          expiry_date?: string
          id?: string
          is_active?: boolean | null
          is_expired?: boolean | null
          manufacture_date?: string | null
          manufacturer_id?: string | null
          mrp?: number | null
          notes?: string | null
          product_id?: string
          purchase_id?: string | null
          purchase_price?: number
          quantity_damaged?: number | null
          quantity_received?: number
          quantity_remaining?: number
          quantity_returned?: number | null
          quantity_sold?: number | null
          rack_number?: string | null
          selling_price?: number | null
          store_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medicine_batches_manufacturer_id_fkey"
            columns: ["manufacturer_id"]
            isOneToOne: false
            referencedRelation: "manufacturers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medicine_batches_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medicine_batches_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_expiring_medicines"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "medicine_batches_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_low_stock_medicines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medicine_batches_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_medicines_with_stock"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medicine_batches_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medicine_batches_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      medicine_categories: {
        Row: {
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      medicine_types: {
        Row: {
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_stock: {
        Row: {
          created_at: string
          current_qty: number | null
          id: string
          opening_qty: number | null
          product_id: string
          reserved_qty: number | null
          store_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_qty?: number | null
          id?: string
          opening_qty?: number | null
          product_id: string
          reserved_qty?: number | null
          store_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_qty?: number | null
          id?: string
          opening_qty?: number | null
          product_id?: string
          reserved_qty?: number | null
          store_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_stock_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_stock_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_expiring_medicines"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_stock_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_low_stock_medicines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_stock_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_medicines_with_stock"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_stock_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active_ingredients: string | null
          assemble_country: string | null
          barcode: string | null
          box_size: number | null
          brand: string | null
          brand_name: string | null
          category_id: string | null
          cgst_percentage: number | null
          color: string | null
          compatibility: string | null
          composition: string | null
          connectivity: string | null
          cost_price: number
          country_of_origin: string | null
          created_at: string
          description: string | null
          dimensions: string | null
          dosage: string | null
          dosage_info: string | null
          emi_management: boolean | null
          expiry_date: string | null
          features: string | null
          generic_name: string | null
          hsn_code: string | null
          id: string
          igst_percentage: number | null
          image_url: string | null
          indications: string | null
          is_narcotic: boolean | null
          is_prescription_required: boolean | null
          is_schedule_drug: boolean | null
          manufacture_date: string | null
          manufacturer: string | null
          manufacturer_id: string | null
          max_discount_percentage: number | null
          max_stock_level: number | null
          medicine_category_id: string | null
          medicine_type_id: string | null
          min_stock_level: number | null
          min_stock_threshold: number | null
          model: string | null
          mrp: number | null
          mrp_strip: number | null
          mrp_unit: number | null
          name: string
          pack_size: number | null
          package_contents: string | null
          power_consumption: string | null
          prescription_required: boolean | null
          purchase_price: number | null
          qr_code: string | null
          rack_number: string | null
          reorder_level: number | null
          schedule_category: string | null
          selling_price: number | null
          serial_number: string | null
          sgst_percentage: number | null
          shelf_life: string | null
          shelf_life_days: number | null
          shelf_number: string | null
          side_effects: string | null
          sku: string
          specifications: string | null
          stock_quantity: number
          storage_condition: string | null
          storage_instructions: string | null
          strength: string | null
          strip_size: number | null
          subcategory_id: string | null
          supplier_id: string | null
          unit_multiplier: number | null
          unit_price: number
          unit_size: string | null
          unit_type: string | null
          unit_type_id: string | null
          updated_at: string
          vat_percentage: number | null
          voltage_rating: string | null
          warranty_period: string | null
          weight: number | null
        }
        Insert: {
          active_ingredients?: string | null
          assemble_country?: string | null
          barcode?: string | null
          box_size?: number | null
          brand?: string | null
          brand_name?: string | null
          category_id?: string | null
          cgst_percentage?: number | null
          color?: string | null
          compatibility?: string | null
          composition?: string | null
          connectivity?: string | null
          cost_price?: number
          country_of_origin?: string | null
          created_at?: string
          description?: string | null
          dimensions?: string | null
          dosage?: string | null
          dosage_info?: string | null
          emi_management?: boolean | null
          expiry_date?: string | null
          features?: string | null
          generic_name?: string | null
          hsn_code?: string | null
          id?: string
          igst_percentage?: number | null
          image_url?: string | null
          indications?: string | null
          is_narcotic?: boolean | null
          is_prescription_required?: boolean | null
          is_schedule_drug?: boolean | null
          manufacture_date?: string | null
          manufacturer?: string | null
          manufacturer_id?: string | null
          max_discount_percentage?: number | null
          max_stock_level?: number | null
          medicine_category_id?: string | null
          medicine_type_id?: string | null
          min_stock_level?: number | null
          min_stock_threshold?: number | null
          model?: string | null
          mrp?: number | null
          mrp_strip?: number | null
          mrp_unit?: number | null
          name: string
          pack_size?: number | null
          package_contents?: string | null
          power_consumption?: string | null
          prescription_required?: boolean | null
          purchase_price?: number | null
          qr_code?: string | null
          rack_number?: string | null
          reorder_level?: number | null
          schedule_category?: string | null
          selling_price?: number | null
          serial_number?: string | null
          sgst_percentage?: number | null
          shelf_life?: string | null
          shelf_life_days?: number | null
          shelf_number?: string | null
          side_effects?: string | null
          sku: string
          specifications?: string | null
          stock_quantity?: number
          storage_condition?: string | null
          storage_instructions?: string | null
          strength?: string | null
          strip_size?: number | null
          subcategory_id?: string | null
          supplier_id?: string | null
          unit_multiplier?: number | null
          unit_price?: number
          unit_size?: string | null
          unit_type?: string | null
          unit_type_id?: string | null
          updated_at?: string
          vat_percentage?: number | null
          voltage_rating?: string | null
          warranty_period?: string | null
          weight?: number | null
        }
        Update: {
          active_ingredients?: string | null
          assemble_country?: string | null
          barcode?: string | null
          box_size?: number | null
          brand?: string | null
          brand_name?: string | null
          category_id?: string | null
          cgst_percentage?: number | null
          color?: string | null
          compatibility?: string | null
          composition?: string | null
          connectivity?: string | null
          cost_price?: number
          country_of_origin?: string | null
          created_at?: string
          description?: string | null
          dimensions?: string | null
          dosage?: string | null
          dosage_info?: string | null
          emi_management?: boolean | null
          expiry_date?: string | null
          features?: string | null
          generic_name?: string | null
          hsn_code?: string | null
          id?: string
          igst_percentage?: number | null
          image_url?: string | null
          indications?: string | null
          is_narcotic?: boolean | null
          is_prescription_required?: boolean | null
          is_schedule_drug?: boolean | null
          manufacture_date?: string | null
          manufacturer?: string | null
          manufacturer_id?: string | null
          max_discount_percentage?: number | null
          max_stock_level?: number | null
          medicine_category_id?: string | null
          medicine_type_id?: string | null
          min_stock_level?: number | null
          min_stock_threshold?: number | null
          model?: string | null
          mrp?: number | null
          mrp_strip?: number | null
          mrp_unit?: number | null
          name?: string
          pack_size?: number | null
          package_contents?: string | null
          power_consumption?: string | null
          prescription_required?: boolean | null
          purchase_price?: number | null
          qr_code?: string | null
          rack_number?: string | null
          reorder_level?: number | null
          schedule_category?: string | null
          selling_price?: number | null
          serial_number?: string | null
          sgst_percentage?: number | null
          shelf_life?: string | null
          shelf_life_days?: number | null
          shelf_number?: string | null
          side_effects?: string | null
          sku?: string
          specifications?: string | null
          stock_quantity?: number
          storage_condition?: string | null
          storage_instructions?: string | null
          strength?: string | null
          strip_size?: number | null
          subcategory_id?: string | null
          supplier_id?: string | null
          unit_multiplier?: number | null
          unit_price?: number
          unit_size?: string | null
          unit_type?: string | null
          unit_type_id?: string | null
          updated_at?: string
          vat_percentage?: number | null
          voltage_rating?: string | null
          warranty_period?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_manufacturer_id_fkey"
            columns: ["manufacturer_id"]
            isOneToOne: false
            referencedRelation: "manufacturers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_medicine_category_id_fkey"
            columns: ["medicine_category_id"]
            isOneToOne: false
            referencedRelation: "medicine_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_medicine_type_id_fkey"
            columns: ["medicine_type_id"]
            isOneToOne: false
            referencedRelation: "medicine_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_unit_type_id_fkey"
            columns: ["unit_type_id"]
            isOneToOne: false
            referencedRelation: "unit_types"
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
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      purchase_items: {
        Row: {
          batch_id: string | null
          batch_number: string | null
          cgst_amount: number | null
          cgst_percentage: number | null
          discount_amount: number | null
          discount_percentage: number | null
          expiry_date: string | null
          id: string
          mrp: number | null
          product_id: string
          purchase_id: string
          qty: number
          sgst_amount: number | null
          sgst_percentage: number | null
          total_price: number
          unit: string | null
          unit_price: number
          vat_amount: number | null
          vat_percentage: number | null
        }
        Insert: {
          batch_id?: string | null
          batch_number?: string | null
          cgst_amount?: number | null
          cgst_percentage?: number | null
          discount_amount?: number | null
          discount_percentage?: number | null
          expiry_date?: string | null
          id?: string
          mrp?: number | null
          product_id: string
          purchase_id: string
          qty: number
          sgst_amount?: number | null
          sgst_percentage?: number | null
          total_price: number
          unit?: string | null
          unit_price: number
          vat_amount?: number | null
          vat_percentage?: number | null
        }
        Update: {
          batch_id?: string | null
          batch_number?: string | null
          cgst_amount?: number | null
          cgst_percentage?: number | null
          discount_amount?: number | null
          discount_percentage?: number | null
          expiry_date?: string | null
          id?: string
          mrp?: number | null
          product_id?: string
          purchase_id?: string
          qty?: number
          sgst_amount?: number | null
          sgst_percentage?: number | null
          total_price?: number
          unit?: string | null
          unit_price?: number
          vat_amount?: number | null
          vat_percentage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_items_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "medicine_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_items_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "v_expiring_medicines"
            referencedColumns: ["batch_id"]
          },
          {
            foreignKeyName: "purchase_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_expiring_medicines"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "purchase_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_low_stock_medicines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_medicines_with_stock"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_items_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases: {
        Row: {
          created_at: string
          created_by: string | null
          date: string
          id: string
          invoice_no: string | null
          payment_status: string | null
          store_id: string | null
          supplier_id: string | null
          total_amount: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date?: string
          id?: string
          invoice_no?: string | null
          payment_status?: string | null
          store_id?: string | null
          supplier_id?: string | null
          total_amount?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date?: string
          id?: string
          invoice_no?: string | null
          payment_status?: string | null
          store_id?: string | null
          supplier_id?: string | null
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchases_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      requisition_items: {
        Row: {
          id: string
          product_id: string
          qty: number
          requisition_id: string
          unit: string | null
        }
        Insert: {
          id?: string
          product_id: string
          qty: number
          requisition_id: string
          unit?: string | null
        }
        Update: {
          id?: string
          product_id?: string
          qty?: number
          requisition_id?: string
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "requisition_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requisition_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_expiring_medicines"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "requisition_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_low_stock_medicines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requisition_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_medicines_with_stock"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requisition_items_requisition_id_fkey"
            columns: ["requisition_id"]
            isOneToOne: false
            referencedRelation: "requisitions"
            referencedColumns: ["id"]
          },
        ]
      }
      requisitions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          id: string
          requested_by: string | null
          status: string
          store_id: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          requested_by?: string | null
          status?: string
          store_id?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          requested_by?: string | null
          status?: string
          store_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "requisitions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          created_at: string
          created_by: string | null
          customer_email: string | null
          customer_id: string | null
          customer_name: string
          customer_phone: string | null
          discount: number | null
          emi_amount: number | null
          emi_enabled: boolean | null
          emi_interest_rate: number | null
          emi_months: number | null
          id: string
          net_amount: number
          notes: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status: string
          payment_type: string | null
          tax: number | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name: string
          customer_phone?: string | null
          discount?: number | null
          emi_amount?: number | null
          emi_enabled?: boolean | null
          emi_interest_rate?: number | null
          emi_months?: number | null
          id?: string
          net_amount?: number
          notes?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status?: string
          payment_type?: string | null
          tax?: number | null
          total_amount?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string | null
          discount?: number | null
          emi_amount?: number | null
          emi_enabled?: boolean | null
          emi_interest_rate?: number | null
          emi_months?: number | null
          id?: string
          net_amount?: number
          notes?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_status?: string
          payment_type?: string | null
          tax?: number | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_items: {
        Row: {
          batch_id: string | null
          batch_number: string | null
          cgst_amount: number | null
          cgst_percentage: number | null
          created_at: string
          discount: number | null
          discount_amount: number | null
          discount_percentage: number | null
          expiry_date: string | null
          id: string
          product_id: string
          quantity: number
          sale_id: string
          sgst_amount: number | null
          sgst_percentage: number | null
          total_price: number
          unit_price: number
          vat_amount: number | null
          vat_percentage: number | null
        }
        Insert: {
          batch_id?: string | null
          batch_number?: string | null
          cgst_amount?: number | null
          cgst_percentage?: number | null
          created_at?: string
          discount?: number | null
          discount_amount?: number | null
          discount_percentage?: number | null
          expiry_date?: string | null
          id?: string
          product_id: string
          quantity: number
          sale_id: string
          sgst_amount?: number | null
          sgst_percentage?: number | null
          total_price: number
          unit_price: number
          vat_amount?: number | null
          vat_percentage?: number | null
        }
        Update: {
          batch_id?: string | null
          batch_number?: string | null
          cgst_amount?: number | null
          cgst_percentage?: number | null
          created_at?: string
          discount?: number | null
          discount_amount?: number | null
          discount_percentage?: number | null
          expiry_date?: string | null
          id?: string
          product_id?: string
          quantity?: number
          sale_id?: string
          sgst_amount?: number | null
          sgst_percentage?: number | null
          total_price?: number
          unit_price?: number
          vat_amount?: number | null
          vat_percentage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_items_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "medicine_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_items_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "v_expiring_medicines"
            referencedColumns: ["batch_id"]
          },
          {
            foreignKeyName: "sales_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_expiring_medicines"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "sales_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_low_stock_medicines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_medicines_with_stock"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_transactions: {
        Row: {
          created_at: string
          created_by: string | null
          from_location: string | null
          id: string
          notes: string | null
          product_id: string
          quantity: number
          reason: string | null
          reference_id: string | null
          to_location: string | null
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          unit_price: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          from_location?: string | null
          id?: string
          notes?: string | null
          product_id: string
          quantity: number
          reason?: string | null
          reference_id?: string | null
          to_location?: string | null
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          unit_price?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          from_location?: string | null
          id?: string
          notes?: string | null
          product_id?: string
          quantity?: number
          reason?: string | null
          reference_id?: string | null
          to_location?: string | null
          transaction_type?: Database["public"]["Enums"]["transaction_type"]
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_transactions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transactions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_expiring_medicines"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "stock_transactions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_low_stock_medicines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transactions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_medicines_with_stock"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          address: string | null
          contact: string | null
          created_at: string
          id: string
          name: string
          timezone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact?: string | null
          created_at?: string
          id?: string
          name: string
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact?: string | null
          created_at?: string
          id?: string
          name?: string
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      subcategories: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          contact_person: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          payment_terms: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          payment_terms?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          payment_terms?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_by: string | null
          date: string
          description: string | null
          id: string
          reference_id: string | null
          type: string
        }
        Insert: {
          amount: number
          created_by?: string | null
          date?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          type: string
        }
        Update: {
          amount?: number
          created_by?: string | null
          date?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          type?: string
        }
        Relationships: []
      }
      unit_types: {
        Row: {
          abbreviation: string
          category: string | null
          created_at: string
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          abbreviation: string
          category?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          abbreviation?: string
          category?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
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
      waste_products: {
        Row: {
          approved_by: string | null
          batch_id: string | null
          batch_number: string | null
          created_at: string
          disposal_method: string | null
          id: string
          notes: string | null
          product_id: string
          quantity: number
          reason: string
          reported_by: string | null
          store_id: string | null
          value_loss: number | null
        }
        Insert: {
          approved_by?: string | null
          batch_id?: string | null
          batch_number?: string | null
          created_at?: string
          disposal_method?: string | null
          id?: string
          notes?: string | null
          product_id: string
          quantity: number
          reason: string
          reported_by?: string | null
          store_id?: string | null
          value_loss?: number | null
        }
        Update: {
          approved_by?: string | null
          batch_id?: string | null
          batch_number?: string | null
          created_at?: string
          disposal_method?: string | null
          id?: string
          notes?: string | null
          product_id?: string
          quantity?: number
          reason?: string
          reported_by?: string | null
          store_id?: string | null
          value_loss?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "waste_products_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "medicine_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waste_products_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "v_expiring_medicines"
            referencedColumns: ["batch_id"]
          },
          {
            foreignKeyName: "waste_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waste_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_expiring_medicines"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "waste_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_low_stock_medicines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waste_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_medicines_with_stock"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waste_products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_expiring_medicines: {
        Row: {
          alert_level: string | null
          barcode: string | null
          batch_id: string | null
          batch_number: string | null
          brand_name: string | null
          days_to_expiry: number | null
          expiry_date: string | null
          generic_name: string | null
          manufacturer: string | null
          product_id: string | null
          product_name: string | null
          purchase_price: number | null
          quantity_remaining: number | null
          store: string | null
          value_at_risk: number | null
        }
        Relationships: []
      }
      v_low_stock_medicines: {
        Row: {
          brand_name: string | null
          current_stock: number | null
          generic_name: string | null
          id: string | null
          manufacturer: string | null
          manufacturer_phone: string | null
          name: string | null
          reorder_level: number | null
          shortage: number | null
          sku: string | null
        }
        Relationships: []
      }
      v_medicines_with_stock: {
        Row: {
          barcode: string | null
          batch_count: number | null
          brand_name: string | null
          created_at: string | null
          generic_name: string | null
          id: string | null
          is_prescription_required: boolean | null
          manufacturer: string | null
          medicine_category: string | null
          medicine_type: string | null
          mrp: number | null
          name: string | null
          nearest_expiry: string | null
          purchase_price: number | null
          reorder_level: number | null
          selling_price: number | null
          sku: string | null
          strength: string | null
          total_stock: number | null
          unit_abbr: string | null
          unit_type: string | null
          updated_at: string | null
          vat_percentage: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_expired_batches: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_or_manager: { Args: { _user_id: string }; Returns: boolean }
      uuid_generate_v4: { Args: never; Returns: string }
    }
    Enums: {
      app_role: "admin" | "manager" | "employee"
      payment_method: "cash" | "bkash" | "upay" | "visa" | "bank_transfer"
      transaction_type:
        | "purchase"
        | "sale"
        | "adjustment"
        | "return"
        | "opening_stock"
        | "sales_return"
        | "transfer_in"
        | "transfer_out"
        | "stock_adjustment_in"
        | "stock_adjustment_out"
        | "misc_receive"
        | "misc_issue"
        | "supplier_return"
        | "production_out"
        | "purchase_return"
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
      app_role: ["admin", "manager", "employee"],
      payment_method: ["cash", "bkash", "upay", "visa", "bank_transfer"],
      transaction_type: [
        "purchase",
        "sale",
        "adjustment",
        "return",
        "opening_stock",
        "sales_return",
        "transfer_in",
        "transfer_out",
        "stock_adjustment_in",
        "stock_adjustment_out",
        "misc_receive",
        "misc_issue",
        "supplier_return",
        "production_out",
        "purchase_return",
      ],
    },
  },
} as const
