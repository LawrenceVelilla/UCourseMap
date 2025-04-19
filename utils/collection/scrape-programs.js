const cheerio = require("cheerio");
const axios = require("axios");
const fs = require("fs");

const url = "https://calendar.ualberta.ca/preview_program.php?catoid=56&poid=84295";
const OUTPUT_JSON = "program_requirements.json";
const TARGET_ANCHOR_NAME = "HonorsInComputingScienceSoftwarePracticeOptionRequirements";
const TARGET_PROGRAM_TITLE = "Honors in Computing Science - Software Practice Option Requirements";

function parseCourseLi($, li) {
  const $li = $(li);
  const rawText =
    $li
      .find("span > a")
      .first()
      .text()
      ?.trim()
      .replace(/\u00A0/g, " ") || null;
  const noteSpanText =
    $li
      .find("span")
      .first()
      .text()
      ?.trim()
      .replace(/\u00A0/g, " ") || null;
  const noteMatch = noteSpanText ? noteSpanText.match(/\(See Note \d+\)/) : null;
  const note = noteMatch ? noteMatch[0] : null;
  const parts = rawText ? rawText.split(" - ") : [null, null];
  const fullCode = parts[0] || rawText; // Use rawText as fallback if split fails
  const courseTitle = parts.length > 1 ? parts.slice(1).join(" - ") : null;
  const deptMatch = fullCode ? fullCode.match(/^([A-Za-z]+)/) : null;
  const department = deptMatch ? deptMatch[1] : null;
  // Return only if fullCode is truthy
  return fullCode
    ? { courseCode: fullCode, title: courseTitle, department: department, note: note }
    : null;
}

async function scrapeTargetProgram() {
  // … your existing fetch / cheerio setup here …
  const { data: html } = await axios.get(url);
  const $ = cheerio.load(html);
  const contentOuter = $("td.block_content_outer");
  const main = contentOuter.find("td.block_content");
  const mainContentCell = main.first();
  const targetAnchor = mainContentCell.find(`a[name='${TARGET_ANCHOR_NAME}']`);
  const targetH2 = targetAnchor.parent("h2");
  const targetParentDiv = targetH2.parent("div.acalog-core");
  const siblings = targetParentDiv.nextUntil("div.acalog-core:has(> h2)");

  const blocks = [];

  siblings.each((i, el) => {
    const $el = $(el);
    if (!$el.is("div.acalog-core, div.custom_leftpad_20")) return;

    const cores = $el.is("div.acalog-core") ? [$el] : $el.find("div.acalog-core").toArray();

    cores.forEach((coreEl) => {
      const $core = $(coreEl);
      const groups = [];
      let currentGroup = null;

      // walk direct children of this core block in DOM order
      $core.children().each((j, child) => {
        const $child = $(child);

        if ($child.is("h3, h4")) {
          // Start a new group when a heading is encountered
          currentGroup = {
            groupTitle: $child.text().trim(),
            description: [],
            courses: [],
          };
          groups.push(currentGroup);
        } else if ($child.is("p")) {
          // Add paragraph to current group's description
          if (!currentGroup) {
            // Handle paragraph before any h3/h4
            currentGroup = { groupTitle: null, description: [], courses: [] };
            groups.push(currentGroup);
          }
          currentGroup.description.push(
            $child
              .text()
              .trim()
              .replace(/\u00A0/g, " ")
          );
        } else if ($child.is("ul")) {
          // Process list items for the current group
          if (!currentGroup) {
            // Handle list before any h3/h4
            currentGroup = { groupTitle: null, description: [], courses: [] };
            groups.push(currentGroup);
          }
          $child.find("> li").each((k, li) => {
            const $li = $(li);
            if ($li.hasClass("acalog-course")) {
              const courseData = parseCourseLi($, li);
              if (courseData) currentGroup.courses.push(courseData);
            } else {
              // It's a description list item
              currentGroup.description.push(
                $li
                  .text()
                  .trim()
                  .replace(/\u00A0/g, " ")
              );
            }
          });
        }
        // Ignore other direct children like <hr>
      });

      // Collect notes specific to this core block
      const notesList = $core
        .find("ol > li")
        .map((_, li) =>
          $(li)
            .text()
            .trim()
            .replace(/\u00A0/g, " ")
        )
        .get();

      // Determine the representative title for this block (e.g., first group title)
      const blockTitle =
        groups.length > 0
          ? groups[0].groupTitle
          : $core.find("h3,h4").first().text().trim() || null;

      // Only add the block if it has groups or notes
      if (groups.length > 0 || notesList.length > 0) {
        blocks.push({
          title: blockTitle, // Use first group title or found h3/h4 as block context
          groups,
          notesList,
        });
      }
    });
  });

  const output = {
    programName: TARGET_PROGRAM_TITLE,
    blocks,
  };

  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(output, null, 2), "utf8");
  console.log(`✅ Saved "${TARGET_PROGRAM_TITLE}" to ${OUTPUT_JSON}`);
}

scrapeTargetProgram().catch((err) => {
  console.error(err);
  process.exit(1);
});
