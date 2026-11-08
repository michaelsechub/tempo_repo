export type DomainApi = {
  name: string;
  endpoint: string;
  description: string;
  status: 'stable' | 'beta' | 'alpha';
};

export type DomainPlaceholder = {
  id: string;
  name: string;
  description: string;
  mark: string;
  tone: string;
  status: 'stable' | 'beta' | 'alpha';
  overview: string;
  features: string[];
  highlights: { title: string; text: string }[];
  apis: DomainApi[];
};

/** Domain cards copied from the ETH Switch developer hub. Backstage has no Domain kind yet. */
export const domainPlaceholders: DomainPlaceholder[] = [
  {
    id: 'instant-payments',
    name: 'Instant Payments',
    description: 'Real-time payment processing and transfers with immediate settlement',
    mark: '⚡',
    tone: 'linear-gradient(90deg, #3b82f6, #06b6d4)',
    status: 'stable',
    overview:
      'Process real-time payments with immediate settlement across all supported banks and financial institutions in Ethiopia. Our instant payment system ensures your transactions are completed within seconds.',
    features: [
      'Real-time processing under 3 seconds',
      'Immediate settlement guarantee',
      '24/7 availability with 99.9% uptime',
      'Multi-bank support across Ethiopia',
      'End-to-end transaction tracking',
      'Advanced fraud detection',
    ],
    highlights: [
      { title: 'Sub-2 Second Processing', text: 'Lightning-fast payment processing with immediate confirmation' },
      { title: 'Bank-Grade Security', text: 'Advanced encryption and fraud detection systems' },
      { title: '15+ Banks Supported', text: 'Coverage across Ethiopian financial institutions' },
    ],
    apis: [
      { name: 'Create Payment', endpoint: 'POST /v1/payments/instant', description: 'Initiate an instant payment transaction', status: 'stable' },
      { name: 'Payment Status', endpoint: 'GET /v1/payments/{id}/status', description: 'Check real-time payment status', status: 'stable' },
      { name: 'Cancel Payment', endpoint: 'POST /v1/payments/{id}/cancel', description: 'Cancel a pending payment request', status: 'stable' },
      { name: 'Payment History', endpoint: 'GET /v1/payments/history', description: 'Retrieve payment history', status: 'stable' },
    ],
  },
  {
    id: 'bank-transfers',
    name: 'Bank Transfers',
    description: 'Secure inter-bank transfer operations with SWIFT integration',
    mark: '💳',
    tone: 'linear-gradient(90deg, #10b981, #14b8a6)',
    status: 'stable',
    overview:
      'Facilitate secure inter-bank transfers with support for all major Ethiopian banks and international transfer protocols.',
    features: [
      'Inter-bank transfers nationwide',
      'SWIFT integration for international transfers',
      'Batch processing capabilities',
      'Configurable transaction limits',
      'Real-time compliance checks',
      'Multi-currency support',
    ],
    highlights: [
      { title: 'Nationwide Transfers', text: 'Move funds between major Ethiopian banks' },
      { title: 'SWIFT Ready', text: 'International transfer protocol support' },
      { title: 'Batch Processing', text: 'Submit many transfers in one request' },
    ],
    apis: [
      { name: 'Create Transfer', endpoint: 'POST /v1/transfers/bank', description: 'Initiate a secure bank transfer', status: 'stable' },
      { name: 'Transfer Status', endpoint: 'GET /v1/transfers/{id}', description: 'Get transfer information', status: 'stable' },
      { name: 'Batch Transfer', endpoint: 'POST /v1/transfers/batch', description: 'Process multiple transfers', status: 'stable' },
      { name: 'Bank Directory', endpoint: 'GET /v1/banks', description: 'List supported banks', status: 'stable' },
    ],
  },
  {
    id: 'mobile-wallets',
    name: 'Mobile Wallets',
    description: 'Comprehensive mobile wallet integrations and transfers',
    mark: '📱',
    tone: 'linear-gradient(90deg, #a855f7, #ec4899)',
    status: 'beta',
    overview:
      'Connect with popular mobile wallet providers in Ethiopia including Telebirr, M-Birr, and HelloCash.',
    features: [
      'Multi-wallet provider support',
      'USSD integration capabilities',
      'Push notification system',
      'Offline transaction processing',
      'Real-time balance inquiries',
      'Mobile-optimized interfaces',
    ],
    highlights: [
      { title: 'Wallet Providers', text: 'Telebirr, M-Birr, and HelloCash' },
      { title: 'USSD Support', text: 'Reach customers without a smartphone app' },
      { title: 'Live Balances', text: 'Check wallet balances in real time' },
    ],
    apis: [
      { name: 'Wallet Payment', endpoint: 'POST /v1/wallets/payment', description: 'Process a mobile wallet payment', status: 'beta' },
      { name: 'Wallet Balance', endpoint: 'GET /v1/wallets/balance', description: 'Check a wallet balance', status: 'beta' },
      { name: 'Wallet Transfer', endpoint: 'POST /v1/wallets/transfer', description: 'Transfer funds between wallets', status: 'beta' },
      { name: 'Wallet Providers', endpoint: 'GET /v1/wallets/providers', description: 'List wallet providers', status: 'stable' },
    ],
  },
  {
    id: 'qr-payments',
    name: 'QR Code Payments',
    description: 'EMVCo compliant QR-based payment solutions',
    mark: '▦',
    tone: 'linear-gradient(90deg, #f97316, #ef4444)',
    status: 'stable',
    overview:
      'Enable QR code payments for merchants and customers with EMVCo compliant QR standards and dynamic code generation.',
    features: [
      'EMVCo compliance certification',
      'Dynamic QR code generation',
      'Merchant dashboard integration',
      'Customer mobile app support',
      'Automatic receipt generation',
      'Analytics and reporting',
    ],
    highlights: [
      { title: 'EMVCo QR', text: 'Standards-compliant payment codes' },
      { title: 'Dynamic Codes', text: 'Generate a code per checkout' },
      { title: 'Merchant QR', text: 'Persistent codes for a till or store' },
    ],
    apis: [
      { name: 'Generate QR', endpoint: 'POST /v1/qr/generate', description: 'Generate a payment QR code', status: 'stable' },
      { name: 'Process QR Payment', endpoint: 'POST /v1/qr/payment', description: 'Process a QR code payment', status: 'stable' },
      { name: 'QR Status', endpoint: 'GET /v1/qr/{id}/status', description: 'Check QR payment status', status: 'stable' },
      { name: 'Merchant QR', endpoint: 'POST /v1/qr/merchant', description: 'Create a persistent merchant QR', status: 'stable' },
    ],
  },
  {
    id: 'request-to-pay',
    name: 'Request to Pay',
    description: 'Smart payment request and collection system',
    mark: '↗',
    tone: 'linear-gradient(90deg, #6366f1, #3b82f6)',
    status: 'stable',
    overview:
      'Send payment requests to customers and track collection status with automated notifications and customizable templates.',
    features: [
      'Smart payment request system',
      'Real-time collection tracking',
      'Automated reminder scheduling',
      'Multi-channel delivery (SMS, Email, Push)',
      'Customizable payment templates',
      'Analytics and conversion tracking',
    ],
    highlights: [
      { title: 'Payment Requests', text: 'Ask a customer to pay, then track it' },
      { title: 'Reminders', text: 'Schedule follow-ups automatically' },
      { title: 'Many Channels', text: 'SMS, email, and push delivery' },
    ],
    apis: [
      { name: 'Create Request', endpoint: 'POST /v1/requests/payment', description: 'Send a payment request', status: 'stable' },
      { name: 'Request Status', endpoint: 'GET /v1/requests/{id}', description: 'Check request status', status: 'stable' },
      { name: 'Cancel Request', endpoint: 'DELETE /v1/requests/{id}', description: 'Cancel a pending request', status: 'stable' },
      { name: 'Request History', endpoint: 'GET /v1/requests/history', description: 'List request history', status: 'stable' },
    ],
  },
  {
    id: 'webhooks',
    name: 'Webhooks & Events',
    description: 'Real-time event notifications and integrations',
    mark: '◎',
    tone: 'linear-gradient(90deg, #4b5563, #1f2937)',
    status: 'stable',
    overview:
      'Receive notifications about payment events, transaction updates, and status changes with retries and event filtering.',
    features: [
      'Real-time event notifications',
      'Advanced event filtering',
      'Automatic retry mechanisms',
      'Cryptographic signature verification',
      'Comprehensive event history',
      'Custom endpoint configuration',
    ],
    highlights: [
      { title: 'Event Delivery', text: 'Payment and transfer notifications' },
      { title: 'Signed Payloads', text: 'Verify webhook signatures' },
      { title: 'Retries', text: 'Automatic retry when a receiver is down' },
    ],
    apis: [
      { name: 'Create Webhook', endpoint: 'POST /v1/webhooks', description: 'Register a webhook endpoint', status: 'stable' },
      { name: 'List Webhooks', endpoint: 'GET /v1/webhooks', description: 'List webhook configurations', status: 'stable' },
      { name: 'Update Webhook', endpoint: 'PUT /v1/webhooks/{id}', description: 'Update webhook settings', status: 'stable' },
      { name: 'Test Webhook', endpoint: 'POST /v1/webhooks/{id}/test', description: 'Send a test event', status: 'stable' },
    ],
  },
];

export function findDomain(id: string): DomainPlaceholder | undefined {
  return domainPlaceholders.find(domain => domain.id === id);
}

const domainMatchers: { id: string; words: string[] }[] = [
  { id: 'request-to-pay', words: ['request-to-pay', 'request to pay', 'requesttopay'] },
  { id: 'instant-payments', words: ['instant', 'checkout', 'commerce', 'payment'] },
  { id: 'bank-transfers', words: ['bank', 'transfer', 'swift', 'core-banking', 'core banking'] },
  { id: 'mobile-wallets', words: ['wallet', 'mobile'] },
  { id: 'qr-payments', words: ['qr'] },
  { id: 'webhooks', words: ['webhook', 'event', 'notification'] },
];

import { Entity } from '@backstage/catalog-model';

export function domainIdForSystem(system: Entity): string | undefined {
  const annotation = system.metadata.annotations?.['ethswitch.io/domain'];
  if (annotation && findDomain(annotation)) {
    return annotation;
  }
  const domainField = system.spec && 'domain' in system.spec && typeof system.spec.domain === 'string' ? system.spec.domain : undefined;
  if (domainField) {
    const byId = findDomain(domainField);
    const byName = domainPlaceholders.find(domain => domain.name.toLocaleLowerCase('en-US') === domainField.toLocaleLowerCase('en-US'));
    if (byId) {
      return byId.id;
    }
    if (byName) {
      return byName.id;
    }
  }
  const tag = system.metadata.tags?.find(item => findDomain(item));
  if (tag) {
    return tag;
  }
  const text = `${system.metadata.name} ${system.metadata.title ?? ''} ${system.metadata.description ?? ''}`.toLocaleLowerCase('en-US');
  return domainMatchers.find(matcher => matcher.words.some(word => text.includes(word)))?.id;
}
