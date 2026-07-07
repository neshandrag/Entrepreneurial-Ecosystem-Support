import React, { useState } from 'react';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import { useStartups } from '../../../hooks/useStartups';
import { Search, Filter, Eye, Check, X, Calendar, Building2, User, Mail, AlertCircle, CheckCircle, Loader2, Phone } from 'lucide-react';
import { useAlerts } from '../../../context/AlertsContext';
import { useNotifications } from '../../../context/NotificationsContext';

const Review: React.FC = () => {
  const { createApplicationApprovalAlert, createReminderAlert } = useAlerts();
  const { createApplicationNotification, createReviewNotification } = useNotifications();
  const { 
    startups, 
    loading, 
    error, 
    updateStartupStatus, 
    refreshStartups 
  } = useStartups({ applicationStatus: 'submitted,under_review' });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending');
  const [selectedStartup, setSelectedStartup] = useState<any>(null);
  const [processingStartupId, setProcessingStartupId] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const [message, setMessage] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [callDate, setCallDate] = useState('');
  const [callTime, setCallTime] = useState('');

  const filteredStartups = startups.filter((startup: any) => {
    const matchesSearch = startup.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         startup.founder.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         startup.sector.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'pending' && (startup.applicationStatus === 'submitted' || startup.applicationStatus === 'under_review')) ||
                         (filterStatus === 'approved' && startup.applicationStatus === 'approved') ||
                         (filterStatus === 'rejected' && startup.applicationStatus === 'rejected');
    return matchesSearch && matchesFilter;
  });

  const handleApprove = async (startupId: string) => {
    setProcessingStartupId(startupId);
    try {
      // Find the startup to get its details
      const startup = startups.find((s: any) => s._id === startupId);
      
      // Update application status using API
      await updateStartupStatus(startupId, 'active', 'approved');
      
      // Create automatic alert for the approved startup
      if (startup) {
        createApplicationApprovalAlert(startup.name, 'Admin');
        
        // Create admin notification for application approval
        createApplicationNotification(
          startup.name,
          startup.founder,
          startup.sector
        );
      }
      
      setMessage('Startup application approved successfully!');
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
      
      // Close detail view if open
      if (selectedStartup?._id === startupId) {
        setSelectedStartup(null);
      }
    } catch (error) {
      setMessage('Failed to approve application. Please try again.');
      setShowErrorMessage(true);
      setTimeout(() => setShowErrorMessage(false), 3000);
    } finally {
      setProcessingStartupId(null);
    }
  };

  const handleReject = async (startupId: string) => {
    if (!window.confirm('Are you sure you want to reject this application?')) {
      return;
    }
    
    setProcessingStartupId(startupId);
    try {
      // Update application status using API
      await updateStartupStatus(startupId, 'dropout', 'rejected');
      
      setMessage('Startup application rejected.');
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
      
      // Close detail view if open
      if (selectedStartup?._id === startupId) {
        setSelectedStartup(null);
      }
    } catch (error) {
      setMessage('Failed to reject application. Please try again.');
      setShowErrorMessage(true);
      setTimeout(() => setShowErrorMessage(false), 3000);
    } finally {
      setProcessingStartupId(null);
    }
  };

  const handleRequestMoreInfo = async (startupId: string) => {
    setProcessingStartupId(startupId);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMessage('Information request sent to startup.');
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      setMessage('Failed to send information request. Please try again.');
      setShowErrorMessage(true);
      setTimeout(() => setShowErrorMessage(false), 3000);
    } finally {
      setProcessingStartupId(null);
    }
  };

  const handleSendEmail = async () => {
    if (!emailSubject.trim() || !emailMessage.trim()) {
      setMessage('Please fill in both subject and message.');
      setShowErrorMessage(true);
      setTimeout(() => setShowErrorMessage(false), 3000);
      return;
    }

    setProcessingStartupId(selectedStartup?.id || 'email');
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setMessage(`Email sent to ${selectedStartup?.email}`);
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
      
      setShowEmailModal(false);
      setEmailSubject('');
      setEmailMessage('');
    } catch (error) {
      setMessage('Failed to send email. Please try again.');
      setShowErrorMessage(true);
      setTimeout(() => setShowErrorMessage(false), 3000);
    } finally {
      setProcessingStartupId(null);
    }
  };

  const handleScheduleCall = async () => {
    if (!callDate || !callTime) {
      setMessage('Please select both date and time.');
      setShowErrorMessage(true);
      setTimeout(() => setShowErrorMessage(false), 3000);
      return;
    }

    setProcessingStartupId(selectedStartup?.id || 'call');
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setMessage(`Call scheduled with ${selectedStartup?.name} for ${callDate} at ${callTime}`);
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
      
      setShowCallModal(false);
      setCallDate('');
      setCallTime('');
    } catch (error) {
      setMessage('Failed to schedule call. Please try again.');
      setShowErrorMessage(true);
      setTimeout(() => setShowErrorMessage(false), 3000);
    } finally {
      setProcessingStartupId(null);
    }
  };

  const handleViewDocument = (docName: string) => {
    // Simulate document viewing
    setMessage(`Opening ${docName}...`);
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 2000);
  };

  const getTRLColor = (level: number) => {
    if (level <= 3) return 'bg-red-500';
    if (level <= 6) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getTypeColor = (type: string) => {
    return type === 'incubation' ? 'bg-blue-900/30 text-blue-400' : 'bg-purple-900/30 text-purple-400';
  };

  const getStatusColor = (applicationStatus: string) => {
    switch (applicationStatus) {
      case 'approved':
        return 'bg-green-900/30 text-green-400';
      case 'rejected':
        return 'bg-red-900/30 text-red-400';
      case 'submitted':
      case 'under_review':
        return 'bg-yellow-900/30 text-yellow-400';
      default:
        return 'bg-gray-900/30 text-gray-400';
    }
  };

  const getStatusIcon = (applicationStatus: string) => {
    switch (applicationStatus) {
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <X className="h-4 w-4" />;
      case 'submitted':
      case 'under_review':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (selectedStartup) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => setSelectedStartup(null)}>
            ← Back to Review List
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">Startup Profile Review</h1>
            <p className="text-gray-400 mt-1">{selectedStartup.name}</p>
          </div>
        </div>

        <Card className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Startup Name</label>
                    <p className="text-white font-medium">{selectedStartup.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Founder</label>
                    <p className="text-white font-medium">{selectedStartup.founder}</p>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Sector</label>
                    <p className="text-white font-medium">{selectedStartup.sector}</p>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Type</label>
                    <span className={`text-xs px-2 py-1 rounded-full capitalize ${getTypeColor(selectedStartup.type)}`}>
                      {selectedStartup.type}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Status</label>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(selectedStartup.applicationStatus)}
                      <span className={`text-xs px-2 py-1 rounded-full capitalize ${getStatusColor(selectedStartup.applicationStatus)}`}>
                        {selectedStartup.applicationStatus}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">TRL Level</label>
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${getTRLColor(selectedStartup.trlLevel)}`} />
                      <span className="text-white font-medium">TRL {selectedStartup.trlLevel}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Email</label>
                    <p className="text-white font-medium">{selectedStartup.email}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Documents</h3>
                <div className="space-y-3">
                  {[
                    { name: 'Business Plan.pdf', size: '2.5 MB', status: 'verified' },
                    { name: 'Aadhaar Card.pdf', size: '1.2 MB', status: 'verified' },
                    { name: 'Incorporation Certificate.pdf', size: '890 KB', status: 'pending' },
                    { name: 'Financial Projections.xlsx', size: '1.8 MB', status: 'verified' },
                  ].map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-500/10 rounded">
                          <Building2 className="h-4 w-4 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{doc.name}</p>
                          <p className="text-sm text-gray-400">{doc.size}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          doc.status === 'verified' 
                            ? 'bg-green-900/30 text-green-400' 
                            : 'bg-yellow-900/30 text-yellow-400'
                        }`}>
                          {doc.status}
                        </span>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewDocument(doc.name)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions Sidebar */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Review Actions</h3>
                <div className="space-y-3">
                  <Button 
                    variant="primary" 
                    className={`w-full flex items-center space-x-2 ${
                      selectedStartup.applicationStatus === 'approved' 
                        ? 'bg-green-600 cursor-not-allowed' 
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                    onClick={() => handleApprove(selectedStartup._id)}
                    disabled={processingStartupId === selectedStartup._id || selectedStartup.applicationStatus === 'approved'}
                  >
                    {processingStartupId === selectedStartup._id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    <span>
                      {selectedStartup.applicationStatus === 'approved' ? 'Approved' : 'Approve Application'}
                    </span>
                  </Button>
                  
                  <Button 
                    variant="danger" 
                    className={`w-full flex items-center space-x-2 ${
                      selectedStartup.applicationStatus === 'rejected' 
                        ? 'bg-red-600 cursor-not-allowed' 
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                    onClick={() => handleReject(selectedStartup._id)}
                    disabled={processingStartupId === selectedStartup._id || selectedStartup.applicationStatus === 'rejected'}
                  >
                    {processingStartupId === selectedStartup._id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                    <span>
                      {selectedStartup.applicationStatus === 'rejected' ? 'Rejected' : 'Reject Application'}
                    </span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => handleRequestMoreInfo(selectedStartup._id)}
                    disabled={processingStartupId === selectedStartup._id}
                  >
                    {processingStartupId === selectedStartup._id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Request More Info'
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Contact</h3>
                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full flex items-center space-x-2"
                    onClick={() => setShowEmailModal(true)}
                    disabled={processingStartupId === selectedStartup._id}
                  >
                    <Mail className="h-4 w-4" />
                    <span>Send Email</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setShowCallModal(true)}
                    disabled={processingStartupId === selectedStartup._id}
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Schedule Call
                  </Button>
                </div>
              </div>

              <div className="bg-gray-700/30 rounded-lg p-4">
                <h4 className="text-white font-medium mb-2">Submission Timeline</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Submitted:</span>
                    <span className="text-white">{new Date(selectedStartup.submissionDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Days pending:</span>
                    <span className="text-yellow-400">
                      {Math.floor((new Date().getTime() - new Date(selectedStartup.submissionDate).getTime()) / (1000 * 60 * 60 * 24))} days
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Application Review</h1>
        <p className="text-gray-400 mt-1">Review and approve startup applications</p>
        
        {/* Status Counters */}
        <div className="flex space-x-6 mt-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="text-sm text-gray-400">
              Pending: {startups.filter((s: any) => s.applicationStatus === 'submitted' || s.applicationStatus === 'under_review').length}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-sm text-gray-400">
              Approved: {startups.filter((s: any) => s.applicationStatus === 'approved').length}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-sm text-gray-400">
              Rejected: {startups.filter((s: any) => s.applicationStatus === 'rejected').length}
            </span>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
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
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="pending">Pending Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="all">All Applications</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Applications Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredStartups.map((startup) => (
          <Card key={startup.id} className="p-6" hover>
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">{startup.name}</h3>
                  <p className="text-gray-400 text-sm flex items-center">
                    <User className="h-4 w-4 mr-1" />
                    {startup.founder}
                  </p>
                </div>
                <div className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${getTRLColor(startup.trlLevel)}`} />
                  <span className="text-xs text-gray-400">TRL{startup.trlLevel}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Sector:</span>
                  <span className="text-sm text-white">{startup.sector}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Type:</span>
                  <span className={`text-xs px-2 py-1 rounded-full capitalize ${getTypeColor(startup.type)}`}>
                    {startup.type}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Status:</span>
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(startup.applicationStatus)}
                    <span className={`text-xs px-2 py-1 rounded-full capitalize ${getStatusColor(startup.applicationStatus)}`}>
                      {startup.applicationStatus}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Submitted:</span>
                  <span className="text-sm text-white flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {new Date(startup.submissionDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex space-x-2 pt-4 border-t border-gray-700">
                <Button 
                  size="sm" 
                  className="flex-1" 
                  onClick={() => setSelectedStartup(startup)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Review
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleApprove(startup._id)}
                  className={`${
                    startup.applicationStatus === 'approved' 
                      ? 'text-green-400 bg-green-900/20 cursor-not-allowed' 
                      : 'text-green-400 hover:bg-green-900/20'
                  }`}
                  disabled={processingStartupId === startup._id || startup.applicationStatus === 'approved'}
                >
                  {processingStartupId === startup._id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleReject(startup._id)}
                  className={`${
                    startup.applicationStatus === 'rejected' 
                      ? 'text-red-400 bg-red-900/20 cursor-not-allowed' 
                      : 'text-red-400 hover:bg-red-900/20'
                  }`}
                  disabled={processingStartupId === startup._id || startup.applicationStatus === 'rejected'}
                >
                  {processingStartupId === startup._id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredStartups.length === 0 && (
        <Card className="p-12 text-center">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-300 mb-2">No applications found</h3>
          <p className="text-gray-400">
            {startups.length === 0 
              ? "No startup applications yet. Applications will appear here when enterprise users sign up."
              : "Try adjusting your search or filter criteria"
            }
          </p>
        </Card>
      )}

      {/* Success/Error Messages */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 z-50">
          <Card className="p-4 bg-green-900/20 border-green-500/50">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span className="text-green-300">{message}</span>
            </div>
          </Card>
        </div>
      )}

      {showErrorMessage && (
        <div className="fixed top-4 right-4 z-50">
          <Card className="p-4 bg-red-900/20 border-red-500/50">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <span className="text-red-300">{message}</span>
            </div>
          </Card>
        </div>
      )}

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Send Email</h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowEmailModal(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">To</label>
                  <Input
                    value={selectedStartup?.email || ''}
                    disabled
                    className="bg-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Subject</label>
                  <Input
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Enter email subject"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Message</label>
                  <textarea
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="Enter your message..."
                  />
                </div>
                <div className="flex space-x-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowEmailModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSendEmail}
                    disabled={processingStartupId === selectedStartup?._id}
                    className="flex-1"
                  >
                    {processingStartupId === selectedStartup?._id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Send Email'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Call Modal */}
      {showCallModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Schedule Call</h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowCallModal(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">With</label>
                  <Input
                    value={selectedStartup?.name || ''}
                    disabled
                    className="bg-gray-800"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Date</label>
                    <Input
                      type="date"
                      value={callDate}
                      onChange={(e) => setCallDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Time</label>
                    <Input
                      type="time"
                      value={callTime}
                      onChange={(e) => setCallTime(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex space-x-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowCallModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleScheduleCall}
                    disabled={processingStartupId === selectedStartup?._id}
                    className="flex-1"
                  >
                    {processingStartupId === selectedStartup?._id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Scheduling...
                      </>
                    ) : (
                      'Schedule Call'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Review;