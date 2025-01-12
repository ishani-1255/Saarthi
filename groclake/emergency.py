# -*- coding: utf-8 -*-
import os

# Set API key and account ID
GROCLAKE_API_KEY = 'your_groclake_api_key'
GROCLAKE_ACCOUNT_ID = 'your_groclake_account_id'

# Set them as environment variables
os.environ['GROCLAKE_API_KEY'] = '43ec517d68b6edd3015b3edc9a11367b'
os.environ['GROCLAKE_ACCOUNT_ID'] = '7376846f01e0b6e5f1568fef7b48a148'

print("Environment variables set successfully.")

"""# Step 3: Initialize VectorLake and DataLake
Create instances of VectorLake and DataLake. These are core components for managing vectors and data
"""

from groclake.vectorlake import VectorLake
from groclake.datalake import DataLake
from groclake.modellake import ModelLake

try:
    # Initialize VectorLake
    vectorlake = VectorLake()
    vector_create = vectorlake.create()
    vectorlake_id = vector_create["vectorlake_id"]
    print(f"VectorLake created with ID: {vectorlake_id}")

    # Initialize DataLake
    datalake = DataLake()
    datalake_create = datalake.create()
    datalake_id = datalake_create["datalake_id"]
    print(f"DataLake created with ID: {datalake_id}")

except Exception as e:
    print("Error during VectorLake or DataLake creation:", str(e))

"""# Step 4: Push a Document to DataLake
Upload a document to DataLake for processing. The document in this case is accessed via a URL.
"""

try:
    # Prepare payload for pushing the document
    payload_push = {
        "datalake_id": datalake_id,
        "document_type": "url",
        "document_data": "https://drive.google.com/uc?export=download&id=1SPVyliHvBQxYoT4mJZH4sSmd1MpYfqPs"   
    }

    # Push the document
    data_push = datalake.push(payload_push)
    document_id = data_push.get("document_id")

    if not document_id:
        raise ValueError("Document ID not found in the push response.")

    print(f"Document pushed successfully. Document ID: {document_id}")

except Exception as e:
    print("Error while pushing document:", str(e))

"""# Step 5: Fetch the Document from DataLake
Retrieve the document in chunks for further processing.
"""

try:
    # Prepare payload for fetching the document
    payload_fetch = {
        "document_id": document_id,
        "datalake_id": datalake_id,
        "fetch_format": "chunk",
        "chunk_size": "500"
    }

    # Fetch the document
    data_fetch = datalake.fetch(payload_fetch)
    document_chunks = data_fetch.get("document_data", [])

    if not document_chunks:
        raise ValueError("No document data found.")

    print(f"Document fetched successfully. Total chunks: {len(document_chunks)}")

    # Print each chunk and its index
    for index, chunk in enumerate(document_chunks):
        print(f"Chunk {index + 1}: {chunk}")

except Exception as e:
    print("Error while fetching document:", str(e))

"""# Step 6: Process and Push Document Chunks
For each chunk, generate a vector representation and push it to VectorLake.
"""

try:
    for idx, chunk in enumerate(document_chunks):
        print(f"Processing chunk {idx + 1}: {chunk}")

        # Generate vector for the chunk
        vector_doc = vectorlake.generate(chunk)
        vector_chunk = vector_doc.get("vector")

        if not vector_chunk:
            raise ValueError(f"Vector generation failed for chunk {idx + 1}.")

        # Prepare payload for pushing the vector
        vectorlake_push_request = {
            "vector": vector_chunk,
            "vectorlake_id": vectorlake_id,
            "document_text": chunk,
            "vector_type": "text",
            "metadata": {}
        }

        # Push vector to VectorLake
        push_response = vectorlake.push(vectorlake_push_request)
        print(f"Push response for chunk {idx + 1}: {push_response}")

except Exception as e:
    print("Error while processing and pushing chunks:", str(e))

"""# Step 7: Perform a Vector Search
Search VectorLake using a query. Generate a vector for the search query and execute the search.
"""

# try:
#     # Generate vector for the search query
#     search_query = "Recylcing Rate"
#     vector_search_data = vectorlake.generate(search_query)
#     search_vector = vector_search_data.get("vector")

#     if not search_vector:
#         raise ValueError("Search vector generation failed.")

#     # Prepare payload for the search
#     search_payload = {
#         "vector": search_vector,
#         "vectorlake_id": vectorlake_id,
#         "vector_type": "text",
#     }

#     # Perform the search
#     search_response = vectorlake.search(search_payload)
#     print("Search results:", search_response)

# except Exception as e:
#     print("Error while performing vector search:", str(e))

"""# Step 8: Advanced Search and Enrich Context with ModelLake
Use the search results to enrich a context and query ModelLake for additional insights.
"""

try:
    # Generate vector for the search query
    search_query = "what is class 5th syllabus ?"
    vector_search_data = vectorlake.generate(search_query)
    search_vector = vector_search_data.get("vector")

    if not search_vector:
        raise ValueError("Search vector generation failed.")

    # Prepare the vector search request with metadata
    vectorlake_search_request = {
        "vector": search_vector,
        "vector_type": "text",
        "vector_document": search_query,
        "metadata": {
            "key": "value"  # Include custom metadata as needed
        }
    }

    print("VectorLake Search Request:", vectorlake_search_request)

    # Perform vector search in VectorLake
    search_response = vectorlake.search(vectorlake_search_request)
    print("Search Response:", search_response)

    # Extract search results from the response
    search_results = search_response.get("results", [])
    if not search_results:
        raise ValueError("No relevant search results found.")

    # Combine relevant vector documents into enriched context
    enriched_context = []
    token_count = 0

    for result in search_results:
        doc_content = result.get("vector_document", "")
        doc_tokens = len(doc_content.split())

        if token_count + doc_tokens <= 1000:  # Adjust limit dynamically
            enriched_context.append(doc_content)
            token_count += doc_tokens
        else:
            break  # Stop when the token limit is reached

    enriched_context = " ".join(enriched_context)
    print("Enriched Context:", enriched_context)

    # Construct the ModelLake query with enriched context
    payload = {
        "messages": [
            {"role": "system", "content": "You are a helpful assistant."},
            {
                "role": "user",
                "content": f"Using the following context from retrieved documents: {enriched_context}, "
                           f"please provide a detailed explanation on : {search_query}"
            }
        ],
        "token_size": 3000
    }

    # Query ModelLake for a response
    try:
        chat_response = ModelLake().chat_complete(payload)
        # Extract the assistant's answer
        answer = chat_response.get("answer", "No answer received from ModelLake.")
        print("Chat Answer:", answer)
    except Exception as e:
        print("An error occurred with ModelLake:", str(e))

except Exception as e:
    print("Error during vector search or processing:", str(e))