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
      favorite_foods: {
        Row: {
          added_at: string | null
          food_id: number
          user_id: string
        }
        Insert: {
          added_at?: string | null
          food_id: number
          user_id?: string
        }
        Update: {
          added_at?: string | null
          food_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorite_foods_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["food_id"]
          },
          {
            foreignKeyName: "favorite_foods_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      foods: {
        Row: {
          calcium_mg: number | null
          carbs_g: number
          cholesterol_mg: number | null
          copper_mg: number | null
          fats_g: number
          fiber_g: number | null
          food_id: number
          food_name: string
          iron_mg: number | null
          kcal_val: number
          magnesium_mg: number | null
          manganese_mg: number | null
          mono_fats_g: number | null
          nutrition_density: number | null
          phosphorus_mg: number | null
          poly_fats_g: number | null
          potassium_mg: number | null
          protein_g: number
          sat_fats_g: number | null
          selenium_mg: number | null
          sodium_g: number | null
          sugars_g: number | null
          vit_a_mg: number | null
          vit_b1_mg: number | null
          vit_b11_mg: number | null
          vit_b12_mg: number | null
          vit_b2_mg: number | null
          vit_b3_mg: number | null
          vit_b5_mg: number | null
          vit_b6_mg: number | null
          vit_c_mg: number | null
          vit_d_mg: number | null
          vit_e_mg: number | null
          vit_k_mg: number | null
          water_g: number | null
          zinc_mg: number | null
        }
        Insert: {
          calcium_mg?: number | null
          carbs_g: number
          cholesterol_mg?: number | null
          copper_mg?: number | null
          fats_g: number
          fiber_g?: number | null
          food_id?: number
          food_name: string
          iron_mg?: number | null
          kcal_val: number
          magnesium_mg?: number | null
          manganese_mg?: number | null
          mono_fats_g?: number | null
          nutrition_density?: number | null
          phosphorus_mg?: number | null
          poly_fats_g?: number | null
          potassium_mg?: number | null
          protein_g: number
          sat_fats_g?: number | null
          selenium_mg?: number | null
          sodium_g?: number | null
          sugars_g?: number | null
          vit_a_mg?: number | null
          vit_b1_mg?: number | null
          vit_b11_mg?: number | null
          vit_b12_mg?: number | null
          vit_b2_mg?: number | null
          vit_b3_mg?: number | null
          vit_b5_mg?: number | null
          vit_b6_mg?: number | null
          vit_c_mg?: number | null
          vit_d_mg?: number | null
          vit_e_mg?: number | null
          vit_k_mg?: number | null
          water_g?: number | null
          zinc_mg?: number | null
        }
        Update: {
          calcium_mg?: number | null
          carbs_g?: number
          cholesterol_mg?: number | null
          copper_mg?: number | null
          fats_g?: number
          fiber_g?: number | null
          food_id?: number
          food_name?: string
          iron_mg?: number | null
          kcal_val?: number
          magnesium_mg?: number | null
          manganese_mg?: number | null
          mono_fats_g?: number | null
          nutrition_density?: number | null
          phosphorus_mg?: number | null
          poly_fats_g?: number | null
          potassium_mg?: number | null
          protein_g?: number
          sat_fats_g?: number | null
          selenium_mg?: number | null
          sodium_g?: number | null
          sugars_g?: number | null
          vit_a_mg?: number | null
          vit_b1_mg?: number | null
          vit_b11_mg?: number | null
          vit_b12_mg?: number | null
          vit_b2_mg?: number | null
          vit_b3_mg?: number | null
          vit_b5_mg?: number | null
          vit_b6_mg?: number | null
          vit_c_mg?: number | null
          vit_d_mg?: number | null
          vit_e_mg?: number | null
          vit_k_mg?: number | null
          water_g?: number | null
          zinc_mg?: number | null
        }
        Relationships: []
      }
      goals: {
        Row: {
          calorie_target: number
          carb_target: number | null
          end_date: string
          fat_target: number | null
          goal_id: number
          goal_type: Database["public"]["Enums"]["goal_type"] | null
          protein_target: number | null
          start_date: string
          user_id: string
        }
        Insert: {
          calorie_target: number
          carb_target?: number | null
          end_date?: string
          fat_target?: number | null
          goal_id?: number
          goal_type?: Database["public"]["Enums"]["goal_type"] | null
          protein_target?: number | null
          start_date: string
          user_id?: string
        }
        Update: {
          calorie_target?: number
          carb_target?: number | null
          end_date?: string
          fat_target?: number | null
          goal_id?: number
          goal_type?: Database["public"]["Enums"]["goal_type"] | null
          protein_target?: number | null
          start_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      meal_items: {
        Row: {
          food_id: number
          meal_id: number
          mealitem_id: number
          quantity: number
          quantity_grams: number
          unit_id: number | null
        }
        Insert: {
          food_id: number
          meal_id: number
          mealitem_id?: number
          quantity?: number
          quantity_grams: number
          unit_id?: number | null
        }
        Update: {
          food_id?: number
          meal_id?: number
          mealitem_id?: number
          quantity?: number
          quantity_grams?: number
          unit_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "meal_items_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["food_id"]
          },
          {
            foreignKeyName: "meal_items_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["meal_id"]
          },
          {
            foreignKeyName: "meal_items_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "serving_units"
            referencedColumns: ["unit_id"]
          },
        ]
      }
      meals: {
        Row: {
          last_updated_at: string
          meal_id: number
          meal_type: Database["public"]["Enums"]["meal_type"] | null
          time_consumed_at: string
          user_id: string
        }
        Insert: {
          last_updated_at?: string
          meal_id?: number
          meal_type?: Database["public"]["Enums"]["meal_type"] | null
          time_consumed_at: string
          user_id?: string
        }
        Update: {
          last_updated_at?: string
          meal_id?: number
          meal_type?: Database["public"]["Enums"]["meal_type"] | null
          time_consumed_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      serving_units: {
        Row: {
          unit_id: number
          unit_name: string
        }
        Insert: {
          unit_id: number
          unit_name: string
        }
        Update: {
          unit_id?: number
          unit_name?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          dob: string | null
          email: string | null
          height_cm: number | null
          name: string
          password_hash: string | null
          sex: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          dob?: string | null
          email?: string | null
          height_cm?: number | null
          name: string
          password_hash?: string | null
          sex?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string
          dob?: string | null
          email?: string | null
          height_cm?: number | null
          name?: string
          password_hash?: string | null
          sex?: string | null
          user_id?: string
        }
        Relationships: []
      }
      weight_logs: {
        Row: {
          recorded_at: string
          user_id: string
          weight_kg: number
          weightlog_id: number
        }
        Insert: {
          recorded_at?: string
          user_id?: string
          weight_kg: number
          weightlog_id?: number
        }
        Update: {
          recorded_at?: string
          user_id?: string
          weight_kg?: number
          weightlog_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "weight_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      goal_type: "deficit" | "maintenance" | "surplus" | "other"
      meal_type: "breakfast" | "lunch" | "dinner" | "snack" | "drink" | "other"
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
      goal_type: ["deficit", "maintenance", "surplus", "other"],
      meal_type: ["breakfast", "lunch", "dinner", "snack", "drink", "other"],
    },
  },
} as const
