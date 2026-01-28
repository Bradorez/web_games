import { ActionType, Player } from "../../../shared/types";

interface TargetPickerProps {
  actionType: ActionType;
  targets: Player[];
  onSelect: (playerId: string) => void;
  onCancel: () => void;
}

const getActionLabel = (actionType: ActionType): string => {
  switch (actionType) {
    case ActionType.Steal:
      return "Steal";
    case ActionType.Assassinate:
      return "Assassinate";
    case ActionType.Coup:
      return "Coup";
    default:
      return "Action";
  }
};

export const TargetPicker = ({
  actionType,
  targets,
  onSelect,
  onCancel,
}: TargetPickerProps): JSX.Element => (
  <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
    <div className="text-sm text-slate-300">
      Choose a target for {getActionLabel(actionType)}:
    </div>
    <div className="mt-3 flex flex-wrap gap-2">
      {targets.map((player) => (
        <button
          key={player.id}
          className="rounded-lg bg-slate-700 px-3 py-2 text-xs font-semibold text-slate-100"
          onClick={() => onSelect(player.id)}
          type="button"
        >
          {player.name} {player.isBot ? "(AI)" : ""}
        </button>
      ))}
    </div>
    <button
      className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-400"
      type="button"
      onClick={onCancel}
    >
      Cancel
    </button>
  </div>
);
