import axios from 'axios';
import { Course } from '../../components/requirementTree';

// Base URL for API requests - this will go through Next.js rewrites
const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const CourseService = {
  // Get all courses
  getAllCourses: async (): Promise<Course[]> => {
    try {
      const response = await api.get('/courses');
      return response.data;
    } catch (error) {
      console.error('Error fetching courses:', error);
      throw error;
    }
  },

  // Get a single course by code
  getCourse: async (code: string): Promise<Course> => {
    try {
      const response = await api.get(`/courses/${code}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching course ${code}:`, error);
      throw error;
    }
  },

  // Create a new course
  createCourse: async (course: Omit<Course, '_id'>): Promise<Course> => {
    try {
      const response = await api.post('/courses', course);
      return response.data;
    } catch (error) {
      console.error('Error creating course:', error);
      throw error;
    }
  },

  // Update an existing course
  updateCourse: async (code: string, course: Partial<Course>): Promise<Course> => {
    try {
      const response = await api.put(`/courses/${code}`, course);
      return response.data;
    } catch (error) {
      console.error(`Error updating course ${code}:`, error);
      throw error;
    }
  },

  // Delete a course
  deleteCourse: async (code: string): Promise<{ message: string }> => {
    try {
      const response = await api.delete(`/courses/${code}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting course ${code}:`, error);
      throw error;
    }
  }
};

export default CourseService;