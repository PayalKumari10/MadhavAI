/**
 * Unit tests for Offline Mode Indicator Component
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { OfflineModeIndicator } from '../OfflineModeIndicator';
import { connectivityDetector } from '../../services/sync/ConnectivityDetector';
import { syncManager } from '../../services/sync/SyncManager';

// Mock dependencies
jest.mock('../../services/sync/ConnectivityDetector');
jest.mock('../../services/sync/SyncManager');

describe('OfflineModeIndicator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (connectivityDetector.getStatus as jest.Mock).mockReturnValue({
      isOnline: true,
      lastChecked: new Date(),
    });
    (connectivityDetector.addListener as jest.Mock).mockReturnValue(() => {});
    (syncManager.isSyncInProgress as jest.Mock).mockReturnValue(false);
    (syncManager.getPendingSyncCount as jest.Mock).mockResolvedValue(0);
  });

  it('should render online status', () => {
    const { getByText } = render(<OfflineModeIndicator />);

    expect(getByText('Online')).toBeTruthy();
  });

  it('should render offline status', () => {
    (connectivityDetector.getStatus as jest.Mock).mockReturnValue({
      isOnline: false,
      lastChecked: new Date(),
    });

    const { getByText } = render(<OfflineModeIndicator />);

    expect(getByText('Offline')).toBeTruthy();
  });

  it('should render compact mode', () => {
    const { queryByText } = render(<OfflineModeIndicator compact={true} />);

    // In compact mode, status text should not be visible
    expect(queryByText('Online')).toBeNull();
  });

  it('should show sync status when enabled', () => {
    const { getByText } = render(<OfflineModeIndicator showSyncStatus={true} />);

    expect(getByText(/Last sync:/)).toBeTruthy();
  });

  it('should not show sync status when disabled', () => {
    const { queryByText } = render(<OfflineModeIndicator showSyncStatus={false} />);

    expect(queryByText(/Last sync:/)).toBeNull();
  });

  it('should show syncing indicator when sync is in progress', () => {
    (syncManager.isSyncInProgress as jest.Mock).mockReturnValue(true);

    const { getByText } = render(<OfflineModeIndicator />);

    expect(getByText('Syncing...')).toBeTruthy();
  });
});
