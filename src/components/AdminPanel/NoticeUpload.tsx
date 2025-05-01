import React, { useState, useEffect } from 'react';
import { FileUp, Upload, X, Download, Calendar, FileText } from 'lucide-react';
import { collection, addDoc, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import toast from 'react-hot-toast';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

interface Notice {
  id: string;
  fileName: string;
  description: string;
  uploadedAt: { seconds: number };
  fileData: string;
}

export default function NoticeUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      const noticesRef = collection(db, 'notices');
      const q = query(noticesRef, orderBy('uploadedAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const noticeData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notice[];
      setNotices(noticeData);
    } catch (error) {
      console.error('Error fetching notices:', error);
      toast.error('Failed to fetch notices');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error('Please select a file');
      return;
    }

    if (!description.trim()) {
      toast.error('Please enter a description');
      return;
    }

    setUploading(true);
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);
      reader.onload = async () => {
        const base64File = reader.result as string;

        // Save notice data to Firestore
        const docRef = await addDoc(collection(db, 'notices'), {
          fileName: selectedFile.name,
          fileData: base64File,
          description: description,
          uploadedAt: new Date()
        });

        // Add new notice to state
        const newNotice = {
          id: docRef.id,
          fileName: selectedFile.name,
          fileData: base64File,
          description: description,
          uploadedAt: { seconds: Math.floor(Date.now() / 1000) }
        };
        setNotices(prev => [newNotice, ...prev]);

        toast.success('Notice uploaded successfully');
        setSelectedFile(null);
        setDescription('');
      };
    } catch (error) {
      console.error('Error uploading notice:', error);
      toast.error('Failed to upload notice');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = (notice: Notice) => {
    try {
      const a = document.createElement('a');
      a.href = notice.fileData;
      a.download = notice.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success('Document downloaded successfully');
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Failed to download document');
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-6 flex items-center">
          <FileUp size={24} className="mr-2" />
          Upload Notice
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

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Document
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
              <div className="space-y-1 text-center">
                <Upload size={48} className="mx-auto text-gray-400" />
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
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              placeholder="Enter notice description..."
              required
            />
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Uploading...' : 'Upload Notice'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-6 flex items-center">
          <FileText size={24} className="mr-2" />
          Uploaded Notices
        </h2>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {notices.map((notice) => (
              <div key={notice.id} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <FileText size={20} className="text-blue-500" />
                      <h3 className="font-medium text-lg">{notice.fileName}</h3>
                    </div>
                    <p className="text-gray-600 mb-2">{notice.description}</p>
                    <p className="text-sm text-gray-500 flex items-center">
                      <Calendar size={16} className="mr-1" />
                      {new Date(notice.uploadedAt.seconds * 1000).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDownload(notice)}
                    className="ml-4 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center space-x-1"
                  >
                    <Download size={16} />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            ))}

            {notices.length === 0 && (
              <div className="text-center py-8">
                <FileText size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No notices uploaded yet</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}