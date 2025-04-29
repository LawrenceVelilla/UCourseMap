const cheerio = require("cheerio");
const axios = require("axios");
const fs = require("fs");
import { RawCourse, Course } from "../../lib/types";

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

    // Extract course header info
    const headerText = $course.find("h2 a").text().trim();
    const courseUrl = $course.find("h2 a").attr("href");

    // Parse course code and title
    const codeTitleMatch = headerText.match(/^([A-Z]+(?:\s[A-Z]+)?\s+\d+)\s*[-–—]?\s*(.*)/);
    let courseCode = codeTitleMatch ? codeTitleMatch[1] : "";
    let title = codeTitleMatch ? codeTitleMatch[2] : headerText;

    const sectionMatch = title.match(/^([A-Z])\s*-\s*(.*)/);
    if (sectionMatch) {
      // Add the section to the course code (no space between number and section)
      courseCode = courseCode + sectionMatch[1];
      // Clean up the title by removing the section prefix
      title = sectionMatch[2].trim();
    }

    // Extract department - handle multi-word departments
    let department = "";
    const deptMatch = courseCode.match(/^([A-Z]+(?:\s[A-Z]+)?)/); // Match letters at the start, possibly including one space
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

    // Extract description
    let description = $course.find("p").text().trim();
    // Clean up description (remove the debugging info at the end)
    description = description.replace(/"\s*==\s*\$\d+$/, "").trim();
    // Remove surrounding quotes if present
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

/**
 * Parse HTML content from a single course page
 * @param {string} html - HTML content from the individual course page
 * @param {string} department - Department code (e.g., 'cmput')
 * @param {string} courseCode - Course code (e.g., '175')
 * @returns {RawCourse|null} Parsed course object or null if not found
 */
export async function parseSingleCourseHTML(html, department, courseCode) {
  try {
    const $ = cheerio.load(html);

    // Extract course title from the h1 heading
    const fullHeading = $("h1").text().trim();
    const headingMatch = fullHeading.match(/^([A-Z]+\s+\d+)\s*-\s*(.+)$/);

    if (!headingMatch) {
      console.error("Failed to parse course heading");
      return null;
    }

    const fullCourseCode = headingMatch[1];
    const title = headingMatch[2].trim();

    // Extract units/credits from the h5 element
    const unitsText = $("h5").text().trim();
    const unitsMatch = unitsText.match(/(\d+)\s+units\s+\(fi\s+(\d+)\)\s*\(([^)]+)\)/);

    const units = {
      credits: unitsMatch ? parseInt(unitsMatch[1]) : null,
      feeIndex: unitsMatch ? parseInt(unitsMatch[2]) : null,
      term: unitsMatch ? unitsMatch[3].trim() : null,
    };

    // Extract description - it's in a paragraph after the h5 element
    const description = $("h5").next("p").text().trim();

    // Check if we successfully extracted the main course data
    if (!title || !description) {
      console.error("Failed to extract essential course data");
      return null;
    }

    // Construct the URL for the course
    const url = `/catalogue/course/${department}/${courseCode}`;

    // Construct and return the course object
    const course = {
      department: department.toUpperCase(),
      courseCode: fullCourseCode,
      title,
      units,
      description,
      url: url,
    };

    return course;
  } catch (error) {
    console.error("Error parsing single course HTML:", error);
  }
}

// async function main() {
//   const courses = await scrapeCourses('https://apps.ualberta.ca/catalogue/course/cmput');
//   fs.writeFileSync('courses.json', JSON.stringify(courses, null, 2));
//   console.log(`Scraped ${courses.length} courses`);
// }

// main();
