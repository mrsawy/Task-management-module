"use client";

import { Button } from "@/components/atoms/button";
import { cn } from "@/lib/utils";
import { MoonIcon, SunIcon } from "lucide-react";

import { useEffect, useState } from "react";
import { useTheme } from "./ThemeProvider";
import { AnimatedThemeToggler } from "../atoms/animated-theme-toggler";

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
    <AnimatedThemeToggler className={cn("cursor-pointer border rounded p-1 bg-primary text-white")} />

  );
};

export default ThemeToggleButton;
