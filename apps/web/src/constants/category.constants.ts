import type { TransactionCategory } from "../types/dashboard.types";

export interface CategoryMeta {
  label: string;
  icon: string;
  description: string;
}

export const CATEGORY_METADATA: Record<TransactionCategory, CategoryMeta> = {
  FOOD: { label: "Food & Dining", icon: "🍔", description: "Groceries, cafes, dine-out" },
  SHOPPING: { label: "Shopping", icon: "🛍️", description: "Retail, clothes, gadgets" },
  FUEL: { label: "Fuel & Transport", icon: "⛽", description: "Gas, petrol, public transit" },
  BILLS: { label: "Bills & Utilities", icon: "💡", description: "Electricity, water, rent" },
  ENTERTAINMENT: { label: "Entertainment", icon: "🎬", description: "Movies, games, outings" },
  HEALTH: { label: "Health & Care", icon: "🩺", description: "Medicine, doctor, gym" },
  TRAVEL: { label: "Travel & Vacations", icon: "✈️", description: "Flights, hotels, trips" },
  EDUCATION: { label: "Education", icon: "📚", description: "Courses, books, tuition" },
  SUBSCRIPTION: { label: "Subscriptions", icon: "📱", description: "Netflix, Spotify, SaaS" },
  GIFT: { label: "Gifts & Donations", icon: "🎁", description: "Presents, charities" },
  OTHER: { label: "Other / Misc", icon: "📦", description: "Miscellaneous expenses" },
};
