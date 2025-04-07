-- CreateTable
CREATE TABLE "courses" (
    "id" UUID NOT NULL,
    "department" TEXT NOT NULL,
    "courseCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "units" JSONB,
    "parsedDescription" TEXT,
    "requirements" JSONB,
    "flattenedPrerequisites" TEXT[],
    "flattenedCorequisites" TEXT[],
    "url" TEXT,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "courses_department_courseCode_key" ON "courses"("department", "courseCode");

