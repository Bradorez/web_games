import { motion } from "framer-motion";
import { CardType } from "../../../shared/types";

interface CardProps {
  id: string;
  type: CardType;
  isFaceUp: boolean;
  onClick?: () => void;
}

const getFaceUp = (type: CardType, isFaceUp: boolean): boolean =>
  isFaceUp && type !== CardType.Unknown;

export const Card = ({ id, type, isFaceUp, onClick }: CardProps): JSX.Element => {
  const faceUp = getFaceUp(type, isFaceUp);
  const baseClasses =
    "flex h-28 w-20 items-center justify-center rounded-lg border text-sm font-semibold shadow";
  const frontClasses = "bg-amber-100 border-amber-300 text-slate-900";
  const backClasses = "bg-slate-900 border-slate-700 text-slate-200";

  return (
    <motion.div
      layoutId={`card-${id}`}
      className={`${baseClasses} ${faceUp ? frontClasses : backClasses}`}
      onClick={onClick}
    >
      {faceUp ? type : "Card Back"}
    </motion.div>
  );
};
