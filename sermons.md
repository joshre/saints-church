---
layout: default
title: "Sermons & Expository Preaching"
description: "Listen to expository sermons from Saints Church in Knoxville, TN. Reformed Baptist preaching through books of the Bible verse-by-verse, available on Apple Podcasts, Spotify, and Overcast."
permalink: /sermons/
---

<div class="bg-wallpaper dark:bg-wallpaper-dark relative">
  <!-- Single noise texture layer covering the entire page -->
  <div class="pointer-events-none absolute inset-0 opacity-30 mix-blend-overlay" style="background-position: center; background-image: url(&quot;data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='250' height='250' viewBox='0 0 100 100'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='turbulence' baseFrequency='1.4' numOctaves='1' seed='2' stitchTiles='stitch' result='n' /%3E%3CfeComponentTransfer result='g'%3E%3CfeFuncR type='linear' slope='4' intercept='1' /%3E%3CfeFuncG type='linear' slope='4' intercept='1' /%3E%3CfeFuncB type='linear' slope='4' intercept='1' /%3E%3C/feComponentTransfer%3E%3CfeColorMatrix type='saturate' values='0' in='g' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' /%3E%3C/svg%3E&quot;);"></div>

  <main itemscope itemtype="https://schema.org/CollectionPage" tabindex="-1" id="main-content" class="relative">
    <!-- Header gradient overlay (no separate noise) -->
    <div class="relative overflow-hidden">
      <div class="from-wallpaper-light dark:from-wallpaper-dark-light absolute inset-0 bg-linear-to-b to-transparent dark:to-transparent"></div>
      <div class="relative">
    <header role="banner" class="relative mx-auto max-w-7xl animate-children px-6 pt-28 pb-12 lg:px-8">
    <div class="mx-auto max-w-4xl text-center">
      <h1 itemprop="name headline" class="child mb-4 font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl dark:text-white" style="text-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.06); letter-spacing: -0.02em;">
        {{ site.data.content.sermons.title }}
      </h1>

      {% if site.data.content.sermons.subtitle %}
        <p role="doc-subtitle" itemprop="alternativeHeadline" class="child mb-10 text-lg text-white/50 [--delay:0.15s] sm:text-xl dark:text-stone-400" style="text-shadow: 0 1px 2px rgba(0,0,0,0.06); letter-spacing: 0.01em;">
          {{ site.data.content.sermons.subtitle }}
        </p>
      {% endif %}

      <div class="child mx-auto max-w-2xl [--delay:0.25s]">
        <p itemprop="description" class="mb-7 text-base leading-relaxed text-white/45 dark:text-stone-300">
          {{ site.data.content.sermons.details }}
        </p>

        <div class="child flex flex-col items-center gap-2.5 [--delay:0.35s]">
          <div class="flex flex-wrap justify-center gap-2.5">
            {% include button.html href=site.podcast.platforms.apple text="Apple Podcasts" icon="apple-podcasts" variant="secondary" class="text-sm" %}
            {% include button.html href=site.podcast.platforms.spotify text="Spotify" icon="spotify" variant="secondary" class="text-sm" %}
            {% include button.html href=site.podcast.platforms.overcast text="Overcast" icon="overcast" variant="secondary" class="text-sm" %}
          </div>
          <div class="flex flex-wrap justify-center gap-2.5">
            {% include button.html href=site.podcast.platforms.youtube text="YouTube" icon="youtube" variant="secondary" class="text-sm" %}
            {% include button.html href=site.podcast.rss_url text="RSS Feed" icon="rss" variant="secondary" class="text-sm" %}
          </div>
        </div>
      </div>
    </div>
    </header>

    {% assign latest_sermon = site.posts | where: "category", "sermon" | sort: "date" | reverse | first %}
    {% if latest_sermon %}
      <section aria-labelledby="featured-sermon" class="animate-children pb-16">
      <div class="mx-auto max-w-4xl px-6 lg:px-8">

        <div class="child relative rounded-[2rem] bg-white p-7 shadow-[0px_0px_0px_1px_rgba(9,9,11,0.07),0px_2px_2px_0px_rgba(9,9,11,0.05)] [--delay:0.15s] lg:p-10 dark:bg-stone-900 dark:shadow-[0px_0px_0px_1px_rgba(255,255,255,0.1)] dark:before:pointer-events-none dark:before:absolute dark:before:-inset-px dark:before:rounded-[2rem] dark:before:shadow-[0px_2px_8px_0px_rgba(0,0,0,0.20),0px_1px_0px_rgba(255,255,255,0.06)_inset]">
          <div class="grid grid-cols-1 items-start gap-6 lg:grid-cols-3 lg:gap-8">
            <!-- Content Column -->
            <div class="lg:col-span-2">
              <header class="mb-6">
                <!-- Latest Badge -->
                <div class="bg-saints-500/10 text-saints-700 border-saints-500/15 dark:bg-saints-400/10 dark:text-saints-300 dark:border-saints-400/15 mb-3 inline-flex items-center gap-x-1.5 rounded-full border px-2.5 py-1 text-xs font-medium tracking-wide forced-colors:outline">
                  Latest Sermon
                </div>
                <h3 class="mb-3 font-display text-2xl font-semibold text-stone-900 lg:text-3xl dark:text-white">
                  {{ latest_sermon.title }}
                </h3>
                {% if latest_sermon.date %}
                  <p class="text-saints-600 dark:text-saints-400 text-base font-medium">
                    {{ latest_sermon.date | date: "%B %d, %Y" }}
                  </p>
                {% endif %}
              </header>

              {% if latest_sermon.description %}
                <div class="prose-stone mb-5 max-w-none prose dark:prose-invert">
                  <p>{{ latest_sermon.description | strip_html | strip_newlines | truncate: 200 }}</p>
                </div>
              {% endif %}

              <div class="flex flex-wrap items-center gap-4">
                {% include button.html href=latest_sermon.url text="Listen to Sermon" class="text-sm" %}
              </div>
            </div>

            <!-- Metadata Sidebar -->
            <div class="lg:col-span-1 lg:border-l lg:border-stone-100/70 lg:pl-8 dark:lg:border-stone-800/70">
              <div class="space-y-6">
                <!-- Preacher -->
                {% if latest_sermon.pastor %}
                  <div>
                    <dt class="text-saints-600 mb-2.5 font-display text-[0.6rem] font-medium tracking-[0.08em] uppercase dark:text-stone-400">Preacher</dt>
                    <dd class="flex items-center gap-3">
                      {% include pastor-image.html class="h-12 w-12 flex-shrink-0 rounded-full" preacher=latest_sermon.pastor %}
                      {% assign current_preacher = site.data.preachers | where: "key", latest_sermon.pastor | first %}
                      <div>
                        <p class="text-sm font-medium text-stone-900 dark:text-white">{{ latest_sermon.pastor | remove: "Pastor " }}</p>
                        <p class="text-xs text-stone-500 dark:text-stone-400">{{ current_preacher.role | default: "Pastor" }}</p>
                      </div>
                    </dd>
                  </div>
                {% endif %}

                <!-- Metadata -->
                <div class="space-y-4">
                  <div>
                    <dt class="text-saints-600 mb-1 font-display text-[0.6rem] font-medium tracking-[0.08em] uppercase dark:text-stone-400">Scripture</dt>
                    <dd>
                      {% if latest_sermon.scripture %}
                        <cite class="text-sm text-stone-900 not-italic dark:text-white">{{ latest_sermon.scripture }}</cite>
                      {% endif %}
                    </dd>
                  </div>

                  {% if latest_sermon.duration %}
                    <div>
                      <dt class="text-saints-600 mb-1 font-display text-[0.6rem] font-medium tracking-[0.08em] uppercase dark:text-stone-400">Duration</dt>
                      <dd>
                        <data value="{{ latest_sermon.duration }}" class="text-sm text-stone-900 dark:text-white">{{ latest_sermon.duration }}</data>
                      </dd>
                    </div>
                  {% endif %}

                  {% if latest_sermon.series %}
                    <div>
                      <dt class="text-saints-600 mb-1 font-display text-[0.6rem] font-medium tracking-[0.08em] uppercase dark:text-stone-400">Series</dt>
                      <dd>
                        <span class="text-sm text-stone-900 dark:text-white">{{ latest_sermon.series }}</span>
                      </dd>
                    </div>
                  {% endif %}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </section>
    {% else %}
      <section class="pb-16">
        <div class="mx-auto max-w-5xl px-6 text-center lg:px-8">
          <div class="rounded-3xl border border-stone-900/5 bg-white p-12 shadow-lg dark:border-white/10 dark:bg-stone-900">
            <h2 class="mb-4 font-display text-3xl font-semibold text-stone-900 dark:text-white">Sermons Coming Soon</h2>
            <p class="text-stone-600 dark:text-stone-400">We're preparing our sermon archive. In the meantime, you can listen to our latest teachings on your favorite podcast platform above.</p>
          </div>
        </div>
      </section>
    {% endif %}
      </div>
    </div>
    <!-- End header gradient -->

    <!-- Double border divider -->
    <div class="flex flex-col gap-[3px]">
      <div class="h-px bg-white/12"></div>
      <div class="h-px bg-white/8"></div>
    </div>

    {% assign sorted_posts = site.posts | where: "category", "sermon" | sort: "date" | reverse %}
    {% assign archive_sermons = sorted_posts | offset: 1 %}
    {% if archive_sermons.size > 0 %}
    <div class="relative">
      <div class="absolute inset-0" style="background-image: url(&quot;data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E%3Crect width='32' height='32' fill='none'/%3E%3Cline x1='0' y1='32' x2='32' y2='32' stroke='rgba(255,255,255,0.04)' stroke-width='1'/%3E%3Cline x1='32' y1='0' x2='32' y2='32' stroke='rgba(255,255,255,0.04)' stroke-width='1'/%3E%3C/svg%3E&quot;); background-size: 32px 32px;"></div>

      <section aria-labelledby="sermon-archive" class="relative pt-16 pb-16">
      <div class="mx-auto max-w-7xl px-6 lg:px-8">
        <div class="mb-12 text-center">
          <p class="mb-4 font-display text-xs font-medium tracking-[0.2em] text-white/30 uppercase">Browse All</p>
          <div class="mb-0 flex items-center justify-center gap-4">
            <span class="block h-px w-16 bg-white/15"></span>
            <h2 id="sermon-archive" class="font-display text-2xl font-semibold text-white sm:text-3xl dark:text-white" style="text-shadow: 0 1px 2px rgba(0,0,0,0.1);">{{ site.data.content.sermons.archive_subtitle }}</h2>
            <span class="block h-px w-16 bg-white/15"></span>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" id="sermon-archive-grid">
          {% for sermon in archive_sermons limit: 12 %}
            {% include sermon-card.html post=sermon %}
          {% endfor %}
        </div>

        {% if archive_sermons.size > 12 %}
          <div class="mt-10 text-center">
            <output role="status" aria-live="polite" class="mb-4 block text-sm text-white/50 dark:text-stone-400" id="sermon-count">
              Showing <span id="showing-count">12</span> of <data value="{{ archive_sermons.size }}">{{ archive_sermons.size }}</data> sermons
            </output>
            <button
              id="load-more-btn"
              class="focus-visible:ring-saints-500 relative isolate inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-transparent bg-stone-900 px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 before:absolute before:inset-0 before:-z-10 before:rounded-lg before:bg-stone-900 before:shadow-sm after:absolute after:inset-0 after:-z-10 after:rounded-lg after:shadow-[inset_0_1px_theme(colors.white/15%)] hover:after:bg-white/10 focus:outline-none focus-visible:ring-2 disabled:opacity-50 sm:px-5 dark:border-white/5 dark:bg-stone-600 dark:before:hidden dark:after:-inset-px dark:after:rounded-lg dark:hover:bg-stone-500"
              onclick="loadMoreSermons()"
            >
              Load More Sermons
            </button>
          </div>

          <!-- Hidden sermons for pagination -->
          <div class="hidden" id="additional-sermons">
            {% for sermon in archive_sermons offset: 12 %}
              <div class="sermon-item" data-index="{{ forloop.index | plus: 12 }}">
                {% include sermon-card.html post=sermon %}
              </div>
            {% endfor %}
          </div>

          <script>
            let currentlyShowing = 12;
            const totalSermons = {{ archive_sermons.size }};
            const sermonsPerLoad = 8;

            function loadMoreSermons() {
              const grid = document.getElementById('sermon-archive-grid');
              const additionalSermons = document.querySelectorAll('#additional-sermons .sermon-item');
              const loadMoreBtn = document.getElementById('load-more-btn');
              const showingCount = document.getElementById('showing-count');

              let loaded = 0;
              additionalSermons.forEach((item, index) => {
                if (loaded < sermonsPerLoad && !item.classList.contains('loaded')) {
                  const newItem = document.createElement('div');
                  newItem.innerHTML = item.innerHTML;
                  grid.appendChild(newItem);
                  item.classList.add('loaded');
                  loaded++;
                  currentlyShowing++;
                }
              });

              showingCount.textContent = currentlyShowing;

              if (currentlyShowing >= totalSermons) {
                loadMoreBtn.style.display = 'none';
              }
            }
          </script>
        {% endif %}
      </div>
      </section>
    {% else %}
      <section class="py-16">
        <div class="mx-auto max-w-7xl px-6 text-center lg:px-8">
          <p class="text-white/60 dark:text-stone-400">Our sermon archive is being prepared. Check back soon or listen on your favorite podcast platform.</p>
        </div>
      </section>
    {% endif %}

      <!-- Decorative separator -->
      <div class="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div class="h-px" style="background: linear-gradient(to right, transparent, rgba(255,255,255,0.06) 20%, rgba(255,255,255,0.06) 80%, transparent);"></div>
      </div>

      <!-- CTA Section -->
      <aside aria-labelledby="cta-section" class="relative animate-children pt-14 pb-14">
        <div class="mx-auto max-w-3xl px-6 text-center lg:px-8">
          <div class="child">
            <h2 id="cta-section" class="mb-4 font-display text-2xl font-semibold text-white/85 sm:text-3xl" style="text-shadow: 0 1px 2px rgba(0,0,0,0.1);">
              {{ site.data.content.sermons.cta.sermons_page.title }}
            </h2>
            <p class="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-white/50">
              {{ site.data.content.sermons.cta.sermons_page.description }}
            </p>
          </div>

          <nav aria-label="Church information" class="child [--delay:0.15s]">
            <div class="mx-auto flex max-w-sm flex-col items-center justify-center gap-4 sm:max-w-none sm:flex-row">
              {% include button.html href="/beliefs/" text="Our Beliefs" variant="secondary" class="w-full sm:w-auto" %}
              {% include button.html text="Visit Us" command="show-modal" commandfor="visit-modal" variant="secondary" class="w-full sm:w-auto" %}
            </div>
          </nav>
        </div>
      </aside>
    </div>
  </main>
</div>
