import { supabase } from '@/lib/supabase'

export const searchFoods = async (query: string) => {
  const { data, error } = await supabase
    .from('foods')
    .select('*')
    .ilike('food_name', `%${query}%`)
    .limit(20)

  if (error) throw error
  return data
}