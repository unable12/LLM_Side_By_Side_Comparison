from app import db
from datetime import datetime

class PromptTemplate(db.Model):
    __tablename__ = 'prompt_template'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    template = db.Column(db.Text, nullable=False)
    description = db.Column(db.Text)
    is_default = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    @classmethod
    def create_default_templates(cls):
        default_templates = [
            {
                'name': 'Technical Analysis',
                'template': 'Analyze this technical concept or piece of code:\n\n[Your input here]',
                'description': 'Compare how different LLMs analyze and explain technical concepts',
                'is_default': True
            },
            {
                'name': 'Creative Writing',
                'template': 'Write a creative piece about:\n\n[Your topic here]',
                'description': 'Compare creative writing capabilities between different LLMs',
                'is_default': True
            },
            {
                'name': 'Problem Solving',
                'template': 'Solve this problem or challenge:\n\n[Describe your problem here]',
                'description': 'Compare how different LLMs approach problem-solving',
                'is_default': True
            }
        ]

        # Only add default templates if they don't exist
        if not cls.query.filter_by(is_default=True).first():
            for template_data in default_templates:
                template = cls(**template_data)
                db.session.add(template)
            db.session.commit()

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'template': self.template,
            'description': self.description,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }