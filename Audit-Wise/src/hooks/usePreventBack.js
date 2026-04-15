import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { tabSession } from "../utils/tabSession";

export const usePreventBack = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.history.pushState(null, "", window.location.pathname);

    const handlePopState = (event) => {
      if (tabSession.isActive()) {
        window.history.pushState(null, "", window.location.pathname);
      } else {
        navigate("/", { replace: true });
      }
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [navigate]);
};
