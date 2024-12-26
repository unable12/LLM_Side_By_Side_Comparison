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

            const data = await response.json();

            if (response.ok) {
                claudeOutput.textContent = data.claude_response;
                claudeOutput.removeAttribute('data-state');
                gpt4Output.textContent = data.gpt4_response;
                gpt4Output.removeAttribute('data-state');

                // Show like overlays after content is loaded
                document.querySelectorAll('.like-overlay').forEach(overlay => {
                    overlay.style.display = 'block'; // Show overlays
                });

                // Generate and display share link with shorter parameters
                const shareUrl = new URL(window.location.href);
                shareUrl.searchParams.set('p', prompt);
                shareUrl.searchParams.set('c', btoa(data.claude_response));
                shareUrl.searchParams.set('g', btoa(data.gpt4_response));
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

    // Handle copy buttons (modified to only use bottom buttons)
    document.querySelectorAll('.bottom-copy-btn').forEach(button => {
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

    // Renamed button text and updated functionality
    copyShareLink.textContent = "Share These Results";
    copyShareLink.addEventListener('click', function() {
        const textToCopy = shareLink.value;

        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(textToCopy).then(() => {
                showCopySuccess();
            }).catch(err => {
                console.error('Failed to copy share link:', err);
                fallbackCopyText(textToCopy);
            });
        } else {
            fallbackCopyText(textToCopy);
        }
    });

    // Add mouse move handler for like text following cursor
    document.querySelectorAll('.like-overlay').forEach(overlay => {
        const likeText = overlay.querySelector('.like-text');

        overlay.addEventListener('mousemove', function(e) {
            const rect = overlay.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            likeText.style.left = `${x}px`;
            likeText.style.top = `${y}px`;
            likeText.style.transform = 'translate(-50%, -50%)';
        });

        overlay.addEventListener('mouseleave', function() {
            likeText.style.opacity = '0';
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
        claudeOutput.textContent = 'Loading...';
        claudeOutput.setAttribute('data-state', 'loading');
        gpt4Output.textContent = 'Loading...';
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
            showCopySuccess();
        } catch (err) {
            console.error('Failed to copy text:', err);
            alert('Failed to copy link to clipboard');
        }

        document.body.removeChild(textArea);
    }

    function showCopySuccess() {
        const icon = copyShareLink.querySelector('i');
        icon.classList.remove('fa-share');
        icon.classList.add('fa-check');
        copyShareLink.classList.add('copy-success');
        setTimeout(() => {
            icon.classList.remove('fa-check');
            icon.classList.add('fa-share');
            copyShareLink.classList.remove('copy-success');
        }, 1500);
    }
});