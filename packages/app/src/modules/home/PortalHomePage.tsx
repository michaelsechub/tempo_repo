import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Entity } from '@backstage/catalog-model';
import { useApi } from '@backstage/core-plugin-api';
import { catalogApiRef } from '@backstage/plugin-catalog-react';
import './portal-home.css';

const features = [
  {
    mark: '⚡',
    title: 'Lightning Fast',
    description: 'Process payments in under 3 seconds with our optimized infrastructure',
  },
  {
    mark: '⛨',
    title: 'Bank-Grade Security',
    description: 'End-to-end encryption and PCI-DSS compliance for complete peace of mind',
  },
  {
    mark: '◎',
    title: 'Universal Coverage',
    description: 'Connect to all major Ethiopian banks and mobile wallet providers',
  },
  {
    mark: '</>',
    title: 'Developer First',
    description: 'RESTful APIs, comprehensive SDKs, and detailed documentation',
  },
];

const steps = [
  {
    number: '01',
    title: 'Explore the catalog',
    description: 'See the systems, services, and APIs registered in this portal',
    href: '/catalog',
    action: 'Open catalog',
  },
  {
    number: '02',
    title: 'Start from a template',
    description: 'Scaffold a new integration with the software templates',
    href: '/create',
    action: 'Get API Keys',
  },
  {
    number: '03',
    title: 'Read the API reference',
    description: 'Open the contracts published for catalog API entities',
    href: '/documentation',
    action: 'View docs',
  },
  {
    number: '04',
    title: 'Read TechDocs',
    description: 'Find service documentation published through TechDocs',
    href: '/docs',
    action: 'Open docs',
  },
];

function entityHref(entity: Entity): string {
  const namespace = entity.metadata.namespace ?? 'default';
  return `/catalog/${encodeURIComponent(namespace)}/${encodeURIComponent(entity.kind.toLocaleLowerCase('en-US'))}/${encodeURIComponent(entity.metadata.name)}`;
}

export function PortalHomePage() {
  const catalogApi = useApi(catalogApiRef);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let active = true;
    catalogApi
      .getEntities({ filter: { kind: ['System', 'Component', 'API'] } })
      .then(result => {
        if (active) {
          setEntities(result.items);
        }
      })
      .catch(() => {
        if (active) {
          setError('Catalog data could not be loaded. Check that the Backstage backend is available.');
        }
      });
    return () => {
      active = false;
    };
  }, [catalogApi]);

  const systems = entities.filter(entity => entity.kind.toLocaleLowerCase('en-US') === 'system');
  const components = entities.filter(entity => entity.kind.toLocaleLowerCase('en-US') === 'component');
  const apis = entities.filter(entity => entity.kind.toLocaleLowerCase('en-US') === 'api');

  return (
    <div className="eth-home">
      <section className="eth-hero-band">
        <div className="eth-hero-copy">
          <span className="eth-pill">New: Request to Pay API now available</span>
          <h1>
            Build the Future of
            <span>Ethiopian Fintech</span>
          </h1>
          <p>
            ETH Switch provides the infrastructure to connect banks, mobile wallets, and payment providers across Ethiopia. Explore the systems and APIs registered in this developer portal.
          </p>
          <div className="eth-hero-actions">
            <Link className="eth-btn primary" to="/create">
              Get Started Free
            </Link>
            <Link className="eth-btn ghost" to="/documentation">
              View Documentation
            </Link>
          </div>
          <div className="eth-hero-stats" aria-label="Catalog totals">
            <div>
              <strong>{systems.length}</strong>
              <span>Systems</span>
            </div>
            <div>
              <strong>{components.length}</strong>
              <span>Components</span>
            </div>
            <div>
              <strong>{apis.length}</strong>
              <span>APIs</span>
            </div>
          </div>
        </div>
      </section>

      <section className="eth-section">
        <span className="eth-pill solid">Why Choose ETH Switch</span>
        <h2>Built for Modern Payment Needs</h2>
        <p>
          The portal brings your catalog, API reference, templates, and documentation into the ETH Switch developer experience.
        </p>
        <div className="eth-feature-grid">
          {features.map(feature => (
            <article key={feature.title} className="eth-card">
              <div className="eth-icon" aria-hidden="true">{feature.mark}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="eth-section">
        <div className="eth-split">
          <article className="eth-card">
            <h2 style={{ marginTop: 0 }}>Quick Start Guide</h2>
            <p>Move through the portal with the tools that are already connected to the backend.</p>
            {steps.map(step => (
              <div key={step.number} className="eth-step">
                <b>{step.number}</b>
                <div>
                  <h3 style={{ margin: '0 0 4px' }}>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
                <Link to={step.href}>{step.action}</Link>
              </div>
            ))}
          </article>
          <article className="eth-card">
            <div className="eth-status-row">
              <h2 style={{ margin: 0, fontSize: 22 }}>System Status</h2>
              <span className="eth-ok">All Systems Operational</span>
            </div>
            <p>Catalog systems currently registered in Backstage. This badge is not a live uptime monitor.</p>
            {systems.length === 0 ? (
              <p className="eth-message">No systems are registered yet.</p>
            ) : (
              systems.slice(0, 6).map(system => (
                <div key={system.metadata.uid ?? system.metadata.name} className="eth-status-row">
                  <strong>{system.metadata.title ?? system.metadata.name}</strong>
                  <span className="eth-ok">Registered</span>
                </div>
              ))
            )}
          </article>
        </div>
      </section>

      <section className="eth-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'end', textAlign: 'left' }}>
          <div>
            <h2 style={{ marginTop: 0 }}>Popular APIs</h2>
            <p style={{ margin: 0 }}>API entities from the software catalog.</p>
          </div>
          <Link className="eth-btn outline" to="/api-docs">View All APIs</Link>
        </div>
        {error ? <p className="eth-message">{error}</p> : null}
        {apis.length === 0 && !error ? <p className="eth-message">No API entities are registered yet.</p> : null}
        <div className="eth-api-grid">
          {apis.slice(0, 4).map(api => (
            <article key={api.metadata.uid ?? api.metadata.name} className="eth-card eth-api-card">
              <span className="eth-kind">{String(api.spec?.type ?? 'API')}</span>
              <h3>
                <Link to={entityHref(api)}>{api.metadata.title ?? api.metadata.name}</Link>
              </h3>
              <p>{api.metadata.description ?? 'No description published.'}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
