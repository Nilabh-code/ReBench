import Hero from "../components/landing/Hero";
import TickerStrip from "../components/landing/TickerStrip";
import Problem from "../components/landing/Problem";
import RunSheet from "../components/landing/RunSheet";
import ProcessFlow from "../components/landing/ProcessFlow";
import GithubSection from "../components/landing/GithubSection";
import LiveTable from "../components/landing/LiveTable";
import Reproducibility from "../components/landing/Reproducibility";
import Community from "../components/landing/Community";
import MethodologyTeaser from "../components/landing/MethodologyTeaser";
import FinalCall from "../components/landing/FinalCall";

export default function Home() {
  return (
    <>
      <Hero />
      <TickerStrip />
      <Problem />
      <RunSheet />
      <ProcessFlow />
      <GithubSection />
      <LiveTable />
      <Reproducibility />
      <Community />
      <MethodologyTeaser />
      <FinalCall />
    </>
  );
}
