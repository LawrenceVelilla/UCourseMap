import json

path = "assets/standardized_csclasses.json"


def standardize_corequisites(courses):
    """
    Standardize corequisites to use `one_of` or `all_of` format.

    Args:
        courses (list): List of course dictionaries.
    """
    for course in courses:
        standardized_coreqs = []

        for coreq in course.get("corequisites", []):
            if isinstance(coreq, str):
                # Convert simple string to "one_of" with one option
                standardized_coreqs.append({"type": "one_of", "options": [coreq]})
            elif isinstance(coreq, dict):
                # If it's already a structured corequisite (e.g., "One of"), map to new structure
                for key, value in coreq.items():
                    if key.lower() == "one of":
                        standardized_coreqs.append({"type": "one_of", "options": value})
                    elif key.lower() == "all of":
                        standardized_coreqs.append({"type": "all_of", "options": value})
            elif isinstance(coreq, list):
                # Convert simple list to "all_of"
                standardized_coreqs.append({"type": "all_of", "options": coreq})

        course["corequisites"] = standardized_coreqs


with open(path, "r") as file:
    courses = json.load(file)

standardize_corequisites(courses)

with open("assets/standardized_csclasses.json", "w") as file:
    json.dump(courses, file, indent=4)