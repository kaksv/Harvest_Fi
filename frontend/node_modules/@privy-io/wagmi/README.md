# @privy-io/wagmi

`wagmi` bindings for the `@privy-io/react-auth` library.

## Installation

```sh
npm install -S @privy-io/wagmi
```

## Setup

### Configuration

```ts
import {http} from 'wagmi';
import {mainnet} from 'wagmi/chains';

import {createConfig} from '@privy-io/wagmi';

export const config = createConfig({
  chains: [mainnet],
  transports: {
    [mainnet.id]: http(),
  },
});

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}
```

### Providers

```tsx
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {type ReactNode} from 'react';

import {PrivyProvider} from '@privy-io/react-auth';
import {WagmiProvider} from '@privy-io/wagmi';

import config from './config';

const queryClient = new QueryClient();

export const Providers = ({children}: {children: ReactNode}) => (
  <PrivyProvider appId="<your-app-id">
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>{children}</WagmiProvider>
    </QueryClientProvider>
  </PrivyProvider>
);
```

## Usage

Use `wagmi` as you normally would!

## Changelog

Our [changelog](https://docs.privy.io/reference/sdk/wagmi/changelog) contains the latest information about new releases, including features, fixes, and upcoming changes.

We use [Semantic Versioning](https://semver.org/) to track changes.
