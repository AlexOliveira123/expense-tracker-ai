import { Expense } from "./types";
import { generateId } from "./utils";
import { format, subDays } from "date-fns";

function d(daysAgo: number) {
  return format(subDays(new Date(), daysAgo), "yyyy-MM-dd");
}

export const SEED_EXPENSES: Expense[] = [
  { id: generateId(), date: d(1), amount: 12.5, category: "Food", description: "Coffee and bagel at Blue Bottle", createdAt: new Date().toISOString() },
  { id: generateId(), date: d(2), amount: 45.0, category: "Transportation", description: "Monthly subway pass top-up", createdAt: new Date().toISOString() },
  { id: generateId(), date: d(3), amount: 89.99, category: "Shopping", description: "New running shoes", createdAt: new Date().toISOString() },
  { id: generateId(), date: d(4), amount: 34.5, category: "Food", description: "Dinner with friends at Thai Kitchen", createdAt: new Date().toISOString() },
  { id: generateId(), date: d(5), amount: 14.99, category: "Entertainment", description: "Netflix subscription", createdAt: new Date().toISOString() },
  { id: generateId(), date: d(6), amount: 120.0, category: "Bills", description: "Electric bill — May", createdAt: new Date().toISOString() },
  { id: generateId(), date: d(8), amount: 22.3, category: "Food", description: "Groceries — Trader Joe's", createdAt: new Date().toISOString() },
  { id: generateId(), date: d(10), amount: 9.99, category: "Entertainment", description: "Spotify Premium", createdAt: new Date().toISOString() },
  { id: generateId(), date: d(12), amount: 250.0, category: "Shopping", description: "Winter jacket — Uniqlo", createdAt: new Date().toISOString() },
  { id: generateId(), date: d(15), amount: 65.0, category: "Transportation", description: "Uber rides this week", createdAt: new Date().toISOString() },
  { id: generateId(), date: d(18), amount: 18.75, category: "Food", description: "Lunch — sushi takeout", createdAt: new Date().toISOString() },
  { id: generateId(), date: d(20), amount: 55.0, category: "Bills", description: "Internet bill", createdAt: new Date().toISOString() },
  { id: generateId(), date: d(22), amount: 42.0, category: "Entertainment", description: "Movie tickets × 2", createdAt: new Date().toISOString() },
  { id: generateId(), date: d(25), amount: 8.5, category: "Other", description: "Parking meter", createdAt: new Date().toISOString() },
  { id: generateId(), date: d(30), amount: 76.4, category: "Food", description: "Weekly groceries", createdAt: new Date().toISOString() },
  { id: generateId(), date: d(35), amount: 30.0, category: "Transportation", description: "Gas fill-up", createdAt: new Date().toISOString() },
  { id: generateId(), date: d(40), amount: 200.0, category: "Bills", description: "Phone bill", createdAt: new Date().toISOString() },
  { id: generateId(), date: d(45), amount: 15.99, category: "Entertainment", description: "Amazon Prime", createdAt: new Date().toISOString() },
  { id: generateId(), date: d(50), amount: 130.0, category: "Shopping", description: "Desk accessories", createdAt: new Date().toISOString() },
  { id: generateId(), date: d(55), amount: 28.0, category: "Food", description: "Brunch at weekend cafe", createdAt: new Date().toISOString() },
];
