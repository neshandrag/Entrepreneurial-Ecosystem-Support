import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FundingProvider } from './context/FundingContext';
import { AlertsProvider } from './context/AlertsContext';
import { NotificationsProvider } from './context/NotificationsContext';
import { ApplicationsProvider } from './context/ApplicationsContext';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import ProfileWizard from './components/profile/ProfileWizard';
import Loading from './components/Loading';
import DashboardLayout from './components/layout/DashboardLayout';
import Overview from './components/dashboard/startup/Overview';
import AdminOverview from './components/dashboard/admin/AdminOverview';
import DataRoom from './components/dashboard/DataRoom';
import Mentors from './components/dashboard/Mentors';
import Calendar from './components/dashboard/Calendar';
import PitchDeck from './components/dashboard/PitchDeck';
import Fundraising from './components/dashboard/Fundraising';
import Settings from './components/dashboard/Settings';
import AdminReview from './components/dashboard/admin/Review';
import AdminEvents from './components/dashboard/admin/Events';
import AdminReports from './components/dashboard/admin/Reports';
import AdminMentors from './components/dashboard/admin/MentorManage';
import AdminInvestors from './components/dashboard/admin/InvestorManage';
import AdminStartups from './components/dashboard/admin/StartupManage';
import AdminDataRoom from './components/dashboard/admin/AdminDataRoom';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <Loading />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <Loading />;
  }

  if (user) {
    if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    if (user.profileComplete) {
      return <Navigate to="/dashboard" replace />;
    } else {
      return <Navigate to="/profile-wizard" replace />;
    }
  }

  return <>{children}</>;
}

function App() {
  console.log('App component rendering');
  return (
    <div className="min-h-screen bg-slate-900">
      <ApplicationsProvider>
        <NotificationsProvider>
          <AuthProvider>
            <FundingProvider>
              <AlertsProvider>
                <Router>
          <Routes>
          {/* Login route */}
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          <Route path="/signup" element={
            <PublicRoute>
              <Signup />
            </PublicRoute>
          } />
          
          {/* Profile Wizard route */}
          <Route 
            path="/profile-wizard" 
            element={
              <ProtectedRoute>
                <ProfileWizard />
              </ProtectedRoute>
            }
          />
          
          {/* Dashboard route */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardContent />} />
            <Route path="data-room" element={<DataRoom />} />
            <Route path="mentors" element={<Mentors />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="pitch-deck" element={<PitchDeck />} />
            <Route path="fundraising" element={<Fundraising />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          
          {/* Admin routes */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<AdminOverview />} />
            <Route path="review" element={<AdminReview />} />
            <Route path="events" element={<AdminEvents />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="mentors" element={<AdminMentors />} />
            <Route path="investors" element={<AdminInvestors />} />
            <Route path="startups" element={<AdminStartups />} />
            <Route path="data-room" element={<AdminDataRoom />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          
          {/* Redirect root to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
                </Router>
              </AlertsProvider>
            </FundingProvider>
          </AuthProvider>
        </NotificationsProvider>
      </ApplicationsProvider>
    </div>
  );
}

// Component to determine which dashboard to show based on user role
function DashboardContent() {
  const { user } = useAuth();

  if (user?.role === 'admin') {
    return <AdminOverview />;
  }

  return <Overview />;
}

export default App;