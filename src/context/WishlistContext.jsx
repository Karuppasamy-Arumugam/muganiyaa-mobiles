import React, { createContext, useContext, useState, useEffect } from 'react';
import { loadWishlistIds, saveWishlistIds } from '../services/storageService';

const WishlistContext = createContext(null);

function isValidProductId(productId) {
  return (
    (typeof productId === 'string' && productId.trim().length > 0) ||
    (typeof productId === 'number' && Number.isFinite(productId))
  );
}

function normalizeWishlistIds(ids) {
  if (!Array.isArray(ids)) return [];

  const uniqueIds = [];
  const seenIds = new Set();

  for (const productId of ids) {
    if (!isValidProductId(productId) || seenIds.has(productId)) continue;
    seenIds.add(productId);
    uniqueIds.push(productId);
  }

  return uniqueIds;
}

function readWishlistIds() {
  try {
    return normalizeWishlistIds(loadWishlistIds());
  } catch (error) {
    console.warn('Could not load the saved wishlist.', error);
    return [];
  }
}

export function WishlistProvider({ children }) {
  const [wishlistIds, setWishlistIds] = useState(readWishlistIds);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);

  useEffect(() => {
    try {
      saveWishlistIds(wishlistIds);
    } catch (error) {
      console.warn('Could not save the wishlist on this device.', error);
    }
  }, [wishlistIds]);

  const openWishlist = () => setIsWishlistOpen(true);
  const closeWishlist = () => setIsWishlistOpen(false);

  const toggleWishlist = (productId) => {
    if (!isValidProductId(productId)) return;

    setWishlistIds((currentIds) => {
      const safeIds = normalizeWishlistIds(currentIds);
      return safeIds.includes(productId)
        ? safeIds.filter((id) => id !== productId)
        : [...safeIds, productId];
    });
  };

  const removeFromWishlist = (productId) => {
    if (!isValidProductId(productId)) return;
    setWishlistIds((currentIds) =>
      normalizeWishlistIds(currentIds).filter((id) => id !== productId)
    );
  };

  const clearWishlist = () => setWishlistIds([]);
  const isInWishlist = (productId) =>
    isValidProductId(productId) && wishlistIds.includes(productId);

  const value = {
    wishlistIds,
    wishlistCount: wishlistIds.length,
    isWishlistOpen,
    openWishlist,
    closeWishlist,
    toggleWishlist,
    removeFromWishlist,
    clearWishlist,
    isInWishlist
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
