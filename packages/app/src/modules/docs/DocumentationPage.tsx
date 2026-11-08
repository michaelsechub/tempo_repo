import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Entity } from '@backstage/catalog-model';
import { useApi } from '@backstage/core-plugin-api';
import { catalogApiRef } from '@backstage/plugin-catalog-react';
import { ComponentDetail } from './ComponentDetail';
import { domainPlaceholders, findDomain, type DomainPlaceholder } from './domains';
import './docs.css';

function entityHref(entity: Entity): string {
  const namespace = entity.metadata.namespace ?? 'default';
  return `/catalog/${encodeURIComponent(namespace)}/${encodeURIComponent(entity.kind.toLocaleLowerCase('en-US'))}/${encodeURIComponent(entity.metadata.name)}`;
}

function systemOf(entity: Entity): string | undefined {
  const system = entity.spec && 'system' in entity.spec ? entity.spec.system : undefined;
  return typeof system === 'string' ? system : undefined;
}

function useCatalogEntities() {
  const catalogApi = useApi(catalogApiRef);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);

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
          setError('Catalog data could not be loaded.');
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [catalogApi]);

  return { entities, error, loading };
}

function systemDocsHref(system: Entity): string {
  const namespace = system.metadata.namespace ?? 'default';
  return `/documentation/system/${encodeURIComponent(namespace)}/${encodeURIComponent(system.metadata.name)}`;
}

function componentDocsHref(component: Entity): string {
  const namespace = component.metadata.namespace ?? 'default';
  return `/documentation/component/${encodeURIComponent(namespace)}/${encodeURIComponent(component.metadata.name)}`;
}

function apisForComponent(component: Entity, entities: Entity[]): Entity[] {
  const refs: string[] = [];
  const provided = component.spec && 'providesApis' in component.spec ? component.spec.providesApis : undefined;
  if (Array.isArray(provided)) {
    for (const item of provided) {
      if (typeof item === 'string') {
        refs.push(item);
      }
    }
  }
  for (const relation of component.relations ?? []) {
    if (relation.type === 'providesApi') {
      refs.push(relation.targetRef);
    }
  }
  return entities.filter(entity => {
    if (entity.kind.toLocaleLowerCase('en-US') !== 'api') {
      return false;
    }
    const namespace = entity.metadata.namespace ?? 'default';
    const name = entity.metadata.name;
    return refs.some(ref => ref === name || ref === `${namespace}/${name}` || ref === `api:${name}` || ref === `api:${namespace}/${name}`);
  });
}

function techDocsHref(entity: Entity): string {
  const namespace = entity.metadata.namespace ?? 'default';
  return `/docs/${encodeURIComponent(namespace)}/${encodeURIComponent(entity.kind.toLocaleLowerCase('en-US'))}/${encodeURIComponent(entity.metadata.name)}`;
}

function SystemCard({ system }: { system: Entity }) {
  return (
    <article className="eth-doc-card">
      <div className="eth-doc-top">
        <div className="eth-doc-mark">SYS</div>
        <span className="eth-badge stable">{String(system.spec?.type ?? 'system')}</span>
      </div>
      <h3>{system.metadata.title ?? system.metadata.name}</h3>
      <p>{system.metadata.description ?? 'No description published for this system.'}</p>
      <Link className="eth-doc-link" to={systemDocsHref(system)}>View Full Documentation</Link>
    </article>
  );
}
function DocsIndex({ entities, error, loading }: { entities: Entity[]; error?: string; loading: boolean }) {
  const systems = entities.filter(entity => entity.kind.toLocaleLowerCase('en-US') === 'system');
  const [openDomain, setOpenDomain] = useState(domainPlaceholders[0]?.id);
  const [tab, setTab] = useState<'overview' | 'apis'>('overview');
  const selected = domainPlaceholders.find(domain => domain.id === openDomain) ?? domainPlaceholders[0];

  return (
    <div className="eth-docs">
      <div className="eth-docs-wrap">
        <header className="eth-docs-hero">
          <span className="eth-badge placeholder">Developer-First Payment APIs</span>
          <h1>API Documentation</h1>
          <p>
            Guides for ETH Switch domains and the systems registered in this Backstage catalog. Domain cards are placeholders until a Domain kind is added.
          </p>
          <div className="eth-docs-actions">
            <Link className="eth-btn primary" to="/create">Get Started</Link>
            <Link className="eth-btn outline" to="/api-docs">Open API reference</Link>
          </div>
          <div className="eth-docs-meta">
            <span>Catalog-backed systems</span>
            <span>Placeholder domains from the developer hub</span>
            <span>24/7 portal support</span>
          </div>
        </header>

        <div className="eth-quick-grid">
          <article className="eth-doc-card">
            <div className="eth-doc-mark">1</div>
            <h3>Quick Start Guide</h3>
            <p>Open a software template and scaffold an integration from the catalog.</p>
            <Link className="eth-doc-link" to="/create">Start Building →</Link>
          </article>
          <article className="eth-doc-card">
            <div className="eth-doc-mark">2</div>
            <h3>API Reference</h3>
            <p>Read the OpenAPI contracts published for API entities in Backstage.</p>
            <Link className="eth-doc-link" to="/api-docs">Try the reference →</Link>
          </article>
          <article className="eth-doc-card">
            <div className="eth-doc-mark">3</div>
            <h3>TechDocs</h3>
            <p>Longer service guides published through the TechDocs plugin.</p>
            <Link className="eth-doc-link" to="/docs">Read TechDocs →</Link>
          </article>
        </div>

        <div className="eth-section-title">
          <h2>Payment Products</h2>
          <p className="eth-docs-lead">Explore our comprehensive suite of payment APIs designed for modern financial applications</p>
        </div>
        <div className="eth-product-grid">
          {domainPlaceholders.map(domain => (
            <article key={domain.id} className="eth-doc-card">
              <div className="eth-doc-top">
                <div className="eth-doc-mark" style={{ background: domain.tone }}>{domain.mark}</div>
                <span className={`eth-badge ${domain.status}`}>{domain.status}</span>
              </div>
              <h3>{domain.name}</h3>
              <p>{domain.description}</p>
              <Link className="eth-doc-link" to={`/documentation/domain/${domain.id}`}>View Full Documentation</Link>
            </article>
          ))}
        </div>

        <div className="eth-section-title" style={{ marginTop: 64 }}>
          <h2>Merchant</h2>
          <p className="eth-docs-lead">Accept in-store and online payments across Ethiopian banks and wallets.</p>
          <p className="eth-docs-lead">The catalog systems for this domain are listed below.</p>
        </div>
        {loading ? <p className="eth-docs-lead">Loading systems from the catalog…</p> : null}
        {error ? <p className="eth-docs-lead">{error}</p> : null}
        {!loading && systems.length === 0 && !error ? <p className="eth-docs-lead">No systems are registered yet.</p> : null}
        <div className="eth-product-grid">
          {systems.map(system => (
            <SystemCard key={system.metadata.uid ?? system.metadata.name} system={system} />
          ))}
        </div>

        {selected ? (
          <section className="eth-reference">
            <div className="eth-section-title">
              <h2>Quick API Reference</h2>
              <p className="eth-docs-lead">Placeholder endpoints for a domain, before the full documentation page.</p>
            </div>
            <article className="eth-doc-card">
              <div className="eth-reference-head">
                <div>
                  <h3 style={{ margin: 0 }}>{selected.name}</h3>
                  <p>{selected.description}</p>
                </div>
                <Link className="eth-btn outline" to={`/documentation/domain/${selected.id}`}>Full Documentation</Link>
              </div>
              <div className="eth-tabs" role="tablist">
                {domainPlaceholders.map(domain => (
                  <button key={domain.id} type="button" aria-pressed={domain.id === selected.id} onClick={() => setOpenDomain(domain.id)}>
                    {domain.name}
                  </button>
                ))}
              </div>
              <div className="eth-tabs">
                <button type="button" aria-pressed={tab === 'overview'} onClick={() => setTab('overview')}>Overview & Features</button>
                <button type="button" aria-pressed={tab === 'apis'} onClick={() => setTab('apis')}>API Endpoints</button>
              </div>
              {tab === 'overview' ? (
                <div>
                  <p>{selected.overview}</p>
                  <ul className="eth-feature-list">
                    {selected.features.map(feature => <li key={feature}>{feature}</li>)}
                  </ul>
                </div>
              ) : (
                <div>
                  {selected.apis.map(api => (
                    <div key={api.endpoint} className="eth-endpoint">
                      <strong>{api.name}</strong>
                      <span className={`eth-badge ${api.status}`} style={{ marginLeft: 8 }}>{api.status}</span>
                      <p>{api.description}</p>
                      <code>{api.endpoint}</code>
                    </div>
                  ))}
                </div>
              )}
            </article>
          </section>
        ) : null}
      </div>
    </div>
  );
}

function DomainDetail({ domain }: { domain: DomainPlaceholder }) {
  return (
    <div className="eth-docs">
      <section className="eth-detail-hero">
        <div className="eth-detail-hero-inner">
          <Link to="/documentation">← Documentation</Link>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 18 }}>
            <div className="eth-doc-mark" style={{ background: domain.tone, width: 56, height: 56 }}>{domain.mark}</div>
            <div>
              <span className="eth-badge placeholder">Placeholder domain</span>
              <h1>{domain.name}</h1>
              <p>{domain.description}</p>
            </div>
          </div>
          <div className="eth-highlights">
            {domain.highlights.map(item => (
              <article key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
          <div className="eth-docs-actions" style={{ justifyContent: 'flex-start', marginTop: 28 }}>
            <Link className="eth-btn primary" to="/create">Get Started</Link>
            <Link className="eth-btn ghost" to="/api-docs">View API Reference</Link>
            <Link className="eth-btn ghost" to="/docs">TechDocs</Link>
          </div>
        </div>
      </section>
      <div className="eth-docs-wrap">
        <article className="eth-doc-card">
          <h2>What is {domain.name}?</h2>
          <p>{domain.overview}</p>
          <p style={{ marginTop: 12 }}>This page uses the developer hub copy because Backstage does not have a Domain kind yet.</p>
        </article>
        <article className="eth-doc-card" style={{ marginTop: 20 }}>
          <h3>Key features</h3>
          <ul className="eth-feature-list">
            {domain.features.map(feature => <li key={feature}>{feature}</li>)}
          </ul>
        </article>
      </div>
    </div>
  );
}

function SystemDetail({
  system,
  components,
}: {
  system: Entity;
  components: Entity[];
}) {
  return (
    <div className="eth-docs">
      <section className="eth-detail-hero">
        <div className="eth-detail-hero-inner">
          <Link to="/documentation">← Documentation</Link>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 18 }}>
            <div className="eth-doc-mark" style={{ width: 56, height: 56 }}>SYS</div>
            <div>
              <span className="eth-badge stable">{String(system.spec?.type ?? 'system')}</span>
              <h1>{system.metadata.title ?? system.metadata.name}</h1>
              <p>{system.metadata.description ?? 'No description published for this system.'}</p>
            </div>
          </div>
          <div className="eth-highlights">
            <article>
              <h3>Owner</h3>
              <p>{String(system.spec?.owner ?? 'Unassigned')}</p>
            </article>
            <article>
              <h3>Components</h3>
              <p>{components.length} registered in this system</p>
            </article>
            <article>
              <h3>Lifecycle</h3>
              <p>{String(system.spec?.lifecycle ?? 'Not set')}</p>
            </article>
          </div>
          <div className="eth-docs-actions" style={{ justifyContent: 'flex-start', marginTop: 28 }}>
            <Link className="eth-btn primary" to={entityHref(system)}>Open in catalog</Link>
            <Link className="eth-btn ghost" to="/api-docs">View API Reference</Link>
            <Link className="eth-btn ghost" to={techDocsHref(system)}>TechDocs</Link>
          </div>
        </div>
      </section>
      <div className="eth-docs-wrap">
        <article className="eth-doc-card">
          <h2>About this system</h2>
          <p>{system.metadata.description ?? 'This system is registered in the Backstage catalog and does not have a longer description yet.'}</p>
        </article>
        <h2 style={{ marginTop: 28 }}>Components</h2>
        {components.length === 0 ? (
          <p>No components declare this system.</p>
        ) : (
          <div className="eth-product-grid" style={{ marginTop: 16 }}>
            {components.map(component => (
              <article key={component.metadata.uid ?? component.metadata.name} className="eth-doc-card">
                <div className="eth-doc-top">
                  <div className="eth-doc-mark">{String(component.spec?.type ?? 'CMP').slice(0, 3).toUpperCase()}</div>
                  <span className="eth-badge stable">{String(component.spec?.lifecycle ?? 'component')}</span>
                </div>
                <h3>{component.metadata.title ?? component.metadata.name}</h3>
                <p>{component.metadata.description ?? 'No description published for this component.'}</p>
                <Link className="eth-doc-link" to={componentDocsHref(component)}>Open component →</Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function DocumentationPage() {
  const location = useLocation();
  const { entities, error, loading } = useCatalogEntities();
  const parts = location.pathname.split('/').filter(Boolean);

  const view = useMemo(() => {
    if (parts[1] === 'domain' && parts[2]) {
      return { kind: 'domain' as const, id: decodeURIComponent(parts[2]) };
    }
    if (parts[1] === 'component' && parts[2] && parts[3]) {
      return {
        kind: 'component' as const,
        namespace: decodeURIComponent(parts[2]),
        name: decodeURIComponent(parts[3]),
      };
    }
    if (parts[1] === 'system' && parts[2] && parts[3]) {
      return {
        kind: 'system' as const,
        namespace: decodeURIComponent(parts[2]),
        name: decodeURIComponent(parts[3]),
      };
    }
    return { kind: 'index' as const };
  }, [parts]);

  if (view.kind === 'domain') {
    const domain = findDomain(view.id);
    if (!domain) {
      return (
        <div className="eth-docs-wrap">
          <p>That domain placeholder was not found.</p>
          <Link to="/documentation">Back to documentation</Link>
        </div>
      );
    }
    return <DomainDetail domain={domain} />;
  }

  if (view.kind === 'component') {
    const component = entities.find(entity =>
      entity.kind.toLocaleLowerCase('en-US') === 'component' &&
      (entity.metadata.namespace ?? 'default') === view.namespace &&
      entity.metadata.name === view.name,
    );
    if (!component) {
      return (
        <div className="eth-docs-wrap">
          <p>{loading ? 'Loading component…' : error ?? 'That component is not in the catalog.'}</p>
          <Link to="/documentation">Back to documentation</Link>
        </div>
      );
    }
    const ownerSystem = entities.find(entity =>
      entity.kind.toLocaleLowerCase('en-US') === 'system' &&
      entity.metadata.name === systemOf(component) &&
      (entity.metadata.namespace ?? 'default') === (component.metadata.namespace ?? 'default'),
    );
    return (
      <ComponentDetail
        component={component}
        apis={apisForComponent(component, entities)}
        backHref={ownerSystem ? systemDocsHref(ownerSystem) : '/documentation'}
      />
    );
  }

  if (view.kind === 'system') {
    const system = entities.find(entity =>
      entity.kind.toLocaleLowerCase('en-US') === 'system' &&
      (entity.metadata.namespace ?? 'default') === view.namespace &&
      entity.metadata.name === view.name,
    );
    if (!system) {
      return (
        <div className="eth-docs-wrap">
          <p>{loading ? 'Loading system…' : error ?? 'That system is not in the catalog.'}</p>
          <Link to="/documentation">Back to documentation</Link>
        </div>
      );
    }
    const components = entities.filter(entity =>
      entity.kind.toLocaleLowerCase('en-US') === 'component' &&
      (entity.metadata.namespace ?? 'default') === (system.metadata.namespace ?? 'default') &&
      systemOf(entity) === system.metadata.name,
    );
    return <SystemDetail system={system} components={components} />;
  }

  return <DocsIndex entities={entities} error={error} loading={loading} />;
}
