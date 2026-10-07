import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { installGuestFetch } from "./guest/installGuestFetch";

// Must run before the app renders so the first API calls are already routed
// to the in-browser guest API when nobody is signed in.
installGuestFetch();

createRoot(document.getElementById("root")!).render(<App />);
