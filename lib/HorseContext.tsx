import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { supabase } from "./supabase";
import { useRouter } from "expo-router";

interface Horse {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  photo_url: string | null;
}

interface HorseContextType {
  horses: Horse[];
  selectedHorseId: string | null;
  setSelectedHorseId: (id: string) => void;
  selectedHorse: Horse | null;
  loading: boolean;
  refreshHorses: () => Promise<void>;
}

const HorseContext = createContext<HorseContextType | undefined>(undefined);

export function HorseProvider({ children }: { children: ReactNode }) {
  const [horses, setHorses] = useState<Horse[]>([]);
  const [selectedHorseId, setSelectedHorseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchHorses = async () => {
    console.log("Fetching horses...");
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // If no user, clear horses and return
    if (!user) {
      setHorses([]);
      setSelectedHorseId(null);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("horses")
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setHorses(data || []);

    // Auto-select first horse if none selected or if selected horse no longer exists
    if (data && data.length > 0) {
      if (!selectedHorseId || !data.find((h) => h.id === selectedHorseId)) {
        setSelectedHorseId(data[0].id);
      }
    } else {
      setSelectedHorseId(null);
    }

    setLoading(false);
  };

  useEffect(() => {
    // Initial fetch
    fetchHorses();

    // Listen for auth state changes (login/logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event); // Helpful for debugging

      if (event === "SIGNED_IN") {
        // User just logged in - fetch their horses
        await fetchHorses();
      } else if (event === "SIGNED_OUT") {
        // User logged out - clear horses
        setHorses([]);
        setSelectedHorseId(null);
      }
    });

    // Cleanup: unsubscribe when component unmounts
    return () => {
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array - only run once on mount

  const selectedHorse = horses.find((h) => h.id === selectedHorseId) || null;

  return (
    <HorseContext.Provider
      value={{
        horses,
        selectedHorseId,
        setSelectedHorseId,
        selectedHorse,
        loading,
        refreshHorses: fetchHorses,
      }}
    >
      {children}
    </HorseContext.Provider>
  );
}

export function useHorse() {
  const context = useContext(HorseContext);
  if (context === undefined) {
    throw new Error("useHorse must be used within a HorseProvider");
  }
  return context;
}
