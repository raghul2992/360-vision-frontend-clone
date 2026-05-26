import { textcolors, bgcolors, colors } from "../../theme";
import { MailIcon, LockIcon, EyeIcon, EyeOffIcon } from "../../icons";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../../features/auth/authSlice";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { unwrapResult } from "@reduxjs/toolkit";

const LoginPage = ({ callbackScreen }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoading } = useSelector((state) => state.auth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const params = new URLSearchParams(location.search);
  const redirect = params.get("redirect");

  const handleLogin = async () => {
    try {
      const actionResult = await dispatch(loginUser({ email, password }));
      const result = unwrapResult(actionResult);

      localStorage.setItem("user_role", result.data.role);
      localStorage.setItem("user_id", result.data.id);

      if (result.status === 200) {
        if (result.data.role === "superadmin") {
          localStorage.removeItem("tenant_id");
          navigate("/tenants");
        } else {
          if (result.data.tenant_id) {
            localStorage.setItem("tenant_id", result.data.tenant_id);
          }
          navigate(redirect || "/dashboard", { replace: true });
        }
      }
    } catch (error) {
      console.error("Login failed:", error);
      toast.error(error);
    }
  };

  return (
    <div className="flex flex-col w-full gap-1">
      {/* Card heading */}
      <div className="mb-4 text-center w-full">
        <h2 className={`text-xl font-semibold ${textcolors.dark} mb-1`}>
          {t("login.welcome")}
        </h2>
        <p className={`text-sm ${textcolors.dim} font-normal`}>
          {t("login.subtitle")}
        </p>
      </div>

      {/* Email field */}
      <div className="flex flex-col gap-1.5 w-full mb-3">
        <label className={`text-sm font-medium ${textcolors.dark}`}>
          {t("login.email")}
        </label>
        <div className="auth-input-wrap flex items-center px-3 py-[10px] gap-2">
          <MailIcon size={18} color={colors.textMute} className="shrink-0" />
          <input
            type="email"
            placeholder={t("login.email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`auth-input flex-1 text-sm ${textcolors.dark} ${textcolors.inputPlaceholder} bg-transparent`}
          />
        </div>
      </div>

      {/* Password field */}
      <div className="flex flex-col gap-1.5 w-full mb-2">
        <label className={`text-sm font-medium ${textcolors.dark}`}>
          {t("login.password")}
        </label>
        <div className="auth-input-wrap flex items-center px-3 py-[10px] gap-2">
          <LockIcon size={18} color={colors.textMute} className="shrink-0" />
          <input
            type={showPassword ? "text" : "password"}
            placeholder={t("login.password")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`auth-input flex-1 text-sm ${textcolors.dark} ${textcolors.inputPlaceholder} bg-transparent`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className={`shrink-0 ${textcolors.slateCaption} ${textcolors.hoverSlate} transition-colors focus:outline-none`}
            tabIndex={-1}
          >
            {showPassword
              ? <EyeOffIcon size={18} />
              : <EyeIcon size={18} />
            }
          </button>
        </div>
      </div>

      {/* Forgot password */}
      <div className="self-start mb-4">
        <Link
          to="/forgot-password"
          className={`text-sm font-semibold underline ${textcolors.normaltext} ${textcolors.hoverLink} transition-colors`}
        >
          {t("login.forgot_password")}
        </Link>
      </div>

      {/* Login button */}
      <button
        onClick={handleLogin}
        disabled={isLoading}
        className={`w-full py-[11px] px-4 ${bgcolors.primary} ${bgcolors.primaryHover} hover:-translate-y-0.5 disabled:opacity-60 text-white text-sm font-semibold rounded-xl flex items-center justify-center transition-all shadow-sm`}
      >
        {isLoading ? t("login.logging_in") : t("login.login_button")}
      </button>
    </div>
  );
};

export default LoginPage;
