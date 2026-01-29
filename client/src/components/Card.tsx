import { motion } from "framer-motion";
import { CardType } from "../../../shared/types";
import cardBack from "../assets/cards/back.png";

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
    "flex h-52 w-36 items-center justify-center rounded-2xl border text-lg font-semibold shadow";
  const frontClasses = "bg-amber-100 border-amber-300 text-slate-900";
  const backClasses = "bg-slate-900 border-slate-700 text-slate-200";

  return (
    <motion.div
      layoutId={`card-${id}`}
      className={`${baseClasses} ${faceUp ? frontClasses : backClasses}`}
      onClick={onClick}
    >
      {faceUp ? (
        type
      ) : (
        <img src={cardBack} alt="Card back" className="h-full w-full rounded-2xl object-cover" />
      )}
    </motion.div>
  );
};
