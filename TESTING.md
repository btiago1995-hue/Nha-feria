# Testing

## Philosophy

100% test coverage is the key to great vibe coding. Tests let you move fast, trust your instincts, and ship with confidence — without them, vibe coding is just yolo coding. With tests, it's a superpower.

## Framework

**Vitest v4** + **@testing-library/react**

## Run Tests

```bash
npm test           # run all tests once
npm run test:watch # watch mode
```

## Test Layers

- **Unit tests** — pure functions, utilities (`src/test/*.test.js`)
- **Component tests** — React components with @testing-library/react
- **Integration tests** — multi-component flows

## Conventions

- Test files: `src/test/*.test.js` or co-located `*.test.jsx`
- Setup file: `src/test/setup.js` (imports jest-dom matchers)
- Use `describe` + `it` + `expect`
- Test what the code **does**, not that it renders
- Mock Supabase calls with `vi.mock('../lib/supabase')`
