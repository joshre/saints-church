---
layout: default
title: "Letter from the Pastor"
description: "A personal welcome from the pastoral team at Saints Church, a Reformed Baptist church in Knoxville, TN. Learn about our heart for expository preaching, biblical community, and gospel-centered church life."
---

<!-- Article Layout -->
<div class="min-h-screen bg-saints-white dark:bg-saints-black">
  {% include subnav.html %}

  <!-- Article Content -->
  <main>
    <article class="py-16 px-6 mx-auto max-w-4xl lg:px-8">
    <!-- Header -->
    <header class="mx-auto max-w-2xl text-center animate-reveal">
      <div class="mb-6 animate-reveal">
        {% include pastor-image.html %}
      </div>
      <h1 class="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl dark:text-white animate-reveal font-display text-pretty text-stone-900">{{ site.data.content.pastor_letter.title }}</h1>
      <p class="mx-auto mt-6 max-w-xl animate-reveal text-lg/8 text-stone-600 dark:text-stone-400">A personal welcome from our pastoral team and an invitation to join our church family.</p>
    </header>

    <!-- Letter Content -->
    <div class="mx-auto mt-16 max-w-2xl animate-reveal">
      <div class="prose prose-lg prose-zinc dark:prose-invert max-w-none [&>p:first-of-type]:text-xl [&>p:first-of-type]:font-medium  [&>p:first-of-type]:dark:text-saints-400 [&>p:last-of-type]:border-t [&>p:last-of-type]:border-stone-200 [&>p:last-of-type]:dark:border-stone-800 [&>p:last-of-type]:pt-8 [&>p:last-of-type]:mt-8 [&>p:last-of-type]:font-display [&>p:last-of-type]:tracking-tight">
        {{ site.data.content.pastor_letter.content_html }}
      </div>
    </div>
    
    {% include page-cta.html %}
    </article>
  </main>
</div>

{% include footer.html %}