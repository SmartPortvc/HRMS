import React from "react";
import {
  Users,
  Clock,
  FileText,
  UserPlus,
  LayoutDashboard,
  LogOut,
  Building,
  FileSpreadsheet,
  IndianRupee,
  BarChart,
  FileUp,
  Database,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { SlEnvolopeLetter } from "react-icons/sl";

interface SidebarProps {
  currentView:
    | "users"
    | "attendance"
    | "reports"
    | "organizations"
    | "attendance-report"
    | "salaries"
    | "salary-report"
    | "analysis"
    | "notices"
    | "master-data"
    | "leave-application";
  onViewChange: (
    view:
      | "users"
      | "attendance"
      | "reports"
      | "organizations"
      | "attendance-report"
      | "salaries"
      | "salary-report"
      | "analysis"
      | "notices"
      | "master-data"
      | "leave-application"
  ) => void;
  onSignOut: () => void;
}

export default function Sidebar({
  currentView,
  onViewChange,
  onSignOut,
}: SidebarProps) {
  const navigate = useNavigate();

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
        <h2 className="text-xl font-bold">Admin Panel</h2>
      </div>

      <nav className="space-y-4">
        <button
          onClick={() => onViewChange("organizations")}
          className={`flex items-center space-x-2 w-full px-4 py-2 rounded-lg transition-colors ${
            currentView === "organizations"
              ? "bg-white/20"
              : "hover:bg-white/10"
          }`}
        >
          <Building size={20} />
          <span>Organizations</span>
        </button>

        <button
          onClick={() => onViewChange("master-data")}
          className={`flex items-center space-x-2 w-full px-4 py-2 rounded-lg transition-colors ${
            currentView === "master-data" ? "bg-white/20" : "hover:bg-white/10"
          }`}
        >
          <Database size={20} />
          <span>Master Data</span>
        </button>

        <button
          onClick={() => onViewChange("users")}
          className={`flex items-center space-x-2 w-full px-4 py-2 rounded-lg transition-colors ${
            currentView === "users" ? "bg-white/20" : "hover:bg-white/10"
          }`}
        >
          <Users size={20} />
          <span>Employees</span>
        </button>

        <button
          onClick={() => onViewChange("salaries")}
          className={`flex items-center space-x-2 w-full px-4 py-2 rounded-lg transition-colors ${
            currentView === "salaries" ? "bg-white/20" : "hover:bg-white/10"
          }`}
        >
          <IndianRupee size={20} />
          <span>Salaries</span>
        </button>

        <button
          onClick={() => onViewChange("salary-report")}
          className={`flex items-center space-x-2 w-full px-4 py-2 rounded-lg transition-colors ${
            currentView === "salary-report"
              ? "bg-white/20"
              : "hover:bg-white/10"
          }`}
        >
          <IndianRupee size={20} />
          <span>Salary Report</span>
        </button>
        <button
          onClick={() => onViewChange("leave-application")}
          className={`flex items-center space-x-2 w-full px-4 py-2 rounded-lg transition-colors ${
            currentView === "leave-application"
              ? "bg-white/20"
              : "hover:bg-white/10"
          }`}
        >
          <SlEnvolopeLetter size={20} />
          <span>Leave Application</span>
        </button>

        <button
          onClick={() => onViewChange("attendance")}
          className={`flex items-center space-x-2 w-full px-4 py-2 rounded-lg transition-colors ${
            currentView === "attendance" ? "bg-white/20" : "hover:bg-white/10"
          }`}
        >
          <Clock size={20} />
          <span>Attendance</span>
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

        <button
          onClick={() => onViewChange("analysis")}
          className={`flex items-center space-x-2 w-full px-4 py-2 rounded-lg transition-colors ${
            currentView === "analysis" ? "bg-white/20" : "hover:bg-white/10"
          }`}
        >
          <BarChart size={20} />
          <span>Analysis</span>
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
          onClick={() => onViewChange("notices")}
          className={`flex items-center space-x-2 w-full px-4 py-2 rounded-lg transition-colors ${
            currentView === "notices" ? "bg-white/20" : "hover:bg-white/10"
          }`}
        >
          <FileUp size={20} />
          <span>Upload Notice</span>
        </button>

        <button
          onClick={() => navigate("/admin/invite")}
          className="flex items-center space-x-2 w-full px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
        >
          <UserPlus size={20} />
          <span>Onboard Employee</span>
        </button>

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
