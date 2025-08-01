import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Database,
  Search,
  Building,
  Briefcase,
  ChevronDown,
  Download,
} from "lucide-react";
import {
  collection,
  query,
  getDocs,
  getDoc,
  doc as docFn,
  where,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import toast from "react-hot-toast";

interface Employee {
  id: string;
  uid: string;
  name: string;
  email: string;
  designation: string;
  employmentType: string;
  departmentId: string;
  departmentName?: string;
  organizationId: string;
  organizationName?: string;
  doj: string;
  ced?: string;
  workLocation: string;
  emergencyContact: string;
  bloodGroup: string;
  education: string;
  address: string;
  aadhaar: string;
  employeeId: string;
  bankName?: string;
  bankAccount?: string;
  ifscCode?: string;
  bankBranch?: string;
  pan?: string;
  basicPay?: string;
  hra?: string;
  da?: string;
  specialAllowance?: string;
  medicalAllowance?: string;
  conveyanceAllowance?: string;
  pf?: string;
  professionalTax?: string;
  incomeTax?: string;
  insurance?: string;
}

export default function MasterData() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<
    { id: string; name: string }[]
  >([]);
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedEmploymentType, setSelectedEmploymentType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const employmentTypes = ["all", "regular", "contract", "outsourcing"];

  useEffect(() => {
    fetchDepartments();
    fetchEmployees();
  }, []);

  const fetchDepartments = async () => {
    try {
      const departments: { id: string; name: string }[] = [];
      const orgsRef = collection(db, "organizations");
      const orgsSnapshot = await getDocs(orgsRef);

      for (const orgDoc of orgsSnapshot.docs) {
        const deptsRef = collection(
          db,
          `organizations/${orgDoc.id}/departments`
        );
        const deptsSnapshot = await getDocs(deptsRef);

        deptsSnapshot.docs.forEach((deptDoc) => {
          departments.push({
            id: deptDoc.id,
            name: deptDoc.data().name,
          });
        });
      }

      setDepartments(departments);
    } catch (error) {
      console.error("Error fetching departments:", error);
      toast.error("Failed to fetch departments");
    }
  };

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const employeesRef = collection(db, "users");
      const querySnapshot = await getDocs(employeesRef);

      const employeeData = await Promise.all(
        querySnapshot.docs.map(async (doc) => {
          const data = doc.data() as Employee;
          data.id = doc.id;
          console.log({
            data,
          });

          if (data.organizationId && data.departmentId) {
            const deptRef = docFn(
              db,
              `organizations/${data.organizationId}/departments`,
              data.departmentId
            );
            const deptSnap = await getDoc(deptRef);
            if (deptSnap.exists()) {
              data.departmentName = deptSnap.data().name;
            }

            const orgRef = docFn(db, "organizations", data.organizationId);
            const orgSnap = await getDoc(orgRef);
            if (orgSnap.exists()) {
              data.organizationName = orgSnap.data().name;
            }
          }

          // Fetch salary details
          const salariesRef = collection(db, "salaries");
          const salaryQuery = query(
            salariesRef,
            where("userId", "==", data.id)
          );
          const salarySnapshot = await getDocs(salaryQuery);

          if (!salarySnapshot.empty) {
            const latestSalary = salarySnapshot.docs
              .map((doc) => doc.data())
              .sort((a, b) => b.timestamp.seconds - a.timestamp.seconds)[0];

            // Add salary details to employee data
            Object.assign(data, {
              bankName: latestSalary.bankName || "NA",
              bankAccount: latestSalary.bankAccount || "NA",
              ifscCode: latestSalary.ifscCode || "NA",
              bankBranch: latestSalary.bankBranch || "NA",
              pan: latestSalary.pan || "NA",
              basicPay: latestSalary.basicPay || "NA",
              hra: latestSalary.hra || "NA",
              da: latestSalary.da || "NA",
              specialAllowance: latestSalary.specialAllowance || "NA",
              medicalAllowance: latestSalary.medicalAllowance || "NA",
              conveyanceAllowance: latestSalary.conveyanceAllowance || "NA",
              pf: latestSalary.pf || "NA",
              professionalTax: latestSalary.professionalTax || "NA",
              incomeTax: latestSalary.incomeTax || "NA",
              insurance: latestSalary.insurance || "NA",
            });
          }

          return data;
        })
      );

      setEmployees(employeeData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast.error("Failed to fetch employees");
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    try {
      const headers = [
        "Full Name",
        "Email",
        "Employee ID",
        "Organization",
        "Division",
        "Designation",
        "Employment Type",
        "Date of Joining",
        "Contract End Date",
        "Work Location",
        "Contact Number",
        "Blood Group",
        "Education Qualification",
        "Aadhaar Number",
        "Address",
        "Bank Name",
        "Bank Account Number",
        "IFSC Code",
        "Bank Branch",
        "PAN Number",
        "Basic Pay",
        "HRA",
        "DA",
        "Special Allowance",
        "Medical Allowance",
        "Conveyance Allowance",
        "PF",
        "Professional Tax",
        "Income Tax",
        "Insurance",
      ];

      const csvData = filteredEmployees.map((employee) => [
        employee.name || "NA",
        employee.email || "NA",
        employee.employeeId || "NA",
        employee.organizationName || "NA",
        employee.departmentName || "NA",
        employee.designation || "NA",
        employee.employmentType?.charAt(0).toUpperCase() +
          employee.employmentType?.slice(1) || "NA",
        employee.doj || "NA",
        employee.ced || "NA",
        employee.workLocation || "NA",
        employee.emergencyContact || "NA",
        employee.bloodGroup || "NA",
        employee.education || "NA",
        employee.aadhaar || "NA",
        employee.address || "NA",
        employee.bankName || "NA",
        employee.bankAccount || "NA",
        employee.ifscCode || "NA",
        employee.bankBranch || "NA",
        employee.pan || "NA",
        employee.basicPay || "NA",
        employee.hra || "NA",
        employee.da || "NA",
        employee.specialAllowance || "NA",
        employee.medicalAllowance || "NA",
        employee.conveyanceAllowance || "NA",
        employee.pf || "NA",
        employee.professionalTax || "NA",
        employee.incomeTax || "NA",
        employee.insurance || "NA",
      ]);

      // Add headers to the beginning of the CSV data
      csvData.unshift(headers);

      // Convert to CSV string
      const csvString = csvData
        .map((row) =>
          row
            .map((cell) => {
              // Escape special characters and wrap in quotes if needed
              const escaped = String(cell).replace(/"/g, '""');
              return /[,"\n]/.test(escaped) ? `"${escaped}"` : escaped;
            })
            .join(",")
        )
        .join("\n");

      // Create blob and download
      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `employee_master_data_${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Employee data exported successfully");
    } catch (error) {
      console.error("Error exporting data:", error);
      toast.error("Failed to export employee data");
    }
  };

  const filteredEmployees = employees.filter((employee) => {
    const matchesDepartment =
      selectedDepartment === "all" ||
      employee.departmentId === selectedDepartment;
    const matchesEmploymentType =
      selectedEmploymentType === "all" ||
      employee.employmentType === selectedEmploymentType;
    const searchString = searchQuery.toLowerCase();
    const matchesSearch =
      employee.name?.toLowerCase().includes(searchString) ||
      employee.email?.toLowerCase().includes(searchString) ||
      employee.designation?.toLowerCase().includes(searchString) ||
      employee.departmentName?.toLowerCase().includes(searchString);

    return matchesDepartment && matchesEmploymentType && matchesSearch;
  });

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold flex items-center">
          <Database size={20} className="mr-2" />
          Employee Master Data
        </h2>
        <button
          onClick={exportToCSV}
          className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          <Download size={20} />
          <span>Export CSV</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div className="relative">
          <Building
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={16}
          />
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 text-sm border border-gray-300 rounded-lg appearance-none"
          >
            <option value="all">All Divisions</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
          />
        </div>

        <div className="relative">
          <Briefcase
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={16}
          />
          <select
            value={selectedEmploymentType}
            onChange={(e) => setSelectedEmploymentType(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 text-sm border border-gray-300 rounded-lg appearance-none"
          >
            <option value="all">All Employment Types</option>
            <option value="regular">Regular</option>
            <option value="contract">Contract</option>
            <option value="outsourcing">Outsourcing</option>
          </select>
          <ChevronDown
            size={14}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
          />
        </div>

        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={16}
          />
          <input
            type="text"
            placeholder="Search employees..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Division
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employment Type
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date of Joining
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEmployees.map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {employee.name || "N/A"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {employee.email || "N/A"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {employee.designation || "N/A"}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">
                        {employee.departmentName || "N/A"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {employee.organizationName || "N/A"}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        employee.employmentType === "regular"
                          ? "bg-green-100 text-green-800"
                          : employee.employmentType === "contract"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-purple-100 text-purple-800"
                      }`}
                    >
                      {employee.employmentType
                        ? employee.employmentType.charAt(0).toUpperCase() +
                          employee.employmentType.slice(1)
                        : "N/A"}
                    </span>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500">
                    {employee.doj || "N/A"}
                    {employee.ced && (
                      <div className="text-xs text-red-500">
                        Contract End: {employee.ced}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-xs">
                    <button
                      onClick={() =>
                        navigate(`/admin/master-data/employees/${employee.id}`)
                      }
                      className="text-blue-600 hover:text-blue-900 font-medium"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
              {filteredEmployees.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-2 text-center text-sm text-gray-500"
                  >
                    No employees found matching your criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
