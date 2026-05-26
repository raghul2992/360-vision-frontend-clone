import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import Select, { components } from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useTranslation } from "react-i18next";
import { bgcolors, textcolors, borderstyles, shadows, colors, iconSizes } from "../theme";
import { FilterIcon, CalendarIcon, MapPinIcon, VideoIcon, CloseIcon, ChevronDownIcon } from "../icons";
// --- 1. Custom Checkbox Option ---
const CheckboxOption = (props) => {
  return (
    <components.Option {...props}>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={props.isSelected}
          onChange={() => null}
          className={`w-3 h-3 rounded ${borderstyles.checkboxBorder} ${textcolors.indigo} focus:ring-0 focus:ring-offset-0 bg-transparent`}
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
        <div className={`flex items-center justify-center px-1.5 py-0.5 ml-1 text-[10px] font-medium text-white ${bgcolors.primary} rounded`}>
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

// --- 3. Custom Dropdown Indicator with rotation ---
const DropdownIndicator = (props) => (
  <components.DropdownIndicator {...props}>
    <ChevronDownIcon
      size={iconSizes.info}
      style={{
        color: colors.textDim,
        transform: props.selectProps.menuIsOpen ? "rotate(180deg)" : "rotate(0deg)",
        transition: "transform 0.25s ease",
      }}
    />
  </components.DropdownIndicator>
);

// --- 4. React Select Custom Styles ---
const customStyles = {
  control: (base, state) => ({
    ...base,
    backgroundColor: colors.panel,
    borderRadius: "8px",
    border: state.isFocused ? `1px solid ${colors.primary}` : `1px solid ${colors.border}`,
    boxShadow: state.isFocused ? shadows.selectFocus : "none",
    color: colors.text,
    padding: "0px 2px",
    cursor: "pointer",
    minHeight: "32px",
    fontSize: "12px",
    flexWrap: "nowrap",
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: colors.panel,
    color: colors.text,
    borderRadius: "8px",
    marginTop: "4px",
    border: `1px solid ${colors.border}`,
    boxShadow: shadows.menu,
    zIndex: 9999,
  }),
  menuList: (base) => ({ ...base, color: colors.text }),
  option: (base, { isFocused }) => ({
    ...base,
    backgroundColor: isFocused ? colors.bg2 : "transparent",
    color: colors.text,
    cursor: "pointer",
    fontSize: "12px",
    ":active": { backgroundColor: colors.border },
  }),
  multiValue: (base) => ({
    ...base,
    backgroundColor: colors.primary,
    borderRadius: "4px",
    maxWidth: "100px",
  }),
  multiValueLabel: (base) => ({
    ...base,
    color: colors.panel,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  }),
  multiValueRemove: (base) => ({
    ...base,
    color: colors.panel,
    ":hover": { backgroundColor: colors.accentDark, color: colors.panel },
  }),
  singleValue: (base) => ({ ...base, color: colors.text, fontWeight: 500 }),
  placeholder: (base) => ({ ...base, color: colors.textMute, fontWeight: 400 }),
  input: (base) => ({ ...base, color: colors.text }),
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
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
            ? `${textcolors.muted} ${textcolors.hoverDark} p-1 rounded-md ${bgcolors.hoverLight}`
            : `p-2 rounded-lg ${
                isOpen
                  ? `${bgcolors.accentLight} ${textcolors.primary}`
                  : `${textcolors.muted} ${bgcolors.accentHover} ${textcolors.hoverPrimary}`
              }`
        }`}
        title="Filter"
      >
        <FilterIcon size={isMinimal ? iconSizes.info : iconSizes.sidebar} />
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
            className={`w-[280px] ${bgcolors.white} ${borderstyles.light} rounded-xl shadow-lg p-4 cursor-default`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`flex justify-end items-center mb-3 pb-2 ${borderstyles.bottomLight}`}>
              <button
                onClick={() => setIsOpen(false)}
                className={`${textcolors.muted} ${textcolors.hoverDark} ${bgcolors.hoverLight} p-1 rounded-md transition-colors`}
              >
                <CloseIcon size={iconSizes.info} />
              </button>
            </div>

            <div className="space-y-3">
              {/* Location */}
              <div className="space-y-1">
                <label className={`text-[10px] uppercase ${textcolors.dim} flex items-center gap-2 font-bold tracking-wider`}>
                  <MapPinIcon size={10} className={textcolors.primary} /> {t("dashboard.location") || "Location"}
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
                    DropdownIndicator,
                  }}
                  styles={customStyles}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                  classNamePrefix="react-select"
                />
              </div>
              {!hideCamera && (
                <div className="space-y-1">
                  <label className={`text-[10px] uppercase ${textcolors.dim} flex items-center gap-2 font-bold tracking-wider`}>
                    <VideoIcon size={10} className={textcolors.primary} /> {t("dashboard.camera") || "Camera"}
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
                    components={{ DropdownIndicator }}
                    styles={customStyles}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                    classNamePrefix="react-select"
                  />
                </div>
              )}

              {!hideDateRange && (
                <div className="space-y-1">
                  <label className={`text-[10px] uppercase ${textcolors.dim} flex items-center gap-2 font-bold tracking-wider`}>
                    <CalendarIcon size={10} className={textcolors.primary} />{" "}
                    {t("alerts.date_range") || "Date Range"}
                  </label>
                  <DatePicker
                    selectsRange
                    startDate={startDate}
                    endDate={endDate}
                    onChange={setDateRange}
                    isClearable
                    placeholderText="Select Date Range"
                    className={`w-full px-3 py-1.5 text-xs rounded-lg ${bgcolors.white} ${borderstyles.light} focus:outline-none ${borderstyles.focusSelect}`}
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
