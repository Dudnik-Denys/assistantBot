<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	type Variant = 'primary' | 'secondary' | 'destructive';

	let {
		variant = 'primary',
		children,
		class: className,
		...rest
	}: HTMLButtonAttributes & { variant?: Variant; children: Snippet } = $props();

	const variants: Record<Variant, string> = {
		primary: 'bg-tg-button text-tg-button-text',
		secondary: 'bg-tg-secondary-bg text-tg-text',
		destructive: 'bg-tg-secondary-bg text-tg-destructive'
	};
</script>

<button
	type="button"
	class={[
		'flex h-12 items-center justify-center rounded-xl px-4 text-base font-semibold transition active:scale-[0.98] active:opacity-80 disabled:opacity-40 disabled:active:scale-100',
		variants[variant],
		className
	]}
	{...rest}
>
	{@render children()}
</button>
