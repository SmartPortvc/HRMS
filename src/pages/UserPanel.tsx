import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  orderBy,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import toast from "react-hot-toast";

import UserSidebar from "../components/UserPanel/UserSidebar";
import Profile from "../components/UserPanel/Profile";
import AttendanceUpload from "../components/UserPanel/AttendanceUpload";
import AttendanceTracker from "../components/UserPanel/AttendanceTracker";
import DocumentUpload from "../components/UserPanel/DocumentUpload";
import PaySlip from "../components/UserPanel/PaySlip";
import SalaryReport from "../components/UserPanel/SalaryReport";
import DepartmentUsers from "../components/UserPanel/DepartmentUsers";
import DepartmentAttendance from "../components/UserPanel/DepartmentAttendance";
import DepartmentSalary from "../components/UserPanel/DepartmentSalary";
import DepartmentWeeklyReports from "../components/UserPanel/DepartmentWeeklyReports";
import NoticeList from "../components/UserPanel/NoticeList";
import LeaveApplication from "../components/UserPanel/LeaveApplication";

export default function UserPanel() {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState("profile");
  const [userData, setUserData] = useState<any>(null);
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
  const [filteredAttendance, setFilteredAttendance] = useState<any[]>([]);
  const [weeklyReports, setWeeklyReports] = useState<any[]>([]);
  const [weeklyReport, setWeeklyReport] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toLocaleString("default", { month: "long" })
  );
  const [selectedYear, setSelectedYear] = useState<string>(
    new Date().getFullYear().toString()
  );

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const years = Array.from({ length: 5 }, (_, i) =>
    (new Date().getFullYear() - 2 + i).toString()
  );

  const checkCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        toast.success(
          `Your location - Latitude: ${position.coords.latitude}, Longitude: ${position.coords.longitude}`
        );
      },
      (error) => {
        let errorMessage = "Failed to get location";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Please allow location access";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out";
            break;
        }
        toast.error(errorMessage);
      }
    );
  };

  useEffect(() => {
    checkCurrentLocation();
  }, []);

  useEffect(() => {
    fetchUserData();
    fetchTodayAttendance();
    fetchAttendanceHistory();
    fetchWeeklyReports();
  }, []);

  useEffect(() => {
    filterAttendanceRecords(attendanceHistory, selectedMonth, selectedYear);
  }, [selectedMonth, selectedYear, attendanceHistory]);

  const fetchUserData = async () => {
    try {
      if (auth.currentUser) {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("uid", "==", auth.currentUser.uid));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          setUserData(querySnapshot.docs[0].data());
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast.error("Failed to fetch user data");
    }
  };

  const fetchTodayAttendance = async () => {
    try {
      if (!auth.currentUser) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const attendanceRef = collection(db, "attendance");
      const q = query(
        attendanceRef,
        where("userId", "==", auth.currentUser.uid),
        where("date", ">=", today)
      );

      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        setTodayAttendance({
          id: querySnapshot.docs[0].id,
          ...querySnapshot.docs[0].data(),
        });
      }
    } catch (error) {
      console.error("Error fetching today's attendance:", error);
      toast.error("Failed to fetch attendance");
    }
  };

  const fetchAttendanceHistory = async () => {
    try {
      if (!auth.currentUser) return;

      const attendanceRef = collection(db, "attendance");
      const q = query(
        attendanceRef,
        where("userId", "==", auth.currentUser.uid),
        orderBy("date", "desc")
      );

      const querySnapshot = await getDocs(q);
      const records = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setAttendanceHistory(records);
      filterAttendanceRecords(records, selectedMonth, selectedYear);
    } catch (error) {
      console.error("Error fetching attendance history:", error);
      toast.error("Failed to fetch attendance history");
    }
  };

  const fetchWeeklyReports = async () => {
    try {
      if (!auth.currentUser) return;

      const reportsRef = collection(db, "weekly_reports");
      const q = query(
        reportsRef,
        where("userId", "==", auth.currentUser.uid),
        orderBy("submittedAt", "desc")
      );

      const querySnapshot = await getDocs(q);
      const reports = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setWeeklyReports(reports);
    } catch (error) {
      console.error("Error fetching weekly reports:", error);
      toast.error("Failed to fetch weekly reports");
    }
  };

  const filterAttendanceRecords = (
    records: any[],
    month: string,
    year: string
  ) => {
    const filtered = records.filter((record) => {
      const recordDate = new Date(record.date.seconds * 1000);
      return (
        recordDate.toLocaleString("default", { month: "long" }) === month &&
        recordDate.getFullYear().toString() === year
      );
    });
    setFilteredAttendance(filtered);
  };

  const handleMarkAttendance = async (
    type: "start" | "end" | "ooo",
    location?: { name: string; latitude: number; longitude: number }
  ) => {
    try {
      const now = new Date();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const monthName = now.toLocaleString("default", { month: "long" });

      if (!todayAttendance) {
        const attendanceData = {
          userId: auth.currentUser?.uid,
          date: today,
          month: monthName,
          startTime: type === "start" ? now : null,
          endTime: type === "end" ? now : null,
          location: location || null,
          status: type === "ooo" ? "ooo" : "present",
          createdAt: now,
        };

        const docRef = await addDoc(
          collection(db, "attendance"),
          attendanceData
        );
        const newAttendance = {
          id: docRef.id,
          ...attendanceData,
          date: { seconds: today.getTime() / 1000 },
          startTime:
            type === "start" ? { seconds: now.getTime() / 1000 } : null,
          endTime: type === "end" ? { seconds: now.getTime() / 1000 } : null,
        };

        setTodayAttendance(newAttendance);
        setAttendanceHistory((prev) => [newAttendance, ...prev]);
        filterAttendanceRecords(
          [newAttendance, ...attendanceHistory],
          selectedMonth,
          selectedYear
        );
        toast.success(
          type === "ooo"
            ? "Out of office marked successfully"
            : `Work ${type} time marked successfully`
        );
      } else {
        const attendanceRef = doc(db, "attendance", todayAttendance.id);
        const updateData =
          type === "ooo"
            ? { status: "ooo" }
            : {
                [type === "start" ? "startTime" : "endTime"]: now,
                location: location,
              };

        await updateDoc(attendanceRef, updateData);

        const updatedAttendance = {
          ...todayAttendance,
          ...updateData,
          [type === "start" ? "startTime" : "endTime"]:
            type === "ooo"
              ? null
              : {
                  seconds: now.getTime() / 1000,
                },
        };

        setTodayAttendance(updatedAttendance);
        setAttendanceHistory((prev) =>
          prev.map((record) =>
            record.id === todayAttendance.id ? updatedAttendance : record
          )
        );
        filterAttendanceRecords(
          attendanceHistory.map((record) =>
            record.id === todayAttendance.id ? updatedAttendance : record
          ),
          selectedMonth,
          selectedYear
        );
        toast.success(
          type === "ooo"
            ? "Out of office marked successfully"
            : `Work ${type} time marked successfully`
        );
      }
    } catch (error) {
      console.error("Error marking attendance:", error);
      toast.error("Failed to mark attendance");
    }
  };

  const handleSubmitWeeklyReport = async () => {
    try {
      if (!weeklyReport.trim()) {
        toast.error("Please enter your weekly report");
        return;
      }

      const now = new Date();
      const weekEnding = new Date();
      weekEnding.setHours(23, 59, 59, 999);

      await addDoc(collection(db, "weekly_reports"), {
        userId: auth.currentUser?.uid,
        report: weeklyReport,
        weekEnding,
        submittedAt: now,
        month: now.toLocaleString("default", { month: "long" }),
        year: now.getFullYear().toString(),
      });

      toast.success("Weekly report submitted successfully");
      setWeeklyReport("");
      fetchWeeklyReports();
    } catch (error) {
      console.error("Error submitting weekly report:", error);
      toast.error("Failed to submit weekly report");
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out");
    }
  };

  if (!userData) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const today = new Date();
  const isFriday = today.getDay() === 5;

  return (
    <div className="flex min-h-screen bg-gray-100">
      <UserSidebar
        user={userData}
        currentView={currentView}
        onViewChange={setCurrentView}
        onSignOut={handleSignOut}
      />

      <div className="flex-1 p-8">
        {currentView === "profile" && <Profile userId={userData.uid} />}

        {currentView === "upload" && (
          <AttendanceUpload
            todayAttendance={todayAttendance}
            isFriday={isFriday}
            weeklyReport={weeklyReport}
            onWeeklyReportChange={setWeeklyReport}
            onMarkAttendance={handleMarkAttendance}
            onSubmitWeeklyReport={handleSubmitWeeklyReport}
          />
        )}

        {currentView === "track" && (
          <AttendanceTracker
            filteredAttendance={filteredAttendance}
            weeklyReports={weeklyReports}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            months={months}
            years={years}
            onMonthChange={setSelectedMonth}
            onYearChange={setSelectedYear}
          />
        )}

        {currentView === "documents" && <DocumentUpload />}

        {currentView === "payslip" && <PaySlip />}

        {currentView === "salary-report" && <SalaryReport />}

        {currentView === "notices" && <NoticeList />}

        {currentView === "leave-application" && <LeaveApplication />}

        {currentView === "users" && userData.role === "department_admin" && (
          <DepartmentUsers users={[]} />
        )}

        {currentView === "department-salary" &&
          userData.role === "department_admin" && (
            <DepartmentSalary departmentId={userData.departmentId} />
          )}

        {currentView === "reports" && userData.role === "department_admin" && (
          <DepartmentWeeklyReports reports={[]} />
        )}

        {currentView === "attendance-report" &&
          userData.role === "department_admin" && (
            <DepartmentAttendance records={[]} />
          )}
      </div>
    </div>
  );
}
