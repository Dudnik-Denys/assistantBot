<script lang="ts">
	import Screen from '#lib/components/Screen.svelte';
	import { sections } from '#lib/sections.ts';
	import { haptic } from '#lib/telegram.ts';
</script>

<Screen>
	<h1 class="mb-4 text-2xl font-bold">Ассистент</h1>

	<nav>
		<ul class="flex flex-col gap-2">
			{#each sections as section (section.href)}
				<li>
					<a
						href={section.href}
						onclick={() => haptic('light')}
						class="flex items-center gap-3 rounded-2xl bg-tg-secondary-bg px-4 py-3 transition active:opacity-70"
					>
						<span class="text-2xl leading-none" aria-hidden="true">{section.icon}</span>
						<span class="min-w-0 flex-1">
							<span class="block font-semibold">{section.title}</span>
							<span class="block truncate text-sm text-tg-hint">{section.description}</span>
						</span>
						<span class="text-xl text-tg-hint" aria-hidden="true">›</span>
					</a>
				</li>
			{/each}
		</ul>
	</nav>
</Screen>
