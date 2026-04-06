import { supabase } from '@/lib/supabase'

export const getWeightLogs = async (userId: string) => {
  const { data, error } = await supabase
    .from('weight_logs')
    .select('*')
    .eq('user_id', userId)
    .order('recorded_at', { ascending: false })

  if (error) throw error
  return data
}