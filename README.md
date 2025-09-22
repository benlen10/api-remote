# API Remote

A Python web application for testing API endpoints with both sending and receiving capabilities. Features a bold Neobrutalist design and real-time logging.

## Features

- **Send API Requests**: Send GET, POST, PUT, DELETE, and PATCH requests to external endpoints
- **Receive API Calls**: Set up 4 configurable receiving endpoints
- **Real-time Logging**: Monitor all sent and received requests with auto-scrolling logs
- **Payload Editor**: JSON editor with validation for request payloads
- **Neobrutalist UI**: Bold, high-contrast design with bright colors and thick borders
- **Persistent Logging**: Detailed logs saved to files with timestamps
- **CORS Enabled**: External domains can access your receiving endpoints

## Quick Start

1. **Clone and Setup**
   ```bash
   git clone <your-repo-url>
   cd api-remote
   pip install -r requirements.txt
   ```

2. **Configure Settings**
   ```bash
   cp settings.example.json settings.json
   # Edit settings.json with your endpoints
   ```

3. **Run the Application**
   ```bash
   python app.py
   # Or with custom port:
   python app.py --port 8080
   ```

4. **Access the Web Interface**
   Open http://localhost:6001 in your browser

## Configuration

Edit `settings.json` to configure your endpoints:

```json
{
  "send_endpoints": [
    "https://api.example.com/endpoint1",
    "https://api.example.com/endpoint2",
    "https://jsonplaceholder.typicode.com/posts",
    "https://httpbin.org/post"
  ],
  "receive_endpoints": [
    "/webhook1",
    "/webhook2",
    "/api/data",
    "/callback"
  ],
  "default_payloads": {
    "endpoint1": {"message": "Hello from API Remote"},
    "endpoint2": {"data": "test data"},
    "endpoint3": {"title": "Test Post", "body": "This is a test", "userId": 1},
    "endpoint4": {"key": "value"}
  },
  "default_headers": {
    "Content-Type": "application/json",
    "User-Agent": "API-Remote-Client/1.0"
  }
}
```

## Usage

### Sending Requests
1. Enter endpoint URLs in the "SEND REQUESTS" section
2. Select HTTP method (GET, POST, PUT, DELETE, PATCH)
3. Click "EDIT PAYLOAD" to customize the JSON payload
4. Click "SEND" to make the request
5. View response status and preview in the log

### Receiving Requests
1. Configure receiving endpoints in `settings.json`
2. Use the full URLs shown in the "RECEIVE ENDPOINTS" section
3. Send requests to these endpoints from external services
4. Monitor incoming requests in the real-time log

### Logging
- **Dashboard Log**: Real-time feed with concise status messages
- **Detailed Logs**: Complete request/response data saved to `logs/` directory
- **Auto-scroll**: Log automatically scrolls to show latest entries

## Command Line Options

```bash
python app.py --port 8080    # Run on custom port
python app.py --help        # Show help
```

## File Structure

```
api-remote/
├── app.py                 # Main Flask application
├── settings.json          # Your configuration (create from example)
├── settings.example.json  # Configuration template
├── requirements.txt       # Python dependencies
├── logs/                 # Log files (auto-created)
├── static/
│   ├── css/style.css    # Neobrutalist styling
│   └── js/app.js        # Frontend JavaScript
└── templates/
    └── index.html        # Main dashboard
```

## Security Notes

- The `settings.json` file is gitignored to prevent committing sensitive data
- Receiving endpoints accept all HTTP methods and are open by default
- CORS is enabled for external access to receiving endpoints
- Detailed logs may contain sensitive data - review before sharing

## Troubleshooting

**Port already in use**: Use `--port` to specify a different port
**Settings not found**: Copy `settings.example.json` to `settings.json`
**CORS issues**: The app enables CORS by default for external access
**Log files**: Check the `logs/` directory for detailed request information

## License

MIT License - feel free to modify and distribute.