/** Exhaustiveness guard for discriminated unions. Call from a `default` switch arm. */
export function assertNever(value: never): never {
  throw new Error(`unhandled variant: ${JSON.stringify(value)}`);
}
