/* eslint-env jest */

jest.mock('@sentry/react-native', () => {
  const scope = {
    setTag: jest.fn(),
    setExtra: jest.fn(),
    setLevel: jest.fn(),
  };

  return {
    __esModule: true,
    init: jest.fn(),
    captureException: jest.fn(),
    addBreadcrumb: jest.fn(),
    withScope: jest.fn(callback => callback(scope)),
    ErrorBoundary: ({children}) => children,
    wrap: component => component,
  };
});
