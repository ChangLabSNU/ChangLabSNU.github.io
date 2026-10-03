---
title: "News"
layout: textlay
excerpt: "News from the Chang lab: papers, talks, awards, and people joining and moving on."
permalink: /allnews.html
---

# News

<ul class="news-list news-list-full" markdown="0">
{%- for article in site.data.news %}
<li><span class="news-date">{{ article.date }}</span> {{ article.headline }}</li>
{%- endfor %}
</ul>
