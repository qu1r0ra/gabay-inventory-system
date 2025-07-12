import { createClient, User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

// Env setup
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

interface IAuth {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  register: (
    username: string,
    password: string,
    is_admin?: boolean
  ) => Promise<boolean>;
  logout: () => Promise<boolean>;
}

/**
 * This has to be a global context cuz this is shared across the SPA.
 * Check out react for more info on context providers
 *
 * @component
 */
const AuthContext = createContext<IAuth>({} as IAuth);
export const AuthContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

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
    console.log(user);
    console.log(`[AUTH]: updated user: ${user}`);
    setLoading(false);
  };

  /**
   * Authenticates the user with the supabase backend.
   *
   * @param email
   * @param password
   * @param is_admin
   * @returns
   */
  const register = async (
    username: string,
    password: string,
    is_admin: boolean = false
  ) => {
    // Just generate a placeholder email because supabase wants an email
    const email = `${username}@gabay.org`;

    // Supabase automatically checks password
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: is_admin ? "admin" : "user",
          is_admin,
        },
      },
    });

    // Something went wrong
    if (error) {
      alert(error.message);
      console.log(error, error.cause, error.code, error.message, error.name);
      return false;
    }

    // Update user
    await updateUser();
    return true;
  };

  /**
   * Authenticates the user with the supabase backend.
   *
   * @param email
   * @param password
   * @returns
   */
  const login = async (username: string, password: string) => {
    // Just generate a placeholder email because supabase wants an email
    const email = `${username}@gabay.org`;

    // Supabase automatically checks password
    const { error, ...rest } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    console.log('rest', rest)

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

  return (
    <AuthContext.Provider
      value={{
        user: useMemo<User>(() => user as User, [user]),
        loading,
        register,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/**
 * The useAuth hook gives client components access to auth related functions.
 *
 * @hook
 */
export const useAuth = () => useContext(AuthContext);
