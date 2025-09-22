import json
import os
import argparse
import datetime
import logging
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import requests

class APIRemote:
    def __init__(self, port=6001):
        self.app = Flask(__name__)
        CORS(self.app)
        self.port = port
        self.settings = self.load_settings()
        self.setup_logging()
        self.setup_routes()

    def load_settings(self):
        """Load settings from data/settings.json or create default if not exists"""
        settings_file = 'data/settings.json'
        if not os.path.exists(settings_file):
            print(f"Settings file not found. Please copy data/settings.example.json to {settings_file}")
            return {}

        with open(settings_file, 'r') as f:
            return json.load(f)

    def setup_logging(self):
        """Setup dual logging system - dashboard and detailed logs"""
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")

        # Create logs directory if it doesn't exist
        os.makedirs('logs', exist_ok=True)

        # Setup detailed file logger
        self.detailed_log_file = f'logs/api_remote_{timestamp}.log'
        logging.basicConfig(
            filename=self.detailed_log_file,
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s'
        )

        # Dashboard log (in-memory for real-time display)
        self.dashboard_log = []

    def log_dashboard(self, message):
        """Add message to dashboard log"""
        timestamp = datetime.datetime.now().strftime("%H:%M:%S")
        log_entry = f"[{timestamp}] {message}"
        self.dashboard_log.append(log_entry)

        # Keep only last 100 entries
        if len(self.dashboard_log) > 100:
            self.dashboard_log.pop(0)

    def log_detailed(self, level, message, extra_data=None):
        """Log detailed information to file"""
        log_message = message
        if extra_data:
            log_message += f" | Data: {json.dumps(extra_data, indent=2)}"

        if level == 'info':
            logging.info(log_message)
        elif level == 'error':
            logging.error(log_message)
        elif level == 'warning':
            logging.warning(log_message)

    def setup_routes(self):
        """Setup Flask routes"""

        @self.app.route('/')
        def index():
            return render_template('index.html',
                                 send_endpoints=self.settings.get('send_endpoints', []),
                                 receive_endpoints=self.settings.get('receive_endpoints', []))

        @self.app.route('/api/send', methods=['POST'])
        def send_request():
            """Send API request to external endpoint"""
            try:
                data = request.json
                endpoint = data.get('endpoint')
                method = data.get('method', 'GET')
                payload = data.get('payload', {})
                headers = data.get('headers', self.settings.get('default_headers', {}))

                # Make the request
                response = requests.request(
                    method=method,
                    url=endpoint,
                    json=payload if method in ['POST', 'PUT', 'PATCH'] else None,
                    params=payload if method == 'GET' else None,
                    headers=headers
                )

                # Log the request
                self.log_dashboard(f"SENT {method} to {endpoint} - Status: {response.status_code}")
                self.log_detailed('info', f"Sent {method} request to {endpoint}", {
                    'endpoint': endpoint,
                    'method': method,
                    'payload': payload,
                    'response_status': response.status_code,
                    'response_body': response.text[:500]  # First 500 chars
                })

                return jsonify({
                    'success': True,
                    'status_code': response.status_code,
                    'response': response.text[:1000]  # Limit response size for UI
                })

            except Exception as e:
                error_msg = f"Error sending request: {str(e)}"
                self.log_dashboard(f"ERROR: {error_msg}")
                self.log_detailed('error', error_msg)
                return jsonify({'success': False, 'error': error_msg}), 500

        @self.app.route('/api/logs')
        def get_logs():
            """Get dashboard logs for real-time updates"""
            return jsonify({'logs': self.dashboard_log})

        # Dynamic receiving endpoints
        def create_webhook_handler(endpoint_path):
            def webhook_handler():
                try:
                    # Get request data
                    method = request.method
                    headers = dict(request.headers)

                    # Get body based on content type
                    if request.is_json:
                        body = request.get_json()
                    else:
                        body = request.get_data(as_text=True)

                    # Log the received request
                    self.log_dashboard(f"RECEIVED {method} at {endpoint_path}")
                    self.log_detailed('info', f"Received {method} request at {endpoint_path}", {
                        'endpoint': endpoint_path,
                        'method': method,
                        'headers': headers,
                        'body': body
                    })

                    return jsonify({
                        'success': True,
                        'message': f'Request received at {endpoint_path}',
                        'method': method,
                        'timestamp': datetime.datetime.now().isoformat()
                    })

                except Exception as e:
                    error_msg = f"Error processing request at {endpoint_path}: {str(e)}"
                    self.log_dashboard(f"ERROR: {error_msg}")
                    self.log_detailed('error', error_msg)
                    return jsonify({'success': False, 'error': error_msg}), 500

            return webhook_handler

        # Register dynamic receiving endpoints
        for endpoint in self.settings.get('receive_endpoints', []):
            self.app.add_url_rule(
                endpoint,
                f'webhook_{endpoint.replace("/", "_")}',
                create_webhook_handler(endpoint),
                methods=['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']
            )

    def run(self):
        """Start the Flask application"""
        self.log_dashboard(f"API Remote started on port {self.port}")
        self.log_detailed('info', f"Application started on port {self.port}")
        print(f"API Remote running on http://localhost:{self.port}")
        print(f"Logs being written to: {self.detailed_log_file}")
        self.app.run(host='0.0.0.0', port=self.port, debug=True)

def main():
    parser = argparse.ArgumentParser(description='API Remote Testing Tool')
    parser.add_argument('--port', type=int, default=6001, help='Port to run the server on (default: 6001)')
    args = parser.parse_args()

    api_remote = APIRemote(port=args.port)
    api_remote.run()

if __name__ == '__main__':
    main()