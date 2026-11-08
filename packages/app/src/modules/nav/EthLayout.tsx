import {
  coreExtensionData,
  createExtension,
  createExtensionInput,
} from '@backstage/frontend-plugin-api';
import { Link } from 'react-router-dom';
import './eth-shell.css';

export const EthLayout = createExtension({
  name: 'layout',
  attachTo: { id: 'app/root', input: 'children' },
  inputs: {
    nav: createExtensionInput([coreExtensionData.reactElement], {
      singleton: true,
    }),
    content: createExtensionInput([coreExtensionData.reactElement], {
      singleton: true,
    }),
  },
  output: [coreExtensionData.reactElement],
  factory: ({ inputs }) => [
    coreExtensionData.reactElement(
      <div className="eth-shell">
        {inputs.nav.get(coreExtensionData.reactElement)}
        <div className="eth-shell-main">
          {inputs.content.get(coreExtensionData.reactElement)}
        </div>
        <footer className="eth-footer">
          <div className="eth-footer-inner">
            <div>
              <h2>ETH Switch</h2>
              <p>
                Building the future of Ethiopian financial infrastructure through
                secure, scalable APIs.
              </p>
            </div>
            <div>
              <h3>Product</h3>
              <ul>
                <li><Link to="/catalog">Software catalog</Link></li>
                <li><Link to="/documentation">Documentation</Link></li>
                <li><Link to="/api-docs">API reference</Link></li>
                <li><Link to="/create">Templates</Link></li>
                <li><Link to="/docs">TechDocs</Link></li>
              </ul>
            </div>
            <div>
              <h3>Resources</h3>
              <ul>
                <li><Link to="/">Home</Link></li>
                <li><Link to="/support">Support</Link></li>
                <li><Link to="/search">Search</Link></li>
              </ul>
            </div>
            <div>
              <h3>Account</h3>
              <ul>
                <li><Link to="/settings">Settings</Link></li>
                <li><Link to="/create">Get API Keys</Link></li>
              </ul>
            </div>
          </div>
          <div className="eth-footer-base">
            <span>© {new Date().getFullYear()} ETH Switch. All rights reserved.</span>
            <span>Built for Ethiopian developers</span>
          </div>
        </footer>
      </div>,
    ),
  ],
});
