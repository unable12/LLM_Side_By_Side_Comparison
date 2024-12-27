document.addEventListener('DOMContentLoaded', function() {
    const promptInput = document.getElementById('promptInput');
    const runButton = document.getElementById('runButton');
    const spinner = runButton.querySelector('.spinner-border');
    const claudeOutput = document.getElementById('claudeOutput');
    const gpt4Output = document.getElementById('gpt4Output');
    const shareSection = document.getElementById('shareSection');
    const shareLink = document.getElementById('shareLink');
    const copyShareLink = document.getElementById('copyShareLink');

    // Hide like overlays initially
    document.querySelectorAll('.like-overlay').forEach(overlay => {
        overlay.style.display = 'none';
    });

    // Handle conversation starter buttons
    document.querySelectorAll('.starter-btn').forEach(button => {
        button.addEventListener('click', function() {
            promptInput.value = this.dataset.prompt;
            promptInput.focus();
        });
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

            if (!response.ok) {
                throw new Error('API request failed');
            }

            const data = await response.json();

            // Update outputs
            updateOutput(claudeOutput, data.claude_response);
            updateOutput(gpt4Output, data.gpt4_response);

            // Show like overlays
            document.querySelectorAll('.like-overlay').forEach(overlay => {
                overlay.style.display = 'block';
            });

            // Update share link
            updateShareLink(prompt, data);

        } catch (error) {
            console.error('Error:', error);
            showError(error.message);
        } finally {
            setLoading(false);
        }
    });

    function updateOutput(outputElement, response) {
        if (response) {
            outputElement.textContent = response;
            outputElement.removeAttribute('data-state');
        } else {
            outputElement.textContent = 'No response received';
            outputElement.removeAttribute('data-state');
        }
    }

    function updateShareLink(prompt, data) {
        const shareUrl = new URL(window.location.href);
        shareUrl.searchParams.set('p', prompt);
        shareUrl.searchParams.set('c', btoa(data.claude_response || ''));
        shareUrl.searchParams.set('g', btoa(data.gpt4_response || ''));
        shareLink.value = shareUrl.toString();
        shareSection.classList.remove('d-none');
    }

    // Handle copy buttons
    document.querySelectorAll('.bottom-copy-btn').forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.dataset.target;
            const outputElement = document.getElementById(targetId);

            // Don't copy if there's no content or if it's loading
            if (!outputElement || outputElement.getAttribute('data-state') === 'loading') {
                return;
            }

            // Get the text content, preserving whitespace
            const textToCopy = outputElement.innerText.trim();

            // Don't copy if there's no text
            if (!textToCopy) {
                return;
            }

            navigator.clipboard.writeText(textToCopy).then(() => {
                // Visual feedback for copy
                button.classList.add('copy-success');
                setTimeout(() => {
                    button.classList.remove('copy-success');
                }, 1500);
            }).catch(err => {
                console.error('Failed to copy text:', err);
                alert('Failed to copy text');
            });
        });
    });

    // Handle share link copying
    copyShareLink.addEventListener('click', function() {
        const textToCopy = shareLink.value;

        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(textToCopy).then(() => {
                copyShareLink.classList.add('copy-success');
                setTimeout(() => {
                    copyShareLink.classList.remove('copy-success');
                }, 1500);
            }).catch(err => {
                console.error('Failed to copy share link:', err);
                fallbackCopyText(textToCopy);
            });
        } else {
            fallbackCopyText(textToCopy);
        }
    });

    // Handle like overlays
    document.querySelectorAll('.like-overlay').forEach(overlay => {
        overlay.addEventListener('click', function(e) {
            const outputArea = this.closest('.card-body').querySelector('.output-area');
            if (!outputArea || !outputArea.textContent.trim() || outputArea.getAttribute('data-state') === 'loading') {
                e.preventDefault();
                return;
            }

            if (!this.classList.contains('liked')) {
                // Remove liked class from other overlay
                document.querySelectorAll('.like-overlay').forEach(other => {
                    if (other !== this) {
                        other.classList.remove('liked');
                    }
                });
                this.classList.add('liked');
            } else {
                this.classList.remove('liked');
            }
        });
    });

    // Check for shared comparison in URL
    window.addEventListener('load', function() {
        const urlParams = new URLSearchParams(window.location.search);
        const sharedPrompt = urlParams.get('p');
        const sharedClaude = urlParams.get('c');
        const sharedGpt4 = urlParams.get('g');

        if (sharedPrompt && sharedClaude && sharedGpt4) {
            promptInput.value = sharedPrompt;
            claudeOutput.textContent = atob(sharedClaude);
            gpt4Output.textContent = atob(sharedGpt4);
            shareSection.classList.remove('d-none');
            shareLink.value = window.location.href;
        }
    });

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
        claudeOutput.textContent = '';
        claudeOutput.setAttribute('data-state', 'loading');
        gpt4Output.textContent = '';
        gpt4Output.setAttribute('data-state', 'loading');
        shareSection.classList.add('d-none');
        // Hide like overlays during loading
        document.querySelectorAll('.like-overlay').forEach(overlay => {
            overlay.style.display = 'none';
        });
    }

    function showError(message) {
        claudeOutput.textContent = 'Error: ' + message;
        gpt4Output.textContent = 'Error: ' + message;
        claudeOutput.removeAttribute('data-state');
        gpt4Output.removeAttribute('data-state');
    }

    function fallbackCopyText(text) {
        // Fallback for browsers that don't support clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            document.execCommand('copy');
            copyShareLink.classList.add('copy-success');
            setTimeout(() => {
                copyShareLink.classList.remove('copy-success');
            }, 1500);
        } catch (err) {
            console.error('Failed to copy text:', err);
            alert('Failed to copy link to clipboard');
        }

        document.body.removeChild(textArea);
    }
});