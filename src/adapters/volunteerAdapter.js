import { getDocument, queryDocuments, updateDocument, subscribeToCollection } from '../services/firestoreService'
import { isFirebaseConfigured } from '../firebase/config'
import { mockStore } from '../store/mockStore'

export async function fetchVolunteerProfile(uid) {
  if (!isFirebaseConfigured) {
    return mockStore.volunteers.find(v => v.uid === uid) || null
  }
  return getDocument('volunteers', uid)
}

export async function createVolunteerProfile(uid, data) {
  const profile = {
    ...data,
    onboarding_completed: false,
    rating: 5.0,
    total_tasks_completed: 0,
    created_at: new Date(),
    updated_at: new Date(),
  }
  if (!isFirebaseConfigured) {
    mockStore.volunteers.push({ uid, ...profile })
    return profile
  }
  // We use the uid as the document ID for easy lookup
  await updateDocument('volunteers', uid, profile)
  return profile
}

export async function updateVolunteerProfile(uid, data) {
  if (!isFirebaseConfigured) {
    const idx = mockStore.volunteers.findIndex(v => v.uid === uid)
    if (idx !== -1) {
      mockStore.volunteers[idx] = { ...mockStore.volunteers[idx], ...data, updated_at: new Date() }
    }
    return
  }
  await updateDocument('volunteers', uid, { ...data, updated_at: new Date() })
}

export async function fetchVolunteerTasks(uid) {
  if (!isFirebaseConfigured) {
    return mockStore.needs.filter(n => n.assigned_volunteer_id === uid)
  }
  return queryDocuments('needs', [{ field: 'assigned_volunteer_id', op: '==', value: uid }])
}

export async function fetchTaskById(taskId) {
  if (!isFirebaseConfigured) {
    return mockStore.needs.find(n => n.id === taskId) || null
  }
  return getDocument('needs', taskId)
}

export function subscribeToVolunteerTasks(volunteerId, callback) {
  if (!isFirebaseConfigured) {
    return mockStore.subscribe((needs) => {
      // Find tasks assigned to this volunteer
      const tasks = needs.filter(n => n.assigned_volunteer_id === volunteerId)
      // Also find potential matches (unassigned but relevant)
      // In a real app, this would be a separate matches collection
      // For the demo, we include "open" needs as "recommended" tasks
      const openNeeds = needs.filter(n => n.status === 'open' && !n.assigned_volunteer_id)
      
      // Combine them: assigned tasks + open needs (as pending)
      const combined = [
        ...tasks,
        ...openNeeds.map(n => ({ ...n, status: 'pending' }))
      ]
      callback(combined)
    })
  }
  return subscribeToCollection('needs', [{ field: 'assigned_volunteer_id', op: '==', value: volunteerId }], callback)
}

export async function acceptTask(matchId, volunteerId) {
  if (!isFirebaseConfigured) {
    mockStore.updateNeed(matchId, { status: 'active', assigned_volunteer_id: volunteerId })
    return { success: true }
  }
  await updateDocument('needs', matchId, { status: 'active', assigned_volunteer_id: volunteerId, updated_at: new Date() })
  return { success: true }
}

export async function declineTask(matchId, volunteerId) {
  if (!isFirebaseConfigured) {
    mockStore.updateNeed(matchId, { status: 'open', assigned_volunteer_id: null })
    return { success: true }
  }
  await updateDocument('needs', matchId, { status: 'open', assigned_volunteer_id: null, updated_at: new Date() })
  return { success: true }
}

export async function submitResolution(taskId, needId, data) {
  const updates = {
    status: 'resolved',
    resolved_at: new Date(),
    resolution_notes: data.notes,
    volunteers_helped: data.beneficiaries || 1,
    verified: false,
    updated_at: new Date()
  }

  if (!isFirebaseConfigured) {
    mockStore.updateNeed(needId, updates)
    return { success: true }
  }

  await updateDocument('needs', needId, updates)
  return { success: true }
}
