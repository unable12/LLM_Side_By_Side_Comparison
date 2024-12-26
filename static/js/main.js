document.addEventListener('DOMContentLoaded', function() {
    const promptInput = document.getElementById('promptInput');
    const runButton = document.getElementById('runButton');
    const spinner = runButton.querySelector('.spinner-border');
    const claudeOutput = document.getElementById('claudeOutput');
    const gpt4Output = document.getElementById('gpt4Output');
    const shareSection = document.getElementById('shareSection');
    const shareLink = document.getElementById('shareLink');
    const copyShareLink = document.getElementById('copyShareLink');

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

            const data = await response.json();

            if (response.ok) {
                claudeOutput.textContent = data.claude_response;
                claudeOutput.removeAttribute('data-state');
                gpt4Output.textContent = data.gpt4_response;
                gpt4Output.removeAttribute('data-state');

                // Generate and display share link
                const shareUrl = new URL(window.location.href);
                shareUrl.searchParams.set('prompt', prompt);
                shareUrl.searchParams.set('claude', data.claude_response);
                shareUrl.searchParams.set('gpt4', data.gpt4_response);
                shareLink.value = shareUrl.toString();
                shareSection.classList.remove('d-none');
            } else {
                throw new Error(data.error || 'An error occurred');
            }
        } catch (error) {
            console.error('Error:', error);
            showError(error.message);
        } finally {
            setLoading(false);
        }
    });

    // Handle copy buttons (both header and bottom)
    document.querySelectorAll('.copy-btn, .bottom-copy-btn').forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.dataset.target;
            const textToCopy = document.getElementById(targetId).textContent;

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

    // Handle share link copy
    copyShareLink.addEventListener('click', function() {
        navigator.clipboard.writeText(shareLink.value).then(() => {
            const icon = this.querySelector('i');
            icon.classList.remove('fa-share');
            icon.classList.add('fa-check');
            this.classList.add('copy-success');
            setTimeout(() => {
                icon.classList.remove('fa-check');
                icon.classList.add('fa-share');
                this.classList.remove('copy-success');
            }, 1500);
        }).catch(err => {
            console.error('Failed to copy share link:', err);
            alert('Failed to copy share link');
        });
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
            }
        });
    });

    // Check for shared comparison in URL
    window.addEventListener('load', function() {
        const urlParams = new URLSearchParams(window.location.search);
        const sharedPrompt = urlParams.get('prompt');
        const sharedClaude = urlParams.get('claude');
        const sharedGpt4 = urlParams.get('gpt4');

        if (sharedPrompt && sharedClaude && sharedGpt4) {
            promptInput.value = sharedPrompt;
            claudeOutput.textContent = sharedClaude;
            gpt4Output.textContent = sharedGpt4;
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
        claudeOutput.textContent = 'Loading...';
        claudeOutput.setAttribute('data-state', 'loading');
        gpt4Output.textContent = 'Loading...';
        gpt4Output.setAttribute('data-state', 'loading');
        shareSection.classList.add('d-none');
    }

    function showError(message) {
        claudeOutput.textContent = 'Error: ' + message;
        gpt4Output.textContent = 'Error: ' + message;
        claudeOutput.removeAttribute('data-state');
        gpt4Output.removeAttribute('data-state');
    }
});