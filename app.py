import os
from flask import Flask, render_template, request, jsonify
from api_handlers import call_claude_api, call_gpt4_api

app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY") or "development_key"

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/compare', methods=['POST'])
def compare():
    try:
        prompt = request.json.get('prompt')
        if not prompt:
            return jsonify({'error': 'Prompt is required'}), 400

        # Call both APIs
        claude_response = call_claude_api(prompt)
        gpt4_response = call_gpt4_api(prompt)

        return jsonify({
            'claude_response': claude_response,
            'gpt4_response': gpt4_response
        })

    except Exception as e:
        app.logger.error(f"Error during API calls: {str(e)}")
        return jsonify({'error': 'An error occurred while processing your request'}), 500
