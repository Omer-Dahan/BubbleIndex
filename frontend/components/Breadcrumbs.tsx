import Link from 'next/link';

interface Crumb {
  label: string;
  href?: string;
}

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol
        className="mono"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 6,
          margin: 0,
          padding: 0,
          listStyle: 'none',
          fontSize: 11,
          letterSpacing: '0.06em',
          color: 'var(--ink-4)',
        }}
      >
        {items.map((item, i) => (
          <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {i > 0 && <span aria-hidden="true">/</span>}
            {item.href ? (
              <Link href={item.href} style={{ color: 'var(--ink-3)', textDecoration: 'none', maxWidth: '40vw', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block' }}>
                {item.label}
              </Link>
            ) : (
              <span style={{ color: 'var(--ink-2)', maxWidth: '50vw', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block' }}>{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
