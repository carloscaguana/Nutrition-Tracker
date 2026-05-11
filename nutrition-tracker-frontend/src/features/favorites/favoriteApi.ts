import { supabase } from '@/lib/supabase'

// mirrors SELECT statement policy
export const getFavoriteFoods = async (userId: string) => {
  const { data, error } = await supabase
    .from('favorite_foods')
    .select(`
      food_id,
      added_at,
      foods(*)`)
    .eq('user_id', userId)
    .order('added_at', {ascending: false})

  if (error) throw error
  return data
}

// mirrors INSERT statement policy
export const addFavorite = async (userId: string, foodId: number) => {
  const { data, error } = await supabase
    .from('favorite_foods')
    .insert({ user_id: userId, food_id: foodId})

  if (error) throw error
}

// mirrors DELETE statement policy
export const removeFavorite = async (userId: string, foodId: number) => {
  const { error } = await supabase
    .from('favorite_foods')
    .delete()
    .eq('user_id', userId)
    .eq('food_id', foodId)
  
  if (error) throw error
}