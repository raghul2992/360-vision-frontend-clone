import { useState } from "react";
import Sidebar from "../../component/sidebar";
import { bgcolors } from "../../theme";
import Navbar from "../../component/Navbar";
import { Outlet } from "react-router-dom";

const Dashboard = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return(
        <div className={`flex body-background h-screen`}>
            {/* Mobile backdrop overlay — visible only when sidebar is open on small screens */}
            {sidebarOpen && (
                <div
                    className={`fixed inset-0 z-40 ${bgcolors.backdropMid} md:hidden`}
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="flex-1 flex flex-col min-w-0">
                <Navbar onMenuClick={() => setSidebarOpen(true)} />
                <main className="flex-1 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}


export default Dashboard;