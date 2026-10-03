---
title: "Team"
layout: gridlay
excerpt: "The people of the Chang lab at Seoul National University, with our former members and undergraduate interns."
permalink: /team/
---

# Team

{% include team_lead.html %}

## Members

{% assign selected_categories = "student,postdoc,support,research-assistant" | split:',' %}
{% include team_list.html order="monthly" %}

## Former members

{% assign alumni_by_leaving_date = site.data.alumni_members | sort: "end_date" | reverse %}

<div class="alumni-list" markdown="0">
{%- for person in alumni_by_leaving_date %}
<div class="alumni-item">
<div class="alumni-name">{% if person.link %}<a href="{{ site.baseurl }}/team/{{ person.link }}">{{ person.name }}</a>{% else %}{{ person.name }}{% endif %}</div>
<div>{{ person.position }}, {% if person.start_date[0] == person.end_date[0] %}{{ person.start_date[0] }}{% else %}{{ person.start_date[0] }}–{{ person.end_date[0] }}{% endif %}</div>
{%- if person.current %}
<div class="alumni-now"><span>Now</span> {{ person.current }}</div>
{%- endif %}
</div>
{%- endfor %}
</div>

## Undergraduate interns

Both former and current interns are on this list.

{%- comment -%}
  One row per starting year (_data/alumni_interns.yml is sorted newest year
  first), names joined by commas; an internship that ran into a later year
  shows "(–<year>)".
{%- endcomment %}

<div class="intern-list" markdown="0">
{%- for person in site.data.alumni_interns %}
{%- if prev_year != person.year_begin %}
{%- unless forloop.first %}</div>
</div>{% endunless %}
<div class="intern-year">
<div class="intern-year-label">{{ person.year_begin }}</div>
<div class="intern-names">
{%- else %}, {% endif -%}
{%- if person.link %}<a href="{{ site.baseurl }}/team/{{ person.link }}">{{ person.name }}</a>{% else %}{{ person.name }}{% endif -%}
{%- if person.year_begin != person.year_end %} (–{{ person.year_end }}){% endif -%}
{%- assign prev_year = person.year_begin -%}
{%- endfor %}</div>
</div>
</div>
