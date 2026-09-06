interface BrandLogoProps {
  // Always required, deliberately — the logo is the one "take me back to
  // the landing page" affordance everywhere in the app, and a caller with
  // nothing to wire it to is a sign something else is missing, not a
  // reason to silently render inert text.
  onClick: () => void;
}

export function BrandLogo({ onClick }: BrandLogoProps) {
  return (
    <button type="button" className="brand-logo" onClick={onClick}>
      Veyra
    </button>
  );
}
