import React, { useState, useEffect } from 'react';
import { FileText, Calendar, ChevronDown, Download } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import toast from 'react-hot-toast';

interface SalaryReport {
  id: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: { seconds: number };
  month: string;
  year: string;
}

export default function SalaryReport() {
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toLocaleString('default', { month: 'long' })
  );
  const [selectedYear, setSelectedYear] = useState<string>(
    new Date().getFullYear().toString()
  );
  const [reports, setReports] = useState<SalaryReport[]>([]);
  const [loading, setLoading] = useState(true);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from(
    { length: 5 },
    (_, i) => (new Date().getFullYear() - 2 + i).toString()
  );

  useEffect(() => {
    fetchReports();
  }, [selectedMonth, selectedYear]);

  const fetchReports = async () => {
    if (!auth.currentUser) return;

    try {
      setLoading(true);
      const reportsRef = collection(db, 'salary_reports');
      const q = query(
        reportsRef,
        where('userId', '==', auth.currentUser.uid),
        where('month', '==', selectedMonth),
        where('year', '==', selectedYear)
      );
      
      const querySnapshot = await getDocs(q);
      const reportData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SalaryReport[];
      
      setReports(reportData);
    } catch (error) {
      console.error('Error fetching salary reports:', error);
      toast.error('Failed to fetch salary reports');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold flex items-center">
          <FileText size={24} className="mr-2" />
          Salary Reports
        </h2>
        <div className="flex space-x-4">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-blue-500"
            >
              {months.map(month => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-blue-500"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div key={report.id} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center space-x-4">
                <FileText size={20} className="text-blue-500" />
                <div>
                  <p className="font-medium">{report.fileName}</p>
                  <p className="text-sm text-gray-500">
                    Uploaded on {new Date(report.uploadedAt.seconds * 1000).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <a
                href={report.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
              >
                <Download size={20} />
                <span>Download</span>
              </a>
            </div>
          ))}
          {reports.length === 0 && (
            <div className="text-center py-8">
              <FileText size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No salary reports available for {selectedMonth} {selectedYear}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}