<script lang="ts">
	import type { Snippet } from 'svelte';
	import { haptic } from '#lib/telegram.ts';

	/** Круглая плавающая кнопка-ссылка в правом нижнем углу экрана: «+» для новой записи и т. п. */
	interface Props {
		href: string;
		/** Подпись для экранного диктора: на кнопке только значок. */
		label: string;
		/** Значок на кнопке («+»). */
		children: Snippet;
	}

	let { href, label, children }: Props = $props();
</script>

<a
	{href}
	aria-label={label}
	onclick={() => haptic('light')}
	class={[
		'fixed right-page-r bottom-page-b flex items-center justify-center',
		'size-14 rounded-full text-3xl leading-none',
		'bg-tg-button text-tg-button-text shadow-lg shadow-elevation',
		'transition active:scale-95',
	]}
>
	{@render children()}
</a>
