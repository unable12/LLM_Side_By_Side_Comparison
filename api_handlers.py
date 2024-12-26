import os
import anthropic
import openai
from flask import current_app

def call_claude_api(prompt):
    try:
        client = anthropic.Client(api_key=os.environ.get('ANTHROPIC_API_KEY'))
        message = client.messages.create(
            model="claude-3-opus-20240229",
            max_tokens=1000,
            messages=[{"role": "user", "content": prompt}]
        )
        return message.content[0].text
    except Exception as e:
        current_app.logger.error(f"Claude API error: {str(e)}")
        raise Exception("Error calling Claude API")

def call_gpt4_api(prompt):
    try:
        client = openai.Client(api_key=os.environ.get('OPENAI_API_KEY'))
        response = client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1000
        )
        return response.choices[0].message.content
    except Exception as e:
        current_app.logger.error(f"GPT-4 API error: {str(e)}")
        raise Exception("Error calling GPT-4 API")
