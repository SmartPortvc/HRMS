import React, { useState, useEffect } from 'react';
import { FileText, Search, Building, Calendar, ChevronDown } from 'lucide-react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import toast from 'react-hot-toast';

interface WeeklyReport {
  id: string;
  userId: string;
  weekEnding: { seconds: number };
  submittedAt: { seconds: number };
  report: string;
  user?: {
    name: string;
    designation: string;
    departmentId: string;
    organizationId: string;
  };
  department?: {
    name: string;
  };
  organization?: {
    name: string;
  };
}

interface WeeklyReportsProps {
  reports: WeeklyReport[];
}

export default function WeeklyReports({ reports: initialReports }: WeeklyReportsProps) {
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState<{ id: string; name: string }[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [selectedOrg, setSelectedOrg] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toLocaleString('default', { month: 'long' })
  );
  const [selectedYear, setSelectedYear] = useState<string>(
    new Date().getFullYear().toString()
  );

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from(
    { length: 5 },
    (_, i) => (new Date().getFullYear() - 2 + i).toString()
  );

  useEffect(() => {
    fetchOrganizations();
    enrichReportsWithDetails();
  }, [initialReports]);

  useEffect(() => {
    if (selectedOrg !== 'all') {
      fetchDepartments(selectedOrg);
    } else {
      setDepartments([]);
      setSelectedDepartment('all');
    }
  }, [selectedOrg]);

  const fetchOrganizations = async () => {
    try {
      const orgsRef = collection(db, 'organizations');
      const snapshot = await getDocs(orgsRef);
      const orgs = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name
      }));
      setOrganizations(orgs);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      toast.error('Failed to fetch organizations');
    }
  };

  const fetchDepartments = async (orgId: string) => {
    try {
      const deptsRef = collection(db, `organizations/${orgId}/departments`);
      const snapshot = await getDocs(deptsRef);
      const depts = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name
      }));
      setDepartments(depts);
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast.error('Failed to fetch departments');
    }
  };

  const enrichReportsWithDetails = async () => {
    try {
      setLoading(true);
      const enrichedReports = await Promise.all(
        initialReports.map(async (report) => {
          try {
            // Fetch user data
            const usersRef = collection(db, 'users');
            const userQuery = query(usersRef, where('uid', '==', report.userId));
            const userSnapshot = await getDocs(userQuery);
            const userData = userSnapshot.docs[0]?.data();

            if (userData) {
              // Fetch organization data
              const orgRef = doc(db, 'organizations', userData.organizationId);
              const orgSnapshot = await getDoc(orgRef);
              const orgData = orgSnapshot.exists() ? orgSnapshot.data() : null;

              // Fetch department data
              const deptRef = doc(db, `organizations/${userData.organizationId}/departments`, userData.departmentId);
              const deptSnapshot = await getDoc(deptRef);
              const deptData = deptSnapshot.exists() ? deptSnapshot.data() : null;

              return {
                ...report,
                user: userData,
                department: deptData ? { name: deptData.name } : undefined,
                organization: orgData ? { name: orgData.name } : undefined
              };
            }
            return report;
          } catch (error) {
            console.error('Error enriching report:', error);
            return report;
          }
        })
      );

      setReports(enrichedReports);
      setLoading(false);
    } catch (error) {
      console.error('Error processing reports:', error);
      toast.error('Failed to process reports');
      setLoading(false);
    }
  };

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
    const reportDate = new Date(report.submittedAt.seconds * 1000);
    const matchesMonth = reportDate.toLocaleString('default', { month: 'long' }) === selectedMonth;
    const matchesYear = reportDate.getFullYear().toString() === selectedYear;
    const matchesOrg = selectedOrg === 'all' || report.user?.organizationId === selectedOrg;
    const matchesDept = selectedDepartment === 'all' || report.user?.departmentId === selectedDepartment;
    const searchString = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
      report.user?.name?.toLowerCase().includes(searchString) ||
      report.user?.designation?.toLowerCase().includes(searchString) ||
      report.organization?.name?.toLowerCase().includes(searchString) ||
      report.department?.name?.toLowerCase().includes(searchString) ||
      report.report.toLowerCase().includes(searchString);

    return matchesMonth && matchesYear && matchesOrg && matchesDept && matchesSearch;
  });

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-6 flex items-center">
        <FileText size={24} className="mr-2" />
        Weekly Work Reports
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="relative">
          <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <select
            value={selectedOrg}
            onChange={(e) => setSelectedOrg(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg appearance-none"
          >
            <option value="all">All Organizations</option>
            {organizations.map(org => (
              <option key={org.id} value={org.id}>{org.name}</option>
            ))}
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>

        <div className="relative">
          <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg appearance-none"
            disabled={selectedOrg === 'all'}
          >
            <option value="all">All Divisions</option>
            {departments.map(dept => (
              <option key={dept.id} value={dept.id}>{dept.name}</option>
            ))}
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>

        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg appearance-none"
          >
            {months.map(month => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>

        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg appearance-none"
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredReports.map((report) => (
            <div key={report.id} className="bg-gray-50 rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{report.user?.name || 'Unknown User'}</h3>
                  <p className="text-sm text-gray-600">{report.user?.designation || 'N/A'}</p>
                  <div className="flex space-x-2 mt-1">
                    <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                      {report.organization?.name || 'N/A'}
                    </span>
                    <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded">
                      {report.department?.name || 'N/A'}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-blue-600">
                    Week: {getWeekRange(new Date(report.weekEnding.seconds * 1000))}
                  </p>
                  <p className="text-xs text-gray-500">
                    Submitted: {formatDate(new Date(report.submittedAt.seconds * 1000))}
                  </p>
                </div>
              </div>
              <div className="bg-white rounded p-4">
                <p className="text-gray-700 whitespace-pre-wrap">{report.report}</p>
              </div>
            </div>
          ))}
          {filteredReports.length === 0 && (
            <div className="text-center py-8">
              <FileText size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No weekly reports found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}