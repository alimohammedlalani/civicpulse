import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, PlayCircle, CheckCircle2, Star, Zap, MapPin, Phone } from 'lucide-react'
import PageTransition from '../../components/layout/PageTransition'
import Tabs from '../../components/ui/Tabs'
import StatCard from '../../components/ui/StatCard'
import EmptyState from '../../components/ui/EmptyState'
import TaskCard from '../../components/volunteer/TaskCard'
import TaskDetailPanel from '../../components/volunteer/TaskDetailPanel'
import ResolutionForm from '../../components/volunteer/ResolutionForm'
import Modal from '../../components/ui/Modal'
import { useSession } from '../../hooks/useSession'
import { useVolunteerTasks } from '../../hooks/useVolunteerTasks'
import { acceptTask, declineTask, submitResolution } from '../../adapters/volunteerAdapter'
import { showSuccess, showError } from '../../components/ui/Toast'
import { T } from '../../styles/tokens'
import useIsMobile from '../../hooks/useIsMobile'

export default function VolunteerDashboardPage() {
  const { user } = useSession()
  const navigate = useNavigate()
  const isMobile = useIsMobile(1024)
  const { pending, active, completed, loading } = useVolunteerTasks(user?.uid)
  
  const [activeTab, setActiveTab] = useState('pending')
  const [selectedTask, setSelectedTask] = useState(null)
  const [showResolution, setShowResolution] = useState(false)
  const [isAvailable, setIsAvailable] = useState(user?.availability ?? true)

  const handleAccept = async (matchId) => {
    try {
      await acceptTask(matchId, user?.uid)
      showSuccess('Task accepted!')
      setSelectedTask(null)
      setActiveTab('active')
    } catch (err) {
      showError('Failed to accept task')
    }
  }

  const handleDecline = async (matchId) => {
    try {
      await declineTask(matchId, user?.uid)
      showSuccess('Task declined')
      setSelectedTask(null)
    } catch (err) {
      showError('Failed to decline task')
    }
  }

  const handleResolveSubmit = async (data) => {
    try {
      if (!selectedTask) return
      await submitResolution(selectedTask.id, selectedTask.need_id, data)
      showSuccess('Task resolved successfully!')
      setShowResolution(false)
      setSelectedTask(null)
      setActiveTab('completed')
    } catch (err) {
      showError('Failed to submit resolution')
    }
  }

  const openTaskDetail = (task) => {
    if (isMobile) {
      navigate(`/volunteer/tasks/${task.id}`)
    } else {
      setSelectedTask(task)
    }
  }

  const tabs = [
    { id: 'pending', label: 'Recommended', icon: Zap, count: pending.length },
    { id: 'active', label: 'Active Tasks', icon: PlayCircle, count: active.length },
    { id: 'completed', label: 'History', icon: CheckCircle2 },
  ]

  const currentList = activeTab === 'pending' ? pending : activeTab === 'active' ? active : completed

  return (
    <PageTransition>
      <div style={{ padding: isMobile ? '16px' : '32px', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Profile Summary Header */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '20px', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: isMobile ? '56px' : '64px', height: isMobile ? '56px' : '64px', borderRadius: '50%', backgroundColor: T.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.white, fontSize: '24px', fontWeight: 800, boxShadow: T.shadowMd }}>
              {user?.name?.charAt(0)}
            </div>
            <div>
              <h1 style={{ fontFamily: T.fontDisplay, fontSize: isMobile ? '24px' : '28px', fontWeight: 800, color: T.textPrimary, marginBottom: '4px' }}>
                {user?.name || 'Volunteer'}
              </h1>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {user?.skills?.slice(0, 3).map(skill => (
                  <span key={skill} style={{ fontSize: '11px', fontWeight: 700, backgroundColor: T.surface3, color: T.textSecondary, padding: '2px 8px', borderRadius: T.radiusFull, textTransform: 'uppercase' }}>{skill}</span>
                ))}
                <span style={{ fontSize: '11px', fontWeight: 700, backgroundColor: `${T.success}15`, color: T.success, padding: '2px 8px', borderRadius: T.radiusFull, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Star size={10} fill="currentColor" /> {user?.rating || '5.0'}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: T.white, padding: '6px', borderRadius: T.radiusFull, border: `1px solid ${T.border}`, boxShadow: T.shadowSm }}>
            <button 
              onClick={() => setIsAvailable(true)}
              style={{ padding: '8px 20px', borderRadius: T.radiusFull, fontSize: '13px', fontWeight: 700, cursor: 'pointer', border: 'none', backgroundColor: isAvailable ? T.success : 'transparent', color: isAvailable ? T.white : T.textSecondary, transition: '0.2s' }}
            >
              Available
            </button>
            <button 
              onClick={() => setIsAvailable(false)}
              style={{ padding: '8px 20px', borderRadius: T.radiusFull, fontSize: '13px', fontWeight: 700, cursor: 'pointer', border: 'none', backgroundColor: !isAvailable ? T.surface3 : 'transparent', color: !isAvailable ? T.textPrimary : T.textSecondary, transition: '0.2s' }}
            >
              Away
            </button>
          </div>
        </div>

        {/* Stats Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          <StatCard value={pending.length} label="New Matches" icon={Zap} color={T.primary} />
          <StatCard value={active.length} label="In Progress" icon={PlayCircle} color={T.primary} />
          <StatCard value={completed.length} label="Resolved" icon={CheckCircle2} color={T.success} />
        </div>

        {/* Task Inbox Section */}
        <div style={{ display: 'flex', gap: '32px', height: isMobile ? 'auto' : 'calc(100vh - 380px)', minHeight: '500px' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <div style={{ marginBottom: '24px' }}>
              <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
            </div>

            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '12px', paddingBottom: '40px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {loading ? (
                Array(3).fill(0).map((_, i) => <div key={i} style={{ height: '140px', backgroundColor: T.surface2, borderRadius: T.radiusLg }} className="shimmer" />)
              ) : currentList.length === 0 ? (
                <EmptyState title={`No tasks in ${activeTab}`} description="Matches will appear here as soon as someone needs help in your area." />
              ) : (
                <AnimatePresence mode="popLayout">
                  {currentList.map(task => (
                    <motion.div key={task.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
                      <TaskCard 
                        task={task} 
                        active={selectedTask?.id === task.id}
                        onAccept={handleAccept}
                        onDecline={handleDecline}
                        onResolve={() => { setSelectedTask(task); setShowResolution(true) }}
                        onView={openTaskDetail}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>

          {/* Desktop Detail Panel */}
          {!isMobile && (
            <AnimatePresence>
              {selectedTask && !showResolution && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                  style={{ width: '450px', flexShrink: 0, backgroundColor: T.white, borderRadius: T.radiusXl, border: `1px solid ${T.border}`, boxShadow: T.shadowLg, overflow: 'hidden' }}
                >
                  <TaskDetailPanel 
                    task={selectedTask}
                    onAccept={handleAccept}
                    onDecline={handleDecline}
                    onResolve={() => setShowResolution(true)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>

        {showResolution && (
          <Modal isOpen={showResolution} onClose={() => setShowResolution(false)} title="Submit Field Report">
            <ResolutionForm 
              task={selectedTask} 
              onSubmit={handleResolveSubmit} 
              onCancel={() => setShowResolution(false)} 
            />
          </Modal>
        )}
      </div>
    </PageTransition>
  )
}
