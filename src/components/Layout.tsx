import { Outlet } from "react-router-dom";
import Header from "./Header";

const Layout = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="relative pt-4">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;