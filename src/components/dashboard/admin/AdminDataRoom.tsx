import React, { useState, useEffect } from 'react';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import { Search, Filter, Eye, Download, FileText, Building2, User, Mail, Calendar, X, AlertCircle, Loader2 } from 'lucide-react';
import { startupsApi } from '../../../services/api';

interface StartupDocument {
  _id?: string;
  name: string;
  type: string;
  category: string;
  uploadDate: string | Date;
  description?: string;
  fileSize?: string;
  location?: string;
  source?: string;
}

interface StartupWithDocuments {
  _id: string;
  name: string;
  founder: string;
  sector: string;
  type: 'innovation' | 'incubation';
  status: 'pending' | 'active' | 'completed' | 'dropout';
  email: string;
  submissionDate: string;
  documents: StartupDocument[];
  documentCount: number;
  userId: {
    _id: string;
    fullName: string;
    email: string;
    username: string;
  };
}

const AdminDataRoom: React.FC = () => {
  const [startups, setStartups] = useState<StartupWithDocuments[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSector, setFilterSector] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedStartup, setSelectedStartup] = useState<StartupWithDocuments | null>(null);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);

  // Fetch startups with documents
  const fetchStartupsWithDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        search: searchTerm || undefined,
        sector: filterSector !== 'all' ? filterSector : undefined,
        type: filterType !== 'all' ? filterType : undefined,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        limit: 50, // Get more startups for admin view
      };

      const response = await startupsApi.getStartupsWithDocuments(params);
      setStartups(response.startups || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch startups');
      console.error('Error fetching startups:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStartupsWithDocuments();
  }, [searchTerm, filterSector, filterType, filterStatus]);

  const filteredStartups = startups.filter(startup => {
    const matchesSearch = startup.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         startup.founder.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         startup.sector.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSector = filterSector === 'all' || startup.sector === filterSector;
    const matchesType = filterType === 'all' || startup.type === filterType;
    const matchesStatus = filterStatus === 'all' || startup.status === filterStatus;
    
    return matchesSearch && matchesSector && matchesType && matchesStatus;
  });

  const handleViewDocuments = (startup: StartupWithDocuments) => {
    setSelectedStartup(startup);
    setShowDocumentsModal(true);
  };

  const closeDocumentsModal = () => {
    setShowDocumentsModal(false);
    setSelectedStartup(null);
  };

  const handleDownloadDocument = (document: StartupDocument) => {
    // For demo purposes, create a simple download
    const content = `Document: ${document.name}\nType: ${document.type}\nCategory: ${document.category}\nDescription: ${document.description || 'No description'}\nUpload Date: ${document.uploadDate}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${document.name}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  };

  const getFileIcon = (type: string) => {
    return <FileText className="h-5 w-5 text-blue-400" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'completed': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'dropout': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getTypeColor = (type: string) => {
    return type === 'innovation' 
      ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
  };

  const sectors = ['CleanTech', 'HealthTech', 'EdTech', 'FinTech', 'AgriTech', 'Other'];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Data Room</h1>
            <p className="text-gray-400 mt-1">View all startup documents and files</p>
          </div>
        </div>
        
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-3">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
            <span className="text-gray-400">Loading startups...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Data Room</h1>
          <p className="text-gray-400 mt-1">View all startup documents and files</p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="p-4 bg-red-900/20 border-red-500/50">
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div>
              <h3 className="text-red-400 font-medium">Error</h3>
              <p className="text-red-300 text-sm mt-1">{error}</p>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={fetchStartupsWithDocuments}
                className="mt-2 text-red-400 hover:text-red-300"
              >
                Try Again
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Search and Filter */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search startups by name, founder, or sector..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filterSector}
                onChange={(e) => setFilterSector(e.target.value)}
                className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="all">All Sectors</option>
                {sectors.map(sector => (
                  <option key={sector} value={sector}>{sector}</option>
                ))}
              </select>
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="all">All Types</option>
              <option value="innovation">Innovation</option>
              <option value="incubation">Incubation</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="dropout">Dropout</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Startups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStartups.map((startup) => (
          <Card key={startup._id} className="p-6 hover:bg-gray-700/20 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 bg-cyan-500 rounded-lg flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{startup.name}</h3>
                  <p className="text-sm text-gray-400">{startup.founder}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(startup.status)}`}>
                  {startup.status}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getTypeColor(startup.type)}`}>
                  {startup.type}
                </span>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <span className="font-medium">Sector:</span>
                <span>{startup.sector}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <Mail className="h-4 w-4" />
                <span>{startup.email}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <Calendar className="h-4 w-4" />
                <span>{new Date(startup.submissionDate).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-700">
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <FileText className="h-4 w-4" />
                <span>{startup.documentCount} documents</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleViewDocuments(startup)}
                className="flex items-center space-x-2"
              >
                <Eye className="h-4 w-4" />
                <span>View Documents</span>
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {filteredStartups.length === 0 && !loading && (
        <Card className="p-12 text-center">
          <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-300 mb-2">
            {searchTerm || filterSector !== 'all' || filterType !== 'all' || filterStatus !== 'all' 
              ? 'No startups found' 
              : 'No startups available'
            }
          </h3>
          <p className="text-gray-400">
            {searchTerm || filterSector !== 'all' || filterType !== 'all' || filterStatus !== 'all'
              ? 'Try adjusting your search or filter criteria'
              : 'No startups have been registered yet'
            }
          </p>
        </Card>
      )}

      {/* Documents Modal */}
      {showDocumentsModal && selectedStartup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedStartup.name} Documents</h2>
                  <p className="text-gray-400">Founder: {selectedStartup.founder} • {selectedStartup.documentCount} documents</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={closeDocumentsModal}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                {selectedStartup.documents.length > 0 ? (
                  selectedStartup.documents.map((document, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700">
                      <div className="flex items-center space-x-4">
                        {getFileIcon(document.type)}
                        <div>
                          <h4 className="text-white font-medium">{document.name}</h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-400">
                            <span className="uppercase">{document.type}</span>
                            <span>•</span>
                            <span className="capitalize">{document.category}</span>
                            {document.source && (
                              <>
                                <span>•</span>
                                <span className="text-cyan-400">{document.source}</span>
                              </>
                            )}
                            {document.fileSize && (
                              <>
                                <span>•</span>
                                <span>{document.fileSize}</span>
                              </>
                            )}
                          </div>
                          {document.description && (
                            <p className="text-sm text-gray-300 mt-1">{document.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadDocument(document)}
                          className="flex items-center space-x-2"
                        >
                          <Download className="h-4 w-4" />
                          <span>Download</span>
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-300 mb-2">No documents found</h3>
                    <p className="text-gray-400">This startup hasn't uploaded any documents yet.</p>
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

export default AdminDataRoom;
