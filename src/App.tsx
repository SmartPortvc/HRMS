import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import SignIn from "./pages/SignIn";
import AdminPanel from "./pages/AdminPanel";
import UserPanel from "./pages/UserPanel";
import Register from "./pages/Register";
import InviteUser from "./pages/InviteUser.tsx";
import SalaryForm from "./pages/SalaryForm";
import EmployeeDetails from "./components/AdminPanel/EmployeeDetails";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<SignIn />} />
        <Route path="/register/:invitationId" element={<Register />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminPanel />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/master-data/employees/:id"
          element={
            <ProtectedRoute>
              <EmployeeDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user"
          element={
            <ProtectedRoute>
              <UserPanel />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/invite"
          element={
            <ProtectedRoute>
              <InviteUser />
            </ProtectedRoute>
          }
        />
        <Route
          path="/salary-form"
          element={
            <ProtectedRoute>
              <SalaryForm />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
