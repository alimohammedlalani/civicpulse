import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Home, ListChecks, Check, X, Zap, 
  ArrowLeft, Search, Filter, ShieldAlert,
  BarChart2, MapPin, Clock, Info, FileText
} from 'lucide-react'
import PageTransition from '../../components/layout/PageTransition'
import NeedReviewCard from '../../components/coordinator/NeedReviewCard'
import VolunteerMatchList from '../../components/coordinator/VolunteerMatchList'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import Badge from '../../components/ui/Badge'
import ProgressBar from '../../components/ui/ProgressBar'
import { useRealtimeNeeds } from '../../hooks/useRealtimeNeeds'
import { approveNeed, approveAndTriggerMatch, rejectNeed } from '../../adapters/coordinatorAdapter'
import { assignVolunteer } from '../../adapters/matchAdapter'
import { showSuccess, showError } from '../../components/ui/Toast'
import useIsMobile from '../../hooks/useIsMobile'
import { T } from '../../styles/tokens'

const formatDateTime = (date) => {
  if (!date) return 'N/A'
  const d = date.toDate ? date.toDate() : new Date(date)
  return d.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
}

export default function CoordinatorReviewPage() {
  const isMobile = useIsMobile(1024)
  const { needs, loading: needsLoading } = useRealtimeNeeds()
  const [selectedNeed, setSelectedNeed] = useState(null)
  const [matches, setMatches] = useState(null)
  const [processing, setProcessing] = useState(false)

  const pendingReview = needs
    .filter(n => n.status === 'pending_review')
    .sort((a, b) => b.priority_score - a.priority_score)

  useEffect(() => {
    if (!isMobile && pendingReview.length > 0 && !selectedNeed) {
      setSelectedNeed(pendingReview[0])
    }
  }, [pendingReview, selectedNeed, isMobile])

  const handleApprove = async () => {
    try {
      setProcessing(true)
      await approveNeed(selectedNeed.id)
      showSuccess('Need approved.')
      setSelectedNeed(null)
      setMatches(null)
    } catch (err) { showError('Failed to approve.') }
    finally { setProcessing(false) }
  }

  const handleApproveAndMatch = async () => {
    try {
      setProcessing(true)
      const res = await approveAndTriggerMatch(selectedNeed.id)
      setMatches(res.matches)
      showSuccess('Need approved. Dispatching matching engine...')
    } catch (err) { showError('Matching failed.') }
    finally { setProcessing(false) }
  }

  const handleReject = async () => {
    try {
      setProcessing(true)
      await rejectNeed(selectedNeed.id)
      showSuccess('Need rejected.')
      setSelectedNeed(null)
      setMatches(null)
    } catch (err) { showError('Action failed.') }
    finally { setProcessing(false) }
  }

  const handleAssign = async (volunteerId, tier) => {
    try {
      setProcessing(true)
      await assignVolunteer(selectedNeed.id, volunteerId, tier)
      showSuccess('Volunteer assigned!')
      setSelectedNeed(null)
      setMatches(null)
    } catch (err) { showError('Assignment failed.') }
    finally { setProcessing(false) }
  }

  return (
    <PageTransition>
      <div style={{ display: 'flex', flexDirection: 'column', height: isMobile ? 'auto' : 'calc(100vh - 120px)', gap: '24px', padding: isMobile ? '16px' : '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontFamily: T.fontDisplay, fontSize: '32px', fontWeight: 800, color: T.textPrimary }}>Review Queue</h1>
            <p style={{ color: T.textSecondary }}>Operational triage for incoming citizen requests.</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '24px', flex: 1, minHeight: 0 }}>
          <div style={{ width: isMobile ? '100%' : '400px', display: 'flex', flexDirection: 'column', backgroundColor: T.surface2, borderRadius: T.radiusXl, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
            <div style={{ padding: '16px', borderBottom: `1px solid ${T.border}`, backgroundColor: T.white, display: 'flex', justifyContent: 'space-between' }}>
              <h2 style={{ fontWeight: 800, fontSize: '15px' }}>Pending Triage ({pendingReview.length})</h2>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {needsLoading ? <div className="shimmer" style={{ height: '100px' }} /> : pendingReview.length === 0 ? <EmptyState title="Queue empty" /> : (
                pendingReview.map(need => <NeedReviewCard key={need.id} need={need} selected={selectedNeed?.id === need.id} onSelect={() => { setSelectedNeed(need); setMatches(null); }} />)
              )}
            </div>
          </div>

          <div style={{ flex: 1, backgroundColor: T.white, borderRadius: T.radiusXl, border: `1px solid ${T.border}`, boxShadow: T.shadowLg, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {!selectedNeed ? <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><EmptyState title="Select a request" /></div> : (
              <>
                <div style={{ padding: '32px', flex: 1, overflowY: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                    <div>
                      <h2 style={{ fontFamily: T.fontDisplay, fontSize: '28px', fontWeight: 800, lineHeight: 1.2 }}>{selectedNeed.summary}</h2>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                        <Badge value={selectedNeed.category} />
                        <Badge value={selectedNeed.urgency} />
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', padding: '12px', backgroundColor: T.surface2, borderRadius: T.radiusMd }}>
                      <span style={{ fontSize: '32px', fontWeight: 800, display: 'block' }}>{selectedNeed.priority_score}</span>
                      <span style={{ fontSize: '11px', color: T.textTertiary, textTransform: 'uppercase' }}>Priority</span>
                    </div>
                  </div>

                  <div style={{ backgroundColor: T.surface2, padding: '20px', borderRadius: T.radiusLg, border: `1px solid ${T.border}`, marginBottom: '32px', fontSize: '14px', lineHeight: 1.6 }}>
                    {selectedNeed.raw_report}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
                     <div style={{ padding: '16px', border: `1px solid ${T.border}`, borderRadius: T.radiusLg }}>
                        <p style={{ fontSize: '11px', fontWeight: 700, color: T.textTertiary, textTransform: 'uppercase', marginBottom: '8px' }}>AI Confidence</p>
                        <ProgressBar value={selectedNeed.confidence * 100} color={T.primary} />
                        <p style={{ fontSize: '14px', fontWeight: 800, marginTop: '8px' }}>{Math.round(selectedNeed.confidence * 100)}%</p>
                     </div>
                     <div style={{ padding: '16px', border: `1px solid ${T.border}`, borderRadius: T.radiusLg }}>
                        <p style={{ fontSize: '11px', fontWeight: 700, color: T.textTertiary, textTransform: 'uppercase', marginBottom: '8px' }}>Time Since Report</p>
                        <p style={{ fontSize: '14px', fontWeight: 700 }}>{formatDateTime(selectedNeed.submitted_at)}</p>
                     </div>
                  </div>

                  {matches && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ borderTop: `2px dashed ${T.border}`, paddingTop: '32px' }}>
                      <h3 style={{ fontWeight: 800, fontSize: '18px', marginBottom: '20px' }}>Dispatch Recommendations</h3>
                      <VolunteerMatchList matches={matches} onAssign={handleAssign} />
                    </motion.div>
                  )}
                </div>

                <div style={{ padding: '20px 32px', borderTop: `1px solid ${T.border}`, backgroundColor: T.surface2, display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  {!matches ? (
                    <>
                      <Button variant="ghost" onClick={handleReject} disabled={processing} style={{ color: T.urgent }}>Reject</Button>
                      <Button variant="outline" onClick={handleApprove} disabled={processing}>Approve to Pool</Button>
                      <Button onClick={handleApproveAndMatch} disabled={processing}>Approve & Match</Button>
                    </>
                  ) : (
                    <Button variant="ghost" onClick={() => setMatches(null)}>Cancel Matching</Button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
