import json
import re


'''
TODO: Add condition for "Prerequisite or Corequisite" in the description
      Fix condition for "and" and "or" in the description for the "All of" group

'''

def extract_and_remove(description, pattern):
    """Extract and remove the matched text based on the pattern."""
    match = re.search(pattern, description)
    if match:
        extracted = match.group(1).strip()
        description = re.sub(pattern, "", description)
        return extracted, description
    return None, description

import re

def parse_courses(course_text):
    """
    Parse prerequisites or corequisites to extract groups like 'One of' and handle prefix propagation
    in both 'One of' and 'All of' sections.
    """
    parsed = []
    if not course_text:
        return parsed

   
    one_of_groups = re.finditer(r"(?:[Oo]ne of) (.+?)(?:,? and |\.|$)", course_text)
    for group in one_of_groups:
        options_text = group.group(1)
        options = re.split(r",|\bor\b", options_text)
        options = [opt.strip() for opt in options if opt.strip()]


        parsed_options = []
        current_prefix = None
        for opt in options:
            if re.match(r"^[A-Za-z]+\s*\d+$", opt):  # Full course code (e.g., "STAT 141")
                current_prefix = opt.split()[0]  # Extract prefix (e.g., "STAT")
                parsed_options.append(opt)
            elif re.match(r"^\d+$", opt) and current_prefix:  # Only a number (e.g., "151")
                parsed_options.append(f"{current_prefix} {opt}")
            else:  # Fallback to raw option
                parsed_options.append(opt)

        parsed.append({"One of": parsed_options})

    # I remove matched "One of" groups from the text
    course_text = re.sub(r"(?:[Oo]ne of) .+?(?:,? and |\.|$)", "", course_text, flags=re.IGNORECASE)

    # Handle remaining conditions (e.g., standalone course names or "and")
    if course_text.strip():
        remaining_courses = [course.strip() for course in re.split(r",|and", course_text) if course.strip()]
        parsed_remaining = []
        current_prefix = None
        for course in remaining_courses:
            if re.match(r"^[A-Za-z]+\s*\d+$", course):  # Full course code
                current_prefix = course.split()[0]  # Update the prefix
                parsed_remaining.append(course)
            elif re.match(r"^\d+$", course) and current_prefix:  # Only a number
                parsed_remaining.append(f"{current_prefix} {course}")
            else:  
                parsed_remaining.append(course)
        if parsed_remaining:
            parsed.append({"All of": parsed_remaining})

    return parsed


import re

def cleaner(lst):
    """
    Cleans a list of dictionaries by checking if any values start with 'one of' 
    and processes them accordingly.
    """
    cleaned = []

    for item in lst:  # Loop through each item in the list
        for value in item.values():  # Loop through each value in the dictionary
            if isinstance(value, list):  # Check if the value is a list
                for i in range(len(value)):
                    # Check if the string starts with 'one of'
                    match = re.match(r"one of", value[i], flags=re.IGNORECASE)
                    if match:
                        cleaned.append(value[i])  # Add matching values to the cleaned list
    return cleaned

# Finish this function


def update_courses(input_file, output_file):
    with open(input_file, 'r') as file:
        courses = json.load(file)

    for course in courses:
        description = course.get("description", "")

        
        pre_match = re.search(r"Prerequisite[s]*: (.*?)(?:\.|$)", description)
        co_match = re.search(r"Corequisite[s]*: (.*?)(?:\.|$)", description)

        prerequisites = []
        corequisites = []

        if pre_match and co_match:
            if pre_match.start() < co_match.start():
                co_text, description = extract_and_remove(description, r"Corequisite[s]*: (.*?)(?:\.|$)")
                corequisites = parse_courses(co_text)
            
                pre_text, description = extract_and_remove(description, r"Prerequisite[s]*: (.*?)(?:\.|$)")
                prerequisites = parse_courses(pre_text)

            elif co_match.start() < pre_match.start():
                pre_text, description = extract_and_remove(description, r"Prerequisite[s]*: (.*?)(?:\.|$)")
                prerequisites = parse_courses(pre_text)

                co_text, description = extract_and_remove(description, r"Corequisite[s]*: (.*?)(?:\.|$)")
                corequisites = parse_courses(co_text)
        
        elif pre_match:
            pre_text, description = extract_and_remove(description, r"Prerequisite[s]*: (.*?)(?:\.|$)")
            prerequisites = parse_courses(pre_text)
        
        elif co_match:
            co_text, description = extract_and_remove(description, r"Corequisite[s]*: (.*?)(?:\.|$)")
            corequisites = parse_courses(co_text)

        # if pre_match:
        #     pre_text, description = extract_and_remove(description, r"Prerequisite[s]*: (.*?)(?:\.|$)")
        #     prerequisites = parse_courses(pre_text)

        # if co_match:
        #     co_text, description = extract_and_remove(description, r"Corequisite[s]*: (.*?)(?:\.|$)")
        #     corequisites = parse_courses(co_text)

        # Update the course dictionary
        course["prerequisites"] = prerequisites
        course["corequisites"] = corequisites
        course["description"] = description.strip()  
    with open(output_file, 'w') as file:
        json.dump(courses, file, indent=4)
    print(f"Updated course data saved to {output_file}")



def main():
    while True:
        code = input("Enter a course code: ")
        if code == "exit":
            break
        input_file = f"assets/{code}_classes.json"
        output_file = f"assets/updated_{code}classes.json"
        update_courses(input_file, output_file)    
   

if __name__ == "__main__":
    main()