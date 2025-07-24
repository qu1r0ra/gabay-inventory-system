import { createClient, User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

// Env setup
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

interface IAuth {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  registering: boolean;
  loggingIn: boolean;
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [registering, setRegistering] = useState<boolean>(false);
  const [loggingIn, setLoggingIn] = useState<boolean>(false);

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

    if (user) {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();
      setIsAdmin(data?.is_admin);
    }

    console.log("[AUTH]: updated user.");
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
    is_admin?: boolean
  ) => {
    setRegistering(true);

    // Just generate a placeholder email because supabase wants an email
    const email = `${username}@gabay.org`;

    // Supabase automatically checks password
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    // Create another record in users table to store isadmin flag
    if (data?.user) {
      const { id } = data.user;
      const { error } = await supabase.from("users").insert({
        id: id,
        name: username,
        is_admin,
      });

      if (error) console.error("Failed to insert profile:", error.message);
    }

    // Something went wrong
    if (error) {
      alert(error.message);
      console.log(error, error.cause, error.code, error.message, error.name);
      setRegistering(false);
      return false;
    }

    // Update user
    await updateUser();
    setRegistering(false);
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
    setLoggingIn(true);

    // Just generate a placeholder email because supabase wants an email
    const email = `${username}@gabay.org`;

    // Supabase automatically checks password
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // Something went wrong
    if (error) {
      alert(error.message);
      setLoggingIn(false);
      return false;
    }

    // Update user
    await updateUser();
    setLoggingIn(false);
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
        isAdmin,
        loading,
        registering,
        register,
        loggingIn,
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
