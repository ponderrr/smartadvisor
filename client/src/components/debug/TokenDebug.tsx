// client/src/components/debug/TokenDebug.tsx
import React, { useState } from "react";
import { clearAllTokens } from "../../utils/tokenCleanup";
import api from "../../services/api";

const TokenDebug: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const checkTokens = () => {
    const storedTokens = localStorage.getItem("auth_tokens");
    const parsedTokens = storedTokens ? JSON.parse(storedTokens) : null;

    let tokenInfo:
      | string
      | {
          hasTokens: boolean;
          isExpired: boolean;
          expiresAt: string;
          isAuthenticated: boolean;
          userId: any;
        } = "No tokens found";
    if (parsedTokens) {
      try {
        const payload = JSON.parse(
          atob(parsedTokens.access_token.split(".")[1])
        );
        const isExpired = payload.exp * 1000 < Date.now();
        tokenInfo = {
          hasTokens: true,
          isExpired,
          expiresAt: new Date(payload.exp * 1000).toISOString(),
          isAuthenticated: api.isAuthenticated,
          userId: payload.sub,
        };
      } catch (e) {
        tokenInfo = "Invalid token format";
      }
    }

    setDebugInfo(tokenInfo);
  };

  const clearTokens = () => {
    clearAllTokens();
    setDebugInfo(null);
    window.location.reload();
  };

  const testCurrentUser = async () => {
    try {
      const user = await api.getCurrentUser();
      setDebugInfo((prev: any) => ({
        ...prev,
        currentUserTest: "Success",
        user: user.email,
      }));
    } catch (error) {
      setDebugInfo((prev: any) => ({
        ...prev,
        currentUserTest: "Failed",
        error: error instanceof Error ? error.message : "Unknown error",
      }));
    }
  };

  // Only show in development
  if (import.meta.env.PROD) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        background: "rgba(0,0,0,0.8)",
        color: "white",
        padding: "15px",
        borderRadius: "8px",
        fontSize: "12px",
        zIndex: 9999,
        maxWidth: "300px",
      }}
    >
      <div style={{ marginBottom: "10px" }}>
        <strong>🐛 Token Debug</strong>
      </div>

      <div style={{ marginBottom: "10px" }}>
        <button onClick={checkTokens} style={{ marginRight: "5px" }}>
          Check Tokens
        </button>
        <button onClick={clearTokens} style={{ marginRight: "5px" }}>
          Clear Tokens
        </button>
        <button onClick={testCurrentUser}>Test API</button>
      </div>

      <div style={{ fontSize: "10px", wordBreak: "break-word" }}>
        <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
      </div>
    </div>
  );
};

export default TokenDebug;
