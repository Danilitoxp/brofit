import { Outlet } from "react-router-dom";
import Navigation from "./Navigation";

const Layout = () => {
  return (
    <div className="min-h-screen bg-background">
      <main className="relative pb-20 safe-bottom">
        <Outlet />
      </main>
      <Navigation />
    </div>
  );
};

export default Layout;