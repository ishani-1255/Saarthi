from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import requests
from groclake.vectorlake import VectorLake
from groclake.modellake import ModelLake

app = Flask(__name__)
CORS(app)

# Initialize your API keys (make sure these are set in your environment)
GROCLAKE_API_KEY = os.environ.get('GROCLAKE_API_KEY')
GROCLAKE_ACCOUNT_ID = os.environ.get('GROCLAKE_ACCOUNT_ID')

os.environ['GROCLAKE_API_KEY'] = '43ec517d68b6edd3015b3edc9a11367b'
os.environ['GROCLAKE_ACCOUNT_ID'] = '7376846f01e0b6e5f1568fef7b48a148'

# Predefined document URL
DOCUMENT_URL = "https://drive.google.com/uc?export=download&id=1yFjAXbGYHju0WaYXygKaqcKwK0nEpfSe"

# Initialize lakes
vectorlake = VectorLake()
modellake = ModelLake()

@app.route('/emergency', methods=['POST'])
def chat():
    try:
        data = request.json
        query = data.get('query')

        if not query:
            return jsonify({"error": "No query provided"}), 400

        # Fetch document content from the predefined URL
        try:
            response = requests.get(DOCUMENT_URL)
            response.raise_for_status()
            document_content = response.text
        except Exception as e:
            return jsonify({"error": f"Failed to fetch document content: {str(e)}"}), 400

        # Generate vectors for the document and the query
        document_vector_data = vectorlake.generate(document_content)
        document_vector = document_vector_data.get("vector")

        query_vector_data = vectorlake.generate(query)
        query_vector = query_vector_data.get("vector")

        if not document_vector or not query_vector:
            return jsonify({"response": "I'm sorry, I couldn't process your query or the document."}), 200

        # Perform vector search based on the query and document
        search_request = {
            "vector": query_vector,
            "vector_type": "text",
            "vector_document": document_content
        }

        search_response = vectorlake.search(search_request)
        results = search_response.get("results", [])

        # Create enriched context from the top search results
        enriched_context = " ".join([r.get("vector_document", "") for r in results[:3]])

        # Prepare ModelLake query using enriched context
        messages = [
            {"role": "system", "content": "You are an emergency response assistant. Provide clear, concise, and actionable advice."},
            {"role": "user", "content": f"Based on this context: {enriched_context}, provide emergency guidance for: {query}"}
        ]

        # Get response from ModelLake
        chat_response = modellake.chat_complete({
            "messages": messages,
            "token_size": 2000
        })

        response = chat_response.get("answer", "I apologize, but I couldn't generate a proper response.")
        return jsonify({"response": response})

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({"response": "I'm having trouble processing your request. Please try again."}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)
