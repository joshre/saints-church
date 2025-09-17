---
layout: default
title: "Our Beliefs"
description: "Our Reformed Baptist beliefs and doctrinal distinctives based on the London Baptist Confession of 1689. Learn what Saints Church in Knoxville, TN believes about Scripture, salvation, baptism, and church life."
---

<!-- Article Layout -->
<div class="min-h-screen bg-saints-white dark:bg-saints-black">
  {% include subnav.html %}

  <!-- Article Content -->
  <main>
    <article class="py-16 px-6 mx-auto max-w-4xl lg:px-8">
    <!-- Header -->
    <header class="mx-auto max-w-2xl text-center animate-reveal">
      
      <h1 class="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl dark:text-white animate-reveal font-display text-pretty text-stone-900">{{ site.data.content.beliefs.title }}</h1>
      <p class="mx-auto mt-6 max-w-xl animate-reveal text-lg/8 text-stone-600 dark:text-stone-400">{{ site.data.content.beliefs.intro }}</p>
    </header>

    <!-- Content -->
    <div class="mx-auto mt-16 max-w-3xl animate-reveal">
      <div class="prose prose-lg prose-zinc dark:prose-invert max-w-none [&>h2]:scroll-mt-16 [&>h2]:font-display [&>h2]:text-2xl [&>h2]:font-semibold [&>h2]:tracking-tight [&>h2]:text-stone-900 [&>h2]:dark:text-white [&>h2]:border-l-4 [&>h2]:border-saints-400/30 [&>h2]:dark:border-saints-700/30 [&>h2]:pl-6 [&>h2]:py-2 [&>h2]:my-12 [&>h2]:bg-saints-100/5 [&>h2]:dark:bg-saints-900/8 [&>h2]:rounded-r-lg">
        {{ site.data.content.beliefs.content_html }}
      </div>
    </div>
    
    {% include page-cta.html %}
    </article>
  </main>
</div>

{% include footer.html %}