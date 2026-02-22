import { initialCards as prodCards } from "./cards.prod.js";
import { initialCards as devCards } from "./cards.dev.js";

export const initialCards = import.meta.env.MODE === "production"
  ? prodCards
  : devCards;
