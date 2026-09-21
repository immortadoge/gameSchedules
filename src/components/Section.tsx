import type { ReactNode } from 'react';

interface SectionProps {
  /** Rendered as the grouped-list section header, like SwiftUI's `Section("…")`. */
  title?: string;
  busy?: boolean;
  children: ReactNode;
}

export function Section({ title, busy = false, children }: SectionProps) {
  return (
    <section className="section">
      {title ? <h2 className="section__title">{title}</h2> : null}
      <ul className="section__list" aria-busy={busy}>
        {children}
      </ul>
    </section>
  );
}

export function PlaceholderRow({ children }: { children: ReactNode }) {
  return <li className="row row--placeholder">{children}</li>;
}

export function LoadingRow({ label = 'Loading…' }: { label?: string }) {
  return (
    <li className="row row--placeholder" role="status">
      <span className="spinner" aria-hidden="true" />
      {label}
    </li>
  );
}
