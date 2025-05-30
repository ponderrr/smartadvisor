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

    // Check if both tokens are expired
    try {
      const accessPayload = JSON.parse(atob(tokens.access_token.split(".")[1]));
      const refreshPayload = JSON.parse(
        atob(tokens.refresh_token.split(".")[1])
      );

      const accessExpired = accessPayload.exp * 1000 < Date.now();
      const refreshExpired = refreshPayload.exp * 1000 < Date.now();

      if (refreshExpired) {
        console.log("🗑️ Refresh token expired, clearing all tokens");
        localStorage.removeItem("auth_tokens");
      } else if (accessExpired) {
        console.log(
          "⏰ Access token expired, refresh token valid - keeping tokens"
        );
        // Keep tokens, let API service handle refresh
      } else {
        console.log("✅ Both tokens are valid");
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

export const hasValidTokens = (): boolean => {
  try {
    const storedTokens = localStorage.getItem("auth_tokens");
    if (!storedTokens) return false;

    const tokens = JSON.parse(storedTokens);
    if (!tokens.access_token || !tokens.refresh_token) return false;

    // Check if refresh token is still valid
    const refreshPayload = JSON.parse(atob(tokens.refresh_token.split(".")[1]));
    const refreshExpired = refreshPayload.exp * 1000 < Date.now();

    return !refreshExpired;
  } catch {
    return false;
  }
};
