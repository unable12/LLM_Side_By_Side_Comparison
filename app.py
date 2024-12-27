import os
from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase
from api_handlers import call_claude_api, call_gpt4_api


class Base(DeclarativeBase):
    pass


db = SQLAlchemy(model_class=Base)
# create the app
app = Flask(__name__)
# setup a secret key, required by sessions
app.secret_key = os.environ.get("FLASK_SECRET_KEY") or "a secret key"
# configure the database, relative to the app instance folder
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL") or "sqlite:///db.sqlite3"
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}
# initialize the app with the extension, flask-sqlalchemy >= 3.0.x
db.init_app(app)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/compare', methods=['POST'])
def compare():
    try:
        data = request.json
        prompt = data.get('prompt')
        claude_model = data.get('claude_model', 'claude-3-sonnet')
        gpt_model = data.get('gpt_model', 'gpt-4')

        if not prompt:
            return jsonify({'error': 'Prompt is required'}), 400

        # Call both APIs with selected models
        claude_response = call_claude_api(prompt, model=claude_model)
        gpt4_response = call_gpt4_api(prompt, model=gpt_model)

        return jsonify({
            'claude_response': claude_response,
            'gpt4_response': gpt4_response
        })

    except Exception as e:
        app.logger.error(f"Error during API calls: {str(e)}")
        return jsonify({'error': 'An error occurred while processing your request'}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)