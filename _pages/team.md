---
title: "CHANGlab - Team"
layout: gridlay
excerpt: "CHANGlab: Team members"
sitemap: false
permalink: /team/
---

## Group Members

### Principal Investigator
{% assign selected_categories = "principal-investigator" | split:',' %}
{% include team_list.html %}

### Members
{% assign selected_categories = "student,postdoc,support,research-assistant" | split:',' %}
{% include team_list.html %}

<br/>

<!--
<div id="alumni">
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
</div>
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
