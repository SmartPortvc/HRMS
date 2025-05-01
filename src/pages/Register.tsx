import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, addDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../lib/firebase';
import { Lock, Mail, User, Briefcase, Building, Calendar, MapPin, Phone, GraduationCap, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import emailjs from '@emailjs/browser';

export default function Register() {
  const { invitationId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    designation: '',
    organizationId: '',
    organizationName: '',
    departmentId: '',
    departmentName: '',
    role: '',
    employeeId: '',
    employmentType: '',
    doj: '',
    ced: '',
    workLocation: '',
    emergencyContact: '',
    bloodGroup: '',
    address: '',
    education: '',
    aadhaar: '',
    password: '',
    confirmPassword: '',
  });

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  useEffect(() => {
    const fetchInvitation = async () => {
      try {
        if (!invitationId) {
          toast.error('Invalid invitation link');
          navigate('/');
          return;
        }

        const invitationRef = doc(db, 'invitations', invitationId);
        const invitationDoc = await getDoc(invitationRef);

        if (!invitationDoc.exists()) {
          toast.error('Invitation not found');
          navigate('/');
          return;
        }

        const invitation = invitationDoc.data();
        
        // Check if invitation has expired
        if (new Date() > invitation.expiresAt.toDate()) {
          toast.error('Invitation has expired');
          navigate('/');
          return;
        }

        // Check if invitation has already been used
        if (invitation.status === 'completed') {
          toast.error('This invitation has already been used');
          navigate('/');
          return;
        }

        // Auto-fill all the stored data
        setFormData({
          ...formData,
          ...invitation,
          password: '',
          confirmPassword: ''
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching invitation:', error);
        toast.error('Error loading invitation');
        navigate('/');
      }
    };

    fetchInvitation();
  }, [invitationId, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Create user document in Firestore
      await addDoc(collection(db, 'users'), {
        uid: userCredential.user.uid,
        email: formData.email,
        name: formData.name,
        designation: formData.designation,
        organizationId: formData.organizationId,
        departmentId: formData.departmentId,
        role: formData.role,
        employeeId: formData.employeeId,
        employmentType: formData.employmentType,
        doj: formData.doj,
        ced: formData.ced,
        workLocation: formData.workLocation,
        emergencyContact: formData.emergencyContact,
        bloodGroup: formData.bloodGroup,
        address: formData.address,
        education: formData.education,
        aadhaar: formData.aadhaar,
        isActive: true,
        statusUpdatedAt: new Date(),
        createdAt: new Date(),
      });

      // Update invitation status
      const invitationRef = doc(db, 'invitations', invitationId!);
      await updateDoc(invitationRef, {
        status: 'completed',
        completedAt: new Date(),
      });

      // Initialize EmailJS
      emailjs.init('H7gaDvdCkNtNdZTE2');

      // Send welcome email
      await emailjs.send(
        'service_1wkuh0q',
        'template_rxxheli',
        {
          to_email: formData.email,
          to_name: formData.name,
          from_name: 'HRMS Workflow',
          reply_to: 'info@apmaritime.in'
        }
      );

      toast.success('Registration completed successfully');
      navigate('/');
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Failed to complete registration');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white py-12 px-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-4xl">
        <div className="flex flex-col items-center mb-8">
          <img 
            src="https://media.licdn.com/dms/image/v2/C560BAQEV5bmhSzmwXA/company-logo_200_200/company-logo_200_200/0/1632725060447?e=2147483647&v=beta&t=HLSjgaNC62aOcklA0mMrLOzEue-CD6QsGxP8fVnr610"
            alt="APMB Logo"
            className="w-24 h-24 mb-4 object-contain"
          />
          <h1 className="text-2xl font-bold text-gray-900 text-center leading-tight">
            Andhra Pradesh Maritime Board
            <span className="block text-lg text-gray-700 mt-1">(APMB)</span>
          </h1>
        </div>
        
        <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">Complete Registration</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  value={formData.email}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                  disabled
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={formData.name}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                  disabled
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={formData.employeeId}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                  disabled
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={formData.designation}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                  disabled
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Organization</label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={formData.organizationName}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                  disabled
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Division</label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={formData.departmentName}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                  disabled
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employment Type</label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={formData.employmentType.charAt(0).toUpperCase() + formData.employmentType.slice(1)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                  disabled
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Joining</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="date"
                  value={formData.doj}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                  disabled
                />
              </div>
            </div>

            {formData.employmentType !== 'regular' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contract End Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="date"
                    value={formData.ced}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                    disabled
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Work Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={formData.workLocation}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                  disabled
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={formData.emergencyContact}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                  disabled
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.bloodGroup}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                  disabled
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Education Qualification</label>
              <div className="relative">
                <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={formData.education}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                  disabled
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Aadhaar Number</label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={formData.aadhaar}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                  disabled
                />
              </div>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-gray-400" size={20} />
                <textarea
                  value={formData.address}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                  rows={3}
                  disabled
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Set Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter password"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Confirm password"
                  required
                  minLength={6}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              Complete Registration
            </button>
          </div>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Powered by Volteo Maritime</p>
          <p className="mt-1">© 2025 Volteo Maritime. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}