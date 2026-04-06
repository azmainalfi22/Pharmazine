/**
 * Keyboard Shortcuts Hook
 * Provides global keyboard shortcuts for better UX
 */
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts() {
  const navigate = useNavigate();

  useEffect(() => {
    const shortcuts: ShortcutConfig[] = [
      // Navigation shortcuts
      {
        key: "d",
        ctrl: true,
        action: () => navigate("/"),
        description: "Go to Dashboard",
      },
      {
        key: "s",
        ctrl: true,
        action: () => navigate("/sales"),
        description: "Open POS",
      },
      {
        key: "i",
        ctrl: true,
        action: () => navigate("/inventory"),
        description: "View Inventory",
      },
      {
        key: "c",
        ctrl: true,
        action: () => navigate("/customers"),
        description: "View Customers",
      },
      {
        key: "p",
        ctrl: true,
        action: () => navigate("/purchase"),
        description: "View Purchases",
      },
      {
        key: "r",
        ctrl: true,
        action: () => navigate("/reports"),
        description: "View Reports",
      },

      // Feature shortcuts
      {
        key: "f",
        ctrl: true,
        action: () => {
          // Focus search if available
          const searchInput = document.querySelector<HTMLInputElement>(
            'input[type="search"], input[placeholder*="Search"]'
          );
          if (searchInput) {
            searchInput.focus();
          } else {
            toast.info("No search box available on this page");
          }
        },
        description: "Focus Search",
      },

      {
        key: "/",
        action: () => {
          toast.info("Keyboard Shortcuts", {
            description:
              "Ctrl+D: Dashboard | Ctrl+S: POS | Ctrl+I: Inventory | Ctrl+F: Search",
          });
        },
        description: "Show shortcuts",
      },

      // Quick actions
      {
        key: "n",
        ctrl: true,
        shift: true,
        action: () => navigate("/sales"),
        description: "New Sale",
      },
      {
        key: "m",
        ctrl: true,
        action: () => navigate("/medicine-management"),
        description: "Medicine Management",
      },
      {
        key: "h",
        ctrl: true,
        action: () => navigate("/patient-history"),
        description: "Patient History",
      },
    ];

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      const isInputField =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      // Allow "/" key when NOT in input field
      if (event.key === "/" && !isInputField) {
        event.preventDefault();
      }

      // Don't trigger shortcuts in input fields (except Escape)
      if (isInputField && event.key !== "Escape") {
        return;
      }

      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl
          ? event.ctrlKey || event.metaKey
          : !event.ctrlKey && !event.metaKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;

        if (
          event.key.toLowerCase() === shortcut.key.toLowerCase() &&
          ctrlMatch &&
          shiftMatch &&
          altMatch
        ) {
          event.preventDefault();
          event.stopPropagation();
          shortcut.action();
          break;
        }
      }

      // ESC to close modals/dialogs
      if (event.key === "Escape") {
        const closeButton = document.querySelector<HTMLButtonElement>(
          '[role="dialog"] button[aria-label*="Close"]'
        );
        if (closeButton) {
          closeButton.click();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);
}

/**
 * Show keyboard shortcuts help
 */
export function showKeyboardShortcuts() {
  toast.info("Keyboard Shortcuts", {
    description: `
      Ctrl+D: Dashboard
      Ctrl+S: POS/Sales
      Ctrl+I: Inventory
      Ctrl+C: Customers
      Ctrl+P: Purchases
      Ctrl+R: Reports
      Ctrl+F: Search
      Ctrl+Shift+N: New Sale
      /: Show this help
      ESC: Close dialogs
    `,
    duration: 10000,
  });
}

