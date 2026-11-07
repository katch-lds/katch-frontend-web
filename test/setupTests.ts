import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'node:util';

// O jsdom não tem TextEncoder/TextDecoder, que o react-router usa ao carregar.
Object.assign(globalThis, { TextEncoder, TextDecoder });
