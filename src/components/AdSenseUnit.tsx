import React, { useEffect } from 'react';

interface AdSenseUnitProps {
  slot: string;
  format?: 'auto' | 'fluid' | 'rectangle';
  responsive?: 'true' | 'false';
  style?: React.CSSProperties;
}

/**
 * Reusable Google AdSense Ad Unit Component
 * Note: AdSense script must be included in index.html
 */
const AdSenseUnit: React.FC<AdSenseUnitProps> = ({ 
  slot, 
  format = 'auto', 
  responsive = 'true',
  style = { display: 'block' } 
}) => {
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error("AdSense error:", e);
    }
  }, []);

  return (
    <div className="adsense-container" style={{ margin: '20px 0', overflow: 'hidden' }}>
      <ins className="adsbygoogle"
           style={style}
           data-ad-client="ca-pub-0000000000000000" // Replace with real publisher ID
           data-ad-slot={slot}
           data-ad-format={format}
           data-full-width-responsive={responsive}></ins>
    </div>
  );
};

export default AdSenseUnit;
