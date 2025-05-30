// client/src/context/SavedItemsContext.tsx
import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import type { ReactNode } from "react";
import { useAuth } from "./AuthContext";
import api from "../services/api";
import type {
  SavedItem,
  SaveItemRequest,
  MovieRecommendation,
  BookRecommendation,
} from "../services/api";

interface SavedItemsState {
  savedItems: SavedItem[];
  savedItemIds: Set<string>; // For quick lookup
  isLoading: boolean;
  error: string | null;
}

interface SavedItemsContextType extends SavedItemsState {
  loadSavedItems: () => Promise<void>;
  saveItem: (
    item: MovieRecommendation | BookRecommendation,
    type: "movie" | "book"
  ) => Promise<void>;
  unsaveItem: (itemId: string, type: "movie" | "book") => Promise<void>;
  isItemSaved: (itemId: string) => boolean;
  clearError: () => void;
  getSavedItemsByType: (type: "movie" | "book") => SavedItem[];
}

const SavedItemsContext = createContext<SavedItemsContextType | undefined>(
  undefined
);

interface SavedItemsProviderProps {
  children: ReactNode;
}

export const SavedItemsProvider: React.FC<SavedItemsProviderProps> = ({
  children,
}) => {
  const { isAuthenticated, user } = useAuth();
  const [state, setState] = useState<SavedItemsState>({
    savedItems: [],
    savedItemIds: new Set(),
    isLoading: false,
    error: null,
  });

  const setLoading = useCallback((isLoading: boolean) => {
    setState((prev) => ({ ...prev, isLoading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error }));
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  // Load saved items when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadSavedItems();
    } else {
      // Reset saved items when user logs out
      setState({
        savedItems: [],
        savedItemIds: new Set(),
        isLoading: false,
        error: null,
      });
    }
  }, [isAuthenticated, user]);

  const loadSavedItems = useCallback(async (): Promise<void> => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      setError(null);

      const response = await api.getSavedItems();
      const itemIds = new Set(response.items.map((item) => item.item_id));

      setState((prev) => ({
        ...prev,
        savedItems: response.items,
        savedItemIds: itemIds,
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load saved items";
      setError(errorMessage);
      setLoading(false);
      console.error("Failed to load saved items:", error);
    }
  }, [isAuthenticated, setLoading, setError]);

  const saveItem = useCallback(
    async (
      item: MovieRecommendation | BookRecommendation,
      type: "movie" | "book"
    ): Promise<void> => {
      if (!isAuthenticated) {
        setError("You must be logged in to save items");
        return;
      }

      try {
        setError(null);

        const saveRequest: SaveItemRequest = {
          item_id: item.id,
          item_type: type,
          item_title: item.title,
          item_data: item,
        };

        const savedItem = await api.saveItem(saveRequest);

        setState((prev) => ({
          ...prev,
          savedItems: [...prev.savedItems, savedItem],
          savedItemIds: new Set([...prev.savedItemIds, item.id]),
        }));

        console.log(`✅ Saved ${type}: ${item.title}`);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to save item";
        setError(errorMessage);
        console.error("Failed to save item:", error);
        throw error;
      }
    },
    [isAuthenticated, setError]
  );

  const unsaveItem = useCallback(
    async (itemId: string, type: "movie" | "book"): Promise<void> => {
      if (!isAuthenticated) {
        setError("You must be logged in to unsave items");
        return;
      }

      try {
        setError(null);

        await api.unsaveItem(itemId, type);

        setState((prev) => {
          const newSavedItemIds = new Set(prev.savedItemIds);
          newSavedItemIds.delete(itemId);

          return {
            ...prev,
            savedItems: prev.savedItems.filter(
              (item) => item.item_id !== itemId
            ),
            savedItemIds: newSavedItemIds,
          };
        });

        console.log(`🗑️ Unsaved ${type} with ID: ${itemId}`);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to unsave item";
        setError(errorMessage);
        console.error("Failed to unsave item:", error);
        throw error;
      }
    },
    [isAuthenticated, setError]
  );

  const isItemSaved = useCallback(
    (itemId: string): boolean => {
      return state.savedItemIds.has(itemId);
    },
    [state.savedItemIds]
  );

  const getSavedItemsByType = useCallback(
    (type: "movie" | "book"): SavedItem[] => {
      return state.savedItems.filter((item) => item.item_type === type);
    },
    [state.savedItems]
  );

  const contextValue: SavedItemsContextType = {
    ...state,
    loadSavedItems,
    saveItem,
    unsaveItem,
    isItemSaved,
    clearError,
    getSavedItemsByType,
  };

  return (
    <SavedItemsContext.Provider value={contextValue}>
      {children}
    </SavedItemsContext.Provider>
  );
};

export const useSavedItems = (): SavedItemsContextType => {
  const context = useContext(SavedItemsContext);
  if (context === undefined) {
    throw new Error("useSavedItems must be used within a SavedItemsProvider");
  }
  return context;
};

export default SavedItemsContext;
