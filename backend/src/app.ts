// backend/src/app.ts
import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Course } from './models/course';

// Type definitions for request bodies
interface CreateCourseBody {
  code: string;
  title: string;
  prerequisites?: string[];
  corequisites?: string[];
}

interface UpdateCourseBody extends Partial<CreateCourseBody> {}

// Initialize Express
const app = express();
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI!)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// ---- CRUD Routes ---- //

// 1. GET /courses - Get all courses
app.get('/courses', async (req: Request, res: Response) => {
  try {
    const courses = await Course.find().sort({ code: 1 });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// 2. GET /courses/:code - Get single course
app.get('/courses/:code', async (req: Request<{ code: string }>, res: Response) => {
  try {
    const course = await Course.findOne({ code: req.params.code });
    if (!course) return res.status(404).json({ error: 'Course not found' });
    res.json(course);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch course' });
  }
});

// 3. POST /courses - Create new course
app.post('/courses', async (req: Request<{}, {}, CreateCourseBody>, res: Response) => {
  try {
    const { code, title, prerequisites = [], corequisites = [] } = req.body;
    
    const existingCourse = await Course.findOne({ code });
    if (existingCourse) {
      return res.status(400).json({ error: 'Course already exists' });
    }

    const course = new Course({ code, title, prerequisites, corequisites });
    await course.save();
    res.status(201).json(course);
  } catch (err) {
    res.status(400).json({ error: 'Invalid course data' });
  }
});

// 4. PUT /courses/:code - Update course
app.put('/courses/:code', async (req: Request<{ code: string }, {}, UpdateCourseBody>, res: Response) => {
  try {
    const course = await Course.findOneAndUpdate(
      { code: req.params.code },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    
    if (!course) return res.status(404).json({ error: 'Course not found' });
    res.json(course);
  } catch (err) {
    res.status(400).json({ error: 'Invalid update data' });
  }
});

// 5. DELETE /courses/:code - Delete course
app.delete('/courses/:code', async (req: Request<{ code: string }>, res: Response) => {
  try {
    const course = await Course.findOneAndDelete({ code: req.params.code });
    if (!course) return res.status(404).json({ error: 'Course not found' });
    res.json({ message: 'Course deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete course' });
  }
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: Function) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app; // For testing