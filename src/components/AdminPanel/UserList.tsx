import React, { useState } from 'react';
import { Users, Clock, Search } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  designation: string;
  uid: string;
}

interface UserListProps {
  users: User[];
  onViewAttendance: (user: User) => void;
}

export default function UserList({ users, onViewAttendance }: UserListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold flex items-center">
            <Users size={20} className="mr-2" />
            Registered Users
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Total Employees: {users.length}
          </p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
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
              onClick={() => onViewAttendance(user)}
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
            <p className="text-gray-500">
              {searchQuery ? 'No users found matching your search' : 'No users found'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}