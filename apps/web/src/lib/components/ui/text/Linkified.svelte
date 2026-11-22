<script lang="ts">
	import { openLink } from '#lib/telegram.ts';
	import { displayUrl, linkify } from '#lib/utils/linkify.ts';

	/** interactive=false — ссылки только подсвечиваются (например, внутри карточки-ссылки). */
	let { text, interactive = true }: { text: string; interactive?: boolean } = $props();

	const segments = $derived(linkify(text));

	function onClick(e: MouseEvent, href: string) {
		e.preventDefault();
		e.stopPropagation();
		openLink(href);
	}
</script>

{#each segments as s, i (i)}
	{#if s.type === 'text'}{s.value}{:else if interactive}<a
			href={s.href}
			class="break-all text-tg-link underline-offset-2 hover:underline"
			onclick={(e) => onClick(e, s.href)}
		>
			{displayUrl(s.value)}
		</a>{:else}<span class="break-all text-tg-link">{displayUrl(s.value)}</span>{/if}
{/each}
