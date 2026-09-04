/*
 * Makes a whole member card clickable, not just the name link.
 * Lives in its own file rather than inline in _pages/team.md because the
 * Content-Security-Policy served for this site has no 'unsafe-inline' in
 * script-src. Loaded after jQuery, which comes in from _includes/header.html.
 */
$('body').on('click', '.member-list-item[data-href]', function(){
    if (window.location.hash) {
        window.location.hash = $(this).data('href');
    } else {
        window.location.href = $(this).data('href');
    }
})
