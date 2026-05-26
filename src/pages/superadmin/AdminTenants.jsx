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
import { bgcolors, textcolors, borderstyles, colors, gradients, shadows } from "../../theme.js";
import { BuildingIcon, EditIcon, SearchIcon, PlusIcon, TrashIcon, ArrowRightIcon } from "../../icons.jsx";

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
  const [editTenant, setEditTenant] = useState(null);
  const [cameraLimitInput, setCameraLimitInput] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [deletingTenant, setDeletingTenant] = useState(null);

  useEffect(() => {
    localStorage.removeItem("tenant_id");
    localStorage.removeItem("tenant_name");
    dispatch(fetchTenants({ skip: 0, limit: 100 }));
  }, [dispatch, navigate]);

  useEffect(() => {
    if (error) console.log(error);
  }, [error]);

  const handleTenantClick = (tenant) => {
    localStorage.setItem("tenant_id", tenant.id);
    localStorage.setItem("tenant_name", tenant.name);
    navigate("/dashboard");
  };

  const handleStatusChange = async (tenantId, newStatus, event) => {
    event.stopPropagation();
    try {
      await dispatch(updateTenantStatus({ tenant_id: tenantId, status: newStatus })).unwrap();
    } catch (error) {
      console.log(`${t("admin.statusUpdateFailed")}: ${error}`);
    }
  };

  const handleEditClick = (tenant, event) => {
    event.stopPropagation();
    setEditTenant({ id: tenant.id, name: tenant.name });
    setCameraLimitInput(String(tenant.meta?.camera_limit ?? 1));
  };

  const handleEditSave = async () => {
    const limit = parseInt(cameraLimitInput, 10);
    if (isNaN(limit) || limit < 1) { toast.error(t("admin.cameraLimitError")); return; }
    setEditLoading(true);
    try {
      await dispatch(updateTenantMeta({ tenant_id: editTenant.id, meta: { camera_limit: limit } })).unwrap();
      toast.success(t("admin.cameraLimitUpdated"));
      setEditTenant(null);
    } catch (error) {
      toast.error(error || t("admin.cameraLimitUpdateFailed"));
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
      toast.success(t("admin.tenantDeleted", { name: deletingTenant.name }));
      setDeletingTenant(null);
    } catch (error) {
      toast.error(error || t("admin.tenantDeleteFailed"));
    }
  };

  const filteredTenants = useMemo(() => {
    return tenants.filter((tenant) => {
      const matchesSearch = tenant.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || tenant.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [tenants, searchTerm, statusFilter]);

  if (tenantsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: colors.surface }}>
        <p className="animate-pulse" style={{ color: colors.textMute }}>{t("admin.loadingTenants")}</p>
      </div>
    );
  }

  return (
    <div
      className="h-full flex flex-col p-4 sm:p-8 overflow-hidden"
      style={{
        background: colors.bg,
        backgroundImage: gradients.pageBg,
      }}
    >
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6 shrink-0">
        <div>
          <h2 className="text-[26px] font-bold mb-1" style={{ color: colors.text, letterSpacing: "-0.02em" }}>
            {t("admin.title")}
          </h2>
          <p className="text-[13.5px]" style={{ color: colors.textDim }}>{t("admin.subtitle")}</p>
        </div>

        {/* Add Tenant Button */}
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 px-5 py-[11px] text-white text-sm font-semibold rounded-[10px] transition-all shrink-0 w-full sm:w-auto hover:-translate-y-0.5"
          style={{
            background: gradients.accent,
            boxShadow: shadows.button,
          }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = shadows.buttonHover; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = shadows.button; }}
        >
          <PlusIcon size={16} />
          {t("admin.addTenant")}
        </button>
      </div>

      {/* Search and Filter Row */}
      <div className="flex flex-wrap items-center gap-3 mb-6 shrink-0">
        {/* Search */}
        <div className="relative w-full sm:w-auto sm:flex-1 sm:max-w-[460px] order-1">
          <SearchIcon
            className="absolute left-[14px] top-1/2 -translate-y-1/2"
            size={16}
            color={colors.textMute}
          />
          <input
            type="text"
            autoComplete="off"
            placeholder={t("admin.searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full py-[11px] pl-[40px] pr-[14px] text-[13.5px] rounded-[10px] outline-none transition-all"
            style={{
              background: colors.panel,
              border: `1px solid ${colors.border}`,
              color: colors.text,
            }}
            onFocus={e => {
              e.target.style.borderColor = colors.accent;
              e.target.style.boxShadow = shadows.focusRing;
            }}
            onBlur={e => {
              e.target.style.borderColor = colors.border;
              e.target.style.boxShadow = "none";
            }}
          />
        </div>

        {/* Filter Tabs */}
        <div
          className="flex shrink-0 p-1 rounded-[10px] gap-1 order-2"
          style={{ background: colors.panel, border: `1px solid ${colors.border}` }}
        >
          {["all", "active", "inactive"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className="px-4 py-[7px] rounded-[7px] text-[12.5px] font-semibold capitalize transition-all border"
              style={
                statusFilter === status
                  ? {
                      background: gradients.accentSubtle,
                      color: colors.accentDark,
                      boxShadow: shadows.insetAccent,
                      borderColor: "transparent",
                    }
                  : { background: "transparent", color: colors.textDim, borderColor: "transparent" }
              }
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Count */}
        <span className="text-[13px] ml-auto shrink-0 order-3" style={{ color: colors.textDim }}>
          <strong style={{ color: colors.text }}>{filteredTenants.length}</strong>{" "}
          {filteredTenants.length === 1 ? t("admin.tenantSingular") : t("admin.tenantPlural")}
        </span>
      </div>

      {/* Tenant Cards Grid */}
      <div className="flex-1 min-h-0 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(360px, 100%), 1fr))" }}
        >
          {filteredTenants.map((tenant) => {
            const isActive = tenant.status === "active";
            return (
              <div
                key={tenant.id}
                onClick={() => handleTenantClick(tenant)}
                className="group relative rounded-2xl cursor-pointer overflow-hidden transition-all duration-200"
                style={{
                  background: gradients.panel,
                  border: `1px solid ${colors.border}`,
                  boxShadow: shadows.card,
                  padding: "20px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.borderColor = colors.border2;
                  e.currentTarget.style.boxShadow = shadows.cardHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.borderColor = colors.border;
                  e.currentTarget.style.boxShadow = shadows.card;
                }}
              >
                {/* Blue top accent on hover */}
                <div
                  className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  style={{ background: gradients.accent }}
                />

                {/* Card Body */}
                <div className="flex items-center gap-[14px] mb-[18px]">
                  {/* Icon Tile */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: gradients.iconTile,
                      border: `1px solid ${colors.accentBorderSubtle}`,
                      color: colors.accentDark,
                    }}
                  >
                    <BuildingIcon />
                  </div>

                  <div className="min-w-0">
                    <p
                      className="text-[11px] font-semibold uppercase mb-0.5"
                      style={{ color: colors.textMute, letterSpacing: "0.04em" }}
                    >
                      {t("admin.tenantId")}:{" "}
                      <strong style={{ color: colors.accentDark, fontWeight: 700 }}>
                        #{String(tenant.id).slice(0, 8)}
                      </strong>
                    </p>
                    <h3
                      className="text-[17px] font-bold truncate"
                      style={{ color: colors.text, letterSpacing: "-0.01em" }}
                    >
                      {tenant.name}
                    </h3>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="flex items-center flex-wrap gap-[10px]" style={{ paddingTop: "16px", borderTop: `1px dashed ${colors.border}` }}>
                  {/* Edit */}
                  <button
                    onClick={(e) => handleEditClick(tenant, e)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                    style={{ background: colors.bg, border: `1px solid ${colors.border}`, color: colors.textDim }}
                    title={t("admin.editCameraLimitTooltip")}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = colors.accentHoverBg;
                      e.currentTarget.style.color = colors.accentDark;
                      e.currentTarget.style.borderColor = colors.accentHoverBorder;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = colors.bg;
                      e.currentTarget.style.color = colors.textDim;
                      e.currentTarget.style.borderColor = colors.border;
                    }}
                  >
                    <EditIcon />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={(e) => handleDeleteClick(tenant, e)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                    style={{ background: colors.bg, border: `1px solid ${colors.border}`, color: colors.textDim }}
                    title={t("admin.deleteTenantTooltip")}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = colors.dangerHoverBg;
                      e.currentTarget.style.color = colors.dangerDark;
                      e.currentTarget.style.borderColor = colors.dangerHoverBorder;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = colors.bg;
                      e.currentTarget.style.color = colors.textDim;
                      e.currentTarget.style.borderColor = colors.border;
                    }}
                  >
                    <TrashIcon size={14} />
                  </button>

                  {/* Status Toggle */}
                  <div onClick={(e) => e.stopPropagation()}>
                    <StatusToggle
                      status={tenant.status}
                      onStatusChange={handleStatusChange}
                      tenantId={tenant.id}
                    />
                  </div>

                  {/* Status Text */}
                  <span
                    className="text-[11px] font-semibold uppercase tracking-wider"
                    style={{ color: isActive ? colors.successDark : colors.textMute }}
                  >
                    {tenant.status}
                  </span>

                  {/* Arrow */}
                  <div
                    className={`ml-auto w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150 group-hover:translate-x-1 ${textcolors.groupHoverAccentDark} ${bgcolors.groupHoverAccent} ${borderstyles.groupHoverAccent}`}
                    style={{ background: colors.bg, border: `1px solid ${colors.border}`, color: colors.textDim }}
                  >
                    <ArrowRightIcon size={16} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredTenants.length === 0 && (
          <div
            className="mt-10 p-12 text-center rounded-2xl"
            style={{ background: colors.panel, border: `1px dashed ${colors.border}` }}
          >
            <div className="mx-auto mb-4 w-12 h-12" style={{ color: colors.border }}><BuildingIcon /></div>
            <p className="text-sm" style={{ color: colors.textMute }}>{t("admin.noTenantsFound")}</p>
          </div>
        )}
      </div>

      {/* Add Tenant Modal */}
      {showAddModal && (
        <AddTenantModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => dispatch(fetchTenants({ skip: 0, limit: 100 }))}
        />
      )}

      {/* Edit Camera Limit Modal */}
      {editTenant && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center ${bgcolors.overlay} backdrop-blur-sm`}>
          <div className="rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6" style={{ background: colors.panel, border: `1px solid ${colors.border}` }}>
            <h2 className="font-semibold text-lg mb-1" style={{ color: colors.text }}>{t("admin.editCameraLimitTitle")}</h2>
            <p className="text-sm mb-5" style={{ color: colors.textDim }}>{editTenant.name}</p>
            <div className="flex flex-col gap-2 mb-6">
              <label className="text-sm font-bold" style={{ color: colors.text }}>{t("admin.cameraLimit")}</label>
              <input
                type="number"
                min="1"
                value={cameraLimitInput}
                onChange={(e) => setCameraLimitInput(e.target.value)}
                className="rounded-lg px-4 py-2 text-sm outline-none transition-all"
                style={{ background: colors.bg, border: `1px solid ${colors.border}`, color: colors.text }}
                onFocus={e => { e.target.style.borderColor = colors.accent; e.target.style.boxShadow = shadows.selectFocus; }}
                onBlur={e => { e.target.style.borderColor = colors.border; e.target.style.boxShadow = "none"; }}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setEditTenant(null)}
                disabled={editLoading}
                className="flex-1 py-2 rounded-full text-sm font-medium transition-colors"
                style={{ border: `1px solid ${colors.border}`, color: colors.textDim }}
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={handleEditSave}
                disabled={editLoading}
                className="flex-1 py-2 rounded-full text-white text-sm font-semibold transition-all hover:-translate-y-0.5"
                style={{ background: gradients.accent, boxShadow: shadows.button }}
              >
                {editLoading ? t("admin.saving") : t("admin.save")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!deletingTenant}
        title={t("admin.deleteTenantTitle")}
        message={t("admin.deleteTenantMessage", { name: deletingTenant?.name })}
        confirmText={t("common.delete")}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeletingTenant(null)}
      />
    </div>
  );
};

export default AdminTenants;
