import { supabase } from '@/lib/supabase'

export const getActiveGoal = async (userId: string) => {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .lte('start_date', new Date().toISOString())
    .gte('end_date', new Date().toISOString())
    .single()

  if (error) throw error
  return data
}