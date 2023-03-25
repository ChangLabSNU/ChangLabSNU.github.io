---
title: "CHANGlab - Team"
layout: gridlay
excerpt: "CHANGlab: Team members"
sitemap: false
permalink: /team/
---

## Current Members

{% assign selected_categories = "principal-investigator" | split:',' %}
{% include team_list.html %}

{% assign selected_categories = "student,postdoc,support,research-assistant" | split:',' %}
{% include team_list.html %}

<br/>

## Former Members

<div id="alumni_list">
{% for person in site.data.alumni_members -%}
<div>
<h5>{% if person.link -%}
<a href="{{ site.url }}{{ site.baseurl }}/team/{{ person.link }}">{{ person.name }}</a>
{%- else %}{{ person.name }}{% endif %}
<span>–
{{ person.position }}
({% if person.period[0] == person.period[1] %}{{ person.period[0] }}{% else %}{{ person.period[0] }}–{{ person.period[1] }}{% endif %})
</span>
</h5>
<div class="current_position">
{% if person.current %}Current Position: {{ person.current }}{% endif %}
</div>
</div>
{%- endfor %}
</div>

## Undergraduate Interns

Both former and current interns are represented on this list.

<div id="intern_list">
{% for person in site.data.alumni_interns -%}
{%- if prev_year != person.year_begin %}
#### {{ person.year_begin }}
{% else -%}
;
{% endif -%}
{%- if person.link %}<a href="{{ site.url }}{{ site.baseurl }}/team/{{ person.link }}">{{ person.name }}</a>{% else -%}
{{ person.name }} 
{%- endif -%}
{%- if person.year_begin != person.year_end %}
(–{{ person.year_end }})
{%- endif %}
{%- assign prev_year = person.year_begin -%}
{%- endfor %}
</div>

<!--
## Alumni

### Undergraduate Internship

{% for person in site.data.alumni_interns -%}
{%- if prev_year != person.year_begin %}
#### {{ person.year_begin }}
{% else -%}
;
{% endif -%}
{{ person.name }} 
{%- if person.year_begin != person.year_end %}
(–{{ person.year_end }})
{%- endif %}
{%- assign prev_year = person.year_begin -%}
{%- endfor %}
-->


<script>
$('body').on('click', '.member-list-item[data-href]', function(){
    if (window.location.hash) {
        window.location.hash = $(this).data('href');
    } else {
        window.location.href = $(this).data('href');
    }
})
</script>
