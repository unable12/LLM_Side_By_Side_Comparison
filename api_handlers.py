import os
import requests
from flask import current_app

WORDWARE_API_KEY = os.environ.get('WORDWARE_API_KEY')
CLAUDE_URL = "https://app.wordware.ai/api/released-app/2e33b894-8412-4970-8dce-6f05d765ac3a/run"
GPT4_URL = "https://app.wordware.ai/api/released-app/c4ae4021-0e70-4072-a4d1-a3141d493700/run"

def call_wordware_api(url, prompt):
    headers = {
        "Authorization": f"Bearer {WORDWARE_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "inputs": {
            "input": prompt
        },
        "version": "^1.0"
    }

    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        return response.json()["output"]
    except Exception as e:
        current_app.logger.error(f"Wordware API error: {str(e)}")
        raise Exception(f"Error calling Wordware API: {str(e)}")

def call_claude_api(prompt):
    try:
        return call_wordware_api(CLAUDE_URL, prompt)
    except Exception as e:
        current_app.logger.error(f"Claude API error: {str(e)}")
        raise Exception("Error calling Claude API")

def call_gpt4_api(prompt):
    try:
        return call_wordware_api(GPT4_URL, prompt)
    except Exception as e:
        current_app.logger.error(f"GPT-4 API error: {str(e)}")
        raise Exception("Error calling GPT-4 API")