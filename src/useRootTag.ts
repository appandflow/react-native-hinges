import { useContext } from 'react';
import { RootTagContext } from 'react-native';

/**
 * Reads the current React root tag, throwing a hook-specific error when rendered
 * outside a React Native root (RootTagContext defaults to 0 outside AppContainer).
 */
export function useRootTag(hookName: string): number {
  const rootTag = Number(useContext(RootTagContext));
  if (!Number.isInteger(rootTag) || rootTag <= 0) {
    throw new Error(
      `${hookName} must render inside a React Native root: RootTagContext is 0 (or invalid). ` +
        'In tests, wrap the tree in <RootTagContext.Provider value={1 as unknown as RootTag}>.',
    );
  }
  return rootTag;
}
