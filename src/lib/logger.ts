export function logAndThrowError(error: unknown, title: string = "Error:") {
  if (error instanceof Error) {
    throw new Error(`${title} ${error.message}`);
  } else {
    throw new Error(`${title} ${String(error)}`);
  }
}
