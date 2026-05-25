# Contributing to sigen-mcp

Thanks for your interest in contributing!

## Development Setup

```bash
git clone <your-fork>
cd sigen-mcp
npm install
npm run build
```

## Adding Register Definitions

If you're adding new register support:

1. Add the register address + metadata to the relevant source file
2. Update the `README.md` Known Registers tables
3. Reference the [Sigenergy Modbus Protocol PDF](https://pdf.tritec.info/pdf/produkte/Sigenergy_Modbus_Protocol_20240409_EN.pdf) or the [Sigenergy-Local-Modbus](https://github.com/TypQxQ/Sigenergy-Local-Modbus) HACS integration

## Pull Request Process

1. Fork the repo and create a feature branch
2. Run `npm run build` to verify compilation
3. Open a PR with a clear description of the change
4. Reference any relevant register documentation

## Code Style

- TypeScript strict mode
- No `any` types unless absolutely necessary
- Follow existing patterns in the codebase
- Keep functions focused and small

## Questions?

Open a discussion or issue — happy to help.
