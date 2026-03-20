import React from "react";
import { FiX, FiInfo } from "react-icons/fi";
import { useTranslation, Trans } from "react-i18next";
import "./AddWidgetModal.css";

// Add Widget Modal Component
const AddWidgetModal = ({ widgets, onAddWidget, onClose }) => {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-[#2a2f45] rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white text-2xl font-semibold">
            {t("dashboard.add_widget")}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {widgets.map((widget) => (
            <div
              key={widget.widget_name}
              onClick={() => onAddWidget(widget.widget_name)}
              className="bg-[#1a1d29] rounded-lg p-3 cursor-pointer hover:bg-[#393A4A] transition-colors border border-transparent hover:border-[#6366F1]"
            >
              {widget.badge && (
                <span className="text-sm font-semibold text-blue-400 border border-blue-500 bg-blue-500/10 px-3 py-0.5 pb-1 rounded-full inline-flex items-center">
                  {t(widget.badge)}
                </span>
              )}
              <p className="text-gray-400 text-sm pt-2">{t(widget.titleKey)}</p>
              <p className="text-gray-500 text-xs mt-1">
                {t(widget.descriptionKey)}
              </p>

              {widget.trackingfeatureKey && (
                <div className="mt-3 pt-2 border-t border-gray-700">
                  <div className="flex items-start gap-2 text-xs text-gray-400">
                    <FiInfo size={14} className="mt-[10px] flex-shrink-0" />
                    <span className="leading-relaxed line-clamp-3">
                      <Trans
                        i18nKey={widget.trackingfeatureKey}
                        components={{
                          highlight: <span className="text-blue-400" />,
                        }}
                      />
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        {widgets.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            All available widgets are already added
          </div>
        )}
      </div>
    </div>
  );
};

export default AddWidgetModal;
