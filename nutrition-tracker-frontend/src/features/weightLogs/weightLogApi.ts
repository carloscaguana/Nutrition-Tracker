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

export const insertWeightLog = async (weight_kg: number, recorded_at: string) => {
  const { data, error } = await supabase
    .from('weight_logs')
    .insert({ weight_kg, recorded_at })
    .select()
    .single()

  if (error) throw error
  return data
}

export const updateWeightLog = async (
  weightlogId: number,
  updates: { weight_kg?: number; recorded_at?: string }
) => {
  const { error } = await supabase
    .from('weight_logs')
    .update(updates)
    .eq('weightlog_id', weightlogId)

  if (error) throw error
}

export const deleteWeightLog = async (weightlogId: number) => {
  const { error } = await supabase
    .from('weight_logs')
    .delete()
    .eq('weightlog_id', weightlogId)

  if (error) throw error
}
