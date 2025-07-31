import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, User, Building, Briefcase, Calendar, MapPin, Phone, GraduationCap, FileText } from 'lucide-react';
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import toast from 'react-hot-toast';

export default function EmployeeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [employeeData, setEmployeeData] = useState<any>(null);

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const employmentTypes = ['regular', 'contract', 'outsourcing'];

  useEffect(() => {
    fetchOrganizationsAndDepartments();
    fetchEmployeeData();
  }, [id]);

  useEffect(() => {
    if (employeeData?.organizationId) {
      fetchDepartments(employeeData.organizationId);
    }
  }, [employeeData?.organizationId]);

  const fetchOrganizationsAndDepartments = async () => {
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

  const fetchEmployeeData = async () => {
    try {
      if (!id) return;

      const employeeRef = doc(db, 'users', id);
      const employeeSnap = await getDoc(employeeRef);

      if (employeeSnap.exists()) {
        const data = employeeSnap.data();
        
        if (data.organizationId && data.departmentId) {
          const deptRef = doc(db, `organizations/${data.organizationId}/departments`, data.departmentId);
          const deptSnap = await getDoc(deptRef);
          if (deptSnap.exists()) {
            data.departmentName = deptSnap.data().name;
          }

          const orgRef = doc(db, 'organizations', data.organizationId);
          const orgSnapshot = await getDoc(orgRef);
          if (orgSnapshot.exists()) {
            data.organizationName = orgSnapshot.data().name;
          }

          // Fetch departments for the organization
          await fetchDepartments(data.organizationId);
        }

        setEmployeeData(data);
      } else {
        toast.error('Employee not found');
        navigate('/admin/master-data');
      }
    } catch (error) {
      console.error('Error fetching employee data:', error);
      toast.error('Failed to fetch employee data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      if (!id) return;

      const employeeRef = doc(db, 'users', id);
      await updateDoc(employeeRef, employeeData);

      toast.success('Employee data updated successfully');
      setEditing(false);
    } catch (error) {
      console.error('Error updating employee data:', error);
      toast.error('Failed to update employee data');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate('/admin');
  };

  const handleOrganizationChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const orgId = e.target.value;
    setEmployeeData({ ...employeeData, organizationId: orgId, departmentId: '' });
    await fetchDepartments(orgId);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center px-4 py-3 border-b">
        <div className="flex items-center space-x-3">
          <button
            onClick={handleBack}
            className="text-gray-500 hover:text-gray-700 transition-colors flex items-center space-x-2 px-3 py-1.5 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>
          <div className="flex items-center">
            <User size={20} className="mr-2 text-blue-500" />
            <h2 className="text-lg font-semibold">Employee Details</h2>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {editing ? (
            <>
              <button
                onClick={() => setEditing(false)}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center space-x-1"
              >
                <Save size={16} />
                <span>{saving ? 'Saving...' : 'Save'}</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-500">Full Name</label>
            <input
              type="text"
              value={employeeData.name}
              onChange={(e) => setEmployeeData({ ...employeeData, name: e.target.value })}
              className={`w-full px-3 py-1.5 text-sm border rounded ${
                editing ? 'bg-white border-gray-300' : 'bg-gray-50 border-gray-200'
              }`}
              disabled={!editing}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Email</label>
            <input
              type="email"
              value={employeeData.email}
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded bg-gray-50"
              disabled
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Employee ID</label>
            <input
              type="text"
              value={employeeData.employeeId}
              onChange={(e) => setEmployeeData({ ...employeeData, employeeId: e.target.value })}
              className={`w-full px-3 py-1.5 text-sm border rounded ${
                editing ? 'bg-white border-gray-300' : 'bg-gray-50 border-gray-200'
              }`}
              disabled={!editing}
            />
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-500">Organization</label>
            <select
              value={employeeData.organizationId}
              onChange={handleOrganizationChange}
              className={`w-full px-3 py-1.5 text-sm border rounded ${
                editing ? 'bg-white border-gray-300' : 'bg-gray-50 border-gray-200'
              }`}
              disabled={!editing}
            >
              <option value="">Select Organization</option>
              {organizations.map(org => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Division</label>
            <select
              value={employeeData.departmentId}
              onChange={(e) => setEmployeeData({ ...employeeData, departmentId: e.target.value })}
              className={`w-full px-3 py-1.5 text-sm border rounded ${
                editing ? 'bg-white border-gray-300' : 'bg-gray-50 border-gray-200'
              }`}
              disabled={!editing || !employeeData.organizationId}
            >
              <option value="">Select Division</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Designation</label>
            <input
              type="text"
              value={employeeData.designation}
              onChange={(e) => setEmployeeData({ ...employeeData, designation: e.target.value })}
              className={`w-full px-3 py-1.5 text-sm border rounded ${
                editing ? 'bg-white border-gray-300' : 'bg-gray-50 border-gray-200'
              }`}
              disabled={!editing}
            />
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-500">Employment Type</label>
            <select
              value={employeeData.employmentType}
              onChange={(e) => setEmployeeData({ ...employeeData, employmentType: e.target.value })}
              className={`w-full px-3 py-1.5 text-sm border rounded ${
                editing ? 'bg-white border-gray-300' : 'bg-gray-50 border-gray-200'
              }`}
              disabled={!editing}
            >
              {employmentTypes.map(type => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Date of Joining</label>
            <input
              type="date"
              value={employeeData.doj}
              onChange={(e) => setEmployeeData({ ...employeeData, doj: e.target.value })}
              className={`w-full px-3 py-1.5 text-sm border rounded ${
                editing ? 'bg-white border-gray-300' : 'bg-gray-50 border-gray-200'
              }`}
              disabled={!editing}
            />
          </div>
          {employeeData.employmentType !== 'regular' && (
            <div>
              <label className="text-xs font-medium text-gray-500">Contract End Date</label>
              <input
                type="date"
                value={employeeData.ced}
                onChange={(e) => setEmployeeData({ ...employeeData, ced: e.target.value })}
                className={`w-full px-3 py-1.5 text-sm border rounded ${
                  editing ? 'bg-white border-gray-300' : 'bg-gray-50 border-gray-200'
                }`}
                disabled={!editing}
              />
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-500">Work Location</label>
            <input
              type="text"
              value={employeeData.workLocation}
              onChange={(e) => setEmployeeData({ ...employeeData, workLocation: e.target.value })}
              className={`w-full px-3 py-1.5 text-sm border rounded ${
                editing ? 'bg-white border-gray-300' : 'bg-gray-50 border-gray-200'
              }`}
              disabled={!editing}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Contact Number</label>
            <input
              type="tel"
              value={employeeData.emergencyContact}
              onChange={(e) => setEmployeeData({ ...employeeData, emergencyContact: e.target.value })}
              className={`w-full px-3 py-1.5 text-sm border rounded ${
                editing ? 'bg-white border-gray-300' : 'bg-gray-50 border-gray-200'
              }`}
              disabled={!editing}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Blood Group</label>
            <select
              value={employeeData.bloodGroup}
              onChange={(e) => setEmployeeData({ ...employeeData, bloodGroup: e.target.value })}
              className={`w-full px-3 py-1.5 text-sm border rounded ${
                editing ? 'bg-white border-gray-300' : 'bg-gray-50 border-gray-200'
              }`}
              disabled={!editing}
            >
              {bloodGroups.map(group => (
                <option key={group} value={group}>{group}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-500">Education Qualification</label>
            <input
              type="text"
              value={employeeData.education}
              onChange={(e) => setEmployeeData({ ...employeeData, education: e.target.value })}
              className={`w-full px-3 py-1.5 text-sm border rounded ${
                editing ? 'bg-white border-gray-300' : 'bg-gray-50 border-gray-200'
              }`}
              disabled={!editing}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Aadhaar Number</label>
            <input
              type="text"
              value={employeeData.aadhaar}
              onChange={(e) => setEmployeeData({ ...employeeData, aadhaar: e.target.value })}
              className={`w-full px-3 py-1.5 text-sm border rounded ${
                editing ? 'bg-white border-gray-300' : 'bg-gray-50 border-gray-200'
              }`}
              disabled={!editing}
              pattern="[0-9]{12}"
              title="Please enter a valid 12-digit Aadhaar number"
            />
          </div>
        </div>

        <div className="md:col-span-3">
          <label className="text-xs font-medium text-gray-500">Address</label>
          <textarea
            value={employeeData.address}
            onChange={(e) => setEmployeeData({ ...employeeData, address: e.target.value })}
            className={`w-full px-3 py-1.5 text-sm border rounded ${
              editing ? 'bg-white border-gray-300' : 'bg-gray-50 border-gray-200'
            }`}
            rows={2}
            disabled={!editing}
          />
        </div>
      </div>
    </div>
  );
}