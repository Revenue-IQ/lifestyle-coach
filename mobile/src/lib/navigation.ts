import { router, type Href } from 'expo-router';

/**
 * Back that always goes somewhere. On web, `router.back()` does nothing when the
 * page was opened or refreshed directly and there is no history behind it, which
 * left "Back" on the coach screen dead. The fallback is the screen that logically
 * sits behind this one.
 */
export function goBack(fallback: Href) {
  if (router.canGoBack()) router.back();
  else router.replace(fallback);
}
