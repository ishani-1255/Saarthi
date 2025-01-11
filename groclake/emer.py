# app.py
from flask import Flask, request, jsonify
from groclake.vectorlake import VectorLake
from groclake.datalake import DataLake
from groclake.modellake import ModelLake

app = Flask(__name__)

# Initialize instances
vectorlake = VectorLake()
datalake = DataLake()
modellake = ModelLake()

@app.route('/chat', methods=['POST'])
def chatbot_handler():
    try:
        # Get the search query from the request
        data = request.get_json()
        search_query = data.get('search_query', '')

        if not search_query:
            return jsonify({"error": "No search query provided."}), 400

        # Generate vector for the search query
        vector_search_data = vectorlake.generate(search_query)
        search_vector = vector_search_data.get("vector")

        if not search_vector:
            return jsonify({"error": "Search vector generation failed."}), 500

        # Perform vector search in VectorLake
        vectorlake_search_request = {
            "vector": search_vector,
            "vector_type": "text",
            "vector_document": search_query,
            "metadata": {}
        }
        search_response = vectorlake.search(vectorlake_search_request)
        search_results = search_response.get("results", [])

        if not search_results:
            return jsonify({"error": "No relevant search results found."}), 404

        # Combine relevant documents into enriched context
        enriched_context = []
        token_count = 0
        for result in search_results:
            doc_content = result.get("vector_document", "")
            doc_tokens = len(doc_content.split())

            if token_count + doc_tokens <= 1000:  # Adjust limit dynamically
                enriched_context.append(doc_content)
                token_count += doc_tokens
            else:
                break

        enriched_context = " ".join(enriched_context)

        # Query ModelLake with enriched context
        payload = {
            "messages": [
                {"role": "system", "content": "You are a helpful assistant."},
                {
                    "role": "user",
                    "content": f"Using the following context: {enriched_context}, "
                               f"please provide a detailed explanation on: {search_query}"
                }
            ],
            "token_size": 3000
        }

        chat_response = modellake.chat_complete(payload)
        answer = chat_response.get("answer", "No answer received from ModelLake.")
        return jsonify({"answer": answer})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
