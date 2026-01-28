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
  <div className="flex flex-wrap gap-2">
    {actionButtons.map((action) => {
      const needsTarget = targetActions.has(action.type);
      const isDisabled = needsTarget && !hasTargets;
      return (
        <button
          key={action.type}
          className={`rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wide ${action.className} ${isDisabled ? "cursor-not-allowed opacity-40" : ""}`}
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
