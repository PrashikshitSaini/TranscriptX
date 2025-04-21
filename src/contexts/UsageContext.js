import React, { createContext, useContext, useState, useEffect } from "react";
import { getUsageCount, incrementUsageCount } from "../services/usageService";
import { useAuth } from "./AuthContext";

const UsageContext = createContext();

// Local usage tracking as fallback when Firebase permissions fail
const LOCAL_STORAGE_KEY = "transcriptx_usage_count";

export function UsageProvider({ children }) {
  const { currentUser } = useAuth();
  const [usageCount, setUsageCount] = useState(0);
  const [loadingUsage, setLoadingUsage] = useState(true);
  const [usingLocalStorage, setUsingLocalStorage] = useState(false);

  // Get local storage usage count as fallback
  const getLocalUsageCount = (userId) => {
    try {
      const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (localData) {
        const parsed = JSON.parse(localData);
        return (userId && parsed[userId]) || 0;
      }
    } catch (e) {
      console.warn("Could not read from localStorage", e);
    }
    return 0;
  };

  // Save to local storage as fallback
  const saveLocalUsageCount = (userId, count) => {
    try {
      const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
      const existingData = localData ? JSON.parse(localData) : {};

      existingData[userId] = count;
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(existingData));
      return true;
    } catch (e) {
      console.warn("Could not write to localStorage", e);
      return false;
    }
  };

  // Effect to load usage when user changes
  useEffect(() => {
    async function fetchUsage() {
      setLoadingUsage(true);
      setUsingLocalStorage(false);

      try {
        if (currentUser) {
          console.log("Fetching usage for user:", currentUser.uid);

          // Try to get from Firebase first
          let count = await getUsageCount(currentUser.uid);

          // If Firebase failed, try local storage
          const localCount = getLocalUsageCount(currentUser.uid);
          if (count === 0 && localCount > 0) {
            console.log("Using local storage count:", localCount);
            count = localCount;
            setUsingLocalStorage(true);
          }

          console.log("Retrieved usage count:", count);
          setUsageCount(count);
        } else {
          console.log("No user logged in, resetting count to 0");
          setUsageCount(0);
        }
      } catch (error) {
        console.error("Error fetching usage count:", error);

        // Fallback to local storage
        if (currentUser) {
          const localCount = getLocalUsageCount(currentUser.uid);
          console.log("Fallback to local storage count:", localCount);
          setUsageCount(localCount);
          setUsingLocalStorage(true);
        }
      } finally {
        setLoadingUsage(false);
      }
    }

    fetchUsage();
  }, [currentUser]);

  const incrementUsage = async () => {
    if (!currentUser) {
      console.warn("Cannot increment usage: no user logged in");
      return;
    }

    try {
      console.log("Incrementing usage for user:", currentUser.uid);

      // Try to increment in Firebase
      const success = await incrementUsageCount(currentUser.uid);

      // Update local state (regardless of Firebase success)
      setUsageCount((prevCount) => {
        const newCount = prevCount + 1;
        console.log("Updated usage count:", newCount);

        // If Firebase failed, use local storage as backup
        if (!success) {
          console.log("Firebase update failed, using local storage");
          setUsingLocalStorage(true);
          saveLocalUsageCount(currentUser.uid, newCount);
        }

        return newCount;
      });
    } catch (error) {
      console.error("Error incrementing usage:", error);

      // Still increment locally even if Firebase fails
      setUsageCount((prevCount) => {
        const newCount = prevCount + 1;
        console.log("Updated local usage count after error:", newCount);
        setUsingLocalStorage(true);
        saveLocalUsageCount(currentUser.uid, newCount);
        return newCount;
      });

      // Try to fetch the latest count from database to stay in sync
      try {
        const latestCount = await getUsageCount(currentUser.uid);
        if (latestCount > 0) {
          setUsageCount(latestCount);
          setUsingLocalStorage(false);
        }
      } catch (syncError) {
        console.error("Failed to sync usage count after error:", syncError);
      }
    }
  };

  return (
    <UsageContext.Provider
      value={{
        usageCount,
        incrementUsage,
        loadingUsage,
        usingLocalStorage,
      }}
    >
      {children}
    </UsageContext.Provider>
  );
}

export function useUsage() {
  return useContext(UsageContext);
}
