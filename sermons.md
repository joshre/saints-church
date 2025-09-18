---
layout: default
title: "Sermons"
description: "Listen to expository sermons from Saints Church in Knoxville, TN. Reformed Baptist preaching through books of the Bible verse-by-verse, available on Apple Podcasts, Spotify, and Overcast."
---

<main itemscope itemtype="https://schema.org/CollectionPage" tabindex="-1" id="main-content">
  <header role="banner">
    <h1 itemprop="name headline">{{ site.data.content.sermons.title }}</h1>
    {% if site.data.content.sermons.subtitle %}
      <p role="doc-subtitle" itemprop="alternativeHeadline">{{ site.data.content.sermons.subtitle }}</p>
    {% endif %}
    <p itemprop="description">{{ site.data.content.sermons.details }}</p>
  </header>

  {% assign latest_sermon = site.posts | where: "category", "sermon" | sort: "date" | reverse | first %}
  {% if latest_sermon %}
    <section aria-labelledby="featured-sermon">
      <header>
        <h2 id="featured-sermon">{{ latest_sermon.title }}</h2>
        {% if latest_sermon.scripture %}
          <p><cite>{{ latest_sermon.scripture }}</cite></p>
        {% endif %}
      </header>

      <dl role="contentinfo">
        <dt>Published</dt>
        <dd>
          <time datetime="{{ latest_sermon.date | date_to_xmlschema }}" pubdate>
            {{ latest_sermon.date | date: "%B %d, %Y" }}
          </time>
        </dd>
        {% if latest_sermon.duration %}
          <dt>Duration</dt>
          <dd><data value="{{ latest_sermon.duration }}">{{ latest_sermon.duration }}</data></dd>
        {% endif %}
        {% if latest_sermon.pastor %}
          <dt>Preacher</dt>
          <dd><span itemscope itemtype="https://schema.org/Person"><span itemprop="name">{{ latest_sermon.pastor }}</span></span></dd>
        {% endif %}
      </dl>

      {% if latest_sermon.audio_url %}
        {% include audio-player.html audio_url=latest_sermon.audio_url title=latest_sermon.title %}
      {% endif %}

      <p><a href="{{ latest_sermon.url }}" rel="bookmark" itemprop="url">Read Full Sermon</a></p>
    </section>
  {% else %}
    <section>
      <h2>Sermons Coming Soon</h2>
      <p>We're preparing our sermon archive. In the meantime, you can listen to our latest teachings on your favorite podcast platform below.</p>
    </section>
  {% endif %}

  <section aria-labelledby="podcast-platforms">
    <h2 id="podcast-platforms">{{ site.data.content.podcast.platforms.listen_title }}</h2>
    <nav aria-label="Podcast platforms">
      <ul>
        <li><a href="{{ site.podcast.platforms.apple }}" target="_blank" rel="noopener noreferrer external">Apple Podcasts</a></li>
        <li><a href="{{ site.podcast.platforms.spotify }}" target="_blank" rel="noopener noreferrer external">Spotify</a></li>
        <li><a href="{{ site.podcast.platforms.overcast }}" target="_blank" rel="noopener noreferrer external">Overcast</a></li>
        <li><a href="{{ site.podcast.rss_url }}" target="_blank" rel="noopener noreferrer external" type="application/rss+xml">{{ site.data.content.podcast.platforms.rss_label }}</a></li>
      </ul>
    </nav>
  </section>

  {% assign sorted_posts = site.posts | where: "category", "sermon" | sort: "date" | reverse %}
  {% assign archive_sermons = sorted_posts | offset: 1 %}
  {% if archive_sermons.size > 0 %}
    <section aria-labelledby="sermon-archive">
      <h2 id="sermon-archive">{{ site.data.content.sermons.archive_subtitle }}</h2>
      {% for sermon in archive_sermons limit: 12 %}
        <article itemscope itemtype="https://schema.org/Article">
          <header>
            <h3><a href="{{ sermon.url }}" rel="bookmark" itemprop="url headline">{{ sermon.title }}</a></h3>
            {% if sermon.scripture %}
              <p><cite itemprop="about">{{ sermon.scripture }}</cite></p>
            {% endif %}
            {% if sermon.description %}
              <p itemprop="description">{{ sermon.description | strip_html | strip | truncate: 120 }}</p>
            {% endif %}
          </header>

          <dl role="contentinfo">
            <dt>Published</dt>
            <dd>
              <time datetime="{{ sermon.date | date_to_xmlschema }}" pubdate>
                {{ sermon.date | date: "%b %d, %Y" }}
              </time>
            </dd>
            {% if sermon.duration %}
              <dt>Duration</dt>
              <dd><data value="{{ sermon.duration }}">{{ sermon.duration }}</data></dd>
            {% endif %}
            {% if sermon.series %}
              <dt>Series</dt>
              <dd><span itemscope itemtype="https://schema.org/CreativeWorkSeries"><span itemprop="name">{{ sermon.series }}</span></span></dd>
            {% endif %}
            {% if sermon.pastor %}
              <dt>Preacher</dt>
              <dd><span itemscope itemtype="https://schema.org/Person"><span itemprop="name">{{ sermon.pastor }}</span></span></dd>
            {% endif %}
          </dl>
        </article>
      {% endfor %}

      {% if archive_sermons.size > 12 %}
        <output role="status" aria-live="polite">
          Showing <data value="12">12</data> of <data value="{{ archive_sermons.size }}">{{ archive_sermons.size }}</data> sermons
        </output>
        <details>
          <summary>Load more sermons</summary>
          <p>Additional sermons will be loaded here when implemented.</p>
        </details>
      {% endif %}
    </section>
  {% else %}
    <section>
      <p>Our sermon archive is being prepared. Check back soon or listen on your favorite podcast platform.</p>
    </section>
  {% endif %}

  <aside aria-labelledby="cta-section">
    <h2 id="cta-section">{{ site.data.content.sermons.cta.sermons_page.title }}</h2>
    <p>{{ site.data.content.sermons.cta.sermons_page.description }}</p>
    <nav aria-label="Church information">
      <ul>
        <li><a href="/beliefs/" rel="related">Our Beliefs</a></li>
        <li><button type="button" aria-controls="visit-modal" aria-expanded="false" onclick="document.getElementById('visit-modal').classList.remove('hidden'); this.setAttribute('aria-expanded', 'true')">Visit Us</button></li>
      </ul>
    </nav>
  </aside>
</main>