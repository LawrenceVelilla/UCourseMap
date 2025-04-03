'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import CourseService from '@/services/api';
import { Course } from '../../components/requirementTree';

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await CourseService.getAllCourses();
        setCourses(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch courses. Please try again later.');
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  // Filter courses based on search term
  const filteredCourses = courses.filter(
    course => 
      course.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
      course.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Course Catalog</h1>
      
      {/* Search bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search courses by code or title..."
          className="w-full md:w-1/2 p-2 border border-gray-300 rounded"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="text-center py-10">
          <p className="text-lg">Loading courses...</p>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map(course => (
            <div key={course.code} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <Link href={`/courses/${course.code}`}>
                <h2 className="text-xl font-bold text-blue-600">{course.code}</h2>
                <h3 className="text-lg mb-2">{course.title}</h3>
                
                {(course.prerequisites && course.prerequisites.length > 0) && (
                  <div className="mt-2">
                    <span className="font-semibold">Prerequisites:</span> {course.prerequisites.join(', ')}
                  </div>
                )}
                
                {(course.corequisites && course.corequisites.length > 0) && (
                  <div className="mt-1">
                    <span className="font-semibold">Corequisites:</span> {course.corequisites.join(', ')}
                  </div>
                )}
              </Link>
            </div>
          ))}
        </div>
      )}
      
      {!loading && !error && filteredCourses.length === 0 && (
        <div className="text-center py-10">
          <p className="text-lg">No courses found matching "{searchTerm}"</p>
        </div>
      )}
    </div>
  );
}