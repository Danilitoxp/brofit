import { Outlet } from "react-router-dom";
import Navigation from "./Navigation";
import Header from "./Header";

const Layout = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="relative pb-24 pt-4 safe-bottom">
        <Outlet />
      </main>
      <Navigation />
    </div>
  );
};

export default Layout;