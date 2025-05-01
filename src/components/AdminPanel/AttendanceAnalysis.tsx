import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Calendar, ChevronDown, Building, Search, Clock, CheckCircle, XCircle } from 'lucide-react';
import { collection, query, where, getDocs, Timestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import toast from 'react-hot-toast';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface AttendanceCount {
  userId: string;
  userName: string;
  designation: string;
  departmentName: string;
  workDays: number;
  totalHours: number;
  avgHoursPerDay: number;
  onTimeCount: number;
  lateCount: number;
  earlyLeaveCount: number;
  overtimeCount: number;
}

interface Department {
  id: string;
  name: string;
  organizationId: string;
}

interface AttendanceStats {
  totalEmployees: number;
  totalWorkDays: number;
  avgAttendance: number;
  avgWorkHours: number;
  onTimePercentage: number;
  latePercentage: number;
  earlyLeavePercentage: number;
  overtimePercentage: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function AttendanceAnalysis() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toLocaleString('default', { month: 'long' })
  );
  const [selectedYear, setSelectedYear] = useState<string>(
    new Date().getFullYear().toString()
  );
  const [attendanceCounts, setAttendanceCounts] = useState<AttendanceCount[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats>({
    totalEmployees: 0,
    totalWorkDays: 0,
    avgAttendance: 0,
    avgWorkHours: 0,
    onTimePercentage: 0,
    latePercentage: 0,
    earlyLeavePercentage: 0,
    overtimePercentage: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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
    fetchAttendanceCounts();
  }, [selectedDepartment, selectedMonth, selectedYear]);

  const fetchDepartments = async () => {
    try {
      const departments: Department[] = [];
      const orgsRef = collection(db, 'organizations');
      const orgsSnapshot = await getDocs(orgsRef);

      for (const orgDoc of orgsSnapshot.docs) {
        const deptsRef = collection(db, `organizations/${orgDoc.id}/departments`);
        const deptsSnapshot = await getDocs(deptsRef);
        
        deptsSnapshot.docs.forEach(deptDoc => {
          departments.push({
            id: deptDoc.id,
            name: deptDoc.data().name,
            organizationId: orgDoc.id
          });
        });
      }

      setDepartments(departments);
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast.error('Failed to fetch departments');
    }
  };

  const fetchAttendanceCounts = async () => {
    try {
      setLoading(true);
      const attendanceRef = collection(db, 'attendance');
      
      // Get the date range for the selected month and year
      const startDate = new Date(parseInt(selectedYear), months.indexOf(selectedMonth), 1);
      const endDate = new Date(parseInt(selectedYear), months.indexOf(selectedMonth) + 1, 0);
      
      // Create the query
      const q = query(
        attendanceRef,
        where('date', '>=', Timestamp.fromDate(startDate)),
        where('date', '<=', Timestamp.fromDate(endDate))
      );

      const querySnapshot = await getDocs(q);
      const attendanceRecords = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Get unique user IDs from attendance records
      const userIds = [...new Set(attendanceRecords.map(record => record.userId))];

      // Fetch user details and calculate attendance metrics
      const userCounts: AttendanceCount[] = await Promise.all(
        userIds.map(async (userId) => {
          // Fetch user details
          const userRef = collection(db, 'users');
          const userQuery = query(userRef, where('uid', '==', userId));
          const userSnapshot = await getDocs(userQuery);
          const userData = userSnapshot.docs[0]?.data();

          let departmentName = 'N/A';
          if (userData?.organizationId && userData?.departmentId) {
            const deptRef = doc(db, `organizations/${userData.organizationId}/departments`, userData.departmentId);
            const deptSnap = await getDoc(deptRef);
            if (deptSnap.exists()) {
              departmentName = deptSnap.data().name;
            }
          }

          // Filter attendance records for this user
          const userAttendance = attendanceRecords.filter(record => record.userId === userId);

          // Calculate metrics
          let workDays = 0;
          let totalHours = 0;
          let onTimeCount = 0;
          let lateCount = 0;
          let earlyLeaveCount = 0;
          let overtimeCount = 0;

          userAttendance.forEach(record => {
            if (record.startTime && record.endTime) {
              workDays += 1;
              const startTime = new Date(record.startTime.seconds * 1000);
              const endTime = new Date(record.endTime.seconds * 1000);
              const hoursWorked = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
              totalHours += hoursWorked;

              // Check if on time (before 9:30 AM)
              const startHour = startTime.getHours();
              const startMinutes = startTime.getMinutes();
              if (startHour < 9 || (startHour === 9 && startMinutes <= 30)) {
                onTimeCount++;
              } else {
                lateCount++;
              }

              // Check if early leave (before 5:30 PM)
              const endHour = endTime.getHours();
              const endMinutes = endTime.getMinutes();
              if (endHour < 17 || (endHour === 17 && endMinutes < 30)) {
                earlyLeaveCount++;
              }

              // Check if overtime (after 6:30 PM)
              if (endHour > 18 || (endHour === 18 && endMinutes > 30)) {
                overtimeCount++;
              }
            }
          });

          return {
            userId,
            userName: userData?.name || 'Unknown',
            designation: userData?.designation || 'N/A',
            departmentName,
            workDays,
            totalHours: Math.round(totalHours * 10) / 10,
            avgHoursPerDay: workDays > 0 ? Math.round((totalHours / workDays) * 10) / 10 : 0,
            onTimeCount,
            lateCount,
            earlyLeaveCount,
            overtimeCount
          };
        })
      );

      // Filter by department if selected
      const filteredCounts = selectedDepartment === 'all'
        ? userCounts
        : userCounts.filter(count => 
            count.departmentName === departments.find(d => d.id === selectedDepartment)?.name
          );

      // Calculate overall statistics
      const stats: AttendanceStats = {
        totalEmployees: filteredCounts.length,
        totalWorkDays: filteredCounts.reduce((sum, user) => sum + user.workDays, 0),
        avgAttendance: filteredCounts.reduce((sum, user) => sum + user.workDays, 0) / filteredCounts.length || 0,
        avgWorkHours: filteredCounts.reduce((sum, user) => sum + user.totalHours, 0) / filteredCounts.length || 0,
        onTimePercentage: (filteredCounts.reduce((sum, user) => sum + user.onTimeCount, 0) / 
          filteredCounts.reduce((sum, user) => sum + user.workDays, 0)) * 100 || 0,
        latePercentage: (filteredCounts.reduce((sum, user) => sum + user.lateCount, 0) / 
          filteredCounts.reduce((sum, user) => sum + user.workDays, 0)) * 100 || 0,
        earlyLeavePercentage: (filteredCounts.reduce((sum, user) => sum + user.earlyLeaveCount, 0) / 
          filteredCounts.reduce((sum, user) => sum + user.workDays, 0)) * 100 || 0,
        overtimePercentage: (filteredCounts.reduce((sum, user) => sum + user.overtimeCount, 0) / 
          filteredCounts.reduce((sum, user) => sum + user.workDays, 0)) * 100 || 0,
      };

      setAttendanceStats(stats);
      setAttendanceCounts(filteredCounts);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching attendance counts:', error);
      toast.error('Failed to fetch attendance data');
      setLoading(false);
    }
  };

  const attendanceStatusData = [
    { name: 'On Time', value: Math.round(attendanceStats.onTimePercentage) },
    { name: 'Late', value: Math.round(attendanceStats.latePercentage) },
    { name: 'Early Leave', value: Math.round(attendanceStats.earlyLeavePercentage) },
    { name: 'Overtime', value: Math.round(attendanceStats.overtimePercentage) }
  ];

  const departmentAttendanceData = departments.map(dept => {
    const deptUsers = attendanceCounts.filter(user => user.departmentName === dept.name);
    return {
      name: dept.name,
      value: deptUsers.reduce((sum, user) => sum + user.workDays, 0)
    };
  });

  const filteredAttendance = attendanceCounts.filter(record => {
    const searchString = searchQuery.toLowerCase();
    return (
      record.userName.toLowerCase().includes(searchString) ||
      record.designation.toLowerCase().includes(searchString) ||
      record.departmentName.toLowerCase().includes(searchString)
    );
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold flex items-center">
            <FileSpreadsheet size={24} className="mr-2" />
            Attendance Analysis
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
          <>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h3 className="text-sm text-gray-600 mb-1">Total Employees</h3>
                <p className="text-2xl font-bold text-blue-600">{attendanceStats.totalEmployees}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                <h3 className="text-sm text-gray-600 mb-1">Average Attendance</h3>
                <p className="text-2xl font-bold text-green-600">
                  {Math.round(attendanceStats.avgAttendance * 10) / 10} days
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                <h3 className="text-sm text-gray-600 mb-1">Average Work Hours</h3>
                <p className="text-2xl font-bold text-purple-600">
                  {Math.round(attendanceStats.avgWorkHours * 10) / 10} hrs
                </p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                <h3 className="text-sm text-gray-600 mb-1">Total Work Days</h3>
                <p className="text-2xl font-bold text-orange-600">{attendanceStats.totalWorkDays}</p>
              </div>
              <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
                <h3 className="text-sm text-gray-600 mb-1 flex items-center">
                  <Clock size={16} className="mr-1" />
                  On Time Rate
                </h3>
                <p className="text-2xl font-bold text-emerald-600">
                  {Math.round(attendanceStats.onTimePercentage)}%
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Clock size={20} className="mr-2" />
                  Attendance Status Distribution
                </h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <CheckCircle size={16} className="text-green-500 mr-2" />
                        <span className="text-sm font-medium">On Time</span>
                      </div>
                      <span className="text-lg font-bold text-green-600">
                        {Math.round(attendanceStats.onTimePercentage)}%
                      </span>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <XCircle size={16} className="text-red-500 mr-2" />
                        <span className="text-sm font-medium">Late</span>
                      </div>
                      <span className="text-lg font-bold text-red-600">
                        {Math.round(attendanceStats.latePercentage)}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={attendanceStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {attendanceStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Division-wise Attendance</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={departmentAttendanceData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {departmentAttendanceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Division</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Working Days</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Hours</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Hours/Day</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">On Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Late</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAttendance.map((record) => (
                    <tr key={record.userId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium text-gray-900">{record.userName}</div>
                          <div className="text-sm text-gray-500">{record.designation}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{record.departmentName}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {record.workDays} days
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {record.totalHours} hrs
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                          {record.avgHoursPerDay} hrs
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {record.onTimeCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          {record.lateCount}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}