import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMoon, faSun } from '@fortawesome/free-solid-svg-icons'

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()

  return (
    <Button
      variant="ghost" 
      size="sm"
      className="opacity-60 hover:opacity-100 hover:bg-slate-800/30 hover:backdrop-blur-sm 
        hover:border-slate-700/30 transition-all duration-200 
        hover:text-blue-400 hover:shadow-lg hover:shadow-blue-900/20 border-transparent"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      <FontAwesomeIcon 
        icon={theme === "dark" ? faSun : faMoon} 
        className="h-4 w-4" 
      />
    </Button>
  )
} 