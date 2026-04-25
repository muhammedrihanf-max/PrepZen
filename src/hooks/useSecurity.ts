import { useEffect } from 'react';

export const useSecurity = () => {
  useEffect(() => {
    // 1. Disable Right-Click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // 2. Disable Sensitive Keyboard Shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable Ctrl+P (Print)
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        e.stopPropagation();
      }
      
      // Disable Ctrl+S (Save)
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        e.stopPropagation();
      }

      // Disable Ctrl+U (View Source)
      if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
        e.preventDefault();
        e.stopPropagation();
      }

      // Disable Ctrl+Shift+I / F12 (DevTools)
      if (((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'i') || e.key === 'F12') {
        // We can't fully block F12 in all browsers, but we can try
        // alert('Developer tools are disabled for security.');
      }

      // Disable PrintScreen key (best effort)
      if (e.key === 'PrintScreen') {
        // Clear clipboard (works in some browsers with permission)
        navigator.clipboard.writeText('');
        alert('Screenshots are disabled on this platform to protect exam integrity.');
      }
    };

    // 3. Detect and Respond to Blur Event (Anti-Peek)
    const handleBlur = () => {
      document.documentElement.classList.add('privacy-active');
      const overlay = document.getElementById('privacy-protector');
      if (overlay) overlay.classList.add('privacy-active-overlay');
    };

    const handleFocus = () => {
      document.documentElement.classList.remove('privacy-active');
      const overlay = document.getElementById('privacy-protector');
      if (overlay) overlay.classList.remove('privacy-active-overlay');
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleBlur();
      } else {
        handleFocus();
      }
    };

    // Add event listeners
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    // Cleanup
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      // Ensure classes are removed on unmount
      handleFocus();
    };
  }, []);
};
