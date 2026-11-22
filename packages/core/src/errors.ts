/** Ошибки домена; транспортный слой (API, бот) переводит их в свои ответы. */
export class NotFoundError extends Error {
	constructor(message = 'Не найдено') {
		super(message);
		this.name = 'NotFoundError';
	}
}

export class ForbiddenError extends Error {
	constructor(message = 'Доступ запрещён') {
		super(message);
		this.name = 'ForbiddenError';
	}
}
