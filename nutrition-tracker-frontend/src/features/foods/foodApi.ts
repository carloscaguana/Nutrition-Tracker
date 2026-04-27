import { supabase } from '@/lib/supabase'

//Used in the search bar when logging a meal, limited to 1st 20 foods that match user criteria
export const searchFoods = async (query: string) => {
  const { data, error } = await supabase
    .from('foods')
    .select('*')
    .ilike('food_name', `%${query}%`)
    .limit(20)

  if (error) throw error
  return data
}

// used to list all available foods in the current dataset
export const getAllFoods = async (page: number, query: string, pageSize: number) => {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  let req = supabase
    .from('foods')
    .select ('*', { count: 'exact' })
    .order('food_name', { ascending: true })
    .range(from, to)

  if (query.trim()) {
    req = req.ilike('food_name', `%${query.trim()}%`)
  }

  const { data, error, count } = await req
  if (error) throw error
  return { data: data ?? [], count: count ?? 0}
}