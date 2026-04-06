import { supabase } from '@/lib/supabase'

export const getMealItems = async (mealId: number) => {
  const { data, error } = await supabase
    .from('meal_items')
    .select(`
      *,
      foods (*),
      serving_units (*)
    `)
    .eq('meal_id', mealId)

  if (error) throw error
  return data
}

export const addMealItem = async (item: {
  meal_id: number
  food_id: number
  unit_id: number
  quantity: number
}) => {
  const { error } = await supabase
    .from('meal_items')
    .insert([item])

  if (error) throw error
}