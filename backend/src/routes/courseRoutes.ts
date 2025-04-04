// backend/src/routes/courseRoutes.ts

import express from 'express';
import courseController from '../controllers/courseController';

const router = express.Router();

// GET routes
router.get('/courses', courseController.getAllCourses);
router.get('/courses/search', courseController.searchCourses);
router.get('/courses/:code', courseController.getCourseByCode);

// POST routes
router.post('/courses', courseController.createCourse);

// PUT routes
router.put('/courses/:code', courseController.updateCourse);

// DELETE routes
router.delete('/courses/:code', courseController.deleteCourse);

export default router;