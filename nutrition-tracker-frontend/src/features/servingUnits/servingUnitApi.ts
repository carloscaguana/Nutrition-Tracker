import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database.types'

export type ServingUnit = Database['public']['Tables']['serving_units']['Row']

export const getServingUnits = async (): Promise<ServingUnit[]> => {
  const { data, error } = await supabase
    .from('serving_units')
    .select('*')
    .order('unit_name')

  if (error) throw error
  return data ?? []
}
