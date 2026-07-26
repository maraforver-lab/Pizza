import {
  getQuickCalculatorPrototypeMetadata,
  quickCalculatorPrototypeMetadata,
  type QuickCalculatorPrototypeMetadata,
} from "@/lib/quick-calculator-prototype-metadata";

export type QuickCalculatorPrototypeRegistration = QuickCalculatorPrototypeMetadata;

export const quickCalculatorPrototypeRegistry = quickCalculatorPrototypeMetadata satisfies readonly QuickCalculatorPrototypeRegistration[];

export function getQuickCalculatorPrototype(value: string): QuickCalculatorPrototypeRegistration | null {
  return getQuickCalculatorPrototypeMetadata(value);
}
