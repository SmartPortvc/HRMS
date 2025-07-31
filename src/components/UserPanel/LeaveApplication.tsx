import React, { useState, useEffect } from "react";
import { Upload, X, Calendar } from "lucide-react";
import { db } from "../../lib/firebase";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
} from "firebase/firestore";

import toast from "react-hot-toast";
import { useCurrentUser } from "../../hooks/useCurrentUser";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
];

type ApprovalLevel = {
  status: "pending" | "approved" | "rejected";
  by: { uid: string; name: string; email: string } | null;
  at: any | null;
  note: string | null;
};

type LeaveApplicationType = {
  id: string;
  reason: string;
  fileName?: string;
  fileData?: string;
  uploadedAt?: { seconds: number };
  from?: any;
  to?: any;
  createdAt?: any;
  userId: string;
  createdBy: {
    uid: string;
    name: string;
    email: string;
    departmentId: string;
    departmentName: string;
  };
  status: string;
  approval?: {
    hod?: ApprovalLevel;
    ceo?: ApprovalLevel;
  };
};

export default function LeaveApplication() {
  const [reason, setReason] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fromDate, setFromDate] = useState("");
  const [fromTime, setFromTime] = useState("");
  const [toDate, setToDate] = useState("");
  const [toTime, setToTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [leaveApplications, setLeaveApplications] = useState<
    LeaveApplicationType[]
  >([]);
  const [loading, setLoading] = useState(true);
  const userCurrent = useCurrentUser();
  const userData = userCurrent && userCurrent.userData;
  const userLoading = userCurrent && userCurrent.loading;
  const [showForm, setShowForm] = useState(false);

  const validateFile = (file: File): boolean => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      alert(
        "Invalid file type. Please upload PDF, Word, PNG, or JPEG files only."
      );
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      alert("File size exceeds 10MB limit.");
      return false;
    }
    return true;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      } else {
        e.target.value = "";
        setSelectedFile(null);
      }
    }
  };

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const applicationsRef = collection(db, "leave_applications");
      let q;
      if (userData?.role === "user") {
        q = query(applicationsRef, where("userId", "==", userData.uid));
      } else if (userData?.role === "department_admin") {
        q = query(
          applicationsRef,
          where("createdBy.departmentId", "==", userData.departmentId)
        );
      } else if (userData?.role === "admin") {
        q = query(applicationsRef);
      }
      if (!q) return;
      const querySnapshot = await getDocs(q);
      let apps = querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as LeaveApplicationType)
      );
      setLeaveApplications(apps);
    } catch (err) {
      toast.error("Failed to fetch leave applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userLoading) return;
    if (!userData) {
      setLoading(false);
      return;
    }
    fetchApplications();
  }, [userData, userLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData) {
      toast.error("User not authenticated");
      return;
    }
    if (!reason.trim()) {
      toast.error("Please enter a reason for leave.");
      return;
    }
    if (!fromDate || !fromTime || !toDate || !toTime) {
      toast.error("Please select leave from and to date/time.");
      return;
    }
    setSubmitting(true);
    try {
      let fileName = "";
      let fileData = "";
      if (selectedFile) {
        const reader = new FileReader();
        reader.readAsDataURL(selectedFile);
        fileName = selectedFile.name;
        fileData = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
        });
      }
      const dataToSubmit = {
        fileName: fileName || null,
        fileData: fileData || null,
        reason,
        uploadedAt: { seconds: Math.floor(Date.now() / 1000) },
        from: Timestamp.fromDate(new Date(`${fromDate}T${fromTime}`)),
        to: Timestamp.fromDate(new Date(`${toDate}T${toTime}`)),
        createdAt: Timestamp.now(),
        userId: userData.uid,
        createdBy: {
          uid: userData.uid,
          name: userData.name,
          email: userData.email,
          departmentId: userData.departmentId,
        },
        status: "pending",
        approval: {
          hod: { status: "pending", by: null, at: null, note: null },
          ceo: { status: "pending", by: null, at: null, note: null },
        },
      };

      await addDoc(collection(db, "leave_applications"), dataToSubmit);
      await fetchApplications();
      toast.success("Leave application submitted!");
      setReason("");
      setSelectedFile(null);
      setFromDate("");
      setFromTime("");
      setToDate("");
      setToTime("");
      setShowForm(false);
    } catch (err) {
      console.log(err);
      toast.error("Failed to submit leave application");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAction = async (
    appId: string,
    action: "approve" | "reject",
    level: "hod" | "ceo"
  ) => {
    const note = prompt(`Please enter a note for this action (${action}):`);
    if (!note) {
      toast.error("Note is required");
      return;
    }
    try {
      const docRef = collection(db, "leave_applications");
      const appDoc = (await import("firebase/firestore")).doc(
        db,
        "leave_applications",
        appId
      );
      const updateData: any = {};
      updateData[`approval.${level}`] = {
        status: action === "approve" ? "approved" : "rejected",
        by: {
          uid: userData.uid,
          name: userData.name,
          email: userData.email,
        },
        at: Timestamp.now(),
        note,
      };
      if (action === "reject") {
        updateData.status = "rejected";
      } else if (action === "approve" && level === "ceo") {
        updateData.status = "approved";
      }
      await (await import("firebase/firestore")).updateDoc(appDoc, updateData);
      toast.success(`Leave ${action}d!`);
      await fetchApplications();
    } catch (err) {
      toast.error("Failed to update leave status");
    }
  };

  const countApplications = (apps: LeaveApplicationType[]) => {
    const counts = {
      pending: 0,
      approved: 0,
      rejected: 0,
    };

    apps.forEach((app) => {
      if (userData?.role === "admin") {
        // For admin, only count applications that have HOD approval
        if (app.approval?.hod?.status === "approved") {
          if (app.status === "pending") counts.pending++;
          else if (app.status === "approved") counts.approved++;
          else if (app.status === "rejected") counts.rejected++;
        }
      } else {
        // For other roles, count all applications
        if (app.status === "pending") counts.pending++;
        else if (app.status === "approved") counts.approved++;
        else if (app.status === "rejected") counts.rejected++;
      }
    });

    return counts;
  };
  if (userLoading || userLoading === undefined) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (userData?.role === "user") {
    return (
      <div className="space-y-8">
        <div className="flex justify-end items-center">
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            onClick={() => setShowForm((v) => !v)}
          >
            {showForm ? "Close" : "Apply for Leave"}
          </button>
        </div>
        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Leave
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  placeholder="Enter reason for leave..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Optional Document
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                  <div className="space-y-1 text-center">
                    <Upload size={32} className="mx-auto text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                        <span>Upload a file</span>
                        <input
                          type="file"
                          className="sr-only"
                          onChange={handleFileSelect}
                          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PDF, DOC, DOCX, PNG, JPG up to 10MB
                    </p>
                  </div>
                </div>
                {selectedFile && (
                  <div className="mt-2 flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-sm text-gray-600">
                      {selectedFile.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Calendar size={16} className="mr-1" /> Leave From
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-1/2"
                      required
                    />
                    <input
                      type="time"
                      value={fromTime}
                      onChange={(e) => setFromTime(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-1/2"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Calendar size={16} className="mr-1" /> Leave To
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-1/2"
                      required
                    />
                    <input
                      type="time"
                      value={toTime}
                      onChange={(e) => setToTime(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-1/2"
                      required
                    />
                  </div>
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Submitting..." : "Submit Leave Application"}
              </button>
            </form>
          </div>
        )}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center">
            <Upload size={24} className="mr-2" />
            My Leave Applications
          </h2>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : leaveApplications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No leave applications found.
            </div>
          ) : (
            <div className="space-y-4">
              {leaveApplications.map((app) => (
                <div key={app.id} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-medium text-lg">
                          {app.reason}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            app.status === "approved"
                              ? "bg-green-100 text-green-800"
                              : app.status === "rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {app.status}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-2">
                        {app.fileName && app.fileData && (
                          <a
                            href={app.fileData}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline mr-2"
                          >
                            {app.fileName}
                          </a>
                        )}
                        {app.from && app.to && (
                          <span>
                            {`From: ${app.from
                              .toDate()
                              .toLocaleString()} To: ${app.to
                              .toDate()
                              .toLocaleString()}`}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Created:{" "}
                        {app.createdAt &&
                          app.createdAt.toDate().toLocaleString()}
                        <br />
                        Approval: HOD - {app.approval?.hod?.status}{" "}
                        {app.approval?.hod?.by
                          ? `by ${app.approval.hod.by.name}`
                          : ""}{" "}
                        {app.approval?.hod?.note
                          ? `: ${app.approval.hod.note}`
                          : ""}
                        <br />
                        CEO/Admin - {app.approval?.ceo?.status}{" "}
                        {app.approval?.ceo?.by
                          ? `by ${app.approval.ceo.by.name}`
                          : ""}{" "}
                        {app.approval?.ceo?.note
                          ? `: ${app.approval.ceo.note}`
                          : ""}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (userData?.role === "department_admin") {
    const departmentApps = leaveApplications.filter(
      (app) => app.createdBy.departmentId === userData.departmentId
    );
    const counts = countApplications(departmentApps);
    const pendingHodApps = departmentApps.filter(
      (app) => app.approval?.hod?.status === "pending"
    );

    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold flex items-center">
            <Upload size={24} className="mr-2" />
            Department Leave Applications
          </h2>
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            onClick={() => setShowForm((v) => !v)}
          >
            {showForm ? "Close" : "Apply for Leave"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
            <h3 className="text-gray-500 text-sm font-medium">Pending</h3>
            <p className="text-2xl font-bold">{counts.pending}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
            <h3 className="text-gray-500 text-sm font-medium">Approved</h3>
            <p className="text-2xl font-bold">{counts.approved}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-red-500">
            <h3 className="text-gray-500 text-sm font-medium">Rejected</h3>
            <p className="text-2xl font-bold">{counts.rejected}</p>
          </div>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Leave
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  placeholder="Enter reason for leave..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Optional Document
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                  <div className="space-y-1 text-center">
                    <Upload size={32} className="mx-auto text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                        <span>Upload a file</span>
                        <input
                          type="file"
                          className="sr-only"
                          onChange={handleFileSelect}
                          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PDF, DOC, DOCX, PNG, JPG up to 10MB
                    </p>
                  </div>
                </div>
                {selectedFile && (
                  <div className="mt-2 flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-sm text-gray-600">
                      {selectedFile.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Calendar size={16} className="mr-1" /> Leave From
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-1/2"
                      required
                    />
                    <input
                      type="time"
                      value={fromTime}
                      onChange={(e) => setFromTime(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-1/2"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Calendar size={16} className="mr-1" /> Leave To
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-1/2"
                      required
                    />
                    <input
                      type="time"
                      value={toTime}
                      onChange={(e) => setToTime(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-1/2"
                      required
                    />
                  </div>
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Submitting..." : "Submit Leave Application"}
              </button>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center">
            <Upload size={24} className="mr-2" />
            Pending HOD Approval ({pendingHodApps.length})
          </h2>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : pendingHodApps.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No pending applications for HOD approval.
            </div>
          ) : (
            <div className="space-y-4">
              {pendingHodApps.map((app) => (
                <div key={app.id} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-medium text-lg">
                          {app.reason}
                        </span>
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                          {app.status}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-2">
                        {app.fileName && app.fileData && (
                          <a
                            href={app.fileData}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline mr-2"
                          >
                            {app.fileName}
                          </a>
                        )}
                        {app.from && app.to && (
                          <span>
                            {`From: ${app.from
                              .toDate()
                              .toLocaleString()} To: ${app.to
                              .toDate()
                              .toLocaleString()}`}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Created:{" "}
                        {app.createdAt &&
                          app.createdAt.toDate().toLocaleString()}
                        <br />
                        By: {app.createdBy.name} ({app.createdBy.email})
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <button
                        className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                        onClick={() => handleAction(app.id, "approve", "hod")}
                      >
                        Approve
                      </button>
                      <button
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                        onClick={() => handleAction(app.id, "reject", "hod")}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center">
            <Upload size={24} className="mr-2" />
            Department Leave History
          </h2>
          {departmentApps.filter((app) => app.status !== "pending").length ===
          0 ? (
            <div className="text-center py-8 text-gray-500">
              No approved or rejected applications yet.
            </div>
          ) : (
            <div className="space-y-4">
              {departmentApps
                .filter((app) => app.status !== "pending")
                .map((app) => (
                  <div key={app.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-medium text-lg">
                            {app.reason}
                          </span>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              app.status === "approved"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {app.status}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-2">
                          {app.fileName && app.fileData && (
                            <a
                              href={app.fileData}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 underline mr-2"
                            >
                              {app.fileName}
                            </a>
                          )}
                          {app.from && app.to && (
                            <span>
                              {`From: ${app.from
                                .toDate()
                                .toLocaleString()} To: ${app.to
                                .toDate()
                                .toLocaleString()}`}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Created:{" "}
                          {app.createdAt &&
                            app.createdAt.toDate().toLocaleString()}
                          <br />
                          By: {app.createdBy.name} ({app.createdBy.email})
                          <br />
                          Approval: HOD - {app.approval?.hod?.status}{" "}
                          {app.approval?.hod?.by
                            ? `by ${app.approval.hod.by.name}`
                            : ""}{" "}
                          {app.approval?.hod?.note
                            ? `: ${app.approval.hod.note}`
                            : ""}
                          <br />
                          CEO/Admin - {app.approval?.ceo?.status}{" "}
                          {app.approval?.ceo?.by
                            ? `by ${app.approval.ceo.by.name}`
                            : ""}{" "}
                          {app.approval?.ceo?.note
                            ? `: ${app.approval.ceo.note}`
                            : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (userData?.role === "admin") {
    const counts = countApplications(leaveApplications);
    const pendingCeoApps = leaveApplications.filter(
      (app) =>
        app.approval?.hod?.status === "approved" &&
        app.approval?.ceo?.status === "pending"
    );
    const approvedApps = leaveApplications.filter(
      (app) => app.status === "approved"
    );
    const rejectedApps = leaveApplications.filter(
      (app) => app.status === "rejected"
    );

    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
            <h3 className="text-gray-500 text-sm font-medium">
              Pending CEO Approval
            </h3>
            <p className="text-2xl font-bold">{pendingCeoApps.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
            <h3 className="text-gray-500 text-sm font-medium">Approved</h3>
            <p className="text-2xl font-bold">{approvedApps.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-red-500">
            <h3 className="text-gray-500 text-sm font-medium">Rejected</h3>
            <p className="text-2xl font-bold">{rejectedApps.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center">
            <Upload size={24} className="mr-2" />
            Pending CEO/Admin Approval ({pendingCeoApps.length})
          </h2>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : pendingCeoApps.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No pending applications for CEO/Admin approval.
            </div>
          ) : (
            <div className="space-y-4">
              {pendingCeoApps.map((app) => (
                <div key={app.id} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-medium text-lg">
                          {app.reason}
                        </span>
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                          {app.status}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-2">
                        {app.fileName && app.fileData && (
                          <a
                            href={app.fileData}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline mr-2"
                          >
                            {app.fileName}
                          </a>
                        )}
                        {app.from && app.to && (
                          <span>
                            {`From: ${app.from
                              .toDate()
                              .toLocaleString()} To: ${app.to
                              .toDate()
                              .toLocaleString()}`}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Created:{" "}
                        {app.createdAt &&
                          app.createdAt.toDate().toLocaleString()}
                        <br />
                        Department: {app.createdBy.departmentName}
                        <br />
                        By: {app.createdBy.name} ({app.createdBy.email})
                        <br />
                        HOD Approval: {app.approval?.hod?.status}{" "}
                        {app.approval?.hod?.by
                          ? `by ${app.approval.hod.by.name}`
                          : ""}{" "}
                        {app.approval?.hod?.note
                          ? `: ${app.approval.hod.note}`
                          : ""}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <button
                        className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                        onClick={() => handleAction(app.id, "approve", "ceo")}
                      >
                        Approve
                      </button>
                      <button
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                        onClick={() => handleAction(app.id, "reject", "ceo")}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center">
            <Upload size={24} className="mr-2" />
            All Leave History
          </h2>
          {leaveApplications.filter((app) => app.status !== "pending")
            .length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No approved or rejected applications yet.
            </div>
          ) : (
            <div className="space-y-4">
              {leaveApplications
                .filter((app) => app.status !== "pending")
                .map((app) => (
                  <div key={app.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-medium text-lg">
                            {app.reason}
                          </span>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              app.status === "approved"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {app.status}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-2">
                          {app.fileName && app.fileData && (
                            <a
                              href={app.fileData}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 underline mr-2"
                            >
                              {app.fileName}
                            </a>
                          )}
                          {app.from && app.to && (
                            <span>
                              {`From: ${app.from
                                .toDate()
                                .toLocaleString()} To: ${app.to
                                .toDate()
                                .toLocaleString()}`}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Created:{" "}
                          {app.createdAt &&
                            app.createdAt.toDate().toLocaleString()}
                          <br />
                          Department: {app.createdBy.departmentName}
                          <br />
                          By: {app.createdBy.name} ({app.createdBy.email})
                          <br />
                          Approval: HOD - {app.approval?.hod?.status}{" "}
                          {app.approval?.hod?.by
                            ? `by ${app.approval.hod.by.name}`
                            : ""}{" "}
                          {app.approval?.hod?.note
                            ? `: ${app.approval.hod.note}`
                            : ""}
                          <br />
                          CEO/Admin - {app.approval?.ceo?.status}{" "}
                          {app.approval?.ceo?.by
                            ? `by ${app.approval.ceo.by.name}`
                            : ""}{" "}
                          {app.approval?.ceo?.note
                            ? `: ${app.approval.ceo.note}`
                            : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="text-center py-8 text-gray-500">
      Not authorized to view this page.
    </div>
  );
}
