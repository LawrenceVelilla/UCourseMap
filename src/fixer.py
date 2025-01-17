import json

path = "assets/updated_csclasses.json"


def main():
    with open(path, 'r') as file:
        courses = json.load(file)
    
    for course in courses:
        course_title = course.get("course_title", "")
        course_code = course_title.split(" -")[0]

        course["course_code"] = course_code

    with open(path, 'w') as file:
        json.dump(courses, file, indent=4)


main()