import React, { useState, useEffect } from 'react';
import { Files, Search, Calendar, Building, Upload, X, MessageSquare, ChevronDown, Download } from 'lucide-react';
import { collection, query, getDocs, doc, getDoc, updateDoc, addDoc, orderBy, where, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import toast from 'react-hot-toast';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

interface Document {
  id: string;
  fileName: string;
  message: string;
  uploadedAt: { seconds: number };
  status: 'pending' | 'approved' | 'rejected';
  fileUrl: string;
  storagePath: string;
  userId: string;
  fileData: string;
  user?: {
    name: string;
    designation: string;
    departmentName: string;
    departmentId: string;
  };
  adminResponse?: {
    message: string;
    fileName?: string;
    fileUrl?: string;
    storagePath?: string;
    respondedAt: { seconds: number };
  };
}

export default function DocumentManager() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState<{ id: string; name: string }[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchDepartments();
    fetchDocuments();
  }, [selectedDepartment, dateRange.start, dateRange.end]);

  const fetchDepartments = async () => {
    try {
      const departments: { id: string; name: string; organizationId: string }[] = [];
      const orgsRef = collection(db, 'organizations');
      const orgsSnapshot = await getDocs(orgsRef);

      for (const orgDoc of orgsSnapshot.docs) {
        const deptsRef = collection(db, `organizations/${orgDoc.id}/departments`);
        const deptsSnapshot = await getDocs(deptsRef);
        deptsSnapshot.docs.forEach(deptDoc => {
          departments.push({
            id: deptDoc.id,
            name: deptDoc.data().name,
            organizationId: orgDoc.id
          });
        });
      }

      setOrganizations(departments);
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast.error('Failed to fetch departments');
    }
  };

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const documentsRef = collection(db, 'documents');
      let q = query(documentsRef, orderBy('uploadedAt', 'desc'));

      if (dateRange.start && dateRange.end) {
        const startDate = new Date(dateRange.start);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999);

        q = query(
          documentsRef,
          where('uploadedAt', '>=', Timestamp.fromDate(startDate)),
          where('uploadedAt', '<=', Timestamp.fromDate(endDate)),
          orderBy('uploadedAt', 'desc')
        );
      }

      const querySnapshot = await getDocs(q);
      const docs = await Promise.all(
        querySnapshot.docs.map(async docSnapshot => {
          const data = docSnapshot.data();
          const userRef = collection(db, 'users');
          const userQuery = query(userRef, where('uid', '==', data.userId));
          const userSnapshot = await getDocs(userQuery);
          const userData = userSnapshot.docs[0]?.data();

          let departmentName = '';
          let departmentId = '';
          if (userData?.departmentId && userData?.organizationId) {
            const departmentsRef = collection(db, `organizations/${userData.organizationId}/departments`);
            const departmentDoc = await getDoc(doc(departmentsRef, userData.departmentId));
            if (departmentDoc.exists()) {
              departmentName = departmentDoc.data().name;
              departmentId = departmentDoc.id;
            }
          }

          return {
            id: docSnapshot.id,
            ...data,
            user: userData ? {
              name: userData.name,
              designation: userData.designation,
              departmentName,
              departmentId
            } : undefined
          };
        })
      );

      const filteredDocs = selectedDepartment === 'all'
        ? docs
        : docs.filter(doc => doc.user?.departmentId === selectedDepartment);

      setDocuments(filteredDocs as Document[]);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to fetch documents');
    } finally {
      setLoading(false);
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

  const handleResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocument) return;

    setUploading(true);
    try {
      let fileUrl = '';
      let storagePath = '';

      if (selectedFile) {
        const timestamp = Date.now();
        storagePath = `responses/${selectedDocument.id}/${timestamp}_${selectedFile.name}`;
        const storageRef = ref(storage, storagePath);
        await uploadBytes(storageRef, selectedFile);
        fileUrl = await getDownloadURL(storageRef);
      }

      const documentRef = doc(db, 'documents', selectedDocument.id);
      await updateDoc(documentRef, {
        status: 'approved',
        adminResponse: {
          message: responseMessage,
          fileName: selectedFile?.name,
          fileUrl: fileUrl || null,
          storagePath: storagePath || null,
          respondedAt: new Date()
        }
      });

      toast.success('Response sent successfully');
      setSelectedDocument(null);
      setResponseMessage('');
      setSelectedFile(null);
      fetchDocuments();
    } catch (error) {
      console.error('Error sending response:', error);
      toast.error('Failed to send response');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = (document: Document) => {
    try {
      const a = window.document.createElement('a');
      a.href = document.fileData;
      a.download = document.fileName;
      
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      
      toast.success('Document downloaded successfully');
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Failed to download document');
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const searchString = searchQuery.toLowerCase();
    return (
      doc.user?.name?.toLowerCase().includes(searchString) ||
      doc.user?.designation?.toLowerCase().includes(searchString) ||
      doc.user?.departmentName?.toLowerCase().includes(searchString) ||
      doc.message.toLowerCase().includes(searchString) ||
      doc.fileName.toLowerCase().includes(searchString)
    );
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-6 flex items-center">
          <Files size={24} className="mr-2" />
          Document Management
        </h2>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-yellow-400 text-2xl">🚨</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700 font-bold">
                Please ensure that uploaded files are compressed to below 200KB before uploading.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="relative">
            <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg appearance-none"
            >
              <option value="all">All Divisions</option>
              {organizations.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDocuments.map((doc) => (
              <div key={doc.id} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-2">
                      <Files size={20} className="text-blue-500" />
                      <h3 className="font-medium text-lg">{doc.fileName}</h3>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{doc.message}</p>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm">
                        <span className="font-medium">User:</span> {doc.user?.name}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Designation:</span> {doc.user?.designation}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Division:</span> {doc.user?.departmentName}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Uploaded:</span> {new Date(doc.uploadedAt.seconds * 1000).toLocaleDateString()}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Status:</span>{' '}
                        <span className={`${
                          doc.status === 'approved' ? 'text-green-600' :
                          doc.status === 'rejected' ? 'text-red-600' :
                          'text-yellow-600'
                        }`}>
                          {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleDownload(doc)}
                      className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center space-x-1"
                      title="Download Document"
                    >
                      <Download size={16} />
                      <span>Download</span>
                    </button>
                    <button
                      onClick={() => setSelectedDocument(doc)}
                      className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                    >
                      Respond
                    </button>
                  </div>
                </div>

                {doc.adminResponse && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-2 text-green-600">
                      <MessageSquare size={16} />
                      <span className="font-medium">Admin Response</span>
                    </div>
                    <p className="text-sm mt-1">{doc.adminResponse.message}</p>
                    {doc.adminResponse.fileName && (
                      <div className="mt-2 flex items-center space-x-2">
                        <Files size={16} className="text-blue-500" />
                        <span className="text-sm">{doc.adminResponse.fileName}</span>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Responded on: {new Date(doc.adminResponse.respondedAt.seconds * 1000).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            ))}

            {filteredDocuments.length === 0 && (
              <div className="text-center py-8">
                <Files size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No documents found</p>
              </div>
            )}
          </div>
        )}
      </div>

      {selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Respond to Document</h3>
              <button
                onClick={() => setSelectedDocument(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleResponse} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <input
                  type="text"
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Attach File (Optional)
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                  <div className="space-y-1 text-center">
                    <Upload size={24} className="mx-auto text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                        <span>Upload a file</span>
                        <input
                          type="file"
                          className="sr-only"
                          onChange={handleFileSelect}
                          accept=".pdf,.doc,.docx"
                        />
                      </label>
                    </div>
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

              <button
                type="submit"
                disabled={uploading}
                className="w-full py-2 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                {uploading ? 'Sending...' : 'Send Response'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}