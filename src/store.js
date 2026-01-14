import { create } from 'zustand';
import { COLORS } from './constants';

const useStore = create((set) => ({
    status: 'MENU', // MENU, PLAYING, GAMEOVER
    score: 0,
    highScore: localStorage.getItem('cra_highscore') || 0,
    playerColor: COLORS[0].hex, // Default start

    start: () => set({ status: 'PLAYING', score: 0, playerColor: COLORS[0].hex }),
    gameOver: () => set((state) => {
        const newHigh = Math.max(state.score, state.highScore);
        localStorage.setItem('cra_highscore', newHigh);
        return { status: 'GAMEOVER', highScore: newHigh };
    }),
    reset: () => set({ status: 'MENU', score: 0 }),
    addScore: () => set((state) => ({ score: state.score + 1 })),
    setPlayerColor: (color) => set({ playerColor: color }),
}));

export default useStore;
