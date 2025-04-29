const cheerio = require("cheerio");
const axios = require("axios");

export async function scrapeCourses(url) {
  try {
    const response = await axios.get(url);
    return parseCoursesHTML(response.data);
  } catch (error) {
    console.error("Error fetching courses:", error);
    return [];
  }
}

export async function parseCoursesHTML(html) {
  const $ = cheerio.load(html);
  const courses = [];

  $(".course.first").each((_, element) => {
    const $course = $(element);

    const headerText = $course.find("h2 a").text().trim();
    const courseUrl = $course.find("h2 a").attr("href");

    const codeTitleMatch = headerText.match(/^([A-Z]+(?:\s[A-Z]+)?\s+\d+)\s*[-–—]?\s*(.*)/);
    let courseCode = codeTitleMatch ? codeTitleMatch[1] : "";
    let title = codeTitleMatch ? codeTitleMatch[2] : headerText;

    const sectionMatch = title.match(/^([A-Z])\s*-\s*(.*)/);
    if (sectionMatch) {
      courseCode = courseCode + sectionMatch[1];
      title = sectionMatch[2].trim();
    }

    // Extract department - handle multi-word departments
    let department = "";
    const deptMatch = courseCode.match(/^([A-Z]+(?:\s[A-Z]+)?)/);
    if (deptMatch) {
      department = deptMatch[1];
    }

    // Extract units
    const unitsText = $course.find("b").text().trim();
    const unitsMatch = unitsText.match(/(\d+)\s+units\s+\(fi\s+(\d+)\)\s*\(([^)]+)\)/);
    const units = {
      credits: unitsMatch ? parseInt(unitsMatch[1]) : null,
      feeIndex: unitsMatch ? parseInt(unitsMatch[2]) : null,
      term: unitsMatch ? unitsMatch[3] : null,
    };

    let description = $course.find("p").text().trim();
    description = description.replace(/"\s*==\s*\$\d+$/, "").trim();
    description = description.replace(/^"(.+)"$/, "$1");

    courses.push({
      department,
      courseCode,
      title,
      units,
      description,
      url: courseUrl,
    });
  });

  return courses;
}

// async function main() {
//   const courses = await scrapeCourses('https://apps.ualberta.ca/catalogue/course/cmput');
//   fs.writeFileSync('courses.json', JSON.stringify(courses, null, 2));
//   console.log(`Scraped ${courses.length} courses`);
// }

// main();
