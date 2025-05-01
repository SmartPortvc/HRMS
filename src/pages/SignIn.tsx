import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { collection, getDocs, query, where, addDoc, onSnapshot, deleteDoc } from 'firebase/firestore';
import { Lock, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminCredentials = async () => {
      try {
        // Check if admin exists in users collection
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('role', '==', 'admin'));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          // Admin doesn't exist, create new admin account
          try {
            const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
            const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD;

            if (!adminEmail || !adminPassword) {
              console.error('Admin credentials not found in environment variables');
              return;
            }

            const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
            
            // Add admin user to users collection
            await addDoc(collection(db, 'users'), {
              email: adminEmail,
              name: 'System Administrator',
              role: 'admin',
              uid: userCredential.user.uid,
              isActive: true,
              createdAt: new Date()
            });

            // Sign out after creating admin
            await auth.signOut();
          } catch (error: any) {
            if (error.code === 'auth/email-already-in-use') {
              // Admin exists in Auth but not in users collection
              try {
                const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
                const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD;

                if (!adminEmail || !adminPassword) {
                  console.error('Admin credentials not found in environment variables');
                  return;
                }

                const userCredential = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
                
                // Add to users collection
                await addDoc(collection(db, 'users'), {
                  email: adminEmail,
                  name: 'System Administrator',
                  role: 'admin',
                  uid: userCredential.user.uid,
                  isActive: true,
                  createdAt: new Date()
                });

                // Sign out after adding to users collection
                await auth.signOut();
              } catch (signInError) {
                console.error('Error setting up admin account:', signInError);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error checking admin credentials:', error);
      }
    };

    checkAdminCredentials();
  }, []);

  useEffect(() => {
    // Listen for session changes
    if (auth.currentUser) {
      const sessionsRef = collection(db, 'sessions');
      const q = query(sessionsRef, where('userId', '==', auth.currentUser.uid));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'modified' && change.doc.data().forceLogout) {
            auth.signOut();
            navigate('/');
            toast.error('Your session has been terminated by an administrator');
          }
        });
      });

      return () => unsubscribe();
    }
  }, [auth.currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // First check if user exists in users collection
      const usersRef = collection(db, 'users');
      const userQuery = query(usersRef, where('email', '==', email));
      const userSnapshot = await getDocs(userQuery);

      if (userSnapshot.empty) {
        toast.error('No account found with this email address');
        setIsLoading(false);
        return;
      }

      const userData = userSnapshot.docs[0].data();

      // Check if user is active (except for admin)
      if (!userData.isActive && userData.role !== 'admin') {
        toast.error('Your account has been deactivated. Please contact your administrator.');
        setIsLoading(false);
        return;
      }

      // Clear any existing sessions for this email
      const sessionsRef = collection(db, 'sessions');
      const sessionsQuery = query(sessionsRef, where('email', '==', email));
      const sessionsSnapshot = await getDocs(sessionsQuery);
      
      const deletePromises = sessionsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      // Attempt to sign in
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // Create a new session record
      await addDoc(collection(db, 'sessions'), {
        userId: userCredential.user.uid,
        email: email,
        startTime: new Date(),
        forceLogout: false,
        lastUpdated: new Date()
      });

      toast.success('Signed in successfully');
      
      // Redirect based on role
      if (userData.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/user');
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      
      // Handle specific error cases
      switch (error.code) {
        case 'auth/invalid-credential':
          toast.error('Invalid email or password. Please check your credentials and try again.');
          break;
        case 'auth/invalid-email':
          toast.error('Invalid email address format.');
          break;
        case 'auth/user-disabled':
          toast.error('This account has been disabled.');
          break;
        case 'auth/too-many-requests':
          toast.error('Too many failed attempts. Please try again later.');
          break;
        case 'auth/network-request-failed':
          toast.error('Network error. Please check your internet connection.');
          break;
        default:
          toast.error('An error occurred during sign in. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="bg-white p-8 rounded-lg shadow-xl w-96 backdrop-blur-lg bg-opacity-90">
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
        <h2 className="text-xl font-semibold text-center mb-8 text-gray-800">HRMS</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Email"
              required
              disabled={isLoading}
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Password"
              required
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Powered by Volteo Maritime</p>
          <p className="mt-1">© 2025 Volteo Maritime. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}