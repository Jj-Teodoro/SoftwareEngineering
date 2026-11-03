import PageBackground from "./PageBackground.jsx";

// Shown for a moment while a saved sign-in is restored, so a reload doesn't flash the login page.
export default function LoadingScreen() {
  return (
    <PageBackground>
      <div className="flex min-h-screen items-center justify-center">
        <p className="label text-gold">Loading...</p>
      </div>
    </PageBackground>
  );
}
