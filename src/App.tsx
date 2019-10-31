import React, { useState, useEffect } from 'react';
// import {socket} from './utils/socket';
import './App.css';
import { socket } from './utils/socket';

let keydownValue = 0;

const App: React.FC = () => {
  let isLandscape = true;
  const [, setOrientation] = useState();
  const [showRestartButton, setShowRestartButton] = useState(false);
  const [status, setStatus] = useState('Please enter the clientId to pair controller');
  const [activeInputs, setActiveInputs] = useState<Set<string>>(new Set());
  const [clientId, setClientId] = useState('');
  if(window.innerHeight > window.innerWidth) {
      isLandscape = false;
  }

  function handleOrientation(event: DeviceOrientationEvent) {
    let x = event.beta || 0;  // In degree in the range [-180,180]
    let y = event.gamma || 0; // In degree in the range [-90,90]
    setOrientation([x, y]);
    socket.emit('deviceOrientationChanged', { x: ( x / 20 ), y: 0 });
  }
  useEffect(() => {
    window.addEventListener('deviceorientation', handleOrientation);
    window.addEventListener('keyup', (e) => {
      if (activeInputs.has('keydown')) {
        activeInputs.delete('keydown');
        socket.emit('deleteActiveInput', { inputType: 'keydown' });
        setActiveInputs(activeInputs);
      }
    });

    window.addEventListener('keydown', (e) => {
      if (!activeInputs.has('keydown')) {
        activeInputs.add('keydown');
        socket.emit('newActiveInput', { inputType: 'keydown' });
        setActiveInputs(activeInputs);
      }

      if (e.keyCode === 39) {
        if (keydownValue < 0) {
          keydownValue = 0;
        }
        if (keydownValue < 50) {
          keydownValue++;
        }
      } else if(e.keyCode === 37) {
        if (keydownValue > 0) {
          keydownValue = 0;
        }
        if (keydownValue > -50) {
          keydownValue--;

        }
      }
      socket.emit('deviceOrientationChanged', { x: keydownValue, y: 0 });
    });

    socket.on('controllerPairError', (data: { message: string }) => {
      setStatus(data.message);
    });

    socket.on('controllerPairSuccess', (data: { message: string }) => {
      setStatus('Controller Connected');
    });

    socket.on('restartGame', () => {
      setShowRestartButton(false);
    });

    socket.on('gameOver', () => {
      setShowRestartButton(true);
    });
  }, []);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    socket.emit('setAssociatedClientId', clientId);
  }

  function handleChangeClientId(e: React.ChangeEvent<HTMLInputElement>) {
    setClientId(e.target.value);
  }

  function handleRestartClick() {
    setShowRestartButton(false);
    socket.emit('restartGame');
  }

  function renderRestartButton() {
    if (showRestartButton) {
      return <div><button onClick={handleRestartClick}>Restart Game</button></div>;
    }
    return null;
  }

  return (
    <div className="App">
      <form onSubmit={handleSubmit}>
        <input name="clientId" onChange={handleChangeClientId} value={clientId}/>
        <input type="submit" value="Set Player Id" />
      </form>
      { status }
      { !isLandscape && <div>Please turn your device!</div>}
      {renderRestartButton()}
    </div>
  );
}

export default App;
