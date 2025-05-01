import React, { useState } from 'react';
import { Building, Plus, Users, X, CheckCircle, XCircle, Clock, ChevronDown, ChevronRight, Trash2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, updateDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import toast from 'react-hot-toast';

interface Department {
  id: string;
  name: string;
  description: string;
  users: any[];
}

interface Organization {
  id: string;
  name: string;
  description: string;
  departments: Department[];
}

interface OrganizationListProps {
  organizations: Organization[];
  onCreateOrganization: (name: string, description: string) => void;
  onCreateDepartment: (orgId: string, name: string, description: string) => void;
}

export default function OrganizationList({
  organizations,
  onCreateOrganization,
  onCreateDepartment,
}: OrganizationListProps) {
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [showCreateDept, setShowCreateDept] = useState<string | null>(null);
  const [newOrg, setNewOrg] = useState({ name: '', description: '' });
  const [newDept, setNewDept] = useState({ name: '', description: '' });
  const [expandedOrg, setExpandedOrg] = useState<string | null>(null);
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'organization' | 'department';
    orgId: string;
    deptId?: string;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCreateOrganization = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateOrganization(newOrg.name, newOrg.description);
    setNewOrg({ name: '', description: '' });
    setShowCreateOrg(false);
  };

  const handleCreateDepartment = (e: React.FormEvent, orgId: string) => {
    e.preventDefault();
    onCreateDepartment(orgId, newDept.name, newDept.description);
    setNewDept({ name: '', description: '' });
    setShowCreateDept(null);
  };

  const toggleDepartment = (deptId: string) => {
    setExpandedDepts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(deptId)) {
        newSet.delete(deptId);
      } else {
        newSet.add(deptId);
      }
      return newSet;
    });
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    try {
      setIsDeleting(true);
      const { type, orgId, deptId } = deleteConfirm;

      if (type === 'organization') {
        const organization = organizations.find(org => org.id === orgId);
        if (!organization) throw new Error('Organization not found');

        // Update user references
        for (const dept of organization.departments) {
          const usersRef = collection(db, 'users');
          const usersQuery = query(
            usersRef,
            where('departmentId', '==', dept.id),
            where('organizationId', '==', orgId)
          );
          const usersSnapshot = await getDocs(usersQuery);
          
          await Promise.all(usersSnapshot.docs.map(userDoc => 
            updateDoc(doc(db, 'users', userDoc.id), {
              departmentId: null,
              organizationId: null
            })
          ));

          // Delete department
          await deleteDoc(doc(db, `organizations/${orgId}/departments`, dept.id));
        }

        // Delete organization
        await deleteDoc(doc(db, 'organizations', orgId));
        toast.success('Organization deleted successfully');
      } else {
        if (!deptId) throw new Error('Department ID not found');

        // Update user references
        const usersRef = collection(db, 'users');
        const usersQuery = query(
          usersRef,
          where('departmentId', '==', deptId),
          where('organizationId', '==', orgId)
        );
        const usersSnapshot = await getDocs(usersQuery);
        
        await Promise.all(usersSnapshot.docs.map(userDoc => 
          updateDoc(doc(db, 'users', userDoc.id), {
            departmentId: null,
            organizationId: null
          })
        ));

        // Delete department
        await deleteDoc(doc(db, `organizations/${orgId}/departments`, deptId));
        toast.success('Division deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error(`Failed to delete ${deleteConfirm.type}`);
    } finally {
      setIsDeleting(false);
      setDeleteConfirm(null);
    }
  };

  const updateLocalUserStatus = async (userId: string, isActive: boolean, orgId: string, deptId: string) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        isActive,
        statusUpdatedAt: new Date(),
      });

      const sessionsRef = collection(db, 'sessions');
      const q = query(sessionsRef, where('userId', '==', userId));
      const sessionsSnapshot = await getDocs(q);
      
      await Promise.all(sessionsSnapshot.docs.map(sessionDoc => 
        updateDoc(doc(sessionsRef, sessionDoc.id), {
          forceLogout: true,
          lastUpdated: new Date()
        })
      ));

      toast.success(`User ${isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Failed to update user status');
    }
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    return new Date(date.seconds * 1000).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold flex items-center">
          <Building size={24} className="mr-2" />
          Organizations
        </h2>
        <button
          onClick={() => setShowCreateOrg(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus size={20} />
          <span>Create Organization</span>
        </button>
      </div>

      <AnimatePresence>
        {showCreateOrg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-lg shadow-md p-6 mb-6"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Create New Organization</h3>
              <button
                onClick={() => setShowCreateOrg(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateOrganization} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organization Name
                </label>
                <input
                  type="text"
                  value={newOrg.name}
                  onChange={(e) => setNewOrg({ ...newOrg, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newOrg.description}
                  onChange={(e) => setNewOrg({ ...newOrg, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Create Organization
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-6">
        <AnimatePresence>
          {organizations.map((org) => (
            <motion.div
              key={org.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              layout
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <div
                onClick={() => setExpandedOrg(expandedOrg === org.id ? null : org.id)}
                className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    {expandedOrg === org.id ? (
                      <ChevronDown size={20} className="text-gray-500" />
                    ) : (
                      <ChevronRight size={20} className="text-gray-500" />
                    )}
                    <div>
                      <h3 className="text-lg font-semibold">{org.name}</h3>
                      <p className="text-gray-600">{org.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowCreateDept(org.id);
                      }}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                      <Plus size={16} />
                      <span>Add Division</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm({
                          type: 'organization',
                          orgId: org.id,
                          name: org.name
                        });
                      }}
                      className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      <Trash2 size={16} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {expandedOrg === org.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-gray-200 p-6 bg-gray-50"
                  >
                    <h4 className="text-md font-semibold mb-4">Divisions</h4>
                    <div className="grid grid-cols-1 gap-4">
                      {org.departments.map((dept) => (
                        <motion.div
                          key={dept.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          className="bg-white rounded-lg p-4 shadow-sm"
                        >
                          <div 
                            className="flex justify-between items-start mb-2 cursor-pointer"
                            onClick={() => toggleDepartment(dept.id)}
                          >
                            <div className="flex items-center space-x-2">
                              {expandedDepts.has(dept.id) ? (
                                <ChevronDown size={16} className="text-gray-500" />
                              ) : (
                                <ChevronRight size={16} className="text-gray-500" />
                              )}
                              <div>
                                <h5 className="font-semibold">{dept.name}</h5>
                                <p className="text-sm text-gray-600">{dept.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-2 text-sm text-gray-500">
                                <Users size={16} />
                                <span>{dept.users.length} users</span>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteConfirm({
                                    type: 'department',
                                    orgId: org.id,
                                    deptId: dept.id,
                                    name: dept.name
                                  });
                                }}
                                className="text-red-500 hover:text-red-600 transition-colors"
                                title="Delete Department"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                          
                          <AnimatePresence>
                            {expandedDepts.has(dept.id) && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="mt-3 pt-3 border-t"
                              >
                                {dept.users.length > 0 ? (
                                  <div className="space-y-3">
                                    {dept.users.map((user) => (
                                      <motion.div
                                        key={user.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                                      >
                                        <div>
                                          <div className="text-sm font-medium">{user.name}</div>
                                          <div className="text-sm text-gray-600">{user.designation}</div>
                                        </div>
                                        <div className="flex items-center space-x-4">
                                          <div className="flex flex-col items-end">
                                            <div className="text-xs text-gray-500">
                                              Last Status Update:
                                            </div>
                                            <div className="text-xs text-gray-600">
                                              {formatDate(user.statusUpdatedAt)}
                                            </div>
                                          </div>
                                          <div className="flex space-x-2">
                                            <button
                                              onClick={() => updateLocalUserStatus(user.id, true, org.id, dept.id)}
                                              className={`px-3 py-1 rounded-full text-sm flex items-center space-x-1 ${
                                                user.isActive
                                                  ? 'bg-green-100 text-green-700'
                                                  : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-600'
                                              }`}
                                            >
                                              <CheckCircle size={14} />
                                              <span>Active</span>
                                            </button>
                                            <button
                                              onClick={() => updateLocalUserStatus(user.id, false, org.id, dept.id)}
                                              className={`px-3 py-1 rounded-full text-sm flex items-center space-x-1 ${
                                                !user.isActive
                                                  ? 'bg-red-100 text-red-700'
                                                  : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600'
                                              }`}
                                            >
                                              <XCircle size={14} />
                                              <span>Inactive</span>
                                            </button>
                                          </div>
                                        </div>
                                      </motion.div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-center text-gray-500 text-sm">No team members yet</p>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {showCreateDept === org.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-gray-200 p-6"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-md font-semibold">Create New Division</h4>
                      <button
                        onClick={() => setShowCreateDept(null)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <X size={20} />
                      </button>
                    </div>
                    <form onSubmit={(e) => handleCreateDepartment(e, org.id)} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Division Name
                        </label>
                        <input
                          type="text"
                          value={newDept.name}
                          onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          value={newDept.description}
                          onChange={(e) => setNewDept({ ...newDept, description: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={3}
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full py-2 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                      >
                        Create Division
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>

        {organizations.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8"
          >
            <Building size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No organizations found</p>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
            >
              <div className="flex items-center space-x-2 text-red-600 mb-4">
                <AlertTriangle size={24} />
                <h3 className="text-lg font-semibold">Delete {deleteConfirm.type === 'organization' ? 'Organization' : 'Department'}</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete <span className="font-semibold">{deleteConfirm.name}</span>? This action will:
                <ul className="list-disc ml-6 mt-2">
                  {deleteConfirm.type === 'organization' && (
                    <li>Delete all Divisions within this organization</li>
                  )}
                  <li>Remove all user associations</li>
                  <li>Delete all associated data</li>
                  <li>This action cannot be undone</li>
                </ul>
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center space-x-2 disabled:opacity-50"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      <span>Delete {deleteConfirm.type === 'organization' ? 'Organization' : 'Department'}</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}