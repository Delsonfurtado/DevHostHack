// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, Outlet } from 'react-router-dom';
import RouteGuard from './RouteGuard.jsx';
import { AuthProvider } from './Auth.jsx';
import { api } from './api.js';
import { tFor } from './i18n.js';
import {
  queueScreening,
  pendingScreenings,
  removeSynced,
  clearOfflineData,
} from './offlineQueue.js';
import { ScreenPage } from '../client/ClientPortal.jsx';
import axe from 'axe-core';

vi.mock('./api.js', () => ({
  api: { me: vi.fn(), post: vi.fn(), get: vi.fn(), login: vi.fn() },
  setSession: vi.fn(),
  clearSession: vi.fn(),
}));

describe('portal access and screening consent', () => {
  beforeEach(() => {
    sessionStorage.setItem('niramaya.access', 'test-token');
    api.me.mockResolvedValue({
      id: 1,
      username: 'demo.worker',
      role: 'client',
      village_id: 'demo-village-1',
      force_password_change: false,
    });
  });
  it('redirects a client away from admin routes', async () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AuthProvider>
          <Routes>
            <Route
              path="/admin"
              element={
                <RouteGuard roles={['admin']}>
                  <p>Admin</p>
                </RouteGuard>
              }
            />
            <Route path="/app/home" element={<p>Client home</p>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );
    expect(await screen.findByText('Client home')).toBeInTheDocument();
  });
  it('keeps the wizard on the consent step until consent is checked', () => {
    render(
      <MemoryRouter initialEntries={['/screen']}>
        <Routes>
          <Route
            element={
              <Outlet
                context={{
                  t: (key) => tFor('en', key),
                  lang: 'en',
                  user: { village_id: 'v1' },
                  refreshQueue: vi.fn(),
                }}
              />
            }
          >
            <Route path="/screen" element={<ScreenPage />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled();
    fireEvent.click(screen.getByRole('checkbox'));
    expect(screen.getByRole('button', { name: /continue/i })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    expect(screen.getByLabelText(/pseudonymous patient id/i)).toBeInTheDocument();
  });
  it('has no basic axe violations on the consent step', async () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/screen']}>
        <Routes>
          <Route
            element={
              <Outlet
                context={{
                  t: (key) => tFor('en', key),
                  lang: 'en',
                  user: { village_id: 'v1' },
                  refreshQueue: vi.fn(),
                }}
              />
            }
          >
            <Route path="/screen" element={<ScreenPage />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    const results = await axe.run(container, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations.map((x) => `${x.id}: ${x.help}`)).toEqual([]);
  });
});

describe('offline queue and language structure', () => {
  it('stores, lists and removes a queued screening idempotently by key', async () => {
    await clearOfflineData();
    const row = { client_key: 'test-client-0001', patient_id: 'v1-0001' };
    await queueScreening(row);
    await queueScreening(row);
    expect(await pendingScreenings()).toEqual([row]);
    await removeSynced([row.client_key]);
    expect(await pendingScreenings()).toEqual([]);
  });
  it('has English, Hindi, and Kannada labels with a fallback', () => {
    expect(tFor('en', 'home')).toBe('Home');
    expect(tFor('hi', 'home')).toBeTruthy();
    expect(tFor('kn', 'home')).toBeTruthy();
    expect(tFor('hi', 'missing')).toBe('missing');
  });
});
