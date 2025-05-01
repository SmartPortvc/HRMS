import React, { useState, useEffect } from 'react';
import { FileUp, Upload, X } from 'lucide-react';
import { collection, addDoc, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import toast from 'react-hot-toast';
import DocumentList from './DocumentList';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

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

export default function DocumentUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const documentsRef = collection(db, 'documents');
      const q = query(documentsRef, where('userId', '==', auth.currentUser?.uid));
      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Document[];
      setDocuments(docs);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to fetch documents');
    }
  };

  const validateFile = (file: File): boolean => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast.error('Invalid file type. Please upload PDF or Word documents only.');
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error('File size exceeds 10MB limit.');
      return false;
    }

    return true;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      } else {
        e.target.value = '';
        setSelectedFile(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error('Please select a file');
      return;
    }

    setUploading(true);
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);
      reader.onload = async () => {
        const base64File = reader.result as string;

        // Save document data to Firestore
        const docRef = await addDoc(collection(db, 'documents'), {
          fileName: selectedFile.name,
          fileData: base64File,
          message: message,
          uploadedAt: new Date(),
          userId: auth.currentUser?.uid,
          status: 'pending'
        });

        // Update local state
        const newDoc = {
          id: docRef.id,
          fileName: selectedFile.name,
          fileData: base64File,
          message: message,
          uploadedAt: { seconds: Math.floor(Date.now() / 1000) },
          status: 'pending' as const
        };
        setDocuments(prev => [newDoc, ...prev]);

        toast.success('Document uploaded successfully');
        setSelectedFile(null);
        setMessage('');
      };
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = (document: Document) => {
    try {
      // Create a temporary anchor element
      const a = window.document.createElement('a');
      a.href = document.fileData;
      a.download = document.fileName;
      // Append to body, click, and remove
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Failed to download document');
    }
  };

  const handleDelete = async (documentId: string) => {
    try {
      await deleteDoc(doc(db, 'documents', documentId));
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      toast.success('Document deleted successfully');
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-6 flex items-center">
          <FileUp size={24} className="mr-2" />
          Upload Documents
        </h2>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-yellow-400 text-2xl">🚨</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700 font-bold">
                Please compress your file to below 200KB before uploading.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Document
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
              <div className="space-y-1 text-center">
                <Upload size={48} className="mx-auto text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                    <span>Upload a file</span>
                    <input
                      type="file"
                      className="sr-only"
                      onChange={handleFileSelect}
                      accept=".pdf,.doc,.docx"
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">
                  PDF, DOC, DOCX up to 10MB
                </p>
              </div>
            </div>
            {selectedFile && (
              <div className="mt-2 flex items-center justify-between bg-gray-50 p-2 rounded">
                <span className="text-sm text-gray-600">{selectedFile.name}</span>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message
            </label>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Add a brief message about this document"
              required
            />
          </div>

          <button
            type="submit"
            disabled={!selectedFile || uploading}
            className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Uploading...' : 'Upload Document'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-6">Your Documents</h2>
        <DocumentList
          documents={documents}
          onDownload={handleDownload}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}