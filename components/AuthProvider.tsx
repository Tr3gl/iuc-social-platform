'use client';

import { createContext, useContext, useEffect, useState } from'react';
import { User } from'@supabase/supabase-js';
import { supabase } from'@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
 user: User | null;
 loading: boolean;
 signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
 user: null,
 loading: true,
 signOut: async () => {},
});

export const useAuth = () => {
 const context = useContext(AuthContext);
 if (!context) {
 throw new Error('useAuth must be used within AuthProvider');
 }
 return context;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
 const [user, setUser] = useState<User | null>(null);
 const [loading, setLoading] = useState(true);
 const router = useRouter();
 const pathname = usePathname();

 useEffect(() => {
 // Get initial session
 supabase.auth.getSession().then(({ data: { session } }) => {
 setUser(session?.user ?? null);
 setLoading(false);
 });

 // Listen for auth changes
 const {
 data: { subscription },
 } = supabase.auth.onAuthStateChange(async (_event, session) => {
 const currentUser = session?.user ?? null;
 // Enforce domain check globally just in case
 if (currentUser && currentUser.email && !currentUser.email.endsWith('@ogr.iuc.edu.tr')) {
      await supabase.auth.signOut();
      setUser(null);
      return;
 }
 setUser(currentUser);
 });

 return () => subscription.unsubscribe();
 }, []);

 const signOut = async () => {
 await supabase.auth.signOut();
 setUser(null);
 };

 return (
 <AuthContext.Provider value={{ user, loading, signOut }}>
 {children}
 </AuthContext.Provider>
 );
}