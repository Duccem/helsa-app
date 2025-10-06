export class AppError extends Error {
	public code: string;
	constructor(message: string, code: string) {
		super(message);
		this.code = code;
		Object.setPrototypeOf(this, AppError.prototype);
	}
}
