---
layout: default
title: "Sermons & Expository Preaching"
description: "Listen to expository sermons from Saints Church in Knoxville, TN. Reformed Baptist preaching through books of the Bible verse-by-verse, available on Apple Podcasts, Spotify, and Overcast."
permalink: /sermons/
---

{% assign sorted_posts = site.posts | where: "category", "sermon" | sort: "date" | reverse %}
{% assign latest_sermon = sorted_posts | first %}
{% comment %}offset is a for-loop parameter, not a filter - slice is what actually drops the featured sermon{% endcomment %}
{% assign archive_sermons = sorted_posts | slice: 1, 500 %}

<main itemscope itemtype="https://schema.org/CollectionPage" tabindex="-1" id="main-content" class="mx-auto max-w-7xl px-6 pt-24 pb-28 lg:px-8">
  <div class="flex animate-children flex-wrap items-end justify-between gap-8">
    <div class="child max-w-xl">
      <p class="text-2xs font-display font-bold tracking-eyebrow text-stone-500 uppercase dark:text-stone-400">{{ site.data.content.sermons.eyebrow }}</p>
      <h1 itemprop="name headline" class="mt-4 font-display text-5xl leading-none font-bold tracking-tight text-stone-900 sm:text-6xl dark:text-white">
        {{ site.data.content.sermons.title }}
      </h1>
      <p itemprop="description" class="mt-5 text-lg leading-relaxed text-stone-600 dark:text-stone-400">
        {{ site.data.content.sermons.subtitle }}
      </p>
    </div>

    <div class="child pb-1.5 [--delay:0.1s]">
      {% include subscribe-menu.html %}
    </div>
  </div>

  {% if latest_sermon %}
    {% capture latest_blurb %}{% include sermon-blurb.html post=latest_sermon %}{% endcapture %}
    <section aria-labelledby="latest-sermon" class="mt-14 border-t border-stone-900/10 pt-7 dark:border-white/10">
      <p class="text-saints-600 dark:text-saints-400 text-2xs font-display font-bold tracking-eyebrow uppercase">{{ site.data.content.sermons.latest_label }}</p>
      <h2 id="latest-sermon" class="mt-3.5 font-display text-4xl leading-tight font-bold tracking-tight text-stone-900 dark:text-white">
        {{ latest_sermon.title | escape }}
      </h2>
      {% if latest_blurb != "" %}
        <p class="mt-3.5 max-w-prose text-lg text-pretty text-stone-700 dark:text-stone-300">{{ latest_blurb }}</p>
      {% endif %}
      <div class="mt-6 flex flex-wrap items-center gap-4">
        <a href="{{ latest_sermon.url }}" class="inline-flex h-11 items-center gap-2.5 rounded-lg bg-stone-900 px-5 text-sm font-medium text-white transition-colors duration-200 hover:bg-stone-800 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-100">
          <svg viewBox="0 0 24 24" aria-hidden="true" class="size-3.5">
            <path d="M8 4.5 19 12 8 19.5Z" fill="currentColor"></path>
          </svg>
          Listen
        </a>
        <p class="text-sm text-stone-500 tabular-nums dark:text-stone-400">
          {{ latest_sermon.date | date: "%B %-d, %Y" }} &middot; {{ latest_sermon.duration }} &middot; {{ latest_sermon.pastor | remove: "Pastor " }}
        </p>
      </div>
    </section>
  {% endif %}

  {% if archive_sermons.size > 0 %}
    <section aria-labelledby="sermon-archive">
      <h2 id="sermon-archive" class="sr-only">{{ site.data.content.sermons.archive_subtitle }}</h2>
      {% include sermon-list.html sermons=archive_sermons group_by_series=true paginate=true %}

      {% assign page_size = site.data.content.sermons.page_size %}
      {% if archive_sermons.size > page_size %}
        <div class="mt-9 flex flex-wrap items-center justify-between gap-6">
          <output role="status" aria-live="polite" class="text-sm text-stone-400 tabular-nums dark:text-stone-500" id="sermon-count">
            Showing <span id="showing-count">{{ page_size }}</span> of <data value="{{ archive_sermons.size }}">{{ archive_sermons.size }}</data> sermons
          </output>
          <button type="button" id="load-more-btn" class="h-11 cursor-pointer rounded-lg px-5 text-sm font-medium text-stone-900 ring-1 ring-stone-900/10 transition-colors duration-200 hover:bg-stone-900/5 dark:text-white dark:ring-white/15 dark:hover:bg-white/10">
            Load {{ page_size }} more
          </button>
        </div>
      {% endif %}
    </section>
  {% else %}
    <p class="mt-14 text-stone-600 dark:text-stone-400">Our sermon archive is being prepared. Check back soon, or listen on your favorite podcast platform.</p>
  {% endif %}

  <aside aria-labelledby="cta-section" class="mt-20 border-t border-stone-900/10 pt-14 text-center dark:border-white/10">
    <h2 id="cta-section" class="font-display text-3xl font-bold tracking-tight text-stone-900 dark:text-white">
      {{ site.data.content.sermons.cta.sermons_page.title }}
    </h2>
    <p class="mx-auto mt-4 max-w-lg text-lg text-pretty text-stone-600 dark:text-stone-400">
      {{ site.data.content.sermons.cta.sermons_page.description }}
    </p>
    <div class="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
      {% include button.html text="Visit Us" command="show-modal" commandfor="visit-modal" class="w-full sm:w-auto" %}
      {% include button.html href="/beliefs/" text="Our Beliefs" variant="secondary" class="w-full sm:w-auto" %}
    </div>
  </aside>
</main>
