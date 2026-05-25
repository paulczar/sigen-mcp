# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.x     | :white_check_mark: |

## Reporting a Vulnerability

This project communicates with hardware on your local network via Modbus TCP.
It does not expose any network ports itself — communication is over stdio via the MCP protocol.

If you discover a security vulnerability, please open an issue describing the
concern or contact the maintainer directly. Do not disclose it publicly until
it has been addressed.

## Network Security Note

`sigen-mcp` connects directly to your Sigenergy inverter over your local network.
Ensure your inverter is not exposed to the public internet. The Modbus TCP port
(502) should only be accessible from trusted devices on your local network.
