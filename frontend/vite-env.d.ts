/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PACKAGE_ID: string;
  readonly VITE_GAME_BANK_ID: string;
  readonly VITE_RANDOM_OBJECT_ID: string;
  readonly VITE_NETWORK: 'mainnet' | 'testnet' | 'devnet' | 'localnet';
  readonly VITE_RPC_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
