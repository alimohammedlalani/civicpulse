import { useState, useEffect } from 'react'
import { subscribeToVolunteerTasks } from '../adapters/volunteerAdapter'

export function useVolunteerTasks(volunteerId) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!volunteerId) {
      setLoading(false)
      return
    }
    setLoading(true)
    const unsub = subscribeToVolunteerTasks(volunteerId, (data) => {
      setTasks(data)
      setLoading(false)
    })
    return () => unsub && unsub()
  }, [volunteerId])

  const pending = tasks.filter(t => t.status === 'pending')
  const active = tasks.filter(t => t.status === 'accepted')
  const completed = tasks.filter(t => t.status === 'resolved')

  return { tasks, pending, active, completed, loading }
}
