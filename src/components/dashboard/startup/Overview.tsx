import React from 'react';
import Card from '../../ui/Card';
import { useStartups } from '../../../hooks/useStartups';
import { 
  TrendingUp, 
  Users, 
  Calendar, 
  FileText, 
  ArrowRight,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  X
} from 'lucide-react';
import { useInvestors } from '../../../hooks/useInvestors';
import { useFunding } from '../../../context/FundingContext';
import { useAlerts } from '../../../context/AlertsContext';

const Overview: React.FC = () => {
  const { startups: userStartups, stats, loading: startupsLoading, error: startupsError } = useStartups();
  const { investors, loading: investorsLoading, error: investorsError } = useInvestors();
  const { fundingStages } = useFunding();
  const { getUpcomingAlerts, markAsCompleted, deleteAlert } = useAlerts();

  const alerts = getUpcomingAlerts(30); // Get alerts for next 30 days

  const handleMarkComplete = (alertId: string) => {
    markAsCompleted(alertId);
  };

  const handleDeleteAlert = (alertId: string) => {
    deleteAlert(alertId);
  };


  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-900/30 text-red-400 border-red-500/50';
      case 'high':
        return 'bg-orange-900/30 text-orange-400 border-orange-500/50';
      case 'medium':
        return 'bg-blue-900/30 text-blue-400 border-blue-500/50';
      case 'low':
        return 'bg-blue-900/30 text-blue-400 border-blue-500/50';
      default:
        return 'bg-gray-900/30 text-gray-400 border-gray-500/50';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'meeting':
        return <Calendar className="h-4 w-4" />;
      case 'deadline':
        return <AlertCircle className="h-4 w-4" />;
      case 'session':
        return <Users className="h-4 w-4" />;
      case 'milestone':
        return <TrendingUp className="h-4 w-4" />;
      case 'funding':
        return <FileText className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  // Use funding stages from context instead of hardcoded milestones
  const milestones = fundingStages.map(stage => ({
    stage: stage.name,
    status: stage.status,
    date: stage.date || null,
    progress: stage.progress
  }));

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-emerald-400" />;
      case 'current':
        return <Clock className="h-5 w-5 text-blue-400" />;
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-gray-600"></div>;
    }
  };


  const getProgressColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-400';
      case 'current':
        return 'bg-blue-400';
      default:
        return 'bg-gray-600';
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Startup Dashboard</h1>
        <p className="text-gray-400">Track your progress and manage your startup journey</p>
        
        {/* Show startup info if available */}
        {userStartups.length > 0 && (
          <div className="mt-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
            <div className="flex items-center space-x-3">
              <Building2 className="h-6 w-6 text-cyan-400" />
              <div>
                <h3 className="text-lg font-semibold text-white">{userStartups[0].name}</h3>
                <p className="text-sm text-gray-400">
                  {userStartups[0].sector} • {userStartups[0].type} • 
                  Status: <span className={`capitalize ${
                    userStartups[0].applicationStatus === 'approved' ? 'text-green-400' :
                    userStartups[0].applicationStatus === 'rejected' ? 'text-red-400' :
                    'text-yellow-400'
                  }`}>
                    {userStartups[0].applicationStatus}
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Upcoming Alerts */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 text-blue-400" />
            Upcoming Alerts
          </h2>
          <div className="text-sm text-gray-400">
            {alerts.length} upcoming alerts
          </div>
        </div>
        
        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">No upcoming alerts</h3>
            <p className="text-gray-400">Alerts will appear here when admin actions occur</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {alerts.map((alert) => (
              <div key={alert.id} className="bg-gray-700/50 rounded-lg p-4 border border-gray-600 hover:border-gray-500 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getTypeIcon(alert.type)}
                    <h3 className="text-white font-medium">{alert.title}</h3>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleMarkComplete(alert.id)}
                      className="p-1 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10 rounded transition-colors"
                      title="Mark as completed"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteAlert(alert.id)}
                      className="p-1 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded transition-colors"
                      title="Delete alert"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                {alert.description && (
                  <p className="text-sm text-gray-300 mb-2">{alert.description}</p>
                )}
                
                <p className="text-sm text-gray-400 mb-3">{alert.date}</p>
                
                <div className="flex items-center justify-between">
                  <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(alert.priority)}`}>
                    {alert.priority}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    alert.type === 'meeting' ? 'bg-blue-900/30 text-blue-400' :
                    alert.type === 'deadline' ? 'bg-red-900/30 text-red-400' :
                    alert.type === 'session' ? 'bg-emerald-900/30 text-emerald-400' :
                    alert.type === 'milestone' ? 'bg-purple-900/30 text-purple-400' :
                    alert.type === 'funding' ? 'bg-cyan-900/30 text-cyan-400' :
                    'bg-gray-900/30 text-gray-400'
                  }`}>
                    {alert.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Milestones Timeline and Investor Suggestions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Milestones Timeline */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-cyan-400" />
              Journey
            </h2>
            <div className="text-sm text-gray-400">
              {milestones.filter(m => m.status === 'completed').length}/{milestones.length}
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-700"></div>
            
            <div className="space-y-4">
              {milestones.map((milestone, index) => (
                <div key={index} className="relative flex items-center space-x-4">
                  <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                    milestone.status === 'completed' 
                      ? 'bg-emerald-400 border-emerald-400' 
                      : milestone.status === 'current'
                      ? 'bg-blue-400 border-blue-400'
                      : 'bg-gray-800 border-gray-600'
                  }`}>
                    {getStatusIcon(milestone.status)}
                  </div>

                  <div className="flex-1 flex items-center justify-between">
                    <div>
                      <h3 className={`font-medium ${
                        milestone.status === 'completed' ? 'text-emerald-400' :
                        milestone.status === 'current' ? 'text-blue-400' :
                        'text-gray-400'
                      }`}>
                        {milestone.stage}
                      </h3>
                      {milestone.date && (
                        <p className="text-xs text-gray-400">{milestone.date}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="w-16 bg-gray-700 rounded-full h-1">
                        <div 
                          className={`h-1 rounded-full ${getProgressColor(milestone.status)}`}
                          style={{ width: `${milestone.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-400 w-8">{milestone.progress}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Investor Suggestions */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-white mb-6">Available Investors</h2>
          
          {investorsError && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-500/50 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <span className="text-red-300 text-sm">{investorsError}</span>
              </div>
            </div>
          )}

          {investorsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center space-x-3">
                <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
                <span className="text-gray-400">Loading investors...</span>
              </div>
            </div>
          ) : investors.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-300 mb-2">No investors available</h3>
              <p className="text-gray-400">Investors will appear here once they are added by administrators</p>
            </div>
          ) : (
            <div className="space-y-4">
              {investors.slice(0, 3).map((investor) => (
                <div key={investor.id} className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="h-10 w-10 bg-cyan-500 rounded-full flex items-center justify-center text-white font-medium">
                      {investor.profilePicture}
                    </div>
                    <div>
                      <h3 className="text-white font-medium">{investor.name}</h3>
                      <p className="text-sm text-gray-400">{investor.firm}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-300 mb-2">{investor.backgroundSummary}</p>
                  <p className="text-xs text-gray-400 mb-4">Investment Range: {investor.investmentRange}</p>
                  <button className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors">
                    Request Intro
                  </button>
                </div>
              ))}
              {investors.length > 3 && (
                <div className="text-center">
                  <button className="text-cyan-400 hover:text-cyan-300 text-sm font-medium">
                    View All Investors ({investors.length - 3} more)
                  </button>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Startup Statistics */}
      {stats && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-white mb-6">Platform Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">{stats.totalStartups}</div>
              <div className="text-sm text-gray-400">Total Startups</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{stats.activeStartups}</div>
              <div className="text-sm text-gray-400">Active</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{stats.innovationStartups}</div>
              <div className="text-sm text-gray-400">Innovation</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{stats.incubationStartups}</div>
              <div className="text-sm text-gray-400">Incubation</div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Overview;