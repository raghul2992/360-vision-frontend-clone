// src/utils/notificationHelper.js

/**
 * Request permission for browser notifications
 */
export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) {
    console.log("This browser does not support desktop notifications");
    return "denied";
  }

  if (Notification.permission === "granted") {
    return "granted";
  }

  if (Notification.permission !== "denied") {
    try {
      const permission = await Notification.requestPermission();
      console.log("Notification permission result:", permission);
      return permission;
    } catch (error) {
      console.error("Failed to request notification permission:", error);
      return "denied";
    }
  }

  return Notification.permission;
};

/**
 * Show Chrome notification + Toast (if allowed) or Toast only (if blocked)
 * @param {Object} options - Notification options
 * @param {string} options.title - Notification title
 * @param {string} options.body - Notification body/message
 * @param {string} options.icon - Notification icon URL (optional)
 * @param {string} options.tag - Notification tag to prevent duplicates (optional)
 * @param {Function} options.onClick - Click handler (optional)
 * @param {Function} toastCallback - Toast function to ALWAYS call
 */
export const showNotification = async (options, toastCallback) => {
  try {
    console.log("🔔 showNotification called with:", options);
    
    const { title, body, icon, tag, onClick } = options;

    // ✅ STEP 1: ALWAYS SHOW TOAST (in-app notification)
    console.log("📢 Showing toast notification");
    if (toastCallback) {
      toastCallback();
    }

    // ✅ STEP 2: TRY TO SHOW CHROME NOTIFICATION (if browser supports)
    if (!("Notification" in window)) {
      console.log("❌ Browser doesn't support Chrome notifications (toast already shown)");
      return;
    }

    console.log("📊 Current notification permission:", Notification.permission);

    // ✅ STEP 3: IF PERMISSION GRANTED, SHOW CHROME NOTIFICATION TOO
    if (Notification.permission === "granted") {
      console.log("✅ Permission granted, creating Chrome notification");
      
      const notification = new Notification(title, {
        body,
        icon: icon || "/sstlogo.png",
        tag: tag || `notification-${Date.now()}`,
        badge: "/sstlogo.png",
        requireInteraction: false,
        silent: false,
      });

      console.log("✅ Chrome notification created (Toast + Chrome = Both shown)");

      // Handle click
      if (onClick) {
        notification.onclick = (event) => {
          event.preventDefault();
          window.focus();
          onClick();
          notification.close();
        };
      }

      // Auto-close after 5 seconds
      setTimeout(() => notification.close(), 5000);

      return notification;
    } else {
      console.log("⚠️ Chrome notification permission not granted (only toast shown)");
    }
  } catch (error) {
    console.error("❌ Error in showNotification:", error);
    
    // Toast already shown in Step 1, so we're good
    console.log("✅ Toast already shown, error handled gracefully");
  }
};

/**
 * Check if notifications are supported and enabled
 */
export const areNotificationsEnabled = () => {
  return (
    "Notification" in window && Notification.permission === "granted"
  );
};
