import React from 'react';
import { FileText, Download, Trash2, Clock, CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import { formatDate } from '../../utils/dateUtils';

interface Document {
  id: string;
  fileName: string;
  message: string;
  uploadedAt: { seconds: number };
  status: 'pending' | 'approved' | 'rejected';
  fileData: string;
  adminResponse?: {
    message: string;
    fileName?: string;
    fileUrl?: string;
    respondedAt: { seconds: number };
  };
}

interface DocumentListProps {
  documents: Document[];
  onDownload: (document: Document) => void;
  onDelete: (documentId: string) => void;
}

export default function DocumentList({ documents, onDownload, onDelete }: DocumentListProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'rejected':
        return <XCircle size={16} className="text-red-500" />;
      default:
        return <Clock size={16} className="text-yellow-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Pending';
    }
  };

  const handleResponseDownload = (document: Document) => {
    if (document.adminResponse?.fileUrl) {
      window.open(document.adminResponse.fileUrl, '_blank');
    }
  };

  return (
    <div className="space-y-4">
      {documents.map((doc) => (
        <div key={doc.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText size={24} className="text-blue-500" />
              <div>
                <h3 className="font-medium text-gray-900">{doc.fileName}</h3>
                <p className="text-sm text-gray-500">{doc.message}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                {getStatusIcon(doc.status)}
                <span className="text-sm text-gray-600">{getStatusText(doc.status)}</span>
              </div>
              <button
                onClick={() => onDownload(doc)}
                className="p-1 text-gray-500 hover:text-blue-500 transition-colors"
                title="Download"
              >
                <Download size={18} />
              </button>
              <button
                onClick={() => onDelete(doc.id)}
                className="p-1 text-gray-500 hover:text-red-500 transition-colors"
                title="Delete"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Uploaded on {formatDate(new Date(doc.uploadedAt.seconds * 1000))}
          </div>

          {doc.adminResponse && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-2 text-green-600 mb-2">
                <MessageSquare size={16} />
                <span className="font-medium">Admin Response</span>
                <span className="text-xs text-gray-500">
                  ({formatDate(new Date(doc.adminResponse.respondedAt.seconds * 1000))})
                </span>
              </div>
              <p className="text-sm text-gray-700 mb-2">{doc.adminResponse.message}</p>
              {doc.adminResponse.fileName && (
                <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                  <div className="flex items-center space-x-2">
                    <FileText size={16} className="text-blue-500" />
                    <span className="text-sm text-gray-600">{doc.adminResponse.fileName}</span>
                  </div>
                  <button
                    onClick={() => handleResponseDownload(doc)}
                    className="text-sm text-blue-500 hover:text-blue-600 transition-colors"
                  >
                    Download Response
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
      {documents.length === 0 && (
        <div className="text-center py-8">
          <FileText size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No documents uploaded yet</p>
        </div>
      )}
    </div>
  );
}