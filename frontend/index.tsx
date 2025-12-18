import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IotaClientProvider, WalletProvider as IotaDappWalletProvider } from '@iota/dapp-kit';
import { getFullnodeUrl } from '@iota/iota-sdk/client';
import { WalletProvider } from './hooks/useWallet';
import { ErrorBoundary } from './components/ErrorBoundary';
import App from './App';
import '@iota/dapp-kit/dist/index.css';

const queryClient = new QueryClient();

const networks = {
  testnet: { url: getFullnodeUrl('testnet') },
  mainnet: { url: getFullnodeUrl('mainnet') },
  devnet: { url: getFullnodeUrl('devnet') },
  localnet: { url: getFullnodeUrl('localnet') },
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <IotaClientProvider networks={networks} defaultNetwork="testnet">
          <IotaDappWalletProvider autoConnect>
            <WalletProvider>
              <App />
            </WalletProvider>
          </IotaDappWalletProvider>
        </IotaClientProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

