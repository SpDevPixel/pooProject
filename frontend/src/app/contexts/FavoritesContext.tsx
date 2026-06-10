/*
 * 파일 위치: src/app/contexts/FavoritesContext.tsx
 * 상위 폴더: src/app/contexts (전역 상태 Context)
 * 역할: 백엔드 API 기반으로 사용자의 즐겨찾기 화장실 목록을 관리
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import type { Toilet } from "../types/toilet";
import {
  addFavoriteToilet,
  deleteFavoriteToilet,
  fetchFavoriteToilets,
  getBackendToiletId,
} from "../api/favorites";
import { useAuth } from "./AuthContext";

interface FavoritesContextType {
  favorites: string[];
  favoriteToilets: Toilet[];
  isLoadingFavorites: boolean;
  favoriteError: string | null;
  refreshFavorites: () => Promise<void>;
  addFavorite: (toilet: Toilet) => Promise<void>;
  removeFavorite: (toilet: Toilet) => Promise<void>;
  isFavorite: (toilet: Toilet | string) => boolean;
  toggleFavorite: (toilet: Toilet) => Promise<boolean>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

const getFavoriteKey = (toilet: Toilet | string) => {
  if (typeof toilet === "string") return toilet;
  return toilet.backendId?.toString() ?? toilet.id;
};

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [favoriteToilets, setFavoriteToilets] = useState<Toilet[]>([]);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(false);
  const [favoriteError, setFavoriteError] = useState<string | null>(null);

  const favorites = useMemo(
    () => favoriteToilets.map((toilet) => getFavoriteKey(toilet)),
    [favoriteToilets]
  );

  const refreshFavorites = useCallback(async () => {
    if (!user?.token) {
      setFavoriteToilets([]);
      setFavoriteError(null);
      return;
    }

    setIsLoadingFavorites(true);
    setFavoriteError(null);

    try {
      const toilets = await fetchFavoriteToilets(user.token);
      setFavoriteToilets(toilets);
    } catch (error) {
      console.error(error);
      setFavoriteError(
        error instanceof Error
          ? error.message
          : "즐겨찾기 목록을 불러오지 못했습니다."
      );
    } finally {
      setIsLoadingFavorites(false);
    }
  }, [user?.token]);

  useEffect(() => {
    refreshFavorites();
  }, [refreshFavorites]);

  const isFavorite = useCallback(
    (toilet: Toilet | string) => favorites.includes(getFavoriteKey(toilet)),
    [favorites]
  );

  const addFavorite = useCallback(
    async (toilet: Toilet) => {
      if (!user?.token) {
        throw new Error("로그인 후 즐겨찾기를 사용할 수 있습니다.");
      }

      const toiletId = getBackendToiletId(toilet);
      if (!toiletId) {
        throw new Error("화장실 정보를 다시 불러온 뒤 즐겨찾기를 시도해주세요.");
      }

      await addFavoriteToilet(toiletId, user.token);
      setFavoriteToilets((current) =>
        current.some((item) => getFavoriteKey(item) === getFavoriteKey(toilet))
          ? current
          : [...current, toilet]
      );
    },
    [user?.token]
  );

  const removeFavorite = useCallback(
    async (toilet: Toilet) => {
      if (!user?.token) {
        throw new Error("로그인 후 즐겨찾기를 사용할 수 있습니다.");
      }

      const toiletId = getBackendToiletId(toilet);
      if (!toiletId) {
        throw new Error("화장실 정보를 다시 불러온 뒤 즐겨찾기를 취소해주세요.");
      }

      await deleteFavoriteToilet(toiletId, user.token);
      setFavoriteToilets((current) =>
        current.filter((item) => getFavoriteKey(item) !== getFavoriteKey(toilet))
      );
    },
    [user?.token]
  );

  const toggleFavorite = useCallback(
    async (toilet: Toilet) => {
      if (isFavorite(toilet)) {
        await removeFavorite(toilet);
        return false;
      }

      await addFavorite(toilet);
      return true;
    },
    [addFavorite, isFavorite, removeFavorite]
  );

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        favoriteToilets,
        isLoadingFavorites,
        favoriteError,
        refreshFavorites,
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
