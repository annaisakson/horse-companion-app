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
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("horses")
      .select("*")
      .eq("owner_id", user.id);

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setHorses(data || []);

    // If no horses exist → go to add-horse screen
    if (!data || data.length === 0) {
      router.replace("/add-horse");
      return;
    }

    // Auto-select first horse if none selected
    if (data && data.length > 0 && !selectedHorseId) {
      setSelectedHorseId(data[0].id);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchHorses();
  }, []);

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
