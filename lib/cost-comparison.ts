export type CostComparisonState = "missing-restaurant" | "home-cheaper" | "similar" | "restaurant-cheaper";

export type CostComparisonSummary = {
  absoluteDifference: number;
  difference: number;
  state: CostComparisonState;
};

export function getCostComparisonSummary({
  homeTotal,
  restaurantTotal,
}: {
  homeTotal: number;
  restaurantTotal: number;
}): CostComparisonSummary {
  const safeHomeTotal = Number.isFinite(homeTotal) ? Math.max(0, homeTotal) : 0;
  const safeRestaurantTotal = Number.isFinite(restaurantTotal) ? Math.max(0, restaurantTotal) : 0;
  const difference = safeRestaurantTotal - safeHomeTotal;
  const absoluteDifference = Math.abs(difference);

  if (safeRestaurantTotal <= 0) {
    return {
      absoluteDifference,
      difference,
      state: "missing-restaurant",
    };
  }

  const similarThreshold = Math.max(1, Math.max(safeHomeTotal, safeRestaurantTotal) * 0.05);

  if (absoluteDifference <= similarThreshold) {
    return {
      absoluteDifference,
      difference,
      state: "similar",
    };
  }

  return {
    absoluteDifference,
    difference,
    state: difference > 0 ? "home-cheaper" : "restaurant-cheaper",
  };
}
