import Sidebar from "../../component/sidebar";
import { bgcolors } from "../../theme";
import Navbar from "../../component/Navbar";
import { Outlet } from "react-router-dom";

const Dashboard = () => {
    return(
        <div className={`flex body-background h-screen`}>
            <Sidebar/>
            <div className="flex-1 flex flex-col">
                <Navbar />
                <main className="flex-1 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}


export default Dashboard;