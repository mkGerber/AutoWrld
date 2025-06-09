import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { supabase } from "../services/supabase/client";

interface AuthContextType {
  user: any;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let didCancel = false;
    const finish = (u: any) => {
      if (!didCancel) {
        setUser(u);
        setLoading(false);
      }
    };
    (async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        console.log("Session after reload:", session);
        let currentUser = session?.user ?? null;
        if (!currentUser) {
          finish(null);
          return;
        }
        // Timeout fallback for getUser
        let timeout: NodeJS.Timeout;
        const userCheck = new Promise<any>(async (resolve) => {
          try {
            const { data, error } = await supabase.auth.getUser();
            console.log("getUser() after reload:", { data, error });
            if (error) {
              console.error("getUser() error:", error);
              await supabase.auth.signOut();
              resolve(null);
            } else {
              // If no error, keep the user even if data is null
              resolve(currentUser);
            }
          } catch (err) {
            console.error("Error checking user existence:", err);
            resolve(null);
          }
        });
        const result = await Promise.race([
          userCheck,
          new Promise((resolve) => {
            timeout = setTimeout(() => resolve(null), 3000);
          }),
        ]);
        clearTimeout(timeout!);
        finish(result);
        console.log("User after reload:", result);
      } catch (err) {
        console.error("Error in AuthProvider initial session:", err);
        finish(null);
      }
    })();
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_OUT") {
          finish(null);
          return;
        }
        if (session?.user) {
          finish(session.user);
        }
      }
    );
    return () => {
      didCancel = true;
      listener?.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
