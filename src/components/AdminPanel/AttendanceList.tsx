import React from 'react';
import { Clock, Calendar, MapPin } from 'lucide-react';

interface AttendanceRecord {
  id: string;
  date: { seconds: number };
  startTime?: { seconds: number };
  endTime?: { seconds: number };
  location?: {
    name: string;
    latitude: number;
    longitude: number;
  };
  user?: {
    name: string;
    designation: string;
  };
  status?: 'present' | 'ooo';
}

interface AttendanceListProps {
  records: AttendanceRecord[];
}

export default function AttendanceList({ records }: AttendanceListProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getAttendanceStatus = (record: AttendanceRecord) => {
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

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-6 flex items-center">
        <Clock size={20} className="mr-2" />
        All Attendance Records
      </h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Designation</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {records.map((record) => {
              const status = getAttendanceStatus(record);
              return (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(new Date(record.date.seconds * 1000))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                      {record.month || new Date(record.date.seconds * 1000).toLocaleString('default', { month: 'long' })}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="font-medium text-gray-900">{record.user?.name || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{record.user?.designation}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{record.user?.designation || 'N/A'}</td>
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
                  <td className="px-6 py-4 whitespace-nowrap">
                    {record.status === 'ooo' ? (
                      <span className="text-sm text-gray-500">N/A</span>
                    ) : record.location ? (
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPin size={16} className="text-gray-400 mr-1" />
                        <span>{record.location.name}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">Not available</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {records.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                  <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
                  <p>No attendance records found</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}