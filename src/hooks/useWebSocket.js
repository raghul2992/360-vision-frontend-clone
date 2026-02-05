// hooks/useWebSocket.js
import { useState, useEffect, useRef, useCallback } from "react";
import { useDispatch } from "react-redux";
import { updateCameraStatusFromWebSocket } from "../features/cameras/cameraApiSlice";
import { addAlert } from "../features/alert/alertSlice";
import eventEmitter from "../utils/eventEmitter";
import { showNotification } from "../utils/notificationHelper";
import { toast } from "react-toastify";

const useWebSocket = (url, tenant_id, reconnectInterval = 2000) => {
  const [isConnected, setIsConnected] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const ws = useRef(null);
  const reconnectTimeout = useRef(null);
  const dispatch = useDispatch();

  const connect = useCallback(() => {
    if (!url) {
      console.log("No WebSocket URL provided");
      return;
    }

    if (
      ws.current &&
      (ws.current.readyState === WebSocket.OPEN ||
        ws.current.readyState === WebSocket.CONNECTING)
    ) {
      console.log("WebSocket already connected or connecting");
      return;
    }

    console.log(`Attempting to connect to WebSocket: ${url}`);
    ws.current = new WebSocket(url);

    ws.current.onopen = () => {
      console.log("WebSocket connected!");
      setIsConnected(true);
      setError(null);
      clearTimeout(reconnectTimeout.current);
    };

    ws.current.onmessage = (event) => {
      try {
        const receivedMessage = JSON.parse(event.data);
        console.log("Received WebSocket message:", receivedMessage);
        setMessage(receivedMessage);
        eventEmitter.emit("websocketMessage", receivedMessage);

        if (receivedMessage.type === "camera_status") {
          console.log("camera status received, emitting notification");
          eventEmitter.emit("newNotification", receivedMessage);

          const alertBody =
            receivedMessage.data?.message ||
            receivedMessage.message ||
            "New security alert detected";

          console.log("🔔 Showing notification for camera_status");

          showNotification(
            {
              title: "📹 Camera Status Update",
              body: receivedMessage.message || "Camera status changed",
              icon: "/sstlogo.png",
              tag: `camera-${receivedMessage.data?.camera_id || Date.now()}`,
              onClick: () => {
                window.location.href = "/camera";
              },
            },
            () => {
              toast.info(receivedMessage.message || "Camera status updated", {
                position: "top-right",
                autoClose: 3000,
                toastId: `camera-${receivedMessage.data?.camera_id}`, // ✅ Prevent duplicates
              });
            },
          );
        }

        // ✅ Handle event_alert type (ONLY ONCE!)
        else if (receivedMessage.type === "event_alert") {
          console.log("Event alert received, emitting notification");
          eventEmitter.emit("newNotification", receivedMessage);

          const alertBody =
            receivedMessage.data?.message ||
            receivedMessage.message ||
            "New security alert detected";

          console.log("🔔 Showing notification for event_alert");

          showNotification(
            {
              title: "⚠️ Alert",
              body: alertBody,
              icon: "/sstlogo.png",
              tag: `alert-${Date.now()}`,
              onClick: () => {
                window.location.href = "/dashboard"; // ✅ Navigate to dashboard page
              },
            },
            () => {
              console.log("📢 Showing toast notification");
              toast.warning(alertBody, {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                toastId: `alert-${Date.now()}`, // ✅ Prevent duplicates
              });
            },
          );
        }
      } catch (e) {
        console.error("Failed to parse WebSocket message:", e);
        setMessage(event.data);
      }
    };
    ws.current.onclose = (event) => {
      console.log("WebSocket disconnected:", event.code, event.reason);
      setIsConnected(false);
      setError(`Disconnected: ${event.reason || "Unknown reason"}`);

      reconnectTimeout.current = setTimeout(connect, reconnectInterval);
    };

    ws.current.onerror = (err) => {
      console.error("WebSocket error:", err);
      setIsConnected(false);
      setError(err.message || "WebSocket error occurred");

      // Force close to trigger onclose and reconnection
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [url, reconnectInterval, dispatch, tenant_id]);

  useEffect(() => {
    connect();

    return () => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.close();
      }
      clearTimeout(reconnectTimeout.current);
    };
  }, [url, connect, tenant_id]);

  const sendMessage = useCallback((data) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      console.log("Sending WebSocket message:", data);
      ws.current.send(JSON.stringify(data));
    } else {
      console.warn(
        "WebSocket is not open. Current state:",
        ws.current?.readyState,
      );
      console.warn("Message not sent:", data);
    }
  }, []);

  return { isConnected, message, error, sendMessage, connect };
};

export default useWebSocket;
