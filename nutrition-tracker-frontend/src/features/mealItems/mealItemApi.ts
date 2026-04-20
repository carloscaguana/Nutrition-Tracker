import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database.types'

type MealItem = Database['public']['Tables']['meal_items']['Row']
type MealItemInsert = Database['public']['Tables']['meal_items']['Insert']
type MealItemUpdate = Database['public']['Tables']['meal_items']['Update']

// mirrors SELECT statement policy
export const getMealItems = async (mealId: number): Promise<MealItem[]> => {
  const { data, error } = await supabase
    .from('meal_items')
    .select(`*, foods(*),serving_units(*)`)   //join foods table for details
    .eq('meal_id', mealId)

  if (error) throw error
  return data
}

// mirrors INSERT statement policy
export const addMealItem = async (item: {
  meal_id: number
  food_id: number
  quantity_grams: number
  unit_id?: number | null
}) => {
  const { data, error } = await supabase
    .from('meal_items')
    .insert(item)

  if (error) throw error
  return data
}

// mirrors UPDATE statement policy
export const updateMealItem = async (mealItemId: number, item: MealItemUpdate) => {
  const { data, error } = await supabase
    .from('meal_items')
    .update(item)
    .eq('mealitem_id', mealItemId)

  if (error) throw error
  return data
}

// mirrors DELETE statement policy
export const deleteMealItem = async (mealItemId: number) => {
  const { data, error } = await supabase
    .from('meal_items')
    .delete()
    .eq('mealitem_id', mealItemId)

  if (error) throw error
  return data
}
