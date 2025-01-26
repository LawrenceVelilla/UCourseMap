from flask import Flask, request, jsonify, render_template
import json
from search_tool import search_course  

# Load course data
with open('standardized_csclasses.json', 'r') as f:
    course_data = json.load(f)

app = Flask(__name__)

# HTML file
@app.route('/')
def index():
    return render_template('index.html')

# API Endpoint for searching courses
@app.route('/search', methods=['GET'])
def search():
    query = request.args.get('q')
    if not query:
        return jsonify({"error": "Query is missing"}), 400

    result = search_course(course_data, query)  
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True)
