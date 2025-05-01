import React from 'react';
import { Calendar, ChevronDown, FileText } from 'lucide-react';
import { formatDate, getWeekRange } from '../../utils/dateUtils';

interface AttendanceRecord {
  id: string;
  date: { seconds: number };
  startTime?: { seconds: number };
  endTime?: { seconds: number };
  status?: 'present' | 'ooo';
  location?: {
    name: string;
    latitude: number;
    longitude: number;
  };
}

interface AttendanceTrackerProps {
  filteredAttendance: any[];
  weeklyReports: any[];
  selectedMonth: string;
  selectedYear: string;
  months: string[];
  years: string[];
  onMonthChange: (month: string) => void;
  onYearChange: (year: string) => void;
}

export default function AttendanceTracker({
  filteredAttendance,
  weeklyReports,
  selectedMonth,
  selectedYear,
  months,
  years,
  onMonthChange,
  onYearChange
}: AttendanceTrackerProps) {
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
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold flex items-center">
            <Calendar size={24} className="mr-2" />
            Track Attendance
          </h2>
          <div className="flex space-x-4">
            <div className="relative">
              <select
                value={selectedMonth}
                onChange={(e) => onMonthChange(e.target.value)}
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
                onChange={(e) => onYearChange(e.target.value)}
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

        <div className="space-y-4">
          {filteredAttendance.map((record) => {
            const status = getAttendanceStatus(record);
            return (
              <div key={record.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <p className="font-semibold">
                    {formatDate(new Date(record.date.seconds * 1000))}
                  </p>
                  <span className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                    {record.month}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${status.className}`}>
                      {status.text}
                    </span>
                  </div>
                  {record.status !== 'ooo' && (
                    <>
                      <p className="text-sm text-gray-600">
                        Start: {record.startTime ? new Date(record.startTime.seconds * 1000).toLocaleTimeString() : 'Not marked'}
                      </p>
                      <p className="text-sm text-gray-600">
                        End: {record.endTime ? new Date(record.endTime.seconds * 1000).toLocaleTimeString() : 'Not marked'}
                      </p>
                      {record.location && (
                        <p className="text-sm text-gray-600 mt-1">
                          Location: {record.location.name}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
          {filteredAttendance.length === 0 && (
            <div className="text-center py-8">
              <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No attendance records found for {selectedMonth} {selectedYear}</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-6 flex items-center">
          <FileText size={20} className="mr-2" />
          Weekly Reports History
        </h2>
        <div className="space-y-6">
          {weeklyReports.map((report) => (
            <div key={report.id} className="bg-gray-50 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm font-medium text-blue-600">
                  Week: {getWeekRange(new Date(report.weekEnding.seconds * 1000))}
                </p>
                <p className="text-xs text-gray-500">
                  Submitted: {formatDate(new Date(report.submittedAt.seconds * 1000))}
                </p>
              </div>
              <div className="bg-white rounded p-4">
                <p className="text-gray-700 whitespace-pre-wrap">{report.report}</p>
              </div>
            </div>
          ))}
          {weeklyReports.length === 0 && (
            <div className="text-center py-8">
              <FileText size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No weekly reports found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}