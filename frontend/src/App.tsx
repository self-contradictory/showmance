import "./index.css";
import { MotionConfig } from "motion/react";
import { StreamPage } from "./stream/StreamPage";

export function App() {
  return (
    <MotionConfig reducedMotion="user">
      <StreamPage />
    </MotionConfig>
  );
}

export default App;
