import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    // Check for saved theme or default to dark
    const savedTheme = localStorage.getItem('prepzen-theme') as 'light' | 'dark' | null;
    return savedTheme || 'dark';
  });

  useEffect(() => {
    // Apply theme to document element
    document.documentElement.setAttribute('data-theme', theme);
    // Persist theme choice
    localStorage.setItem('prepzen-theme', theme);
    
    // Optional: add transition class to body to prevent flash
    document.body.classList.add('theme-transitioning');
    const timer = setTimeout(() => {
      document.body.classList.remove('theme-transitioning');
    }, 300);
    
    return () => clearTimeout(timer);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <button 
      className="theme-toggle-btn" 
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
    >
      {theme === 'light' ? (
        <Moon size={20} />
      ) : (
        <Sun size={20} />
      )}
    </button>
  );
};

export default ThemeToggle;
