import React, { useState, useEffect } from 'react';
import { DollarSign, Calendar, ChevronDown, Printer, IndianRupee } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import toast from 'react-hot-toast';

interface SalaryRecord {
  id: string;
  userId: string;
  employeeId: string;
  bankAccount: string;
  pan: string;
  month: string;
  year: string;
  basicPay: string;
  hra: string;
  da: string;
  specialAllowance: string;
  medicalAllowance: string;
  conveyanceAllowance: string;
  pf: string;
  professionalTax: string;
  incomeTax: string;
  insurance: string;
  totalEarnings: number;
  totalDeductions: number;
  netSalary: number;
  timestamp: { seconds: number };
  departmentName?: string;
  user?: {
    name: string;
    designation: string;
  };
}

interface DepartmentSalaryProps {
  departmentId: string;
}

export default function DepartmentSalary({ departmentId }: DepartmentSalaryProps) {
  const [salaryRecords, setSalaryRecords] = useState<SalaryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toLocaleString('default', { month: 'long' })
  );
  const [selectedYear, setSelectedYear] = useState<string>(
    new Date().getFullYear().toString()
  );
  const [departmentTotal, setDepartmentTotal] = useState({
    totalEarnings: 0,
    totalDeductions: 0,
    netSalary: 0,
    employeeCount: 0
  });

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from(
    { length: 5 },
    (_, i) => (new Date().getFullYear() - 2 + i).toString()
  );

  useEffect(() => {
    fetchSalaryRecords();
  }, [departmentId, selectedMonth, selectedYear]);

  const fetchSalaryRecords = async () => {
    try {
      setLoading(true);
      const salariesRef = collection(db, 'salaries');
      const q = query(
        salariesRef,
        where('departmentId', '==', departmentId),
        where('month', '==', selectedMonth),
        where('year', '==', selectedYear)
      );
      
      const querySnapshot = await getDocs(q);
      const records = await Promise.all(
        querySnapshot.docs.map(async (doc) => {
          const salaryData = { id: doc.id, ...doc.data() } as SalaryRecord;
          
          // Fetch user details
          const usersRef = collection(db, 'users');
          const userQuery = query(usersRef, where('uid', '==', salaryData.userId));
          const userSnapshot = await getDocs(userQuery);
          
          if (!userSnapshot.empty) {
            const userData = userSnapshot.docs[0].data();
            salaryData.user = {
              name: userData.name,
              designation: userData.designation
            };
          }
          
          return salaryData;
        })
      );

      setSalaryRecords(records);

      // Calculate department totals
      const totals = records.reduce((acc, record) => ({
        totalEarnings: acc.totalEarnings + record.totalEarnings,
        totalDeductions: acc.totalDeductions + record.totalDeductions,
        netSalary: acc.netSalary + record.netSalary,
        employeeCount: acc.employeeCount + 1
      }), {
        totalEarnings: 0,
        totalDeductions: 0,
        netSalary: 0,
        employeeCount: 0
      });

      setDepartmentTotal(totals);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching salary records:', error);
      toast.error('Failed to fetch salary records');
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6 no-print">
        <h2 className="text-xl font-semibold flex items-center">
          <DollarSign size={24} className="mr-2" />
          Division Salary Records
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

          <button
            onClick={handlePrint}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Printer size={20} />
            <span>Print</span>
          </button>
        </div>
      </div>

      <div id="printable-content">
        <div className="print-only text-center mb-6">
          <img
            src="https://media.licdn.com/dms/image/v2/C560BAQEV5bmhSzmwXA/company-logo_200_200/company-logo_200_200/0/1632725060447?e=2147483647&v=beta&t=HLSjgaNC62aOcklA0mMrLOzEue-CD6QsGxP8fVnr610"
            alt="APMB Logo"
            className="h-20 mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold">Andhra Pradesh Maritime Board</h1>
          <p className="text-lg">Division Salary Report - {selectedMonth} {selectedYear}</p>
        </div>

        <div className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-100">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <IndianRupee size={20} className="mr-2" />
            Division Summary - {selectedMonth} {selectedYear}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100">
              <p className="text-sm text-gray-600 mb-1">Total Employees</p>
              <p className="text-2xl font-bold text-blue-600">{departmentTotal.employeeCount}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100">
              <p className="text-sm text-gray-600 mb-1">Total Earnings</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(departmentTotal.totalEarnings)}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100">
              <p className="text-sm text-gray-600 mb-1">Total Deductions</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(departmentTotal.totalDeductions)}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100">
              <p className="text-sm text-gray-600 mb-1">Net Salary Payout</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(departmentTotal.netSalary)}</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Earnings</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deductions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Salary</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {salaryRecords.map((record) => (
                  <tr key={record.id}>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium">{record.user?.name || 'N/A'}</p>
                        <p className="text-sm text-gray-500">{record.user?.designation}</p>
                        <p className="text-sm text-gray-500">ID: {record.employeeId}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm">Account: {record.bankAccount}</p>
                        <p className="text-sm">PAN: {record.pan}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="text-sm">Basic: ₹{record.basicPay}</p>
                        <p className="text-sm">HRA: ₹{record.hra}</p>
                        <p className="text-sm">DA: ₹{record.da}</p>
                        <p className="font-medium">Total: {formatCurrency(record.totalEarnings)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="text-sm">PF: ₹{record.pf}</p>
                        <p className="text-sm">Tax: ₹{record.incomeTax}</p>
                        <p className="text-sm">Insurance: ₹{record.insurance}</p>
                        <p className="font-medium">Total: {formatCurrency(record.totalDeductions)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-lg font-semibold">{formatCurrency(record.netSalary)}</p>
                    </td>
                  </tr>
                ))}
                {salaryRecords.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      No salary records found for {selectedMonth} {selectedYear}
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-gray-50 font-semibold">
                <tr>
                  <td className="px-6 py-4">Total ({departmentTotal.employeeCount} Employees)</td>
                  <td className="px-6 py-4"></td>
                  <td className="px-6 py-4 text-green-600">{formatCurrency(departmentTotal.totalEarnings)}</td>
                  <td className="px-6 py-4 text-red-600">{formatCurrency(departmentTotal.totalDeductions)}</td>
                  <td className="px-6 py-4 text-blue-600">{formatCurrency(departmentTotal.netSalary)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        <div className="mt-8 text-center text-sm text-gray-500 print-only">
          <p>This is a computer-generated document. No signature is required.</p>
          <p>Generated on: {new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</p>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          body * {
            visibility: hidden;
          }
          #printable-content,
          #printable-content * {
            visibility: visible;
          }
          #printable-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          @page {
            size: A4;
            margin: 20mm;
          }
          table {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          thead {
            display: table-header-group;
          }
          tfoot {
            display: table-footer-group;
          }
        }
        @media screen {
          .print-only {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}