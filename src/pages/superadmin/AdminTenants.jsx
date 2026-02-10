import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next"; // Add this
import {
  fetchTenants,
  updateTenantStatus,
} from "../../features/admin/adminSlice";
import { toast } from "react-toastify";
import StatusToggle from "../../component/StatusToggle.jsx";
import {
  IoSearchOutline,
  IoBusinessOutline,
  IoChevronForwardOutline,
} from "react-icons/io5";
import { bgcolors } from "../../theme.js";

const AdminTenants = () => {
  const { t } = useTranslation(); // Add this
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { tenants, tenantsLoading, updateLoading, error } = useSelector(
    (state) => state.admin,
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
   localStorage.removeItem("tenant_id");
   localStorage.removeItem("tenant_name");
   
    dispatch(fetchTenants({ skip: 0, limit: 100 }));
  }, [dispatch, navigate]);

  useEffect(() => {
    if (error) {
      console.log(error);
    }
  }, [error]);

  const handleTenantClick = (tenant) => {
  localStorage.setItem("tenant_id", tenant.id);
  localStorage.setItem("tenant_name", tenant.name);
  navigate("/dashboard");
};

  const handleStatusChange = async (tenantId, newStatus, event) => {
    event.stopPropagation();

    try {
      await dispatch(
        updateTenantStatus({
          tenant_id: tenantId,
          status: newStatus,
        }),
      ).unwrap();
      console.log(`${t("admin.statusUpdated")} ${newStatus}`);
    } catch (error) {
      console.log(`${t("admin.statusUpdateFailed")}: ${error}`);
    }
  };

  const filteredTenants = useMemo(() => {
    return tenants.filter((tenant) => {
      const matchesSearch = tenant.name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || tenant.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [tenants, searchTerm, statusFilter]);

  const getStatusIcon = (status) => {
    const isActive = status === "active";
    return (
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all ${
          isActive
            ? "bg-green-500/20 border-green-500/30"
            : "bg-gray-500/20 border-gray-500/30"
        }`}
      >
        <IoBusinessOutline
          className={isActive ? "text-green-400" : "text-gray-400"}
          size={24}
        />
      </div>
    );
  };

  if (tenantsLoading) {
    return (
      <div className= {`flex items-center justify-center min-h-screen ${bgcolors.white}`}>
        <p className="text-gray-400 animate-pulse">{t("admin.loadingTenants")}</p>
      </div>
    );
  }

  return (
    <div className={`${bgcolors.white} min-h-screen p-8  text-white`}>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-500 mb-2">
          {t("admin.tenantManagement")}
        </h1>
        <p className="text-gray-500 text-sm">
          {t("admin.selectTenant")}
        </p>
      </div>

      {/* Search and Filter Row */}
      <div className="flex items-center justify-start gap-4 mb-6">
        <div className="relative w-full max-w-md">
          <IoSearchOutline
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
            size={18}
          />
          <input
            type="text"
            placeholder={t("admin.searchTenants")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#30313F] border border-gray-700/50 rounded-lg py-2 pl-10 pr-4 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex bg-[#30313F] p-1 rounded-lg border border-gray-700/50 shrink-0">
          {["all", "active", "inactive"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all capitalize ${
                statusFilter === status
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {t(`admin.filter${status.charAt(0).toUpperCase() + status.slice(1)}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Tenant Cards */}
      <div className="flex flex-col gap-3">
        {filteredTenants.map((tenant) => (
          <div
            key={tenant.id}
            onClick={() => handleTenantClick(tenant)}
            className="group bg-[#2A2B36] rounded-xl p-4 flex items-center border border-gray-700/50 hover:border-gray-500 transition-all cursor-pointer"
          >
            {/* Status Icon */}
            <div className="flex-shrink-0 mr-6">
              {getStatusIcon(tenant.status)}
            </div>

            {/* Tenant ID */}
            <div className="w-28 flex-shrink-0 px-10">
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block">
                {t("admin.tenantId")}: #{String(tenant.id).slice(0, 8)}
              </span>
            </div>

            {/* Tenant Name */}
            <div className="flex-grow min-w-0 px-25">
              <h3 className="text-base font-semibold text-white group-hover:text-blue-400 transition-colors truncate">
                {tenant.name}
              </h3>
            </div>

            {/* Status Toggle */}
            <StatusToggle
              status={tenant.status}
              onStatusChange={handleStatusChange}
              tenantId={tenant.id}
            />

            {/* Chevron */}
            <div className="flex-shrink-0 ml-4 p-2 rounded-lg bg-gray-700/30 text-gray-400 group-hover:text-blue-400 transition-all">
              <IoChevronForwardOutline size={18} />
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredTenants.length === 0 && (
        <div className="mt-10 p-12 text-center bg-[#2A2B36] rounded-xl border border-dashed border-gray-700">
          <IoBusinessOutline className="mx-auto text-gray-600 mb-4" size={48} />
          <p className="text-gray-400">{t("admin.noTenantsFound")}</p>
        </div>
      )}
    </div>
  );
};

export default AdminTenants;
