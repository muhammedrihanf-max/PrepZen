import React, { useEffect } from 'react';

const SecurityGuard: React.FC = () => {
  useEffect(() => {
    // 1. Disable Right-Click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      console.warn('%cPrepZen Security: Right-click is disabled for your protection.', 'color: #8b5cf6; font-size: 1.2rem; font-weight: bold;');
    };

    // 2. Block Inspect Element & Source Shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12
      if (e.key === 'F12') {
        e.preventDefault();
        return false;
      }

      // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
      if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) {
        e.preventDefault();
        return false;
      }

      // Ctrl+U (View Source)
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        return false;
      }
      
      // Ctrl+S (Save Page)
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        return false;
      }
    };

    // 3. Console Management
    const consoleWarning = () => {
      console.clear();
      console.log(
        '%c STOP! ',
        'background: #ef4444; color: white; font-size: 3rem; font-weight: bold; border-radius: 8px; padding: 10px;'
      );
      console.log(
        '%cThis is a browser feature intended for developers. If someone told you to copy-paste something here to "hack" or "enable" a feature, it is a scam and will give them access to your PrepZen account.',
        'font-size: 1.2rem; line-height: 1.4; color: #e2e8f0;'
      );
      console.log(
        '%cPrepZen Security Team',
        'font-size: 1rem; font-weight: bold; color: #8b5cf6;'
      );
    };

    // Initial warning
    consoleWarning();

    // Periodic console clearing to make inspecting logs harder
    const interval = setInterval(() => {
      // In a real production environment, you might only do this if devtools is detected
      // But for this request, we'll keep it active to "wow" the user with the security check
      console.clear();
      consoleWarning();
    }, 5000);

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      clearInterval(interval);
    };
  }, []);

  return null; // This component doesn't render any UI
};

export default SecurityGuard;
