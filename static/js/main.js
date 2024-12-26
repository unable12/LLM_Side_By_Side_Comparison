document.addEventListener('DOMContentLoaded', function() {
    const promptInput = document.getElementById('promptInput');
    const runButton = document.getElementById('runButton');
    const spinner = runButton.querySelector('.spinner-border');
    const claudeOutput = document.getElementById('claudeOutput');
    const gpt4Output = document.getElementById('gpt4Output');
    const templateSelect = document.getElementById('templateSelect');
    const saveTemplateButton = document.getElementById('saveTemplate');

    // Load templates when page loads
    loadTemplates();

    // Handle template selection
    templateSelect.addEventListener('change', function() {
        const selectedTemplate = this.options[this.selectedIndex];
        if (selectedTemplate.value) {
            promptInput.value = selectedTemplate.getAttribute('data-template');
        }
    });

    // Handle save template
    saveTemplateButton.addEventListener('click', async function() {
        const name = document.getElementById('templateName').value;
        const template = document.getElementById('templateContent').value;
        const description = document.getElementById('templateDescription').value;

        if (!name || !template) {
            alert('Name and template content are required');
            return;
        }

        try {
            const response = await fetch('/templates', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, template, description }),
            });

            if (response.ok) {
                bootstrap.Modal.getInstance(document.getElementById('templateModal')).hide();
                document.getElementById('templateForm').reset();
                await loadTemplates();
            } else {
                throw new Error('Failed to save template');
            }
        } catch (error) {
            alert('Error saving template: ' + error.message);
        }
    });

    // Handle the run comparison button click
    runButton.addEventListener('click', async function() {
        const prompt = promptInput.value.trim();
        if (!prompt) {
            alert('Please enter a prompt');
            return;
        }

        // Show loading state
        setLoading(true);
        clearOutputs();

        try {
            const response = await fetch('/compare', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt }),
            });

            const data = await response.json();

            if (response.ok) {
                claudeOutput.textContent = data.claude_response;
                gpt4Output.textContent = data.gpt4_response;
            } else {
                throw new Error(data.error || 'An error occurred');
            }
        } catch (error) {
            showError(error.message);
        } finally {
            setLoading(false);
        }
    });

    // Handle copy buttons
    document.querySelectorAll('.copy-btn').forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.dataset.target;
            const textToCopy = document.getElementById(targetId).textContent;

            navigator.clipboard.writeText(textToCopy).then(() => {
                // Visual feedback for copy
                const icon = this.querySelector('i');
                icon.classList.remove('fa-copy');
                icon.classList.add('fa-check');
                setTimeout(() => {
                    icon.classList.remove('fa-check');
                    icon.classList.add('fa-copy');
                }, 1500);
            }).catch(err => {
                console.error('Failed to copy text:', err);
                alert('Failed to copy text');
            });
        });
    });

    async function loadTemplates() {
        try {
            const response = await fetch('/templates');
            const templates = await response.json();

            templateSelect.innerHTML = '<option value="">Select a template...</option>';
            templates.forEach(template => {
                const option = document.createElement('option');
                option.value = template.id;
                option.textContent = template.name;
                option.setAttribute('data-template', template.template);
                templateSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading templates:', error);
        }
    }

    function setLoading(isLoading) {
        runButton.disabled = isLoading;
        if (isLoading) {
            spinner.classList.remove('d-none');
            runButton.textContent = ' Running...';
        } else {
            spinner.classList.add('d-none');
            runButton.textContent = 'Run Comparison';
        }
    }

    function clearOutputs() {
        claudeOutput.textContent = 'Loading...';
        gpt4Output.textContent = 'Loading...';
    }

    function showError(message) {
        claudeOutput.textContent = 'Error: ' + message;
        gpt4Output.textContent = 'Error: ' + message;
    }
});