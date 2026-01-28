import { ActionType } from "../../../shared/types";

export const actionButtons = [
  { label: "Income", type: ActionType.Income, className: "bg-emerald-400 text-slate-900" },
  { label: "Foreign Aid", type: ActionType.ForeignAid, className: "bg-lime-300 text-slate-900" },
  { label: "Tax", type: ActionType.Tax, className: "bg-amber-300 text-slate-900" },
  { label: "Steal", type: ActionType.Steal, className: "bg-sky-300 text-slate-900" },
  { label: "Assassinate", type: ActionType.Assassinate, className: "bg-rose-500 text-white" },
  { label: "Exchange", type: ActionType.Exchange, className: "bg-violet-300 text-slate-900" },
  { label: "Coup", type: ActionType.Coup, className: "bg-red-600 text-white" },
];

export const targetActions = new Set<ActionType>([
  ActionType.Steal,
  ActionType.Assassinate,
  ActionType.Coup,
]);
