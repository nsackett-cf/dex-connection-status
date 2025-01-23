# dex-connection-status
Query Cloudflare DEX fleet status device API for connection status of a device


Cloudflare Worker: Log Processor with DEX API Integration
This Cloudflare Worker processes gzipped logs received via HTTP POST requests, extracts key details, and queries the Cloudflare DEX API to match device information. It logs matching devices or indicates unmatched entries.

Features
Handles and decompresses gzipped log data.
Extracts DeviceID, DeviceName, Email, and a timestamp from the log entries.
Queries the Cloudflare DEX API for device fleet status over a 24-hour period.
Matches DeviceID from logs with the API response.
Logs detailed information about matched and unmatched devices.
Includes error handling to ensure robust processing.
Required Variables
The script relies on environment variables for configuration. These must be set in the Cloudflare Worker environment:

Environment Variables
ACCOUNT_ID

Your Cloudflare account ID.
Used to construct the API request URL.
Example: 123456789abcdef123456789abcdef12
API_KEY

A valid API token with permissions to access the Cloudflare DEX API.
Permissions required:
Account Settings: Read
Zero Trust Gateway: Read
Example: Bearer <your-api-token>
Log Input Format
The worker expects logs to be sent in gzipped JSON lines format. Each line must be a valid JSON object with the following structure:

json
Copy
Edit
{
  "DeviceID": "string",
  "DeviceName": "string",
  "Email": "string"
}
Example Input:
Gzipped version of:

json
Copy
Edit
{"DeviceID": "12345", "DeviceName": "Laptop", "Email": "user@example.com"}
{"DeviceID": "67890", "DeviceName": "Desktop", "Email": "admin@example.com"}
DEX API Query Parameters
The worker queries the Cloudflare DEX API using the following parameters:

from: 24 hours ago (calculated dynamically).
to: Current time (calculated dynamically).
per_page: 100 (max results per page).
Setup Instructions
Deploy the Worker

Add the script to your Cloudflare Worker.
Ensure the environment variables (ACCOUNT_ID and API_KEY) are set in the Worker configuration.
Permissions

Ensure the API token provided has the necessary permissions to query the Cloudflare DEX API.
Send Logs to the Worker

Logs must be sent as a gzipped HTTP POST request to the Worker’s endpoint.
Verify Logging

The Worker logs matching and unmatched devices to console.log. Check the logs in the Cloudflare dashboard for results.
Example Logs
Matched Device
yaml
Copy
Edit
User: user@example.com is connected to account: 123456789abcdef123456789abcdef12 with device: 12345 (Laptop), status: connected, mode: proxy, platform: windows, colo: SJC at time: 2023-10-11T12:34:56Z
Unmatched Device
rust
Copy
Edit
No matching entry for DeviceID: 67890
Error Handling
If an error occurs (e.g., invalid API response, parsing issues, or unexpected input), the Worker logs the error details and continues processing the remaining logs.

Notes
Ensure the input logs conform to the required format and are gzipped before sending.
The script processes only logs from the past 24 hours.
You can increase per_page or handle pagination in the DEX API query if dealing with larger datasets.
Let me know if you’d like additional details or refinements!
