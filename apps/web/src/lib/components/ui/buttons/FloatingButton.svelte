<script lang="ts">
	import type { Snippet } from 'svelte';
	import { haptic } from '#lib/telegram.ts';

	/** Круглая плавающая кнопка-ссылка в правом нижнем углу экрана: «+» для новой записи и т. п. */
	let { href, label, children }: { href: string; label: string; children: Snippet } = $props();
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
