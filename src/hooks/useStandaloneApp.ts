import { useEffect, useState } from "react";

export function useStandaloneApp() {
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    const check = () => {
      const mq = window.matchMedia("(display-mode: standalone)");
      const iosStandalone =
        "standalone" in window.navigator &&
        (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
      setStandalone(mq.matches || iosStandalone);
    };
    check();
    const mq = window.matchMedia("(display-mode: standalone)");
    mq.addEventListener("change", check);
    return () => mq.removeEventListener("change", check);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("standalone-app", standalone);
    return () => document.documentElement.classList.remove("standalone-app");
  }, [standalone]);

  return standalone;
}
