import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database.types'
import { AArrowUp } from 'lucide-react'

type Goal = Database['public']['Tables']['goals']['Row']
type GoalInsert = Database['public']['Tables']['goals']['Insert']
type GoalUpdate = Database['public']['Tables']['goals']['Update']

// Returns today's date as YYYY-MM-DD using the local timezone instead of UTC
function localToday(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// used to obtain current user goal
export const getActiveGoal = async (userId: string) => {
  const today = localToday()

  // The active goal is the most recently *started* goal whose start_date is
  // on or before today. We deliberately do NOT filter on end_date because
  // the sentinel value "9999-12-31" can be returned by Supabase as a full
  // timestamp string (e.g. "9999-12-31T00:00:00+00:00") which breaks equality
  // and range comparisons.
  const { data, error } = await supabase
  .from('goals')
  .select('*')
  .eq('user_id', userId)
  .lte('start_date', today)
  .order('start_date', { ascending: false })
  .limit(1)
  .maybeSingle()

  if (error) throw error
  return data   // null when the user has no goals yet
}

// mirrors SELECT statement policy - selects all user's goals (past and current)
export const getAllGoals = async (): Promise<Goal[]> => {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .order('start_date', { ascending: false })

  if (error) throw error
  return data
}

// mirrors INSERT statement policy
export const insertGoal = async (goal: GoalInsert) => {
  const { data, error } = await supabase
    .from('goals')
    .insert(goal)
    .select()
    .single()

  if (error) throw error
  return data
}

// mirrors UPDATE statement policy
export const updateGoal = async (goalId: number, goal: GoalUpdate) => {
  const { data, error } = await supabase
    .from('goals')
    .update(goal)
    .eq('goal_id', goalId)

  if (error) throw error
  return data
}

// 
export const deleteGoal = async (goalId: number) => {
  const { error } = await supabase
  .from('goals')
  .delete()
  .eq('goal_id', goalId)

  if (error) throw error
}