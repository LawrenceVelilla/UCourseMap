// script.js
document.getElementById('searchButton').addEventListener('click', async () => {
    const query = document.getElementById('courseSearch').value;
    if (!query) {
        alert('Please enter a course!');
        return;
    }

    try {
        const response = await fetch(`/search?q=${encodeURIComponent(query)}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();


        if (data.error) {
            alert(data.error);
        } else {
            document.getElementById('courseTitle').textContent = data.course_title || "No Title Found";
            document.getElementById('courseDescription').textContent = data.description || "No Description Found";

            // Render prerequisites
            const prereqList = document.getElementById('prerequisitesList');
            prereqList.innerHTML = '';
            renderList(prereqList, data.prerequisites || []);

            // Render corequisites
            const coreqList = document.getElementById('corequisitesList');
            coreqList.innerHTML = '';
            renderList(coreqList, data.corequisites || []);
        }
    } catch (error) {
        console.error("Error fetching course data:", error);
        alert('An error occurred while searching. Please try again.');
    }
});

function renderList(element, data) {
    if (Array.isArray(data)) {
        const ul = document.createElement("ul");
        data.forEach(item => {
            const li = document.createElement("li");
            if (typeof item === "string") {
                li.textContent = item;
            } else if (typeof item === "object" && item.type && item.options) {
                li.textContent = capitalize(item.type) + ":";
                renderList(li, item.options);
            } else if (typeof item === "object") {
                // Need to fuckin I HATE IT Handle nested "One of", "All of" cases
                Object.entries(item).forEach(([key, value]) => {
                    const nestedLi = document.createElement("li");
                    nestedLi.textContent = capitalize(key) + ":";
                    renderList(nestedLi, value);
                    li.appendChild(nestedLi);
                });
            }
            ul.appendChild(li);
        });
        element.appendChild(ul);
    }
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
