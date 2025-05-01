import React, { useState } from 'react';
import { FileSpreadsheet, Calendar, ChevronDown, Search } from 'lucide-react';

interface AttendanceRecord {
  id: string;
  userId: string;
  date: { seconds: number };
  startTime?: { seconds: number };
  endTime?: { seconds: number };
  user?: {
    name: string;
    designation: string;
  };
}

interface DepartmentAttendanceProps {
  records: AttendanceRecord[];
}

export default function DepartmentAttendance({ records }: DepartmentAttendanceProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toLocaleString('default', { month: 'long' })
  );
  const [selectedYear, setSelectedYear] = useState<string>(
    new Date().getFullYear().toString()
  );
  const [searchQuery, setSearchQuery] = useState('');

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from(
    { length: 5 },
    (_, i) => (new Date().getFullYear() - 2 + i).toString()
  );

  const filteredRecords = records.filter(record => {
    const recordDate = new Date(record.date.seconds * 1000);
    const matchesDate = 
      recordDate.toLocaleString('default', { month: 'long' }) === selectedMonth &&
      recordDate.getFullYear().toString() === selectedYear;
    
    const searchString = searchQuery.toLowerCase();
    const matchesSearch = 
      record.user?.name?.toLowerCase().includes(searchString) ||
      record.user?.designation?.toLowerCase().includes(searchString);

    return matchesDate && (!searchQuery || matchesSearch);
  });

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold flex items-center">
          <FileSpreadsheet size={24} className="mr-2" />
          Division Attendance Records
        </h2>
        <div className="flex space-x-4">
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="appearance-none bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {months.map((month) => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="appearance-none bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {years.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="mb-6 relative">
        <input
          type="text"
          placeholder="Search by name or designation..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-10 py-2 border border-gray-300 rounded-lg"
        />
        <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Designation</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Hours</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredRecords.map((record) => {
              const startTime = record.startTime ? new Date(record.startTime.seconds * 1000) : null;
              const endTime = record.endTime ? new Date(record.endTime.seconds * 1000) : null;
              
              let totalHours = '';
              if (startTime && endTime) {
                const diff = endTime.getTime() - startTime.getTime();
                const hours = Math.floor(diff / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                totalHours = `${hours}h ${minutes}m`;
              }

              return (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">{record.user?.name || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{record.user?.designation || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(record.date.seconds * 1000).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {startTime ? startTime.toLocaleTimeString() : 'Not marked'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {endTime ? endTime.toLocaleTimeString() : 'Not marked'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{totalHours || 'N/A'}</td>
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
    </div>
  );
}