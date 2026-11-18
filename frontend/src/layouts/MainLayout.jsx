import Sidebar from "../components/Sidebar/Sidebar";
import Header from "../components/Header/Header";
import { Outlet } from "react-router-dom";
import "./MainLayout.css";

function MainLayout() {
  return (
    <div className="app-layout">
      <Sidebar />

      <div className="app-main">
        <Header />

        <main className="app-page">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default MainLayout;