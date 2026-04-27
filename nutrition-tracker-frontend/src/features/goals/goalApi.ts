import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database.types'
import { AArrowUp } from 'lucide-react'

type Goal = Database['public']['Tables']['goals']['Row']
type GoalInsert = Database['public']['Tables']['goals']['Insert']
type GoalUpdate = Database['public']['Tables']['goals']['Update']

// used to obtain current user goal
export const getActiveGoal = async (userId: string) => {
  const { data, error } = await supabase
  .from('goals')
  .select('*')
  .eq('user_id', userId)
  .lte('start_date', new Date().toISOString().slice(0, 10))
  .gte('end_date', new Date().toISOString().slice(0, 10))
  .single()

  if (error) throw error
  return data
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