import React from "react";
import { useTranslation, Trans } from "react-i18next";
import { bgcolors, textcolors, borderstyles, colors } from "../../../theme";
import { CloseIcon, InfoIcon, PlusIcon } from "../../../icons";

const AddWidgetModal = ({ widgets, onAddWidget, onClose }) => {
  const { t } = useTranslation();

  return (
    <div className={`fixed inset-0 ${bgcolors.overlay} flex items-center justify-center z-[9999] backdrop-blur-sm`}>
      <div className={`${bgcolors.white} rounded-2xl shadow-xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto ${borderstyles.light}`}>

        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b flex-shrink-0" style={{ borderColor: colors.border }}>
          <div>
            <h2 className="text-xl font-bold" style={{ color: colors.text }}>
              {t("dashboard.add_widget")}
            </h2>
            {widgets.length > 0 && (
              <p className={`${textcolors.muted} text-sm mt-0.5`}>Select widgets to add to your dashboard</p>
            )}
          </div>
          <button
            onClick={onClose}
            className={`${textcolors.muted} ${bgcolors.hoverLight} p-2 rounded-lg transition-colors`}
          >
            <CloseIcon size={20} />
          </button>
        </div>

        {/* Widget Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {widgets.map((widget) => (
            <div
              key={widget.widget_name}
              onClick={() => onAddWidget(widget.widget_name)}
              className={`group ${bgcolors.surface} rounded-xl p-4 cursor-pointer hover:bg-white transition-all duration-200 ${borderstyles.light} ${borderstyles.hoverAccentStrong} hover:shadow-md`}
            >
              {/* Badge */}
              {widget.badge && (
                <span className={`text-xs font-semibold ${textcolors.primary} ${borderstyles.accentBadge} ${bgcolors.primaryFaint} px-2.5 py-0.5 rounded-full inline-flex items-center mb-2`}>
                  {t(widget.badge)}
                </span>
              )}

              {/* Title row */}
              <div className="flex items-start justify-between gap-2 mt-1">
                <p className="text-sm font-semibold leading-snug" style={{ color: colors.text }}>
                  {t(widget.titleKey)}
                </p>
                <span className={`flex-shrink-0 w-6 h-6 rounded-full ${bgcolors.grayLight} ${bgcolors.primaryGroupHover} flex items-center justify-center transition-colors duration-200`}>
                  <PlusIcon size={13} className={`${textcolors.muted} ${textcolors.groupHoverWhite} transition-colors duration-200`} />
                </span>
              </div>

              {/* Description */}
              <p className={`${textcolors.muted} text-xs mt-1.5 leading-relaxed`}>
                {t(widget.descriptionKey)}
              </p>

              {/* Tracking feature note */}
              {widget.trackingfeatureKey && (
                <div className="mt-3 pt-2 border-t" style={{ borderColor: colors.border }}>
                  <div className={`flex items-start gap-2 text-xs ${textcolors.muted}`}>
                    <InfoIcon size={13} className={`mt-[1px] flex-shrink-0 ${textcolors.primary}`} />
                    <span className="leading-relaxed line-clamp-3">
                      <Trans
                        i18nKey={widget.trackingfeatureKey}
                        components={{ highlight: <span className={textcolors.primary} /> }}
                      />
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Empty state */}
        {widgets.length === 0 && (
          <div className={`text-center ${textcolors.muted} py-10`}>
            All available widgets are already added
          </div>
        )}
      </div>
    </div>
  );
};

export default AddWidgetModal;
