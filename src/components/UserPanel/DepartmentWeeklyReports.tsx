import React, { useState } from 'react';
import { FileText, Calendar, ChevronDown, Search, Building, User } from 'lucide-react';
import { motion } from 'framer-motion';

interface WeeklyReport {
  id: string;
  userName: string;
  departmentName: string;
  weekEnding: { seconds: number };
  submittedAt: { seconds: number };
  report: string;
  month: string;
  year: string;
}

interface DepartmentWeeklyReportsProps {
  reports: WeeklyReport[];
}

export default function DepartmentWeeklyReports({ reports }: DepartmentWeeklyReportsProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toLocaleString('default', { month: 'long' })
  );
  const [selectedYear, setSelectedYear] = useState<string>(
    new Date().getFullYear().toString()
  );
  const [searchQuery, setSearchQuery] = useState('');

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from(
    { length: 5 },
    (_, i) => (new Date().getFullYear() - 2 + i).toString()
  );

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getWeekRange = (date: Date) => {
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay() + 1); // Monday
    const end = new Date(date);
    end.setDate(date.getDate() - date.getDay() + 5); // Friday
    return `${formatDate(start)} - ${formatDate(end)}`;
  };

  const filteredReports = reports.filter(report => {
    const matchesMonth = report.month === selectedMonth;
    const matchesYear = report.year === selectedYear;
    const searchString = searchQuery.toLowerCase();
    
    const matchesSearch = !searchQuery || 
      report.userName.toLowerCase().includes(searchString) ||
      report.departmentName.toLowerCase().includes(searchString) ||
      report.report.toLowerCase().includes(searchString);

    return matchesMonth && matchesYear && matchesSearch;
  });

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold flex items-center">
          <FileText size={24} className="mr-2" />
          Division Weekly Reports
        </h2>
        <div className="flex space-x-4">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-blue-500"
            >
              {months.map(month => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-blue-500"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search by name or content..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="space-y-6">
        {filteredReports.map((report) => (
          <motion.div
            key={report.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-50 rounded-lg p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <User size={20} className="text-gray-500" />
                  <h3 className="font-semibold text-lg">{report.userName}</h3>
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <Building size={16} className="text-gray-500" />
                  <p className="text-sm text-gray-600">{report.departmentName}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                  Week: {getWeekRange(new Date(report.weekEnding.seconds * 1000))}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Submitted: {formatDate(new Date(report.submittedAt.seconds * 1000))}
                </p>
              </div>
            </div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-lg p-4 border border-gray-100"
            >
              <p className="text-gray-700 whitespace-pre-wrap">{report.report}</p>
            </motion.div>
          </motion.div>
        ))}
        {filteredReports.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8"
          >
            <FileText size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">
              {searchQuery
                ? 'No reports found matching your search criteria'
                : `No reports found for ${selectedMonth} ${selectedYear}`}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}