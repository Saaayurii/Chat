import '@testing-library/jest-dom';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Socket.IO client
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    disconnect: jest.fn(),
    connected: true,
  })),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  root: Element | null = null;
  rootMargin: string = '0px';
  thresholds: ReadonlyArray<number> = [0];
  
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
} as any;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock File and FileReader
global.File = class File {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  webkitRelativePath: string = '';
  
  constructor(bits: any, name: string, options?: any) {
    this.name = name;
    this.size = bits.length;
    this.type = options?.type || 'text/plain';
    this.lastModified = Date.now();
  }
  
  arrayBuffer(): Promise<ArrayBuffer> {
    return Promise.resolve(new ArrayBuffer(0));
  }
  
  slice(): Blob {
    return new Blob();
  }
  
  stream(): ReadableStream {
    return new ReadableStream();
  }
  
  text(): Promise<string> {
    return Promise.resolve('');
  }
} as any;

global.FileReader = class FileReader {
  result: any = null;
  readAsDataURL = jest.fn();
  readAsText = jest.fn();
  addEventListener = jest.fn();
  removeEventListener = jest.fn();
} as any;

// Mock scrollIntoView
Element.prototype.scrollIntoView = jest.fn();

// Mock window.alert
window.alert = jest.fn();