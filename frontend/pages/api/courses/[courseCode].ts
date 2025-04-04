// --- START OF FILE pages/api/courses/[courseCode].ts ---
import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/dbConnect'; // Adjust path
import CourseModel, { ICourse } from '../../../models/course'; // Adjust path

type Data = {
    course?: ICourse; // Or a subset of fields
    message?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { method } = req;
  const courseCode = req.query.courseCode as string;

  if (!courseCode) {
      return res.status(400).json({ message: 'Course code is required' });
  }

  await dbConnect();

  switch (method) {
    case 'GET':
      try {
        // Find the course by code, select only the fields needed by the frontend
        const course = await CourseModel.findOne({ courseCode: courseCode.toUpperCase() }) // Normalize case if needed
                                        .select('courseCode title parsedDescription requirements credits faculty -_id'); // Example fields

        if (!course) {
          return res.status(404).json({ message: 'Course not found' });
        }

        // Check if parsing was successful before returning requirements
        if (course.parsingStatus !== 'success') {
             // Decide what to return if parsing failed or is pending
             // Option 1: Return basic info without requirements
              return res.status(200).json({
                  course: {
                      courseCode: course.courseCode,
                      title: course.title,
                      // maybe return raw description?
                      message: `Parsing status: ${course.parsingStatus}. Requirements data may be unavailable.`
                  } as any // Cast needed if returning partial structure
              });
             // Option 2: Return 404 or a specific status indicating data isn't ready
             // return res.status(404).json({ message: `Course data processing status: ${course.parsingStatus}` });
        }


        res.status(200).json({ course });
      } catch (error) {
        console.error(`Error fetching course ${courseCode}:`, error);
        res.status(500).json({ message: 'Internal Server Error' });
      }
      break;
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
// --- END OF FILE pages/api/courses/[courseCode].ts ---