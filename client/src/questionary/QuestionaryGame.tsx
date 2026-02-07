import { useMemo, useState } from "react";
import questions from "./questions.json";

interface QuestionaryGameProps {
  onBack: () => void;
}

interface QuestionItem {
  id: number;
  question: string;
  answers: string[];
}

interface QuestionaryData {
  source: string;
  questions: QuestionItem[];
}

export const QuestionaryGame = ({ onBack }: QuestionaryGameProps): JSX.Element => {
  const data = useMemo(() => questions as QuestionaryData, []);
  const deck = useMemo(() => {
    const shuffled = [...data.questions];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, [data.questions]);
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const current = deck[index];
  const total = deck.length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Questionary</h1>
            <p className="text-sm text-slate-400">
              Think of your answer, then flip a card.
              <span className="ml-2 text-slate-500">{data.source}</span>
            </p>
          </div>
          <button
            className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-200"
            type="button"
            onClick={onBack}
          >
            Back to games
          </button>
        </div>

        <div className="flex flex-col items-center gap-6">
          <div className="text-sm text-slate-400">
            {index + 1} / {total}
          </div>
          <button
            type="button"
            onClick={() => setIsFlipped((prev) => !prev)}
            className="group relative w-full max-w-xl"
            style={{ perspective: "1200px" }}
          >
            <div
              className="relative h-56 w-full rounded-3xl border border-slate-800 bg-slate-900/70 p-8 text-left shadow-lg transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-amber-400/70"
              style={{
                transformStyle: "preserve-3d",
                transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
              }}
            >
              <div
                className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center"
                style={{ backfaceVisibility: "hidden" }}
              >
                <div className="text-xs uppercase tracking-[0.3em] text-slate-500">Question</div>
                <div className="px-6 text-lg text-slate-100">{current?.question}</div>
                <div className="text-sm text-slate-400">Tap to reveal</div>
              </div>
              <div
                className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center"
                style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
              >
                <div className="text-xs uppercase tracking-[0.3em] text-amber-300">Answer</div>
                <div className="space-y-2 px-8 text-base text-slate-100">
                  {current?.answers.map((answer) => (
                    <div key={answer}>{answer}</div>
                  ))}
                </div>
              </div>
            </div>
          </button>
          <div className="flex items-center gap-3">
            <button
              className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-100 disabled:opacity-40"
              type="button"
              onClick={() => {
                if (index === 0) return;
                setIndex((prev) => prev - 1);
                setIsFlipped(false);
              }}
              disabled={index === 0}
            >
              Previous
            </button>
            <button
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-900 disabled:opacity-40"
              type="button"
              onClick={() => {
                if (index >= total - 1) return;
                setIndex((prev) => prev + 1);
                setIsFlipped(false);
              }}
              disabled={index >= total - 1}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
