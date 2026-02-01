import { motion } from "framer-motion";
import { CardType } from "../../../shared/types";
import cardBack from "../assets/cards/back.png";
import assassinImage from "../assets/cards/assasin2.png";
import dukeImage from "../assets/cards/duke2.png";
import contessaImage from "../assets/cards/contessa2.png";
import ambassadorImage from "../assets/cards/ambassador.png";
import captainImage from "../assets/cards/captain.png";
import deadImage from "../assets/cards/dead.png";

interface CardProps {
  id: string;
  type: CardType;
  isFaceUp: boolean;
  onClick?: () => void;
  dimmed?: boolean;
  showDeadIcon?: boolean;
}

const getFaceUp = (type: CardType, isFaceUp: boolean): boolean =>
  isFaceUp && type !== CardType.Unknown;

export const Card = ({ id, type, isFaceUp, onClick, dimmed, showDeadIcon }: CardProps): JSX.Element => {
  const faceUp = getFaceUp(type, isFaceUp);
  const baseClasses =
    "relative flex h-56 w-40 items-center justify-center rounded-md border border-amber-300 text-lg font-semibold shadow-lg";
  const frontClasses = "bg-amber-100 text-slate-900";
  const backClasses = "bg-slate-900 text-slate-200";
  const dimmedClasses = dimmed ? "opacity-70 grayscale" : "";

  return (
    <motion.div
      layoutId={`card-${id}`}
      className={baseClasses}
      onClick={onClick}
    >
      <div className={`${faceUp ? frontClasses : backClasses} ${dimmedClasses} h-full w-full rounded-md`}>
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
      </div>
      {showDeadIcon && (
        <div
          className="pointer-events-none absolute right-1 top-1 z-20 h-8 w-8 rounded-full bg-slate-950/70"
          style={{ backgroundImage: `url(${deadImage})`, backgroundSize: "contain", backgroundRepeat: "no-repeat", backgroundPosition: "center" }}
          aria-label="Dead"
        />
      )}
    </motion.div>
  );
};
