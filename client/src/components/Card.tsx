import { motion } from "framer-motion";
import { CardType } from "../../../shared/types";
import cardBack from "../assets/cards/back.png";
import assassinImage from "../assets/cards/assasin2.png";
import dukeImage from "../assets/cards/duke2.png";
import contessaImage from "../assets/cards/contessa2.png";
import ambassadorImage from "../assets/cards/ambassador.png";
import captainImage from "../assets/cards/captain.png";

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
    "flex h-56 w-40 items-center justify-center rounded-lg border text-lg font-semibold shadow-lg";
  const frontClasses = "bg-amber-100 border-amber-300 text-slate-900";
  const backClasses = "bg-slate-900 border-slate-700 text-slate-200";

  return (
    <motion.div
      layoutId={`card-${id}`}
      className={`${baseClasses} ${faceUp ? frontClasses : backClasses}`}
      onClick={onClick}
    >
      {faceUp ? (
        type === CardType.Assassin ? (
          <img src={assassinImage} alt="Assassin" className="h-full w-full rounded-lg object-cover" />
        ) : type === CardType.Duke ? (
          <img src={dukeImage} alt="Duke" className="h-full w-full rounded-lg object-cover" />
        ) : type === CardType.Ambassador ? (
          <img src={ambassadorImage} alt="Ambassador" className="h-full w-full rounded-lg object-cover" />
        ) : type === CardType.Captain ? (
          <img src={captainImage} alt="Captain" className="h-full w-full rounded-lg object-cover" />
        ) : type === CardType.Contessa ? (
          <img src={contessaImage} alt="Contessa" className="h-full w-full rounded-lg object-cover" />
        ) : (
          type
        )
      ) : (
        <img src={cardBack} alt="Card back" className="h-full w-full rounded-lg object-cover" />
      )}
    </motion.div>
  );
};
