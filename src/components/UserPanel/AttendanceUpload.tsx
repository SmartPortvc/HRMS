import React, { useState, useEffect } from 'react';
import { Clock, Calendar, CheckCircle, XCircle, FileText, MapPin, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getCurrentLocation, findNearestOffice } from '../../utils/locationUtils';
import holidays from '../../data/holidays.json';
import toast from 'react-hot-toast';

interface AttendanceUploadProps {
  todayAttendance: any;
  isFriday: boolean;
  weeklyReport: string;
  onWeeklyReportChange: (report: string) => void;
  onMarkAttendance: (type: 'start' | 'end' | 'ooo', location?: { name: string; latitude: number; longitude: number }) => Promise<void>;
  onSubmitWeeklyReport: () => void;
}

export default function AttendanceUpload({
  todayAttendance,
  isFriday,
  weeklyReport,
  onWeeklyReportChange,
  onMarkAttendance,
  onSubmitWeeklyReport
}: AttendanceUploadProps) {
  const [showHolidayAlert, setShowHolidayAlert] = useState(false);
  const [holidayInfo, setHolidayInfo] = useState<{ name: string; type: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    checkHoliday();
    checkLocation();
  }, []);

  const checkLocation = async () => {
    try {
      const location = await getCurrentLocation();
      setCurrentLocation(location);
      setLocationError(null);
    } catch (error) {
      setLocationError((error as Error).message);
    }
  };

  const checkHoliday = () => {
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    const dayOfWeek = today.getDay();
    const dateOfMonth = today.getDate();
    
    const isWeekend = dayOfWeek === 0 || (dayOfWeek === 6 && (Math.floor((dateOfMonth - 1) / 7) + 1) % 2 === 0);
    const publicHoliday = holidays.publicHolidays.find(h => h.date === todayString);
    const optionalHoliday = holidays.optionalHolidays.find(h => h.date === todayString);
    
    if (isWeekend || publicHoliday || optionalHoliday) {
      setShowHolidayAlert(true);
      setHolidayInfo({
        name: publicHoliday?.name || optionalHoliday?.name || 'Weekend',
        type: isWeekend ? 'Weekend' : publicHoliday ? 'Public Holiday' : 'Optional Holiday'
      });
    }
  };

  const handleAttendanceClick = async (type: 'start' | 'end') => {
    setIsSubmitting(true);
    try {
      if (!currentLocation) {
        await checkLocation();
        if (!currentLocation) {
          throw new Error('Unable to get your location');
        }
      }

      const { office, distance } = findNearestOffice(currentLocation.latitude, currentLocation.longitude);
      
      if (!office || distance > 500) {
        toast.error(`You are not within 500 meters of any office location. Nearest office is ${Math.round(distance)}m away.`);
        return;
      }

      await onMarkAttendance(type, {
        name: office.name,
        latitude: office.latitude,
        longitude: office.longitude
      });

      toast.success(`Attendance marked at ${office.name}`);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOutOfOffice = async () => {
    try {
      await onMarkAttendance('ooo');
      toast.success('Out of office status marked successfully');
    } catch (error) {
      toast.error('Failed to mark out of office status');
    }
  };

  const formatTime = (timestamp: { seconds: number }) => {
    if (!timestamp) return null;
    return new Date(timestamp.seconds * 1000).toLocaleTimeString();
  };

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {showHolidayAlert && holidayInfo && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className={`p-4 rounded-lg shadow-md ${
              holidayInfo.type === 'Weekend' ? 'bg-purple-50 border border-purple-200' :
              holidayInfo.type === 'Public Holiday' ? 'bg-red-50 border border-red-200' :
              'bg-amber-50 border border-amber-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Calendar className={`${
                  holidayInfo.type === 'Weekend' ? 'text-purple-500' :
                  holidayInfo.type === 'Public Holiday' ? 'text-red-500' :
                  'text-amber-500'
                }`} size={24} />
                <div>
                  <h3 className={`font-semibold ${
                    holidayInfo.type === 'Weekend' ? 'text-purple-700' :
                    holidayInfo.type === 'Public Holiday' ? 'text-red-700' :
                    'text-amber-700'
                  }`}>
                    Today is a {holidayInfo.type}
                  </h3>
                  {holidayInfo.type !== 'Weekend' && (
                    <p className="text-gray-600">{holidayInfo.name}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowHolidayAlert(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle size={20} />
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              If you're working today, you can still mark your attendance below.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-6">Upload Attendance</h2>

        {locationError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{locationError}</p>
            <button
              onClick={checkLocation}
              className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
            >
              Try again
            </button>
          </div>
        )}

        {currentLocation && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-100 rounded-lg">
            <div className="flex items-center space-x-2 text-blue-700">
              <MapPin size={20} />
              <span>Your current location has been detected</span>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.button
              onClick={() => handleAttendanceClick('start')}
              disabled={todayAttendance?.startTime || isSubmitting || !!locationError || todayAttendance?.status === 'ooo'}
              className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-all duration-200 ${
                todayAttendance?.startTime
                  ? 'bg-green-100 text-green-700 cursor-not-allowed'
                  : 'bg-green-500 text-white hover:bg-green-600'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              whileTap={{ scale: 0.95 }}
            >
              <Clock size={20} />
              <span className="font-medium">
                {todayAttendance?.startTime ? 'Work Started' : 'Start Work'}
              </span>
              {todayAttendance?.startTime && (
                <span className="text-sm">({formatTime(todayAttendance.startTime)})</span>
              )}
            </motion.button>
            
            <motion.button
              onClick={() => handleAttendanceClick('end')}
              disabled={!todayAttendance?.startTime || todayAttendance?.endTime || isSubmitting || !!locationError || todayAttendance?.status === 'ooo'}
              className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-all duration-200 ${
                todayAttendance?.endTime
                  ? 'bg-red-100 text-red-700 cursor-not-allowed'
                  : 'bg-red-500 text-white hover:bg-red-600'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              whileTap={{ scale: 0.95 }}
            >
              <Clock size={20} />
              <span className="font-medium">
                {todayAttendance?.endTime ? 'Work Completed' : 'End Work'}
              </span>
              {todayAttendance?.endTime && (
                <span className="text-sm">({formatTime(todayAttendance.endTime)})</span>
              )}
            </motion.button>

            <motion.button
              onClick={handleOutOfOffice}
              disabled={todayAttendance?.startTime || todayAttendance?.status === 'ooo'}
              className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-all duration-200 ${
                todayAttendance?.status === 'ooo'
                  ? 'bg-purple-100 text-purple-700 cursor-not-allowed'
                  : 'bg-purple-500 text-white hover:bg-purple-600'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              whileTap={{ scale: 0.95 }}
            >
              <Home size={20} />
              <span className="font-medium">
                {todayAttendance?.status === 'ooo' ? 'Out Of Office' : 'Mark Out Of Office'}
              </span>
            </motion.button>
          </div>

          {todayAttendance && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200"
            >
              <h3 className="text-lg font-medium mb-3">Today's Attendance</h3>
              <div className="space-y-2">
                <p className="text-gray-600">
                  Date: <span className="font-medium text-gray-800">{new Date().toLocaleDateString()}</span>
                </p>
                {todayAttendance.status === 'ooo' ? (
                  <p className="text-purple-600 font-medium">Status: Out Of Office</p>
                ) : (
                  <>
                    <p className="text-gray-600">
                      Start Time: {' '}
                      <span className="font-medium text-gray-800">
                        {todayAttendance.startTime ? formatTime(todayAttendance.startTime) : 'Not marked'}
                      </span>
                    </p>
                    <p className="text-gray-600">
                      End Time: {' '}
                      <span className="font-medium text-gray-800">
                        {todayAttendance.endTime ? formatTime(todayAttendance.endTime) : 'Not marked'}
                      </span>
                    </p>
                    {todayAttendance.location && (
                      <p className="text-gray-600">
                        Location: {' '}
                        <span className="font-medium text-gray-800">
                          {todayAttendance.location.name}
                        </span>
                      </p>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          )}

          <div className={`mt-8 space-y-4 ${isFriday ? 'bg-blue-50 p-6 rounded-lg border border-blue-100' : 'border-t pt-6'}`}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center">
                <FileText size={20} className="mr-2" />
                Weekly Work Update
              </h3>
              {isFriday && (
                <span className="text-sm font-medium text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
                  Today is Friday!
                </span>
              )}
            </div>
            
            <textarea
              value={weeklyReport}
              onChange={(e) => onWeeklyReportChange(e.target.value)}
              placeholder="Please provide a summary of your work this week..."
              className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500 italic">Please fill this on Friday.</p>
              <motion.button
                onClick={onSubmitWeeklyReport}
                className={`px-6 py-2 text-white rounded-lg transition-colors ${
                  isFriday 
                    ? 'bg-blue-500 hover:bg-blue-600' 
                    : 'bg-gray-500 hover:bg-gray-600'
                }`}
                whileTap={{ scale: 0.95 }}
              >
                Submit Weekly Report
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}