from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from groclake.vectorlake import VectorLake
from groclake.datalake import DataLake
from groclake.modellake import ModelLake

app = Flask(__name__)
CORS(app)

# Initialize your API keys (make sure these are set in your environment)
GROCLAKE_API_KEY = os.environ.get('GROCLAKE_API_KEY')
GROCLAKE_ACCOUNT_ID = os.environ.get('GROCLAKE_ACCOUNT_ID')

os.environ['GROCLAKE_API_KEY'] = '43ec517d68b6edd3015b3edc9a11367b'
os.environ['GROCLAKE_ACCOUNT_ID'] = '7376846f01e0b6e5f1568fef7b48a148'

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

        # Generate vector for search
        vector_data = vectorlake.generate(query)
        search_vector = vector_data.get("vector")

        if not search_vector:
            return jsonify({"response": "I'm sorry, I couldn't process your query. Please try again."}), 200

        # Prepare and perform vector search
        search_request = {
            "vector": search_vector,
            "vector_type": "text",
            "vector_document": query
        }

        search_response = vectorlake.search(search_request)
        results = search_response.get("results", [])

        # Process search results
        context = ""
        if results:
            context = " ".join([r.get("vector_document", "") for r in results[:3]])

        # Prepare ModelLake query
        messages = [
            {"role": "system", "content": "You are an emergency response assistant. Provide clear, concise, and actionable advice."},
            {"role": "user", "content": f"Based on this context: {context}, provide emergency guidance for: {query}"}
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