import { supabase } from './supabase';

const ALLOWED_UNIVERSITY_DOMAINS = [
  "ogr.iuc.edu.tr"
];

export const validateUniversityEmail = (email: string): boolean => {
  const domain = email.toLowerCase().split("@")[1];
  return ALLOWED_UNIVERSITY_DOMAINS.includes(domain);
};



export const signUpWithEmail = async (email: string, password: string) => {
  if (!validateUniversityEmail(email)) {
    throw new Error('Please use a valid university email address (@ogr.iuc.edu.tr)');
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) throw error;
  return data;
};

export const signInWithPassword = async (email: string, password: string) => {
  if (!validateUniversityEmail(email)) {
    throw new Error('Please use a valid university email address (@ogr.iuc.edu.tr)');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
};

export const signInWithEmail = async (email: string) => {
  if (!validateUniversityEmail(email)) {
    throw new Error('Please use a valid university email address (@ogr.iuc.edu.tr)');
  }

  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
};

// Hook to listen to auth state changes
export const onAuthStateChange = (callback: (event: string, session: any) => void) => {
  return supabase.auth.onAuthStateChange(callback);
};
