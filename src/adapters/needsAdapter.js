import { addDocument, getDocument, queryDocuments, updateDocument, subscribeToCollection } from '../services/firestoreService'
import { isFirebaseConfigured } from '../firebase/config'
import { generateTrackingId } from '../utils/formatters'
import { mockStore } from '../store/mockStore'

export async function submitNeed(formData) {
  const trackingId = generateTrackingId()
  const needData = {
    raw_report: formData.description,
    summary: formData.description,
    category: formData.category,
    urgency: formData.urgency,
    quantity: formData.quantity || 1,
    required_skills: [formData.category],
    location_hint: formData.location_hint,
    location_coords: formData.location_coords || null,
    status: 'pending_review',
    priority_score: formData.urgency === 'critical' ? 90 : formData.urgency === 'urgent' ? 65 : 35,
    confidence: 0.85,
    needs_review: true,
    tracking_id: trackingId,
    assigned_volunteer_id: null,
    match_tier: null,
    escalation_status: null,
    resolved_at: null,
    resolution_notes: null,
    volunteers_helped: null,
    contact_phone: formData.anonymous ? null : (formData.contact_phone || null),
    contact_email: formData.anonymous ? null : (formData.contact_email || null),
    submitted_at: new Date(),
    updated_at: new Date(),
  }

  if (!isFirebaseConfigured) {
    const id = 'demo-' + Date.now()
    const newNeed = { id, tracking_id: trackingId, ...needData }
    mockStore.addNeed(newNeed)
    return newNeed
  }

  const { id } = await addDocument('needs', needData)
  return { id, tracking_id: trackingId, ...needData }
}

export async function fetchNeedById(needId) {
  if (!isFirebaseConfigured) {
    return mockStore.needs.find(n => n.id === needId) || null
  }
  return getDocument('needs', needId)
}

export async function fetchNeedByTrackingId(trackingId) {
  if (!isFirebaseConfigured) {
    return mockStore.needs.find(n => n.tracking_id === trackingId) || null
  }
  const results = await queryDocuments('needs', [{ field: 'tracking_id', op: '==', value: trackingId }])
  return results[0] || null
}

export async function updateNeedStatus(needId, status, extraData = {}) {
  if (!isFirebaseConfigured) {
    mockStore.updateNeed(needId, { status, ...extraData })
    return
  }
  await updateDocument('needs', needId, { status, ...extraData, updated_at: new Date() })
}

export function subscribeToNeeds(filters, callback) {
  if (!isFirebaseConfigured) {
    return mockStore.subscribe((needs) => {
      const filtered = needs.filter(n => {
        return filters.every(f => {
          if (f.op === '==') return n[f.field] === f.value
          if (f.op === 'in') return f.value.includes(n[f.field])
          return true
        })
      })
      callback(filtered)
    })
  }
  return subscribeToCollection('needs', filters, callback)
}
