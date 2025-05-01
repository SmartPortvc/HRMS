import React from 'react';
import { X, Calendar, Clock, MapPin } from 'lucide-react';

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
  month?: string;
  status?: 'present' | 'ooo';
}

interface AttendanceModalProps {
  onClose: () => void;
  records: AttendanceRecord[];
  userName: string;
}

export default function AttendanceModal({ onClose, records, userName }: AttendanceModalProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-semibold">
              Attendance Records
            </h3>
            <p className="text-gray-600">{userName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          {records.map((record) => {
            const status = getStatusDisplay(record);
            return (
              <div key={record.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center space-x-2">
                    <Calendar size={18} className="text-gray-500" />
                    <p className="font-semibold">
                      {formatDate(new Date(record.date.seconds * 1000))}
                    </p>
                  </div>
                  <span className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                    {record.month || new Date(record.date.seconds * 1000).toLocaleString('default', { month: 'long' })}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-white rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Status</p>
                    <div className="flex items-center space-x-1">
                      <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${status.className}`}>
                        {status.text}
                      </span>
                    </div>
                  </div>
                  <div className="p-3 bg-white rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Start Time</p>
                    <div className="flex items-center space-x-1">
                      <Clock size={16} className="text-gray-400" />
                      <p className="font-medium">
                        {record.status === 'ooo' 
                          ? '-'
                          : record.startTime 
                            ? new Date(record.startTime.seconds * 1000).toLocaleTimeString() 
                            : 'Not marked'}
                      </p>
                    </div>
                  </div>
                  <div className="p-3 bg-white rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">End Time</p>
                    <div className="flex items-center space-x-1">
                      <Clock size={16} className="text-gray-400" />
                      <p className="font-medium">
                        {record.status === 'ooo'
                          ? '-'
                          : record.endTime 
                            ? new Date(record.endTime.seconds * 1000).toLocaleTimeString() 
                            : 'Not marked'}
                      </p>
                    </div>
                  </div>
                  <div className="p-3 bg-white rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Location</p>
                    <div className="flex items-center space-x-1">
                      <MapPin size={16} className="text-gray-400" />
                      <p className="font-medium">
                        {record.status === 'ooo' ? 'N/A' : record.location?.name || 'Not available'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {records.length === 0 && (
            <div className="text-center py-8">
              <Clock size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No attendance records found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}