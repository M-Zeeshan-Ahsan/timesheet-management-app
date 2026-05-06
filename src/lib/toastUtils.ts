import { toast, ToastOptions } from "react-toastify";
import React from "react";

type ToastType = "success" | "error" | "info" | "warning";

export const showToast = (
  content: React.ReactNode,
  type: ToastType = "info",
  onClose?: () => void,
  options?: ToastOptions,
) => {
  toast[type](content, {
    position: "top-right",
    autoClose: type === "error" ? 2000 : 1000,
    theme: "colored",
    onClose,
    ...options,
  });
};
