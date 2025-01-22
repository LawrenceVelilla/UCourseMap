from flask import Flask, request, jsonify, render_template
import json
from search_tool import search_course  # Import your search function

# Load course data
with open('standardized_csclasses.json', 'r') as f:
    course_data = json.load(f)

app = Flask(__name__)

# Serve the HTML file
@app.route('/')
def index():
    return render_template('index.html')

# API Endpoint for searching courses
@app.route('/search', methods=['GET'])
def search():
    query = request.args.get('q')
    if not query:
        return jsonify({"error": "Query is missing"}), 400

    # Use the search_tool to find the course
    
    result = search_course(course_data, query)  # Replace with your actual search logic
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True)
