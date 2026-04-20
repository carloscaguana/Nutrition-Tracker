import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database.types'

type WeightLog = Database['public']['Tables']['weight_logs']['Row']
type WeightLogInsert = Database['public']['Tables']['weight_logs']['Insert']

// mirrors SELECT statement policy
export const getWeightLogs = async (): Promise<WeightLog[]> => {
  const { data, error } = await supabase
    .from('weight_logs')
    .select('*')
    .order('recorded_at', { ascending: false })

  if (error) throw error
  return data
}

//
export const addWeightLog = async (log: WeightLogInsert) => {
  const { data, error } = await supabase
    .from('weight_logs')
    .insert(log)
  
  if (error) throw error
  return data
}