const cheerio = require('cheerio');
const axios = require('axios');
const fs = require('fs');

async function scrapeCourses(url) {
  try {
    const response = await axios.get(url);
    return parseCoursesHTML(response.data);
  } catch (error) {
    console.error('Error fetching courses:', error);
    return [];
  }
}

function parseCoursesHTML(html) {
  const $ = cheerio.load(html);
  const courses = [];
  
  $('.course.first').each((_, element) => {
    const $course = $(element);
    
    // Extract course header info
    const headerText = $course.find('h2 a').text().trim();
    const courseUrl = $course.find('h2 a').attr('href');
    
    // Parse course code and title
    const codeTitleMatch = headerText.match(/^([A-Z]+\s\d+)\s*[-–—]?\s*(.*)/);
    const courseCode = codeTitleMatch ? codeTitleMatch[1] : '';
    const title = codeTitleMatch ? codeTitleMatch[2] : headerText;

    // Ectract department
    const department = courseCode.split(' ')[0];
    
    // Extract units
    const unitsText = $course.find('b').text().trim();
    const unitsMatch = unitsText.match(/(\d+)\s+units\s+\(fi\s+(\d+)\)\s*\(([^)]+)\)/);
    const units = {
      credits: unitsMatch ? parseInt(unitsMatch[1]) : null,
      feeIndex: unitsMatch ? parseInt(unitsMatch[2]) : null,
      term: unitsMatch ? unitsMatch[3] : null
    };
    
    // Extract description
    let description = $course.find('p').text().trim();
    // Clean up description (remove the debugging info at the end)
    description = description.replace(/"\s*==\s*\$\d+$/, '').trim();
    // Remove surrounding quotes if present
    description = description.replace(/^"(.+)"$/, '$1');
    
    courses.push({
      department,
      courseCode,
      title,
      units,
      description,
      url: courseUrl
    });
  });
  
  return courses;
}

// Usage example
async function main() {
  const courses = await scrapeCourses('https://apps.ualberta.ca/catalogue/course/cmput');
  fs.writeFileSync('courses.json', JSON.stringify(courses, null, 2));
  console.log(`Scraped ${courses.length} courses`);
}

main();