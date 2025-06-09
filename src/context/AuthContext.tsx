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
    // Helper to always clear loading
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
        // Timeout fallback for user check
        let timeout: NodeJS.Timeout;
        const userCheck = new Promise<any>(async (resolve) => {
          try {
            const { data, error } = await supabase.auth.getUser();
            if (error || !data?.user) {
              await supabase.auth.signOut();
              resolve(null);
            } else {
              resolve(currentUser);
            }
          } catch (err) {
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
      } catch (err) {
        finish(null);
      }
    })();
    // Listen for changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        let currentUser = session?.user ?? null;
        try {
          if (!currentUser) {
            finish(null);
            return;
          }
          let timeout: NodeJS.Timeout;
          const userCheck = new Promise<any>(async (resolve) => {
            try {
              const { data, error } = await supabase.auth.getUser();
              if (error || !data?.user) {
                await supabase.auth.signOut();
                resolve(null);
              } else {
                resolve(currentUser);
              }
            } catch (err) {
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
        } catch (err) {
          finish(null);
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
