import { App, ref } from 'vue';
import { Auth0VueClient, authGuard, createAuthGuard } from '../src/index';
import { AUTH0_TOKEN } from '../src/token';
import { client } from './../src/plugin';

let watchEffectMock;

jest.mock('vue', () => {
  return {
    ...(jest.requireActual('vue') as any),
    watchEffect: function (cb) {
      watchEffectMock = cb;
      return () => {};
    }
  };
});

jest.mock('./../src/plugin', () => {
  return {
    ...(jest.requireActual('./../src/plugin') as any),
    client: ref({
      loginWithRedirect: jest.fn().mockResolvedValue({}),
      isAuthenticated: ref(false),
      isLoading: ref(false)
    })
  };
});

describe('createAuthGuard', () => {
  let appMock: App<any>;
  let auth0Mock: Partial<Auth0VueClient> = {
    loginWithRedirect: jest.fn().mockResolvedValue({}),
    isAuthenticated: ref(false),
    isLoading: ref(false)
  };

  beforeEach(() => {
    auth0Mock.isAuthenticated.value = false;
    auth0Mock.isLoading.value = false;
    appMock = {
      config: {
        globalProperties: {
          [AUTH0_TOKEN]: auth0Mock
        }
      }
    } as any as App<any>;
  });

  it('should create the guard', async () => {
    const guard = createAuthGuard(appMock);
    expect(guard).toBeDefined();
    expect(typeof guard).toBe('function');
  });

  it('should wait untill isLoading is false', async () => {
    const guard = createAuthGuard(appMock);

    auth0Mock.isLoading.value = true;

    expect.assertions(4);

    guard({
      fullPath: 'abc'
    } as any).then(() => {
      expect(true).toBeTruthy();
    });

    expect(auth0Mock.loginWithRedirect).not.toHaveBeenCalled();

    auth0Mock.isLoading.value = false;

    expect(auth0Mock.loginWithRedirect).not.toHaveBeenCalled();

    await watchEffectMock();

    expect(auth0Mock.loginWithRedirect).toHaveBeenCalled();
  });

  it('should return true when authenticated', async () => {
    const guard = createAuthGuard(appMock);

    auth0Mock.isAuthenticated.value = true;

    expect.assertions(2);

    const result = await guard({
      fullPath: 'abc'
    } as any);

    expect(result).toBe(true);
    expect(auth0Mock.loginWithRedirect).not.toHaveBeenCalled();
  });

  it('should call loginWithRedirect', async () => {
    const guard = createAuthGuard(appMock);

    expect.assertions(1);

    await guard({
      fullPath: 'abc'
    } as any);

    expect(auth0Mock.loginWithRedirect).toHaveBeenCalledWith(
      expect.objectContaining({
        appState: { target: 'abc' }
      })
    );
  });
});
describe('authGuard', () => {
  let auth0Mock;

  beforeEach(() => {
    client.value.isAuthenticated = false as any;
    client.value.isLoading = false as any;
    auth0Mock = client.value;
  });

  it('should wait untill isLoading is false', async () => {
    const guard = authGuard;

    auth0Mock.isLoading = true;

    expect.assertions(4);

    guard({
      fullPath: 'abc'
    } as any).then(() => {
      expect(true).toBeTruthy();
    });

    expect(auth0Mock.loginWithRedirect).not.toHaveBeenCalled();

    auth0Mock.isLoading = false;

    expect(auth0Mock.loginWithRedirect).not.toHaveBeenCalled();

    await watchEffectMock();

    expect(auth0Mock.loginWithRedirect).toHaveBeenCalled();
  });

  it('should return true when authenticated', async () => {
    const guard = authGuard;

    auth0Mock.isAuthenticated = true;

    expect.assertions(2);

    const result = await guard({
      fullPath: 'abc'
    } as any);

    expect(result).toBe(true);
    expect(auth0Mock.loginWithRedirect).not.toHaveBeenCalled();
  });

  it('should call loginWithRedirect', async () => {
    const guard = authGuard;

    expect.assertions(1);

    await guard({
      fullPath: 'abc'
    } as any);

    expect(auth0Mock.loginWithRedirect).toHaveBeenCalledWith(
      expect.objectContaining({
        appState: { target: 'abc' }
      })
    );
  });
});
