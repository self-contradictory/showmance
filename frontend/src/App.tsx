import "./index.css";
import { MotionConfig } from "motion/react";
import { Redirect, Route, Switch } from "wouter";
import { findShow } from "./show/mockShows";
import { StreamPage } from "./stream/StreamPage";

export function App() {
  return (
    <MotionConfig reducedMotion="user">
      <Switch>
        <Route path="/">
          <Redirect to="/the-villa" replace />
        </Route>
        <Route path="/:slug">
          {({ slug }) => (findShow(slug) ? <StreamPage key={slug} slug={slug} /> : <Redirect to="/" replace />)}
        </Route>
        <Route>
          <Redirect to="/" replace />
        </Route>
      </Switch>
    </MotionConfig>
  );
}

export default App;
