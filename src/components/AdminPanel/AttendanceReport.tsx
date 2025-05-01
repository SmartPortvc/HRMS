import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Calendar, ChevronDown, Search, Building } from 'lucide-react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import toast from 'react-hot-toast';

interface Department {
  id: string;
  name: string;
}

interface AttendanceRecord {
  id: string;
  userId: string;
  date: { seconds: number };
  startTime?: { seconds: number };
  endTime?: { seconds: number };
  status?: 'present' | 'ooo';
  location?: {
    name: string;
    latitude: number;
    longitude: number;
  };
  user?: {
    name: string;
    designation: string;
  };
}

export default function AttendanceReport() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toLocaleString('default', { month: 'long' })
  );
  const [selectedYear, setSelectedYear] = useState<string>(
    new Date().getFullYear().toString()
  );
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from(
    { length: 5 },
    (_, i) => (new Date().getFullYear() - 2 + i).toString()
  );

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchAttendanceRecords();
  }, [selectedDepartment, selectedMonth, selectedYear]);

  const fetchDepartments = async () => {
    try {
      const allDepartments: Department[] = [];
      const orgsRef = collection(db, 'organizations');
      const orgsSnapshot = await getDocs(orgsRef);

      for (const orgDoc of orgsSnapshot.docs) {
        const deptsRef = collection(db, `organizations/${orgDoc.id}/departments`);
        const deptsSnapshot = await getDocs(deptsRef);
        deptsSnapshot.docs.forEach(deptDoc => {
          allDepartments.push({
            id: deptDoc.id,
            name: deptDoc.data().name
          });
        });
      }

      setDepartments(allDepartments);
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast.error('Failed to fetch departments');
    }
  };

  const fetchAttendanceRecords = async () => {
    try {
      setLoading(true);
      const attendanceRef = collection(db, 'attendance');
      
      // Get the date range for the selected month and year
      const startDate = new Date(parseInt(selectedYear), months.indexOf(selectedMonth), 1);
      const endDate = new Date(parseInt(selectedYear), months.indexOf(selectedMonth) + 1, 0);
      
      // Create the query
      const q = query(
        attendanceRef,
        where('date', '>=', startDate),
        where('date', '<=', endDate)
      );

      const querySnapshot = await getDocs(q);
      const records = await Promise.all(
        querySnapshot.docs.map(async (doc) => {
          const data = doc.data();
          
          // Fetch user details
          const usersRef = collection(db, 'users');
          const userQuery = query(usersRef, where('uid', '==', data.userId));
          const userSnapshot = await getDocs(userQuery);
          const userData = userSnapshot.docs[0]?.data();

          if (selectedDepartment !== 'all' && userData?.departmentId !== selectedDepartment) {
            return null;
          }

          return {
            id: doc.id,
            ...data,
            user: userData ? {
              name: userData.name,
              designation: userData.designation
            } : undefined
          };
        })
      );

      setAttendanceRecords(records.filter(Boolean) as AttendanceRecord[]);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching attendance records:', error);
      toast.error('Failed to fetch attendance records');
      setLoading(false);
    }
  };

  const getStatusDisplay = (record: AttendanceRecord) => {
    if (record.status === 'ooo') {
      return {
        text: 'Out of Office',
        className: 'bg-purple-100 text-purple-700'
      };
    }
    
    if (record.startTime && record.endTime) {
      return {
        text: 'Present',
        className: 'bg-green-100 text-green-700'
      };
    }
    
    if (record.startTime && !record.endTime) {
      return {
        text: 'Half Day Present',
        className: 'bg-yellow-100 text-yellow-700'
      };
    }
    
    return {
      text: 'Absent',
      className: 'bg-red-100 text-red-700'
    };
  };

  const filteredRecords = attendanceRecords.filter(record => {
    const searchString = searchQuery.toLowerCase();
    return (
      record.user?.name?.toLowerCase().includes(searchString) ||
      record.user?.designation?.toLowerCase().includes(searchString)
    );
  });

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold flex items-center">
          <FileSpreadsheet size={24} className="mr-2" />
          Attendance Report
        </h2>
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
            {departments.map(dept => (
              <option key={dept.id} value={dept.id}>{dept.name}</option>
            ))}
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>

        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg appearance-none"
          >
            {months.map(month => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>

        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg appearance-none"
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
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
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRecords.map((record) => {
                const status = getStatusDisplay(record);
                return (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-gray-900">{record.user?.name || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{record.user?.designation}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(record.date.seconds * 1000).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${status.className}`}>
                        {status.text}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.status === 'ooo' 
                        ? '-'
                        : record.startTime 
                          ? new Date(record.startTime.seconds * 1000).toLocaleTimeString() 
                          : 'Not marked'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.status === 'ooo'
                        ? '-'
                        : record.endTime 
                          ? new Date(record.endTime.seconds * 1000).toLocaleTimeString() 
                          : 'Not marked'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.status === 'ooo' ? 'N/A' : record.location?.name || 'Not available'}
                    </td>
                  </tr>
                );
              })}
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No attendance records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}