import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database.types'

type Favorite = Database['public']['Tables']['favorite_foods']['Row']
type FavoriteInsert = Database['public']['Tables']['favorite_foods']['Insert']

// mirrors SELECT statement policy
export const getFavorites = async (): Promise<Favorite[]> => {
  const { data, error } = await supabase
    .from('favorite_foods')
    .select(`*, foods(*)`)

  if (error) throw error
  return data
}

// mirrors INSERT statement policy
export const addFavorite = async (fav: FavoriteInsert) => {
  const { data, error } = await supabase
    .from('favorite_foods')
    .insert(fav)

  if (error) throw error
  return data
}

// mirrors DELETE statement policy
export const deleteFavorite = async (foodId: number) => {
  const { data, error } = await supabase
    .from('favorite_foods')
    .delete()
    .eq('food_id', foodId)
  
  if (error) throw error
  return data
}