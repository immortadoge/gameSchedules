import type { MouseEvent, ReactNode } from 'react';

interface LinkProps {
  href: string;
  onNavigate: () => void;
  className?: string;
  children: ReactNode;
}

/**
 * A real anchor (so middle-click, copy-link and open-in-new-tab keep working)
 * that navigates client-side on a plain left click.
 */
export function Link({ href, onNavigate, className, children }: LinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>): void => {
    const isModified = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
    if (event.defaultPrevented || isModified || event.button !== 0) return;
    event.preventDefault();
    onNavigate();
  };

  return (
    <a href={href} className={className} onClick={handleClick}>
      {children}
    </a>
  );
}
