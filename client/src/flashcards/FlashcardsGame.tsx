import { useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

interface FlashcardsGameProps {
  onBack: () => void;
}

interface Flashcard {
  id: string;
  front: string;
  back: string;
}

const STORAGE_KEY = "flashcards:deck";

const createCardId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const parseUploadedJson = (content: string): Flashcard[] => {
  const parsed = JSON.parse(content) as unknown;
  const source = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === "object"
      ? (parsed as Record<string, unknown>).cards ??
        (parsed as Record<string, unknown>).flashcards ??
        (parsed as Record<string, unknown>).questions
      : null;

  if (!Array.isArray(source)) {
    return [];
  }

  return source.flatMap((item) => {
    if (!item || typeof item !== "object") {
      return [];
    }

    const record = item as Record<string, unknown>;
    const front = record.front ?? record.prompt ?? record.question;
    const back = record.back ?? record.answer ?? record.answers;
    const backText = Array.isArray(back) ? back.join("\n") : back;

    if (typeof front !== "string" || typeof backText !== "string") {
      return [];
    }

    return [{
      id: createCardId(),
      front: front.trim(),
      back: backText.trim(),
    }];
  }).filter((card) => card.front && card.back);
};

const parseUploadedText = (content: string): Flashcard[] =>
  content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => {
      const separator = line.includes("\t") ? "\t" : ",";
      const separatorIndex = line.indexOf(separator);

      if (separatorIndex < 0) {
        return [];
      }

      const front = line.slice(0, separatorIndex).trim();
      const back = line.slice(separatorIndex + 1).trim();

      if (!front || !back) {
        return [];
      }

      return [{ id: createCardId(), front, back }];
    });

const loadSavedCards = (): Flashcard[] => {
  if (typeof localStorage === "undefined") {
    return [];
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return [];
    }

    const parsed = JSON.parse(saved) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((card): card is Flashcard =>
      card &&
      typeof card === "object" &&
      typeof (card as Flashcard).id === "string" &&
      typeof (card as Flashcard).front === "string" &&
      typeof (card as Flashcard).back === "string"
    );
  } catch {
    return [];
  }
};

const saveCards = (cards: Flashcard[]): void => {
  if (typeof localStorage === "undefined") {
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
};

export const FlashcardsGame = ({ onBack }: FlashcardsGameProps): JSX.Element => {
  const [cards, setCards] = useState<Flashcard[]>(() => loadSavedCards());
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [importMessage, setImportMessage] = useState("");
  const current = cards[index];
  const total = cards.length;
  const sampleFormat = useMemo(() => "Front text,Back text", []);

  const updateCards = (nextCards: Flashcard[]): void => {
    setCards(nextCards);
    saveCards(nextCards);
    setIndex((currentIndex) => Math.min(currentIndex, Math.max(nextCards.length - 1, 0)));
    setIsFlipped(false);
  };

  const handleAddCard = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const trimmedFront = front.trim();
    const trimmedBack = back.trim();

    if (!trimmedFront || !trimmedBack) {
      return;
    }

    updateCards([...cards, { id: createCardId(), front: trimmedFront, back: trimmedBack }]);
    setFront("");
    setBack("");
    setImportMessage("");
  };

  const handleUpload = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result ?? "");
      let importedCards: Flashcard[] = [];

      try {
        importedCards = file.name.toLowerCase().endsWith(".json")
          ? parseUploadedJson(content)
          : parseUploadedText(content);
      } catch {
        setImportMessage("Could not read that file. Use JSON, CSV, or tab-separated text.");
        return;
      }

      if (!importedCards.length) {
        setImportMessage("No flashcards found. Use front/back, prompt/back, question/answer, CSV, or tab-separated text.");
        return;
      }

      updateCards([...cards, ...importedCards]);
      setIndex(cards.length);
      setImportMessage(`Imported ${importedCards.length} card${importedCards.length === 1 ? "" : "s"}.`);
    };
    reader.readAsText(file);
  };

  const handleShuffle = (): void => {
    const shuffled = [...cards];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    updateCards(shuffled);
    setIndex(0);
  };

  const handleDeleteCurrent = (): void => {
    if (!current) {
      return;
    }

    const nextCards = cards.filter((card) => card.id !== current.id);
    updateCards(nextCards);
  };

  const handleClear = (): void => {
    updateCards([]);
    setImportMessage("");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Flashcards</h1>
            <p className="text-sm text-slate-400">
              Create your own deck or upload JSON, CSV, or tab-separated cards.
            </p>
          </div>
          <button
            className="self-start rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-200"
            type="button"
            onClick={onBack}
          >
            Back to games
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="flex flex-col items-center gap-6">
            <div className="text-sm text-slate-400">
              {total ? `${index + 1} / ${total}` : "No cards yet"}
            </div>
            <button
              type="button"
              onClick={() => current && setIsFlipped((prev) => !prev)}
              className="group relative w-full max-w-xl"
              disabled={!current}
              style={{ perspective: "1200px" }}
            >
              <div
                className="relative h-64 w-full rounded-3xl border border-slate-800 bg-slate-900/70 p-8 text-left shadow-lg transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-amber-400/70 disabled:opacity-70"
                style={{
                  transformStyle: "preserve-3d",
                  transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                }}
              >
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center gap-4 overflow-y-auto px-8 text-center"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <div className="text-xs uppercase tracking-[0.3em] text-slate-500">Front</div>
                  <div className="whitespace-pre-wrap text-lg text-slate-100">
                    {current?.front ?? "Add or upload flashcards to start studying."}
                  </div>
                  {current && <div className="text-sm text-slate-400">Tap to reveal</div>}
                </div>
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center gap-4 overflow-y-auto px-8 text-center"
                  style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                >
                  <div className="text-xs uppercase tracking-[0.3em] text-amber-300">Back</div>
                  <div className="whitespace-pre-wrap text-base text-slate-100">{current?.back}</div>
                </div>
              </div>
            </button>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-100 disabled:opacity-40"
                type="button"
                onClick={() => {
                  if (index === 0) return;
                  setIndex((prev) => prev - 1);
                  setIsFlipped(false);
                }}
                disabled={index === 0 || total === 0}
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
                disabled={index >= total - 1 || total === 0}
              >
                Next
              </button>
              <button
                className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-100 disabled:opacity-40"
                type="button"
                onClick={handleShuffle}
                disabled={total < 2}
              >
                Shuffle
              </button>
              <button
                className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-100 disabled:opacity-40"
                type="button"
                onClick={handleDeleteCurrent}
                disabled={!current}
              >
                Delete
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <form className="rounded-xl border border-slate-800 bg-slate-900/60 p-4" onSubmit={handleAddCard}>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Create Card</div>
              <label className="mt-4 flex flex-col gap-2 text-sm">
                <span className="text-slate-300">Front</span>
                <textarea
                  className="min-h-24 resize-y rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                  value={front}
                  onChange={(event) => setFront(event.target.value)}
                />
              </label>
              <label className="mt-4 flex flex-col gap-2 text-sm">
                <span className="text-slate-300">Back</span>
                <textarea
                  className="min-h-24 resize-y rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                  value={back}
                  onChange={(event) => setBack(event.target.value)}
                />
              </label>
              <button
                className="mt-4 w-full rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-900 disabled:opacity-40"
                type="submit"
                disabled={!front.trim() || !back.trim()}
              >
                Add Card
              </button>
            </form>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Upload Deck</div>
              <p className="mt-3 text-sm text-slate-400">
                Import JSON arrays or simple text files with one card per line.
              </p>
              <div className="mt-3 rounded-lg bg-slate-950 px-3 py-2 font-mono text-xs text-slate-300">
                {sampleFormat}
              </div>
              <label className="mt-4 flex cursor-pointer justify-center rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-100">
                Upload file
                <input
                  className="sr-only"
                  type="file"
                  accept=".json,.csv,.txt,text/csv,application/json,text/plain"
                  onChange={handleUpload}
                />
              </label>
              {importMessage && (
                <div className="mt-3 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300">
                  {importMessage}
                </div>
              )}
            </div>

            <button
              className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-100 disabled:opacity-40"
              type="button"
              onClick={handleClear}
              disabled={total === 0}
            >
              Clear Deck
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
