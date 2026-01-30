import { ActionType } from "../../../shared/types";
import { actionButtons, targetActions } from "./actionConfig";

interface ActionButtonGridProps {
  hasTargets: boolean;
  onSelect: (actionType: ActionType, needsTarget: boolean) => void;
}

export const ActionButtonGrid = ({
  hasTargets,
  onSelect,
}: ActionButtonGridProps): JSX.Element => (
  <div className="grid grid-cols-3 gap-2">
    {actionButtons.map((action) => {
      const needsTarget = targetActions.has(action.type);
      const isDisabled = needsTarget && !hasTargets;
      return (
        <button
          key={action.type}
          className={`w-full min-h-[44px] rounded-lg px-2 py-2 text-[11px] font-semibold uppercase leading-snug tracking-wide text-center whitespace-normal ${action.className} ${isDisabled ? "cursor-not-allowed opacity-40" : ""}`}
          onClick={() => {
            if (isDisabled) return;
            onSelect(action.type, needsTarget);
          }}
          type="button"
        >
          {action.label}
        </button>
      );
    })}
  </div>
);
