import React, { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Search, Filter, Upload, Download, Eye, Trash2, FileText, AlertCircle, Loader2, X } from 'lucide-react';
import { CreateDocumentData } from '../../types';
import { useDocuments } from '../../hooks/useDocuments';

const DataRoom: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const {
    documents,
    loading,
    error,
    createDocument,
    deleteDocument,
    refreshDocuments
  } = useDocuments();

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.owner.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || doc.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const getFileIcon = (_type: string) => {
    return <FileText className="h-5 w-5 text-blue-400" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileType = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    return extension;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      // Process each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          alert(`File ${file.name} is too large. Maximum size is 10MB.`);
          continue;
        }

        // Validate file type
        const allowedTypes = ['pdf', 'docx', 'xlsx', 'pptx', 'txt', 'jpg', 'jpeg', 'png'];
        const fileType = getFileType(file.name);
        
        if (!allowedTypes.includes(fileType)) {
          alert(`File type ${fileType} is not supported.`);
          continue;
        }

        // Create FormData for file upload
        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', file.name.replace(/\.[^/.]+$/, "")); // Remove extension
        formData.append('category', 'other');
        formData.append('description', `Uploaded file: ${file.name}`);
        formData.append('isPublic', 'false');

        // Upload using the documents API
        await documentsApi.uploadDocument(formData);
      }

      // Refresh documents list
      await refreshDocuments();
      alert('Files uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      alert('Error uploading files. Please try again.');
    } finally {
      setIsUploading(false);
      // Reset the file input
      event.target.value = '';
    }
  };

  const handleUploadClick = () => {
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    fileInput?.click();
  };

  const handleDeleteDocument = async (documentId: string, documentName: string) => {
    if (window.confirm(`Are you sure you want to delete "${documentName}"?`)) {
      try {
        await deleteDocument(documentId);
        alert('Document deleted successfully!');
      } catch (error) {
        console.error('Delete error:', error);
        alert('Error deleting document. Please try again.');
      }
    }
  };

  const handleDownloadDocument = (document: any) => {
    // Create a blob with the document data (in a real app, this would be fetched from server)
    const content = `Document: ${document.name}\nLocation: ${document.location}\nOwner: ${document.owner}\nFile Size: ${document.fileSize}\nUpload Date: ${document.uploadDate}\nType: ${document.type}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    // Create a temporary link element and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = `${document.name}.txt`; // Download as text file for demo
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    URL.revokeObjectURL(url);
  };

  const handleViewDocument = (document: any) => {
    setSelectedDocument(document);
    setShowViewModal(true);
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setSelectedDocument(null);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Data Room</h1>
            <p className="text-gray-400 mt-1">Manage your startup documents and files</p>
          </div>
        </div>
        
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-3">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
            <span className="text-gray-400">Loading documents...</span>
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
          <h1 className="text-3xl font-bold text-white">Data Room</h1>
          <p className="text-gray-400 mt-1">Manage your startup documents and files</p>
        </div>
        <div className="flex items-center space-x-2">
          <input
            id="file-upload"
            type="file"
            multiple
            accept=".pdf,.docx,.xlsx,.pptx,.txt,.jpg,.jpeg,.png"
            onChange={handleFileUpload}
            className="hidden"
          />
        <Button 
          variant="primary" 
          className="flex items-center space-x-2"
            onClick={handleUploadClick}
            disabled={isUploading}
        >
          <Upload className="h-4 w-4" />
            <span>{isUploading ? 'Uploading...' : 'Upload File'}</span>
        </Button>
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
                onClick={refreshDocuments}
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
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="all">All Types</option>
              <option value="pdf">PDF</option>
              <option value="docx">Word</option>
              <option value="xlsx">Excel</option>
              <option value="pptx">PowerPoint</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Documents Table */}
      <Card className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white mb-2">Documents</h3>
          <p className="text-sm text-gray-400">Manage and organize your startup documents</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-gray-300 font-medium">Document Name</th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium">Location</th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium">Owner</th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium">File Size</th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium">Upload Date</th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocuments.map((doc) => (
                <tr key={doc.id} className="border-b border-gray-800 hover:bg-gray-700/20 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-3">
                      {getFileIcon(doc.type)}
                      <div>
                        <span className="text-white font-medium">{doc.name}</span>
                        <div className="text-xs text-gray-400 uppercase">{doc.type}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-gray-300">{doc.location}</td>
                  <td className="py-4 px-4 text-gray-300">{doc.owner}</td>
                  <td className="py-4 px-4 text-gray-300">{doc.fileSize}</td>
                  <td className="py-4 px-4 text-gray-300">{doc.uploadDate}</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <button 
                        className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                        title="View document"
                        onClick={() => handleViewDocument(doc)}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button 
                        className="p-2 text-gray-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-colors"
                        title="Download document"
                        onClick={() => handleDownloadDocument(doc)}
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button 
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                        title="Delete document"
                        onClick={() => handleDeleteDocument(doc.id, doc.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredDocuments.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-300 mb-2">
                {searchTerm || filterType !== 'all' ? 'No documents found' : 'No documents available'}
              </h3>
              <p className="text-gray-400 mb-4">
                {searchTerm || filterType !== 'all' 
                  ? 'Try adjusting your search or filter criteria' 
                  : 'Upload your first document to get started'
                }
              </p>
              {!searchTerm && filterType === 'all' && (
                <Button 
                  variant="outline" 
                  onClick={handleUploadClick}
                  disabled={isUploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isUploading ? 'Uploading...' : 'Upload First Document'}
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* View Document Modal */}
      {showViewModal && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Document Details</h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={closeViewModal}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-6">
                {/* Document Icon and Name */}
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 bg-cyan-500 rounded-lg flex items-center justify-center">
                    <FileText className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">{selectedDocument.name}</h3>
                    <p className="text-gray-400 text-sm uppercase">{selectedDocument.type}</p>
                  </div>
                </div>

                {/* Document Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-400">Location</label>
                      <p className="text-white">{selectedDocument.location}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-400">Owner</label>
                      <p className="text-white">{selectedDocument.owner}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-400">File Size</label>
                      <p className="text-white">{selectedDocument.fileSize}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-400">Upload Date</label>
                      <p className="text-white">{selectedDocument.uploadDate}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-400">File Type</label>
                      <p className="text-white uppercase">{selectedDocument.type}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-400">Document ID</label>
                      <p className="text-white font-mono text-sm">{selectedDocument.id}</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4 pt-4 border-t border-gray-700">
                  <Button 
                    variant="outline" 
                    onClick={() => handleDownloadDocument(selectedDocument)}
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      closeViewModal();
                      handleDeleteDocument(selectedDocument.id, selectedDocument.name);
                    }}
                    className="flex-1 text-red-400 border-red-400 hover:bg-red-400/10"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
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

export default DataRoom;