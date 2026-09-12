import { useState } from "react";
import PageBackground from "../components/PageBackground";
import Sidebar from "../components/Sidebar";
import UserPage from "../User/UserPage";

function ComingSoon({ label }) {
  return (
    <div className="flex h-full min-h-[300px] w-full items-center justify-center rounded-[24px] border border-white/20 bg-white/10 text-lg font-semibold uppercase tracking-[2px] text-white/70 backdrop-blur-md">
      {label} — coming soon
    </div>
  );
}

export default function DashboardShell() {
  const [activeTab, setActiveTab] = useState("User");

  return (
    <PageBackground>
      <div className="flex min-h-screen flex-col gap-8 px-6 py-10 lg:flex-row lg:px-12">
        <Sidebar active={activeTab} onNavigate={setActiveTab} />

        <main className="flex-1">
          {activeTab === "User" && <UserPage />}
          {activeTab === "Dashboard" && <ComingSoon label="Dashboard" />}
          {activeTab === "Events" && <ComingSoon label="Events" />}
          {activeTab === "Import" && <ComingSoon label="Import" />}
        </main>
      </div>
    </PageBackground>
  );
}
