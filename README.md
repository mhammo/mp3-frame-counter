# MP3 Frame Counter

## Quick Start

### Run the service locally

#### Prerequisites

- [pnpm](https://pnpm.io/installation) a dependency management tool for JavaScript. Has some nice features over `npm`, such as disabling lifecycle scripts by default.
- [nvm](https://github.com/nvm-sh/nvm?tab=readme-ov-file#installing-and-updating) manages your node version, and can auto-install the correct NodeJS version based on the `.nvmrc` file.
  - Or alternatively, just make sure you have NodeJS 24 installed.

#### Commands

```sh
# If you're not using NVM, ignore this.
nvm use

pnpm i
pnpm start:dev
```

### Run the service in Docker

#### Prerequisites

- [docker](https://www.docker.com/get-started/) for running the container.

#### Commands

```sh
docker compose up
```

## Manual Testing

If you want to test the service manually, you can either:

- Navigate to http://localhost:3000/docs, and click the "Try it out" button to upload a file from your browser.
- Import the OpenAPI spec from http://localhost:3001/docs/json into your API client of choice (e.g. Postman, Bruno, Insomnia).
- Fire a `POST` `multipart/form-data` request at http://localhost:3000/file-upload with your document.

## Testing

```sh
pnpm test

# Will re-run the tests when you edit a file.
pnpm test:watch

# Enables debug logging.
pnpm test:watch:verbose
```

I've focused the unit tests on the MP3 frame counter, and the rest is validated with "integration testing" (though there are no external integrations, strictly speaking).

## Linting and Formatting

```sh
pnpm lint

# Use this to automatically fix linter issues.
pnpm lint:fix

# Run Prettier formatter
pnpm format
```

## Build

```sh
pnpm build

# To run the built project locally, use the following:
pnpm start
```

## Potential Improvements

The fastify plugin for multipart form data support is a bit awkward. Another framework _might_ be a better fit for something like this.

If I wanted to support multiple formats in the future, I could implement a use case function that checks the file format, and selects from a list of frame counter strategies.
