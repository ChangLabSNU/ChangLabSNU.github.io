=begin
  Fails the build when a _data/ file holds a mistake the templates would
  otherwise render quietly wrong: an author `link` with no team.yml entry
  prints an empty name, an unknown team `category` drops the member from the
  team page, `active: "false"` (a string) counts as true in Liquid, interns out
  of year order repeat a year heading, and so on.

  Every problem is collected and reported at once, so one build lists them all.
  Each rule here mirrors what a template relies on; when a template changes
  what it reads, change the rule with it.
=end
require "date"

module Jekyll
  module DataCheck
    # The groups _pages/team.md lists; any other category is never shown.
    TEAM_CATEGORIES = %w[principal-investigator student postdoc support research-assistant].freeze
    # The groups _includes/resource_list.html lists.
    RESOURCE_CATEGORIES = %w[software resource].freeze
    MONTHS = Date::ABBR_MONTHNAMES.compact.freeze

    class Checker
      def initialize(site)
        @site = site
        @data = site.data
        @problems = []
      end

      def run
        team_links = check_team
        check_publist(team_links)
        check_alumni_members
        check_alumni_interns
        check_fellowships(team_links)
        check_news
        check_resources
        check_icons
        @problems
      end

      private

      def problem(file, entry, index, message)
        label = entry.is_a?(Hash) && (entry["name"] || entry["title"] || entry["recipient"] || entry["date"])
        where = label ? "entry #{index + 1} (#{label.to_s[0, 60]})" : "entry #{index + 1}"
        @problems << "_data/#{file}.yml, #{where}: #{message}"
      end

      def list(file)
        value = @data[file]
        return value if value.is_a?(Array)
        @problems << "_data/#{file}.yml: expected a list of entries" unless value.nil?
        []
      end

      def require_fields(file, entry, index, *fields)
        fields.each do |field|
          value = entry[field]
          problem(file, entry, index, "missing `#{field}`") if value.nil? || value.to_s.strip.empty?
        end
      end

      def source_file?(path)
        File.file?(File.join(@site.source, path))
      end

      def member_page?(link)
        source_file?("_pages/team/#{link}.md")
      end

      def check_team
        links = {}
        list("team").each_with_index do |m, i|
          require_fields("team", m, i, "name", "link", "category", "sort-key", "photo")
          unless [true, false].include?(m["active"])
            problem("team", m, i, "`active` must be true or false, not #{m["active"].inspect}")
          end
          if m["category"] && !TEAM_CATEGORIES.include?(m["category"])
            problem("team", m, i, "unknown category #{m["category"].inspect} (one of: #{TEAM_CATEGORIES.join(", ")})")
          end
          if (link = m["link"])
            problem("team", m, i, "link #{link.inspect} is used by an earlier entry too") if links.key?(link)
            problem("team", m, i, "no profile page _pages/team/#{link}.md") unless member_page?(link)
            links[link] = true
          end
          if m["photo"] && !source_file?("images/members/#{m["photo"]}")
            problem("team", m, i, "photo images/members/#{m["photo"]} does not exist")
          end
        end
        links
      end

      def check_publist(team_links)
        list("publist").each_with_index do |p, i|
          require_fields("publist", p, i, "title", "journal")
          problem("publist", p, i, "missing `link.url`") unless p["link"].is_a?(Hash) && p["link"]["url"]
          date = p["pubdate"]
          if !date.is_a?(Hash) || !date["year"].is_a?(Integer)
            problem("publist", p, i, "`pubdate.year` must be a number")
          elsif date["month"] && !MONTHS.include?(date["month"])
            problem("publist", p, i, "`pubdate.month` must be one of #{MONTHS.join("/")}, not #{date["month"].inspect}")
          end
          authors = p["authors"]
          unless authors.is_a?(Array) && !authors.empty?
            problem("publist", p, i, "no `authors` list")
            next
          end
          authors.each_with_index do |a, j|
            unless a.is_a?(Hash) && (a.key?("link") ^ a.key?("name"))
              problem("publist", p, i, "author #{j + 1} needs exactly one of `link` (lab member) or `name`")
              next
            end
            if a["link"] && !team_links.key?(a["link"])
              problem("publist", p, i, "author #{j + 1} links to #{a["link"].inspect}, which is not a link in team.yml")
            end
          end
        end
      end

      def date_triple(value)
        return nil unless value.is_a?(Array) && value.size == 3 && value.all?(Integer)
        Date.new(*value)
      rescue Date::Error
        nil
      end

      def check_alumni_members
        list("alumni_members").each_with_index do |m, i|
          require_fields("alumni_members", m, i, "name", "position")
          start_date = date_triple(m["start_date"])
          end_date = date_triple(m["end_date"])
          problem("alumni_members", m, i, "`start_date` must be a valid [year, month, day]") unless start_date
          problem("alumni_members", m, i, "`end_date` must be a valid [year, month, day]") unless end_date
          if start_date && end_date && end_date < start_date
            problem("alumni_members", m, i, "`end_date` is before `start_date`")
          end
          if m["link"] && !member_page?(m["link"])
            problem("alumni_members", m, i, "no profile page _pages/team/#{m["link"]}.md")
          end
        end
      end

      # _pages/team.md prints a year heading whenever year_begin changes from
      # the entry before, so the list has to stay grouped, newest year first.
      def check_alumni_interns
        previous = nil
        list("alumni_interns").each_with_index do |m, i|
          require_fields("alumni_interns", m, i, "name")
          first, last = m["year_begin"], m["year_end"]
          unless first.is_a?(Integer) && last.is_a?(Integer)
            problem("alumni_interns", m, i, "`year_begin` and `year_end` must be numbers")
            next
          end
          problem("alumni_interns", m, i, "`year_end` is before `year_begin`") if last < first
          if previous && first > previous
            problem("alumni_interns", m, i, "year_begin #{first} comes after #{previous}; keep newest years first")
          end
          if m["link"] && !member_page?(m["link"])
            problem("alumni_interns", m, i, "no profile page _pages/team/#{m["link"]}.md")
          end
          previous = first
        end
      end

      def check_fellowships(team_links)
        list("fellowships").each_with_index do |f, i|
          require_fields("fellowships", f, i, "recipient", "title", "donor", "href")
          if f["recipient"] && !team_links.key?(f["recipient"])
            problem("fellowships", f, i, "recipient #{f["recipient"].inspect} is not a link in team.yml")
          end
          years = f["year"]
          unless years.is_a?(Array) && [1, 2].include?(years.size) && years.all?(Integer)
            problem("fellowships", f, i, "`year` must be [year] or [first, last]")
          end
        end
      end

      # Dates are free text the templates print as is; requiring one format
      # keeps them consistent and lets this check the newest-first order.
      def check_news
        previous = nil
        list("news").each_with_index do |n, i|
          require_fields("news", n, i, "date", "headline")
          date = begin
            Date.strptime(n["date"].to_s, "%b %d, %Y")
          rescue Date::Error
            problem("news", n, i, "date #{n["date"].inspect} is not like \"Sep 1, 2026\"")
            nil
          end
          next unless date
          if previous && date > previous
            problem("news", n, i, "dated after the entry above it; keep newest first")
          end
          previous = date
        end
      end

      def check_resources
        list("resources").each_with_index do |r, i|
          require_fields("resources", r, i, "name", "link", "category")
          if r["category"] && !RESOURCE_CATEGORIES.include?(r["category"])
            problem("resources", r, i, "unknown category #{r["category"].inspect} (one of: #{RESOURCE_CATEGORIES.join(", ")})")
          end
          if r["image"] && !source_file?("images/resources/#{r["image"]}")
            problem("resources", r, i, "image images/resources/#{r["image"]} does not exist")
          end
          Array(r["links"]).each_with_index do |l, j|
            unless l.is_a?(Hash) && l["title"] && l["url"]
              problem("resources", r, i, "links item #{j + 1} needs both `title` and `url`")
            end
          end
        end
      end

      # _includes/icon.html renders an empty <svg> for an unknown name, so check
      # the names the templates ask for as well as the entries themselves.
      def check_icons
        icons = @data["icons"] || {}
        icons.each do |name, icon|
          box = icon.is_a?(Hash) ? icon["viewbox"].to_s.split : []
          unless box.size == 4 && box.all? { |n| n.match?(/\A\d+(\.\d+)?\z/) } && icon["path"].to_s.start_with?("M")
            @problems << "_data/icons.yml, #{name}: needs a `viewbox` of four numbers and a `path`"
          end
        end
        Dir.glob(File.join(@site.source, "{_includes,_layouts,_pages}", "**", "*.{html,md}")).sort.each do |file|
          File.read(file).scan(/include icon\.html name="([^"]+)"/).flatten.uniq.each do |name|
            next if icons.key?(name)
            @problems << "#{file.delete_prefix("#{@site.source}/")}: icon #{name.inspect} is not in _data/icons.yml"
          end
        end
      end
    end
  end
end

Jekyll::Hooks.register :site, :post_read do |site|
  problems = Jekyll::DataCheck::Checker.new(site).run
  next if problems.empty?
  problems.each { |p| Jekyll.logger.error "Data check:", p }
  raise Jekyll::Errors::FatalException,
        "#{problems.size} problem(s) in _data/ -- see the Data check lines above"
end
