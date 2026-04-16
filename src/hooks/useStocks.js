import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db, isFirebaseConfigured } from "../firebase/config";
import localStocks from "../data/stocks";

export function useStocks() {
  const [stocks, setStocks] = useState(localStocks);
  const [loading, setLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured || !db) return;

    async function fetchStocks() {
      try {
        const snapshot = await getDocs(collection(db, "stocks"));
        if (!snapshot.empty) {
          const fsStocks = snapshot.docs.map((d) => ({ ...d.data(), id: d.id }));
          // Merge: Firestore data takes precedence over local defaults
          const merged = localStocks.map((local) => {
            const remote = fsStocks.find((s) => s.id === local.id);
            return remote ? { ...local, ...remote } : local;
          });
          setStocks(merged);
        }
      } catch (e) {
        console.error("Failed to fetch stocks from Firestore:", e.message);
      } finally {
        setLoading(false);
      }
    }

    fetchStocks();
  }, []);

  return { stocks, loading };
}
