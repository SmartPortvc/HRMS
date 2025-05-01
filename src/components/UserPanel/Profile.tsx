import React, { useState, useEffect } from 'react';
import { User, Building, Lock, Briefcase, Calendar, MapPin, Phone, GraduationCap, FileText, Mail, Shield, AlertCircle } from 'lucide-react';
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { db, auth } from '../../lib/firebase';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

interface ProfileProps {
  userId: string;
}

export default function Profile({ userId }: ProfileProps) {
  const [userData, setUserData] = useState<any>(null);
  const [departmentAdmin, setDepartmentAdmin] = useState<string>('');
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'personal' | 'security'>('personal');

  useEffect(() => {
    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  const fetchUserData = async () => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('uid', '==', userId));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const user = querySnapshot.docs[0].data();
        setUserData(user);

        if (user?.organizationId) {
          const orgRef = doc(db, 'organizations', user.organizationId);
          const orgDoc = await getDoc(orgRef);
          if (orgDoc.exists()) {
            user.organizationName = orgDoc.data().name;
          }

          if (user?.departmentId) {
            const deptRef = doc(db, `organizations/${user.organizationId}/departments`, user.departmentId);
            const deptDoc = await getDoc(deptRef);
            if (deptDoc.exists()) {
              user.departmentName = deptDoc.data().name;
            }

            const adminQuery = query(
              usersRef,
              where('departmentId', '==', user.departmentId),
              where('role', '==', 'department_admin')
            );
            const adminSnapshot = await getDocs(adminQuery);
            if (!adminSnapshot.empty) {
              setDepartmentAdmin(adminSnapshot.docs[0].data().name);
            }
          }
        }

        setUserData(user);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Failed to fetch user data');
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwords.new !== passwords.confirm) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwords.new.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user?.email) {
        toast.error('User email not found');
        return;
      }

      const credential = EmailAuthProvider.credential(user.email, passwords.current);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, passwords.new);

      toast.success('Password updated successfully');
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (error: any) {
      console.error('Error updating password:', error);
      if (error.code === 'auth/wrong-password') {
        toast.error('Current password is incorrect');
      } else {
        toast.error('Failed to update password');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6">
          <div className="flex items-center space-x-4">
            <div className="bg-white p-3 rounded-full">
              <User size={32} className="text-blue-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{userData?.name}</h1>
              <p className="text-blue-100">{userData?.designation}</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => setActiveSection('personal')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                activeSection === 'personal'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <User size={20} />
              <span>Personal Info</span>
            </button>
            <button
              onClick={() => setActiveSection('security')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                activeSection === 'security'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Shield size={20} />
              <span>Security</span>
            </button>
          </div>

          {activeSection === 'personal' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Mail className="text-blue-600" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{userData?.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <FileText className="text-purple-600" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Employee ID</p>
                    <p className="font-medium">{userData?.employeeId}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Building className="text-green-600" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Organization</p>
                    <p className="font-medium">{userData?.organizationName}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Building className="text-indigo-600" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Division</p>
                    <p className="font-medium">{userData?.departmentName}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Briefcase className="text-amber-600" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Employment Type</p>
                    <p className="font-medium">
                      {userData?.employmentType.charAt(0).toUpperCase() + userData?.employmentType.slice(1)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-rose-100 rounded-lg">
                    <Calendar className="text-rose-600" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date of Joining</p>
                    <p className="font-medium">{userData?.doj}</p>
                  </div>
                </div>
              </div>

              {userData?.employmentType !== 'regular' && userData?.ced && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <AlertCircle className="text-red-600" size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Contract End Date</p>
                      <p className="font-medium">{userData?.ced}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-teal-100 rounded-lg">
                    <MapPin className="text-teal-600" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Work Location</p>
                    <p className="font-medium">{userData?.workLocation}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-cyan-100 rounded-lg">
                    <Phone className="text-cyan-600" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Contact Number</p>
                    <p className="font-medium">{userData?.emergencyContact}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-pink-100 rounded-lg">
                    <GraduationCap className="text-pink-600" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Education</p>
                    <p className="font-medium">{userData?.education}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <FileText className="text-orange-600" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Aadhaar Number</p>
                    <p className="font-medium">{userData?.aadhaar}</p>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <MapPin className="text-emerald-600" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="font-medium mt-1">{userData?.address}</p>
                  </div>
                </div>
              </div>

              {departmentAdmin && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-violet-100 rounded-lg">
                      <User className="text-violet-600" size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Division Admin</p>
                      <p className="font-medium">{departmentAdmin}</p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeSection === 'security' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="max-w-md mx-auto"
            >
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      Please ensure your new password is at least 6 characters long and contains a mix of letters, numbers, and special characters.
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="password"
                      value={passwords.current}
                      onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="password"
                      value={passwords.new}
                      onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="password"
                      value={passwords.confirm}
                      onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center space-x-2"
                >
                  <Shield size={20} />
                  <span>Update Password</span>
                </button>
              </form>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}