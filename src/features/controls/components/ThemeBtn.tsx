import { useTheme } from "@/providers/ThemeProvider";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ThemeBtnProps {
  className?: string;
  title?: string;
  variant?: "default" | "outline" | "secondary" | "custom";
}

export function ThemeBtn({
  className,
  title,
  variant = "custom",
}: ThemeBtnProps) {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <Button
      size="icon"
      onClick={toggleTheme}
      title={title || `Switch to ${theme === "light" ? "dark" : "light"} mode`}
      className={className}
      variant={variant}
    >
      <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
