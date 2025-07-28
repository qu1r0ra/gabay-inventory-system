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

    try {
      // Check if username already exists
      const { data: existingUser, error: checkError } = await supabase
        .from("users")
        .select("name")
        .eq("name", username)
        .single();

      if (checkError) {
        if (checkError.code !== 'PGRST116') {
          // PGRST116 is "not found" error, which is expected for new usernames
          console.error("Error checking username:", checkError.message);
          setRegistering(false);
          return false;
        }
        // PGRST116 means no user found, which is good
      }

      if (existingUser) {
        setRegistering(false);
        return false;
      }

      // Just generate a placeholder email because supabase wants an email
      const email = `${username}@gabay.org`;

      // Supabase automatically checks password
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: username,
            is_admin: is_admin
          }
        }
      });

      // Something went wrong with auth
      if (error) {
        console.log(error, error.cause, error.code, error.message, error.name);
        setRegistering(false);
        return false;
      }

      // Let the database trigger handle the user creation
      // No manual insert needed

      // Update user
      await updateUser();
      setRegistering(false);
      return true;
    } catch (error) {
      console.error("Registration error:", error);
      setRegistering(false);
      return false;
    }
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

    try {
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
        setLoggingIn(false);
        return false;
      }

      // Update user
      await updateUser();
      setLoggingIn(false);
      return true;
    } catch (error) {
      console.error("Login error:", error);
      setLoggingIn(false);
      return false;
    }
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
