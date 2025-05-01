import React, { useState } from 'react';
import { X } from 'lucide-react';
import emailjs from '@emailjs/browser';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface InviteUserFormProps {
  onClose: () => void;
}

export default function InviteUserForm({ onClose }: InviteUserFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    designation: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Create invitation record in Firestore
      const invitationRef = await addDoc(collection(db, 'invitations'), {
        email: formData.email,
        name: formData.name,
        designation: formData.designation,
        status: 'pending',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours from now
      });

      // Prepare the template parameters
      const templateParams = {
        to_email: formData.email,
        to_name: formData.name,
        registration_link: `${window.location.origin}/register/${invitationRef.id}`,
        user_designation: formData.designation,
        from_name: 'APMB Workflow',
        reply_to: 'info@apmaritime.in'
      };

      // Initialize EmailJS with your public key
      emailjs.init('H7gaDvdCkNtNdZTE2');

      // Send the email using the updated template and service
      const response = await emailjs.send(
        'service_1wkuh0q',
        'template_rxxheli',
        templateParams,
        'H7gaDvdCkNtNdZTE2'
      );

      if (response.status === 200) {
        toast.success('Invitation sent successfully');
        onClose();
      } else {
        throw new Error('Failed to send invitation');
      }
    } catch (error) {
      console.error('Email sending error:', error);
      toast.error('Failed to send invitation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div className="bg-white rounded-lg p-8 w-96 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          disabled={isSubmitting}
        >
          <X size={20} />
        </button>
        
        <h2 className="text-2xl font-bold mb-6">Invite User</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={isSubmitting}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={isSubmitting}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Designation
            </label>
            <input
              type="text"
              value={formData.designation}
              onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={isSubmitting}
            />
          </div>
          
          <button
            type="submit"
            className="w-full py-2 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Sending...' : 'Send Invitation'}
          </button>
        </form>
      </div>
    </motion.div>
  );
}