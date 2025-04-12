/// <reference types="react" />
/// <reference types="react-dom" />

// Convert this file to a module by adding an export
export {};

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
  }
}

// Now we can augment the global scope
declare global {
  interface ImportMetaEnv {
    MODE: string;
    BASE_URL: string;
    PROD: boolean;
    DEV: boolean;
  }
}