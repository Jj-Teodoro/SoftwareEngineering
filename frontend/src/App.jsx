import { useEffect } from "react";
import AdminApp from "./admin/App";
import ScannerApp from "./scanner/App";
import UserApp from "./user/App";
import { currentPortal } from "@oasis/shared/api/portal.js";

// One app, three portals picked by the first part of the URL:
//   /admin    staff console
//   /scanner  event check-in for scanner staff
//   /         student site
const PORTALS = {
  admin: { App: AdminApp, title: "OASIS Admin" },
  scanner: { App: ScannerApp, title: "OASIS Scanner" },
  user: { App: UserApp, title: "OASIS" },
};

export default function App() {
  const { App: Portal, title } = PORTALS[currentPortal()];

  useEffect(() => {
    document.title = title;
  }, [title]);

  return <Portal />;
}
