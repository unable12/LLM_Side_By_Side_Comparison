import os
import requests
from flask import current_app

WORDWARE_API_KEY = os.environ.get('WORDWARE_API_KEY')

# Model URLs and their respective versions
MODEL_CONFIGS = {
    # Available Models
    'claude-3-sonnet': {
        'url': "https://app.wordware.ai/api/released-app/2e33b894-8412-4970-8dce-6f05d765ac3a/run",
        'version': "^1.3"
    },
    'claude-3-haiku': {
        'url': "https://app.wordware.ai/api/released-app/42299e31-f438-4baa-b4e4-f143fd34c367/run",
        'version': "^1.0"
    },
    'gpt-4o': {
        'url': "https://app.wordware.ai/api/released-app/c4ae4021-0e70-4072-a4d1-a3141d493700/run",
        'version': "^1.3"
    },
    'gemini-1.5-pro': {
        'url': "https://app.wordware.ai/api/released-app/59bb9ab6-9bbe-49c0-8773-2e0bbd855337/run",
        'version': "^1.0"
    },
    'mistral-large-2': {
        'url': "https://app.wordware.ai/api/released-app/42f7385c-7106-438d-b48e-053c481cae1c/run",
        'version': "^1.0"
    },
    'llama-3.2-90b': {
        'url': "https://app.wordware.ai/api/released-app/cde9fa72-7a30-4a6d-82ca-c4975baab4e8/run",
        'version': "^1.0"
    }
}

def call_wordware_api(model, prompt):
    if model not in MODEL_CONFIGS:
        raise ValueError(f"Unknown model: {model}")

    config = MODEL_CONFIGS[model]

    headers = {
        "Authorization": f"Bearer {WORDWARE_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "inputs": {
            "input": prompt
        },
        "version": config['version']
    }

    try:
        current_app.logger.debug(f"Making request to Wordware API with payload: {payload}")
        response = requests.post(config['url'], json=payload, headers=headers)

        # Handle non-200 responses
        if response.status_code != 200:
            current_app.logger.error(f"Wordware API returned status code {response.status_code}: {response.text}")
            return f"Error: API returned status {response.status_code}"

        # Log the raw response for debugging
        current_app.logger.debug(f"Raw Wordware API response: {response.text}")

        # Process the streaming response
        generated_text = ""
        for line in response.iter_lines():
            if line:
                import json
                try:
                    content = json.loads(line.decode('utf-8'))
                    value = content.get('value', {})

                    # Handle different types of chunks
                    if value.get('type') == 'chunk':
                        chunk_value = value.get('value', '')
                        generated_text += chunk_value
                    elif value.get('type') == 'outputs':
                        # Final outputs received, return the generated text
                        if generated_text:
                            return generated_text.strip()
                        # Fallback to outputs if no text was accumulated
                        return value.get('values', {}).get('generation', '')
                except json.JSONDecodeError as e:
                    current_app.logger.error(f"Failed to parse chunk: {str(e)}")
                    continue

        return generated_text.strip() if generated_text else "No response generated"

    except requests.exceptions.RequestException as e:
        current_app.logger.error(f"Request error to Wordware API: {str(e)}")
        return f"Error: {str(e)}"
    except Exception as e:
        current_app.logger.error(f"Wordware API error: {str(e)}")
        return f"Error: {str(e)}"

def call_claude_api(prompt, model='claude-3-sonnet'):
    try:
        return call_wordware_api(model, prompt)
    except Exception as e:
        current_app.logger.error(f"Claude API error: {str(e)}")
        return "Error calling Claude API"

def call_gpt4_api(prompt, model='gpt-4o'):
    try:
        return call_wordware_api(model, prompt)
    except Exception as e:
        current_app.logger.error(f"GPT-4 API error: {str(e)}")
        return "Error calling GPT-4 API"