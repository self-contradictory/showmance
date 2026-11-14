import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "motion/react";
import { Redirect, Route, Switch } from "wouter";
import { queryClient } from "./api/queryClient";
import { HomePage } from "./home/HomePage";
import { isKnownShow } from "./show/useShow";
import { StreamPage } from "./stream/StreamPage";
import { WalletProvider } from "./wallet/Wallet";

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user">
        <WalletProvider>
          <Switch>
            <Route path="/" component={HomePage} />
            <Route path="/:slug">
              {({ slug }) => (isKnownShow(slug) ? <StreamPage key={slug} slug={slug} /> : <Redirect to="/" replace />)}
            </Route>
            <Route>
              <Redirect to="/" replace />
            </Route>
          </Switch>
        </WalletProvider>
      </MotionConfig>
    </QueryClientProvider>
  );
}

export default App;
