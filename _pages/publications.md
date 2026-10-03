---
title: "Publications"
layout: gridlay
excerpt: "Papers from the Chang lab on RNA regulation, nanopore sequencing and mRNA design."
permalink: /publications/
---

# Publications

<div class="publication-list" markdown="1">
{% for publi in site.data.publist %}

{% if publi.marked %}<span class="qb-marked" aria-hidden="true"></span>{% endif %}
  <a href="{{ publi.link.url }}" class="publi_title">{{ publi.title }}</a><br/>
  <span class="publi_authors">{% include publication_author_list.html -%}</span>
  <span class="publi_journal">{{ publi.journal }}</span>
  ({{ publi.pubdate.year }}), {{ publi.vip }}

{% endfor %}
</div>

