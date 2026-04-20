'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus } from 'lucide-react'
import { Database } from '@/types/database.types'

type Meal = Database['public']['Tables']['meals']['Row']

export default function Dashboard() {
  const [meals, setMeals] = useState<Meal[]>([])

  useEffect(() => {
    const fetchMeals = async () => {
      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .order('time_consumed_at', { ascending: false })

      if (!error && data) setMeals(data)
    }

    fetchMeals()
  }, [])

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">My Meals</h1>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl shadow hover:bg-blue-700 transition">
          <Plus size={18} />
          Add Meal
        </button>
      </div>

      {/* Meals Grid */}
      {meals.length === 0 ? (
        <div className="bg-white rounded-2xl shadow p-6 text-center text-gray-500">
          No meals yet. Start by adding one!
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {meals.map((meal) => (
            <div
              key={meal.meal_id}
              className="bg-white rounded-2xl shadow p-5 hover:shadow-lg transition"
            >
              <h2 className="text-lg font-semibold text-gray-800 capitalize">
                {meal.meal_type}
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                {new Date(meal.time_consumed_at).toLocaleString()}
              </p>

              <div className="mt-4 flex justify-between items-center">
                <button className="text-sm text-blue-600 hover:underline">
                  View Details
                </button>

                <button className="text-sm text-red-500 hover:underline">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}