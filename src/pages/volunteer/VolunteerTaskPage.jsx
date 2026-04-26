import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import PageTransition from '../../components/layout/PageTransition'
import TaskDetailPanel from '../../components/volunteer/TaskDetailPanel'
import ResolutionForm from '../../components/volunteer/ResolutionForm'
import Drawer from '../../components/ui/Drawer'
import Button from '../../components/ui/Button'
import { useSession } from '../../hooks/useSession'
import { useVolunteerTasks } from '../../hooks/useVolunteerTasks'
import { acceptTask, declineTask, submitResolution } from '../../adapters/volunteerAdapter'
import { showSuccess, showError } from '../../components/ui/Toast'
import { T } from '../../styles/tokens'

export default function VolunteerTaskPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useSession()
  const [task, setTask] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showResolution, setShowResolution] = useState(searchParams.get('resolve') === 'true')

  useEffect(() => {
    async function loadTask() {
      try {
        setLoading(true)
        const data = await import('../../adapters/volunteerAdapter').then(m => m.fetchTaskById(id))
        // We need to wrap it in the expected match-like structure if it's just the need
        // In this app, the 'task' is often the 'need' document itself once assigned
        if (data) {
          setTask({
            ...data,
            need: data // For compatibility with TaskDetailPanel which expects task.need
          })
        }
      } catch (err) {
        console.error('Failed to load task:', err)
      } finally {
        setLoading(false)
      }
    }
    loadTask()
  }, [id])

  // Handle errors / missing tasks
  if (loading) {
    return (
      <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #E5E7EB', borderTopColor: T.primary, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: T.textSecondary, fontSize: '14px' }}>Loading task details...</p>
      </div>
    )
  }

  if (!task) {
    return (
      <div style={{ padding: '80px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: `${T.urgent}10`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AlertTriangle size={32} color={T.urgent} />
        </div>
        <div>
          <h2 style={{ fontWeight: 800, fontSize: '20px', marginBottom: '8px' }}>Task Not Found</h2>
          <p style={{ color: T.textSecondary, fontSize: '14px', maxWidth: '300px' }}>This task may have been reassigned, resolved, or removed from the system.</p>
        </div>
        <Button onClick={() => navigate('/volunteer/dashboard')}>Return to Dashboard</Button>
      </div>
    )
  }

  const handleAccept = async (matchId) => {
    try {
      await acceptTask(matchId, user.uid)
      showSuccess('Task accepted!')
    } catch (err) { showError('Failed to accept task') }
  }

  const handleDecline = async (matchId) => {
    try {
      await declineTask(matchId, user.uid)
      showSuccess('Task declined')
      navigate('/volunteer/dashboard')
    } catch (err) { showError('Failed to decline task') }
  }

  const handleResolveSubmit = async (data) => {
    try {
      await submitResolution(task.id, task.need_id, data)
      showSuccess('Task resolved successfully!')
      navigate('/volunteer/dashboard')
    } catch (err) { showError('Failed to submit resolution') }
  }

  return (
    <PageTransition>
      <div style={{ backgroundColor: T.surface, minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ position: 'sticky', top: 0, zIndex: 40, backgroundColor: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${T.border}`, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={() => navigate('/volunteer/dashboard')}
            style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ fontFamily: T.fontDisplay, fontWeight: 800, fontSize: '18px' }}>Operational Context</h1>
        </div>

        <div style={{ flex: 1, maxWidth: '600px', margin: '0 auto', width: '100%', padding: '24px', paddingBottom: '100px' }}>
          <TaskDetailPanel 
            task={task}
            onAccept={handleAccept}
            onDecline={handleDecline}
            onResolve={() => setShowResolution(true)}
          />
        </div>

        <Drawer 
          isOpen={showResolution} 
          onClose={() => setShowResolution(false)} 
          title="Submit Field Report"
        >
          <ResolutionForm 
            task={task} 
            onSubmit={handleResolveSubmit} 
            onCancel={() => setShowResolution(false)} 
          />
        </Drawer>
      </div>
    </PageTransition>
  )
}
