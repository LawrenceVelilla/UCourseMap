// backend/src/controllers/courseController.ts

import { Request, Response } from 'express';
import CourseModel, { 
  ICourse, 
  ProcessedCourseDataforDB,
  CourseRequirements 
} from '../models/course';
import dbConnect from '../lib/dbConnect';

export const courseController = {
  // Get all courses (with optional filtering)
  getAllCourses: async (req: Request, res: Response): Promise<void> => {
    try {
      await dbConnect();
      
      // Extract query parameters for filtering
      const { department, search } = req.query;
      let query: any = {};
      
      // Apply filters if provided
      if (department) {
        query.department = department;
      }
      
      if (search) {
        // Search in course code or title
        query.$or = [
          { courseCode: { $regex: search, $options: 'i' } },
          { title: { $regex: search, $options: 'i' } }
        ];
      }
      
      // Execute query with projection to limit fields returned
      const courses = await CourseModel
        .find(query)
        .select('courseCode title department requirements.flattenedPrerequisites requirements.flattenedCorequisites')
        .sort({ courseCode: 1 }) // Sort by course code
        .limit(100); // Limit to prevent overwhelming responses
      
      res.status(200).json(courses);
    } catch (error) {
      console.error('Error in getAllCourses:', error);
      res.status(500).json({ error: 'Failed to fetch courses' });
    }
  },
  
  // Get a single course by code
  getCourseByCode: async (req: Request, res: Response): Promise<void> => {
    try {
      await dbConnect();
      
      const { code } = req.params;
      
      if (!code) {
        res.status(400).json({ error: 'Course code is required' });
        return;
      }
      
      // Find course case-insensitive
      const course = await CourseModel.findOne({ 
        courseCode: new RegExp(`^${code}$`, 'i') 
      });
      
      if (!course) {
        res.status(404).json({ error: 'Course not found' });
        return;
      }
      
      res.status(200).json(course);
    } catch (error) {
      console.error(`Error in getCourseByCode for ${req.params.code}:`, error);
      res.status(500).json({ error: 'Failed to fetch course' });
    }
  },
  
  // Create a new course
  createCourse: async (req: Request, res: Response): Promise<void> => {
    try {
      await dbConnect();
      
      const courseData: ProcessedCourseDataforDB = req.body;
      
      // Validate required fields
      if (!courseData.courseCode || !courseData.title) {
        res.status(400).json({ error: 'Course code and title are required' });
        return;
      }
      
      // Check if course already exists
      const existingCourse = await CourseModel.findOne({ 
        courseCode: courseData.courseCode 
      });
      
      if (existingCourse) {
        res.status(409).json({ error: 'Course with this code already exists' });
        return;
      }
      
      // Create new course
      const newCourse = new CourseModel({
        ...courseData,
        parsingStatus: courseData.parsingStatus || 'pending'
      });
      
      await newCourse.save();
      res.status(201).json(newCourse);
    } catch (error) {
      console.error('Error in createCourse:', error);
      res.status(500).json({ error: 'Failed to create course' });
    }
  },
  
  // Update an existing course
  updateCourse: async (req: Request, res: Response): Promise<void> => {
    try {
      await dbConnect();
      
      const { code } = req.params;
      const updates = req.body;
      
      if (!code) {
        res.status(400).json({ error: 'Course code is required' });
        return;
      }
      
      // Find and update course
      const updatedCourse = await CourseModel.findOneAndUpdate(
        { courseCode: code },
        { $set: updates },
        { new: true, runValidators: true }
      );
      
      if (!updatedCourse) {
        res.status(404).json({ error: 'Course not found' });
        return;
      }
      
      res.status(200).json(updatedCourse);
    } catch (error) {
      console.error(`Error in updateCourse for ${req.params.code}:`, error);
      res.status(500).json({ error: 'Failed to update course' });
    }
  },
  
  // Delete a course
  deleteCourse: async (req: Request, res: Response): Promise<void> => {
    try {
      await dbConnect();
      
      const { code } = req.params;
      
      if (!code) {
        res.status(400).json({ error: 'Course code is required' });
        return;
      }
      
      // Find and delete course
      const deletedCourse = await CourseModel.findOneAndDelete({ 
        courseCode: code 
      });
      
      if (!deletedCourse) {
        res.status(404).json({ error: 'Course not found' });
        return;
      }
      
      res.status(200).json({ message: 'Course deleted successfully' });
    } catch (error) {
      console.error(`Error in deleteCourse for ${req.params.code}:`, error);
      res.status(500).json({ error: 'Failed to delete course' });
    }
  },
  
  // Search courses by various criteria
  searchCourses: async (req: Request, res: Response): Promise<void> => {
    try {
      await dbConnect();
      
      const { q, department, hasPrerequisites } = req.query;
      
      let query: any = {};
      
      // Text search
      if (q) {
        query.$or = [
          { courseCode: { $regex: q, $options: 'i' } },
          { title: { $regex: q, $options: 'i' } },
          { parsedDescription: { $regex: q, $options: 'i' } }
        ];
      }
      
      // Department filter
      if (department) {
        query.department = department;
      }
      
      // Prerequisites filter
      if (hasPrerequisites === 'true') {
        query['requirements.flattenedPrerequisites.0'] = { $exists: true };
      } else if (hasPrerequisites === 'false') {
        query['requirements.flattenedPrerequisites'] = { $size: 0 };
      }
      
      const courses = await CourseModel
        .find(query)
        .select('courseCode title department requirements.flattenedPrerequisites requirements.flattenedCorequisites')
        .sort({ courseCode: 1 })
        .limit(50);
      
      res.status(200).json(courses);
    } catch (error) {
      console.error('Error in searchCourses:', error);
      res.status(500).json({ error: 'Failed to search courses' });
    }
  }
};

export default courseController;