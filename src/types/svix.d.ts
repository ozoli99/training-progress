declare module "svix" {
  export class Webhook {
    constructor(secret: string);
    verify(payload: string | Uint8Array, headers: Record<string, string>): any;
  }
}
