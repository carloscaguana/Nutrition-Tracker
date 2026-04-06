import { supabase } from '@/lib/supabase'

export const getMeals = async (userId: string) => {
  const { data, error } = await supabase
    .from('meals')
    .select('*')
    .eq('user_id', userId)
    .order('time_consumed_at', { ascending: false })

  if (error) throw error
  return data
}

export const createMeal = async (meal: {
  time_consumed_at: string
  meal_type: string
  user_id: string
}) => {
  const { data, error } = await supabase
    .from('meals')
    .insert([meal])

  if (error) throw error
  return data
}