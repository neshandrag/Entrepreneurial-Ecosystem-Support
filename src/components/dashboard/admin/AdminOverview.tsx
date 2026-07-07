import React, { useState } from 'react';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import { useStartups } from '../../../hooks/useStartups';
import { usersApi } from '../../../services/api';
import { useNotifications } from '../../../context/NotificationsContext';
import { 
  Building2, 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  Bell,
  BarChart3,
  Search,
  X,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';

const AdminOverview: React.FC = () => {
  const { startups, stats, loading: startupsLoading, error: startupsError } = useStartups();
  const [userStats, setUserStats] = useState<any>(null);
  const [loadingUserStats, setLoadingUserStats] = useState(true);
  
  const { 
    getRecentNotifications, 
    getUnreadCount, 
    markAsRead, 
    deleteNotification 
  } = useNotifications();
  
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('all');
  const [selectedStage, setSelectedStage] = useState('all');

  // Fetch user stats
  React.useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const data = await usersApi.getUserStats();
        setUserStats(data);
      } catch (error) {
        console.error('Error fetching user stats:', error);
      } finally {
        setLoadingUserStats(false);
      }
    };
    
    fetchUserStats();
  }, []);

  // Create metrics from real data
  const metrics = React.useMemo(() => {
    if (!stats) {
      return [
        { title: 'Total Startups', value: '0', icon: Building2, color: 'text-blue-400', type: 'total' },
        { title: 'Incubation Startups', value: '0', icon: TrendingUp, color: 'text-green-400', type: 'incubation' },
        { title: 'Innovation Startups', value: '0', icon: Users, color: 'text-cyan-400', type: 'innovation' },
        { title: 'Pending Review', value: '0', icon: AlertTriangle, color: 'text-yellow-400', type: 'pending' },
      ];
    }
    
    return [
      { 
        title: 'Total Startups', 
        value: stats.totalStartups.toString(), 
        icon: Building2, 
        color: 'text-blue-400',
        type: 'total'
      },
      { 
        title: 'Incubation Startups', 
        value: stats.incubationStartups.toString(), 
        icon: TrendingUp, 
        color: 'text-green-400',
        type: 'incubation'
      },
      { 
        title: 'Innovation Startups', 
        value: stats.innovationStartups.toString(), 
        icon: Users, 
        color: 'text-cyan-400',
        type: 'innovation'
      },
      { 
        title: 'Pending Review', 
        value: stats.pendingStartups.toString(), 
        icon: AlertTriangle, 
        color: 'text-yellow-400',
        type: 'pending'
      },
    ];
  }, [stats]);

  const sectors = React.useMemo(() => {
    if (!stats?.sectorDistribution) return [];
    return stats.sectorDistribution.map(item => item._id);
  }, [stats]);
  
  const stages = ['incubation', 'innovation'];

  const handleMetricClick = (metricType: string) => {
    setSelectedMetric(metricType);
    setShowModal(true);
    setSearchTerm('');
    setSelectedSector('all');
    setSelectedStage('all');
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedMetric(null);
  };

  const getFilteredStartups = () => {
    let filtered = startups.map(startup => ({
      id: startup._id,
      name: startup.name,
      sector: startup.sector,
      stage: startup.type,
      status: startup.status === 'active' ? 'Active' : startup.status === 'pending' ? 'Pending' : 'Inactive',
      founded: new Date(startup.submissionDate).toISOString().split('T')[0],
      employees: startup.teamSize || Math.floor(Math.random() * 50) + 5 // Random for demo
    }));

    // Filter by metric type
    if (selectedMetric === 'incubation') {
      filtered = filtered.filter(startup => startup.stage === 'incubation');
    } else if (selectedMetric === 'innovation') {
      filtered = filtered.filter(startup => startup.stage === 'innovation');
    } else if (selectedMetric === 'pending') {
      filtered = filtered.filter(startup => startup.status === 'Pending');
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(startup => 
        startup.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        startup.sector.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sector filter
    if (selectedSector !== 'all') {
      filtered = filtered.filter(startup => startup.sector === selectedSector);
    }

    // Apply stage filter
    if (selectedStage !== 'all') {
      filtered = filtered.filter(startup => startup.stage === selectedStage);
    }

    return filtered;
  };

  const getModalTitle = () => {
    switch (selectedMetric) {
      case 'total': return 'All Startups';
      case 'incubation': return 'Incubation Startups';
      case 'innovation': return 'Innovation Startups';
      case 'pending': return 'Pending Review Startups';
      default: return 'Startups';
    }
  };

  // Get dynamic notifications
  const notifications = getRecentNotifications(5);
  const unreadCount = getUnreadCount();

  // Mock data for TRL distribution
  const trlData = React.useMemo(() => {
    if (!stats?.trlDistribution) {
      return [
        { level: 'TRL 1-3', count: 0, color: 'bg-gradient-to-t from-purple-600 to-purple-500', hexColor: '#8b5cf6', description: 'Basic Research' },
        { level: 'TRL 4-6', count: 0, color: 'bg-gradient-to-t from-cyan-600 to-cyan-500', hexColor: '#06b6d4', description: 'Technology Development' },
        { level: 'TRL 7-9', count: 0, color: 'bg-gradient-to-t from-emerald-600 to-emerald-500', hexColor: '#10b981', description: 'System Demo & Deployment' },
      ];
    }
    
    // Group TRL levels
    const trlCounts = { '1-3': 0, '4-6': 0, '7-9': 0 };
    
    stats.trlDistribution.forEach(item => {
      if (item._id <= 3) trlCounts['1-3'] += item.count;
      else if (item._id <= 6) trlCounts['4-6'] += item.count;
      else trlCounts['7-9'] += item.count;
    });
    
    return [
      { level: 'TRL 1-3', count: trlCounts['1-3'], color: 'bg-gradient-to-t from-purple-600 to-purple-500', hexColor: '#8b5cf6', description: 'Basic Research' },
      { level: 'TRL 4-6', count: trlCounts['4-6'], color: 'bg-gradient-to-t from-cyan-600 to-cyan-500', hexColor: '#06b6d4', description: 'Technology Development' },
      { level: 'TRL 7-9', count: trlCounts['7-9'], color: 'bg-gradient-to-t from-emerald-600 to-emerald-500', hexColor: '#10b981', description: 'System Demo & Deployment' },
    ];
  }, [stats]);

  const maxCount = Math.max(...trlData.map(d => d.count));

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
        <p className="text-gray-400">Overview of platform metrics and recent activity</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <div
            key={index}
            className="cursor-pointer transition-all duration-200 hover:scale-105"
            onClick={() => handleMetricClick(metric.type)}
          >
            <Card hover className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">{metric.title}</p>
                  <p className="text-3xl font-bold text-white">{metric.value}</p>
                </div>
                <div className={`p-3 bg-gray-700 rounded-lg ${metric.color}`}>
                  <metric.icon className="h-6 w-6" />
                </div>
              </div>
            </Card>
          </div>
        ))}
      </div>

      {/* Three Column Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* TRL Distribution Bar Chart - Left */}
        <Card className="p-6 h-full flex flex-col">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            TRL Distribution
          </h2>
          
          {/* Bar Chart Container - Takes remaining space */}
          <div className="relative flex-1 flex flex-col">
            {/* Y-axis Labels */}
            <div className="absolute left-2 top-0 h-64 flex flex-col justify-between py-4">
              {[maxCount, Math.round(maxCount * 0.75), Math.round(maxCount * 0.5), Math.round(maxCount * 0.25), 0].map((value, index) => (
                <div key={index} className="text-xs text-gray-400 text-right w-8">
                  {value}
                </div>
              ))}
            </div>
            
            {/* Chart Area - Flexible height */}
            <div className="flex items-end justify-between gap-2 h-64 pl-12 pr-4 pb-16 border-b border-gray-700">
              {trlData.map((item, index) => (
                <div key={index} className="flex flex-col items-center flex-1">
                  {/* Bar */}
                  <div 
                    className={`w-full max-w-16 ${item.color} rounded-t-lg transition-all duration-500 hover:opacity-80 relative group`}
                    style={{ height: `${(item.count / maxCount) * 200}px` }}
                  >
                    {/* Enhanced Hover tooltip */}
                    <div className="absolute -top-32 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-3 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity z-10 min-w-48 shadow-lg border border-gray-600">
                      <div className="text-center">
                        <div className="font-semibold text-white mb-2">{item.level}</div>
                        <div className="text-2xl font-bold text-cyan-400 mb-1">{item.count}</div>
                        <div className="text-xs text-gray-300 mb-2">startups</div>
                        <div className="text-xs text-gray-400 border-t border-gray-600 pt-2">
                          {item.description}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {((item.count / trlData.reduce((sum, d) => sum + d.count, 0)) * 100).toFixed(1)}% of total
                        </div>
                      </div>
                      {/* Tooltip arrow */}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* X-axis Labels */}
            <div className="flex justify-between gap-2 pl-12 pr-4 mt-3">
              {trlData.map((item, index) => (
                <div key={index} className="flex flex-col items-center flex-1">
                  <span className="text-gray-300 font-medium text-xs">{item.level}</span>
                  <span className="text-gray-400 text-xs mt-1 text-center leading-tight">{item.description}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Startup Categories Pie Chart - Middle */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-white mb-6">Startup Categories</h2>
          <div className="flex flex-col items-center justify-center min-h-80">
            {/* Pie Chart */}
            <div className="relative w-56 h-56 mb-4">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                {(() => {
                  const total = trlData.reduce((sum, d) => sum + d.count, 0);
                  let cumulativePercentage = 0;
                  
                  return trlData.map((item, index) => {
                    const percentage = (item.count / total) * 100;
                    const startAngle = (cumulativePercentage / 100) * 360;
                    const endAngle = ((cumulativePercentage + percentage) / 100) * 360;
                    
                    const radius = 80;
                    const centerX = 100;
                    const centerY = 100;
                    
                    const startAngleRad = (startAngle * Math.PI) / 180;
                    const endAngleRad = (endAngle * Math.PI) / 180;
                    
                    const x1 = centerX + radius * Math.cos(startAngleRad);
                    const y1 = centerY + radius * Math.sin(startAngleRad);
                    const x2 = centerX + radius * Math.cos(endAngleRad);
                    const y2 = centerY + radius * Math.sin(endAngleRad);
                    
                    const largeArcFlag = percentage > 50 ? 1 : 0;
                    
                    const pathData = [
                      `M ${centerX} ${centerY}`,
                      `L ${x1} ${y1}`,
                      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                      'Z'
                    ].join(' ');
                    
                    cumulativePercentage += percentage;
                    
                    return (
                      <path
                        key={index}
                        d={pathData}
                        className="hover:opacity-80 transition-opacity cursor-pointer"
                        fill={item.hexColor}
                      />
                    );
                  });
                })()}
                
                {/* Center circle */}
                <circle cx="100" cy="100" r="40" fill="#1f2937" />
              </svg>
          </div>
          
            {/* Legend */}
            <div className="space-y-3 w-full">
              {trlData.map((item, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: item.hexColor }}
                  ></div>
                  <div className="min-w-0 flex-1">
                    <div className="text-white font-medium text-sm">{item.level}</div>
                    <div className="text-gray-400 text-xs">
                      {item.count} ({((item.count / trlData.reduce((sum, d) => sum + d.count, 0)) * 100).toFixed(1)}%)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Recent Notifications - Right */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              Recent Notifications
              {unreadCount > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {unreadCount}
                </span>
              )}
            </h2>
            {unreadCount > 0 && (
              <button
                onClick={() => notifications.forEach(n => !n.read && markAsRead(n.id))}
                className="text-xs text-cyan-400 hover:text-cyan-300"
              >
                Mark all as read
              </button>
            )}
          </div>
          <div className="space-y-4">
            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-300 mb-2">No notifications</h3>
                <p className="text-gray-400">Notifications will appear here when users sign up or other events occur</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`flex items-start space-x-3 p-3 rounded-lg transition-colors cursor-pointer ${
                    notification.read ? 'bg-gray-700/30' : 'bg-gray-700/50 border border-gray-600'
                  }`}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                >
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    notification.type === 'signup' ? 'bg-emerald-400' :
                    notification.type === 'application' ? 'bg-blue-400' :
                    notification.type === 'review' ? 'bg-yellow-400' :
                    notification.type === 'feedback' ? 'bg-purple-400' :
                    notification.type === 'milestone' ? 'bg-cyan-400' :
                    notification.type === 'info' ? 'bg-gray-400' :
                    'bg-gray-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${notification.read ? 'text-gray-300' : 'text-white font-medium'}`}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                    {notification.userName && (
                      <p className="text-xs text-gray-400 mt-1">
                        User: {notification.userName} ({notification.userEmail})
                      </p>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification.id);
                    }}
                    className="text-gray-400 hover:text-red-400 transition-colors p-1"
                    title="Delete notification"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Startups Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">{getModalTitle()}</h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={closeModal}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search startups..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Sector</label>
                  <select
                    value={selectedSector}
                    onChange={(e) => setSelectedSector(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="all">All Sectors</option>
                    {sectors.map(sector => (
                      <option key={sector} value={sector}>{sector}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Stage</label>
                  <select
                    value={selectedStage}
                    onChange={(e) => setSelectedStage(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="all">All Stages</option>
                    {stages.map(stage => (
                      <option key={stage} value={stage}>{stage}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Results Count */}
              <div className="mb-4">
                <p className="text-gray-400">
                  Showing {getFilteredStartups().length} of {startups.length} startups
                </p>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-300 font-medium">Startup Name</th>
                      <th className="text-left py-3 px-4 text-gray-300 font-medium">Sector</th>
                      <th className="text-left py-3 px-4 text-gray-300 font-medium">Stage</th>
                      <th className="text-left py-3 px-4 text-gray-300 font-medium">Status</th>
                      <th className="text-left py-3 px-4 text-gray-300 font-medium">Founded</th>
                      <th className="text-left py-3 px-4 text-gray-300 font-medium">Employees</th>
                      <th className="text-left py-3 px-4 text-gray-300 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredStartups().map((startup) => (
                      <tr key={startup.id} className="border-b border-gray-800 hover:bg-gray-700/20">
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 bg-cyan-500 rounded-lg flex items-center justify-center">
                              <Building2 className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <span className="text-white font-medium">{startup.name}</span>
                              <div className="text-xs text-gray-400">ID: {startup.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-gray-300">{startup.sector}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            startup.stage === 'incubation' 
                              ? 'bg-green-900/30 text-green-400' 
                              : 'bg-blue-900/30 text-blue-400'
                          }`}>
                            {startup.stage === 'incubation' ? 'Incubation' : 'Innovation'}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            startup.status === 'Active' 
                              ? 'bg-green-900/30 text-green-400' 
                              : 'bg-red-900/30 text-red-400'
                          }`}>
                            {startup.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-gray-300">{startup.founded}</td>
                        <td className="py-4 px-4 text-gray-300">{startup.employees}</td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <button 
                              className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                              title="View details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button 
                              className="p-2 text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/10 rounded-lg transition-colors"
                              title="Edit startup"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button 
                              className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                              title="Delete startup"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {getFilteredStartups().length === 0 && (
                  <div className="text-center py-12">
                    <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-300 mb-2">No startups found</h3>
                    <p className="text-gray-400">Try adjusting your search or filter criteria</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminOverview;