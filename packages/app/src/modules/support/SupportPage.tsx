import { Link } from 'react-router-dom';
import './support.css';

const faqs = [
  {
    question: 'How do I get started with ETH Switch APIs?',
    answer:
      'Open the software catalog to see registered systems and APIs, then read the API reference. Templates are available when you are ready to scaffold a new integration.',
  },
  {
    question: 'Where do API contracts live?',
    answer:
      'API entities in the Backstage catalog are published on the API reference page. TechDocs holds longer-form documentation for services that publish it.',
  },
  {
    question: 'Are there any transaction limits?',
    answer:
      'Limits depend on your plan and verification level. This portal does not issue API keys or enforce transaction limits itself.',
  },
  {
    question: 'How secure are ETH Switch APIs?',
    answer:
      'The reference platform describes bank-level security with TLS, API key authentication, and PCI-DSS compliance. Access to this portal uses the configured Backstage authentication.',
  },
  {
    question: 'What programming languages do you support?',
    answer:
      'The public API reference describes REST APIs. Official SDK packages are not installed or served by this Backstage backend.',
  },
  {
    question: 'How do I handle webhook failures?',
    answer:
      'The product documentation describes automatic retries with exponential backoff. Implement idempotency in webhook handlers and return the expected HTTP status codes.',
  },
];

const resources = [
  {
    title: 'API Documentation',
    description: 'Contracts and schemas for API entities in the catalog.',
    href: '/api-docs',
    badge: 'Essential',
  },
  {
    title: 'Software catalog',
    description: 'Systems, components, and APIs registered with Backstage.',
    href: '/catalog',
    badge: 'Live',
  },
  {
    title: 'TechDocs',
    description: 'Service documentation published through TechDocs.',
    href: '/docs',
    badge: 'Docs',
  },
  {
    title: 'Search',
    description: 'Search the catalog and documentation from one page.',
    href: '/search',
    badge: 'Portal',
  },
];

export function SupportPage() {
  return (
    <main className="eth-support">
      <div className="eth-support-hero">
        <span className="eth-pill solid">24/7 Developer Support</span>
        <h1>How can we help you?</h1>
        <p>
          Find the catalog, API reference, and documentation that are already connected to this portal. There is no ticket or chat backend in this Backstage app.
        </p>
      </div>
      <div className="eth-support-grid">
        {resources.map(resource => (
          <article key={resource.href} className="eth-support-card">
            <span className="eth-kind">{resource.badge}</span>
            <h2>{resource.title}</h2>
            <p>{resource.description}</p>
            <p style={{ marginTop: 12 }}>
              <Link to={resource.href}>Open</Link>
            </p>
          </article>
        ))}
      </div>
      <h2>Frequently asked questions</h2>
      {faqs.map(faq => (
        <details key={faq.question} className="eth-faq">
          <summary>{faq.question}</summary>
          <p>{faq.answer}</p>
        </details>
      ))}
    </main>
  );
}
