import React, { useState, useEffect } from 'react';
// import {socket} from './utils/socket';
import './App.css';
import { socket } from './utils/socket';

let keydownValue = 0;

const App: React.FC = () => {
  let isLandscape = true;
  const [orientation, setOrientation] = useState();
  const [status, setStatus] = useState('Please enter the playerId to pair controller');
  const [activeInputs, setActiveInputs] = useState<Set<string>>(new Set());
  const [playerId, setPlayerId] = useState('');
  if(window.innerHeight > window.innerWidth) {
      isLandscape = false;
  }

  function handleOrientation(event: DeviceOrientationEvent) {
    let x = event.beta || 0;  // In degree in the range [-180,180]
    let y = event.gamma || 0; // In degree in the range [-90,90]
    setOrientation([x, y]);
    socket.emit('deviceOrientationChanged', { x: ( x / 5 ), y: 0 });
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
  }, []);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    socket.emit('setAssociatedPlayerId', playerId);
  }

  function handleChangePlayerId(e: React.ChangeEvent<HTMLInputElement>) {
    setPlayerId(e.target.value);
  }

  return (
    <div className="App">
      <form onSubmit={handleSubmit}>
        <input name="playerId" onChange={handleChangePlayerId} value={playerId}/>
        <input type="submit" value="Set Player Id" />
      </form>
      { status }
      { !isLandscape && <div>Please turn your device!</div>}
    </div>
  );
}

export default App;
