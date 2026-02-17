---
layout: default
title: "Sermons"
description: "Listen to expository sermons from Saints Church in Knoxville, TN. Reformed Baptist preaching through books of the Bible verse-by-verse, available on Apple Podcasts, Spotify, and Overcast."
permalink: /sermons/
---

<div class="min-h-screen bg-[#596352] dark:bg-[#26361b]">
  <main itemscope itemtype="https://schema.org/CollectionPage" tabindex="-1" id="main-content">
    <!-- Header with gradient + noise texture -->
    <div class="relative overflow-hidden bg-linear-to-b from-[#9ca88f] to-[#596352] dark:from-[#333a2b] dark:to-[#26361b]">
      <div class="absolute inset-0 opacity-30 mix-blend-overlay" style="background-position: center; background-image: url(&quot;data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='250' height='250' viewBox='0 0 100 100'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='turbulence' baseFrequency='1.4' numOctaves='1' seed='2' stitchTiles='stitch' result='n' /%3E%3CfeComponentTransfer result='g'%3E%3CfeFuncR type='linear' slope='4' intercept='1' /%3E%3CfeFuncG type='linear' slope='4' intercept='1' /%3E%3CfeFuncB type='linear' slope='4' intercept='1' /%3E%3C/feComponentTransfer%3E%3CfeColorMatrix type='saturate' values='0' in='g' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' /%3E%3C/svg%3E&quot;);"></div>
      <div class="relative">
    <header role="banner" class="relative px-6 pt-24 pb-16 mx-auto max-w-7xl lg:px-8 animate-children">
    <div class="mx-auto max-w-4xl text-center">
      <h1 itemprop="name headline" class="mb-6 text-5xl font-semibold sm:text-6xl lg:text-7xl dark:text-white font-display text-white child" style="text-shadow: 0 1px 2px rgba(0,0,0,0.1), 0 2px 6px rgba(0,0,0,0.05);">
        {{ site.data.content.sermons.title }}
      </h1>

      {% if site.data.content.sermons.subtitle %}
        <p role="doc-subtitle" itemprop="alternativeHeadline" class="mb-8 text-xl font-medium sm:text-2xl text-white/80 child [--delay:0.15s] dark:text-stone-400" style="text-shadow: 0 1px 2px rgba(0,0,0,0.06);">
          {{ site.data.content.sermons.subtitle }}
        </p>
      {% endif %}

      <div class="mx-auto max-w-2xl child [--delay:0.25s]">
        <p itemprop="description" class="mb-8 text-lg leading-relaxed text-white/70 dark:text-stone-300">
          {{ site.data.content.sermons.details }}
        </p>

        <div class="flex flex-wrap gap-3 justify-center child [--delay:0.35s]">
          {% include button.html href=site.podcast.platforms.apple text="Apple Podcasts" icon="apple-podcasts" variant="secondary" class="text-sm" %}
          {% include button.html href=site.podcast.platforms.spotify text="Spotify" icon="spotify" variant="secondary" class="text-sm" %}
          {% include button.html href=site.podcast.platforms.overcast text="Overcast" icon="overcast" variant="secondary" class="text-sm" %}
          {% include button.html href=site.podcast.rss_url text="RSS Feed" icon="rss" variant="secondary" class="text-sm" %}
        </div>
      </div>
    </div>
    </header>

    {% assign latest_sermon = site.posts | where: "category", "sermon" | sort: "date" | reverse | first %}
    {% if latest_sermon %}
      <section aria-labelledby="featured-sermon" class="pb-16 animate-children">
      <div class="px-6 mx-auto max-w-5xl lg:px-8">

        <div class="relative p-8 bg-white dark:bg-stone-900 rounded-3xl lg:p-12 shadow-[0px_0px_0px_1px_rgba(9,9,11,0.07),0px_2px_2px_0px_rgba(9,9,11,0.05)] child [--delay:0.15s] dark:shadow-[0px_0px_0px_1px_rgba(255,255,255,0.1)] dark:before:pointer-events-none dark:before:absolute dark:before:-inset-px dark:before:rounded-3xl dark:before:shadow-[0px_2px_8px_0px_rgba(0,0,0,0.20),0px_1px_0px_rgba(255,255,255,0.06)_inset]">
          <div class="grid grid-cols-1 gap-8 items-start lg:grid-cols-3">
            <!-- Content Column -->
            <div class="lg:col-span-2">
              <header class="mb-6">
                <!-- Latest Badge -->
                <div class="inline-flex gap-x-1.5 items-center py-0.5 px-1.5 -my-0.5 mb-3 font-medium rounded-md text-sm/5 forced-colors:outline bg-saints-400/20 text-saints-700 sm:text-xs/5 dark:bg-saints-400/10 dark:text-saints-300">
                  Latest Sermon
                </div>
                <h3 class="mb-3 text-2xl font-semibold lg:text-3xl dark:text-white font-display text-stone-900">
                  {{ latest_sermon.title }}
                </h3>
                {% if latest_sermon.date %}
                  <p class="text-lg font-medium text-saints-600 dark:text-saints-400">
                    {{ latest_sermon.date | date: "%B %d, %Y" }}
                  </p>
                {% endif %}
              </header>

              {% if latest_sermon.description %}
                <div class="mb-6 max-w-none prose prose-stone dark:prose-invert">
                  <p>{{ latest_sermon.description | strip_html | strip_newlines | truncate: 200 }}</p>
                </div>
              {% endif %}

              <div class="flex flex-wrap gap-4 items-center">
                {% include button.html href=latest_sermon.url text="Listen to Sermon" class="text-sm" %}
              </div>
            </div>

            <!-- Metadata Sidebar -->
            <div class="lg:col-span-1">
              <div class="space-y-6">
                <!-- Speaker -->
                {% if latest_sermon.pastor %}
                  <div>
                    <dt class="mb-3 font-medium uppercase text-saints-600 font-display text-[0.6rem] tracking-[1px] dark:text-stone-400">Speaker</dt>
                    <dd class="flex gap-3 items-center">
                      {% include pastor-image.html class="flex-shrink-0 w-12 h-12 rounded-full" speaker=latest_sermon.pastor %}
                      {% assign current_speaker = site.data.speakers | where: "key", latest_sermon.pastor | first %}
                      <div>
                        <p class="text-sm font-medium dark:text-white text-stone-900">{{ latest_sermon.pastor | remove: "Pastor " }}</p>
                        <p class="text-xs text-stone-500 dark:text-stone-400">{{ current_speaker.role | default: "Pastor" }}</p>
                      </div>
                    </dd>
                  </div>
                {% endif %}

                <!-- Metadata -->
                <div class="space-y-4">
                  <div>
                    <dt class="mb-1 font-medium uppercase text-saints-600 font-display text-[0.6rem] tracking-[1px] dark:text-stone-400">Scripture</dt>
                    <dd>
                      {% if latest_sermon.scripture %}
                        <cite class="text-sm not-italic dark:text-white text-stone-900">{{ latest_sermon.scripture }}</cite>
                      {% endif %}
                    </dd>
                  </div>

                  {% if latest_sermon.duration %}
                    <div>
                      <dt class="mb-1 font-medium uppercase text-saints-600 font-display text-[0.6rem] tracking-[1px] dark:text-stone-400">Duration</dt>
                      <dd>
                        <data value="{{ latest_sermon.duration }}" class="text-sm dark:text-white text-stone-900">{{ latest_sermon.duration }}</data>
                      </dd>
                    </div>
                  {% endif %}

                  {% if latest_sermon.series %}
                    <div>
                      <dt class="mb-1 font-medium uppercase text-saints-600 font-display text-[0.6rem] tracking-[1px] dark:text-stone-400">Series</dt>
                      <dd>
                        <span class="text-sm dark:text-white text-stone-900">{{ latest_sermon.series }}</span>
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
        <div class="px-6 mx-auto max-w-5xl text-center lg:px-8">
          <div class="p-12 bg-white dark:bg-stone-900 rounded-3xl border shadow-lg border-stone-900/5 dark:border-white/10">
            <h2 class="mb-4 text-3xl font-semibold dark:text-white font-display text-stone-900">Sermons Coming Soon</h2>
            <p class="text-stone-600 dark:text-stone-400">We're preparing our sermon archive. In the meantime, you can listen to our latest teachings on your favorite podcast platform above.</p>
          </div>
        </div>
      </section>
    {% endif %}
      </div>
    </div>
    <!-- End header gradient -->

    {% assign sorted_posts = site.posts | where: "category", "sermon" | sort: "date" | reverse %}
    {% assign archive_sermons = sorted_posts | offset: 1 %}
    {% if archive_sermons.size > 0 %}
    <div class="relative pt-[3px]" style="border-top: 2px solid rgba(255,255,255,0.15);">
      <div class="absolute inset-0 opacity-30 mix-blend-overlay" style="background-position: center; background-image: url(&quot;data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='250' height='250' viewBox='0 0 100 100'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='turbulence' baseFrequency='1.4' numOctaves='1' seed='2' stitchTiles='stitch' result='n' /%3E%3CfeComponentTransfer result='g'%3E%3CfeFuncR type='linear' slope='4' intercept='1' /%3E%3CfeFuncG type='linear' slope='4' intercept='1' /%3E%3CfeFuncB type='linear' slope='4' intercept='1' /%3E%3C/feComponentTransfer%3E%3CfeColorMatrix type='saturate' values='0' in='g' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' /%3E%3C/svg%3E&quot;);"></div>
      <div class="absolute inset-0" style="background-image: url(&quot;data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E%3Crect width='32' height='32' fill='none'/%3E%3Cline x1='0' y1='32' x2='32' y2='32' stroke='rgba(255,255,255,0.08)' stroke-width='1'/%3E%3Cline x1='32' y1='0' x2='32' y2='32' stroke='rgba(255,255,255,0.08)' stroke-width='1'/%3E%3C/svg%3E&quot;); background-size: 32px 32px;"></div>

      <section aria-labelledby="sermon-archive" class="relative py-16" style="border-top: 1px solid rgba(255,255,255,0.15);">
      <div class="px-6 mx-auto max-w-7xl lg:px-8">
        <h2 id="sermon-archive" class="mb-12 text-3xl font-semibold text-center dark:text-white font-display text-white">{{ site.data.content.sermons.archive_subtitle }}</h2>

        <div class="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" id="sermon-archive-grid">
          {% for sermon in archive_sermons limit: 12 %}
            {% include sermon-card.html post=sermon %}
          {% endfor %}
        </div>

        {% if archive_sermons.size > 12 %}
          <div class="mt-12 text-center">
            <output role="status" aria-live="polite" class="block mb-4 text-white/60 dark:text-stone-400" id="sermon-count">
              Showing <span id="showing-count">12</span> of <data value="{{ archive_sermons.size }}">{{ archive_sermons.size }}</data> sermons
            </output>
            <button
              id="load-more-btn"
              class="relative cursor-pointer isolate inline-flex items-center justify-center gap-2 rounded-lg border text-sm font-medium px-4 py-2.5 sm:px-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-saints-500 disabled:opacity-50 transition-all duration-200 border-transparent bg-stone-900 before:absolute before:inset-0 before:-z-10 before:rounded-lg before:bg-stone-900 before:shadow-sm dark:before:hidden dark:border-white/5 after:absolute after:inset-0 after:-z-10 after:rounded-lg after:shadow-[inset_0_1px_theme(colors.white/15%)] hover:after:bg-white/10 dark:after:-inset-px dark:after:rounded-lg text-white dark:bg-stone-600 dark:hover:bg-stone-500"
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
        <div class="px-6 mx-auto max-w-7xl text-center lg:px-8">
          <p class="text-white/60 dark:text-stone-400">Our sermon archive is being prepared. Check back soon or listen on your favorite podcast platform.</p>
        </div>
      </section>
    {% endif %}

      <aside aria-labelledby="cta-section" class="relative py-24 animate-children">
        <div class="px-6 mx-auto max-w-4xl text-center lg:px-8">
          <div class="relative p-12 bg-white dark:bg-stone-900 rounded-3xl shadow-[0px_0px_0px_1px_rgba(9,9,11,0.07),0px_2px_2px_0px_rgba(9,9,11,0.05)] dark:shadow-[0px_0px_0px_1px_rgba(255,255,255,0.1)] dark:before:pointer-events-none dark:before:absolute dark:before:-inset-px dark:before:rounded-3xl dark:before:shadow-[0px_2px_8px_0px_rgba(0,0,0,0.20),0px_1px_0px_rgba(255,255,255,0.06)_inset]">
            <div class="child">
              <h2 id="cta-section" class="mb-4 text-3xl font-semibold dark:text-white font-display text-stone-900">
                {{ site.data.content.sermons.cta.sermons_page.title }}
              </h2>
              <p class="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-stone-600 dark:text-stone-400">
                {{ site.data.content.sermons.cta.sermons_page.description }}
              </p>
            </div>

            <nav aria-label="Church information" class="child [--delay:0.15s]">
              <div class="flex flex-col gap-4 justify-center items-center mx-auto max-w-sm sm:flex-row sm:max-w-none">
                {% include button.html href="/beliefs/" text="Our Beliefs" class="w-full sm:w-auto" %}
                {% include button.html text="Visit Us" command="show-modal" commandfor="visit-modal" variant="secondary" class="w-full sm:w-auto" %}
              </div>
            </nav>
          </div>
        </div>
      </aside>
    </div>
  </main>
</div>