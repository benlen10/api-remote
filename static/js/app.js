// API Remote Frontend JavaScript

class APIRemote {
    constructor() {
        this.payloads = {
            0: '{"message": "Hello from API Remote"}',
            1: '{"data": "test data"}',
            2: '{"title": "Test Post", "body": "This is a test", "userId": 1}',
            3: '{"key": "value"}'
        };
        this.methods = {
            0: 'POST',
            1: 'POST',
            2: 'POST',
            3: 'POST'
        };
        this.currentEditingIndex = null;
        this.currentEditingType = null;

        this.init();
    }

    init() {
        this.startLogPolling();
        this.updateFullUrls();

        // Add event listeners
        document.addEventListener('DOMContentLoaded', () => {
            this.updateFullUrls();
        });
    }

    // Update full URLs for receiving endpoints
    updateFullUrls() {
        const currentPort = window.location.port || '6001';
        const baseUrl = `${window.location.protocol}//${window.location.hostname}:${currentPort}`;

        for (let i = 0; i < 4; i++) {
            const input = document.getElementById(`receive-endpoint-${i}`);
            const urlDisplay = document.getElementById(`full-url-${i}`);

            if (input && urlDisplay) {
                const endpoint = input.value || `/webhook${i + 1}`;
                urlDisplay.textContent = baseUrl + endpoint;
            }
        }
    }

    // Copy URL to clipboard
    copyUrl(index) {
        const urlElement = document.getElementById(`full-url-${index}`);
        const url = urlElement.textContent;

        navigator.clipboard.writeText(url).then(() => {
            this.addLogEntry(`URL copied to clipboard: ${url}`, 'success');
        }).catch(err => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = url;
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                this.addLogEntry(`URL copied to clipboard: ${url}`, 'success');
            } catch (err) {
                this.addLogEntry(`Failed to copy URL: ${err.message}`, 'error');
            }
            document.body.removeChild(textArea);
        });
    }

    // Send API request
    async sendRequest(index) {
        const endpointInput = document.getElementById(`send-endpoint-${index}`);

        if (!endpointInput.value.trim()) {
            this.addLogEntry(`ERROR: No endpoint specified for slot ${index + 1}`, 'error');
            return;
        }

        const endpoint = endpointInput.value.trim();
        const method = this.methods[index] || 'GET';
        const payload = this.parsePayload(this.payloads[index] || '{}');

        this.addLogEntry(`SENDING ${method} to ${endpoint}...`, 'info');

        try {
            const response = await fetch('/api/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    endpoint: endpoint,
                    method: method,
                    payload: payload
                })
            });

            const result = await response.json();

            if (result.success) {
                this.addLogEntry(`SUCCESS: ${method} to ${endpoint} - Status: ${result.status_code}`, 'success');
                if (result.response) {
                    this.addLogEntry(`Response preview: ${result.response.substring(0, 100)}...`, 'info');
                }
            } else {
                this.addLogEntry(`ERROR: ${result.error}`, 'error');
            }
        } catch (error) {
            this.addLogEntry(`ERROR: Network error - ${error.message}`, 'error');
        }
    }

    // Parse JSON payload with error handling
    parsePayload(payloadString) {
        try {
            return JSON.parse(payloadString);
        } catch (error) {
            this.addLogEntry(`WARNING: Invalid JSON payload, sending as empty object`, 'warning');
            return {};
        }
    }

    // Modal management
    openPayloadModal(index, type) {
        this.currentEditingIndex = index;
        this.currentEditingType = type;

        const modal = document.getElementById('payload-modal');
        const editor = document.getElementById('payload-editor');
        const title = document.getElementById('modal-title');
        const methodSelect = document.getElementById('modal-method-select');
        const methodControls = document.getElementById('modal-controls');

        title.textContent = `EDIT PAYLOAD - ${type.toUpperCase()} ENDPOINT ${index + 1}`;

        // Show/hide method controls based on type
        if (type === 'send') {
            methodControls.style.display = 'block';
            // Load existing method or default
            methodSelect.value = this.methods[index] || 'POST';
            editor.value = this.payloads[index] || '{}';
        } else {
            methodControls.style.display = 'none';
            editor.value = '{"message": "This is a receiving endpoint"}';
        }

        modal.style.display = 'flex';
        editor.focus();
    }

    closePayloadModal() {
        const modal = document.getElementById('payload-modal');
        modal.style.display = 'none';
        this.currentEditingIndex = null;
        this.currentEditingType = null;
    }

    savePayload() {
        const editor = document.getElementById('payload-editor');
        const methodSelect = document.getElementById('modal-method-select');
        const payload = editor.value;

        // Validate JSON
        try {
            JSON.parse(payload);
            this.payloads[this.currentEditingIndex] = payload;

            // Save method if this is a send endpoint
            if (this.currentEditingType === 'send') {
                this.methods[this.currentEditingIndex] = methodSelect.value;
            }

            this.addLogEntry(`Configuration saved for ${this.currentEditingType} endpoint ${this.currentEditingIndex + 1}`, 'success');
            this.closePayloadModal();
        } catch (error) {
            this.addLogEntry(`ERROR: Invalid JSON in payload editor`, 'error');
            // Don't close modal, let user fix the JSON
        }
    }

    // Log management
    addLogEntry(message, type = 'info') {
        const logContent = document.getElementById('log-content');
        const entry = document.createElement('div');
        entry.className = 'log-entry';

        const timestamp = new Date().toLocaleTimeString();
        entry.textContent = `[${timestamp}] ${message}`;

        // Add type-specific styling
        if (type === 'error') {
            entry.style.color = '#ff0000';
            entry.style.borderLeftColor = '#ff0000';
        } else if (type === 'success') {
            entry.style.color = '#00ff00';
            entry.style.borderLeftColor = '#00ff00';
        } else if (type === 'warning') {
            entry.style.color = '#ffff00';
            entry.style.borderLeftColor = '#ffff00';
        }

        logContent.appendChild(entry);

        // Auto-scroll to bottom
        logContent.scrollTop = logContent.scrollHeight;

        // Keep only last 100 entries
        while (logContent.children.length > 100) {
            logContent.removeChild(logContent.firstChild);
        }
    }

    // Poll for server logs
    async startLogPolling() {
        setInterval(async () => {
            try {
                const response = await fetch('/api/logs');
                const data = await response.json();

                if (data.logs && data.logs.length > 0) {
                    const logContent = document.getElementById('log-content');
                    const currentEntries = Array.from(logContent.children).map(child => child.textContent);

                    // Add new entries that aren't already displayed
                    data.logs.forEach(logEntry => {
                        if (!currentEntries.includes(logEntry)) {
                            const entry = document.createElement('div');
                            entry.className = 'log-entry';
                            entry.textContent = logEntry;
                            logContent.appendChild(entry);
                        }
                    });

                    // Auto-scroll to bottom
                    logContent.scrollTop = logContent.scrollHeight;

                    // Keep only last 100 entries
                    while (logContent.children.length > 100) {
                        logContent.removeChild(logContent.firstChild);
                    }
                }
            } catch (error) {
                console.error('Error polling logs:', error);
            }
        }, 2000); // Poll every 2 seconds
    }
}

// Global functions for HTML onclick handlers
let apiRemote;

function sendRequest(index) {
    apiRemote.sendRequest(index);
}

function openPayloadModal(index, type) {
    apiRemote.openPayloadModal(index, type);
}

function closePayloadModal() {
    apiRemote.closePayloadModal();
}

function savePayload() {
    apiRemote.savePayload();
}

function copyUrl(index) {
    apiRemote.copyUrl(index);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    apiRemote = new APIRemote();
});

// Close modal when clicking outside
document.addEventListener('click', function(event) {
    const modal = document.getElementById('payload-modal');
    if (event.target === modal) {
        closePayloadModal();
    }
});

// Handle escape key to close modal
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closePayloadModal();
    }
});

// Update URLs when receive endpoint inputs change
document.addEventListener('input', function(event) {
    if (event.target.id && event.target.id.startsWith('receive-endpoint-')) {
        apiRemote.updateFullUrls();
    }
});