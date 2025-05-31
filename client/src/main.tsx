import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { PrimeReactProvider } from "primereact/api";
import "primereact/resources/themes/lara-light-teal/theme.css"; // theme
import "primereact/resources/primereact.min.css"; // core css
import "primeicons/primeicons.css"; // icons
import "./index.css";
import App from "./App.tsx";

const DEFAULT_THEME = {
  ripple: true,
  primaryColor: "#00955f",
  components: {
    button: {
      root: {
        backgroundColor: "#00955f",
        borderColor: "#00955f",
        fontSize: "1.1rem",
        transition: "transform 0.2s, background-color 0.2s",
        "&:enabled:hover": {
          backgroundColor: "#00764c",
          borderColor: "#00764c",
          transform: "translateY(-2px)",
        },
        "&:enabled:active": {
          transform: "translateY(0)",
        },
      },
    },
    scrolltop: {
      root: {
        backgroundColor: "#00955f",
        borderColor: "#00955f",
        color: "white",
        borderRadius: "50%",
        width: "48px",
        height: "48px",
        boxShadow: "0 4px 12px rgba(0, 149, 95, 0.3)",
        transition: "all 0.3s ease",
        "&:hover": {
          backgroundColor: "#007a4d",
          borderColor: "#007a4d",
          transform: "translateY(-2px)",
          boxShadow: "0 6px 16px rgba(0, 149, 95, 0.4)",
        },
      },
    },
  },
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PrimeReactProvider value={DEFAULT_THEME}>
      <App />
    </PrimeReactProvider>
  </StrictMode>,
);
