import json

path = "standardized_csclasses.json"


def normalize_json(course_data):
    """
    Normalize JSON data to replace "One of" and "All of" keys with a consistent "type" and "options" structure.
    
    Args:
        course_data (list): List of course dictionaries.
    
    Returns:
        list: Normalized course data.
    """
    def normalize_options(options):
        normalized = []
        for option in options:
            if isinstance(option, dict):
                for key, value in option.items():
                    if key in ["One of", "All of"]:
                        normalized.append({
                            "type": key.lower().replace(" ", "_"),
                            "options": normalize_options(value)  # Recurse for nested options
                        })
                    else:
                        normalized.append({
                            "type": key.lower().replace(" ", "_"),
                            "options": value if isinstance(value, list) else [value]
                        })
            else:
                normalized.append(option)  # Simple string options
        return normalized

    for course in course_data:
        # Normalize prerequisites
        for prereq in course.get('prerequisites', []):
            if "options" in prereq:
                prereq["options"] = normalize_options(prereq["options"])

        # Normalize corequisites
        for coreq in course.get('corequisites', []):
            if "options" in coreq:
                coreq["options"] = normalize_options(coreq["options"])

    return course_data

with open(path, "r") as file:
    courses = json.load(file)

courses = normalize_json(courses)

with open("standardized_csclasses.json", "w") as file:
    json.dump(courses, file, indent=4)