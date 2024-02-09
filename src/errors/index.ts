export class HttpException extends Error {
  constructor(
    public readonly status: number,
    public readonly response: string,
  ) {
    super(response);
    this.message = response;

    /** Restore prototype chain. */
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
