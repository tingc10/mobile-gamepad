import React, { useState, useEffect, useRef } from "react";
import NoSleep from "nosleep.js";
import Bowser from "bowser";
import "./App.css";
import { socket } from "./utils/socket";

let keydownValue = 0;
const parser = Bowser.getParser(window.navigator.userAgent);

declare global {
  interface Window {
    DeviceMotionEvent: DeviceMotionEvent & {
      requestPermission?: () => Promise<string>;
    };
  }
}

const RestartIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="26"
      height="26"
      viewBox="0 0 26 26"
      style={{ fill: "#fff" }}
    >
      <path d="M 10 0 L 0 2 L 3.03125 5.03125 C 1.273438 7.222656 0.1875 9.972656 0.1875 13 C 0.1875 20.074219 5.921875 25.8125 13 25.8125 C 20.078125 25.8125 25.8125 20.074219 25.8125 13 C 25.8125 7.695313 22.59375 3.132813 18 1.1875 L 18 4.28125 C 21.027344 6.019531 23.0625 9.261719 23.0625 13 C 23.0625 18.5625 18.5625 23.0625 13 23.0625 C 7.4375 23.0625 2.9375 18.5625 2.9375 13 C 2.9375 10.726563 3.695313 8.652344 4.96875 6.96875 L 8 10 Z"></path>
    </svg>
  );
};

const App: React.FC = () => {
  let isLandscape = true;
  const [showRestartButton, setShowRestartButton] = useState(false);
  const [status, setStatus] = useState(
    "Please enter the clientId to pair controller"
  );
  const [activeInputs, setActiveInputs] = useState<Set<string>>(new Set());
  const [clientId, setClientId] = useState("");
  const [
    deviceOrientationInitialized,
    setDeviceOrientationInitialized
  ] = useState(false);
  const playerRef = useRef(1);
  if (window.innerHeight > window.innerWidth) {
    isLandscape = false;
  }

  function handleOrientation(event: DeviceOrientationEvent) {
    let x = event.beta || 0; // In degree in the range [-180,180]
    let y = event.gamma || 0; // In degree in the range [-90,90]
    if (playerRef.current === 2) {
      x = -1 * x;
    }
    socket.emit("deviceOrientationChanged", { x: x / 20, y: 0 });
  }

  useEffect(() => {
    const noSleep = new NoSleep();
    window.addEventListener("keyup", e => {
      if (activeInputs.has("keydown")) {
        activeInputs.delete("keydown");
        socket.emit("deleteActiveInput", { inputType: "keydown" });
        setActiveInputs(activeInputs);
      }
    });

    window.addEventListener("keydown", e => {
      if (!activeInputs.has("keydown")) {
        activeInputs.add("keydown");
        socket.emit("newActiveInput", { inputType: "keydown" });
        setActiveInputs(activeInputs);
      }

      if (e.keyCode === 39) {
        if (keydownValue < 0) {
          keydownValue = 0;
        }
        if (keydownValue < 50) {
          keydownValue++;
        }
      } else if (e.keyCode === 37) {
        if (keydownValue > 0) {
          keydownValue = 0;
        }
        if (keydownValue > -50) {
          keydownValue--;
        }
      }
      socket.emit("deviceOrientationChanged", { x: keydownValue, y: 0 });
    });

    socket.on("controllerPairError", (data: { message: string }) => {
      setStatus(data.message);
    });

    socket.on("controllerPairSuccess", (data: { playerNumber: number }) => {
      playerRef.current = data.playerNumber;
      setStatus("Controller Connected");
    });

    socket.on("restartGame", () => {
      setShowRestartButton(false);
    });

    socket.on("gameOver", () => {
      setShowRestartButton(true);
    });

    document.addEventListener(
      "click",
      function userTapPermissions() {
        document.removeEventListener("click", userTapPermissions, false);
        // This prevents the phone from going to sleep
        noSleep.enable();
      },
      false
    );
  }, []);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    socket.emit("setAssociatedClientId", clientId);
  }

  function handleChangeClientId(e: React.ChangeEvent<HTMLInputElement>) {
    setClientId(e.target.value);
  }

  function handleRestartClick() {
    setShowRestartButton(false);
    socket.emit("restartGame");
  }

  function renderRestartButton() {
    if (showRestartButton) {
      return (
        <div>
          <button className="restart-button" onClick={handleRestartClick}>
            <RestartIcon />
            <p>Restart Game</p>
          </button>
        </div>
      );
    }
    return null;
  }

  async function initializeDeviceOrientationHandler() {
    if (typeof window.DeviceMotionEvent.requestPermission === "function") {
      try {
        const response = await window.DeviceMotionEvent.requestPermission();
        if (response === "granted") {
          window.addEventListener("deviceorientation", handleOrientation);
        } else {
          console.log("DeviceMotion permissions not granted.");
        }
      } catch (e) {
        console.log(e);
      }
    } else {
      window.addEventListener("deviceorientation", handleOrientation);
    }
  }

  function handleClickSubmit() {
    if (!deviceOrientationInitialized) {
      initializeDeviceOrientationHandler();
      setDeviceOrientationInitialized(true);
    }
  }

  return (
    <div className="App">
      <form className="client-id-form" onSubmit={handleSubmit}>
        <input
          className="client-id-input"
          name="clientId"
          onChange={handleChangeClientId}
          value={clientId}
        />
        <input
          className="client-submit-button"
          onClick={handleClickSubmit}
          type="submit"
          value="Set Client Id"
        />
      </form>
      {status}
      {!isLandscape && <div>Please turn your device!</div>}
      {renderRestartButton()}
    </div>
  );
};

export default App;
