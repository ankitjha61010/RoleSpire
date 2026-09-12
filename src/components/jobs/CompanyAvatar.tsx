import React, { useState } from 'react';

interface CompanyAvatarProps {
  logoUrl?: string;
  companyName: string;
  className?: string;
}

/**
 * Renders a company logo when one is provided, falling back to initials if
 * there's no logo URL or the image fails to load (some providers return logo
 * URLs that 404/403 rather than a real image).
 */
export const CompanyAvatar: React.FC<CompanyAvatarProps> = ({ logoUrl, companyName, className }) => {
  const [failed, setFailed] = useState(false);

  if (logoUrl && !failed) {
    return (
      <img
        src={logoUrl}
        alt={companyName}
        className={className || 'w-full h-full object-cover'}
        onError={() => setFailed(true)}
      />
    );
  }

  return <span>{companyName.slice(0, 2).toUpperCase()}</span>;
};
