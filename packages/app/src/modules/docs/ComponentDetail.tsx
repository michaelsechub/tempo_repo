import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Entity } from '@backstage/catalog-model';
import {
  AsyncApiDefinitionWidget,
  GraphQlDefinitionWidget,
  OpenApiDefinitionWidget,
  PlainApiDefinitionWidget,
} from '@backstage/plugin-api-docs';

type TabId = 'overview' | 'integration' | 'process-flow' | 'specifications' | 'resources' | 'api-doc';

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'integration', label: 'Integration' },
  { id: 'process-flow', label: 'Process Flow' },
  { id: 'specifications', label: 'Specifications' },
  { id: 'resources', label: 'Resources' },
  { id: 'api-doc', label: 'API Doc' },
];

function definitionOf(api: Entity): string | undefined {
  const definition = api.spec && 'definition' in api.spec ? api.spec.definition : undefined;
  if (typeof definition === 'string') {
    return definition;
  }
  if (definition && typeof definition === 'object') {
    return JSON.stringify(definition, null, 2);
  }
  return undefined;
}

function useResolvedDefinition(definition?: string) {
  const [text, setText] = useState<string>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!definition) {
      setText(undefined);
      setError(undefined);
      return;
    }
    const trimmed = definition.trim();
    if (!/^https?:\/\//i.test(trimmed)) {
      setText(trimmed);
      setError(undefined);
      return;
    }
    let active = true;
    setText(undefined);
    setError(undefined);
    fetch(trimmed)
      .then(response => {
        if (!response.ok) {
          throw new Error('request failed');
        }
        return response.text();
      })
      .then(body => {
        if (active) {
          setText(body);
        }
      })
      .catch(() => {
        if (active) {
          setError('The OpenAPI document could not be loaded from its published URL.');
        }
      });
    return () => {
      active = false;
    };
  }, [definition]);

  return { text, error };
}

function ApiDocPanel({ api }: { api?: Entity }) {
  const definition = api ? definitionOf(api) : undefined;
  const { text, error } = useResolvedDefinition(definition);
  const type = String(api?.spec?.type ?? 'openapi').toLocaleLowerCase('en-US');

  if (!api) {
    return <p>This component does not provide an API in the catalog yet.</p>;
  }
  if (error) {
    return <p>{error}</p>;
  }
  if (!text) {
    return <p>Loading the API definition for {api.metadata.title ?? api.metadata.name}…</p>;
  }
  if (type === 'openapi' || type === 'swagger') {
    return (
      <div className="eth-swagger">
        <OpenApiDefinitionWidget definition={text} />
      </div>
    );
  }
  if (type === 'asyncapi') {
    return <AsyncApiDefinitionWidget definition={text} />;
  }
  if (type === 'graphql') {
    return <GraphQlDefinitionWidget definition={text} />;
  }
  return <PlainApiDefinitionWidget definition={text} language={type === 'grpc' ? 'protobuf' : 'yaml'} />;
}

export function ComponentDetail({
  component,
  apis,
  backHref,
}: {
  component: Entity;
  apis: Entity[];
  backHref: string;
}) {
  const [tab, setTab] = useState<TabId>('overview');
  const [apiName, setApiName] = useState(apis[0]?.metadata.name);
  const [language, setLanguage] = useState<'nodejs' | 'python' | 'curl'>('nodejs');
  const title = component.metadata.title ?? component.metadata.name;
  const description = component.metadata.description ?? 'Real-time payment processing with immediate settlement';
  const selectedApi = apis.find(api => api.metadata.name === apiName) ?? apis[0];

  return (
    <div className="eth-docs">
      <section className="eth-detail-hero">
        <div className="eth-detail-hero-inner">
          <Link to={backHref}>← Documentation</Link>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 18 }}>
            <div className="eth-doc-mark" style={{ width: 56, height: 56 }}>API</div>
            <div>
              <h1>{title}</h1>
              <p>{description}</p>
            </div>
          </div>
          <div className="eth-highlights">
            <article>
              <h3>Sub-2 Second Processing</h3>
              <p>Lightning-fast payment processing with immediate confirmation</p>
            </article>
            <article>
              <h3>Bank-Grade Security</h3>
              <p>Advanced encryption and fraud detection systems</p>
            </article>
            <article>
              <h3>15+ Banks Supported</h3>
              <p>Comprehensive coverage across Ethiopian financial institutions</p>
            </article>
          </div>
          <div className="eth-docs-actions" style={{ justifyContent: 'flex-start', marginTop: 28 }}>
            <Link className="eth-btn primary" to="/create">Get Started</Link>
            <button className="eth-btn ghost" type="button" onClick={() => setTab('api-doc')}>View API Reference</button>
          </div>
        </div>
      </section>

      <div className="eth-docs-wrap">
        <div className="eth-page-tabs" role="tablist">
          {TABS.map(item => (
            <button key={item.id} type="button" role="tab" aria-selected={tab === item.id} onClick={() => setTab(item.id)}>
              {item.label}
            </button>
          ))}
        </div>

        {tab === 'overview' ? (
          <div className="eth-stack">
            <article className="eth-doc-card">
              <h2>What is {title}?</h2>
              <p>{description}</p>
              <p style={{ marginTop: 12 }}>
                Built on modern payment infrastructure, it provides 24/7 availability with instant settlement and immediate confirmation while staying aligned with National Bank of Ethiopia requirements.
              </p>
            </article>
            <div className="eth-split">
              <article className="eth-doc-card">
                <h3>Core Features</h3>
                <ul className="eth-check-list">
                  <li><strong>Real-time Processing</strong><span>Instant payment processing with immediate settlement</span></li>
                  <li><strong>Multi-bank Support</strong><span>Seamless integration with all major Ethiopian banks</span></li>
                  <li><strong>24/7 Availability</strong><span>Round-the-clock service with 99.9% uptime</span></li>
                  <li><strong>Advanced Security</strong><span>Fraud detection and prevention on every request</span></li>
                </ul>
              </article>
              <article className="eth-doc-card">
                <h3>Technical Capabilities</h3>
                <ul className="eth-check-list">
                  <li><strong>RESTful API</strong><span>Simple and intuitive API integration</span></li>
                  <li><strong>Webhooks & Events</strong><span>Real-time event notifications and callbacks</span></li>
                  <li><strong>Multiple SDKs</strong><span>Support for major programming languages</span></li>
                  <li><strong>Sandbox Testing</strong><span>A catalog-backed contract you can review before going live</span></li>
                </ul>
              </article>
            </div>
            <article className="eth-doc-card">
              <h3>Popular Use Cases</h3>
              <p>See how businesses use this API across different industries</p>
              <div className="eth-usecases">
                <div><h4>Mobile Apps</h4><p>In-app payments and wallet top-ups</p></div>
                <div><h4>E-commerce</h4><p>Instant checkout experiences</p></div>
                <div><h4>Business Payments</h4><p>B2B transfers and supplier payments</p></div>
                <div><h4>P2P Transfers</h4><p>Person-to-person money transfers</p></div>
              </div>
            </article>
            <div className="eth-stats">
              <article><strong>&lt;2s</strong><span>Average processing time</span></article>
              <article><strong>99.9%</strong><span>Success rate</span></article>
              <article><strong>24/7</strong><span>Service availability</span></article>
              <article><strong>15+</strong><span>Supported banks</span></article>
            </div>
          </div>
        ) : null}

        {tab === 'integration' ? (
          <div className="eth-stack">
            <article className="eth-doc-card">
              <h2>Integration Roadmap</h2>
              <p>Follow this step-by-step guide to integrate {title} into your application</p>
              <ol className="eth-steps">
                <li>
                  <h3>Account Setup & API Keys</h3>
                  <p>Create your developer account and obtain API credentials</p>
                  <Link className="eth-btn primary eth-btn-sm" to="/create">Get API Keys</Link>
                </li>
                <li>
                  <h3>Install SDK</h3>
                  <p>Choose your preferred programming language and install the client</p>
                  <code className="eth-code">npm install @ethswitch/instant-payments</code>
                  <div className="eth-lang-row">
                    <span>Node.js</span><span>Python</span><span>PHP</span><span>Java</span>
                  </div>
                </li>
                <li>
                  <h3>Authentication Setup</h3>
                  <p>Configure API authentication and security headers</p>
                  <code className="eth-code">Authorization: Bearer YOUR_API_KEY</code>
                </li>
                <li>
                  <h3>Review the contract</h3>
                  <p>Open the API Doc tab and walk through the published Swagger definition</p>
                  <button className="eth-btn outline eth-btn-sm" type="button" onClick={() => setTab('api-doc')}>Open API Doc</button>
                </li>
                <li>
                  <h3>Go Live</h3>
                  <p>Switch to the production environment and start processing real payments</p>
                </li>
              </ol>
            </article>
            <article className="eth-doc-card">
              <h3>Quick Start Example</h3>
              <p>Send your first payment with a few lines of code</p>
              <pre className="eth-code-dark">{`const client = new InstantPayments({
  apiKey: 'your_api_key',
  environment: 'sandbox'
});

const payment = await client.sendPayment({
  amount: 1000.00,
  currency: 'ETB',
  recipientAccount: '1234567890',
  recipientBank: 'CBE',
  description: 'Payment for services'
});`}</pre>
            </article>
          </div>
        ) : null}

        {tab === 'process-flow' ? (
          <div className="eth-stack">
            <article className="eth-doc-card">
              <h2>Payment Process Flow</h2>
              <p>How a payment moves from initiation to settlement</p>
              <ol className="eth-flow">
                <li><h3>Payment Initiation</h3><p>Client sends a payment request with recipient details and amount</p></li>
                <li><h3>Validation & Authentication</h3><p>The service checks account details, balance, and security rules</p></li>
                <li><h3>Inter-bank Processing</h3><p>The payment is routed through the secure inter-bank network</p></li>
                <li><h3>Instant Settlement</h3><p>Settlement completes and both parties receive confirmation</p></li>
              </ol>
            </article>
            <article className="eth-doc-card">
              <h3>Error Handling & Status Codes</h3>
              <table className="eth-table">
                <thead>
                  <tr><th>Status</th><th>Description</th><th>Action</th></tr>
                </thead>
                <tbody>
                  <tr><td>200</td><td>Payment successful</td><td>No action needed</td></tr>
                  <tr><td>202</td><td>Payment pending</td><td>Monitor status via webhook</td></tr>
                  <tr><td>400</td><td>Invalid request</td><td>Check request parameters</td></tr>
                  <tr><td>401</td><td>Unauthorized</td><td>Verify API credentials</td></tr>
                  <tr><td>403</td><td>Insufficient funds</td><td>Request funding from the sender</td></tr>
                </tbody>
              </table>
            </article>
          </div>
        ) : null}

        {tab === 'specifications' ? (
          <div className="eth-stack">
            <article className="eth-doc-card">
              <h2>API Endpoints</h2>
              <p>Summary of the main operations. The live contract is in the API Doc tab.</p>
              <div className="eth-endpoint">
                <span className="eth-method post">POST</span>
                <code>/api/v1/payments/instant</code>
                <p>Initiate an instant payment transaction</p>
                <button className="eth-btn outline eth-btn-sm" type="button" onClick={() => setTab('api-doc')}>View in API Doc</button>
              </div>
              <div className="eth-endpoint">
                <span className="eth-method get">GET</span>
                <code>/api/v1/payments/{'{id}'}</code>
                <p>Retrieve payment status and details</p>
                <button className="eth-btn outline eth-btn-sm" type="button" onClick={() => setTab('api-doc')}>View in API Doc</button>
              </div>
              <div className="eth-endpoint">
                <span className="eth-method get">GET</span>
                <code>/api/v1/banks</code>
                <p>List supported banks and their codes</p>
                <button className="eth-btn outline eth-btn-sm" type="button" onClick={() => setTab('api-doc')}>View in API Doc</button>
              </div>
            </article>
            <div className="eth-split">
              <article className="eth-doc-card">
                <h3>Request Schema</h3>
                <pre className="eth-code-block">{`{
  "amount": 1000.00,
  "currency": "ETB",
  "recipientAccount": "1234567890",
  "recipientBank": "CBE",
  "recipientName": "John Doe",
  "description": "Payment description",
  "reference": "REF123456"
}`}</pre>
              </article>
              <article className="eth-doc-card">
                <h3>Response Schema</h3>
                <pre className="eth-code-block">{`{
  "id": "pay_1234567890",
  "status": "completed",
  "amount": 1000.00,
  "currency": "ETB",
  "reference": "REF123456",
  "completedAt": "2024-01-15T10:30:02Z"
}`}</pre>
              </article>
            </div>
          </div>
        ) : null}

        {tab === 'resources' ? (
          <div className="eth-stack">
            <div className="eth-split">
              <article className="eth-doc-card">
                <h3>Developer Tools</h3>
                <ul className="eth-check-list">
                  <li><strong>API Doc</strong><span>Swagger UI for the published OpenAPI definition</span></li>
                  <li><strong>Catalog</strong><span>Owner, lifecycle, and related entities</span></li>
                  <li><strong>Templates</strong><span>Scaffold an integration from the software templates</span></li>
                </ul>
                <div className="eth-docs-actions" style={{ justifyContent: 'flex-start' }}>
                  <button className="eth-btn outline eth-btn-sm" type="button" onClick={() => setTab('api-doc')}>Open API Doc</button>
                  <Link className="eth-btn outline eth-btn-sm" to="/create">Open templates</Link>
                </div>
              </article>
              <article className="eth-doc-card">
                <h3>Documentation & Support</h3>
                <ul className="eth-check-list">
                  <li><strong>TechDocs</strong><span>Longer guides published for this component</span></li>
                  <li><strong>Developer Support</strong><span>Questions and contact paths on the support page</span></li>
                  <li><strong>API Reference</strong><span>The Backstage API explorer for every published contract</span></li>
                </ul>
                <div className="eth-docs-actions" style={{ justifyContent: 'flex-start' }}>
                  <Link className="eth-btn outline eth-btn-sm" to={`/docs/${encodeURIComponent(component.metadata.namespace ?? 'default')}/component/${encodeURIComponent(component.metadata.name)}`}>TechDocs</Link>
                  <Link className="eth-btn outline eth-btn-sm" to="/support">Support</Link>
                </div>
              </article>
            </div>
            <article className="eth-doc-card">
              <h3>Code Examples</h3>
              <div className="eth-tabs">
                <button type="button" aria-pressed={language === 'nodejs'} onClick={() => setLanguage('nodejs')}>Node.js</button>
                <button type="button" aria-pressed={language === 'python'} onClick={() => setLanguage('python')}>Python</button>
                <button type="button" aria-pressed={language === 'curl'} onClick={() => setLanguage('curl')}>cURL</button>
              </div>
              {language === 'nodejs' ? (
                <pre className="eth-code-dark">{`const payment = await client.sendPayment({
  amount: 500.00,
  currency: 'ETB',
  recipientAccount: '9876543210',
  recipientBank: 'AWINETB'
});`}</pre>
              ) : null}
              {language === 'python' ? (
                <pre className="eth-code-dark">{`payment = client.send_payment(
    amount=500.00,
    currency='ETB',
    recipient_account='9876543210',
    recipient_bank='AWINETB'
)`}</pre>
              ) : null}
              {language === 'curl' ? (
                <pre className="eth-code-dark">{`curl -X POST https://api.example.com/api/v1/payments/instant \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"amount":500,"currency":"ETB"}'`}</pre>
              ) : null}
            </article>
          </div>
        ) : null}

        {tab === 'api-doc' ? (
          <article className="eth-doc-card eth-api-doc">
            <h2>API Doc</h2>
            <p>Swagger UI for the API this component provides.</p>
            {apis.length > 1 ? (
              <label className="eth-api-picker">
                API
                <select value={selectedApi?.metadata.name ?? ''} onChange={event => setApiName(event.target.value)}>
                  {apis.map(api => (
                    <option key={api.metadata.name} value={api.metadata.name}>
                      {api.metadata.title ?? api.metadata.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <ApiDocPanel api={selectedApi} />
          </article>
        ) : null}
      </div>
    </div>
  );
}
