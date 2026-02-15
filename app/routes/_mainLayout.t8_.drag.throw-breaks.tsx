import { useCallback, useEffect, useRef, useState } from 'react';
import { type MetaFunction } from 'react-router';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ContentContainer } from '~/components/ContentContainer';
import { generateMetaTags } from '~/utils/seoUtils';

type ThrowBreak = '1' | '2' | '1+2';

type ThrowData = {
  id: string;
  name: string;
  command: string;
  breakWith: ThrowBreak;
  description?: string;
};

type Stats = {
  totalAttempts: number;
  correct: number;
  incorrect: number;
  reactionTimes: number[];
};

type LastResult = {
  correct: boolean;
  reactionTime: number;
};

const throws: ThrowData[] = [
  {
    id: 'generic-1',
    name: 'Generic 1 Throw',
    command: '2+4',
    breakWith: '1',
    description: 'Left throw - break with 1',
  },
  {
    id: 'generic-2',
    name: 'Generic 2 Throw',
    command: '1+3',
    breakWith: '2',
    description: 'Right throw - break with 2',
  },
  {
    id: 'drag-df1+3',
    name: 'Dragunov df+1+3',
    command: 'df+1+3',
    breakWith: '1+2',
    description: 'Command throw - break with 1+2',
  },
  {
    id: 'drag-d2+4',
    name: 'Dragunov d+2+4',
    command: 'd+2+4',
    breakWith: '1+2',
    description: 'Command throw - break with 1+2',
  },
  {
    id: 'generic-1-alt',
    name: 'Generic 1 Throw (Alt)',
    command: 'FC 2+4',
    breakWith: '1',
    description: 'Left throw from crouch - break with 1',
  },
  {
    id: 'generic-2-alt',
    name: 'Generic 2 Throw (Alt)',
    command: 'FC 1+3',
    breakWith: '2',
    description: 'Right throw from crouch - break with 2',
  },
];

const initialStats: Stats = {
  totalAttempts: 0,
  correct: 0,
  incorrect: 0,
  reactionTimes: [],
};

export const meta: MetaFunction = ({ matches }) => {
  return generateMetaTags({
    matches,
    title: 'Dragunov Throw Break Practice | TekkenDocs',
    description:
      'Practice breaking throws against Dragunov with reaction time tracking',
    url: '/t8/drag/throw-breaks',
  });
};

export default function ThrowBreakPractice() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentThrow, setCurrentThrow] = useState<ThrowData | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [stats, setStats] = useState<Stats>(initialStats);
  const [lastResult, setLastResult] = useState<LastResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const waitingForInput = useRef(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showNextThrow = useCallback(() => {
    const randomThrow = throws[Math.floor(Math.random() * throws.length)];
    setCurrentThrow(randomThrow);
    setStartTime(Date.now());
    waitingForInput.current = true;
  }, []);

  const handleBreakAttempt = useCallback(
    (userInput: ThrowBreak) => {
      if (!currentThrow || !startTime || !waitingForInput.current) return;
      waitingForInput.current = false;

      const reactionTime = Date.now() - startTime;
      const isCorrect = userInput === currentThrow.breakWith;

      setStats((prev) => ({
        totalAttempts: prev.totalAttempts + 1,
        correct: prev.correct + (isCorrect ? 1 : 0),
        incorrect: prev.incorrect + (isCorrect ? 0 : 1),
        reactionTimes: isCorrect
          ? [...prev.reactionTimes, reactionTime]
          : prev.reactionTimes,
      }));

      setLastResult({ correct: isCorrect, reactionTime });
      setShowResult(true);

      timeoutRef.current = setTimeout(() => {
        setShowResult(false);
        showNextThrow();
      }, 1500);
    },
    [currentThrow, startTime, showNextThrow],
  );

  const startPractice = useCallback(() => {
    setIsPlaying(true);
    setLastResult(null);
    setShowResult(false);
    showNextThrow();
  }, [showNextThrow]);

  const stopPractice = useCallback(() => {
    setIsPlaying(false);
    setCurrentThrow(null);
    setStartTime(null);
    setShowResult(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const resetStats = useCallback(() => {
    setStats(initialStats);
    setLastResult(null);
  }, []);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isPlaying || !currentThrow) return;

      let userInput: ThrowBreak | null = null;

      if (e.key === '1') userInput = '1';
      else if (e.key === '2') userInput = '2';
      else if (e.key === '3') userInput = '1+2';

      if (userInput) {
        handleBreakAttempt(userInput);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying, currentThrow, handleBreakAttempt]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const accuracy =
    stats.totalAttempts > 0
      ? Math.round((stats.correct / stats.totalAttempts) * 100)
      : 0;

  const avgReactionTime =
    stats.reactionTimes.length > 0
      ? Math.round(
          stats.reactionTimes.reduce((a, b) => a + b, 0) /
            stats.reactionTimes.length,
        )
      : 0;

  const bestTime =
    stats.reactionTimes.length > 0
      ? Math.min(...stats.reactionTimes)
      : 0;

  return (
    <ContentContainer enableTopPadding enableBottomPadding>
      <div className="mx-auto flex max-w-2xl flex-col items-center">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <img
            src="/t8/avatars/dragunov-512.png"
            alt="Dragunov"
            className="h-16 w-16"
          />
          <h1 className="text-3xl font-bold">Throw Break Practice</h1>
        </div>

        {/* Stats Card */}
        <Card className="mb-6 w-full">
          <CardHeader>
            <CardTitle>Performance Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Accuracy</div>
                <div className="text-lg font-semibold">
                  {stats.correct}/{stats.totalAttempts} ({accuracy}%)
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">
                  Avg Reaction Time
                </div>
                <div className="text-lg font-semibold">
                  {stats.reactionTimes.length > 0
                    ? `${avgReactionTime}ms`
                    : '—'}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Best Time</div>
                <div className="text-lg font-semibold">
                  {stats.reactionTimes.length > 0 ? `${bestTime}ms` : '—'}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">
                  Incorrect
                </div>
                <div className="text-lg font-semibold">{stats.incorrect}</div>
              </div>
            </div>
            {/* Progress bar */}
            {stats.totalAttempts > 0 && (
              <div className="mt-4">
                <div className="h-3 w-full rounded-full bg-text-primary-subtle">
                  <div
                    className="h-full rounded-full bg-text-primary transition-all"
                    style={{ width: `${accuracy}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {!isPlaying ? (
          /* Start Screen */
          <Card className="w-full">
            <CardContent className="pt-6">
              <Button
                onClick={startPractice}
                size="lg"
                className="mb-4 w-full"
              >
                Start Practice
              </Button>
              <Button
                onClick={resetStats}
                variant="outline"
                className="w-full"
              >
                Reset Stats
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Practice Screen */
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-center text-2xl">
                {currentThrow?.name}
              </CardTitle>
              <CardDescription className="text-center text-xl">
                {currentThrow?.command}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Break buttons */}
              <div className="mb-6 flex justify-center gap-4">
                <Button
                  size="lg"
                  onClick={() => handleBreakAttempt('1')}
                  className="px-8 text-2xl"
                >
                  1
                </Button>
                <Button
                  size="lg"
                  onClick={() => handleBreakAttempt('2')}
                  className="px-8 text-2xl"
                >
                  2
                </Button>
                <Button
                  size="lg"
                  onClick={() => handleBreakAttempt('1+2')}
                  className="px-8 text-2xl"
                >
                  1+2
                </Button>
              </div>

              {/* Result feedback */}
              {showResult && lastResult && (
                <div
                  className={`text-center text-xl font-bold ${lastResult.correct ? 'text-green-600' : 'text-red-600'}`}
                >
                  {lastResult.correct ? '✓ Correct!' : '✗ Incorrect'}
                  <div className="text-sm text-muted-foreground">
                    {lastResult.reactionTime}ms
                  </div>
                </div>
              )}

              <Button
                onClick={stopPractice}
                variant="outline"
                className="mt-6 w-full"
              >
                Stop Practice
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="mt-6 w-full">
          <CardHeader>
            <CardTitle>How to Practice</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>
              Press the corresponding key (1, 2, or 3 for 1+2) or click the
              buttons to break the throw.
            </p>
            <p className="mt-2">
              Your reaction time will be measured from when the throw appears.
            </p>
          </CardContent>
        </Card>
      </div>
    </ContentContainer>
  );
}
