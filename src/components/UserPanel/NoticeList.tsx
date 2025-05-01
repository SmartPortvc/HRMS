import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar } from 'lucide-react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import toast from 'react-hot-toast';

interface Notice {
  id: string;
  fileName: string;
  description: string;
  uploadedAt: { seconds: number };
  fileData: string;
}

export default function NoticeList() {
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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-6 flex items-center">
        <FileText size={24} className="mr-2" />
        Notices
      </h2>

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
            <p className="text-gray-500">No notices available</p>
          </div>
        )}
      </div>
    </div>
  );
}