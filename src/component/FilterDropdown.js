import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import Select, { components } from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useTranslation } from "react-i18next";
import {
  FiFilter,
  FiSearch,
  FiCalendar,
  FiMapPin,
  FiVideo,
  FiX,
} from "react-icons/fi";
import { MdOutlineDirectionsCar } from "react-icons/md";
// --- 1. Custom Checkbox Option ---
const CheckboxOption = (props) => {
  return (
    <components.Option {...props}>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={props.isSelected}
          onChange={() => null}
          className="w-3 h-3 rounded border-gray-500 text-[#6366F1] focus:ring-0 focus:ring-offset-0 bg-transparent"
        />
        <label>{props.label}</label>
      </div>
    </components.Option>
  );
};

// --- 2. Custom Value Container (Limits tags to avoid expansion) ---
const CustomValueContainer = ({ children, ...props }) => {
  const { getValue, hasValue } = props;
  const selectedCount = getValue().length;
  const MAX_DISPLAY_TAGS = 1; // How many tags to show before "+N"

  // If no value, render standard placeholder/input
  if (!hasValue) {
    return (
      <components.ValueContainer {...props}>
        {children}
      </components.ValueContainer>
    );
  }

  // React-select passes [values, input] as children
  const [values, input] = children;

  if (selectedCount > MAX_DISPLAY_TAGS) {
    return (
      <components.ValueContainer {...props}>
        {/* Render only the first N tags */}
        {values.slice(0, MAX_DISPLAY_TAGS)}

        {/* Render the "+N" Badge */}
        <div className="flex items-center justify-center px-1.5 py-0.5 ml-1 text-[10px] font-medium text-white bg-[#4F46E5] rounded">
          +{selectedCount - MAX_DISPLAY_TAGS}
        </div>

        {/* Keep the input field so search still works */}
        {input}
      </components.ValueContainer>
    );
  }

  // If items are less than limit, render normally
  return (
    <components.ValueContainer {...props}>{children}</components.ValueContainer>
  );
};

// --- 3. React Select Custom Styles ---
const customStyles = {
  control: (base, state) => ({
    ...base,
    backgroundColor: "#393A4A",
    borderRadius: "8px",
    border: state.isFocused ? "1px solid #6366F1" : "1px solid #4B5563",
    boxShadow: "none",
    color: "#E0E0E0",
    padding: "0px 2px",
    cursor: "pointer",
    minHeight: "32px",
    fontSize: "12px",
    flexWrap: "nowrap", // Prevents wrapping to new line
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: "#2a2f45",
    color: "#FFFFFF",
    borderRadius: "8px",
    marginTop: "4px",
    border: "1px solid #4B5563",
    zIndex: 9999,
  }),
  menuList: (base) => ({ ...base, color: "#E0E0E0" }),
  option: (base, { isFocused }) => ({
    ...base,
    backgroundColor: isFocused ? "#3B3F58" : "transparent",
    color: "#E0E0E0",
    cursor: "pointer",
    fontSize: "12px",
    ":active": {
      backgroundColor: "#3B3F58",
    },
  }),
  multiValue: (base) => ({
    ...base,
    backgroundColor: "#6366F1",
    borderRadius: "4px",
    maxWidth: "100px", // Limit width of individual tags
  }),
  multiValueLabel: (base) => ({
    ...base,
    color: "#FFFFFF",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  }),
  multiValueRemove: (base) => ({
    ...base,
    color: "#FFFFFF",
    ":hover": {
      backgroundColor: "#4F46E5",
      color: "#FFFFFF",
    },
  }),
  singleValue: (base) => ({ ...base, color: "#FFFFFF", fontWeight: 500 }),
  placeholder: (base) => ({ ...base, color: "#A5ADC9", fontWeight: 400 }),
  input: (base) => ({ ...base, color: "#FFFFFF" }),
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  // Ensure the value container doesn't wrap
  valueContainer: (base) => ({
    ...base,
    flexWrap: "nowrap",
    whiteSpace: "nowrap",
    overflow: "hidden",
  }),
};

const FilterDropdown = ({
  locationOptions = [],
  cameraOptions = [],
  selectedLocation,
  setSelectedLocation,
  selectedCamera,
  setSelectedCamera,
  dateRange,
  setDateRange,
  isMinimal = false,
  hideCamera,
  hideDateRange = false,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, endDate] = dateRange || [null, null];

  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const updatePosition = () => {
    if (buttonRef.current && isOpen) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownWidth = 280;
      let top = rect.bottom + window.scrollY + 8;
      let left = rect.right + window.scrollX - dropdownWidth;
      if (left < 10) left = rect.left + window.scrollX;
      setCoords({ top, left });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);
    }
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (!isOpen) return;
      const isInsideButton =
        buttonRef.current && buttonRef.current.contains(event.target);
      const isInsideDropdown =
        dropdownRef.current && dropdownRef.current.contains(event.target);
      const isSelectMenu = event.target.closest(".react-select__menu");
      const isDatepicker = event.target.closest(".react-datepicker-popper");
      const isSelectPortal = event.target.closest(".react-select__portal");

      if (
        !isInsideButton &&
        !isInsideDropdown &&
        !isSelectMenu &&
        !isDatepicker &&
        !isSelectPortal
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <>
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`transition-colors duration-200 flex items-center justify-center ${
          isMinimal
            ? "text-gray-400 hover:text-[#6366F1] p-1 rounded-md hover:bg-[#393A4A]"
            : `p-2 rounded-lg ${
                isOpen
                  ? "bg-[#6366F1] text-white"
                  : "bg-[#393A4A] text-gray-300 hover:bg-[#4B4D63]"
              }`
        }`}
        title="Filter"
      >
        <FiFilter size={isMinimal ? 14 : 18} />
      </button>

      {isOpen &&
        ReactDOM.createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: "absolute",
              top: coords.top,
              left: coords.left,
              zIndex: 9999,
            }}
            className="w-[280px] bg-[#1a1c23] border border-[#4B5563] rounded-xl shadow-2xl p-4 cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end items-center mb-3 pb-2 border-b border-gray-700">
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-white"
              >
                <FiX size={14} />
              </button>
            </div>

            <div className="space-y-3">
              {/* Location */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase text-gray-400 flex items-center gap-2 font-bold">
                  <FiMapPin size={10} /> {t("dashboard.location") || "Location"}
                </label>
                <Select
                  options={locationOptions}
                  value={selectedLocation}
                  onChange={setSelectedLocation}
                  placeholder="All Locations"
                  isMulti
                  closeMenuOnSelect={false}
                  hideSelectedOptions={false}
                  // --- Add Custom ValueContainer Here ---
                  components={{
                    Option: CheckboxOption,
                    ValueContainer: CustomValueContainer,
                  }}
                  styles={customStyles}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                  classNamePrefix="react-select"
                />
              </div>
              {!hideCamera && (
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-gray-400 flex items-center gap-2 font-bold">
                    <FiVideo size={10} /> {t("dashboard.camera") || "Camera"}
                  </label>
                  <Select
                    isDisabled={
                      !selectedLocation ||
                      (Array.isArray(selectedLocation) &&
                        selectedLocation.length === 0)
                    }
                    options={cameraOptions}
                    value={selectedCamera}
                    onChange={setSelectedCamera}
                    placeholder={
                      selectedLocation?.length > 0
                        ? "All Cameras"
                        : "Select Location First"
                    }
                    isClearable
                    styles={customStyles}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                    classNamePrefix="react-select"
                  />
                </div>
              )}

              {!hideDateRange && (
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-gray-400 flex items-center gap-2 font-bold">
                    <FiCalendar size={10} />{" "}
                    {t("alerts.date_range") || "Date Range"}
                  </label>
                  <DatePicker
                    selectsRange
                    startDate={startDate}
                    endDate={endDate}
                    onChange={setDateRange}
                    isClearable
                    placeholderText="Select Date Range"
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-[#393A4A] text-white border border-[#4B5563] focus:outline-none focus:border-[#6366F1]"
                    wrapperClassName="w-full"
                    popperPlacement="bottom-end"
                    popperClassName="!z-[10000]"
                  />
                </div>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};

export default FilterDropdown;
