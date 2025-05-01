import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DollarSign, ArrowLeft, Calculator, Calendar, ChevronDown, CreditCard, User, FileText, Building, Upload, X, Download, Trash2 } from 'lucide-react';
import { collection, query, where, getDocs, addDoc, Timestamp, doc, updateDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import toast from 'react-hot-toast';

interface SalaryRecord {
  id: string;
  userId: string;
  employeeId: string;
  bankName: string;
  bankAccount: string;
  ifscCode: string;
  bankBranch: string;
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
  ctc: string;
  totalEarnings: number;
  totalDeductions: number;
  netSalary: number;
  timestamp: { seconds: number };
  departmentName?: string;
  departmentId?: string;
}

interface SalaryReport {
  id: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: { seconds: number };
  month: string;
  year: string;
  storagePath: string;
}

export default function SalaryForm() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = location.state || {};

  const [formData, setFormData] = useState({
    employeeId: '',
    bankName: '',
    bankAccount: '',
    ifscCode: '',
    bankBranch: '',
    pan: '',
    basicPay: '',
    hra: '',
    da: '',
    specialAllowance: '',
    medicalAllowance: '',
    conveyanceAllowance: '',
    pf: '',
    professionalTax: '',
    incomeTax: '',
    insurance: '',
    ctc: ''
  });

  const [departmentInfo, setDepartmentInfo] = useState<{
    departmentId: string;
    departmentName: string;
  } | null>(null);

  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toLocaleString('default', { month: 'long' })
  );
  const [selectedYear, setSelectedYear] = useState<string>(
    new Date().getFullYear().toString()
  );
  const [salaryRecords, setSalaryRecords] = useState<SalaryRecord[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [salaryReports, setSalaryReports] = useState<SalaryReport[]>([]);
  const [uploading, setUploading] = useState(false);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from(
    { length: 5 },
    (_, i) => (new Date().getFullYear() - 2 + i).toString()
  );

  useEffect(() => {
    if (!user) {
      navigate('/admin');
      return;
    }
    fetchDepartmentInfo();
    fetchSalaryRecords();
    fetchEmployeeDetails();
    fetchSalaryReports();
  }, [user]);

  useEffect(() => {
    loadSalaryData();
  }, [selectedMonth, selectedYear]);

  const loadSalaryData = async () => {
    try {
      // First try to get the selected month's data
      const currentRecord = salaryRecords.find(
        record => record.month === selectedMonth && record.year === selectedYear
      );

      if (currentRecord) {
        // If current month data exists, use it
        setFormData({
          employeeId: currentRecord.employeeId || '',
          bankName: currentRecord.bankName || '',
          bankAccount: currentRecord.bankAccount || '',
          ifscCode: currentRecord.ifscCode || '',
          bankBranch: currentRecord.bankBranch || '',
          pan: currentRecord.pan || '',
          basicPay: currentRecord.basicPay,
          hra: currentRecord.hra,
          da: currentRecord.da,
          specialAllowance: currentRecord.specialAllowance,
          medicalAllowance: currentRecord.medicalAllowance,
          conveyanceAllowance: currentRecord.conveyanceAllowance,
          pf: currentRecord.pf,
          professionalTax: currentRecord.professionalTax,
          incomeTax: currentRecord.incomeTax,
          insurance: currentRecord.insurance,
          ctc: currentRecord.ctc,
        });
      } else {
        // If no current month data, try to get previous month's data
        const currentDate = new Date();
        currentDate.setMonth(months.indexOf(selectedMonth));
        currentDate.setFullYear(parseInt(selectedYear));
        
        // Get previous month
        currentDate.setMonth(currentDate.getMonth() - 1);
        const prevMonth = currentDate.toLocaleString('default', { month: 'long' });
        const prevYear = currentDate.getFullYear().toString();

        const previousRecord = salaryRecords.find(
          record => record.month === prevMonth && record.year === prevYear
        );

        if (previousRecord) {
          // Use previous month's data as template
          setFormData({
            employeeId: previousRecord.employeeId || '',
            bankName: previousRecord.bankName || '',
            bankAccount: previousRecord.bankAccount || '',
            ifscCode: previousRecord.ifscCode || '',
            bankBranch: previousRecord.bankBranch || '',
            pan: previousRecord.pan || '',
            basicPay: previousRecord.basicPay,
            hra: previousRecord.hra,
            da: previousRecord.da,
            specialAllowance: previousRecord.specialAllowance,
            medicalAllowance: previousRecord.medicalAllowance,
            conveyanceAllowance: previousRecord.conveyanceAllowance,
            pf: previousRecord.pf,
            professionalTax: previousRecord.professionalTax,
            incomeTax: previousRecord.incomeTax,
            insurance: previousRecord.insurance,
            ctc: previousRecord.ctc,
          });
          toast.success('Loaded data from previous month as template');
        } else {
          // Reset form if no previous data exists
          setFormData(prev => ({
            ...prev,
            bankName: '',
            bankAccount: '',
            ifscCode: '',
            bankBranch: '',
            pan: '',
            basicPay: '',
            hra: '',
            da: '',
            specialAllowance: '',
            medicalAllowance: '',
            conveyanceAllowance: '',
            pf: '',
            professionalTax: '',
            incomeTax: '',
            insurance: '',
            ctc: ''
          }));
        }
      }
    } catch (error) {
      console.error('Error loading salary data:', error);
      toast.error('Failed to load salary data');
    }
  };

  const fetchEmployeeDetails = async () => {
    try {
      if (user?.uid) {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('uid', '==', user.uid));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();
          setFormData(prev => ({
            ...prev,
            employeeId: userData.employeeId || ''
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching employee details:', error);
      toast.error('Failed to fetch employee details');
    }
  };

  const fetchDepartmentInfo = async () => {
    try {
      if (user?.organizationId && user?.departmentId) {
        const deptRef = doc(db, `organizations/${user.organizationId}/departments`, user.departmentId);
        const deptSnap = await getDoc(deptRef);
        if (deptSnap.exists()) {
          setDepartmentInfo({
            departmentId: user.departmentId,
            departmentName: deptSnap.data().name
          });
        }
      }
    } catch (error) {
      console.error('Error fetching department info:', error);
      toast.error('Failed to fetch department information');
    }
  };

  const fetchSalaryRecords = async () => {
    try {
      const salariesRef = collection(db, 'salaries');
      const q = query(
        salariesRef,
        where('userId', '==', user.uid)
      );
      const querySnapshot = await getDocs(q);
      
      const records = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SalaryRecord[];
      
      records.sort((a, b) => b.timestamp.seconds - a.timestamp.seconds);
      setSalaryRecords(records);
    } catch (error) {
      console.error('Error fetching salary records:', error);
      toast.error('Failed to fetch salary records');
    }
  };

  const fetchSalaryReports = async () => {
    try {
      const reportsRef = collection(db, 'salary_reports');
      const q = query(
        reportsRef,
        where('userId', '==', user.uid),
        where('month', '==', selectedMonth),
        where('year', '==', selectedYear)
      );
      const querySnapshot = await getDocs(q);
      const reports = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SalaryReport[];
      setSalaryReports(reports);
    } catch (error) {
      console.error('Error fetching salary reports:', error);
      toast.error('Failed to fetch salary reports');
    }
  };

  const calculateTotals = () => {
    const earnings = [
      'basicPay',
      'hra',
      'da',
      'specialAllowance',
      'medicalAllowance',
      'conveyanceAllowance'
    ].reduce((sum, field) => sum + (parseFloat(formData[field]) || 0), 0);

    const deductions = [
      'pf',
      'professionalTax',
      'incomeTax',
      'insurance'
    ].reduce((sum, field) => sum + (parseFloat(formData[field]) || 0), 0);

    return {
      totalEarnings: earnings,
      totalDeductions: deductions,
      netSalary: earnings - deductions
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { totalEarnings, totalDeductions, netSalary } = calculateTotals();

      const salaryData = {
        userId: user.uid,
        ...formData,
        month: selectedMonth,
        year: selectedYear,
        totalEarnings,
        totalDeductions,
        netSalary,
        timestamp: new Date(),
        departmentId: departmentInfo?.departmentId,
        departmentName: departmentInfo?.departmentName
      };

      const existingRecord = salaryRecords.find(
        record => record.month === selectedMonth && record.year === selectedYear
      );

      if (existingRecord) {
        const salaryRef = doc(db, 'salaries', existingRecord.id);
        await updateDoc(salaryRef, salaryData);
        toast.success('Salary record updated successfully');
      } else {
        await addDoc(collection(db, 'salaries'), salaryData);
        toast.success('Salary record created successfully');
      }

      navigate('/admin');
    } catch (error) {
      console.error('Error saving salary record:', error);
      toast.error('Failed to save salary record');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size should not exceed 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUploadReport = async () => {
    if (!selectedFile) {
      toast.error('Please select a file');
      return;
    }

    setUploading(true);
    try {
      const timestamp = Date.now();
      const storagePath = `salary_reports/${user.uid}/${selectedMonth}_${selectedYear}/${timestamp}_${selectedFile.name}`;
      const storageRef = ref(storage, storagePath);
      
      await uploadBytes(storageRef, selectedFile);
      const fileUrl = await getDownloadURL(storageRef);

      const reportData = {
        userId: user.uid,
        fileName: selectedFile.name,
        fileUrl,
        storagePath,
        uploadedAt: new Date(),
        month: selectedMonth,
        year: selectedYear
      };

      await addDoc(collection(db, 'salary_reports'), reportData);
      
      toast.success('Salary report uploaded successfully');
      setSelectedFile(null);
      fetchSalaryReports();
    } catch (error) {
      console.error('Error uploading salary report:', error);
      toast.error('Failed to upload salary report');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteReport = async (report: SalaryReport) => {
    try {
      // Delete from Storage
      const storageRef = ref(storage, report.storagePath);
      await deleteObject(storageRef);

      // Delete from Firestore
      await deleteDoc(doc(db, 'salary_reports', report.id));

      toast.success('Salary report deleted successfully');
      fetchSalaryReports();
    } catch (error) {
      console.error('Error deleting salary report:', error);
      toast.error('Failed to delete salary report');
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/admin')}
                className="mr-4 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft size={24} />
              </button>
              <h2 className="text-2xl font-bold flex items-center">
                <DollarSign size={28} className="mr-2" />
                Salary Management
              </h2>
            </div>
            <div className="flex items-center space-x-4">
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

          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <User size={20} className="mr-2" />
              Employee Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employee Name
                </label>
                <input
                  type="text"
                  value={user.name}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Designation
                </label>
                <input
                  type="text"
                  value={user.designation}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Division
                </label>
                <input
                  type="text"
                  value={departmentInfo?.departmentName || 'Loading...'}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employee ID
                </label>
                <input
                  type="text"
                  value={formData.employeeId}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  disabled
                />
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <CreditCard size={20} className="mr-2" />
                Bank & Tax Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter Bank Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bank Account Number
                  </label>
                  <input
                    type="text"
                    value={formData.bankAccount}
                    onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter Bank Account Number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    value={formData.ifscCode}
                    onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter IFSC Code"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bank Branch
                  </label>
                  <input
                    type="text"
                    value={formData.bankBranch}
                    onChange={(e) => setFormData({ ...formData, bankBranch: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter Bank Branch"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PAN Number
                  </label>
                  <input
                    type="text"
                    value={formData.pan}
                    onChange={(e) => setFormData({ ...formData, pan: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter PAN Number"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Calculator size={20} className="mr-2" />
                  Earnings
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Basic Pay
                    </label>
                    <input
                      type="number"
                      value={formData.basicPay}
                      onChange={(e) => setFormData({ ...formData, basicPay: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      HRA
                    </label>
                    <input
                      type="number"
                      value={formData.hra}
                      onChange={(e) => setFormData({ ...formData, hra: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      DA
                    </label>
                    <input
                      type="number"
                      value={formData.da}
                      onChange={(e) => setFormData({ ...formData, da: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Special Allowance
                    </label>
                    <input
                      type="number"
                      value={formData.specialAllowance}
                      onChange={(e) => setFormData({ ...formData, specialAllowance: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Medical Allowance
                    </label>
                    <input
                      type="number"
                      value={formData.medicalAllowance}
                      onChange={(e) => setFormData({ ...formData, medicalAllowance: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Conveyance Allowance
                    </label>
                    <input
                      type="number"
                      value={formData.conveyanceAllowance}
                      onChange={(e) => setFormData({ ...formData, conveyanceAllowance: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Calculator size={20} className="mr-2" />
                  Deductions
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      PF
                    </label>
                    <input
                      type="number"
                      value={formData.pf}
                      onChange={(e) => setFormData({ ...formData, pf: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Professional Tax
                    </label>
                    <input
                      type="number"
                      value={formData.professionalTax}
                      onChange={(e) => setFormData({ ...formData, professionalTax: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Income Tax
                    </label>
                    <input
                      type="number"
                      value={formData.incomeTax}
                      onChange={(e) => setFormData({ ...formData, incomeTax: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Insurance
                    </label>
                    <input
                      type="number"
                      value={formData.insurance}
                      onChange={(e) => setFormData({ ...formData, insurance: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CTC
                    </label>
                    <input
                      type="number"
                      value={formData.ctc}
                      onChange={(e) => setFormData({ ...formData, ctc: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 border-t pt-8">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <FileText size={20} className="mr-2" />
                Salary Reports
              </h3>

              <div className="mb-6">
                <div className="flex items-center space-x-4">
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="salary-report"
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                  />
                  <label
                    htmlFor="salary-report"
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors cursor-pointer flex items-center space-x-2"
                  >
                    <Upload size={20} />
                    <span>Select File</span>
                  </label>
                  {selectedFile && (
                    <>
                      <span className="text-sm text-gray-600">{selectedFile.name}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X size={20} />
                      </button>
                    </>
                  )}
                </div>

                {selectedFile && (
                  <button
                    type="button"
                    onClick={handleUploadReport}
                    disabled={uploading}
                    className="mt-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center space-x-2"
                  >
                    <Upload size={20} />
                    <span>{uploading ? 'Uploading...' : 'Upload Report'}</span>
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {salaryReports.map((report) => (
                  <div key={report.id} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <FileText size={20} className="text-blue-500" />
                      <div>
                        <p className="font-medium">{report.fileName}</p>
                        <p className="text-sm text-gray-500">
                          Uploaded on {new Date(report.uploadedAt.seconds * 1000).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <a
                        href={report.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-blue-500 hover:text-blue-600 transition-colors"
                        title="Download"
                      >
                        <Download size={20} />
                      </a>
                      <button
                        onClick={() => handleDeleteReport(report)}
                        className="p-2 text-red-500 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                ))}
                {salaryReports.length === 0 && (
                  <p className="text-center text-gray-500 py-4">No salary reports uploaded for this month</p>
                )}
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
              >
                <FileText size={20} />
                <span>Save Salary Record</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}