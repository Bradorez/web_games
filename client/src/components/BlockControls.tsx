import { ActionType, CardType, PendingAction } from "../../../shared/types";

interface BlockControlsProps {
  pendingAction: PendingAction;
  myPlayerId: string;
  hasPassed: boolean;
  isAlive: boolean;
  onBlock: (claimedCard: CardType) => void;
  onPass: () => void;
  onChallenge?: () => void;
  showPass?: boolean;
  showChallenge?: boolean;
}

const getBlockOptions = (actionType: ActionType): { card: CardType; label: string; className: string }[] => {
  if (actionType === ActionType.ForeignAid) {
    return [{ card: CardType.Duke, label: "Block (Duke)", className: "bg-indigo-400 text-slate-900" }];
  }
  if (actionType === ActionType.Steal) {
    return [
      { card: CardType.Captain, label: "Block (Captain)", className: "bg-sky-300 text-slate-900" },
      { card: CardType.Ambassador, label: "Block (Ambassador)", className: "bg-violet-300 text-slate-900" },
    ];
  }
  if (actionType === ActionType.Assassinate) {
    return [{ card: CardType.Contessa, label: "Block (Contessa)", className: "bg-rose-400 text-slate-900" }];
  }
  return [];
};

const canBlock = (pending: PendingAction, playerId: string): boolean =>
  pending.sourcePlayerId !== playerId;

export const BlockControls = ({
  pendingAction,
  myPlayerId,
  hasPassed,
  isAlive,
  onBlock,
  onPass,
  onChallenge,
  showPass = true,
  showChallenge = false,
}: BlockControlsProps): JSX.Element => {
  const eligible = isAlive && canBlock(pendingAction, myPlayerId);
  const options = getBlockOptions(pendingAction.actionType);

  if (!eligible) {
    return <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-300">Waiting for blocks...</div>;
  }
  if (hasPassed) {
    return <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-300">Waiting for other players...</div>;
  }

  return (
    <div className="flex flex-wrap gap-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
      {options.map((option) => (
        <button key={option.card} className={`rounded-lg px-4 py-2 text-sm font-semibold ${option.className}`} onClick={() => onBlock(option.card)} type="button">{option.label}</button>
      ))}
      {showChallenge && onChallenge && <button className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white" onClick={onChallenge} type="button">Challenge</button>}
      {showPass && <button className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-slate-100" onClick={onPass} type="button">Pass</button>}
    </div>
  );
};
