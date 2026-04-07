import { supabase } from '@/lib/supabase'   //Supabase client; auto includes the logged-in user's session
import { Database } from '@/types/database.types'

type Meal = Database['public']['Tables']['meals']['Row']
type MealInsert = Database['public']['Tables']['meals']['Insert']
type MealUpdate = Database['public']['Tables']['meals']['Update']

// mirrors SELECT statement policy
export const getMeals = async () => {
  const { data, error } = await supabase
    .from('meals')
    .select('*')
    .order('time_consumed_at', { ascending: false })

  if (error) throw error
  return data
}

// mirrors INSERT statement policy
export const insertMeal = async (meal: MealInsert) => {
  const { data, error } = await supabase
    .from('meals')
    .insert(meal)

  if (error) throw error
  return data
}


// mirrors UPDATE statement policy
export const updateMeal = async (mealId: number, meal: MealUpdate) => {
  const { data, error } = await supabase
    .from('meals')
    .update(meal)
    .eq('meal_id', mealId)

  if (error) throw error
  return data
}

// mirrors DELETE statement policy
export const deleteMeal = async (mealId: number) => {
  const { data, error } = await supabase
    .from('meals')
    .delete()
    .eq('meal_id', mealId)

  if (error) throw error
  return data
}

// SELECT * FROM meals WHERE meal_id='specific_meal_id'
export const getMealById = async (mealId:number): Promise<Meal | null> => {
  const { data, error } = await supabase
    .from('meals')
    .select('*')
    .eq('meal_id', mealId)
    .single()
  
  if (error) throw error
  return data
}