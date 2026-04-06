import { supabase } from '@/lib/supabase'

export const getFavoriteFoods = async (userId: string) => {
  const { data, error } = await supabase
    .from('favorite_foods')
    .select(`
      food_id,
      foods (*)
    `)
    .eq('user_id', userId)

  if (error) throw error
  return data
}