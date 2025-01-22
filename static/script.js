document.getElementById('searchButton').addEventListener('click', async () => {
    const query = document.getElementById('courseSearch').value;
    if (!query) {
        alert('Please enter a course!');
        return;
    }

    try {
        // Call the Flask backend API
        const response = await fetch(`/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();

        if (data.error) {
            alert(data.error);
        } else {
            // Populate course details
            document.getElementById('courseTitle').textContent = data.course_title || "No Title Found";
            document.getElementById('courseDescription').textContent = data.description || "No Description Found";

           // Helper function to render prerequisite/corequisite options
            function renderOptions(options) {
                return options.map(option => {
                    if (typeof option === 'object') {
                        if (option.type && option.options) {
                            // For nested objects like {type: "One of", options: [...]}
                            return `${option.type}: ${option.options.join(", ")}`;
                        }
                    }
                    return option; // Return the option directly if it's a string
                }).join("<br>"); // Join multiple lines with <br>
            }

            // Populate prerequisites
            const prereqList = document.getElementById('prerequisitesList');
            prereqList.innerHTML = ''; // Clear previous content
            (data.prerequisites || []).forEach(prereq => {
                const li = document.createElement('li');
                li.innerHTML = renderOptions(prereq.options); // Use the helper function
                prereqList.appendChild(li);
            });

            // Populate corequisites
            const coreqList = document.getElementById('corequisitesList');
            coreqList.innerHTML = ''; // Clear previous content
            (data.corequisites || []).forEach(coreq => {
            const li = document.createElement('li');
            li.innerHTML = renderOptions(coreq.options); // Use the helper function
            coreqList.appendChild(li);
            });

        }
    } catch (error) {
        console.error('Error fetching course data:', error);
        alert('An error occurred while searching. Please try again.');
    }
});
