<script lang="ts">
	import Card from '#lib/components/ui/layout/Card.svelte';
	import PageHeader from '#lib/components/ui/layout/PageHeader.svelte';
	import Screen from '#lib/components/ui/layout/Screen.svelte';
	import { sections } from '#lib/constants/sections.ts';
	import { haptic } from '#lib/telegram.ts';
</script>

<Screen>
	<PageHeader title="Ассистент" />

	<nav>
		<ul class="flex flex-col gap-2">
			{#each sections as section (section.href)}
				<li>
					<Card href={section.href} onclick={() => haptic('light')}>
						<span class="flex items-center gap-3">
							<span class="text-2xl leading-none" aria-hidden="true">{section.icon}</span>
							<span class="min-w-0 flex-1">
								<span class="block font-semibold">{section.title}</span>
								<span class="block truncate text-sm text-tg-hint">{section.description}</span>
							</span>
							<span class="text-xl text-tg-hint" aria-hidden="true">›</span>
						</span>
					</Card>
				</li>
			{/each}
		</ul>
	</nav>
</Screen>
