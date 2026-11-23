/**
 * Ошибки домена; транспортный слой (API, бот) переводит их в свои ответы.
 * Все наследуют `DomainError`: он даёт ошибке имя класса (`error.name`) — для логов.
 */
export abstract class DomainError extends Error {
	constructor(message: string) {
		super(message);
		this.name = new.target.name;
	}
}

export class NotFoundError extends DomainError {
	constructor(message = 'Не найдено') {
		super(message);
	}
}

/** initData Mini App не прошли проверку (подпись, срок, формат). */
export class InitDataError extends DomainError {}

/** Ввод корректен по форме, но не подходит по смыслу (дата уже прошла и т. п.). */
export class ValidationError extends DomainError {}
