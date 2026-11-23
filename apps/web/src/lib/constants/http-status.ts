/**
 * HTTP-коды ответов, которые использует приложение
 * (и сервер, и клиент). Новый — по мере надобности.
 */
export const HttpStatus = {
	Created: 201,
	NoContent: 204,
	BadRequest: 400,
	Unauthorized: 401,
	Forbidden: 403,
	NotFound: 404,
	InternalServerError: 500,
} as const;
