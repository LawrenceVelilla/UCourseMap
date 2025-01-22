import json

'''
Search Tool
'''

def load_program(path):
    with open(path, "r") as file:
        courses = json.load(file)
        return courses


def find_course(course_code, courses):
    for course in courses:
        if course["course_code"].lower() == course_code.lower():
            return course

        
    return None

def search_course(courses, query):
    query = query.strip().lower()
    for course in courses:
        if course["course_code"].lower() == query:
            return display_course2(course)


def display_course2(course):
    if not course:
        return {"error": "Course not found."}
    
    course_details = {
        "course_title": course["course_title"],
        "description": course.get("description", "No description available."),
        "prerequisites": [],
        "corequisites": []
    }

    for prereq in course.get("prerequisites", []):
        if prereq.get("type") == "one_of":
            course_details["prerequisites"].append({
                "type": "one_of",
                "options": prereq.get("options", [])
            })
        elif prereq.get("type") == "all_of":
            course_details["prerequisites"].append({
                "type": "all_of",
                "options": prereq.get("options", [])
            })
    for coreq in course.get("corequisites", []):
        if coreq.get("type") == "one_of":
            course_details["corequisites"].append({
                "type": "one_of",
                "options": coreq.get("options", [])
            })
        elif coreq.get("type") == "all_of":
            course_details["corequisites"].append({
                "type": "all_of",
                "options": coreq.get("options", [])
            })
    return course_details


def display_course(course):
    if course:
        print(f"\nCourse Title: \n{course['course_title']}")
        print(f"\nDescription: \n{course['description']}")
        print("\nPrequisites:")
        for prereq in course.get("prerequisites", []):
            if prereq.get("type") == "one_of":
                print("\nOne of:")
                # Should check if theres any nested loops within restricions
                for option in prereq.get("options", []):
                    if isinstance(option, dict):
                        for key, value in option.items():
                            print(f"- {key}:")
                            for i in range(len(value)):
                                print(f"  - {value[i]}")
                    else:
                        print(f"- {option}")
    
            elif prereq.get("type") == "all_of":
                print("\nAll of:")
                for option in prereq.get("options", []):
                    print(f"- {option}")
        
        print("\nCorequisites:")
        for coreq in course.get("corequisites", []):
            if coreq.get("type") == "one_of":
                print("\nOne of:")
                for option in coreq.get("options", []):
                    if isinstance(option, dict):
                        for key, value in option.items():
                            print(f"- {key}:")
                            for i in range(len(value)):
                                print(f"  - {value[i]}")
                    else:
                        print(f"- {option}")
            elif coreq.get("type") == "all_of":
                print("\nAll of:")
                for option in coreq.get("options", []):
                    print(f"- {option}")
    else:
        print("Course not found.")

    



def main():
    courses = load_program(f"assets/standardized_csclasses.json")

    done = False

    while not done:
        code = input("Enter a course code (q to stop): ")
        if code.lower() == "q":
            done = True
        else:
            course_description = find_course(code, courses)
            display_course(course_description)


if __name__ == "__main__":
    main()