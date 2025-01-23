export default {
  async fetch(request, env) {
    try {
      console.log('Request received:', {
        method: request.method,
        url: request.url,
        headers: Object.fromEntries(request.headers.entries()),
      });

      // Only allow POST requests
      if (request.method !== 'POST') {
        return new Response('Only POST requests are allowed', { status: 405 });
      }

      // Step 1: Decompress the gzipped data
      const compressedData = await request.arrayBuffer();
      const stream = new Response(compressedData).body;
      const decompressedStream = stream.pipeThrough(new DecompressionStream("gzip"));
      const decompressedText = await new Response(decompressedStream).text();

      // Step 2: Parse the logs from the decompressed text
      const logEntries = decompressedText.trim().split(/\r?\n/).map(line => JSON.parse(line));
      const logsToProcess = logEntries.map(entry => ({
        DeviceID: entry.DeviceID,
        DeviceName: entry.DeviceName,
        Email: entry.Email,
        timestamp: new Date().toISOString(),
      }));

      // Step 3: Process each log entry and query the DEX API for device matching
      for (const log of logsToProcess) {
        const { DeviceID, DeviceName, Email, timestamp } = log;

        // Step 4: Set time range for the query
        const fromTimestamp = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // 24 hours ago
        const toTimestamp = new Date().toISOString();

        // Step 5: Query the DEX API for the fleet status
        const dexResponse = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${env.ACCOUNT_ID}/dex/fleet-status/devices?from=${encodeURIComponent(
            fromTimestamp
          )}&to=${encodeURIComponent(toTimestamp)}&per_page=100`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${env.API_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!dexResponse.ok) {
          // Log the detailed response body for debugging
          const errorResponse = await dexResponse.text();
          console.error('Error fetching DEX fleet status:', dexResponse.statusText);
          console.error('Response body:', errorResponse);
          continue; // Skip this log if the API call fails
        }

        const dexData = await dexResponse.json();
        const fleetDevices = dexData.result || [];

        // Step 6: Check if the DeviceID matches any deviceId in the fleet status response
        const matchedDevice = fleetDevices.find(device => device.deviceId === DeviceID);

        if (matchedDevice) {
          const { deviceId, colo, mode, platform, status, timestamp: dexTimestamp } = matchedDevice;

          // Step 7: Log the matching entry
          console.log(
            `User: ${Email} is connected to account: ${env.ACCOUNT_ID} with device: ${deviceId} (${DeviceName}), status: ${status}, mode: ${mode}, platform: ${platform}, colo: ${colo} at time: ${timestamp}`
          );
        } else {
          // Step 8: No matching device found
          console.log(`No matching entry for DeviceID: ${DeviceID}`);
        }
      }

      return new Response('Logs processed successfully', { status: 200 });
    } catch (error) {
      console.error('Error processing logs:', error);
      return new Response('Error occurred', { status: 500 });
    }
  },
};
