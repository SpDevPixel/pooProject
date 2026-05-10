import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface FavoritesContextType {
  favorites: string[]; // toilet IDs
  addFavorite: (toiletId: string) => void;
  removeFavorite: (toiletId: string) => void;
  isFavorite: (toiletId: string) => boolean;
  toggleFavorite: (toiletId: string) => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>(() => {
    // Load from localStorage on mount
    const saved = localStorage.getItem("toilet-favorites");
    return saved ? JSON.parse(saved) : [];
  });

  // Save to localStorage whenever favorites change
  useEffect(() => {
    localStorage.setItem("toilet-favorites", JSON.stringify(favorites));
  }, [favorites]);

  const addFavorite = (toiletId: string) => {
    setFavorites((prev) => {
      if (prev.includes(toiletId)) return prev;
      return [...prev, toiletId];
    });
  };

  const removeFavorite = (toiletId: string) => {
    setFavorites((prev) => prev.filter((id) => id !== toiletId));
  };

  const isFavorite = (toiletId: string) => {
    return favorites.includes(toiletId);
  };

  const toggleFavorite = (toiletId: string) => {
    if (isFavorite(toiletId)) {
      removeFavorite(toiletId);
    } else {
      addFavorite(toiletId);
    }
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        addFavorite,
        removeFavorite,
        isFavorite,
        toggleFavorite,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
}
