import React from "react";
import { motion } from "framer-motion";
import {
  Upload,
  History,
  Users,
  FileText,
  FileSpreadsheet,
  LogOut,
  UserIcon,
  User,
  IndianRupee,
  Bell,
} from "lucide-react";

interface UserSidebarProps {
  user: any;
  currentView: string;
  onViewChange: (view: string) => void;
  onSignOut: () => void;
}

export default function UserSidebar({
  user,
  currentView,
  onViewChange,
  onSignOut,
}: UserSidebarProps) {
  return (
    <motion.div
      initial={{ x: -250 }}
      animate={{ x: 0 }}
      className="w-64 bg-blue-500 text-white p-6"
    >
      <div className="flex flex-col items-center mb-8">
        <img
          src="https://media.licdn.com/dms/image/v2/C560BAQEV5bmhSzmwXA/company-logo_200_200/company-logo_200_200/0/1632725060447?e=2147483647&v=beta&t=HLSjgaNC62aOcklA0mMrLOzEue-CD6QsGxP8fVnr610"
          alt="APMB Logo"
          className="w-20 h-20 mb-4 object-contain bg-white rounded-full p-2"
        />
        <h2 className="text-xl font-bold">User Panel</h2>
      </div>

      {user?.role === "department_admin" && (
        <div className="mb-8">
          <p className="text-sm bg-white/20 px-2 py-1 rounded inline-block">
            Division Admin
          </p>
        </div>
      )}

      <nav className="space-y-4">
        <button
          onClick={() => onViewChange("profile")}
          className={`flex items-center space-x-2 w-full px-4 py-2 rounded-lg transition-colors ${
            currentView === "profile" ? "bg-white/20" : "hover:bg-white/10"
          }`}
        >
          <User size={20} />
          <span>Profile</span>
        </button>

        <button
          onClick={() => onViewChange("upload")}
          className={`flex items-center space-x-2 w-full px-4 py-2 rounded-lg transition-colors ${
            currentView === "upload" ? "bg-white/20" : "hover:bg-white/10"
          }`}
        >
          <Upload size={20} />
          <span>Attendance</span>
        </button>

        <button
          onClick={() => onViewChange("track")}
          className={`flex items-center space-x-2 w-full px-4 py-2 rounded-lg transition-colors ${
            currentView === "track" ? "bg-white/20" : "hover:bg-white/10"
          }`}
        >
          <History size={20} />
          <span>Track Attendance</span>
        </button>

        <button
          onClick={() => onViewChange("payslip")}
          className={`flex items-center space-x-2 w-full px-4 py-2 rounded-lg transition-colors ${
            currentView === "payslip" ? "bg-white/20" : "hover:bg-white/10"
          }`}
        >
          <IndianRupee size={20} />
          <span>Pay Slip</span>
        </button>

        <button
          onClick={() => onViewChange("salary-report")}
          className={`flex items-center space-x-2 w-full px-4 py-2 rounded-lg transition-colors ${
            currentView === "salary-report"
              ? "bg-white/20"
              : "hover:bg-white/10"
          }`}
        >
          <FileText size={20} />
          <span>Salary Report</span>
        </button>

        <button
          onClick={() => onViewChange("notices")}
          className={`flex items-center space-x-2 w-full px-4 py-2 rounded-lg transition-colors ${
            currentView === "notices" ? "bg-white/20" : "hover:bg-white/10"
          }`}
        >
          <Bell size={20} />
          <span>Notices</span>
        </button>

        {user?.role === "department_admin" && (
          <>
            <button
              onClick={() => onViewChange("users")}
              className={`flex items-center space-x-2 w-full px-4 py-2 rounded-lg transition-colors ${
                currentView === "users" ? "bg-white/20" : "hover:bg-white/10"
              }`}
            >
              <Users size={20} />
              <span>Division Users</span>
            </button>

            <button
              onClick={() => onViewChange("department-salary")}
              className={`flex items-center space-x-2 w-full px-4 py-2 rounded-lg transition-colors ${
                currentView === "department-salary"
                  ? "bg-white/20"
                  : "hover:bg-white/10"
              }`}
            >
              <IndianRupee size={20} />
              <span>Division Salary</span>
            </button>

            <button
              onClick={() => onViewChange("reports")}
              className={`flex items-center space-x-2 w-full px-4 py-2 rounded-lg transition-colors ${
                currentView === "reports" ? "bg-white/20" : "hover:bg-white/10"
              }`}
            >
              <FileText size={20} />
              <span>Weekly Reports</span>
            </button>

            <button
              onClick={() => onViewChange("attendance-report")}
              className={`flex items-center space-x-2 w-full px-4 py-2 rounded-lg transition-colors ${
                currentView === "attendance-report"
                  ? "bg-white/20"
                  : "hover:bg-white/10"
              }`}
            >
              <FileSpreadsheet size={20} />
              <span>Attendance Report</span>
            </button>
          </>
        )}

        <button
          onClick={onSignOut}
          className="flex items-center space-x-2 w-full px-4 py-2 rounded-lg hover:bg-white/10 transition-colors mt-8"
        >
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </nav>
    </motion.div>
  );
}
