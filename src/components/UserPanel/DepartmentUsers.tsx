import React, { useState, useEffect, useCallback } from "react";
import { Users, Clock, Search } from "lucide-react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";
import toast from "react-hot-toast";
import AttendanceModal from "../AdminPanel/AttendanceModal";
import { useCurrentUser } from "../../hooks/useCurrentUser";

interface User {
  id: string;
  name: string;
  email: string;
  designation: string;
  uid: string;
  departmentId: string;
}

interface AttendanceRecord {
  id: string;
  date: {
    seconds: number;
    nanoseconds: number;
  };
  [key: string]: any;
}

export default function DepartmentUsers() {
  const { userData, loading: userLoading } = useCurrentUser();

  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState<
    AttendanceRecord[]
  >([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const departmentId = userData?.departmentId;

  const fetchUsers = useCallback(async () => {
    if (!departmentId) return;

    setLoading(true);
    setError(null);

    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("departmentId", "==", departmentId));
      const querySnapshot = await getDocs(q);
      const usersList: User[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as User),
      }));
      setUsers(usersList);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch users");
      toast.error("Failed to fetch department users");
    } finally {
      setLoading(false);
    }
  }, [departmentId]);

  useEffect(() => {
    if (departmentId) {
      fetchUsers();
    }
  }, [departmentId, fetchUsers]);

  const handleViewAttendance = async (user: User) => {
    try {
      const attendanceRef = collection(db, "attendance");
      const q = query(attendanceRef, where("userId", "==", user.uid));
      const querySnapshot = await getDocs(q);
      const records: AttendanceRecord[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as AttendanceRecord),
      }));

      records.sort((a, b) => b.date.seconds - a.date.seconds);
      setAttendanceRecords(records);
      setSelectedUser(user);
      setShowAttendanceModal(true);
    } catch (error) {
      console.error("Error fetching attendance:", error);
      toast.error("Failed to fetch attendance records");
    }
  };

  const filteredUsers = users.filter((user) =>
    [user.name, user.email, user.designation].some((field) =>
      field.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  if (loading || userLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

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
        <Search
          size={20}
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
        />
      </div>

      {error ? (
        <div className="text-center py-8 text-red-500">{error}</div>
      ) : (
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
      )}

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
