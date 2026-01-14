import React from 'react';
import useStore from '../store';
import './HUD.css';

const HUD = () => {
  const { status, score, highScore, start, reset } = useStore();

  if (status === 'PLAYING') {
    return (
      <div className="hud-container">
        <div className="score">{score}</div>
      </div>
    );
  }

  return (
    <div className="hud-container">
      {status === 'MENU' && (
        <div className="hud-panel">
          <img src="/icon.png" alt="Color Rush Arena Logo" className="logo pulse-animation" />
          <h1 className="title">Color Rush<br />Arena</h1>
          <p>High Score: {highScore}</p>
          <button className="btn" onClick={start}>Play Now</button>
          <div className="instruction">Tap / Click to Jump</div>
        </div>
      )}

      {status === 'GAMEOVER' && (
        <div className="hud-panel">
          <h1 className="title">Game Over</h1>
          <p style={{ fontSize: '2rem' }}>Score: {score}</p>
          <p>Best: {highScore}</p>
          <button className="btn" onClick={start}>Try Again</button>
          <button className="btn" onClick={reset} style={{ marginTop: '0.5rem', fontSize: '0.8em', padding: '0.5rem 1rem' }}>Menu</button>
        </div>
      )}
    </div>
  );
};

export default HUD;
