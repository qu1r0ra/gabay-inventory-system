import {
  createClient,
  SignInWithPasswordCredentials,
  User,
} from "@supabase/supabase-js";
import { useEffect, useState } from "react";

// Env setup
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

interface IAuth {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<boolean>;
}

/**
 * The useAuth hook gives client components access to auth related functions.
 *
 * @hook
 */
export const useAuth = (): IAuth => {
  const [user, setUser] = useState<User | null>(null);

  // Auto checks if user is logged in
  useEffect(() => {
    updateUser();
  }, []);

  /**
   * This function automatically requests for the authed user deets from the auth server.
   * Updates nothing if user is not authenticated.
   */
  const updateUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUser(user);
  };

  /**
   * Authenticates the user with the supabase backend.
   *
   * @param email
   * @param password
   * @returns
   */
  const login = async (email: string, password: string) => {
    // Supabase automatically checks password
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // Something went wrong
    if (error) {
      alert(error.message);
      return false;
    }

    // Update user
    await updateUser();
    return true;
  };

  /**
   * Invalidates the auth token in the browser cookie.
   *
   * @returns
   */
  const logout = async () => {
    const { error } = await supabase.auth.signOut();

    // Something went wrong
    if (error) {
      alert(error.message);
      return false;
    }

    // Update user
    await updateUser();
    return true;
  };

  return {
    user,
    login,
    logout,
  };
};
