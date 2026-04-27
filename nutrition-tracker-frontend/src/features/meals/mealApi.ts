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

// mirrors INSERT statement policy - returns the created row (including meal_id)
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

//------------

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

// Get recent meals with nested joins - used for history preview on dashboard
export const getPastMealsWithItems = async (limit: number) => {
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
    .order('time_consumed_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

const HISTORY_PAGE_SIZE = 20

// Paginated full history — used for /meals/history page
export const getAllPastMealsWithItems = async (page: number) => {
  const from = page * HISTORY_PAGE_SIZE
  const to = from + HISTORY_PAGE_SIZE - 1

  const { data, error, count } = await supabase
    .from('meals')
    .select(`
      *,
      meal_items (
        *,
        foods (*),
        serving_units (*)
      )
    `, { count: 'exact' })
    .order('time_consumed_at', { ascending: false })
    .range(from, to)

  if (error) throw error
  return { data: data ?? [], count: count ?? 0, pageSize: HISTORY_PAGE_SIZE }
}

//Get a single meal with its items, foods, and serving units
export const getMealWithItems = async (mealId: number) => {
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