import type { ReactNode } from 'react';
import { BrandLogo } from './BrandLogo';

interface PageHeaderProps {
  onLogoClick: () => void;
  children?: ReactNode;
}

// The one header row shared by every screen (Navbar's dashboard header and
// LandingPage's header both used to be separate, near-identical
// implementations — same flex row, same border, same logo, just copy-pasted
// three times). Each page supplies whatever belongs on the right via
// children; the logo and its behavior are the same everywhere by
// construction.
export function PageHeader({ onLogoClick, children }: PageHeaderProps) {
  return (
    <header className="page-header">
      <BrandLogo onClick={onLogoClick} />
      {children}
    </header>
  );
}
