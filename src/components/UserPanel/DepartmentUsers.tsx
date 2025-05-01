import React, { useState } from 'react';
import { Users, Clock, Search, ChevronDown } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import toast from 'react-hot-toast';
import AttendanceModal from '../AdminPanel/AttendanceModal';

interface User {
  id: string;
  name: string;
  email: string;
  designation: string;
  uid: string;
}

interface DepartmentUsersProps {
  users: User[];
}

export default function DepartmentUsers({ users }: DepartmentUsersProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const handleViewAttendance = async (user: User) => {
    try {
      const attendanceRef = collection(db, 'attendance');
      const q = query(attendanceRef, where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const records = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      records.sort((a, b) => b.date.seconds - a.date.seconds);
      
      setAttendanceRecords(records);
      setSelectedUser(user);
      setShowAttendanceModal(true);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast.error('Failed to fetch attendance records');
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.designation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold flex items-center">
          <Users size={24} className="mr-2" />
          Department Users
        </h2>
      </div>

      <div className="mb-6 relative">
        <input
          type="text"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-10 py-2 border border-gray-300 rounded-lg"
        />
        <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
      </div>

      <div className="space-y-4">
        {filteredUsers.map((user) => (
          <div
            key={user.id}
            className="p-4 bg-gray-50 rounded-lg flex items-center justify-between hover:bg-gray-100 transition-colors"
          >
            <div>
              <p className="font-semibold">{user.name}</p>
              <p className="text-sm text-gray-600">{user.email}</p>
              <p className="text-sm text-gray-600">{user.designation}</p>
            </div>
            <button
              onClick={() => handleViewAttendance(user)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
            >
              <Clock size={16} />
              <span>View Attendance</span>
            </button>
          </div>
        ))}
        {filteredUsers.length === 0 && (
          <div className="text-center py-8">
            <Users size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No users found</p>
          </div>
        )}
      </div>

      {showAttendanceModal && selectedUser && (
        <AttendanceModal
          onClose={() => setShowAttendanceModal(false)}
          records={attendanceRecords}
          userName={selectedUser.name}
        />
      )}
    </div>
  );
}