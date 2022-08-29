---
title: "CHANGlab - Team"
layout: gridlay
excerpt: "CHANGlab: Team members"
sitemap: false
permalink: /team/
---

## Group Members

### Principal Investigator
{% assign member_list = site.data.team_pi %}
{% include team_list.html %}

### Researchers &amp; Students
{% assign member_list = site.data.team_researcher %}
{% include team_list.html %}

### Staff
{% assign member_list = site.data.team_support %}
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
