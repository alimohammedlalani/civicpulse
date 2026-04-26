import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, PlayCircle, CheckCircle2, Star, Zap, MapPin, Phone } from 'lucide-react'
import PageTransition from '../../components/layout/PageTransition'
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
import Button from '../../components/ui/Button'

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
      <div style={{ backgroundColor: T.surface2, minHeight: '100%', padding: isMobile ? '16px' : '24px 32px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          {/* Top Operational Status Bar */}
          <div style={{ 
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
            backgroundColor: T.white, padding: '16px 24px', borderRadius: T.radiusXl,
            boxShadow: T.shadowSm, border: `1px solid ${T.border}`, marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ 
                width: '48px', height: '48px', borderRadius: '50%', backgroundColor: T.primary,
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.white,
                fontSize: '18px', fontWeight: 800, boxShadow: T.shadowSm
              }}>
                {user?.name?.charAt(0)}
              </div>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: T.textPrimary }}>{user?.name}</h2>
                <p style={{ fontSize: '12px', color: T.textTertiary, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={12} /> {user?.location || 'Location set'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ textAlign: 'right', display: isMobile ? 'none' : 'block' }}>
                <p style={{ fontSize: '11px', fontWeight: 700, color: T.textTertiary, textTransform: 'uppercase' }}>Status</p>
                <p style={{ fontSize: '13px', fontWeight: 600, color: isAvailable ? T.success : T.textSecondary }}>
                  {isAvailable ? 'Active & Receiving' : 'Currently Away'}
                </p>
              </div>
              <button 
                onClick={() => setIsAvailable(!isAvailable)}
                style={{
                  width: '50px', height: '26px', borderRadius: '100px', position: 'relative',
                  backgroundColor: isAvailable ? T.success : T.border,
                  border: 'none', cursor: 'pointer', transition: 'all 0.3s'
                }}
              >
                <div style={{
                  width: '20px', height: '20px', borderRadius: '50%', backgroundColor: T.white,
                  position: 'absolute', top: '3px', left: isAvailable ? '27px' : '3px',
                  transition: 'all 0.3s', boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }} />
              </button>
            </div>
          </div>

          {/* Stats Overview */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: isMobile ? '12px' : '20px', marginBottom: '32px' }}>
            <OperationalStat value={pending.length} label="Pending" icon={Zap} color={T.primary} active={activeTab === 'pending'} onClick={() => setActiveTab('pending')} />
            <OperationalStat value={active.length} label="Active" icon={PlayCircle} color={T.warning} active={activeTab === 'active'} onClick={() => setActiveTab('active')} />
            <OperationalStat value={completed.length} label="History" icon={CheckCircle2} color={T.success} active={activeTab === 'completed'} onClick={() => setActiveTab('completed')} />
          </div>

          <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
            {/* Task Inbox */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: T.textPrimary }}>
                  {activeTab === 'pending' ? 'Recommended for you' : activeTab === 'active' ? 'Tasks in progress' : 'Completed missions'}
                </h3>
                <span style={{ fontSize: '13px', color: T.textTertiary, fontWeight: 500 }}>{currentList.length} total</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {loading ? (
                  Array(3).fill(0).map((_, i) => <div key={i} style={{ height: '140px', backgroundColor: T.white, borderRadius: T.radiusLg, border: `1px solid ${T.border}` }} className="shimmer" />)
                ) : currentList.length === 0 ? (
                  <EmptyState 
                    title="All clear here" 
                    description={activeTab === 'pending' ? "We'll notify you as soon as someone needs your specific skills nearby." : "You don't have any tasks in this category."} 
                  />
                ) : (
                  <AnimatePresence mode="popLayout">
                    {currentList.map(task => (
                      <motion.div key={task.id} layout initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}>
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

            {/* Desktop Quick Profile Side Panel */}
            {!isMobile && (
              <div style={{ width: '320px', flexShrink: 0, position: 'sticky', top: '100px' }}>
                <div style={{ backgroundColor: T.white, borderRadius: T.radiusXl, border: `1px solid ${T.border}`, padding: '24px', boxShadow: T.shadowSm }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: T.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '20px' }}>Volunteer Profile</h4>
                  
                  <div style={{ marginBottom: '24px' }}>
                    <p style={{ fontSize: '12px', color: T.textTertiary, marginBottom: '8px' }}>Your Expertise</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {user?.skills?.map(skill => (
                        <span key={skill} style={{ fontSize: '11px', fontWeight: 700, backgroundColor: T.surface2, color: T.textSecondary, padding: '4px 10px', borderRadius: T.radiusFull, border: `1px solid ${T.border}` }}>
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', paddingTop: '20px', borderTop: `1px solid ${T.border}` }}>
                    <div>
                      <p style={{ fontSize: '11px', color: T.textTertiary }}>Rating</p>
                      <p style={{ fontSize: '18px', fontWeight: 800, color: T.textPrimary, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Star size={16} fill="#FACC15" color="#FACC15" /> {user?.rating || '5.0'}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: '11px', color: T.textTertiary }}>Experience</p>
                      <p style={{ fontSize: '15px', fontWeight: 700, color: T.textPrimary }}>{user?.experience_level || 'Active'}</p>
                    </div>
                  </div>

                  <Button 
                    fullWidth 
                    variant="ghost" 
                    size="sm" 
                    style={{ marginTop: '24px' }}
                    onClick={() => navigate('/volunteer/profile')}
                  >
                    Edit Operational Profile
                  </Button>
                </div>
              </div>
            )}
          </div>
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

function OperationalStat({ value, label, icon: Icon, color, active, onClick }) {
  return (
    <button 
      onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
        padding: '16px', borderRadius: T.radiusLg, backgroundColor: T.white,
        border: `2px solid ${active ? color : T.border}`, cursor: 'pointer',
        transition: 'all 0.2s', boxShadow: active ? T.shadowMd : T.shadowSm,
        textAlign: 'center'
      }}
    >
      <div style={{ color: active ? color : T.textTertiary, transition: '0.2s' }}>
        <Icon size={24} />
      </div>
      <div>
        <p style={{ fontSize: '20px', fontWeight: 800, color: T.textPrimary, lineHeight: 1 }}>{value}</p>
        <p style={{ fontSize: '11px', fontWeight: 700, color: T.textSecondary, textTransform: 'uppercase', marginTop: '4px' }}>{label}</p>
      </div>
    </button>
  )
}
