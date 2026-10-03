=begin
  A Liquid filter that shuffles a list into an order fixed for the calendar
  month, so the team page's member grid changes order once a month and
  everyone sees the same order within it:
    {{ members | monthly_shuffle }}
  The seed is the month in Korea, as "2026-10"; TEAM_ORDER_MONTH=2026-11 in
  the environment builds as if it were another month. Sort the list first
  (the team page sorts by sort-key), so the result depends only on who is
  in it and the month, not on the order of _data/team.yml.

  The order only changes when the site is built: GitHub Actions rebuilds at
  the start of every month (the schedule in .github/workflows/jekyll.yml),
  and the mirror's sync.sh builds on every run.
=end
require "digest"

module Jekyll
  module MonthlyShuffle
    def monthly_shuffle(input)
      month = ENV["TEAM_ORDER_MONTH"].to_s.strip
      month = Time.now.getlocal("+09:00").strftime("%Y-%m") if month.empty?
      seed = Digest::SHA256.hexdigest(month)[0, 16].to_i(16)
      Array(input).shuffle(random: Random.new(seed))
    end
  end
end

Liquid::Template.register_filter(Jekyll::MonthlyShuffle)
