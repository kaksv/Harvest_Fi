import React, { Component, type ReactNode } from "react";
import ReactDOM from "react-dom/client";
import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider } from "@privy-io/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { baseSepolia } from "viem/chains";
import { wagmiConfig } from "./lib/wagmi";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient();

const privyAppId = import.meta.env.VITE_PRIVY_APP_ID as string | undefined;
if (!privyAppId) throw new Error("VITE_PRIVY_APP_ID is not set. Add it to your Vercel environment variables.");

// Catch any render-time crash so we see an error instead of a blank page
class ErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: null };
  static getDerivedStateFromError(e: Error) { return { error: e.message }; }
  render() {
    if (this.state.error)
      return <div style={{ padding: 32, fontFamily: "monospace", color: "red" }}>{this.state.error}</div>;
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <PrivyProvider
        appId={privyAppId}
        config={{
          defaultChain: baseSepolia,
          supportedChains: [baseSepolia],
          appearance: {
            theme: "light",
            accentColor: "#2D6A4F",
          },
          loginMethods: ["email", "wallet", "google"],
          embeddedWallets: {
            createOnLogin: "users-without-wallets",
          },
        }}
      >
        <QueryClientProvider client={queryClient}>
          <WagmiProvider config={wagmiConfig}>
            <App />
          </WagmiProvider>
        </QueryClientProvider>
      </PrivyProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
