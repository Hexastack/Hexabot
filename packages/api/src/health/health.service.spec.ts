/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ChannelService } from '@/channel/channel.service';
import { SourceService } from '@/channel/services/source.service';
import { config } from '@/config';
import { MailerService } from '@/mailer';

import { HealthService } from './health.service';

describe('HealthService', () => {
  const channelServiceMock: Pick<ChannelService, 'getAll'> = {
    getAll: jest.fn(),
  };
  const sourceServiceMock: Pick<SourceService, 'findAll'> = {
    findAll: jest.fn(),
  };
  const mailerServiceMock: Pick<MailerService, 'verifyAllTransporters'> = {
    verifyAllTransporters: jest.fn(),
  };
  const originalEmailsEnabled = config.emails.isEnabled;

  let healthService: HealthService;

  const buildChannelHandler = (
    name: string,
    getIntegrationHealth?: jest.Mock,
  ) => ({
    getName: jest.fn().mockReturnValue(name),
    ...(getIntegrationHealth ? { getIntegrationHealth } : {}),
  });
  const findIntegration = (
    result: Awaited<ReturnType<HealthService['getIntegrationHealth']>>,
    id: string,
  ) => result.integrations.find((integration) => integration.id === id);

  beforeEach(() => {
    jest.clearAllMocks();

    healthService = new HealthService(
      channelServiceMock as unknown as ChannelService,
      sourceServiceMock as unknown as SourceService,
      mailerServiceMock as unknown as MailerService,
    );
  });

  afterEach(() => {
    config.emails.isEnabled = originalEmailsEnabled;
    jest.useRealTimers();
  });

  it('aggregates channel health from active, inactive, and missing sources', async () => {
    config.emails.isEnabled = false;
    (channelServiceMock.getAll as jest.Mock).mockReturnValue([
      buildChannelHandler('console'),
      buildChannelHandler('web'),
      buildChannelHandler('whatsapp'),
      buildChannelHandler('slack'),
    ]);
    (sourceServiceMock.findAll as jest.Mock).mockResolvedValue([
      { id: 'source-web', channel: 'web', state: true },
      { id: 'source-whatsapp', channel: 'whatsapp', state: false },
    ]);

    const result = await healthService.getIntegrationHealth();

    expect(result.checkedAt).toEqual(expect.any(String));
    expect(findIntegration(result, 'channel:console')).toBeUndefined();
    expect(findIntegration(result, 'channel:web')).toMatchObject({
      kind: 'channel',
      name: 'Web',
      status: 'healthy',
      reason: 'channel.active_sources',
      details: {
        activeSources: 1,
        inactiveSources: 0,
        totalSources: 1,
      },
    });
    expect(findIntegration(result, 'channel:whatsapp')).toMatchObject({
      status: 'disabled',
      reason: 'channel.disabled_sources',
      details: {
        activeSources: 0,
        inactiveSources: 1,
        totalSources: 1,
      },
    });
    expect(findIntegration(result, 'channel:slack')).toMatchObject({
      status: 'warning',
      reason: 'channel.missing_source',
      details: {
        activeSources: 0,
        inactiveSources: 0,
        totalSources: 0,
      },
    });
    expect(findIntegration(result, 'service:smtp')).toMatchObject({
      status: 'disabled',
      reason: 'smtp.disabled',
    });
    expect(mailerServiceMock.verifyAllTransporters).not.toHaveBeenCalled();
  });

  it('lets channel handlers override their default health result', async () => {
    config.emails.isEnabled = false;
    const getIntegrationHealth = jest.fn().mockResolvedValue({
      status: 'unhealthy',
      reason: 'channel.custom_check_failed',
      message: 'Custom channel health check failed.',
      details: { code: 'invalid-token' },
    });

    (channelServiceMock.getAll as jest.Mock).mockReturnValue([
      buildChannelHandler('web', getIntegrationHealth),
    ]);
    (sourceServiceMock.findAll as jest.Mock).mockResolvedValue([
      { id: 'source-web', channel: 'web', state: true },
    ]);

    const result = await healthService.getIntegrationHealth();
    const webHealth = findIntegration(result, 'channel:web');

    expect(getIntegrationHealth).toHaveBeenCalledWith(
      expect.objectContaining({
        sources: [expect.objectContaining({ id: 'source-web' })],
        defaultHealth: expect.objectContaining({
          id: 'channel:web',
          status: 'healthy',
        }),
      }),
    );
    expect(webHealth).toMatchObject({
      id: 'channel:web',
      kind: 'channel',
      status: 'unhealthy',
      reason: 'channel.custom_check_failed',
      details: { code: 'invalid-token' },
    });
  });

  it('marks SMTP healthy when transporter verification succeeds', async () => {
    config.emails.isEnabled = true;
    (channelServiceMock.getAll as jest.Mock).mockReturnValue([]);
    (sourceServiceMock.findAll as jest.Mock).mockResolvedValue([]);
    (mailerServiceMock.verifyAllTransporters as jest.Mock).mockResolvedValue(
      true,
    );

    const result = await healthService.getIntegrationHealth();

    expect(findIntegration(result, 'service:smtp')).toMatchObject({
      status: 'healthy',
      reason: 'smtp.verified',
    });
    expect(mailerServiceMock.verifyAllTransporters).toHaveBeenCalledTimes(1);
  });

  it('marks SMTP unhealthy when transporter verification returns false', async () => {
    config.emails.isEnabled = true;
    (channelServiceMock.getAll as jest.Mock).mockReturnValue([]);
    (sourceServiceMock.findAll as jest.Mock).mockResolvedValue([]);
    (mailerServiceMock.verifyAllTransporters as jest.Mock).mockResolvedValue(
      false,
    );

    const result = await healthService.getIntegrationHealth();

    expect(findIntegration(result, 'service:smtp')).toMatchObject({
      status: 'unhealthy',
      reason: 'smtp.verify_failed',
    });
  });

  it('marks SMTP unhealthy when transporter verification throws', async () => {
    config.emails.isEnabled = true;
    (channelServiceMock.getAll as jest.Mock).mockReturnValue([]);
    (sourceServiceMock.findAll as jest.Mock).mockResolvedValue([]);
    (mailerServiceMock.verifyAllTransporters as jest.Mock).mockRejectedValue(
      new Error('auth failed with secret'),
    );

    const result = await healthService.getIntegrationHealth();

    expect(findIntegration(result, 'service:smtp')).toMatchObject({
      status: 'unhealthy',
      reason: 'smtp.verify_failed',
      message: 'SMTP transporter verification failed.',
    });
  });

  it('marks SMTP unhealthy when transporter verification times out', async () => {
    jest.useFakeTimers();
    config.emails.isEnabled = true;
    (channelServiceMock.getAll as jest.Mock).mockReturnValue([]);
    (sourceServiceMock.findAll as jest.Mock).mockResolvedValue([]);
    (mailerServiceMock.verifyAllTransporters as jest.Mock).mockReturnValue(
      new Promise(() => undefined),
    );

    const resultPromise = healthService.getIntegrationHealth();

    await jest.advanceTimersByTimeAsync(3000);

    const result = await resultPromise;

    expect(findIntegration(result, 'service:smtp')).toMatchObject({
      status: 'unhealthy',
      reason: 'smtp.timeout',
      message: 'SMTP transporter verification timed out.',
    });
  });
});
