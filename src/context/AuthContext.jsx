import { createContext, useContext, useState, useEffect } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "../firebase/config";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser && db) {
        try {
          const snap = await getDoc(doc(db, "users", firebaseUser.uid));
          setUserProfile(snap.exists() ? snap.data() : null);
        } catch {
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = (email, password) => {
    if (!auth) throw new Error("Firebase is not configured.");
    return signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email, password) => {
    if (!auth) throw new Error("Firebase is not configured.");
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (db) {
      await setDoc(doc(db, "users", cred.user.uid), {
        email,
        isAdmin: email === import.meta.env.VITE_ADMIN_EMAIL,
        createdAt: serverTimestamp(),
      });
    }
    return cred;
  };

  const signOut = () => {
    if (!auth) return Promise.resolve();
    return firebaseSignOut(auth);
  };

  const isAdmin =
    !!user &&
    (user.email === import.meta.env.VITE_ADMIN_EMAIL || !!userProfile?.isAdmin);

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        signIn,
        signUp,
        signOut,
        isAdmin,
        isFirebaseConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
