<script lang="ts">
	import { resolve } from '$app/paths';
	import { __ENTITY___TITLE_MAX } from '@tgab/core/__entities__/limits';
	import { goto } from '$app/navigation';
	import { api, type __Entity__Dto } from '#lib/api.ts';
	import BackButton from '#lib/components/ui/buttons/BackButton.svelte';
	import Button from '#lib/components/ui/buttons/Button.svelte';
	import ActionBar from '#lib/components/ui/layout/ActionBar.svelte';
	import { errorMessage } from '#lib/errors.ts';
	import { confirmDialog, haptic } from '#lib/telegram.ts';

	/** __entity__ отсутствует — создание новой записи. */
	let { __entity__ }: { __entity__?: __Entity__Dto } = $props();

	// Редактор держит локальную копию полей; исходная запись нужна только для сравнения.
	// svelte-ignore state_referenced_locally
	let title = $state(__entity__?.title ?? '');
	let saving = $state(false);
	let error = $state<string | null>(null);

	const dirty = $derived(title !== (__entity__?.title ?? ''));
	const empty = $derived(!title.trim());

	async function back() {
		if (dirty && !empty && !(await confirmDialog('Выйти без сохранения изменений?'))) return;
		goto(resolve('/__entities__'));
	}

	async function save() {
		if (saving || empty) return;
		saving = true;
		error = null;
		try {
			const input = { title };
			if (__entity__) await api.__entities__.update(__entity__.id, input);
			else await api.__entities__.create(input);
			haptic('success');
			goto(resolve('/__entities__'));
		} catch (e) {
			haptic('error');
			error = errorMessage(e);
		} finally {
			saving = false;
		}
	}

	async function remove() {
		if (!__entity__ || !(await confirmDialog('Удалить __one__?'))) return;
		try {
			await api.__entities__.remove(__entity__.id);
			haptic('warning');
			goto(resolve('/__entities__'));
		} catch (e) {
			error = errorMessage(e);
		}
	}
</script>

<BackButton onback={back} />

<form
	class="flex flex-1 flex-col"
	onsubmit={(e) => {
		e.preventDefault();
		save();
	}}
>
	<input
		bind:value={title}
		placeholder="Название"
		maxlength={__ENTITY___TITLE_MAX}
		class="field-bare text-2xl font-bold"
	/>

	{#if error}
		<p class="mt-3 text-sm text-tg-destructive">{error}</p>
	{/if}

	<ActionBar>
		{#if __entity__}
			<Button variant="destructive" class="w-24" onclick={remove}>Удалить</Button>
		{/if}
		<Button type="submit" class="flex-1" disabled={saving || empty || (__entity__ && !dirty)}>
			{saving ? 'Сохранение…' : 'Сохранить'}
		</Button>
	</ActionBar>
</form>
