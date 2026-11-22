import { ROOT_DIR } from '../constants/paths.ts';

/**
 * Запускает команду из корня репозитория, вывод — прямо в текущий терминал.
 * Возвращает код завершения; что делать при ошибке, решает вызывающий код.
 */
export async function spawnCommand(
	command: string[],
	extraEnv: Record<string, string> = {},
): Promise<number> {
	const commandProcess = Bun.spawn(command, {
		cwd: ROOT_DIR,
		env: { ...process.env, ...extraEnv },
		stdio: ['inherit', 'inherit', 'inherit'],
	});
	return commandProcess.exited;
}
