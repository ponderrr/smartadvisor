// client/src/utils/tokenCleanup.ts
/**
 * Utility to clean up invalid tokens from localStorage
 * This should be called when the app starts to prevent 401 loops
 */

export const clearInvalidTokens = (): void => {
  try {
    const storedTokens = localStorage.getItem("auth_tokens");

    if (!storedTokens) {
      console.log("🔍 No stored tokens found");
      return;
    }

    const tokens = JSON.parse(storedTokens);

    // Check if tokens have the required structure
    if (!tokens.access_token || !tokens.refresh_token || !tokens.token_type) {
      console.log("🧹 Clearing invalid token structure");
      localStorage.removeItem("auth_tokens");
      return;
    }

    // Check if tokens are expired (basic check)
    try {
      const payload = JSON.parse(atob(tokens.access_token.split(".")[1]));
      const isExpired = payload.exp * 1000 < Date.now();

      if (isExpired) {
        console.log("⏰ Access token expired, will attempt refresh");
        // Don't clear here - let the API service handle refresh
      } else {
        console.log("✅ Tokens appear valid");
      }
    } catch (error) {
      console.log("🚫 Invalid token format, clearing");
      localStorage.removeItem("auth_tokens");
    }
  } catch (error) {
    console.error("Error checking tokens:", error);
    localStorage.removeItem("auth_tokens");
  }
};

export const clearAllTokens = (): void => {
  console.log("🗑️ Manually clearing all tokens");
  localStorage.removeItem("auth_tokens");
};
