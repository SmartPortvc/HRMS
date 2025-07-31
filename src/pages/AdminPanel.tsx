import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  addDoc,
  doc,
  getDoc,
  onSnapshot,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import toast from "react-hot-toast";

import Sidebar from "../components/AdminPanel/Sidebar";
import UserList from "../components/AdminPanel/UserList";
import AttendanceList from "../components/AdminPanel/AttendanceList";
import WeeklyReports from "../components/AdminPanel/WeeklyReports";
import AttendanceModal from "../components/AdminPanel/AttendanceModal";
import OrganizationList from "../components/AdminPanel/OrganizationList";
import AttendanceReport from "../components/AdminPanel/AttendanceReport";
import DocumentManager from "../components/AdminPanel/DocumentManager";
import SalaryList from "../components/AdminPanel/SalaryList";
import SalaryReport from "../components/AdminPanel/SalaryReport";
import AttendanceAnalysis from "../components/AdminPanel/AttendanceAnalysis";
import NoticeUpload from "../components/AdminPanel/NoticeUpload";
import MasterData from "../components/AdminPanel/MasterData";

type View =
  | "users"
  | "attendance"
  | "reports"
  | "organizations"
  | "attendance-report"
  | "documents"
  | "salaries"
  | "salary-report"
  | "analysis"
  | "notices"
  | "master-data";

export default function AdminPanel() {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<View>("organizations");
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [allAttendance, setAllAttendance] = useState<any[]>([]);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [weeklyReports, setWeeklyReports] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeOrgs = onSnapshot(
      collection(db, "organizations"),
      async (snapshot) => {
        const orgs = await Promise.all(
          snapshot.docs.map(async (doc) => {
            const orgData = { id: doc.id, ...doc.data() };
            const deptsRef = collection(
              db,
              `organizations/${doc.id}/departments`
            );
            const deptsSnapshot = await getDocs(deptsRef);

            const departments = await Promise.all(
              deptsSnapshot.docs.map(async (deptDoc) => {
                const deptData = { id: deptDoc.id, ...deptDoc.data() };
                const usersRef = collection(db, "users");
                const q = query(
                  usersRef,
                  where("departmentId", "==", deptDoc.id)
                );
                const usersSnapshot = await getDocs(q);

                const users = usersSnapshot.docs.map((userDoc) => ({
                  id: userDoc.id,
                  ...userDoc.data(),
                }));

                return { ...deptData, users };
              })
            );

            return { ...orgData, departments };
          })
        );

        setOrganizations(orgs);
      }
    );

    const unsubscribeUsers = onSnapshot(
      query(collection(db, "users"), where("role", "!=", "admin")),
      (snapshot) => {
        const userData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(userData);
      }
    );

    return () => {
      unsubscribeOrgs();
      unsubscribeUsers();
    };
  }, []);

  useEffect(() => {
    if (currentView === "attendance") {
      fetchAllAttendance();
    } else if (currentView === "reports") {
      fetchWeeklyReports();
    }
  }, [currentView]);

  const fetchAllAttendance = async () => {
    try {
      const attendanceRef = collection(db, "attendance");
      const querySnapshot = await getDocs(attendanceRef);
      const records = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const userDetails = new Map();
      const uniqueUserIds = [
        ...new Set(records.map((record) => record.userId)),
      ];

      await Promise.all(
        uniqueUserIds.map(async (userId) => {
          const userRef = collection(db, "users");
          const q = query(userRef, where("uid", "==", userId));
          const userSnapshot = await getDocs(q);
          if (!userSnapshot.empty) {
            userDetails.set(userId, userSnapshot.docs[0].data());
          }
        })
      );

      const enrichedRecords = records.map((record) => ({
        ...record,
        user: userDetails.get(record.userId),
      }));

      enrichedRecords.sort((a, b) => b.date.seconds - a.date.seconds);
      setAllAttendance(enrichedRecords);
    } catch (error) {
      console.error("Error fetching attendance:", error);
      toast.error("Failed to fetch attendance records");
    }
  };

  const fetchWeeklyReports = async () => {
    try {
      const reportsRef = collection(db, "weekly_reports");
      const reportsSnapshot = await getDocs(reportsRef);
      const reports = reportsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const userDetails = new Map();
      const uniqueUserIds = [
        ...new Set(reports.map((report) => report.userId)),
      ];

      await Promise.all(
        uniqueUserIds.map(async (userId) => {
          const userRef = collection(db, "users");
          const q = query(userRef, where("uid", "==", userId));
          const userSnapshot = await getDocs(q);
          if (!userSnapshot.empty) {
            userDetails.set(userId, userSnapshot.docs[0].data());
          }
        })
      );

      const enrichedReports = reports.map((report) => ({
        ...report,
        user: userDetails.get(report.userId),
      }));
      enrichedReports.sort(
        (a, b) => b.submittedAt.seconds - a.submittedAt.seconds
      );

      setWeeklyReports(enrichedReports);
    } catch (error) {
      console.error("Error fetching weekly reports:", error);
      toast.error("Failed to fetch weekly reports");
    }
  };

  const fetchUserAttendance = async (userId: string) => {
    try {
      const attendanceRef = collection(db, "attendance");
      const q = query(attendanceRef, where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      const records = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      records.sort((a, b) => b.date.seconds - a.date.seconds);
      setAttendanceRecords(records);
      setShowAttendanceModal(true);
    } catch (error) {
      console.error("Error fetching attendance:", error);
      toast.error("Failed to fetch attendance records");
    }
  };

  const handleCreateOrganization = async (
    name: string,
    description: string
  ) => {
    try {
      await addDoc(collection(db, "organizations"), {
        name,
        description,
        createdAt: new Date(),
      });

      toast.success("Organization created successfully");
    } catch (error) {
      console.error("Error creating organization:", error);
      toast.error("Failed to create organization");
    }
  };

  const handleCreateDepartment = async (
    orgId: string,
    name: string,
    description: string
  ) => {
    try {
      await addDoc(collection(db, `organizations/${orgId}/departments`), {
        name,
        description,
        createdAt: new Date(),
      });

      toast.success("Division created successfully");
    } catch (error) {
      console.error("Error creating Division:", error);
      toast.error("Failed to create Division");
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      toast.error("Error signing out");
    }
  };

  const handleViewAttendance = (user: any) => {
    setSelectedUser(user);
    fetchUserAttendance(user.uid);
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        onSignOut={handleSignOut}
      />

      <div className="flex-1 p-8">
        {currentView === "organizations" && (
          <OrganizationList
            organizations={organizations}
            onCreateOrganization={handleCreateOrganization}
            onCreateDepartment={handleCreateDepartment}
          />
        )}

        {currentView === "master-data" && <MasterData />}

        {currentView === "users" && (
          <UserList users={users} onViewAttendance={handleViewAttendance} />
        )}

        {currentView === "salaries" && <SalaryList users={users} />}

        {currentView === "salary-report" && <SalaryReport />}

        {currentView === "attendance" && (
          <AttendanceList records={allAttendance} />
        )}

        {currentView === "attendance-report" && <AttendanceReport />}

        {currentView === "analysis" && <AttendanceAnalysis />}

        {currentView === "reports" && <WeeklyReports reports={weeklyReports} />}

        {currentView === "documents" && <DocumentManager />}

        {currentView === "notices" && <NoticeUpload />}
      </div>

      {showAttendanceModal && (
        <AttendanceModal
          onClose={() => setShowAttendanceModal(false)}
          records={attendanceRecords}
          userName={selectedUser?.name}
        />
      )}
    </div>
  );
}
