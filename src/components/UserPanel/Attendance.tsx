import React from 'react';
import { Calendar } from 'lucide-react';
import holidays from '../../data/holidays.json';

export default function Attendance() {
  const displayDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const today = new Date();
  const todayString = today.toISOString().split('T')[0];
  
  // Check if today is a weekend
  const isWeekend = today.getDay() === 0 || (today.getDay() === 6 && today.getDate() % 2 === 0); // Sunday or 2nd Saturday
  
  // Check if today is a holiday
  const publicHoliday = holidays.publicHolidays.find(h => h.date === todayString);
  const optionalHoliday = holidays.optionalHolidays.find(h => h.date === todayString);
  
  const holidayInfo = publicHoliday || optionalHoliday;
  const holidayType = publicHoliday ? 'Public Holiday' : optionalHoliday ? 'Optional Holiday' : null;

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="flex items-center mb-6">
        <Calendar className="mr-2 text-blue-500" size={24} />
        <h2 className="text-xl font-semibold">Attendance Status</h2>
      </div>

      <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
        <div className="text-sm text-gray-600 mb-2">
          {displayDate}
        </div>
        
        <p className="text-lg font-medium mb-2">
          <span className="text-blue-600 font-semibold">
            {isWeekend ? 'Weekend' : 'Working Day'}
          </span>
        </p>

        {(holidayInfo || isWeekend) && (
          <div className={`mt-4 p-4 rounded ${
            isWeekend ? 'bg-purple-50 border border-purple-200' :
            holidayType === 'Public Holiday' ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'
          }`}>
            <div className="flex items-start">
              <div className="flex-grow">
                {isWeekend ? (
                  <p className="font-medium text-purple-700">Today is a Weekend</p>
                ) : (
                  <p className="font-medium text-red-700">Today is a {holidayType}</p>
                )}
                {holidayInfo && (
                  <p className="text-gray-700 mt-1">{holidayInfo.name}</p>
                )}
                <p className="text-sm mt-2 text-gray-600">
                  If you're working today, please post your attendance.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 p-3 rounded bg-green-50 border border-green-200">
          <p className="text-sm">Please submit your attendance for today.</p>
        </div>
      </div>
    </div>
  );
}