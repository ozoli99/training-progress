// shared/errors.ts
import { NextResponse } from "next/server";

export namespace AppError {
  export class NotFound extends Error {}
  export class Conflict extends Error {}
  export class Forbidden extends Error {}
  export class Validation extends Error {}
  export class Unauthorized extends Error {}

  export function toHttp(err: unknown): { status: number; body: any } {
    if (err instanceof Validation)
      return { status: 422, body: { error: err.message } };
    if (err instanceof Conflict)
      return { status: 409, body: { error: err.message } };
    if (err instanceof Forbidden)
      return { status: 403, body: { error: err.message } };
    if (err instanceof NotFound)
      return { status: 404, body: { error: err.message } };
    if (err instanceof Unauthorized)
      return { status: 401, body: { error: err.message } };
    if (err instanceof Error)
      return { status: 400, body: { error: err.message } };
    return { status: 500, body: { error: "Unknown Error" } };
  }
}

export function handleApiError(err: unknown) {
  const { status, body } = AppError.toHttp(err);
  return NextResponse.json(body, { status });
}
