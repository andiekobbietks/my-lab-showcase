import { useQuery } from 'convex/react';
import type { FunctionReference } from 'convex/server';

/**
 * A safe wrapper around Convex useQuery that returns null
 * instead of throwing when the Convex backend is unavailable or errors.
 * Components using this will gracefully fall back to their default data.
 */
export function useSafeQuery(queryFn: any, args?: any) {
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useQuery(queryFn, args);
  } catch (e) {
    // When Convex throws (server error, missing functions, etc.),
    // return null so components use their fallback data
    console.warn('Convex query unavailable, using fallback data');
    return null;
  }
}
