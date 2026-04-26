import { BrowserRouter, Routes, Route, useLocation, useNavigate, Outlet, Navigate } from 'react-router'
import { AnimatePresence, motion } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
import { useEffect, Suspense, lazy } from 'react'

import { SessionProvider } from './store/sessionStore'
import { useSession } from './hooks/useSession'
import useIsMobile from './hooks/useIsMobile'

import AppShell from './components/layout/AppShell'
import MobileShell from './components/layout/MobileShell'
import LoadingFallback from './components/ui/LoadingFallback'

// Lazy load pages
const LandingPage = lazy(() => import('./pages/public/LandingPage'))
const RoleSelectionPage = lazy(() => import('./pages/public/RoleSelectionPage'))
const CitizenHomePage = lazy(() => import('./pages/citizen/CitizenHomePage'))
const CitizenSubmitPage = lazy(() => import('./pages/citizen/CitizenSubmitPage'))
const CitizenTrackPage = lazy(() => import('./pages/citizen/CitizenTrackPage'))
const VolunteerLoginPage = lazy(() => import('./pages/volunteer/VolunteerLoginPage'))
const VolunteerSignupPage = lazy(() => import('./pages/volunteer/VolunteerSignupPage'))
const VolunteerOnboardingPage = lazy(() => import('./pages/volunteer/VolunteerOnboardingPage'))
const VolunteerDashboardPage = lazy(() => import('./pages/volunteer/VolunteerDashboardPage'))
const VolunteerTaskPage = lazy(() => import('./pages/volunteer/VolunteerTaskPage'))
const VolunteerProfilePage = lazy(() => import('./pages/volunteer/VolunteerProfilePage'))
const CoordinatorLoginPage = lazy(() => import('./pages/coordinator/CoordinatorLoginPage'))
const CoordinatorDashboardPage = lazy(() => import('./pages/coordinator/CoordinatorDashboardPage'))
const CoordinatorReviewPage = lazy(() => import('./pages/coordinator/CoordinatorReviewPage'))
const CoordinatorNeedPage = lazy(() => import('./pages/coordinator/CoordinatorNeedPage'))

// PROTECTED ROUTE GUARD
function RequireAuth({ allowedRole }) {
  const { isAuthenticated, role, user, loading } = useSession()
  const location = useLocation()

  if (loading) return <LoadingFallback />

  if (!isAuthenticated) {
    const loginPath = allowedRole === 'volunteer' ? '/volunteer/login' : '/coordinator/login'
    return <Navigate to={loginPath} state={{ from: location }} replace />
  }

  if (allowedRole && role !== allowedRole) {
    // If they have the wrong role, redirect to their own dashboard
    const dashboardPath = role === 'volunteer' ? '/volunteer/dashboard' : '/coordinator/dashboard'
    return <Navigate to={dashboardPath} replace />
  }

  // SPECIAL CASE: Volunteer onboarding check
  if (role === 'volunteer' && !user?.onboarding_completed && location.pathname !== '/volunteer/onboarding') {
    return <Navigate to="/volunteer/onboarding" replace />
  }

  return <Outlet />
}

// PUBLIC ONLY GUARD (Fixed to allow switching roles)
function PublicOnlyRoute() {
  const { isAuthenticated, role, loading } = useSession()
  const location = useLocation()
  
  if (loading) return <LoadingFallback />

  if (isAuthenticated) {
    const isVolunteerPath = location.pathname.includes('volunteer')
    const isCoordinatorPath = location.pathname.includes('coordinator')
    
    // Only redirect if the authenticated user is visiting the login page for their OWN role.
    if (role === 'volunteer' && isVolunteerPath) {
      return <Navigate to="/volunteer/dashboard" replace />
    }
    if (role === 'coordinator' && isCoordinatorPath) {
      return <Navigate to="/coordinator/dashboard" replace />
    }
  }

  return <Outlet />
}

// STABLE SHELL LAYOUT
function ShellLayout({ roleLabel }) {
  const isMobile = useIsMobile(1024)
  const { role } = useSession()

  const navItems = role === 'coordinator' ? [
    { path: '/coordinator/dashboard', label: 'Command Center', icon: 'Home' },
    { path: '/coordinator/review', label: 'Review Queue', icon: 'ListChecks' },
  ] : [
    { path: '/volunteer/dashboard', label: 'My Tasks', icon: 'ListChecks' },
  ]

  const Shell = isMobile ? MobileShell : AppShell

  return (
    <Shell roleLabel={roleLabel} navItems={navItems}>
      <Suspense fallback={<LoadingFallback />}>
        <Outlet />
      </Suspense>
    </Shell>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Suspense fallback={<LoadingFallback />}><LandingPage /></Suspense>} />
      <Route path="/start" element={<Suspense fallback={<LoadingFallback />}><RoleSelectionPage /></Suspense>} />
      <Route path="/citizen" element={<Suspense fallback={<LoadingFallback />}><CitizenHomePage /></Suspense>} />
      <Route path="/citizen/submit" element={<Suspense fallback={<LoadingFallback />}><CitizenSubmitPage /></Suspense>} />
      <Route path="/citizen/track" element={<Suspense fallback={<LoadingFallback />}><CitizenTrackPage /></Suspense>} />

      <Route element={<PublicOnlyRoute />}>
        <Route path="/volunteer/login" element={<Suspense fallback={<LoadingFallback />}><VolunteerLoginPage /></Suspense>} />
        <Route path="/volunteer/signup" element={<Suspense fallback={<LoadingFallback />}><VolunteerSignupPage /></Suspense>} />
        <Route path="/coordinator/login" element={<Suspense fallback={<LoadingFallback />}><CoordinatorLoginPage /></Suspense>} />
      </Route>

      <Route element={<RequireAuth allowedRole="volunteer" />}>
        <Route path="/volunteer/onboarding" element={<Suspense fallback={<LoadingFallback />}><VolunteerOnboardingPage /></Suspense>} />
        <Route element={<ShellLayout roleLabel="Volunteer" />}>
          <Route path="/volunteer/dashboard" element={<VolunteerDashboardPage />} />
          <Route path="/volunteer/tasks/:id" element={<VolunteerTaskPage />} />
          <Route path="/volunteer/profile" element={<VolunteerProfilePage />} />
        </Route>
      </Route>

      <Route element={<RequireAuth allowedRole="coordinator" />}>
        <Route element={<ShellLayout roleLabel="Ops Coordinator" />}>
          <Route path="/coordinator/dashboard" element={<CoordinatorDashboardPage />} />
          <Route path="/coordinator/review" element={<CoordinatorReviewPage />} />
          <Route path="/coordinator/needs/:id" element={<CoordinatorNeedPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <SessionProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
      <Toaster position="top-center" />
    </SessionProvider>
  )
}
