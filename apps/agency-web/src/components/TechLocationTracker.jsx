import React, { useEffect, useRef, useState } from "react";
import { Alert, Spinner } from "react-bootstrap";
import io from "socket.io-client";

const SOCKET_SERVER_URL =
  import.meta.env.VITE_SOCKET_SERVER_URL || (import.meta.env.VITE_API_URL || 'http://localhost:3000');

// How accurate (in meters) we require before sending to server
const ACCURACY_THRESHOLD = 50;

const TechLocationTracker = () => {
  const socketRef = useRef(null);
  const [trackingActive, setTrackingActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [waiting, setWaiting] = useState(true);
  const [currentAccuracy, setCurrentAccuracy] = useState(null);

  useEffect(() => {
    // 1. Read technician info from localStorage
    const technicianMobile = localStorage.getItem("technicianMobile") || "0000000000";
    const technicianName = localStorage.getItem("techName") || "Technician";

    // 2. Connect the socket
    socketRef.current = io(SOCKET_SERVER_URL, {
      transports: ["websocket", "polling"],
      auth: { token: localStorage.getItem("token") },
    });

    socketRef.current.on("connect", () => {
      console.log("Tracker: socket connected, id =", socketRef.current.id);
      setTrackingActive(true);
    });

    socketRef.current.on("connect_error", (err) => {
      console.error("Tracker: socket connection error:", err);
      setErrorMsg("Could not connect to server.");
    });

    // 3. Ensure geolocation is available
    if (!navigator.geolocation) {
      setErrorMsg("Geolocation not supported by this browser.");
      setWaiting(false);
      return;
    }

    // 4. Success callback for both getCurrentPosition & watchPosition
    const handlePosition = (position) => {
      const { latitude, longitude, accuracy } = position.coords;
      console.log("Tracker: got position →", { latitude, longitude, accuracy });

      // Update local “currentAccuracy” so UI can show it
      setCurrentAccuracy(accuracy);

      // Only emit if accuracy is within threshold
      if (accuracy <= ACCURACY_THRESHOLD) {
        // If we were waiting, stop waiting now
        if (waiting) setWaiting(false);

        const payload = {
          technicianId: technicianMobile,
          username: technicianName,
          technicianMobile,
          latitude,
          longitude,
          accuracy: Math.round(accuracy),
          timestamp: Date.now(),
        };

        socketRef.current.emit("techStatus", payload);
      } else {
        // Still waiting for better accuracy
        console.log(
          `Tracker: waiting for accuracy ≤ ${ACCURACY_THRESHOLD}m, currently ${accuracy}m`
        );
      }
    };

    // 5. Error callback (for geolocation)
    const handleError = (err) => {
      console.error("Tracker: geolocation error:", err);
      setErrorMsg("Error retrieving location. Please ensure location permissions are granted.");
      setWaiting(false);
    };

    // 6. First, try a one‐time high‐accuracy request
    navigator.geolocation.getCurrentPosition(handlePosition, handleError, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    });

    // 7. Then, watchPosition for continuous updates
    const watchId = navigator.geolocation.watchPosition(handlePosition, handleError, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    });

    // 8. Cleanup on unmount
    return () => {
      navigator.geolocation.clearWatch(watchId);
      socketRef.current.disconnect();
    };
  }, [waiting]);

  return (
    <div className="mb-4">
      {errorMsg ? (
        <Alert variant="danger" className="mb-0">
          {errorMsg}
        </Alert>
      ) : waiting ? (
        <Alert
          variant="secondary"
          className="d-flex align-items-center mb-0"
        >
          <Spinner animation="border" size="sm" className="me-2" />
          <span>Waiting for accurate location…</span>
          {currentAccuracy !== null && (
            <small className="ms-2 text-muted">
              (current: {Math.round(currentAccuracy)} m)
            </small>
          )}
        </Alert>
      ) : (
        <Alert
          variant="success"
          className="d-flex align-items-center mb-0"
        >
          <Spinner animation="border" size="sm" className="me-2" />
          <span>TechLocationTracker is Active</span>
          {currentAccuracy !== null && (
            <small className="ms-2 text-muted">
              (accuracy: {Math.round(currentAccuracy)} m)
            </small>
          )}
        </Alert>
      )}
    </div>
  );
};

export default TechLocationTracker;