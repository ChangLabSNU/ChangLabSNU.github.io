---
title: "CHANGlab - Publications"
layout: gridlay
excerpt: "CHANGlab -- Publications."
sitemap: false
permalink: /publications/
---


# Publications

## Highlights

{% assign number_printed = 0 %}
{% for publi in site.data.publist %}

{% assign even_odd = number_printed | modulo: 2 %}
{% if publi.highlight == 1 %}

{% if even_odd == 0 %}
<div class="row">
{% endif %}

<div class="col-sm-6 clearfix">
 <div class="well">
  <h4>{{ publi.title }}</h4>
  <img src="{{ site.url }}{{ site.baseurl }}/images/publications/{{ publi.image }}" class="img-responsive" width="33%" style="float: left" />
  <p>{{ publi.description }}</p>
  <p><em>{{ publi.authors }}</em></p>
  <h5><a href="{{ publi.link.url }}">{{ publi.link.display }}</a></h5>
  <p class="text-danger"><strong> {{ publi.news1 }}</strong></p>
  <p> {{ publi.news2 }}</p>
 </div>
</div>

{% assign number_printed = number_printed | plus: 1 %}

{% if even_odd == 1 %}
</div>
{% endif %}

{% endif %}
{% endfor %}

{% assign even_odd = number_printed | modulo: 2 %}
{% if even_odd == 1 %}
</div>
{% endif %}

<p> &nbsp; </p>


## Full List

{% for publi in site.data.publist %}

{% if publi.marked %}<span style="color: crimson">‣</span>{% endif %}
  <a href="{{ publi.link.url }}" class="publi_title">{{ publi.title }}</a><br/>
  <em>{{ publi.authors }}</em><br/>
  <span class="publi_journal">{{ publi.journal }}</span>
  ({{ publi.pubdate.year }}), {{ publi.vip }}<br/>

{% endfor %}

