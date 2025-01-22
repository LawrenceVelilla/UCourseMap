import json
from search_tool import search_course

# Load the course data
with open('standardized_csclasses.json', 'r') as file:
    course_data = json.load(file)

# Test Cases
test_queries = [
    "CMPUT 267",  # Valid class code
    "CMPUT 174",  # Another valid class code
    "CMPUT 999",  # Invalid class code
    " cmpUt 267  ",  # Valid code with extra spaces and mixed case
    ""             # Empty query
]

# Run tests
for query in test_queries:
    print(f"Testing query: '{query}'")
    result = search_course(course_data, query)
    print(json.dumps(result, indent=2))  # Pretty-print the result
    print("-" * 50)
