import React, { useState } from 'react';
import { Users, Clock, Search, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import toast from 'react-hot-toast';

interface User {
  id: string;
  name: string;
  email: string;
  designation: string;
  uid: string;
  organizationId: string;
  departmentId: string;
  department?: {
    name: string;
  };
}

interface SalaryListProps {
  users: User[];
}

export default function SalaryList({ users: initialUsers }: SalaryListProps) {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<string[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  React.useEffect(() => {
    enrichUsersWithDepartments();
  }, [initialUsers]);

  const enrichUsersWithDepartments = async () => {
    try {
      const uniqueDepartments = new Set<string>();
      const enrichedUsers = await Promise.all(
        initialUsers.map(async (user) => {
          if (user.organizationId && user.departmentId) {
            const deptRef = doc(db, `organizations/${user.organizationId}/departments`, user.departmentId);
            const deptSnap = await getDoc(deptRef);
            if (deptSnap.exists()) {
              const deptName = deptSnap.data().name;
              uniqueDepartments.add(deptName);
              return {
                ...user,
                department: { name: deptName }
              };
            }
          }
          return user;
        })
      );

      setDepartments(Array.from(uniqueDepartments).sort());
      setUsers(enrichedUsers);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast.error('Failed to fetch departments');
      setLoading(false);
    }
  };

  const handleSalaryClick = (user: User) => {
    navigate('/salary-form', { state: { user } });
  };

  const filteredUsers = users.filter(user => {
    const matchesDepartment = selectedDepartment === 'all' || user.department?.name === selectedDepartment;
    const searchString = searchQuery.toLowerCase();
    const matchesSearch = 
      user.name.toLowerCase().includes(searchString) ||
      user.email.toLowerCase().includes(searchString) ||
      user.designation.toLowerCase().includes(searchString) ||
      user.department?.name.toLowerCase().includes(searchString);

    return matchesDepartment && matchesSearch;
  });

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold flex items-center">
          <Users size={24} className="mr-2" />
          Salary Management
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="relative">
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="pl-10 pr-8 py-2 w-full border border-gray-300 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Divisions</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by name, designation, or division..."
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
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-sm text-gray-600">{user.designation}</span>
                {user.department && (
                  <>
                    <span className="text-gray-400">•</span>
                    <span className="text-sm text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                      {user.department.name}
                    </span>
                  </>
                )}
              </div>
            </div>
            <button
              onClick={() => handleSalaryClick(user)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
            >
              <Clock size={16} />
              <span>Manage Salary</span>
            </button>
          </div>
        ))}
        {filteredUsers.length === 0 && (
          <div className="text-center py-8">
            <Users size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">
              {searchQuery
                ? 'No users found matching your search criteria'
                : selectedDepartment === 'all'
                ? 'No users found'
                : `No users found in ${selectedDepartment} department`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}