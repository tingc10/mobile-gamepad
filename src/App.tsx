import React, { useState, useEffect } from 'react';
import './App.css';

const App: React.FC = () => {
  let isLandscape = true;
  const [orientation, setOrientation] = useState();
  if(window.innerHeight > window.innerWidth) {
      isLandscape = false;
  }

  function handleOrientation(event: DeviceOrientationEvent) {
    let x = event.beta;  // In degree in the range [-180,180]
    let y = event.gamma; // In degree in the range [-90,90]
    setOrientation([x, y]);
    alert(`${x} ${y}`);
  }
  useEffect(() => {
    window.addEventListener('deviceorientation', handleOrientation);
  }, []);

  function renderOrientation() {
    if (orientation) {
      return `${orientation[0]} ${orientation[1]}`
    }
    return "No Orientation Data";
  }

  return (
    <div className="App">
      <input />
      { !isLandscape && <div>Please turn your device!</div>}
      { renderOrientation() }
    </div>
  );
}

export default App;
