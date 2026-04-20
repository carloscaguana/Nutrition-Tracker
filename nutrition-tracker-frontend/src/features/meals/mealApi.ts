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
export const insertMeal = async (meal: MealInsert): Promise<Meal> => {
  const { data, error } = await supabase
    .from('meals')
    .insert(meal)
    .select()
    .single()

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

// Get today's meals joined with their items, foods, and serving units
export const getTodaysMealsWithItems = async () => {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date()
  end.setHours(23, 59, 59, 999)

  const { data, error } = await supabase
    .from('meals')
    .select(`
      *,
      meal_items (
        *,
        foods (*),
        serving_units (*)
      )
    `)
    .gte('time_consumed_at', start.toISOString())
    .lte('time_consumed_at', end.toISOString())
    .order('time_consumed_at', { ascending: true })

  if (error) throw error
  return data
}