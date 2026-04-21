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

const PAGE_SIZE = 50

// used to list all available foods in the dataset
export const getAllFoods = async (page: number, query: string) => {
  const from = page * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

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
  return { data: data ?? [], count: count ?? 0, page_size: PAGE_SIZE}
}