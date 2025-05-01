import React, { useRef, useState, useEffect } from 'react';
import { Calendar, ChevronDown, Printer, IndianRupee, Building, CreditCard, User, FileText } from 'lucide-react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import toast from 'react-hot-toast';

interface SalaryRecord {
  id: string;
  month: string;
  year: string;
  employeeId: string;
  bankName: string;
  bankAccount: string;
  ifscCode: string;
  bankBranch: string;
  pan: string;
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
  ctc: string;
  totalEarnings: number;
  totalDeductions: number;
  netSalary: number;
  timestamp: { seconds: number };
  departmentName?: string;
  departmentId?: string;
}

export default function PaySlip() {
  const paySlipRef = useRef<HTMLDivElement>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toLocaleString('default', { month: 'long' })
  );
  const [selectedYear, setSelectedYear] = useState<string>(
    new Date().getFullYear().toString()
  );
  const [salaryRecord, setSalaryRecord] = useState<SalaryRecord | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from(
    { length: 5 },
    (_, i) => (new Date().getFullYear() - 2 + i).toString()
  );

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (userData) {
      fetchSalaryRecord();
    }
  }, [selectedMonth, selectedYear, userData]);

  const fetchUserData = async () => {
    try {
      if (auth.currentUser) {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('uid', '==', auth.currentUser.uid));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const user = querySnapshot.docs[0].data();
          
          if (user.departmentId && user.organizationId) {
            const deptRef = collection(db, `organizations/${user.organizationId}/departments`);
            const deptDoc = await getDocs(query(deptRef, where('id', '==', user.departmentId)));
            if (!deptDoc.empty) {
              user.departmentName = deptDoc.docs[0].data().name;
            }
          }
          
          setUserData(user);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Failed to fetch user data');
    }
  };

  const fetchSalaryRecord = async () => {
    setLoading(true);
    try {
      const salariesRef = collection(db, 'salaries');
      const q = query(
        salariesRef,
        where('userId', '==', auth.currentUser?.uid),
        where('month', '==', selectedMonth),
        where('year', '==', selectedYear)
      );
      
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        setSalaryRecord(querySnapshot.docs[0].data() as SalaryRecord);
      } else {
        setSalaryRecord(null);
      }
    } catch (error) {
      console.error('Error fetching salary record:', error);
      toast.error('Failed to fetch salary record');
    } finally {
      setLoading(false);
    }
  };

  const numberToWords = (num: number) => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    
    if (num === 0) return 'Zero';
    
    const convertLessThanThousand = (n: number): string => {
      if (n === 0) return '';
      if (n < 10) return ones[n];
      if (n < 20) return teens[n - 10];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
      return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertLessThanThousand(n % 100) : '');
    };
    
    const convert = (n: number): string => {
      if (n === 0) return 'Zero';
      let result = '';
      
      if (n >= 100000) {
        result += convertLessThanThousand(Math.floor(n / 100000)) + ' Lakh ';
        n %= 100000;
      }
      
      if (n >= 1000) {
        result += convertLessThanThousand(Math.floor(n / 1000)) + ' Thousand ';
        n %= 1000;
      }
      
      if (n > 0) {
        result += convertLessThanThousand(n);
      }
      
      return result.trim();
    };
    
    return convert(num) + ' Rupees Only';
  };

  const handlePrint = () => {
    if (paySlipRef.current) {
      window.print();
    }
  };

  const hasValue = (value: string | number): boolean => {
    return value !== '0' && value !== 0 && value !== '0.00' && value !== '' && value != null;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6 no-print">
        <h2 className="text-xl font-semibold flex items-center">
          <IndianRupee size={24} className="mr-2" />
          Pay Slip
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

      {salaryRecord ? (
        <div ref={paySlipRef} className="space-y-6 print:shadow-none print:p-8" id="payslip">
          <div className="text-center border-b pb-6">
            <div className="flex justify-center mb-4">
              <img
                src="https://media.licdn.com/dms/image/v2/C560BAQEV5bmhSzmwXA/company-logo_200_200/company-logo_200_200/0/1632725060447?e=2147483647&v=beta&t=HLSjgaNC62aOcklA0mMrLOzEue-CD6QsGxP8fVnr610"
                alt="APMB Logo"
                className="h-20 object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold">Andhra Pradesh Maritime Board</h1>
            <p className="text-gray-600 mt-2">Pay Slip for {selectedMonth} {selectedYear}</p>
          </div>

          <div className="grid grid-cols-2 gap-8 border-b pb-6">
            <div className="space-y-3">
              <div className="flex items-start">
                <span className="w-40 font-medium text-gray-600">Employee Name:</span>
                <span>{userData?.name}</span>
              </div>
              <div className="flex items-start">
                <span className="w-40 font-medium text-gray-600">Employee ID:</span>
                <span>{salaryRecord.employeeId}</span>
              </div>
              <div className="flex items-start">
                <span className="w-40 font-medium text-gray-600">Division:</span>
                <span>{salaryRecord.departmentName || userData?.departmentName}</span>
              </div>
              <div className="flex items-start">
                <span className="w-40 font-medium text-gray-600">Designation:</span>
                <span>{userData?.designation}</span>
              </div>
            </div>
            <div className="space-y-3">
              {hasValue(salaryRecord.bankName) && (
                <div className="flex items-start">
                  <span className="w-40 font-medium text-gray-600">Bank Name:</span>
                  <span>{salaryRecord.bankName}</span>
                </div>
              )}
              {hasValue(salaryRecord.bankAccount) && (
                <div className="flex items-start">
                  <span className="w-40 font-medium text-gray-600">Account No:</span>
                  <span>{salaryRecord.bankAccount}</span>
                </div>
              )}
              {hasValue(salaryRecord.ifscCode) && (
                <div className="flex items-start">
                  <span className="w-40 font-medium text-gray-600">IFSC Code:</span>
                  <span>{salaryRecord.ifscCode}</span>
                </div>
              )}
              {hasValue(salaryRecord.pan) && (
                <div className="flex items-start">
                  <span className="w-40 font-medium text-gray-600">PAN:</span>
                  <span>{salaryRecord.pan}</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 border-b pb-6">
            <div>
              <h3 className="font-semibold text-lg mb-4">Earnings</h3>
              <div className="space-y-3">
                {hasValue(salaryRecord.basicPay) && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Basic Pay</span>
                    <span>₹{salaryRecord.basicPay}</span>
                  </div>
                )}
                {hasValue(salaryRecord.hra) && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">HRA</span>
                    <span>₹{salaryRecord.hra}</span>
                  </div>
                )}
                {hasValue(salaryRecord.da) && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">DA</span>
                    <span>₹{salaryRecord.da}</span>
                  </div>
                )}
                {hasValue(salaryRecord.specialAllowance) && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Special Allowance</span>
                    <span>₹{salaryRecord.specialAllowance}</span>
                  </div>
                )}
                {hasValue(salaryRecord.medicalAllowance) && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Medical Allowance</span>
                    <span>₹{salaryRecord.medicalAllowance}</span>
                  </div>
                )}
                {hasValue(salaryRecord.conveyanceAllowance) && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Conveyance Allowance</span>
                    <span>₹{salaryRecord.conveyanceAllowance}</span>
                  </div>
                )}
                <div className="flex justify-between pt-3 border-t font-semibold">
                  <span>Total Earnings</span>
                  <span>₹{salaryRecord.totalEarnings.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-4">Deductions</h3>
              <div className="space-y-3">
                {hasValue(salaryRecord.pf) && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">PF</span>
                    <span>₹{salaryRecord.pf}</span>
                  </div>
                )}
                {hasValue(salaryRecord.professionalTax) && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Professional Tax</span>
                    <span>₹{salaryRecord.professionalTax}</span>
                  </div>
                )}
                {hasValue(salaryRecord.incomeTax) && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Income Tax</span>
                    <span>₹{salaryRecord.incomeTax}</span>
                  </div>
                )}
                {hasValue(salaryRecord.insurance) && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Insurance</span>
                    <span>₹{salaryRecord.insurance}</span>
                  </div>
                )}
                <div className="flex justify-between pt-3 border-t font-semibold">
                  <span>Total Deductions</span>
                  <span>₹{salaryRecord.totalDeductions.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Net Pay</span>
              <span>₹{salaryRecord.netSalary.toFixed(2)}</span>
            </div>
            <p className="text-gray-600 italic">
              {numberToWords(Math.round(salaryRecord.netSalary))}
            </p>
          </div>

          <div className="text-center text-sm text-gray-500 border-t pt-6 mt-8">
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
      ) : (
        <div className="text-center py-8">
          <IndianRupee size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No salary record found for {selectedMonth} {selectedYear}</p>
        </div>
      )}

      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 20mm;
          }

          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .no-print {
            display: none !important;
          }

          #payslip {
            padding: 0;
            margin: 0;
            width: 100%;
          }

          .print-only {
            display: block !important;
          }

          .grid {
            display: grid !important;
            page-break-inside: avoid;
          }

          .border-b {
            border-bottom-width: 1px !important;
          }

          .border-t {
            border-top-width: 1px !important;
          }

          .space-y-3 > :not([hidden]) ~ :not([hidden]) {
            margin-top: 0.75rem !important;
          }

          .space-y-4 > :not([hidden]) ~ :not([hidden]) {
            margin-top: 1rem !important;
          }

          .space-y-6 > :not([hidden]) ~ :not([hidden]) {
            margin-top: 1.5rem !important;
          }
        }
      `}</style>
    </div>
  );
}