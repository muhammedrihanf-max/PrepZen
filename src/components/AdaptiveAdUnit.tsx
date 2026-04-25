import React from 'react';
import { Capacitor } from '@capacitor/core';
import AdSenseUnit from './AdSenseUnit';

interface AdaptiveAdUnitProps {
  adSenseSlot: string;
  adMobId?: string; // App-ads.txt / ID for AdMob
  format?: 'auto' | 'fluid' | 'rectangle';
  className?: string;
}

/**
 * Adaptive Ad Component 
 * Website -> Shows Google AdSense
 * Mobile APK -> Shows Google AdMob Placeholder (or Real Ad if plugin configured)
 */
const AdaptiveAdUnit: React.FC<AdaptiveAdUnitProps> = ({ 
  adSenseSlot, 
  adMobId,
  format = 'auto', 
  className = ""
}) => {
  const isNative = Capacitor.isNativePlatform();

  if (isNative) {
    // This is where Native AdMob logic goes
    return (
      <div className={`admob-placeholder ${className}`} style={{ 
        background: 'rgba(255, 255, 255, 0.05)', 
        border: '1px dashed rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        padding: '20px',
        textAlign: 'center',
        minHeight: '100px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginBottom: '4px' }}>MOBILE AD UNIT</div>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#6366f1' }}>AdMob - {adMobId || 'Active'}</div>
        <small style={{ fontSize: '0.6rem', opacity: 0.5, marginTop: '4px' }}>Native APK Backend</small>
      </div>
    );
  }

  // Fallback to AdSense for Web
  return (
    <AdSenseUnit 
      slot={adSenseSlot} 
      format={format} 
      className={className} 
    />
  );
};

export default AdaptiveAdUnit;
