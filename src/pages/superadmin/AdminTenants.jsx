import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  fetchTenants,
  updateTenantStatus,
  updateTenantMeta,
  deleteTenant,
} from "../../features/admin/adminSlice";
import { toast } from "react-toastify";
import StatusToggle from "../../component/StatusToggle.jsx";
import AddTenantModal from "../../component/AddTenantModal.jsx";
import ConfirmationModal from "../../component/ConfirmationModal.js";
import {
  IoSearchOutline,
  IoBusinessOutline,
  IoChevronForwardOutline,
  IoAddOutline,
  IoPencilOutline,
  IoTrashOutline,
  IoVideocamOutline,
} from "react-icons/io5";
import { bgcolors, fontWeights, textcolors } from "../../theme.js";

const AdminTenants = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { tenants, tenantsLoading, updateLoading, error } = useSelector(
    (state) => state.admin
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);

  // Edit camera limit state
  const [editTenant, setEditTenant] = useState(null); // { id, name, cameraLimit }
  const [cameraLimitInput, setCameraLimitInput] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  // Delete confirmation state
  const [deletingTenant, setDeletingTenant] = useState(null); // { id, name }

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
        updateTenantStatus({ tenant_id: tenantId, status: newStatus })
      ).unwrap();
    } catch (error) {
      console.log(`${t("admin.statusUpdateFailed")}: ${error}`);
    }
  };

  const handleEditClick = (tenant, event) => {
    event.stopPropagation();
    const currentLimit = tenant.meta?.camera_limit ?? 1;
    setEditTenant({ id: tenant.id, name: tenant.name });
    setCameraLimitInput(String(currentLimit));
  };

  const handleEditSave = async () => {
    const limit = parseInt(cameraLimitInput, 10);
    if (isNaN(limit) || limit < 1) {
      toast.error("Camera limit must be a positive number");
      return;
    }
    setEditLoading(true);
    try {
      await dispatch(
        updateTenantMeta({
          tenant_id: editTenant.id,
          meta: { camera_limit: limit },
        })
      ).unwrap();
      toast.success("Camera limit updated");
      setEditTenant(null);
    } catch (error) {
      toast.error(error || "Failed to update camera limit");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteClick = (tenant, event) => {
    event.stopPropagation();
    setDeletingTenant({ id: tenant.id, name: tenant.name });
  };

  const handleDeleteConfirm = async () => {
    try {
      await dispatch(deleteTenant({ tenant_id: deletingTenant.id })).unwrap();
      toast.success(`Tenant "${deletingTenant.name}" deleted`);
      setDeletingTenant(null);
    } catch (error) {
      toast.error(error || "Failed to delete tenant");
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
      <div className={`flex items-center justify-center min-h-screen ${bgcolors.white}`}>
        <p className="text-gray-400 animate-pulse">{t("admin.loadingTenants")}</p>
      </div>
    );
  }

  return (
    <div className={`${bgcolors.white} min-h-screen p-8`}>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">{t("admin.tenantManagement")}</h1>
        <p className="text-gray-500 text-sm">{t("admin.selectTenant")}</p>
      </div>

      {/* Search, Filter, and Add Tenant Row */}
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

        {/* Add Tenant Button */}
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shrink-0"
        >
          <IoAddOutline size={18} />
          Add Tenant
        </button>
      </div>

      {/* Tenant Cards */}
      <div className="flex flex-col gap-3">
        {filteredTenants.map((tenant) => {
          const cameraLimit = tenant.meta?.camera_limit ?? 1;
          return (
            <div
              key={tenant.id}
              onClick={() => handleTenantClick(tenant)}
              className="group bg-[#2A2B36] rounded-xl p-4 flex items-center border border-gray-700/50 hover:border-gray-500 transition-all cursor-pointer"
            >
              {/* Status Icon */}
              <div className="flex-shrink-0 mr-6">{getStatusIcon(tenant.status)}</div>

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

              {/* Camera Limit Badge */}
              {/* <div
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700/40 rounded-lg border border-gray-600/40 shrink-0"
                onClick={(e) => e.stopPropagation()}
                title="Camera limit"
              >
                <IoVideocamOutline size={14} className="text-blue-400" />
                <span className="text-xs text-gray-300 font-medium">
                  {cameraLimit} {cameraLimit === 1 ? "cam" : "cams"}
                </span>
              </div> */}

              {/* Edit Button */}
              <button
                onClick={(e) => handleEditClick(tenant, e)}
                className="flex-shrink-0 ml-2 p-2 rounded-lg bg-gray-700/30 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                title="Edit camera limit"
              >
                <IoPencilOutline size={16} />
              </button>

              {/* Delete Button */}
              <button
                onClick={(e) => handleDeleteClick(tenant, e)}
                className="flex-shrink-0 ml-2 p-2 rounded-lg bg-gray-700/30 text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                title="Delete tenant"
              >
                <IoTrashOutline size={16} />
              </button>

              {/* Status Toggle */}
              <StatusToggle
                status={tenant.status}
                onStatusChange={handleStatusChange}
                tenantId={tenant.id}
              />

              {/* Chevron */}
              <div className="flex-shrink-0 ml-3 p-2 rounded-lg bg-gray-700/30 text-gray-400 group-hover:text-blue-400 transition-all">
                <IoChevronForwardOutline size={18} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredTenants.length === 0 && (
        <div className="mt-10 p-12 text-center bg-[#2A2B36] rounded-xl border border-dashed border-gray-700">
          <IoBusinessOutline className="mx-auto text-gray-600 mb-4" size={48} />
          <p className="text-gray-400">{t("admin.noTenantsFound")}</p>
        </div>
      )}

      {/* Add Tenant Modal */}
      {showAddModal && (
        <AddTenantModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => dispatch(fetchTenants({ skip: 0, limit: 100 }))}
        />
      )}

      {/* Edit Camera Limit Modal */}
      {editTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1c1c24] border border-gray-700/50 rounded-2xl w-full max-w-sm mx-4 p-6">
            <h2 className="text-white font-semibold text-lg mb-1">Edit Camera Limit</h2>
            <p className="text-gray-400 text-sm mb-5">{editTenant.name}</p>

            <div className="flex flex-col gap-2 mb-6">
              <label className="text-gray-300 text-sm font-medium">Camera Limit</label>
              <input
                type="number"
                min="1"
                value={cameraLimitInput}
                onChange={(e) => setCameraLimitInput(e.target.value)}
                className="bg-[#30313F] border border-gray-600 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setEditTenant(null)}
                disabled={editLoading}
                className="flex-1 py-2 rounded-full border border-gray-600 text-gray-300 hover:bg-gray-700/50 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                disabled={editLoading}
                className="flex-1 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
              >
                {editLoading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!deletingTenant}
        title="Delete Tenant"
        message={`Are you sure you want to delete "${deletingTenant?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeletingTenant(null)}
      />
    </div>
  );
};

export default AdminTenants;
