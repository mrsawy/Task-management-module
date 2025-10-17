"use client";

import { Button } from "@/components/atoms/button";
import { cn } from "@/lib/utils";
import { MoonIcon, SunIcon } from "lucide-react";

import { useEffect, useState } from "react";
import { useTheme } from "./ThemeProvider";

const ThemeToggleButton = ({ className }: { className?: string }) => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    console.log({ theme }, theme === "dark" ? "light" : "dark")
    setTheme(theme === "dark" ? "light" : "dark");
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent SSR flicker and hydration mismatch
  if (!mounted) {
    return <Button size="icon" className="rounded-full" />;
  }

  return (
    <Button size="icon" className={cn("rounded-full", className)} onClick={toggleTheme}>
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </Button>
  );
};

export default ThemeToggleButton;
