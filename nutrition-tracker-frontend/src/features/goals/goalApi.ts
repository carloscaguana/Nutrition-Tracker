import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database.types'

type Goal = Database['public']['Tables']['goals']['Row']
type GoalInsert = Database['public']['Tables']['goals']['Insert']
type GoalUpdate = Database['public']['Tables']['goals']['Update']

// mirrors SELECT statement policy
export const getGoals = async (): Promise<Goal[]> => {
  const { data, error } = await supabase
    .from('goals')
    .select('*')

  if (error) throw error
  return data
}

// mirrors INSERT statement policy
export const addGoal = async (goal: GoalInsert) => {
  const { data, error } = await supabase
    .from('goals')
    .insert(goal)

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