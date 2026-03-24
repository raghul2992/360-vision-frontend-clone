import { bgcolors, fontWeights, textcolors, textSizes } from "../../theme";
import Label from "../../component/Label";
import TextInput from "../../component/TextInput";
import { IoLockClosed, IoMailOutline } from "react-icons/io5";
import PasswordInput from "../../component/PasswordInput";
import ButtonComponent from "../../component/Button";
import { Link, useNavigate ,useLocation} from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../../features/auth/authSlice";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { unwrapResult } from "@reduxjs/toolkit";

const LoginPage = ({ callbackScreen }) => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
 const location = useLocation();
  const { isLoading, error, success } = useSelector((state) => state.auth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
 const params = new URLSearchParams(location.search);
const redirect = params.get("redirect");
  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  // useEffect(() => {
  //   if (success && localStorage.getItem('tenant_id')) {
  //     // toast.success()
  //     navigate('/dashboard')
  //     // navigate('/camera')
  //   }
  //   if (error) {
  //     console.log(error)
  //     toast.error(error)
  //   }
  // }, [success, error, navigate, t])

  const handleLogin = async () => {
    try {
      const actionResult = await dispatch(loginUser({ email, password }));
      const result = unwrapResult(actionResult);

      console.log(result);

      // Store user info
      localStorage.setItem("user_role", result.data.role);
      localStorage.setItem("user_id", result.data.id);

      // Handle tenant_id based on role
      if (result.status === 200) {
        if (result.data.role === "superadmin") {
          // Clear any existing tenant_id for superadmin
          localStorage.removeItem("tenant_id");
          
          navigate("/tenants");
        } else {
          // Store tenant_id for regular users (admin, operator, viewer)
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
    <div className="flex flex-col justify-start items-center w-full">
      {/* Heading - centered */}
      <div className="mb-1 text-center w-full max-w-sm">
        <h2 className={`${fontWeights.semibold} ${textSizes.title1}`}>
          {t("login.welcome")}
        </h2>
        <p
          className={`${textSizes.subtitle} ${textcolors.normaltext} ${fontWeights.normal}`}
        >
          {t("login.subtitle")}
        </p>
      </div>

      <div className="flex flex-col gap-3 w-full p-1 items-start">
        <Label>{t("login.email")}</Label>
        <TextInput
          icon={<IoMailOutline size={20} color="#888888" />}
          placeholder={t("login.email")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-3 w-full  p-1 items-start">
        <Label>{t("login.password")}</Label>
        <PasswordInput
          icon={<IoLockClosed size={20} color="#888888" />}
          placeholder={t("login.password")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div className="self-start p-1 mb-1 ">
        <Link to={"/forgot-password"}>
          <ButtonComponent
            children={t("login.forgot_password")}
            className={`${fontWeights.semibold}`}
          />
        </Link>
      </div>

      <div className="p-1 w-full ">
        <ButtonComponent
          children={isLoading ? t("login.logging_in") : t("login.login_button")}
          className={`${fontWeights.semibold} ${textcolors.white} ${textSizes.base} ${bgcolors.primary} w-full py-[8px] px-[16px]  flex items-center justify-center rounded-[100px]`}
          onClick={handleLogin}
          disabled={isLoading}
        />
      </div>
      <div className="flex items-center justify-center mt-4">
        <p className={`${textSizes.base} ${textcolors.normaltext} mr-1`}>
          {t("login.no_account")}
        </p>
        {/* <Link to="/register"> */}
        <ButtonComponent
          children={t("login.sign_up")}
          className={`${fontWeights.semibold} ${textcolors.primary}`}
          onClick={() => {
            callbackScreen("register");
          }}
        />
        {/* </Link> */}
      </div>
    </div>
  );
};

export default LoginPage;
