import { useState, useCallback } from 'react';
import CaneNinjaCanvas from './CaneNinjaCanvas';

const CaneNinjaGame = () => {
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [highScore, setHighScore] = useState(0);

  const handleScoreChange = useCallback((newScore: number) => {
    setScore(newScore);
    if (newScore > highScore) {
      setHighScore(newScore);
    }
  }, [highScore]);

  const handleGameOver = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const startGame = useCallback(() => {
    setScore(0);
    setIsPlaying(true);
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="flex justify-between w-full max-w-2xl mb-4">
        <div className="text-xl font-bold">
          Score: {score}
        </div>
        <div className="text-xl font-bold">
          High Score: {highScore}
        </div>
      </div>

      <div className="relative w-[800px] h-[600px]">
        <CaneNinjaCanvas
          onScoreChange={handleScoreChange}
          onGameOver={handleGameOver}
          isPlaying={isPlaying}
        />
        
        {!isPlaying && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 rounded-lg">
            <h2 className="text-3xl font-bold text-white mb-4">
              {score > 0 ? 'Game Over!' : 'Cane Ninja'}
            </h2>
            <p className="text-xl text-white mb-8">
              {score > 0 ? `Final Score: ${score}` : 'Hit the falling targets with your cane!'}
            </p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              {score > 0 ? 'Play Again' : 'Start Game'}
            </button>
          </div>
        )}
      </div>

      <div className="text-center text-gray-600 mt-4">
        <p>Use your mouse to move the cane and hit the falling targets!</p>
      </div>
    </div>
  );
};

export default CaneNinjaGame; 