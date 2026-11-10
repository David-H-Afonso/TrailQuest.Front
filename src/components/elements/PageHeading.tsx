import type { ReactNode } from 'react';

export function PageHeading({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: ReactNode }) {
  return <div className="page-heading"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1>
    {description && <p className="page-description">{description}</p>}</div>{actions && <div className="page-heading__actions">{actions}</div>}</div>;
}
