import { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";

type Trial = {
  symbol: string;
  isTarget: boolean;
};

type GameMode = "practice" | "scored";

function createSeededTrials(seed: number): Trial[] {
  let state = seed >>> 0;

  const random = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };

  const sequence: Trial[] = Array.from({ length: 30 }, (_, index) => ({
    symbol: index % 5 < 3 ? "🎯" : "🔵",
    isTarget: index % 5 < 3,
  }));

  for (let i = sequence.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [sequence[i], sequence[j]] = [sequence[j], sequence[i]];
  }

  return sequence;
}

const TRIAL_SEED = 20261019;
const trials = createSeededTrials(TRIAL_SEED);

const practiceTrials: Trial[] = [
  { symbol: "🎯", isTarget: true },
  { symbol: "🔵", isTarget: false },
  { symbol: "🎯", isTarget: true },
  { symbol: "🔵", isTarget: false },
  { symbol: "🎯", isTarget: true },
];

const RESPONSE_WINDOW = 1000;
const FEEDBACK_WINDOW = 500;

function App() {
  const [started, setStarted] = useState(false);
  const [trialIndex, setTrialIndex] = useState(0);
  const [feedback, setFeedback] = useState("Press Start to begin!");
  const [correct, setCorrect] = useState(0);
  const [missed, setMissed] = useState(0);
  const [falseAlarms, setFalseAlarms] = useState(0);
  const [withheld, setWithheld] = useState(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [finished, setFinished] = useState(false);
  const [paused, setPaused] = useState(false);
  const [gameMode, setGameMode] = useState<GameMode>("practice");

  const currentTrials =
    gameMode === "practice" ? practiceTrials : trials;

  const gameModeRef = useRef<GameMode>("practice");
  const displayTime = useRef(0);
  const responded = useRef(false);
  const timeoutRef = useRef<number | null>(null);
  const indexRef = useRef(0);
  const startedRef = useRef(false);
  const pausedRef = useRef(false);
  const remainingRef = useRef(RESPONSE_WINDOW);
  const deadlineRef = useRef(0);
  const phaseRef = useRef<"response" | "feedback">("response");

  const showTrialRef = useRef<(index: number) => void>(() => {});

  const clearTrialTimer = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const finishGame = useCallback(() => {
    clearTrialTimer();

    if (gameModeRef.current === "practice") {
      gameModeRef.current = "scored";
      setGameMode("scored");

      
      setCorrect(0);
      setMissed(0);
      setFalseAlarms(0);
      setWithheld(0);
      setReactionTimes([]);
      setTrialIndex(0);
      setFeedback("Practice completed! Starting scored session...");

      
      timeoutRef.current = window.setTimeout(() => {
        if (startedRef.current && !pausedRef.current) {
          showTrialRef.current(0);
        }
      }, 0);

      return;
    }

    startedRef.current = false;
setStarted(false);
setFinished(true);
setFeedback("Scored session completed!");

const sortedReactionTimes = [...reactionTimes].sort(
  (a, b) => a - b
);

const middle = Math.floor(sortedReactionTimes.length / 2);

const medianReactionTime =
  sortedReactionTimes.length === 0
    ? 0
    : sortedReactionTimes.length % 2 === 0
      ? Math.round(
          (sortedReactionTimes[middle - 1] +
            sortedReactionTimes[middle]) /
            2
        )
      : sortedReactionTimes[middle];

const result = {
  seed: TRIAL_SEED,
  totalTrials: trials.length,
  targetCount: trials.filter((trial) => trial.isTarget).length,
  correctTargetResponses: correct,
  missedTargets: missed,
  falseAlarms,
  correctWithholding: withheld,
  targetAccuracy: Math.round(
    (correct / trials.filter((trial) => trial.isTarget).length) * 100
  ),
  medianReactionTimeMs: medianReactionTime,
  completedAt: new Date().toISOString(),
};

try {
  const savedResults = JSON.parse(
    localStorage.getItem("reflex-rush-results") || "[]"
  );

  savedResults.push(result);

  localStorage.setItem(
    "reflex-rush-results",
    JSON.stringify(savedResults)
  );
} catch {
  console.error("Could not save session results.");
}
  }, [clearTrialTimer]);

  const showTrial = useCallback(
    (index: number) => {
      clearTrialTimer();

      const activeTrials =
        gameModeRef.current === "practice" ? practiceTrials : trials;

      if (index >= activeTrials.length) {
        finishGame();
        return;
      }

      indexRef.current = index;
      responded.current = false;
      phaseRef.current = "response";
      remainingRef.current = RESPONSE_WINDOW;
      displayTime.current = performance.now();

      setTrialIndex(index);
      setFeedback(
        gameModeRef.current === "practice"
          ? "Practice: Press SPACE for 🎯. Withhold for 🔵."
          : "Scored session: Press SPACE for 🎯. Withhold for 🔵."
      );

      deadlineRef.current = performance.now() + RESPONSE_WINDOW;

      timeoutRef.current = window.setTimeout(() => {
        if (!startedRef.current || pausedRef.current) return;
        if (responded.current) return;

        responded.current = true;

        if (activeTrials[index].isTarget) {
          setMissed((value) => value + 1);
          setFeedback("Missed target!");
        } else {
          setWithheld((value) => value + 1);
          setFeedback("Correct withholding!");
        }

        phaseRef.current = "feedback";

        timeoutRef.current = window.setTimeout(() => {
          if (startedRef.current && !pausedRef.current) {
            showTrialRef.current(index + 1);
          }
        }, FEEDBACK_WINDOW);
      }, RESPONSE_WINDOW);
    },
    [clearTrialTimer, finishGame]
  );

  showTrialRef.current = showTrial;

  const startGame = useCallback(() => {
    clearTrialTimer();

    gameModeRef.current = "practice";
    setGameMode("practice");

    setCorrect(0);
    setMissed(0);
    setFalseAlarms(0);
    setWithheld(0);
    setReactionTimes([]);
    setTrialIndex(0);
    setFinished(false);
    setPaused(false);
    setStarted(true);
    setFeedback("Starting practice round...");

    startedRef.current = true;
    pausedRef.current = false;
    responded.current = false;
    remainingRef.current = RESPONSE_WINDOW;

    showTrialRef.current(0);
  }, [
  clearTrialTimer,
  correct,
  missed,
  falseAlarms,
  withheld,
  reactionTimes,
]);

  const restartGame = useCallback(() => {
    startGame();
  }, [startGame]);

  const exportResults = useCallback(() => {
  const savedResults = localStorage.getItem("reflex-rush-results");

  const blob = new Blob([savedResults || "[]"], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "reflex-rush-results.json";
  link.click();

  URL.revokeObjectURL(url);
}, []);

  const handleResponse = useCallback(() => {
    if (
      !startedRef.current ||
      pausedRef.current ||
      responded.current ||
      phaseRef.current !== "response"
    ) {
      return;
    }

    const now = performance.now();

    if (now > deadlineRef.current) return;

    const activeTrials =
      gameModeRef.current === "practice" ? practiceTrials : trials;
    const currentTrial = activeTrials[indexRef.current];

    if (!currentTrial) return;

    responded.current = true;
    clearTrialTimer();

    const reactionTime = Math.round(now - displayTime.current);

    if (currentTrial.isTarget) {
      setCorrect((value) => value + 1);
      setReactionTimes((value) => [...value, reactionTime]);
      setFeedback(`Correct! Reaction time: ${reactionTime} ms`);
    } else {
      setFalseAlarms((value) => value + 1);
      setFeedback("False alarm!");
    }

    phaseRef.current = "feedback";

    timeoutRef.current = window.setTimeout(() => {
      if (startedRef.current && !pausedRef.current) {
        showTrialRef.current(indexRef.current + 1);
      }
    }, FEEDBACK_WINDOW);
  }, [clearTrialTimer]);

  const togglePause = useCallback(() => {
    if (!startedRef.current) return;

    if (!pausedRef.current) {
      if (phaseRef.current === "response") {
        remainingRef.current = Math.max(
          0,
          deadlineRef.current - performance.now()
        );
      }

      clearTrialTimer();
      pausedRef.current = true;
      setPaused(true);
      setFeedback("Game paused. Press Resume when ready.");
      return;
    }

    pausedRef.current = false;
    setPaused(false);

    if (phaseRef.current === "response") {
     
      displayTime.current =
        performance.now() - (RESPONSE_WINDOW - remainingRef.current);

      deadlineRef.current = performance.now() + remainingRef.current;

      timeoutRef.current = window.setTimeout(() => {
        if (!startedRef.current || pausedRef.current) return;
        if (responded.current) return;

        responded.current = true;

        const activeTrials =
          gameModeRef.current === "practice" ? practiceTrials : trials;

        if (activeTrials[indexRef.current].isTarget) {
          setMissed((value) => value + 1);
          setFeedback("Missed target!");
        } else {
          setWithheld((value) => value + 1);
          setFeedback("Correct withholding!");
        }

        phaseRef.current = "feedback";

        timeoutRef.current = window.setTimeout(() => {
          if (startedRef.current && !pausedRef.current) {
            showTrialRef.current(indexRef.current + 1);
          }
        }, FEEDBACK_WINDOW);
      }, remainingRef.current);

      setFeedback("Game resumed! Respond now.");
    } else {
      setFeedback("Game resumed!");

      timeoutRef.current = window.setTimeout(() => {
        if (startedRef.current && !pausedRef.current) {
          showTrialRef.current(indexRef.current + 1);
        }
      }, FEEDBACK_WINDOW);
    }
  }, [clearTrialTimer]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.code === "Space") {
        event.preventDefault();

        if (!event.repeat) {
          handleResponse();
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      clearTrialTimer();
    };
  }, [handleResponse, clearTrialTimer]);

  const targetCount = trials.filter((trial) => trial.isTarget).length;
  const accuracy =
    targetCount > 0 ? Math.round((correct / targetCount) * 100) : 0;

  const sortedTimes = [...reactionTimes].sort((a, b) => a - b);
  const middle = Math.floor(sortedTimes.length / 2);

  const median =
    sortedTimes.length === 0
      ? 0
      : sortedTimes.length % 2 === 0
        ? Math.round(
            (sortedTimes[middle - 1] + sortedTimes[middle]) / 2
          )
        : sortedTimes[middle];

  return (
    <div className="app">
      <main className="home-card">
        <p className="tagline">ATTENTION & REACTION</p>
        <h1>Reflex Rush</h1>

        {!started && !finished && (
          <>
            <p className="description">
              Press SPACE for 🎯. Do not respond to 🔵.
              Each trial has a one-second response window.
              A short practice round comes first.
            </p>

            <button className="start-button" onClick={startGame}>
              Start Practice
            </button>
          </>
        )}

        {started && (
          <>
            
<div className="game-status">
  <span className="mode-badge">
    {gameMode === "practice" ? "PRACTICE MODE" : "SCORED SESSION"}
  </span>
  <span className="trial-count">
    TRIAL {Math.min(trialIndex + 1, currentTrials.length)} / {currentTrials.length}
  </span>
</div>

<div
  className="progress-track"
  role="progressbar"
  aria-label="Trial progress"
  aria-valuemin={0}
  aria-valuemax={currentTrials.length}
  aria-valuenow={trialIndex}
>
  <div
    className="progress-fill"
    style={{
      width: `${(trialIndex / currentTrials.length) * 100}%`,
    }}
  />
</div>


            <div className="symbol">
              {paused ? "⏸️" : currentTrials[trialIndex]?.symbol}
            </div>

            <p>{feedback}</p>

            <button
              className="start-button"
              onClick={handleResponse}
              disabled={paused}
            >
              Respond (SPACE)
            </button>

            <button className="pause-button" onClick={togglePause}>
              {paused ? "Resume ▶" : "Pause ⏸"}
            </button>

            <button
              className="restart-button"
              onClick={restartGame}
            >
              Restart Session ↻
            </button>
          </>
        )}

        
{finished && (
  <>
    <div className="summary-heading">
      <span className="mode-badge">SESSION COMPLETED</span>
      <h2>Your Performance</h2>
      <p>Every session is a chance to improve your focus.</p>
    </div>

    <div className="score-grid">
      <div className="score-card score-highlight">
        <span className="score-label">TARGET ACCURACY</span>
        <strong>{accuracy}%</strong>
        <span className="score-detail">Correct target responses</span>
      </div>

      <div className="score-card">
        <span className="score-label">MEDIAN REACTION</span>
        <strong>{median}<small> ms</small></strong>
        <span className="score-detail">Response speed</span>
      </div>

      <div className="score-card">
        <span className="score-label">MISSED TARGETS</span>
        <strong>{missed}</strong>
        <span className="score-detail">Targets not answered</span>
      </div>

      <div className="score-card">
        <span className="score-label">FALSE ALARMS</span>
        <strong>{falseAlarms}</strong>
        <span className="score-detail">Responses to non-targets</span>
      </div>

      <div className="score-card">
        <span className="score-label">CORRECT RESPONSES</span>
        <strong>{correct}</strong>
        <span className="score-detail">Targets detected</span>
      </div>

      <div className="score-card">
        <span className="score-label">CORRECT WITHHOLDING</span>
        <strong>{withheld}</strong>
        <span className="score-detail">Non-targets ignored</span>
      </div>
    </div>

    <div className="summary-actions">
      <button className="start-button" onClick={exportResults}>
        Export Results ↓
      </button>
      <button className="restart-button" onClick={startGame}>
        Play Again ↻
      </button>
    </div>
  </>
)}


        <p className="footer-note">
          Educational prototype 
        </p>
      </main>
    </div>
  );
}

export default App;